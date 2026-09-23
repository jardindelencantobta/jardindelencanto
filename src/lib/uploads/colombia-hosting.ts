// Subida desde Client Components del editor (blog, staff, promociones) al
// hosting de contenido. Pide primero un permiso firmado a la Server Action
// (que verifica el rol) y luego envía el archivo directo al upload.php,
// sin pasar por Vercel (evita el límite de 4.5 MB del body).
//
// PDFs generados en el servidor (contratos, cotizaciones) usan
// uploadToHosting() de "@/lib/uploads/server".
import { requestHostingUpload, type CarpetaEditor } from "@/app/actions/uploads";
import { uploadToHosting } from "@/lib/uploads/client";

export type ColombiaFolder = CarpetaEditor;

export async function uploadToColombiaHosting(
  file: File,
  folder: ColombiaFolder,
): Promise<{ url?: string; error?: string }> {
  const permiso = await requestHostingUpload(folder);
  if (permiso.error || !permiso.uploadUrl || !permiso.token) {
    return { error: permiso.error ?? "No se pudo preparar la subida" };
  }
  return uploadToHosting(permiso.uploadUrl, permiso.token, folder, file);
}
