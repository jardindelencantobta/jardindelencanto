"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  createSignedUpload,
  createSignedDownload,
  removeUploadedFile,
} from "@/lib/uploads/server";
import { paymentReceiptPath } from "@/lib/uploads/config";

async function verifyPlanner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." as string, user: null };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "wedding_planner", "asesor_comercial"].includes(profile.role))
    return { error: "Sin permisos" as string, user: null };
  return { error: null, user };
}

async function getOwnBooking(bookingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." as string, user: null };

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings").select("id, client_id").eq("id", bookingId).single();
  if (!booking || booking.client_id !== user.id) return { error: "Sin permisos" as string, user: null };
  return { error: null, user };
}

async function revalidatePagos(clientId: string | null | undefined) {
  revalidatePath("/portal/pagos");
  if (clientId) {
    revalidatePath(`/portal/planner/clientes/${clientId}/pagos`);
    revalidatePath(`/admin/clientes/${clientId}/pagos`);
  }
}

async function notifyPlanners(admin: ReturnType<typeof createAdminClient>, title: string, body: string) {
  const { data: staff } = await admin
    .from("profiles").select("id").in("role", ["admin", "wedding_planner"]);
  if (!staff?.length) return;
  await admin.from("notifications").insert(
    staff.map((s) => ({ user_id: s.id, title, body, type: "payment_receipt" })),
  );
}

// ─── Planner/admin: registrar un pago ──────────────────────────────────

const registrarSchema = z.object({
  bookingId: z.string().uuid(),
  concept: z.string().min(2, "El concepto es requerido"),
  amount: z.number().positive("El monto debe ser mayor a cero"),
  payment_date: z.string().min(1, "La fecha es requerida"),
  payment_method: z.enum(["efectivo", "transferencia", "tarjeta", "cheque", "otro"]),
  notes: z.string().optional(),
});

export type RegistrarPagoData = z.infer<typeof registrarSchema>;

export type PagoRow = {
  id: string;
  concept: string | null;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
  notes: string | null;
  receipt_url: string | null;
};

export async function registrarPago(
  data: RegistrarPagoData,
): Promise<{ payment?: PagoRow; error?: string }> {
  const { error: authErr, user } = await verifyPlanner();
  if (authErr || !user) return { error: authErr ?? "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const parsed = registrarSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const admin = createAdminClient();
  const { data: inserted, error } = await admin.from("payments").insert({
    booking_id: parsed.data.bookingId,
    concept: parsed.data.concept.trim(),
    notes: parsed.data.notes?.trim() || null,
    amount: parsed.data.amount,
    payment_date: parsed.data.payment_date,
    payment_method: parsed.data.payment_method,
    status: "pending",
    recorded_by: user.id,
  }).select("id, concept, amount, payment_date, payment_method, status, notes, receipt_url").single();
  if (error || !inserted) return { error: error?.message ?? "Error al registrar el pago" };

  const { data: booking } = await admin
    .from("bookings").select("client_id").eq("id", parsed.data.bookingId).single();
  await revalidatePagos(booking?.client_id);
  return { payment: inserted };
}

// ─── Cliente: subir comprobante ────────────────────────────────────────

const requestSchema = z.object({
  bookingId: z.string().uuid(),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().positive(),
});

export async function requestComprobanteUpload(
  meta: z.infer<typeof requestSchema>,
): Promise<{ signedUrl?: string; token?: string; path?: string; error?: string }> {
  const parsed = requestSchema.safeParse(meta);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error: authErr } = await getOwnBooking(parsed.data.bookingId);
  if (authErr) return { error: authErr };

  const path = paymentReceiptPath(parsed.data.bookingId, parsed.data.fileName);
  const { upload, error } = await createSignedUpload("payment-receipt", {
    contentType: parsed.data.contentType,
    size: parsed.data.size,
    path,
  });
  if (error || !upload) return { error };

  return { signedUrl: upload.signedUrl, token: upload.token, path: upload.path };
}

const confirmComprobanteSchema = z.object({
  paymentId: z.string().uuid(),
  bookingId: z.string().uuid(),
  path: z.string().min(1),
});

export async function confirmComprobanteUpload(
  meta: z.infer<typeof confirmComprobanteSchema>,
): Promise<{ error?: string }> {
  const parsed = confirmComprobanteSchema.safeParse(meta);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error: authErr } = await getOwnBooking(parsed.data.bookingId);
  if (authErr) return { error: authErr };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("payments").select("receipt_url, booking_id").eq("id", parsed.data.paymentId).single();
  if (!existing || existing.booking_id !== parsed.data.bookingId) {
    await removeUploadedFile("payment-receipt", parsed.data.path);
    return { error: "Pago no encontrado" };
  }

  const { error } = await admin
    .from("payments")
    .update({ receipt_url: parsed.data.path })
    .eq("id", parsed.data.paymentId);
  if (error) {
    await removeUploadedFile("payment-receipt", parsed.data.path);
    return { error: error.message };
  }

  if (existing.receipt_url) await removeUploadedFile("payment-receipt", existing.receipt_url);

  await notifyPlanners(
    admin,
    "Comprobante de pago subido",
    "Un cliente subió un comprobante de pago para revisión.",
  );

  await revalidatePagos(null);
  revalidatePath("/portal/pagos");
  return {};
}

// ─── Planner/admin: confirmar pago ──────────────────────────────────────

export async function confirmarPago(paymentId: string): Promise<{ error?: string }> {
  const { error: authErr } = await verifyPlanner();
  if (authErr) return { error: authErr };

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments").select("booking_id, receipt_url").eq("id", paymentId).single();
  if (!payment) return { error: "Pago no encontrado" };
  if (!payment.receipt_url) return { error: "Este pago aún no tiene comprobante subido" };

  const { error } = await admin
    .from("payments").update({ status: "confirmed" }).eq("id", paymentId);
  if (error) return { error: error.message };

  const { data: booking } = await admin
    .from("bookings").select("client_id").eq("id", payment.booking_id).single();
  if (booking?.client_id) {
    await admin.from("notifications").insert({
      user_id: booking.client_id,
      title: "Pago confirmado",
      body: "Tu comprobante de pago fue revisado y confirmado. ¡Gracias!",
      type: "payment_confirmed",
    });
  }

  await revalidatePagos(booking?.client_id);
  return {};
}

export async function getComprobanteDownloadUrl(paymentId: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("receipt_url, bookings(client_id)")
    .eq("id", paymentId)
    .single();
  if (!payment || !payment.receipt_url) return { error: "Sin comprobante" };

  const isStaff = profile && ["admin", "wedding_planner"].includes(profile.role);
  const isOwner = (payment.bookings as { client_id: string } | null)?.client_id === user.id;
  if (!isStaff && !isOwner) return { error: "Sin permisos" };

  return createSignedDownload("payment-receipt", payment.receipt_url);
}
