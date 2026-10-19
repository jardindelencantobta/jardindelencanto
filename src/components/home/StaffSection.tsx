import { User } from "lucide-react";

type StaffMember = {
  id: string;
  nombre: string;
  cargo: string;
  descripcion: string | null;
  foto_url: string | null;
};


export function StaffSection({ members }: { members: StaffMember[] }) {
  // El equipo se administra en /editor/staff ("Equipo"). Sin miembros activos, no se muestra.
  if (members.length === 0) return null;
  const effectiveMembers = members;

  return (
    <section id="equipo" className="py-20 bg-blanco">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Encabezado */}
        <div className="text-center mb-14">
          <p className="text-[11px] tracking-[4px] uppercase text-dorado font-medium mb-2">
            Nuestro Equipo
          </p>
          <h2
            className="font-serif text-[2.4rem] md:text-[3rem] font-light text-negro tracking-[-0.03em] leading-[1.1]"
          >
            Las personas detrás de{" "}
            <em className="text-dorado not-italic">cada evento</em>
          </h2>
          <div className="w-[50px] h-px bg-dorado mx-auto mt-6" />
        </div>

        {/* Cards */}
        <div
          className={[
            "grid gap-10",
            effectiveMembers.length === 1 ? "grid-cols-1 max-w-xs mx-auto" :
            effectiveMembers.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-xl mx-auto" :
            effectiveMembers.length === 4 ? "grid-cols-2 lg:grid-cols-4" :
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          ].join(" ")}
        >
          {effectiveMembers.map((m) => (
            <div
              key={m.id}
              className="group relative flex flex-col items-center text-center p-6 rounded-2xl"
            >
              {/* Foto circular */}
              <div className="w-28 h-28 rounded-full overflow-hidden ring-2 ring-dorado/30 bg-dorado/5 flex items-center justify-center shrink-0">
                {m.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.foto_url}
                    alt={m.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={36} className="text-dorado/40" />
                )}
              </div>

              {/* Info siempre visible */}
              <p className="font-medium text-negro text-[1.05rem] mt-4 leading-snug">
                {m.nombre}
              </p>
              <p className="text-[0.85rem] mt-0.5 font-medium" style={{ color: "#C9A84C" }}>
                {m.cargo}
              </p>
              {m.descripcion && (
                <p className="text-[0.83rem] text-negro/55 mt-2 leading-relaxed max-w-[240px]">
                  {m.descripcion}
                </p>
              )}

              {/* Overlay hover — fade + slide desde abajo */}
              {m.descripcion && (
                <div
                  className={[
                    "absolute inset-0 rounded-2xl",
                    "bg-negro/80 flex items-center justify-center px-6",
                    "opacity-0 translate-y-3 pointer-events-none",
                    "group-hover:opacity-100 group-hover:translate-y-0",
                    "transition-all duration-300 ease-out",
                  ].join(" ")}
                >
                  <p className="text-blanco text-[0.9rem] leading-relaxed text-center font-light italic">
                    &ldquo;{m.descripcion}&rdquo;
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Texto informativo debajo de las cards */}
        <p
          className="text-center mt-10 text-sm"
          style={{ fontFamily: "Helvetica, Arial, sans-serif", color: "#5A5A58" }}
        >
          Contamos con un equipo completo de meseros y personal de servicio para garantizar una experiencia impecable en cada evento.
        </p>
      </div>
    </section>
  );
}
