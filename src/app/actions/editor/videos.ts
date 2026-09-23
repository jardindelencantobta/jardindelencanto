"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { hostingUploadUrl, signHostingToken } from "@/lib/uploads/hosting-token";
import { removeUploadedFile } from "@/lib/uploads/server";

const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "";

async function verifyEditor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" as string };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role as string))
    return { error: "Sin permisos" as string };
  return { error: null };
}

function revalidate() {
  revalidatePath("/editor/videos");
  revalidatePath("/");
  revalidatePath("/bodas");
  revalidatePath("/quince-anos");
  revalidatePath("/eventos-empresariales");
  revalidatePath("/revelacion-de-genero");
}

async function deactivatePage(
  admin: ReturnType<typeof createAdminClient>,
  eventType: string | null,
) {
  if (eventType === null || eventType === "") {
    await admin.from("hero_videos").update({ is_active: false }).is("event_type", null);
  } else {
    await admin.from("hero_videos").update({ is_active: false }).eq("event_type", eventType);
  }
}

// ─── Upload directo a Colombia Hosting (3 pasos — el archivo nunca toca Vercel) ─

export type UploadedVideo = {
  id: string; url: string; title: string | null;
  event_type: string | null; is_active: boolean;
};

/**
 * Paso 1: valida permisos, tipo y tamaño. Devuelve las credenciales necesarias
 * para que el browser suba el archivo directamente a Colombia Hosting.
 */
export async function requestVideoUpload(meta: {
  fileName: string;
  contentType: string;
  size: number;
  eventType: string;
}): Promise<{ uploadUrl?: string; token?: string; folder?: string; error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };

  const allowed = ["video/mp4", "video/webm", "video/quicktime"];
  if (!allowed.includes(meta.contentType))
    return { error: `Formato no permitido: ${meta.contentType}` };
  if (meta.size <= 0)
    return { error: "El archivo está vacío" };
  if (meta.size > 500 * 1024 * 1024)
    return { error: `El video supera el límite de 500 MB (${(meta.size / 1024 / 1024).toFixed(0)} MB)` };

  const folder = "videos";
  const uploadUrl = hostingUploadUrl();
  const token = signHostingToken(folder);
  if (!token)
    return { error: "Servidor de archivos no configurado (HOSTING_UPLOAD_TOKEN)" };

  return { uploadUrl, token, folder };
}

/**
 * Paso 3: recibe la URL pública que devolvió Colombia Hosting e inserta en BD.
 */
export async function confirmVideoUpload(meta: {
  url: string;
  eventType: string;
  title: string;
  isActive: boolean;
}): Promise<{ video?: UploadedVideo; error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };

  const admin = createAdminClient();

  if (meta.isActive) {
    await deactivatePage(admin, meta.eventType || null);
  }

  const { data: vid, error: insErr } = await admin
    .from("hero_videos")
    .insert({
      url:        meta.url,
      title:      meta.title.trim() || null,
      event_type: meta.eventType || null,
      is_active:  meta.isActive,
      sort_order: 0,
    })
    .select("id, url, title, event_type, is_active")
    .single();

  if (insErr) return { error: `Error al guardar: ${insErr.message}` };

  revalidate();
  return { video: vid as UploadedVideo };
}

// ─── Acciones de estado y borrado ─────────────────────────────────────────────

export async function activateVideo(id: string, eventType: string | null): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  const admin = createAdminClient();
  await deactivatePage(admin, eventType);
  const { error } = await admin.from("hero_videos").update({ is_active: true }).eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function deactivateVideo(id: string): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  const admin = createAdminClient();
  const { error } = await admin.from("hero_videos").update({ is_active: false }).eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function deleteVideo(id: string, url: string): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  const admin = createAdminClient();

  // Videos antiguos en Supabase Storage: intentar borrar el archivo
  try {
    const parsed = new URL(url);
    if (parsed.hostname === SUPABASE_HOST) {
      const marker = "/object/public/videos/";
      const idx    = parsed.pathname.indexOf(marker);
      if (idx !== -1) {
        const storagePath = decodeURIComponent(parsed.pathname.slice(idx + marker.length));
        await removeUploadedFile("hero-video", storagePath);
      }
    }
    // Videos en Colombia Hosting no tienen endpoint de borrado — solo se elimina el registro
  } catch { /* URL no parseable */ }

  const { error } = await admin.from("hero_videos").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}
