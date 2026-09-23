import { HomeContactForm } from "@/components/contact/HomeContactForm";
import type { ReactNode } from "react";
import { BRAND, SOCIAL, WHATSAPP, waLink } from "@/config/brand";

interface InfoItem {
  icon: ReactNode;
  title: string;
  text: string;
  href?: string;
}

const infoItems: InfoItem[] = [
  {
    icon: "📍",
    title: "Ubicación",
    text: BRAND.addressFull,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="20" height="20" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
    ),
    title: "WhatsApp",
    text: WHATSAPP.display,
    href: waLink(),
  },
  { icon: "✉️", title: "Correo", text: BRAND.email, href: `mailto:${BRAND.email}` },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4.5"/>
        <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/>
      </svg>
    ),
    title: "Instagram",
    text: SOCIAL.instagram?.handle ?? "",
    href: SOCIAL.instagram?.url,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="20" height="20" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
      </svg>
    ),
    title: "TikTok",
    text: SOCIAL.tiktok?.handle ?? "",
    href: SOCIAL.tiktok?.url,
  },
];

export function ContactoSection() {
  return (
    <section id="contacto" className="py-24 bg-crema">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Formulario */}
          <div className="bg-blanco p-10 rounded-2xl">
            <p className="text-[11px] tracking-[4px] uppercase text-dorado font-medium mb-2">
              Escríbenos
            </p>
            <h3 className="font-serif text-[2rem] text-negro font-light tracking-[-0.02em] mb-1">
              Cuéntanos tu evento
            </h3>
            <p className="text-[0.85rem] text-gris font-light mb-8">
              Completa el formulario y nos pondremos en contacto contigo en
              menos de 24 horas.
            </p>
            <HomeContactForm />
          </div>

          {/* Info */}
          <div>
            <p className="text-[11px] tracking-[4px] uppercase text-dorado font-medium mb-2">
              Encuéntranos
            </p>
            <h3 className="font-serif text-[2rem] text-negro font-light tracking-[-0.02em] mb-2">
              Estamos más cerca
              <br />
              de lo que imaginas
            </h3>
            <div className="w-[50px] h-px bg-dorado mb-6" />
            <p className="text-[0.9rem] text-gris font-light leading-[1.8] mb-8">
              Visítanos y enamórate del espacio. Agenda tu visita y recorre cada
              rincón de El Encanto.
            </p>

            {infoItems.filter((item) => item.text).map((item) => (
              <div key={item.title} className="flex gap-4 mb-6 items-start">
                <div className="w-11 h-11 rounded-full bg-rojo flex items-center justify-center text-lg flex-shrink-0">
                  {item.icon}
                </div>
                <div className="text-[0.9rem] text-gris font-light">
                  <strong className="block text-negro font-medium mb-0.5">
                    {item.title}
                  </strong>
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-rojo transition-colors duration-300"
                    >
                      {item.text}
                    </a>
                  ) : (
                    item.text
                  )}
                </div>
              </div>
            ))}

            {/* Mapa */}
            <div className="mt-8 rounded-xl overflow-hidden h-[220px] bg-crema-medio">
              <iframe
                src="https://maps.google.com/maps?q=4.782638,-74.089686&z=17&output=embed"
                width="100%"
                height="220"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación Jardín El Encanto"
              />
            </div>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=4.782638,-74.089686"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-[12px] font-medium tracking-[1px] uppercase text-rojo hover:text-rojo-pro transition-colors duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              ¿Cómo llegar?
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
