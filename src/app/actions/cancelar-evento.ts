"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Soft delete: marca el evento como cancelado y el perfil como inactivo.
 * Los datos permanecen en BD. Guarda el motivo en booking_events.
 */
export async function cancelarEvento(
  clientId: string,
  bookingId: string,
  motivo: string
): Promise<{ error?: string }> {
  if (!motivo.trim()) return { error: "El motivo es obligatorio" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!caller || !["admin", "wedding_planner"].includes(caller.role)) {
    return { error: "Sin permisos" };
  }

  const admin = createAdminClient();

  const { error: bookingErr } = await admin
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);
  if (bookingErr) return { error: bookingErr.message };

  const { error: profileErr } = await admin
    .from("profiles")
    .update({ is_active: false })
    .eq("id", clientId);
  if (profileErr) return { error: profileErr.message };

  await admin.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "event_cancelled",
    actor_id: user.id,
    notes: motivo.trim(),
  });

  revalidatePath("/portal/planner");
  revalidatePath("/portal/planner/clientes");
  return {};
}
