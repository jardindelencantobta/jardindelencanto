"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const INTERVAL_MS = 3500;

const PLACEHOLDERS = [
  {
    url: "/placeholder-evento.svg",
    title: "Jardín El Encanto",
  },
  {
    url: "/placeholder-evento.svg",
    title: "Celebración",
  },
  {
    url: "/placeholder-evento.svg",
    title: "Jardines",
  },
  {
    url: "/placeholder-evento.svg",
    title: "Ceremonia",
  },
  {
    url: "/placeholder-evento.svg",
    title: "Recepción",
  },
];

interface SliderImage {
  url: string;
  title: string | null;
}

interface SliderGaleriaProps {
  images: SliderImage[];
  supertitle?: string;
  title?: string;
}

export function SliderGaleria({ images, supertitle, title }: SliderGaleriaProps) {
  const items = images.length >= 1 ? images.slice(0, 8) : PLACEHOLDERS;
  const [current, setCurrent] = useState(0);

  const advance = useCallback(() => {
    setCurrent((i) => (i + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    const id = setInterval(advance, INTERVAL_MS);
    return () => clearInterval(id);
  }, [advance]);

  return (
    <section className="bg-negro">
      {(supertitle || title) && (
        <div className="text-center pt-16 pb-10 px-8">
          {supertitle && (
            <p className="text-[11px] tracking-[4px] uppercase text-dorado font-medium mb-2">
              {supertitle}
            </p>
          )}
          {title && (
            <h2 className="font-serif text-[2.2rem] font-light text-crema tracking-[-0.03em] leading-[1.15]">
              {title}
            </h2>
          )}
          <div className="w-[50px] h-px bg-dorado mx-auto mt-4" />
        </div>
      )}

      <div className="relative h-[500px] md:h-[650px] overflow-hidden">
        {items.map((img, i) => (
          <Image
            key={`${i}-${img.url}`}
            src={img.url}
            alt={img.title ?? "Jardín El Encanto"}
            fill
            sizes="100vw"
            priority={i === 0}
            // contain: la foto completa, sin recortes; las barras se funden con el bg-negro de la sección
            className="object-contain transition-opacity duration-[1000ms]"
            style={{ opacity: i === current ? 1 : 0 }}
          />
        ))}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-negro/70 to-transparent pointer-events-none" />

        <div className="absolute bottom-0 left-0 right-0 flex justify-center z-10">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Imagen ${i + 1}`}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-6 bg-dorado"
                    : "w-2 bg-blanco/50 hover:bg-blanco/80"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
