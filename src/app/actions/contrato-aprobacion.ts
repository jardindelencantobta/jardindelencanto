"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function aprobarContrato(
  bookingId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  // RLS verifica que el booking pertenezca al cliente
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, contract_locked")
    .eq("id", bookingId)
    .eq("client_id", user.id)
    .neq("status", "cancelled")
    .maybeSingle();

  if (!booking) return { error: "Reserva no encontrada" };
  if (booking.contract_locked) return { error: "El contrato ya está aprobado" };

  const admin = createAdminClient();

  // Bloquear contrato
  const { error: lockErr } = await admin
    .from("bookings")
    .update({ contract_locked: true })
    .eq("id", bookingId);
  if (lockErr) return { error: lockErr.message };

  // Inicializar orden de servicio — non-fatal si falla
  const { error: orderErr } = await admin.rpc("initialize_service_order", {
    p_booking_id: bookingId,
  });
  if (orderErr) {
    console.error("[aprobarContrato] Error init order:", orderErr.message);
  }

  // Obtener nombre del cliente para la notificación
  const { data: clientProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const clientName = clientProfile?.full_name ?? "El cliente";

  // Notificar a planners y admin activos
  const { data: staff } = await admin
    .from("profiles")
    .select("id")
    .in("role", ["wedding_planner", "admin"])
    .eq("is_active", true);

  if (staff && staff.length > 0) {
    await admin.from("notifications").insert(
      staff.map((s) => ({
        user_id: s.id,
        title: "Contrato aprobado",
        body: `${clientName} aprobó el contrato. La orden de servicio ha sido inicializada.`,
        type: "contract_approved",
      })),
    );
  }

  revalidatePath("/portal/documentos");
  revalidatePath("/portal/orden-servicio");
  return {};
}

export async function solicitarAjustesContrato(
  bookingId: string,
  mensaje: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  // RLS verifica que el booking pertenezca al cliente
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, contract_locked")
    .eq("id", bookingId)
    .eq("client_id", user.id)
    .neq("status", "cancelled")
    .maybeSingle();

  if (!booking) return { error: "Reserva no encontrada" };
  if (booking.contract_locked) return { error: "El contrato ya está aprobado y no se puede modificar" };

  const admin = createAdminClient();

  const { data: clientProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const clientName = clientProfile?.full_name ?? "El cliente";

  const { data: staff } = await admin
    .from("profiles")
    .select("id")
    .in("role", ["wedding_planner", "admin"])
    .eq("is_active", true);

  if (staff && staff.length > 0) {
    await admin.from("notifications").insert(
      staff.map((s) => ({
        user_id: s.id,
        title: "Ajustes solicitados al contrato",
        body: `${clientName} solicita ajustes: "${mensaje.slice(0, 250)}"`,
        type: "contract_adjustment",
      })),
    );
  }

  return {};
}
