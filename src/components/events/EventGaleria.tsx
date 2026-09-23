import Image from "next/image";
import type { EventGalleryImage } from "./types";

interface GaleriaConfig {
  supertitle: string;
  title: string;
}

export function EventGaleria({
  images,
  config,
}: {
  images: EventGalleryImage[];
  config: GaleriaConfig;
}) {
  if (!images.length) return null;

  const displayed = images.slice(0, 5);

  return (
    <section id="galeria" className="py-24 bg-negro">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="text-center mb-12">
          <p className="text-[11px] tracking-[4px] uppercase text-dorado font-medium mb-2">
            {config.supertitle}
          </p>
          <h2 className="font-serif text-[2.8rem] font-light text-crema tracking-[-0.03em] leading-[1.15]">
            {config.title}
          </h2>
          <div className="w-[50px] h-px bg-dorado mx-auto mt-4" />
        </div>

        <div
          className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-0.5"
          style={{ gridTemplateRows: "repeat(2, 200px)" }}
        >
          {displayed.map((img, i) => (
            <div
              key={img.url}
              className={`relative overflow-hidden rounded-lg group ${
                i === 0
                  ? "h-[300px] md:h-auto md:col-span-2 md:row-span-2"
                  : "h-[150px] md:h-auto"
              }`}
            >
              <Image
                src={img.url}
                alt={img.title ?? "Jardín El Encanto"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.08]"
                sizes={
                  i === 0
                    ? "(max-width: 768px) 50vw, 50vw"
                    : "(max-width: 768px) 50vw, 25vw"
                }
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
