"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { GUEST_COUNT_OPTIONS } from "@/lib/guest-count";

// ─── Schema ───────────────────────────────────────────────────────────

const schema = z
  .object({
    full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    cc: z.string().min(5, "Ingresa la cédula o NIT del cliente"),
    phone: z.string().min(7, "Ingresa un número de teléfono válido"),
    address: z.string().min(4, "Ingresa la dirección de residencia"),
    email: z.string().email("El correo electrónico no es válido"),
    password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres"),
    event_type: z.enum(
      ["boda", "quince", "empresarial", "revelacion"] as const,
      { message: "Selecciona el tipo de evento" }
    ),
    event_date: z.string().min(1, "La fecha del evento es requerida"),
    event_start_time: z.string().min(1, "La hora de inicio es requerida"),
    event_end_time: z.string().min(1, "La hora de fin es requerida"),
    guest_count: z.coerce
      .number()
      .int()
      .refine(
        (v) => (GUEST_COUNT_OPTIONS as readonly number[]).includes(v),
        {
          message: `La cantidad de invitados debe ser una de: ${GUEST_COUNT_OPTIONS.join(", ")}`,
        }
      ),
  })
  .refine(
    (d) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(d.event_date + "T00:00:00") >= today;
    },
    {
      message: "La fecha del evento no puede ser en el pasado",
      path: ["event_date"],
    }
  );

// ─── Tipos ────────────────────────────────────────────────────────────

export type CreateClientState =
  | { error: string; field?: string }
  | { success: true; bookingId: string }
  | null;

// ─── Helpers de solapamiento de horario ──────────────────────────────

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function normEnd(start: string, end: string): number {
  const s = toMin(start);
  const e = toMin(end);
  // Si end < start el evento cruza la medianoche → sumar 24h
  return e >= s ? e : e + 1440;
}

function overlaps(s1: string, e1: string, s2: string, e2: string): boolean {
  const start1 = toMin(s1);
  const end1 = normEnd(s1, e1);
  const start2 = toMin(s2);
  const end2 = normEnd(s2, e2);
  return start1 < end2 && start2 < end1;
}

// ─── Action principal ─────────────────────────────────────────────────

export async function createClientAction(
  _prev: CreateClientState,
  formData: FormData
): Promise<CreateClientState> {
  // 0 — Verificar que el llamador es planner o admin (SSR client con sesión)
  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();
  if (!caller) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (
    !callerProfile ||
    !["admin", "wedding_planner"].includes(callerProfile.role)
  ) {
    return { error: "Sin permisos para crear clientes" };
  }

  // 1 — Validar datos del formulario
  const parsed = schema.safeParse({
    full_name: formData.get("full_name"),
    cc: formData.get("cc"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    email: formData.get("email"),
    password: formData.get("password"),
    event_type: formData.get("event_type"),
    event_date: formData.get("event_date"),
    event_start_time: formData.get("event_start_time"),
    event_end_time: formData.get("event_end_time"),
    guest_count: formData.get("guest_count"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first.message, field: first.path[0] as string };
  }

  const d = parsed.data;

  // A partir de aquí usamos el admin client (bypasa RLS) para todas las
  // operaciones de base de datos. La auth SSR solo se usó para verificar
  // el rol del llamador.
  const admin = createAdminClient();

  // 2 — Verificar conflicto de horario
  const { data: sameDay } = await admin
    .from("bookings")
    .select("id, event_start_time, event_end_time")
    .eq("event_date", d.event_date)
    .neq("status", "cancelled");

  if (sameDay && sameDay.length > 0) {
    for (const b of sameDay) {
      if (
        b.event_start_time &&
        b.event_end_time &&
        overlaps(
          d.event_start_time,
          d.event_end_time,
          b.event_start_time,
          b.event_end_time
        )
      ) {
        return {
          error:
            "Ya existe un evento en ese horario. Por favor elige otro horario disponible.",
          field: "event_start_time",
        };
      }
    }
  }

  let createdUserId: string | null = null;
  let createdBookingId: string | null = null;

  try {
    // 3 — Crear usuario en Supabase Auth
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email: d.email,
        password: d.password,
        email_confirm: true,
        user_metadata: { full_name: d.full_name },
      });

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists")
      ) {
        return { error: "Este correo ya está registrado", field: "email" };
      }
      return { error: `Error al crear usuario: ${authError.message}` };
    }

    createdUserId = authData.user.id;

    // 4 — Actualizar perfil (trigger handle_new_user ya lo creó con email + full_name)
    const { error: profileError } = await admin
      .from("profiles")
      .update({ phone: d.phone, address: d.address, cc: d.cc })
      .eq("id", createdUserId);

    if (profileError) {
      throw new Error(`Error actualizando perfil: ${profileError.message}`);
    }

    // 5 — Obtener espacio principal
    const { data: space } = await admin
      .from("spaces")
      .select("id")
      .eq("slug", "salon-principal")
      .maybeSingle();

    if (!space?.id) {
      throw new Error(
        "No se encontró el espacio 'salon-principal' en la base de datos"
      );
    }

    // 6 — Crear reserva
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .insert({
        client_id: createdUserId,
        space_id: space.id,
        event_type: d.event_type,
        event_date: d.event_date,
        event_start_time: d.event_start_time,
        event_end_time: d.event_end_time,
        guest_count: d.guest_count,
        status: "pending",
        total_amount: 0,
      })
      .select("id")
      .single();

    if (bookingError) {
      throw new Error(`Error creando reserva: ${bookingError.message}`);
    }

    createdBookingId = booking.id;

    // La orden de servicio se inicializa cuando el cliente aprueba el contrato
    // (aprobarContrato SA), no al crear el cliente.
    return { success: true, bookingId: createdBookingId };
  } catch (err) {
    // Rollback en orden inverso
    if (createdBookingId) {
      await admin.from("bookings").delete().eq("id", createdBookingId);
    }
    if (createdUserId) {
      await admin.auth.admin.deleteUser(createdUserId);
    }
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return { error: msg };
  }
}
