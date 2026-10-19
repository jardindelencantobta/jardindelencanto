"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  createSignedUpload,
  createSignedDownload,
  removeUploadedFile,
  getStoredFileSize,
} from "@/lib/uploads/server";
import { guestListPath } from "@/lib/uploads/config";

async function getOwnBooking(bookingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." as string, user: null };

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings").select("id, client_id").eq("id", bookingId).single();
  if (!booking || booking.client_id !== user.id) return { error: "Sin permisos" as string, user: null };
  return { error: null, user };
}

function revalidateInvitados(clientId: string | null | undefined) {
  revalidatePath("/portal/invitados");
  if (clientId) {
    revalidatePath(`/portal/planner/clientes/${clientId}/invitados`);
    revalidatePath(`/admin/clientes/${clientId}/invitados`);
  }
}

const requestSchema = z.object({
  bookingId: z.string().uuid(),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().positive(),
});

export async function requestGuestListUpload(
  meta: z.infer<typeof requestSchema>,
): Promise<{ signedUrl?: string; token?: string; path?: string; error?: string }> {
  const parsed = requestSchema.safeParse(meta);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error: authErr } = await getOwnBooking(parsed.data.bookingId);
  if (authErr) return { error: authErr };

  const path = guestListPath(parsed.data.bookingId, parsed.data.fileName);
  const { upload, error } = await createSignedUpload("guest-list", {
    contentType: parsed.data.contentType,
    size: parsed.data.size,
    path,
  });
  if (error || !upload) return { error };

  return { signedUrl: upload.signedUrl, token: upload.token, path: upload.path };
}

const confirmSchema = z.object({
  bookingId: z.string().uuid(),
  path: z.string().min(1),
});

export async function confirmGuestListUpload(
  meta: z.infer<typeof confirmSchema>,
): Promise<{ error?: string }> {
  const parsed = confirmSchema.safeParse(meta);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error: authErr, user } = await getOwnBooking(parsed.data.bookingId);
  if (authErr || !user) return { error: authErr ?? "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const admin = createAdminClient();
  const { error } = await admin.from("guest_tables").insert({
    booking_id: parsed.data.bookingId,
    file_url: parsed.data.path,
  });
  if (error) {
    await removeUploadedFile("guest-list", parsed.data.path);
    return { error: error.message };
  }

  const { data: staffProfiles } = await admin
    .from("profiles").select("id").in("role", ["admin", "wedding_planner"]);
  if (staffProfiles?.length) {
    const { data: clientProfile } = await admin
      .from("profiles").select("full_name, email").eq("id", user.id).single();
    const name = clientProfile?.full_name ?? clientProfile?.email ?? "Un cliente";
    await admin.from("notifications").insert(
      staffProfiles.map((s) => ({
        user_id: s.id,
        title: "Nueva lista de invitados",
        body: `${name} subió un archivo de distribución de invitados por mesa.`,
        type: "guest_list_uploaded",
      })),
    );
  }

  revalidateInvitados(user.id);
  return {};
}

export async function deleteGuestList(id: string, bookingId: string): Promise<{ error?: string }> {
  const { error: authErr, user } = await getOwnBooking(bookingId);
  if (authErr || !user) return { error: authErr ?? "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("guest_tables").select("file_url, booking_id").eq("id", id).single();
  if (!row || row.booking_id !== bookingId) return { error: "Archivo no encontrado" };

  const { error } = await admin.from("guest_tables").delete().eq("id", id);
  if (error) return { error: error.message };

  if (row.file_url) await removeUploadedFile("guest-list", row.file_url);

  revalidateInvitados(user.id);
  return {};
}

export type GuestListConSize = {
  id: string;
  file_url: string | null;
  uploaded_at: string;
  size: number | null;
};

export async function listGuestListsConTamano(
  rows: { id: string; file_url: string | null; uploaded_at: string }[],
): Promise<GuestListConSize[]> {
  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      file_url: r.file_url,
      uploaded_at: r.uploaded_at,
      size: r.file_url ? await getStoredFileSize("guest-list", r.file_url) : null,
    })),
  );
}

export async function getGuestListDownloadUrl(id: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("guest_tables")
    .select("file_url, bookings(client_id)")
    .eq("id", id)
    .single();
  if (!row || !row.file_url) return { error: "Archivo no encontrado" };

  const isStaff = profile && ["admin", "wedding_planner"].includes(profile.role);
  const isOwner = (row.bookings as { client_id: string } | null)?.client_id === user.id;
  if (!isStaff && !isOwner) return { error: "Sin permisos" };

  return createSignedDownload("guest-list", row.file_url);
}
