import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ContratoAdminManager } from "@/components/admin/ContratoAdminManager";
import { CLAUSULA_KEYS, FIRMA_KEY, HACIENDA_CONTENT_KEYS } from "@/lib/contract-items";

export const metadata = { title: "Plantilla de contrato — Jardín El Encanto" };

export default async function ContratoAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/portal");

  const admin = createAdminClient();

  const haciendaKeys = Object.values(HACIENDA_CONTENT_KEYS);
  const keysToFetch = [...CLAUSULA_KEYS, FIRMA_KEY, ...haciendaKeys];
  const { data: contentRows } = await admin
    .from("site_content")
    .select("key, content")
    .in("key", keysToFetch);

  const contentMap: Record<string, string | null> = {};
  for (const row of contentRows ?? []) {
    contentMap[row.key] = row.content ?? null;
  }

  const clauses: Record<string, string | null> = {};
  for (const key of CLAUSULA_KEYS) {
    clauses[key] = contentMap[key] ?? null;
  }
  const firmaUrl = contentMap[FIRMA_KEY] ?? null;

  const haciendaValues: Record<string, string | null> = {};
  for (const key of haciendaKeys) {
    haciendaValues[key] = contentMap[key] ?? null;
  }

  // Cláusulas adicionales (contrato_clausula_extra_*)
  const { data: extraRows } = await admin
    .from("site_content")
    .select("key, content")
    .like("key", "contrato_clausula_extra_%")
    .order("key");

  const extraClauses = (extraRows ?? []).map((r) => ({
    key:     r.key,
    content: r.content ?? "",
  }));

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="font-serif text-[1.9rem] md:text-[2.3rem] text-negro leading-tight tracking-[-0.03em]">
          Plantilla de <span className="text-dorado">contrato</span>
        </h2>
        <p className="text-gris text-[0.88rem] mt-1">
          Edita las cláusulas y sube la firma del representante legal. Los cambios
          se reflejan en todos los contratos que se generen a partir de ahora.
        </p>
      </div>
      <ContratoAdminManager
        clauses={clauses}
        firmaUrl={firmaUrl}
        haciendaValues={haciendaValues}
        extraClauses={extraClauses}
      />
    </div>
  );
}
