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

function revalidateAll() {
  revalidatePath("/editor/galeria");
  revalidatePath("/");
  revalidatePath("/bodas");
  revalidatePath("/quince-anos");
  revalidatePath("/eventos-empresariales");
  revalidatePath("/revelacion-de-genero");
}

// ─── Upload directo a Colombia Hosting (3 pasos — el archivo nunca toca Vercel) ─

export type UploadedImage = {
  id: string; url: string; title: string | null;
  category: string | null; sort_order: number; is_published: boolean;
};

/**
 * Paso 1: valida permisos, tipo y tamaño. Devuelve las credenciales necesarias
 * para que el browser suba el archivo directamente a Colombia Hosting.
 */
export async function requestGaleriaUpload(meta: {
  fileName: string;
  contentType: string;
  size: number;
  category: string;
}): Promise<{ uploadUrl?: string; token?: string; folder?: string; error?: string }> {
  try {
    console.log("[requestGaleriaUpload] inicio:", meta);

    const { error: authErr } = await verifyEditor();
    if (authErr) {
      console.warn("[requestGaleriaUpload] auth:", authErr);
      return { error: authErr };
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(meta.contentType))
      return { error: `Formato no permitido: ${meta.contentType}` };
    if (meta.size <= 0)
      return { error: "El archivo está vacío" };
    if (meta.size > 10 * 1024 * 1024)
      return { error: `El archivo supera el límite de 10 MB (${(meta.size / 1024 / 1024).toFixed(1)} MB)` };

    const validCategories = ["boda", "quince", "empresarial", "revelacion", "general"];
    const category = validCategories.includes(meta.category) ? meta.category : "general";
    const folder = `galeria/${category}`;

    const uploadUrl = hostingUploadUrl();
    const token = signHostingToken(folder);
    if (!token) {
      console.error("[requestGaleriaUpload] falta HOSTING_UPLOAD_TOKEN");
      return { error: "Servidor de archivos no configurado (HOSTING_UPLOAD_TOKEN)" };
    }

    console.log("[requestGaleriaUpload] ok:", { uploadUrl, folder });
    return { uploadUrl, token, folder };
  } catch (err) {
    console.error("[requestGaleriaUpload] excepción:", err);
    return { error: `Error inesperado al preparar la subida: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/**
 * Paso 3: recibe la URL pública que devolvió Colombia Hosting e inserta en BD.
 * Si falla el INSERT, la imagen queda huérfana en el servidor (sin delete API).
 */
export async function confirmGaleriaUpload(meta: {
  url: string;
  category: string;
  title: string;
}): Promise<{ image?: UploadedImage; error?: string }> {
  try {
    const { error: authErr } = await verifyEditor();
    if (authErr) {
      console.warn("[confirmGaleriaUpload] auth:", authErr);
      return { error: authErr };
    }

    // Forzar HTTPS — salvaguarda server-side antes de persistir en BD
    const safeUrl = meta.url.replace(/^http:\/\//i, "https://");
    console.log("[confirmGaleriaUpload] URL recibida:", meta.url, "→ guardada:", safeUrl);
    if (!safeUrl.startsWith("https://")) {
      return { error: `URL inválida: debe comenzar con https:// (recibida: ${meta.url})` };
    }

    const admin = createAdminClient();

    const { data: img, error: insErr } = await admin
      .from("gallery_images")
      .insert({
        url:          safeUrl,
        title:        meta.title.trim() || null,
        category:     meta.category,
        sort_order:   0,
        is_published: false,
      })
      .select("id, url, title, category, sort_order, is_published")
      .single();

    if (insErr) {
      console.error("[confirmGaleriaUpload] insert falló:", insErr);
      return { error: `Error al guardar: ${insErr.message}` };
    }

    revalidateAll();
    return { image: img as UploadedImage };
  } catch (err) {
    console.error("[confirmGaleriaUpload] excepción:", err);
    return { error: `Error inesperado al guardar la imagen: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ─── Acciones de edición / borrado / reorden ──────────────────────────────────

export async function updateGaleriaImage(
  id: string,
  data: { title?: string; category?: string; is_published?: boolean; sort_order?: number },
): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  const admin = createAdminClient();
  const { error } = await admin.from("gallery_images").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidateAll();
  return {};
}

export async function deleteGaleriaImage(id: string, url: string): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  const admin = createAdminClient();

  // Imágenes antiguas en Supabase Storage: intentar borrar el archivo
  try {
    const parsed = new URL(url);
    if (parsed.hostname === SUPABASE_HOST) {
      const marker = "/object/public/gallery/";
      const idx    = parsed.pathname.indexOf(marker);
      if (idx !== -1) {
        const storagePath = decodeURIComponent(parsed.pathname.slice(idx + marker.length));
        await removeUploadedFile("gallery-image", storagePath);
      }
    }
    // Imágenes en Colombia Hosting no tienen endpoint de borrado — solo se elimina el registro
  } catch { /* URL no parseable */ }

  const { error } = await admin.from("gallery_images").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateAll();
  return {};
}

export async function reorderGaleriaImages(
  items: { id: string; sort_order: number }[],
): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  const admin = createAdminClient();
  await Promise.all(
    items.map((item) =>
      admin.from("gallery_images").update({ sort_order: item.sort_order }).eq("id", item.id),
    ),
  );
  revalidateAll();
  return {};
}
