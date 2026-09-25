import type { Metadata } from "next";
import { EventPageTemplate } from "@/components/events/EventPageTemplate";
import type { EventPageConfig } from "@/components/events/types";
import { OG_IMAGE } from "@/config/brand";

export const metadata: Metadata = {
  title: "Revelación de Género | Jardín El Encanto Cota",
  description:
    "Celebra el momento más esperado en un entorno mágico. Revelaciones de género íntimas y memorables en Cota, Cundinamarca.",
  openGraph: {
    title: "Revelación de Género · Jardín El Encanto",
    description:
      "El momento en que todo cambia. Celébralo rodeado de quienes más amas en Jardín El Encanto.",
    locale: "es_CO",
    type: "website",
    images: [OG_IMAGE],
  },
};

const config: EventPageConfig = {
  hero: {
    image:
      "/placeholder-evento.svg",
    videoEventType: "revelacion",
    tagline: "Revelación de Género · Jardín El Encanto · Cota, Cundinamarca",
    title: "El momento más esperado",
    subtitle:
      "Revela el gran secreto rodeado de quienes más amas, en un espacio lleno de color, alegría y naturaleza.",
    ctaLabel: "Cuéntanos tu revelación",
  },
  experiencia: {
    text: "El primer gran secreto de tu bebé merece celebrarse en grande. En El Encanto creamos el ambiente perfecto para ese momento mágico e irrepetible, lleno de emoción, sorpresa y amor, rodeado de las personas más importantes de tu familia.",
  },
  gallery: {
    category: "revelacion",
    supertitle: "Momentos reales",
    title: "Revelaciones que emocionan",
    fallback: [
      {
        url: "/placeholder-evento.svg",
        title: "Revelación de género",
      },
      {
        url: "/placeholder-evento.svg",
        title: "Decoración especial",
      },
      {
        url: "/placeholder-evento.svg",
        title: "Jardines",
      },
      {
        url: "/placeholder-evento.svg",
        title: "El Encanto",
      },
      {
        url: "/placeholder-evento.svg",
        title: "Celebración",
      },
    ],
  },
  testimonios: {
    eventType: "Revelación de Género",
    title: "Familias que vivieron su revelación en El Encanto",
  },
  contacto: {
    defaultEventType: "Revelación de Género",
    title: "Cuéntanos tu revelación",
    subtitle:
      "Comparte los detalles de la celebración y nos pondremos en contacto contigo en menos de 24 horas.",
  },
};

export default function RevelacionDeGeneroPage() {
  return <EventPageTemplate config={config} />;
}
