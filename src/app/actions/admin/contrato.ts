"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { createSignedUpload, publicUrlFor, removeUploadedFile } from "@/lib/uploads/server";
import { firmaRepresentantePath } from "@/lib/uploads/config";
import { HACIENDA_CONTENT_KEYS } from "@/lib/contract-items";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." as string };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin")
    return { error: "Sin permisos" as string };
  return { error: null };
}

export async function saveClausula(
  key: string,
  content: string,
): Promise<{ error?: string }> {
  const { error: authErr } = await verifyAdmin();
  if (authErr) return { error: authErr };

  if (!key.match(/^contrato_clausula_(\d+)$/)) return { error: "Clave inválida" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_content")
    .upsert({ key, content }, { onConflict: "key" });
  if (error) return { error: error.message };

  revalidatePath("/admin/contrato");
  return {};
}

export async function requestFirmaUpload(meta: {
  fileName: string;
  contentType: string;
  size: number;
}): Promise<{ signedUrl?: string; token?: string; path?: string; error?: string }> {
  const { error: authErr } = await verifyAdmin();
  if (authErr) return { error: authErr };

  const path = firmaRepresentantePath(meta.fileName);
  const { upload, error } = await createSignedUpload("firma-representante", {
    contentType: meta.contentType,
    size: meta.size,
    path,
  });
  if (error || !upload) return { error };
  return { signedUrl: upload.signedUrl, token: upload.token, path: upload.path };
}

export async function confirmFirmaUpload(
  path: string,
): Promise<{ url?: string; error?: string }> {
  const { error: authErr } = await verifyAdmin();
  if (authErr) return { error: authErr };

  const admin = createAdminClient();
  const url = publicUrlFor("firma-representante", path);

  const { data: existing } = await admin
    .from("site_content")
    .select("content")
    .eq("key", "firma_representante")
    .maybeSingle();

  const { error } = await admin
    .from("site_content")
    .upsert({ key: "firma_representante", content: url }, { onConflict: "key" });

  if (error) {
    await removeUploadedFile("firma-representante", path);
    return { error: error.message };
  }

  if (existing?.content) {
    try {
      const parsed = new URL(existing.content);
      const marker = "/object/public/avatars/";
      const idx = parsed.pathname.indexOf(marker);
      if (idx !== -1) {
        const oldPath = decodeURIComponent(parsed.pathname.slice(idx + marker.length));
        if (oldPath.startsWith("firmas/")) {
          void admin.storage.from("avatars").remove([oldPath]);
        }
      }
    } catch { /* URL no parseable */ }
  }

  revalidatePath("/admin/contrato");
  return { url };
}

export async function saveHaciendaField(
  key: string,
  value: string,
): Promise<{ error?: string }> {
  const { error: authErr } = await verifyAdmin();
  if (authErr) return { error: authErr };

  const validKeys = Object.values(HACIENDA_CONTENT_KEYS);
  if (!validKeys.includes(key)) return { error: "Clave inválida" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_content")
    .upsert({ key, content: value }, { onConflict: "key" });
  if (error) return { error: error.message };

  revalidatePath("/admin/contrato");
  return {};
}

export async function saveExtraClausula(
  key: string,
  content: string,
): Promise<{ error?: string }> {
  const { error: authErr } = await verifyAdmin();
  if (authErr) return { error: authErr };

  if (!key.match(/^contrato_clausula_extra_(\d+)$/)) return { error: "Clave inválida" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_content")
    .upsert({ key, content }, { onConflict: "key" });
  if (error) return { error: error.message };

  revalidatePath("/admin/contrato");
  return {};
}

export async function deleteExtraClausula(
  key: string,
): Promise<{ error?: string }> {
  const { error: authErr } = await verifyAdmin();
  if (authErr) return { error: authErr };

  if (!key.match(/^contrato_clausula_extra_(\d+)$/)) return { error: "Clave inválida" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_content")
    .delete()
    .eq("key", key);
  if (error) return { error: error.message };

  revalidatePath("/admin/contrato");
  return {};
}

export async function deleteFirma(): Promise<{ error?: string }> {
  const { error: authErr } = await verifyAdmin();
  if (authErr) return { error: authErr };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("site_content")
    .select("content")
    .eq("key", "firma_representante")
    .maybeSingle();

  const { error } = await admin
    .from("site_content")
    .upsert({ key: "firma_representante", content: null }, { onConflict: "key" });
  if (error) return { error: error.message };

  if (existing?.content) {
    try {
      const parsed = new URL(existing.content);
      const marker = "/object/public/avatars/";
      const idx = parsed.pathname.indexOf(marker);
      if (idx !== -1) {
        const oldPath = decodeURIComponent(parsed.pathname.slice(idx + marker.length));
        if (oldPath.startsWith("firmas/")) {
          void admin.storage.from("avatars").remove([oldPath]);
        }
      }
    } catch { /* URL no parseable */ }
  }

  revalidatePath("/admin/contrato");
  return {};
}
