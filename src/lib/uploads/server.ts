import { createAdminClient } from "@/lib/supabase/admin";
import { UPLOAD_KINDS, type UploadKind } from "./config";
import { hostingUploadUrl, signHostingToken } from "./hosting-token";

// ─── Colombia Hosting ─────────────────────────────────────────────────────────

/**
 * Sube un buffer generado en el servidor (p.ej. PDF de contrato) directamente
 * al endpoint PHP de Colombia Hosting. No pasa por el body de Vercel porque
 * el archivo ya existe en memoria del servidor.
 */
export async function uploadToHosting(
  fileBuffer: ArrayBuffer,
  folder: string,
  fileName: string,
  mimeType: string,
): Promise<{ url?: string; error?: string }> {
  const uploadUrl = hostingUploadUrl();
  const token = signHostingToken(folder);
  if (!token) {
    return { error: "HOSTING_UPLOAD_TOKEN no está configurado" };
  }

  const form = new FormData();
  form.append("file", new Blob([fileBuffer], { type: mimeType }), fileName);
  form.append("folder", folder);

  try {
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "X-Upload-Token": token },
      body: form,
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: `Error HTTP ${res.status} del servidor de archivos: ${text}` };
    }
    const data = (await res.json()) as { success: boolean; url?: string; error?: string };
    if (!data.success) return { error: data.error ?? "Error en el servidor de archivos" };
    return { url: data.url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error de red al subir archivo" };
  }
}

interface RequestUploadMeta {
  contentType: string;
  size: number;
  path: string;
}

interface SignedUpload {
  signedUrl: string;
  token: string;
  path: string;
  bucket: string;
}

export async function createSignedUpload(
  kind: UploadKind,
  meta: RequestUploadMeta,
): Promise<{ upload?: SignedUpload; error?: string }> {
  const config = UPLOAD_KINDS[kind];

  if (!config.allowedMimeTypes.includes(meta.contentType)) {
    return { error: `Formato no permitido: ${meta.contentType}` };
  }
  if (meta.size <= 0) {
    return { error: "El archivo está vacío" };
  }
  if (meta.size > config.maxBytes) {
    return {
      error: `El archivo supera el límite de ${(config.maxBytes / 1024 / 1024).toFixed(0)} MB (${(meta.size / 1024 / 1024).toFixed(1)} MB)`,
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(config.bucket)
    .createSignedUploadUrl(meta.path);

  if (error || !data) {
    return { error: `Error de Storage: ${error?.message ?? "no se pudo generar la URL"}` };
  }

  return {
    upload: {
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      bucket: config.bucket,
    },
  };
}

export function publicUrlFor(kind: UploadKind, path: string): string {
  const admin = createAdminClient();
  const { data } = admin.storage.from(UPLOAD_KINDS[kind].bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function removeUploadedFile(kind: UploadKind, path: string): Promise<void> {
  const admin = createAdminClient();
  await admin.storage.from(UPLOAD_KINDS[kind].bucket).remove([path]);
}

const DOWNLOAD_EXPIRES_SECONDS = 60 * 60; // 1 hora

export async function createSignedDownload(
  kind: UploadKind,
  path: string,
): Promise<{ url?: string; error?: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(UPLOAD_KINDS[kind].bucket)
    .createSignedUrl(path, DOWNLOAD_EXPIRES_SECONDS);

  if (error || !data) {
    return { error: `Error de Storage: ${error?.message ?? "no se pudo generar la URL"}` };
  }
  return { url: data.signedUrl };
}

export async function getStoredFileSize(kind: UploadKind, path: string): Promise<number | null> {
  const admin = createAdminClient();
  const slash = path.lastIndexOf("/");
  const folder = slash === -1 ? "" : path.slice(0, slash);
  const fileName = slash === -1 ? path : path.slice(slash + 1);

  const { data } = await admin.storage
    .from(UPLOAD_KINDS[kind].bucket)
    .list(folder, { search: fileName });

  return data?.find((f) => f.name === fileName)?.metadata?.size ?? null;
}
