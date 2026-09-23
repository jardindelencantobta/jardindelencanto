import { createRawAdminClient } from "@/lib/supabase/admin";
import { CotizacionConfigManager } from "@/components/admin/CotizacionConfigManager";
import type { ConfigRow } from "@/app/actions/cotizaciones";

export const metadata = { title: "Config. Cotizaciones — Jardín El Encanto" };

export default async function CotizacionesConfigPage() {
  let rows: ConfigRow[] = [];
  try {
    const db = createRawAdminClient();
    const { data } = await db
      .from("cotizacion_config")
      .select("id, clave, valor, descripcion")
      .order("clave");
    rows = (data ?? []) as ConfigRow[];
  } catch {
    // Tabla puede no existir aún; muestra tabla vacía con mensaje
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-[1.9rem] md:text-[2.3rem] text-negro leading-tight tracking-[-0.03em]">
          Config. <span className="text-dorado">Cotizaciones</span>
        </h2>
        <p className="text-gris text-[0.88rem] mt-1">
          Parámetros de precios y descuentos para el módulo de cotizaciones.
          Cada cambio se aplica a las cotizaciones generadas a partir de ese momento.
        </p>
      </div>

      <CotizacionConfigManager rows={rows} />
    </div>
  );
}
