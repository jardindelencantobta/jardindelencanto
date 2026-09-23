import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LeadsManager } from "@/components/admin/LeadsManager";
import { AsesoresAsignacionesView } from "@/components/admin/AsesoresAsignacionesView";

export const metadata = { title: "Leads — Jardín El Encanto" };

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "gerente"].includes(profile.role)) {
    redirect("/portal");
  }

  const admin = createAdminClient();

  const [{ data: messages }, { data: asesores }, { data: asesorProfiles }, { data: assignments }] =
    await Promise.all([
      admin
        .from("contact_messages")
        .select(
          "id, created_at, name, email, phone, whatsapp, subject, event_date, guest_count, message, status, assigned_asesor_id"
        )
        .order("created_at", { ascending: false }),
      admin
        .from("profiles")
        .select("id, full_name, role")
        .in("role", ["asesor_comercial", "wedding_planner"])
        .eq("is_active", true)
        .order("full_name"),
      admin
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("role", ["asesor_comercial", "wedding_planner"])
        .eq("is_active", true)
        .order("full_name"),
      admin
        .from("asesor_assignments")
        .select("asesor_id, total_assignments, last_assigned_at"),
    ]);

  // Mapa de asesores para enriquecer los leads
  const profileMap = new Map((asesorProfiles ?? []).map((p) => [p.id, p]));

  const leads = (messages ?? []).map((m) => ({
    ...m,
    asesor_name: m.assigned_asesor_id
      ? (profileMap.get(m.assigned_asesor_id)?.full_name ?? null)
      : null,
    asesor_phone: m.assigned_asesor_id
      ? (profileMap.get(m.assigned_asesor_id)?.phone ?? null)
      : null,
  }));

  // Tabla de round-robin para AsesoresAsignacionesView
  const assignMap: Record<string, { total: number; last: string | null }> = {};
  for (const a of assignments ?? []) {
    assignMap[a.asesor_id] = { total: a.total_assignments, last: a.last_assigned_at };
  }
  const asesorRows = (asesorProfiles ?? []).map((a) => ({
    asesorId: a.id,
    nombre: a.full_name ?? a.email,
    email: a.email,
    phone: a.phone,
    total: assignMap[a.id]?.total ?? 0,
    lastAssignedAt: assignMap[a.id]?.last ?? null,
  }));

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-[2rem] md:text-[2.5rem] text-negro leading-tight tracking-[-0.03em]">
            Leads &{" "}
            <span className="text-dorado">Contactos</span>
          </h1>
          <p className="text-gris text-[0.88rem] mt-1">
            Todos los contactos recibidos desde el formulario público
          </p>
        </div>
        <LeadsManager initialLeads={leads} asesores={asesores ?? []} />
      </div>

      <div className="border-t border-negro/[0.07]" />

      <div className="space-y-4 max-w-3xl">
        <div>
          <h2 className="font-serif text-[1.9rem] md:text-[2.3rem] text-negro leading-tight tracking-[-0.03em]">
            Asesores & <span className="text-dorado">Planners</span>
          </h2>
          <p className="text-gris text-[0.88rem] mt-1">
            El formulario de contacto asigna cada lead al asesor o planner con menos
            conversaciones (round-robin). Asegúrate de que cada uno tenga su número de
            WhatsApp registrado.
          </p>
        </div>
        <AsesoresAsignacionesView initial={asesorRows} />
      </div>
    </div>
  );
}
