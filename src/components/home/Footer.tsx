import Link from "next/link";
import { BRAND, SOCIAL, WHATSAPP, waLink } from "@/config/brand";

const eventLinks = [
  { href: "/bodas", label: "Nuestra Boda" },
  { href: "/quince-anos", label: "Mis XV" },
  { href: "/eventos-empresariales", label: "Empresariales" },
  { href: "/revelacion-de-genero", label: "Revelación de Género" },
];

const encanto = [
  { href: "#nosotros", label: "Nosotros" },
  { href: "#servicios", label: "Servicios" },
  { href: "#galeria", label: "Galería" },
  { href: "#testimonios", label: "Testimonios" },
];

const contacto: { text: string; href?: string; label?: string }[] = [
  { text: WHATSAPP.display, href: waLink(), label: "WhatsApp" },
  { text: BRAND.email, href: `mailto:${BRAND.email}`, label: "Correo" },
  { text: BRAND.address },
  ...(SOCIAL.instagram ? [{ text: SOCIAL.instagram.handle, href: SOCIAL.instagram.url, label: "Instagram" }] : []),
  ...(SOCIAL.tiktok ? [{ text: SOCIAL.tiktok.handle, href: SOCIAL.tiktok.url, label: "TikTok" }] : []),
];

const social = [
  {
    label: "Instagram",
    href: SOCIAL.instagram?.url,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="17" height="17" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4.5"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: SOCIAL.tiktok?.url,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: waLink(),
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="bg-negro pt-16 pb-8 text-gris">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-12 mb-12">
          {/* Marca */}
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-principal-fondo-claro.svg"
              alt="El Encanto"
              style={{ height: "36px", width: "auto" }}
              className="mb-4 brightness-0 invert"
            />
            <p className="text-[0.85rem] text-gris leading-[1.7] font-light max-w-[280px]">
              Creamos experiencias únicas para los momentos más importantes de tu
              vida. Cada celebración en El Encanto es una historia que merece
              contarse.
            </p>
          </div>

          {/* Eventos */}
          <div>
            <h4 className="text-[11px] tracking-[3px] uppercase text-dorado font-light mb-4">
              Eventos
            </h4>
            <ul className="space-y-2">
              {eventLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[0.85rem] text-gris hover:text-crema transition-colors duration-300 font-light"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* El Encanto */}
          <div>
            <h4 className="text-[11px] tracking-[3px] uppercase text-dorado font-light mb-4">
              El Encanto
            </h4>
            <ul className="space-y-2">
              {encanto.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[0.85rem] text-gris hover:text-crema transition-colors duration-300 font-light"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-[11px] tracking-[3px] uppercase text-dorado font-light mb-4">
              Contacto
            </h4>
            <ul className="space-y-2">
              {contacto.map((item) => (
                <li
                  key={(item.label ?? "") + item.text}
                  className="text-[0.85rem] text-gris font-light"
                >
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-dorado transition-colors duration-300"
                    >
                      {item.label && (
                        <span className="text-[0.75rem] text-gris/50 mr-1">
                          {item.label}:{" "}
                        </span>
                      )}
                      {item.text}
                    </a>
                  ) : (
                    item.text
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pie */}
        <div className="border-t border-blanco/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
            <p className="text-[0.8rem] text-gris font-light">
              © 2026 Jardín El Encanto. Todos los derechos reservados.
            </p>
            <Link
              href="/politica-de-privacidad"
              className="text-[0.8rem] text-gris font-light hover:text-dorado transition-colors duration-300"
            >
              Política de Privacidad
            </Link>
          </div>
          <div className="flex gap-3">
            {social.filter((s) => s.href).map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-9 h-9 rounded-full border border-blanco/10 flex items-center justify-center text-gris hover:border-dorado hover:text-dorado transition-all duration-300"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
