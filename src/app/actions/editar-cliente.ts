"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { GUEST_COUNT_OPTIONS } from "@/lib/guest-count";
import { DEFAULT_CONTRACT_ITEMS } from "@/lib/contract-items";
import type { Database } from "@/types/database";

type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];
type Json = Database["public"]["Tables"]["bookings"]["Row"]["contract_items"];

const schema = z.object({
  full_name:           z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  cc:                  z.string().min(5, "Ingresa la cédula o NIT del cliente"),
  phone:               z.string().min(7, "Ingresa un número de teléfono válido"),
  address:             z.string().min(4, "Ingresa la dirección"),
  email:               z.string().email("Correo inválido"),
  event_type:          z.enum(["boda", "quince", "empresarial", "revelacion"] as const),
  event_date:          z.string().min(1, "La fecha es requerida"),
  event_start_time:    z.string().min(1, "La hora de inicio es requerida"),
  event_end_time:      z.string().min(1, "La hora de fin es requerida"),
  guest_count:         z.coerce
    .number()
    .int()
    .refine(
      (v) => (GUEST_COUNT_OPTIONS as readonly number[]).includes(v),
      { message: `La cantidad de invitados debe ser una de: ${GUEST_COUNT_OPTIONS.join(", ")}` }
    ),
  // Financiero
  valor_total:          z.string().optional(),
  valor_anticipo:       z.string().optional(),
  fecha_segundo_abono:  z.string().optional(),
  valor_segundo_abono:  z.string().optional(),
  fecha_tercer_abono:   z.string().optional(),
  valor_tercer_abono:   z.string().optional(),
  capilla:             z.string().optional(),
  // contract_items como JSON string
  contract_items:      z.string().optional(),
});

export type EditClientState =
  | { error: string; field?: string }
  | { success: true }
  | null;

// ─── Helpers de solapamiento ──────────────────────────────────────────

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function normEnd(start: string, end: string): number {
  const s = toMin(start);
  const e = toMin(end);
  return e >= s ? e : e + 1440;
}

function overlaps(s1: string, e1: string, s2: string, e2: string): boolean {
  return toMin(s1) < normEnd(s2, e2) && toMin(s2) < normEnd(s1, e1);
}

// ─── Action ──────────────────────────────────────────────────────────

export async function editarCliente(
  clientId: string,
  bookingId: string,
  formData: FormData
): Promise<EditClientState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!caller || !["admin", "wedding_planner", "asesor_comercial"].includes(caller.role)) {
    return { error: "Sin permisos" };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first.message, field: first.path[0] as string };
  }

  const d = parsed.data;
  const admin = createAdminClient();

  // Verificar solapamiento de horario — excluir el booking actual
  const { data: sameDay } = await admin
    .from("bookings")
    .select("id, event_start_time, event_end_time")
    .eq("event_date", d.event_date)
    .neq("id", bookingId)
    .neq("status", "cancelled");

  if (sameDay) {
    for (const b of sameDay) {
      if (
        b.event_start_time &&
        b.event_end_time &&
        overlaps(d.event_start_time, d.event_end_time, b.event_start_time, b.event_end_time)
      ) {
        return {
          error: "Ya existe un evento en ese horario. Elige otro horario disponible.",
          field: "event_start_time",
        };
      }
    }
  }

  // Actualizar auth email
  const { error: authErr } = await admin.auth.admin.updateUserById(clientId, {
    email: d.email,
  });
  if (authErr) return { error: `Email: ${authErr.message}` };

  // Actualizar perfil
  const { error: profileErr } = await admin
    .from("profiles")
    .update({ full_name: d.full_name, cc: d.cc, phone: d.phone, address: d.address, email: d.email })
    .eq("id", clientId);
  if (profileErr) return { error: profileErr.message };

  // Parsear contract_items
  let contractItems = DEFAULT_CONTRACT_ITEMS;
  if (d.contract_items) {
    try {
      contractItems = JSON.parse(d.contract_items);
    } catch {
      // usar default si falla el parse
    }
  }

  // Actualizar booking
  const bookingUpdate: BookingUpdate = {
    event_type:       d.event_type,
    event_date:       d.event_date,
    event_start_time: d.event_start_time,
    event_end_time:   d.event_end_time,
    guest_count:      d.guest_count,
    contract_items:   contractItems as unknown as Json,
  };

  if (d.valor_total)         bookingUpdate.valor_total         = parseFloat(d.valor_total);
  if (d.valor_anticipo)      bookingUpdate.valor_anticipo      = parseFloat(d.valor_anticipo);
  if (d.fecha_segundo_abono) bookingUpdate.fecha_segundo_abono = d.fecha_segundo_abono;
  if (d.valor_segundo_abono) bookingUpdate.valor_segundo_abono = parseFloat(d.valor_segundo_abono);
  if (d.fecha_tercer_abono)  bookingUpdate.fecha_tercer_abono  = d.fecha_tercer_abono;
  if (d.valor_tercer_abono)  bookingUpdate.valor_tercer_abono  = parseFloat(d.valor_tercer_abono);
  if (d.capilla === "true") bookingUpdate.capilla = true;
  else if (d.capilla === "false") bookingUpdate.capilla = false;

  const { error: bookingErr } = await admin
    .from("bookings")
    .update(bookingUpdate)
    .eq("id", bookingId);
  if (bookingErr) return { error: bookingErr.message };

  revalidatePath("/portal/planner/clientes");
  revalidatePath(`/portal/planner/clientes/${clientId}/editar`);
  revalidatePath("/portal/planner");
  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${clientId}`);
  return { success: true };
}
