"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function verifyEditor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." as string };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role as string))
    return { error: "Sin permisos" as string };
  return { error: null };
}

export type PaqueteData = {
  name: string;
  event_type: string;
  description: string;
  includes: string[];
  is_active: boolean;
};

export async function createPaquete(data: PaqueteData): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  if (!data.name.trim()) return { error: "El nombre es requerido" };
  const admin = createAdminClient();
  const { error } = await admin.from("packages").insert({
    name: data.name.trim(),
    event_type: data.event_type,
    description: data.description.trim() || null,
    includes: data.includes,
    is_active: data.is_active,
  });
  if (error) return { error: error.message };
  revalidatePath("/editor/paquetes");
  return {};
}

export async function updatePaquete(id: string, data: Partial<PaqueteData>): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  const admin = createAdminClient();
  const { error } = await admin.from("packages").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/editor/paquetes");
  return {};
}

export async function deletePaquete(id: string): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  const admin = createAdminClient();
  const { error } = await admin.from("packages").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/editor/paquetes");
  return {};
}
