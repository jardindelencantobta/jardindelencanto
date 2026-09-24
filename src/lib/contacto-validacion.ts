// Reglas compartidas por los formularios de contacto (navegador) y por
// submitContactForm (servidor). Cambiar aquí cambia ambos lados.

export const MAX_NOMBRE = 80;
export const MAX_EMAIL = 120;
export const MAX_MENSAJE = 1500;
export const MAX_INVITADOS = 1000;

/** Letras (con tildes y ñ), espacios, apóstrofo, punto y guion. */
export const NOMBRE_REGEX = new RegExp(`^[\\p{L}\\p{M}' .\\-]{2,${MAX_NOMBRE}}$`, "u");
/** Mismo criterio para el atributo pattern del input (sin ^ ni $). */
export const NOMBRE_PATTERN = `[\\p{L}\\p{M}' .\\-]{2,${MAX_NOMBRE}}`;

/** Dígitos, espacios, guiones y un + inicial; el servidor normaliza. */
export const WHATSAPP_PATTERN = "\\+?[0-9 \\-]{10,16}";

/** Quita espacios, guiones, puntos y paréntesis: "+57 312-866 1699" → "+573128661699". */
export function normalizarWhatsapp(v: string): string {
  return v.replace(/[\s\-().]/g, "");
}

/** Celular colombiano: 3XXXXXXXXX, con o sin 57 / +57 delante. */
export const WHATSAPP_REGEX = /^(\+?57)?3\d{9}$/;

/** Deja solo dígitos, espacios, guiones y un + al inicio mientras se escribe. */
export function filtrarWhatsapp(v: string): string {
  return v.replace(/[^\d +\-]/g, "").replace(/(?!^)\+/g, "");
}
