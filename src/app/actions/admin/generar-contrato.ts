"use server";

import fs from "fs";
import path from "path";
import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ContratoPDF } from "@/components/contrato/ContratoPDF";
import {
  coerceContractItems,
  CLAUSULA_KEYS,
  FIRMA_KEY,
  HACIENDA_CONTENT_KEYS,
  resolveHaciendaData,
} from "@/lib/contract-items";
import { uploadToColombiaHosting } from "@/lib/uploads/colombia-hosting";

async function verifyPlanner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" as string, userId: "" };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "wedding_planner", "asesor_comercial"].includes(profile.role))
    return { error: "Sin permisos" as string, userId: "" };
  return { error: null, userId: user.id };
}

export async function generarContratoPDF(
  clientId: string,
  otroSi?: string,
): Promise<{ documentId?: string; title?: string; error?: string }> {
  const { error: authErr, userId } = await verifyPlanner();
  if (authErr) return { error: authErr };

  const admin = createAdminClient();

  // Fetch datos del cliente
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email, phone, address, cc")
    .eq("id", clientId)
    .single();
  if (!profile) return { error: "Cliente no encontrado" };

  // Validar datos obligatorios del cliente
  const missingFields: string[] = [];
  if (!profile.cc)      missingFields.push("Cédula (CC)");
  if (!profile.address) missingFields.push("Dirección");
  if (!profile.phone)   missingFields.push("Teléfono");
  if (!profile.email)   missingFields.push("Correo electrónico");
  if (missingFields.length > 0) {
    return {
      error: `Faltan datos obligatorios del cliente: ${missingFields.join(", ")}. Completa esta información antes de generar el contrato.`,
    };
  }

  console.log("[generarContratoPDF] datos cliente →", {
    phone: profile.phone,
    address: profile.address,
    email: profile.email,
    cc: profile.cc,
  });

  // Fetch booking activo
  const { data: booking } = await admin
    .from("bookings")
    .select("id, event_type, event_date, event_start_time, event_end_time, guest_count, capilla, valor_total, valor_anticipo, fecha_segundo_abono, valor_segundo_abono, fecha_tercer_abono, valor_tercer_abono, contract_items, status")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (!booking) return { error: "No se encontró un evento activo para este cliente" };
  if (!booking.valor_total) return { error: "Ingresa el valor total del evento antes de generar el contrato." };
  if (!booking.valor_anticipo) return { error: "Ingresa el valor del anticipo antes de generar el contrato." };

  // Fetch cláusulas, firma y datos editables de la hacienda
  const allContentKeys = [
    ...CLAUSULA_KEYS,
    FIRMA_KEY,
    ...Object.values(HACIENDA_CONTENT_KEYS),
  ];
  const { data: contentRows } = await admin
    .from("site_content")
    .select("key, content")
    .in("key", allContentKeys);

  const contentMap: Record<string, string | null> = {};
  for (const r of contentRows ?? []) contentMap[r.key] = r.content ?? null;

  const clauses = CLAUSULA_KEYS.map((k) => contentMap[k] ?? "");
  const firmaUrl = contentMap[FIRMA_KEY] ?? null;
  const haciendaData = resolveHaciendaData(contentMap);

  // Cláusulas adicionales
  const { data: extraRows } = await admin
    .from("site_content")
    .select("key, content")
    .like("key", "contrato_clausula_extra_%")
    .order("key");
  const extraClauses = (extraRows ?? [])
    .filter((r) => r.content?.trim())
    .map((r) => ({ text: r.content ?? "" }));

  // Determinar número de versión
  const { count } = await admin
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", booking.id)
    .eq("type", "contrato");
  const version = (count ?? 0) + 1;

  // Nombre del archivo: {TipoEvento} {DD-MM-YYYY} {NombreCliente}
  const EVENT_LABEL_FILENAME: Record<string, string> = {
    boda: "Boda", quince: "Quinceañera", empresarial: "Empresarial", revelacion: "Revelacion",
  };
  function fmtDateDDMMYYYY(d: string | null) {
    if (!d) return "Fecha";
    const [y, m, day] = d.split("-");
    return `${day}-${m}-${y}`;
  }
  function sanitizeName(n: string) {
    // ̀-ͯ = combining diacritical marks (removes accents after NFD decompose)
    return n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w\s-]/g, "").trim();
  }
  const tipoLabel = EVENT_LABEL_FILENAME[booking.event_type ?? ""] ?? "Evento";
  const dateStr   = fmtDateDDMMYYYY(booking.event_date);
  const nameStr   = sanitizeName(profile.full_name ?? profile.email);
  const pdfTitle  = `${tipoLabel} ${dateStr} ${nameStr}`;

  // Leer PNG pre-generado del logo (public/logo-hacienda.png)
  let logoDataUri: string | null = null;
  try {
    const logoPng = fs.readFileSync(path.join(process.cwd(), "public", "logo-hacienda.png"));
    logoDataUri = `data:image/png;base64,${logoPng.toString("base64")}`;
  } catch {
    // Logo no disponible, el PDF usará fallback de texto
  }

  // Generar PDF
  const generatedAt = new Date().toLocaleDateString("es-CO", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const pdfBuffer = await renderToBuffer(
    React.createElement(ContratoPDF, {
      clientName: profile.full_name ?? profile.email,
      clientCc: profile.cc!,
      clientPhone: profile.phone ?? "",
      clientAddress: profile.address ?? "",
      clientEmail: profile.email,
      eventType: booking.event_type ?? "boda",
      eventDate: booking.event_date ?? "",
      eventStartTime: booking.event_start_time ?? "",
      eventEndTime: booking.event_end_time ?? "",
      guestCount: booking.guest_count ?? 0,
      capilla: booking.capilla ?? null,
      valorTotal: booking.valor_total,
      valorAnticipo: booking.valor_anticipo,
      fechaSegundoAbono: booking.fecha_segundo_abono ?? null,
      valorSegundoAbono: booking.valor_segundo_abono ?? null,
      fechaTercerAbono: booking.fecha_tercer_abono ?? null,
      valorTercerAbono: booking.valor_tercer_abono ?? null,
      contractItems: coerceContractItems(booking.contract_items),
      clauses,
      extraClauses,
      firmaUrl,
      logoUrl: logoDataUri,
      version,
      generatedAt,
      otroSi: otroSi?.trim() || undefined,
      haciendaData,
    }) as unknown as React.ReactElement<DocumentProps>
  );

  // Subir a Colombia Hosting
  const { url: pdfUrl, error: uploadErr } = await uploadToColombiaHosting(
    pdfBuffer,
    "documentos/contratos",
  );
  if (uploadErr || !pdfUrl) {
    return { error: `Error al subir el PDF: ${uploadErr ?? "URL no recibida"}` };
  }

  // Insertar en documents
  const { data: inserted, error: dbErr } = await admin
    .from("documents")
    .insert({
      booking_id: booking.id,
      title: pdfTitle,
      file_url: pdfUrl,
      type: "contrato",
      created_by: userId,
    })
    .select("id")
    .single();

  if (dbErr || !inserted) {
    return { error: dbErr?.message ?? "Error al guardar el documento" };
  }

  // Notificar al cliente
  await admin.from("notifications").insert({
    user_id: clientId,
    title: "Tu contrato está listo",
    body: "El equipo de Jardín El Encanto ha generado el contrato de tu evento. Puedes revisarlo en la sección Documentos.",
    type: "new_document",
  });

  revalidatePath("/portal/documentos");
  revalidatePath(`/portal/planner/clientes/${clientId}/documentos`);
  revalidatePath(`/admin/clientes/${clientId}/documentos`);
  return { documentId: inserted.id, title: pdfTitle };
}

export async function eliminarHistorialContratos(
  clientId: string,
  bookingId: string,
): Promise<{ error?: string }> {
  const { error: authErr } = await verifyPlanner();
  if (authErr) return { error: authErr };

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select("contract_locked")
    .eq("id", bookingId)
    .single();

  if (booking?.contract_locked) {
    return { error: "El contrato está bloqueado y no se puede eliminar el historial." };
  }

  const { data: docs } = await admin
    .from("documents")
    .select("id, file_url")
    .eq("booking_id", bookingId)
    .eq("type", "contrato");

  if (!docs || docs.length === 0) return {};

  // Nota: los PDFs en Colombia Hosting no se eliminan (no hay endpoint de borrado).
  // Solo se limpia el registro en BD.
  await admin
    .from("documents")
    .delete()
    .eq("booking_id", bookingId)
    .eq("type", "contrato");

  revalidatePath(`/portal/planner/clientes/${clientId}/contrato`);
  revalidatePath(`/admin/clientes/${clientId}/documentos`);
  return {};
}
