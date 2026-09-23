import Image from "next/image";

const FALLBACK_IMG = "https://contenido.hacienda-encanto.com/galeria/sitio/nosotros/nosotros.jpeg";

const stats = [
  { value: "+300", label: "Eventos realizados" },
  { value: "+150", label: "Invitados" },
  { value: "100%", label: "Acompañamiento" },
];

export function NosotrosSection({ image }: { image?: string | null }) {
  return (
    <section className="py-24 bg-blanco">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Imagen */}
          <div className="relative rounded-2xl overflow-hidden h-[300px] md:h-[500px]">
            <Image
              src={image ?? FALLBACK_IMG}
              alt="Jardín El Encanto"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Decoración dorada en esquina inferior-derecha */}
            <div
              className="absolute bottom-0 right-0 w-[120px] h-[120px] bg-dorado/15 pointer-events-none"
              style={{ borderRadius: "16px 0 16px 0" }}
            />
          </div>

          {/* Texto */}
          <div>
            <p className="text-[11px] tracking-[4px] uppercase text-dorado font-medium mb-2">
              Nuestra historia
            </p>
            <h2 className="font-serif text-[2.8rem] font-light text-negro tracking-[-0.03em] leading-[1.15] mb-6">
              Más que un lugar,
              <br />
              una experiencia
            </h2>
            <div className="w-[50px] h-px bg-dorado mb-6" />
            <p className="text-[0.95rem] text-gris leading-[1.9] font-light mb-6">
              En Jardín El Encanto creemos que cada celebración es irrepetible.
              Por eso, no solo ofrecemos un espacio — creamos experiencias
              completas donde cada detalle está pensado para que tú y tus
              invitados vivan momentos extraordinarios.
            </p>
            <p className="text-[0.95rem] text-gris leading-[1.9] font-light">
              Ubicados en el Km 5.5, Vía Suba Cota, Cundinamarca, nuestro
              espacio combina la calidez de la naturaleza con la sofisticación
              que tu evento merece. Con capacidad para más de 300 invitados,
              somos el escenario ideal para hacer realidad tu visión.
            </p>

            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6 mt-10 pt-8 border-t border-crema-medio">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="font-serif text-[2rem] sm:text-[2.8rem] font-semibold text-rojo leading-none">
                    {s.value}
                  </div>
                  <div className="text-[0.6rem] sm:text-[0.75rem] text-gris tracking-[0px] sm:tracking-[1px] uppercase mt-1 leading-tight [overflow-wrap:anywhere]">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
