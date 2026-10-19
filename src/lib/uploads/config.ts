// Config compartida cliente/servidor para uploads directos a Supabase Storage
// vía signed URL. No contiene secretos — seguro de importar desde componentes cliente.

export type UploadKind =
  | "hero-video"
  | "gallery-image"
  | "site-image"
  | "avatar"
  | "testimonial-photo"
  | "document"
  | "payment-receipt"
  | "guest-list"
  | "salon-map"
  | "firma-representante"
  | "signed-contract";

export const HERO_VIDEO_FOLDER: Record<string, string> = {
  "": "home",
  boda: "boda",
  quince: "quince",
  empresarial: "empresarial",
  revelacion: "revelacion",
};

export const GALLERY_IMAGE_FOLDER: Record<string, string> = {
  boda: "bodas",
  quince: "quince",
  empresarial: "empresarial",
  revelacion: "revelacion",
  general: "general",
};

interface UploadKindConfig {
  bucket: string;
  maxBytes: number;
  allowedMimeTypes: string[];
}

export const UPLOAD_KINDS: Record<UploadKind, UploadKindConfig> = {
  "hero-video": {
    bucket: "videos",
    maxBytes: 50 * 1024 * 1024,
    allowedMimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
  },
  "gallery-image": {
    bucket: "gallery",
    maxBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  "site-image": {
    bucket: "gallery",
    maxBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  avatar: {
    bucket: "avatars",
    maxBytes: 2 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  "testimonial-photo": {
    bucket: "gallery",
    maxBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  document: {
    bucket: "documents",
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
  },
  "payment-receipt": {
    bucket: "documents",
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
  },
  "guest-list": {
    bucket: "documents",
    maxBytes: 5 * 1024 * 1024,
    allowedMimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ],
  },
  "salon-map": {
    bucket: "gallery",
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png"],
  },
  "firma-representante": {
    bucket: "avatars",
    maxBytes: 2 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  "signed-contract": {
    bucket: "documents",
    maxBytes: 15 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
  },
};

export function heroVideoPath(eventType: string, fileName: string): string {
  const folder = HERO_VIDEO_FOLDER[eventType] ?? "home";
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "mp4";
  return `${folder}/${Date.now()}.${ext}`;
}

export function galleryImagePath(category: string, fileName: string): string {
  const folder = GALLERY_IMAGE_FOLDER[category] ?? "general";
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
  return `${folder}/${Date.now()}_${safe}`;
}

export function siteImagePath(key: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  return `sitio/${key}_${Date.now()}.${ext}`;
}

export function avatarPath(userId: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  return `${userId}/${Date.now()}.${ext}`;
}

export function testimonialPhotoPath(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  return `avatars/${Date.now()}.${ext}`;
}

function safeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
}

export function documentPath(bookingId: string, fileName: string): string {
  return `${bookingId}/contratos/${Date.now()}_${safeFileName(fileName)}`;
}

export function paymentReceiptPath(bookingId: string, fileName: string): string {
  return `${bookingId}/comprobantes/${Date.now()}_${safeFileName(fileName)}`;
}

export function guestListPath(bookingId: string, fileName: string): string {
  return `${bookingId}/invitados/${Date.now()}_${safeFileName(fileName)}`;
}

export function salonMapPath(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  return `mapas/${Date.now()}.${ext}`;
}

export function firmaRepresentantePath(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  return `firmas/firma_${Date.now()}.${ext}`;
}

export function signedContractPath(bookingId: string, version: number): string {
  return `${bookingId}/contratos_firmados/contrato_firmado_v${version}_${Date.now()}.pdf`;
}

export function generatedContractPath(bookingId: string, version: number): string {
  return `${bookingId}/contratos/contrato_v${version}_${Date.now()}.pdf`;
}

export const SITE_IMAGE_KEYS = [
  "img_card_boda",
  "img_card_quince",
  "img_card_empresarial",
  "img_card_revelacion",
  "img_nosotros",
  "img_servicio_catering",
  "img_servicio_fotografia",
  "img_servicio_decoracion",
] as const;

export type SiteImageKey = (typeof SITE_IMAGE_KEYS)[number];

/** Carpeta del hosting de contenido para cada imagen del sitio (ver scripts/hosting/upload.php). */
export const SITE_IMAGE_FOLDER: Record<SiteImageKey, string> = {
  img_card_boda:           "galeria/sitio/eventos",
  img_card_quince:         "galeria/sitio/eventos",
  img_card_empresarial:    "galeria/sitio/eventos",
  img_card_revelacion:     "galeria/sitio/eventos",
  img_nosotros:            "galeria/sitio/nosotros",
  img_servicio_catering:   "galeria/sitio/servicios",
  img_servicio_fotografia: "galeria/sitio/servicios",
  img_servicio_decoracion: "galeria/sitio/servicios",
};
