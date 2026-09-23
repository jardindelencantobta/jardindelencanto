import type { Metadata } from "next";
import { EventPageTemplate } from "@/components/events/EventPageTemplate";
import type { EventPageConfig } from "@/components/events/types";

export const metadata: Metadata = {
  title: "Bodas en Jardín El Encanto | Cota, Cundinamarca",
  description:
    "Celebra tu boda en un entorno único. Salones elegantes, jardines y naturaleza en Cota, Cundinamarca. Haz realidad la boda que siempre soñaste.",
  openGraph: {
    title: "Bodas · Jardín El Encanto",
    description:
      "Cada detalle de tu boda, diseñado para reflejar la historia de amor que quieren contar.",
    locale: "es_CO",
    type: "website",
  },
};

const config: EventPageConfig = {
  hero: {
    image:
      "/placeholder-evento.svg",
    videoEventType: "boda",
    tagline: "Bodas · Jardín El Encanto · Cota, Cundinamarca",
    title: "El día más especial de tu vida",
    subtitle:
      "Rodeados de naturaleza y elegancia, convertimos cada detalle en una celebración de amor que se recuerda para siempre.",
    ctaLabel: "Cuéntanos tu boda",
  },
  experiencia: {
    text: "En Jardín El Encanto, tu boda es mucho más que un evento — es el inicio de una historia de amor que merece el escenario perfecto. Rodeados de naturaleza, elegancia y un equipo dedicado a cada detalle, hacemos realidad el día que siempre soñaste.",
  },
  gallery: {
    category: "boda",
    supertitle: "Momentos reales",
    title: "Bodas que inspiran",
    fallback: [
      { url: "https://contenido.hacienda-encanto.com/galeria/boda/1.jpeg",  title: "Boda El Encanto" },
      { url: "https://contenido.hacienda-encanto.com/galeria/boda/2.jpeg",  title: "Boda El Encanto" },
      { url: "https://contenido.hacienda-encanto.com/galeria/boda/3.jpeg",  title: "Boda El Encanto" },
      { url: "https://contenido.hacienda-encanto.com/galeria/boda/4.jpeg",  title: "Boda El Encanto" },
      { url: "https://contenido.hacienda-encanto.com/galeria/boda/5.jpeg",  title: "Boda El Encanto" },
      { url: "https://contenido.hacienda-encanto.com/galeria/boda/6.jpeg",  title: "Boda El Encanto" },
      { url: "https://contenido.hacienda-encanto.com/galeria/boda/7.jpeg",  title: "Boda El Encanto" },
      { url: "https://contenido.hacienda-encanto.com/galeria/boda/8.jpeg",  title: "Boda El Encanto" },
      { url: "https://contenido.hacienda-encanto.com/galeria/boda/9.jpeg",  title: "Boda El Encanto" },
    ],
  },
  testimonios: {
    eventType: "Boda",
    title: "Ellos eligieron El Encanto para su boda",
  },
  contacto: {
    defaultEventType: "Boda",
    title: "Cuéntanos tu boda",
    subtitle:
      "Comparte los detalles de tu celebración y nos pondremos en contacto contigo en menos de 24 horas.",
  },
};

export default function BodasPage() {
  return <EventPageTemplate config={config} />;
}
