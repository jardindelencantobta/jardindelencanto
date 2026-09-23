import Link from "next/link";
import { RotateCw } from "lucide-react";

const PLACEHOLDER_IMAGE =
  "/placeholder-evento.svg";

interface Vista360Props {
  tourUrl: string | null;
}

export function Vista360({ tourUrl }: Vista360Props) {
  if (!tourUrl || tourUrl === "#") return null;

  return (
    <section className="relative h-[420px] md:h-[500px] flex items-center justify-center overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={PLACEHOLDER_IMAGE}
        alt="Jardín El Encanto — tour virtual 360°"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-negro/65" />

      <div className="relative z-10 text-center px-8 max-w-[640px]">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-dorado flex items-center justify-center">
            <RotateCw className="w-7 h-7 text-dorado" strokeWidth={1.5} />
          </div>
          <span className="font-serif text-dorado text-[2rem] font-light">360°</span>
        </div>

        <p className="text-[11px] tracking-[5px] uppercase text-dorado font-medium mb-3">
          Tour virtual
        </p>
        <h2 className="font-serif text-[2.2rem] md:text-[2.8rem] font-light text-blanco leading-[1.15] tracking-[-0.03em] mb-4">
          Conoce nuestros espacios en 360°
        </h2>
        <p className="text-blanco/70 font-light text-[0.95rem] leading-[1.7] mb-8 max-w-[480px] mx-auto">
          Recorre cada rincón de Jardín El Encanto desde donde estés. Explora
          los salones, jardines y espacios que serán el escenario de tu evento.
        </p>

        <Link
          href={tourUrl ?? "#"}
          target={tourUrl ? "_blank" : undefined}
          rel={tourUrl ? "noopener noreferrer" : undefined}
          className="inline-flex items-center gap-2 px-9 py-[14px] rounded-lg text-[12px] font-medium tracking-[2px] uppercase transition-all duration-300 bg-dorado text-negro hover:bg-dorado/85"
        >
          <RotateCw className="w-4 h-4" strokeWidth={2} />
          Ver tour virtual
        </Link>
      </div>
    </section>
  );
}
