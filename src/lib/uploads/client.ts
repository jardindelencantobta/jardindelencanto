"use client";

import { createClient } from "@/lib/supabase/client";

export async function uploadFileToSignedUrl(
  bucket: string,
  path: string,
  token: string,
  file: File,
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, file, { contentType: file.type });

  if (error) return { error: `Error al subir el archivo: ${error.message}` };
  return {};
}

/**
 * Sube un archivo directamente desde el navegador al endpoint PHP de Colombia Hosting.
 * El archivo nunca pasa por Vercel — evita el límite de 4.5 MB del body.
 * El token y la URL vienen de la Server Action (autenticada) que los generó.
 */
export async function uploadToHosting(
  uploadUrl: string,
  token: string,
  folder: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  console.log("[uploadToHosting] POST", uploadUrl, {
    folder, name: file.name, type: file.type, size: file.size,
  });

  try {
    // El permiso firmado va en X-Upload-Token (el upload.php lo acepta en CORS).
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "X-Upload-Token": token },
      body: form,
    });
    const text = await res.text();
    console.log("[uploadToHosting] respuesta PHP:", {
      status: res.status,
      contentType: res.headers.get("content-type"),
      body: text.slice(0, 500),
    });

    let data: { success: boolean; url?: string; error?: string };
    try {
      data = JSON.parse(text);
    } catch {
      return {
        error: `El servidor de archivos no devolvió JSON (HTTP ${res.status}): ${text.slice(0, 200)}`,
      };
    }

    if (!res.ok || !data.success) {
      return { error: data.error ?? `Error HTTP ${res.status} del servidor de archivos` };
    }
    // Forzar HTTPS — el PHP debería devolverlo así, pero como salvaguarda:
    const url = data.url?.replace(/^http:\/\//i, "https://");
    console.log("[uploadToHosting] URL final guardada:", url);
    return { url };
  } catch (err) {
    console.error("[uploadToHosting] fetch falló (red/CORS):", err);
    return { error: err instanceof Error ? err.message : "Error de red al subir archivo" };
  }
}
