// SOLO SERVIDOR — no importar desde Client Components.
//
// Firma permisos de subida para el upload.php del hosting de contenido
// (scripts/hosting/upload.php). Formato: "<exp>.<hmac_sha256_hex>", donde
// la firma cubre "<folder>|<exp>". El secreto (HOSTING_UPLOAD_TOKEN) es el
// mismo que está en /home/jardinde/upload-config.php y nunca sale del servidor.
import { createHmac } from "node:crypto";
import { CONTENT } from "@/config/brand";

const TTL_SECONDS = 15 * 60;

export function hostingUploadUrl(): string {
  return process.env.HOSTING_UPLOAD_URL || `${CONTENT.url}/upload.php`;
}

export function signHostingToken(folder: string): string | null {
  const secret = process.env.HOSTING_UPLOAD_TOKEN;
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const sig = createHmac("sha256", secret).update(`${folder}|${exp}`).digest("hex");
  return `${exp}.${sig}`;
}
