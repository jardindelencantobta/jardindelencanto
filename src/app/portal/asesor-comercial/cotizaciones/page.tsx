import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchCotizacionConfig } from "@/app/actions/cotizaciones";
import { CotizacionForm } from "@/components/cotizaciones/CotizacionForm";

export const metadata = { title: "Cotizaciones — Jardín El Encanto" };

export default async function CotizacionesAsesorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "asesor_comercial", "wedding_planner"].includes(profile.role)) {
    redirect("/portal");
  }

  const { config } = await fetchCotizacionConfig();

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/portal/asesor-comercial"
          className="inline-flex items-center gap-1.5 text-[0.8rem] text-gris hover:text-negro transition-colors mb-3"
        >
          <ArrowLeft size={13} />
          Volver al panel
        </Link>
        <h2 className="font-serif text-[1.9rem] md:text-[2.3rem] text-negro leading-tight tracking-[-0.03em]">
          Generar <span className="text-dorado">cotización</span>
        </h2>
        <p className="text-gris text-[0.88rem] mt-1">
          Calcula el precio en tiempo real y genera el PDF para el cliente.
        </p>
      </div>

      <CotizacionForm config={config} />
    </div>
  );
}
