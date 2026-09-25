import type { Metadata } from "next";
import { EventPageTemplate } from "@/components/events/EventPageTemplate";
import type { EventPageConfig } from "@/components/events/types";
import { OG_IMAGE } from "@/config/brand";

export const metadata: Metadata = {
  title: "Quinceañeras en Jardín El Encanto | Cota, Cundinamarca",
  description:
    "Celebra los quince años más especiales en un entorno mágico. Jardines, salones y atención personalizada en Cota, Cundinamarca.",
  openGraph: {
    title: "Mis XV · Jardín El Encanto",
    description:
      "Un día lleno de magia y elegancia para celebrar los quince años más especiales.",
    locale: "es_CO",
    type: "website",
    images: [OG_IMAGE],
  },
};

const config: EventPageConfig = {
  hero: {
    image:
      "/placeholder-evento.svg",
    videoEventType: "quince",
    tagline: "Mis XV · Jardín El Encanto · Cota, Cundinamarca",
    title: "Quince años llenos de magia",
    subtitle:
      "Un espacio único donde cada momento se convierte en un recuerdo que atesorarás toda la vida.",
    ctaLabel: "Cuéntanos tus XV",
  },
  experiencia: {
    text: "Tu quinceañera merece un lugar tan especial como este momento único. En El Encanto te acompañamos para que celebres tus quince años rodeada de quienes más amas, en un espacio lleno de magia, elegancia y recuerdos que durarán toda la vida.",
  },
  gallery: {
    category: "quince",
    supertitle: "Momentos reales",
    title: "Quince años que brillan",
    fallback: [
      { url: "https://contenido.hacienda-encanto.com/galeria/quince/1.jpeg", title: "Quinceañera El Encanto" },
      { url: "https://contenido.hacienda-encanto.com/galeria/quince/2.jpeg", title: "Quinceañera El Encanto" },
      { url: "https://contenido.hacienda-encanto.com/galeria/quince/3.png", title: "Quinceañera El Encanto" },
      { url: "https://contenido.hacienda-encanto.com/galeria/quince/4.png", title: "Quinceañera El Encanto" },
      { url: "https://contenido.hacienda-encanto.com/galeria/quince/5.jpeg", title: "Quinceañera El Encanto" },
      { url: "https://contenido.hacienda-encanto.com/galeria/quince/6.jpeg", title: "Quinceañera El Encanto" },
      { url: "https://contenido.hacienda-encanto.com/galeria/quince/7.jpeg", title: "Quinceañera El Encanto" },
      { url: "https://contenido.hacienda-encanto.com/galeria/quince/8.jpeg", title: "Quinceañera El Encanto" },
    ],
  },
  testimonios: {
    eventType: "Quince Años",
    title: "Ellas celebraron sus quince en El Encanto",
  },
  contacto: {
    defaultEventType: "Quince Años",
    title: "Cuéntanos la celebración",
    subtitle:
      "Comparte los detalles de los quince años y nos pondremos en contacto contigo en menos de 24 horas.",
  },
};

export default function QuinceAnosPage() {
  return <EventPageTemplate config={config} />;
}
