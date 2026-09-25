"use server";

import fs from "fs";
import path from "path";
import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { createRawAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { CotizacionPDF } from "@/components/cotizaciones/CotizacionPDF";
import { uploadToHosting } from "@/lib/uploads/server";
import {
  calcularPrecio,
  generarSecciones,
  type CotizacionConfig,
  type TipoEvento,
  type DiaSemana,
  TIPO_EVENTO_LABELS,
  DIA_SEMANA_LABELS,
} from "@/lib/cotizacion";

async function verifyAsesorOrPlanner(): Promise<{ error: string | null; userId: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado", userId: "" };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (
    !profile ||
    !["admin", "asesor_comercial", "wedding_planner"].includes(profile.role as string)
  )
    return { error: "Sin permisos", userId: "" };
  return { error: null, userId: user.id };
}

async function verifyAdmin(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return { error: "Sin permisos" };
  return { error: null };
}

export type ConfigRow = {
  id: string;
  clave: string;
  valor: number;
  descripcion: string;
};

const CONFIG_DEFAULTS: CotizacionConfig = {
  precio_por_persona: 120000,
  costo_fijo_hacienda: 6000000,
  costo_adicional: 2500000,
  costo_base_menos_60: 14400000,
  ajuste_por_invitado_menos_60: 35000,
  fee_porcentaje: 36,
  descuento_volumen_menor_68: 15,
  descuento_volumen_mayor_69: 20,
  descuento_sabado_noche: 20,
  descuento_viernes: 30,
  descuento_domingo: 35,
  descuento_sabado_dia_lunes_jueves: 40,
};

async function loadConfig(): Promise<CotizacionConfig> {
  try {
    const db = createRawAdminClient();
    const { data } = await db
      .from("cotizacion_config")
      .select("clave, valor");
    const map: Record<string, number> = {};
    for (const r of data ?? []) map[(r as { clave: string; valor: number }).clave] = Number((r as { clave: string; valor: number }).valor);
    return {
      precio_por_persona: map.precio_por_persona ?? CONFIG_DEFAULTS.precio_por_persona,
      costo_fijo_hacienda: map.costo_fijo_hacienda ?? CONFIG_DEFAULTS.costo_fijo_hacienda,
      costo_adicional: map.costo_adicional ?? CONFIG_DEFAULTS.costo_adicional,
      costo_base_menos_60: map.costo_base_menos_60 ?? CONFIG_DEFAULTS.costo_base_menos_60,
      ajuste_por_invitado_menos_60: map.ajuste_por_invitado_menos_60 ?? CONFIG_DEFAULTS.ajuste_por_invitado_menos_60,
      fee_porcentaje: map.fee_porcentaje ?? CONFIG_DEFAULTS.fee_porcentaje,
      descuento_volumen_menor_68: map.descuento_volumen_menor_68 ?? CONFIG_DEFAULTS.descuento_volumen_menor_68,
      descuento_volumen_mayor_69: map.descuento_volumen_mayor_69 ?? CONFIG_DEFAULTS.descuento_volumen_mayor_69,
      descuento_sabado_noche: map.descuento_sabado_noche ?? CONFIG_DEFAULTS.descuento_sabado_noche,
      descuento_viernes: map.descuento_viernes ?? CONFIG_DEFAULTS.descuento_viernes,
      descuento_domingo: map.descuento_domingo ?? CONFIG_DEFAULTS.descuento_domingo,
      descuento_sabado_dia_lunes_jueves: map.descuento_sabado_dia_lunes_jueves ?? CONFIG_DEFAULTS.descuento_sabado_dia_lunes_jueves,
    };
  } catch {
    return CONFIG_DEFAULTS;
  }
}

export async function fetchCotizacionConfig(): Promise<{
  config: CotizacionConfig;
  rows: ConfigRow[];
  error?: string;
}> {
  const { error: authErr } = await verifyAsesorOrPlanner();
  if (authErr) return { config: CONFIG_DEFAULTS, rows: [], error: authErr };

  try {
    const db = createRawAdminClient();
    const { data, error } = await db
      .from("cotizacion_config")
      .select("id, clave, valor, descripcion")
      .order("clave");
    if (error) throw error;

    const rows = (data ?? []) as ConfigRow[];
    const map: Record<string, number> = {};
    for (const r of rows) map[r.clave] = Number(r.valor);

    const config: CotizacionConfig = {
      precio_por_persona: map.precio_por_persona ?? CONFIG_DEFAULTS.precio_por_persona,
      costo_fijo_hacienda: map.costo_fijo_hacienda ?? CONFIG_DEFAULTS.costo_fijo_hacienda,
      costo_adicional: map.costo_adicional ?? CONFIG_DEFAULTS.costo_adicional,
      costo_base_menos_60: map.costo_base_menos_60 ?? CONFIG_DEFAULTS.costo_base_menos_60,
      ajuste_por_invitado_menos_60: map.ajuste_por_invitado_menos_60 ?? CONFIG_DEFAULTS.ajuste_por_invitado_menos_60,
      fee_porcentaje: map.fee_porcentaje ?? CONFIG_DEFAULTS.fee_porcentaje,
      descuento_volumen_menor_68: map.descuento_volumen_menor_68 ?? CONFIG_DEFAULTS.descuento_volumen_menor_68,
      descuento_volumen_mayor_69: map.descuento_volumen_mayor_69 ?? CONFIG_DEFAULTS.descuento_volumen_mayor_69,
      descuento_sabado_noche: map.descuento_sabado_noche ?? CONFIG_DEFAULTS.descuento_sabado_noche,
      descuento_viernes: map.descuento_viernes ?? CONFIG_DEFAULTS.descuento_viernes,
      descuento_domingo: map.descuento_domingo ?? CONFIG_DEFAULTS.descuento_domingo,
      descuento_sabado_dia_lunes_jueves: map.descuento_sabado_dia_lunes_jueves ?? CONFIG_DEFAULTS.descuento_sabado_dia_lunes_jueves,
    };

    return { config, rows };
  } catch (err) {
    return { config: CONFIG_DEFAULTS, rows: [], error: (err as { message?: string }).message ?? "Error al cargar configuración" };
  }
}

export async function generarCotizacionPDF(data: {
  tipoEvento: TipoEvento;
  nombreCliente: string;
  fechaEvento: string;
  promoHasta: string;
  numInvitados: number;
  diaSemana: DiaSemana;
  whatsappCliente?: string;
}): Promise<{ pdfUrl?: string; cotizacionId?: string; error?: string }> {
  const { error: authErr, userId } = await verifyAsesorOrPlanner();
  if (authErr) return { error: authErr };

  if (!data.nombreCliente.trim()) return { error: "El nombre del cliente es requerido" };
  if (data.numInvitados < 10) return { error: "El número mínimo de invitados es 10" };
  if (!data.fechaEvento) return { error: "La fecha del evento es requerida" };
  if (!data.promoHasta) return { error: "La fecha de validez de la promoción es requerida" };

  const config = await loadConfig();
  const precioTotal = calcularPrecio(data.numInvitados, data.diaSemana, config);
  const secciones = generarSecciones(data.tipoEvento, data.numInvitados);

  let logoUrl: string | null = null;
  try {
    const logoPng = fs.readFileSync(path.join(process.cwd(), "public", "logo-jardin-pdf.png"));
    logoUrl = `data:image/png;base64,${logoPng.toString("base64")}`;
  } catch {
    // no logo, PDF usará fallback texto
  }

  const generatedAt = new Date().toLocaleDateString("es-CO", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const pdfBuffer = await renderToBuffer(
    React.createElement(CotizacionPDF, {
      tipoEvento: data.tipoEvento,
      tipoEventoLabel: TIPO_EVENTO_LABELS[data.tipoEvento],
      nombreCliente: data.nombreCliente,
      fechaEvento: data.fechaEvento,
      promoHasta: data.promoHasta,
      numInvitados: data.numInvitados,
      diaSemana: data.diaSemana,
      diaSemanaLabel: DIA_SEMANA_LABELS[data.diaSemana],
      precioTotal,
      secciones,
      logoUrl,
      generatedAt,
      config,
    }) as unknown as React.ReactElement<DocumentProps>
  );

  const { url: pdfUrl, error: uploadErr } = await uploadToHosting(
    new Uint8Array(pdfBuffer).buffer,
    "cotizaciones",
    "cotizacion.pdf",
    "application/pdf",
  );
  if (uploadErr || !pdfUrl) {
    return { error: `Error al subir el PDF: ${uploadErr ?? "URL no recibida"}` };
  }

  const db = createRawAdminClient();
  const { data: inserted } = await db
    .from("cotizaciones")
    .insert({
      created_by: userId,
      tipo_evento: data.tipoEvento,
      nombre_cliente: data.nombreCliente,
      fecha_evento: data.fechaEvento || null,
      promo_hasta: data.promoHasta || null,
      num_invitados: data.numInvitados,
      dia_semana: data.diaSemana,
      precio_calculado: precioTotal,
      pdf_url: pdfUrl,
      whatsapp_cliente: data.whatsappCliente || null,
    })
    .select("id")
    .single();

  return { pdfUrl, cotizacionId: (inserted as { id?: string } | null)?.id };
}

export async function updateCotizacionConfig(
  clave: string,
  valor: number,
): Promise<{ error?: string }> {
  const { error: authErr } = await verifyAdmin();
  if (authErr) return { error: authErr };

  const db = createRawAdminClient();
  const { error } = await db
    .from("cotizacion_config")
    .update({ valor, updated_at: new Date().toISOString() })
    .eq("clave", clave);

  if (error) return { error: (error as { message: string }).message };

  revalidatePath("/admin/cotizaciones-config");
  return {};
}
