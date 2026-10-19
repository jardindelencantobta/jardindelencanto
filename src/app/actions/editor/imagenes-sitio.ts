"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { hostingUploadUrl, signHostingToken } from "@/lib/uploads/hosting-token";
import { SITE_IMAGE_FOLDER, SITE_IMAGE_KEYS, type SiteImageKey } from "@/lib/uploads/config";
import { CONTENT } from "@/config/brand";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

async function verifyEditor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." as string };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role as string))
    return { error: "Sin permisos" as string };
  return { error: null };
}

function revalidate() {
  revalidatePath("/editor/imagenes-sitio");
  revalidatePath("/");
  revalidatePath("/bodas");
  revalidatePath("/quince-anos");
  revalidatePath("/eventos-empresariales");
  revalidatePath("/revelacion-de-genero");
}

/**
 * Paso 1: verifica permisos y devuelve un permiso de subida firmado para la
 * carpeta del hosting que corresponde a la imagen. El archivo va directo del
 * navegador al hosting (no pasa por Vercel).
 */
export async function requestSiteImageUpload(meta: {
  contentType: string;
  size: number;
  key: SiteImageKey;
}): Promise<{ uploadUrl?: string; token?: string; folder?: string; error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  if (!SITE_IMAGE_KEYS.includes(meta.key)) return { error: "Clave de imagen inválida" };
  if (!ALLOWED_MIME.includes(meta.contentType)) return { error: "Solo se aceptan JPG, PNG y WebP" };
  if (meta.size <= 0) return { error: "El archivo está vacío" };
  if (meta.size > MAX_BYTES) return { error: "El archivo supera 10 MB" };

  const folder = SITE_IMAGE_FOLDER[meta.key];
  const token = signHostingToken(folder);
  if (!token) return { error: "Servidor de archivos no configurado (HOSTING_UPLOAD_TOKEN)" };

  return { uploadUrl: hostingUploadUrl(), token, folder };
}

/** Paso 3: guarda en site_content la URL que devolvió el hosting. */
export async function confirmSiteImageUpload(meta: {
  key: SiteImageKey;
  url: string;
}): Promise<{ url?: string; error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  if (!SITE_IMAGE_KEYS.includes(meta.key)) return { error: "Clave de imagen inválida" };

  // Solo se aceptan archivos del hosting de Jardín, en la carpeta de esta imagen.
  const url = meta.url.replace(/^http:\/\//i, "https://");
  if (!url.startsWith(`${CONTENT.url}/${SITE_IMAGE_FOLDER[meta.key]}/`)) {
    return { error: "URL de imagen no válida" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_content")
    .upsert({ key: meta.key, content: url }, { onConflict: "key" });
  if (error) return { error: `Error al guardar: ${error.message}` };

  revalidate();
  return { url };
}

/** Quita la imagen del sitio (vuelve a la imagen por defecto). El archivo queda en el hosting. */
export async function deleteSiteImage(key: SiteImageKey): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  if (!SITE_IMAGE_KEYS.includes(key)) return { error: "Clave de imagen inválida" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_content")
    .upsert({ key, content: null }, { onConflict: "key" });
  if (error) return { error: error.message };

  revalidate();
  return {};
}
