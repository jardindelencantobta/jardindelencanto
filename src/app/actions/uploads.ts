"use server";

import { createClient } from "@/lib/supabase/server";
import { hostingUploadUrl, signHostingToken } from "@/lib/uploads/hosting-token";

// Carpetas que los Client Components del editor pueden pedir directamente.
// Galería y videos tienen sus propias acciones (editor/galeria.ts, editor/videos.ts).
const CARPETAS_EDITOR = ["galeria/blog", "galeria/staff", "promociones"] as const;
export type CarpetaEditor = (typeof CARPETAS_EDITOR)[number];

/** Devuelve un permiso de subida firmado (15 min, una carpeta) para admin/editor. */
export async function requestHostingUpload(
  folder: CarpetaEditor,
): Promise<{ uploadUrl?: string; token?: string; error?: string }> {
  if (!CARPETAS_EDITOR.includes(folder)) return { error: "Carpeta no permitida" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role as string))
    return { error: "Sin permisos" };

  const token = signHostingToken(folder);
  if (!token) return { error: "Servidor de archivos no configurado (HOSTING_UPLOAD_TOKEN)" };
  return { uploadUrl: hostingUploadUrl(), token };
}
