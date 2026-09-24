"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, createRawAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { sendWhatsAppNotification, sendWhatsAppToPhone, buildLeadMessage } from "@/lib/callmebot";
import { WHATSAPP } from "@/config/brand";
import { hoyBogota } from "@/lib/fecha-hoy";
import {
  MAX_EMAIL, MAX_INVITADOS, MAX_MENSAJE, MAX_NOMBRE,
  NOMBRE_REGEX, WHATSAPP_REGEX, normalizarWhatsapp,
} from "@/lib/contacto-validacion";

export type ContactState = { success?: boolean; error?: string } | null;

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(MAX_NOMBRE, `El nombre no puede superar ${MAX_NOMBRE} caracteres`)
    .regex(NOMBRE_REGEX, "El nombre solo puede contener letras y espacios"),
  email: z
    .string()
    .trim()
    .max(MAX_EMAIL, "El correo es demasiado largo")
    .refine(
      (v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Correo electrónico inválido"
    ),
  phone: z.string().optional(),
  whatsapp: z
    .string()
    .min(1, "El número de WhatsApp es requerido")
    .transform(normalizarWhatsapp)
    .refine(
      (v) => WHATSAPP_REGEX.test(v),
      "Número no válido. Ejemplo: 312 866 1699 o +57 312 866 1699"
    ),
  subject: z.string().min(1, "Selecciona el tipo de evento"),
  event_date: z
    .string()
    .min(1, "La fecha estimada es requerida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida")
    .refine((f) => f >= hoyBogota(), "La fecha del evento no puede ser anterior a hoy"),
  guest_count: z
    .string()
    .min(1, "El número de invitados es requerido")
    .regex(/^\d+$/, "El número de invitados debe ser un número entero")
    .refine(
      (v) => Number(v) >= 1 && Number(v) <= MAX_INVITADOS,
      `El número de invitados debe estar entre 1 y ${MAX_INVITADOS}`
    ),
  message: z
    .string()
    .trim()
    .min(5, "Cuéntanos un poco más sobre tu evento")
    .max(MAX_MENSAJE, `El mensaje no puede superar ${MAX_MENSAJE} caracteres`),
  recaptchaToken: z.string(),
  // FormData entrega el checkbox como "true" (o ausente si no está marcado)
  aceptaPolitica: z.preprocess(
    (v) => v === true || v === "true" || v === "on",
    z.boolean().refine((val) => val === true, {
      message: "Debes aceptar la política de privacidad para continuar",
    }),
  ),
});

export async function submitContactForm(
  _prevState: ContactState,
  formData: FormData
): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { recaptchaToken, phone, email, event_date, guest_count, subject, message, whatsapp, name } =
    parsed.data;

  // --- IP rate limiting (capa servidor) ---
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      "unknown";

    const rawAdmin = createRawAdminClient();
    const now = new Date();
    const { data: row } = await rawAdmin
      .from("contact_attempts")
      .select("attempts, last_attempt_at, blocked_until")
      .eq("ip", ip)
      .maybeSingle();

    if (row) {
      // Rechazar si sigue bloqueado
      if (row.blocked_until && new Date(row.blocked_until) > now) {
        return { error: "Has enviado demasiados mensajes. Por favor intenta más tarde." };
      }

      // Calcular intentos en la ventana actual (reset si último intento fue hace más de 1 hora)
      const lastMs = new Date(row.last_attempt_at).getTime();
      const freshWindow = now.getTime() - lastMs > 60 * 60 * 1000;
      const attempts = freshWindow ? 1 : row.attempts + 1;

      if (attempts > 3) {
        // Duración de bloqueo: exponencial — 1h, 2h, 3h (máximo)
        const blockCount = attempts - 3;
        const blockHours = Math.min(Math.pow(2, blockCount - 1), 3);
        const blockedUntil = new Date(now.getTime() + blockHours * 60 * 60 * 1000);
        await rawAdmin.from("contact_attempts").upsert(
          { ip, attempts, last_attempt_at: now.toISOString(), blocked_until: blockedUntil.toISOString() },
          { onConflict: "ip" }
        );
        return { error: "Has enviado demasiados mensajes. Por favor intenta más tarde." };
      }

      await rawAdmin.from("contact_attempts").upsert(
        { ip, attempts, last_attempt_at: now.toISOString(), blocked_until: null },
        { onConflict: "ip" }
      );
    } else {
      await rawAdmin.from("contact_attempts").insert({
        ip,
        attempts: 1,
        last_attempt_at: now.toISOString(),
      });
    }
  } catch {
    // Supabase no disponible — permitir el envío sin bloquear
  }

  // reCAPTCHA v3 — omitido en dev si no está configurado
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (secretKey) {
    if (!recaptchaToken) {
      return { error: "Verificación de seguridad requerida." };
    }
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: secretKey, response: recaptchaToken }),
    });
    const captcha = await res.json();
    if (!captcha.success || captcha.score < 0.5) {
      return { error: "Verificación de seguridad fallida. Inténtalo de nuevo." };
    }
  }

  // Round-robin: asignar al asesor activo con menos asignaciones
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let assignments: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let asesorProfiles: any[] = [];
  try {
    const [assignmentsRes, profilesRes] = await Promise.all([
      admin
        .from("asesor_assignments")
        .select("asesor_id, total_assignments, last_assigned_at")
        .order("total_assignments", { ascending: true })
        .order("last_assigned_at", { ascending: true, nullsFirst: true }),
      admin
        .from("profiles")
        .select("id, full_name, is_active, phone, callmebot_api_key")
        .in("role", ["asesor_comercial", "wedding_planner"]),
    ]);
    assignments = assignmentsRes.data ?? [];
    asesorProfiles = profilesRes.data ?? [];
  } catch {
    // Supabase no disponible — contacto sin asesor asignado
  }

  // Round-robin: incluir asesores activos aunque no tengan fila en asesor_assignments
  const activeAsesores = asesorProfiles.filter((p) => p.is_active);
  console.log(
    "[round-robin] perfiles encontrados:",
    asesorProfiles.map((p) => `${p.full_name}(is_active=${p.is_active})`)
  );
  console.log("[round-robin] activos:", activeAsesores.length);

  const assignmentMap = new Map(
    assignments.map((a) => [a.asesor_id, a])
  );
  const virtualList = activeAsesores.map((p) => ({
    asesor_id: p.id,
    total_assignments: assignmentMap.get(p.id)?.total_assignments ?? 0,
    last_assigned_at: assignmentMap.get(p.id)?.last_assigned_at ?? null,
  }));
  // Comparador válido: null === null → 0 (empate), null antes que fecha
  virtualList.sort((a, b) => {
    if (a.total_assignments !== b.total_assignments)
      return a.total_assignments - b.total_assignments;
    if (a.last_assigned_at === null && b.last_assigned_at === null) return 0;
    if (a.last_assigned_at === null) return -1;
    if (b.last_assigned_at === null) return 1;
    return a.last_assigned_at < b.last_assigned_at ? -1 : 1;
  });

  console.log(
    "[round-robin] orden:",
    virtualList.map((v) => {
      const p = asesorProfiles.find((x) => x.id === v.asesor_id);
      return `${p?.full_name}(total=${v.total_assignments},last=${v.last_assigned_at ?? "null"})`;
    })
  );

  const selected = virtualList[0] ?? null;
  const assignedAsesorId = selected?.asesor_id ?? null;
  const assignedAsesor = asesorProfiles.find((p) => p.id === assignedAsesorId) ?? null;
  const asesorName = assignedAsesor?.full_name ?? "el equipo";
  console.log("[round-robin] seleccionado:", asesorName);

  // Construir mensaje WA antes del insert — disponible tanto en éxito como en fallback
  const waMsg = buildLeadMessage({ name, whatsapp, email: email || null, subject, event_date, guest_count, message, asesorName });

  // Guardar en base de datos
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("contact_messages").insert({
      name,
      email: email || null,
      phone: phone ?? null,
      subject,
      message,
      event_date,
      guest_count,
      whatsapp,
      assigned_asesor_id: assignedAsesorId,
    });

    if (error) throw new Error(error.message);

    // Incrementar contador — upsert maneja tanto nuevo registro como actualización
    if (selected) {
      await admin.from("asesor_assignments").upsert(
        {
          asesor_id: selected.asesor_id,
          total_assignments: selected.total_assignments + 1,
          last_assigned_at: new Date().toISOString(),
        },
        { onConflict: "asesor_id" }
      );
    }
  } catch {
    // Supabase no disponible — intentar notificación CallMeBot y guiar al usuario a WhatsApp
    void sendWhatsAppNotification(waMsg);
    return {
      error:
        `En este momento no podemos registrar tu mensaje. Por favor, escríbenos directamente al WhatsApp ${WHATSAPP.display}`,
    };
  }

  // Notificaciones CallMeBot — fire and forget
  void sendWhatsAppNotification(waMsg);
  if (assignedAsesor?.phone && assignedAsesor?.callmebot_api_key) {
    void sendWhatsAppToPhone(assignedAsesor.phone, assignedAsesor.callmebot_api_key, waMsg);
  }

  return { success: true };
}
