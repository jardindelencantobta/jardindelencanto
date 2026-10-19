"use server";

import { createClient } from "@/lib/supabase/server";
import { createRawAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function verifyEditor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." as const };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role as string))
    return { error: "Sin permisos" as const };
  return { error: null };
}

export type PromocionRow = {
  id: string;
  imagen_url: string;
  fecha_inicio: string;
  fecha_fin: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

function revalidate() {
  revalidatePath("/editor/promociones");
  revalidatePath("/");
}

export async function createPromocion(
  data: Omit<PromocionRow, "id" | "created_at">,
): Promise<{ row?: PromocionRow; error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  if (!data.imagen_url) return { error: "La imagen es requerida" };
  if (!data.fecha_inicio || !data.fecha_fin) return { error: "Las fechas son requeridas" };
  if (data.fecha_fin < data.fecha_inicio) return { error: "La fecha de fin debe ser posterior a la de inicio" };

  const db = createRawAdminClient();
  const { data: row, error } = await db
    .from("promociones")
    .insert({
      imagen_url: data.imagen_url,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
      sort_order: data.sort_order,
      is_active: data.is_active,
    })
    .select("id, imagen_url, fecha_inicio, fecha_fin, sort_order, is_active, created_at")
    .single();

  if (error) return { error: (error as { message: string }).message };
  revalidate();
  return { row: row as PromocionRow };
}

export async function updatePromocion(
  id: string,
  data: Partial<Omit<PromocionRow, "id" | "created_at">>,
): Promise<{ row?: PromocionRow; error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  if (data.fecha_inicio && data.fecha_fin && data.fecha_fin < data.fecha_inicio)
    return { error: "La fecha de fin debe ser posterior a la de inicio" };

  const db = createRawAdminClient();
  const { data: row, error } = await db
    .from("promociones")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, imagen_url, fecha_inicio, fecha_fin, sort_order, is_active, created_at")
    .single();

  if (error) return { error: (error as { message: string }).message };
  revalidate();
  return { row: row as PromocionRow };
}

export async function deletePromocion(id: string): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };

  const db = createRawAdminClient();
  const { error } = await db.from("promociones").delete().eq("id", id);
  if (error) return { error: (error as { message: string }).message };
  revalidate();
  return {};
}

export async function togglePromocionActiva(
  id: string,
  isActive: boolean,
): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };

  const db = createRawAdminClient();
  const { error } = await db
    .from("promociones")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: (error as { message: string }).message };
  revalidate();
  return {};
}
