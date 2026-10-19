"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." as string };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin")
    return { error: "Sin permisos" as string };
  return { error: null };
}

export async function resetAsignaciones(
  asesorId: string,
): Promise<{ error?: string }> {
  const { error: authErr } = await verifyAdmin();
  if (authErr) return { error: authErr };

  const admin = createAdminClient();
  const { error } = await admin
    .from("asesor_assignments")
    .update({ total_assignments: 0, last_assigned_at: null })
    .eq("asesor_id", asesorId);

  if (error) return { error: error.message };
  revalidatePath("/admin/contrato");
  return {};
}
