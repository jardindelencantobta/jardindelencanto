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

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/bodas");
  revalidatePath("/quince-anos");
  revalidatePath("/eventos-empresariales");
  revalidatePath("/revelacion-de-genero");
  revalidatePath("/editor/contenido");
}

export async function updateSiteContentText(
  key: string,
  field: "title" | "content",
  value: string | null,
): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  const admin = createAdminClient();
  const patch = field === "title" ? { title: value } : { content: value };
  const { error } = await admin
    .from("site_content")
    .update(patch)
    .eq("key", key);
  if (error) return { error: error.message };
  revalidateAll();
  return {};
}

export async function updateSiteContentData(
  key: string,
  jsonString: string,
): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { error: "JSON inválido" };
  }
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await admin.from("site_content").update({ data: parsed as any }).eq("key", key);
  if (error) return { error: error.message };
  revalidateAll();
  return {};
}
