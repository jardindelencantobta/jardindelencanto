/**
 * Datos de marca y contacto — ÚNICA fuente de verdad.
 * Módulo plano (sin "use server"): importable desde Server y Client Components.
 *
 * Para agregar una red social: completar su entrada en SOCIAL.
 * Los componentes solo muestran las redes que tengan `url`.
 */

export const BRAND = {
  name: "Jardín El Encanto",
  nameUpper: "JARDÍN EL ENCANTO",
  email: "contacto@jardindelencanto.com",
  website: "www.jardindelencanto.com",
  url: "https://www.jardindelencanto.com",
  /** Razón social — se mantiene (mismo dueño). */
  legalName: "Hacienda El Encanto Bogotá S.A.S",
  address: "Km 5.5, Vía Suba Cota",
  addressFull: "Km 5.5, Vía Suba Cota, Cundinamarca, Colombia",
} as const;

/** WhatsApp Business. `number` = 10 dígitos locales; `intl` = formato wa.me (sin +). */
export const WHATSAPP = {
  number: "3128661699",
  intl: "573128661699",
  display: "+57 312 866 1699",
} as const;

export function waLink(message?: string): string {
  const base = `https://wa.me/${WHATSAPP.intl}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

type SocialNetwork = { handle: string; url: string } | null;

export const SOCIAL: {
  instagram: SocialNetwork;
  tiktok: SocialNetwork;
  facebook: SocialNetwork;
} = {
  instagram: {
    handle: "@jardin__elencanto",
    url: "https://www.instagram.com/jardin__elencanto",
  },
  tiktok: null,   // pendiente
  facebook: null, // pendiente
};
