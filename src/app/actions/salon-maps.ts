"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { createSignedUpload, publicUrlFor, removeUploadedFile } from "@/lib/uploads/server";
import { salonMapPath } from "@/lib/uploads/config";
import { SALON_MAP_CAPACITIES } from "@/lib/salon-map-capacities";

async function verifyPlanner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." as string, user: null };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "wedding_planner"].includes(profile.role))
    return { error: "Sin permisos" as string, user: null };
  return { error: null, user };
}

function revalidateSalonMaps() {
  revalidatePath("/portal/planner/salon-mapas");
  revalidatePath("/portal/invitados");
}

const requestSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().positive(),
});

export async function requestSalonMapUpload(
  meta: z.infer<typeof requestSchema>,
): Promise<{ signedUrl?: string; token?: string; path?: string; error?: string }> {
  const { error: authErr } = await verifyPlanner();
  if (authErr) return { error: authErr };

  const parsed = requestSchema.safeParse(meta);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const path = salonMapPath(parsed.data.fileName);
  const { upload, error } = await createSignedUpload("salon-map", {
    contentType: parsed.data.contentType,
    size: parsed.data.size,
    path,
  });
  if (error || !upload) return { error };

  return { signedUrl: upload.signedUrl, token: upload.token, path: upload.path };
}

const confirmSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  capacity: z.enum(SALON_MAP_CAPACITIES),
  path: z.string().min(1),
});

export type SalonMapRow = {
  id: string;
  name: string;
  image_url: string;
  min_guests: number;
  max_guests: number;
  is_active: boolean;
};

export async function confirmSalonMapUpload(
  meta: z.infer<typeof confirmSchema>,
): Promise<{ map?: SalonMapRow; error?: string }> {
  const { error: authErr, user } = await verifyPlanner();
  if (authErr || !user) return { error: authErr ?? "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const parsed = confirmSchema.safeParse(meta);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const [minGuests, maxGuests] =
    parsed.data.capacity === "120-150"
      ? [120, 150]
      : [Number(parsed.data.capacity), Number(parsed.data.capacity)];

  const admin = createAdminClient();
  const url = publicUrlFor("salon-map", parsed.data.path);

  const { data: inserted, error } = await admin.from("salon_maps").insert({
    name: parsed.data.name.trim(),
    image_url: url,
    min_guests: minGuests,
    max_guests: maxGuests,
    created_by: user.id,
  }).select("id, name, image_url, min_guests, max_guests, is_active").single();
  if (error || !inserted) {
    await removeUploadedFile("salon-map", parsed.data.path);
    return { error: error?.message ?? "Error al guardar el mapa" };
  }

  revalidateSalonMaps();
  return { map: inserted };
}

export async function toggleSalonMapActivo(id: string, isActive: boolean): Promise<{ error?: string }> {
  const { error: authErr } = await verifyPlanner();
  if (authErr) return { error: authErr };

  const admin = createAdminClient();
  const { error } = await admin.from("salon_maps").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };

  revalidateSalonMaps();
  return {};
}

function storagePathFromPublicUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const marker = "/object/public/gallery/";
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

export async function deleteSalonMap(id: string): Promise<{ error?: string }> {
  const { error: authErr } = await verifyPlanner();
  if (authErr) return { error: authErr };

  const admin = createAdminClient();
  const { data: map } = await admin.from("salon_maps").select("image_url").eq("id", id).single();
  if (!map) return { error: "Mapa no encontrado" };

  const { error } = await admin.from("salon_maps").delete().eq("id", id);
  if (error) return { error: error.message };

  const storagePath = storagePathFromPublicUrl(map.image_url);
  if (storagePath) await removeUploadedFile("salon-map", storagePath);

  revalidateSalonMaps();
  return {};
}
