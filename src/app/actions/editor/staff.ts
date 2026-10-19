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

export type StaffData = {
  nombre: string;
  cargo: string;
  descripcion?: string | null;
  foto_url?: string | null;
  is_aliado_externo?: boolean;
  frase?: string | null;
};

export type StaffRow = {
  id: string;
  nombre: string;
  cargo: string;
  descripcion: string | null;
  foto_url: string | null;
  sort_order: number;
  is_active: boolean;
  is_aliado_externo: boolean;
  frase: string | null;
};

function revalidate() {
  revalidatePath("/editor/staff");
  revalidatePath("/");
}

export async function createStaffMember(
  data: StaffData,
): Promise<{ row?: StaffRow; error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  if (!data.nombre.trim()) return { error: "El nombre es requerido" };
  if (!data.cargo.trim()) return { error: "El cargo es requerido" };

  const db = createRawAdminClient();
  const { data: last } = await db
    .from("staff").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const sortOrder = (last?.sort_order ?? 0) + 1;

  const { data: row, error } = await db
    .from("staff")
    .insert({
      nombre: data.nombre.trim(),
      cargo: data.cargo.trim(),
      descripcion: data.descripcion?.trim() || null,
      foto_url: data.foto_url || null,
      sort_order: sortOrder,
      is_aliado_externo: data.is_aliado_externo ?? false,
      frase: data.frase?.trim() || null,
    })
    .select("id,nombre,cargo,descripcion,foto_url,sort_order,is_active,is_aliado_externo,frase")
    .single();

  if (error) return { error: (error as { message: string }).message };
  revalidate();
  return { row: row as StaffRow };
}

export async function updateStaffMember(
  id: string,
  data: Partial<StaffData>,
): Promise<{ row?: StaffRow; error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };

  const db = createRawAdminClient();
  const { data: row, error } = await db
    .from("staff")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id,nombre,cargo,descripcion,foto_url,sort_order,is_active,is_aliado_externo,frase")
    .single();

  if (error) return { error: (error as { message: string }).message };
  revalidate();
  return { row: row as StaffRow };
}

export async function deleteStaffMember(id: string): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };

  const db = createRawAdminClient();
  const { error } = await db.from("staff").delete().eq("id", id);
  if (error) return { error: (error as { message: string }).message };
  revalidate();
  return {};
}

export async function toggleStaffActive(
  id: string,
  isActive: boolean,
): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };

  const db = createRawAdminClient();
  const { error } = await db
    .from("staff")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: (error as { message: string }).message };
  revalidate();
  return {};
}

export async function moveStaffMember(
  id: string,
  direction: "up" | "down",
): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };

  const db = createRawAdminClient();

  const { data: current } = await db
    .from("staff").select("sort_order,is_aliado_externo").eq("id", id).single();
  if (!current) return { error: "Miembro no encontrado" };

  // Solo se reordena dentro del mismo grupo (equipo interno o aliados externos).

  const { data: adjacent } = direction === "up"
    ? await db.from("staff")
        .select("id,sort_order")
        .eq("is_aliado_externo", current.is_aliado_externo)
        .lt("sort_order", current.sort_order)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle()
    : await db.from("staff")
        .select("id,sort_order")
        .eq("is_aliado_externo", current.is_aliado_externo)
        .gt("sort_order", current.sort_order)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();

  if (!adjacent) return {};

  await db.from("staff").update({ sort_order: adjacent.sort_order }).eq("id", id);
  await db.from("staff").update({ sort_order: current.sort_order }).eq("id", adjacent.id);

  revalidate();
  return {};
}
