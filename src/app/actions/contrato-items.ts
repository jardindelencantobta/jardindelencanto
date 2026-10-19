"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { ContractItems } from "@/lib/contract-items";

async function verifyPlanner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." as string };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "wedding_planner", "asesor_comercial"].includes(profile.role))
    return { error: "Sin permisos" as string };
  return { error: null };
}

export async function saveContractItems(
  bookingId: string,
  items: ContractItems,
  capilla: boolean,
): Promise<{ error?: string }> {
  const { error: authErr } = await verifyPlanner();
  if (authErr) return { error: authErr };

  const admin = createAdminClient();
  const { error } = await admin
    .from("bookings")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ contract_items: items as any, capilla })
    .eq("id", bookingId);

  if (error) return { error: error.message };

  revalidatePath("/portal/planner/clientes");
  return {};
}
