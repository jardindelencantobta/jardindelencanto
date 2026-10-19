"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type ActividadData = {
  title: string;
  activity_date: string;
  activity_time?: string;
  location?: string;
  notes?: string;
};

export type ActividadRow = {
  id: string;
  title: string;
  activity_date: string;
  activity_time: string | null;
  location: string | null;
  notes: string | null;
};

async function verifyPlanner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." as string, user: null, supabase };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "wedding_planner"].includes(profile.role))
    return { error: "Sin permisos" as string, user: null, supabase };
  return { error: null, user, supabase };
}

export async function createActivity(
  bookingId: string,
  data: ActividadData
): Promise<{ activity?: ActividadRow; error?: string }> {
  const { error: authErr, user } = await verifyPlanner();
  if (authErr || !user) return { error: authErr ?? "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  if (!data.title.trim()) return { error: "El título es requerido" };
  if (!data.activity_date) return { error: "La fecha es requerida" };

  const admin = createAdminClient();

  // Obtener client_id del booking para la notificación
  const { data: booking } = await admin
    .from("bookings").select("client_id").eq("id", bookingId).single();

  const { data: inserted, error } = await admin.from("client_activities").insert({
    booking_id:    bookingId,
    title:         data.title.trim(),
    activity_date: data.activity_date,
    activity_time: data.activity_time || null,
    location:      data.location?.trim() || null,
    notes:         data.notes?.trim() || null,
    created_by:    user.id,
  }).select("id, title, activity_date, activity_time, location, notes").single();
  if (error || !inserted) return { error: error?.message ?? "Error al crear la actividad" };

  // Notificar al cliente
  if (booking?.client_id) {
    await admin.from("notifications").insert({
      user_id: booking.client_id,
      title:   `Nueva actividad: ${data.title.trim()}`,
      body:    data.activity_date,
      type:    "new_activity",
    });
  }

  revalidatePath(`/portal/planner/clientes/${booking?.client_id}/actividades`);
  revalidatePath("/portal/actividades");
  return { activity: inserted };
}

export async function updateActivity(
  id: string,
  data: ActividadData
): Promise<{ activity?: ActividadRow; error?: string }> {
  const { error: authErr } = await verifyPlanner();
  if (authErr) return { error: authErr };

  const admin = createAdminClient();
  const { data: act } = await admin
    .from("client_activities").select("booking_id").eq("id", id).single();

  const { data: updated, error } = await admin.from("client_activities").update({
    title:         data.title.trim(),
    activity_date: data.activity_date,
    activity_time: data.activity_time || null,
    location:      data.location?.trim() || null,
    notes:         data.notes?.trim() || null,
  }).eq("id", id).select("id, title, activity_date, activity_time, location, notes").single();
  if (error || !updated) return { error: error?.message ?? "Error al actualizar la actividad" };

  revalidatePath("/portal/actividades");
  if (act?.booking_id) {
    const { data: b } = await admin
      .from("bookings").select("client_id").eq("id", act.booking_id).single();
    if (b?.client_id)
      revalidatePath(`/portal/planner/clientes/${b.client_id}/actividades`);
  }
  return { activity: updated };
}

export async function deleteActivity(id: string): Promise<{ error?: string }> {
  const { error: authErr } = await verifyPlanner();
  if (authErr) return { error: authErr };

  const admin = createAdminClient();
  const { data: act } = await admin
    .from("client_activities").select("booking_id").eq("id", id).single();

  const { error } = await admin.from("client_activities").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/portal/actividades");
  if (act?.booking_id) {
    const { data: b } = await admin
      .from("bookings").select("client_id").eq("id", act.booking_id).single();
    if (b?.client_id)
      revalidatePath(`/portal/planner/clientes/${b.client_id}/actividades`);
  }
  return {};
}
