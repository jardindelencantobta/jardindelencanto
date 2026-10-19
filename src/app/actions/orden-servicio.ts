"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type OrdenState = { error?: string; success?: boolean } | null;

// ── Cliente: guardar items de música ──────────────────────────────────
export async function saveMusicItems(
  _prev: OrdenState,
  formData: FormData
): Promise<OrdenState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const bookingId = formData.get("bookingId") as string;
  if (!bookingId) return { error: "Booking no especificado" };

  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("id", bookingId)
    .eq("client_id", user.id)
    .maybeSingle();

  if (!booking) return { error: "Reserva no encontrada" };

  for (const [key, val] of formData.entries()) {
    if (key === "bookingId") continue;
    const { error } = await supabase
      .from("service_order_items")
      .update({ value: val as string })
      .eq("id", key)
      .eq("filled_by", "client");
    if (error) return { error: error.message };
  }

  revalidatePath("/portal/orden-servicio");
  return { success: true };
}

// ── Cliente: aprobar orden ────────────────────────────────────────────
export async function approveServiceOrder(
  bookingId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const { error } = await supabase
    .from("bookings")
    .update({
      service_order_approved: true,
      service_order_approved_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("client_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/portal/orden-servicio");
  return {};
}

// ── Planner: guardar items de cabecera/bebidas ────────────────────────
export async function savePlannerItems(
  _prev: OrdenState,
  formData: FormData
): Promise<OrdenState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    !["admin", "wedding_planner"].includes(profile.role)
  ) {
    return { error: "Sin permisos" };
  }

  const bookingId = formData.get("bookingId") as string;
  if (!bookingId) return { error: "Booking no especificado" };

  for (const [key, val] of formData.entries()) {
    if (key === "bookingId") continue;
    const { error } = await supabase
      .from("service_order_items")
      .update({ value: val as string })
      .eq("id", key)
      .eq("filled_by", "planner");
    if (error) return { error: error.message };
  }

  revalidatePath(`/portal/planner/orden-servicio/${bookingId}`);
  return { success: true };
}

// ── Planner: inicializar orden de servicio ────────────────────────────
// motivo: requerido al reinicializar (orden ya existía), opcional en primer init.
export async function initServiceOrder(
  bookingId: string,
  motivo?: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const { error } = await supabase.rpc("initialize_service_order", {
    p_booking_id: bookingId,
  });
  if (error) return { error: error.message };

  if (motivo?.trim()) {
    await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: "service_order_reinit",
      actor_id: user.id,
      notes: motivo.trim(),
    });
  }

  revalidatePath(`/portal/planner/orden-servicio/${bookingId}`);
  return {};
}
