"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSignedUpload, publicUrlFor, removeUploadedFile } from "@/lib/uploads/server";
import { avatarPath } from "@/lib/uploads/config";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." as string, user: null };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin")
    return { error: "Sin permisos de administrador" as string, user: null };
  return { error: null, user };
}

const crearSchema = z.object({
  full_name: z.string().min(2, "Nombre mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Contraseña mínimo 8 caracteres"),
  role: z.enum([
    "admin", "wedding_planner", "asesor_comercial",
    "asesor_logistica", "staff", "editor", "gerente",
  ]),
  phone: z.string().optional(),
});

export type CrearUsuarioState = { error?: string; field?: string; success?: boolean } | null;

export async function crearUsuario(
  _prev: CrearUsuarioState,
  formData: FormData
): Promise<CrearUsuarioState> {
  const { error: authErr } = await verifyAdmin();
  if (authErr) return { error: authErr };

  const parsed = crearSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0].message, field: parsed.error.issues[0].path[0] as string };

  const { full_name, email, password, role, phone } = parsed.data;
  const admin = createAdminClient();

  const { data: authData, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (createErr) {
    if (createErr.message.includes("already")) return { error: "Ya existe un usuario con ese email", field: "email" };
    return { error: createErr.message };
  }

  await admin
    .from("profiles")
    .update({ full_name, role, phone: phone ?? null })
    .eq("id", authData.user.id);

  revalidatePath("/admin/usuarios");
  return { success: true };
}

const editarSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2, "Nombre mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.enum([
    "admin", "wedding_planner", "asesor_comercial",
    "asesor_logistica", "staff", "editor", "gerente",
  ]),
  phone: z.string().optional(),
  is_active: z.boolean(),
});

export type EditarUsuarioState = { error?: string; field?: string; success?: boolean } | null;

export async function editarUsuario(
  _prev: EditarUsuarioState,
  formData: FormData
): Promise<EditarUsuarioState> {
  const { error: authErr } = await verifyAdmin();
  if (authErr) return { error: authErr };

  const parsed = editarSchema.safeParse({
    id: formData.get("id"),
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    role: formData.get("role"),
    phone: formData.get("phone") || undefined,
    is_active: formData.get("is_active") === "true",
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0].message, field: parsed.error.issues[0].path[0] as string };

  const { id, full_name, email, role, phone, is_active } = parsed.data;
  const admin = createAdminClient();

  const { error: authUpdateErr } = await admin.auth.admin.updateUserById(id, { email });
  if (authUpdateErr) return { error: authUpdateErr.message };

  const { error: profileErr } = await admin
    .from("profiles")
    .update({ full_name, role, phone: phone ?? null, is_active })
    .eq("id", id);
  if (profileErr) return { error: profileErr.message };

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function toggleUsuarioActivo(
  userId: string,
  isActive: boolean
): Promise<{ error?: string }> {
  const { error: authErr } = await verifyAdmin();
  if (authErr) return { error: authErr };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/usuarios");
  return {};
}

export type CambiarPasswordState = { error?: string; success?: boolean } | null;

export async function cambiarPassword(
  _prev: CambiarPasswordState,
  formData: FormData
): Promise<CambiarPasswordState> {
  const { error: authErr } = await verifyAdmin();
  if (authErr) return { error: authErr };

  const userId = (formData.get("userId") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();

  if (!userId) return { error: "Usuario no especificado" };
  if (!password || password.length < 8)
    return { error: "La contraseña debe tener mínimo 8 caracteres" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };

  return { success: true };
}

export async function requestUsuarioAvatarUpload(meta: {
  userId: string;
  fileName: string;
  contentType: string;
  size: number;
}): Promise<{ signedUrl?: string; token?: string; path?: string; error?: string }> {
  const { error: authErr } = await verifyAdmin();
  if (authErr) return { error: authErr };

  const path = avatarPath(meta.userId, meta.fileName);
  const { upload, error } = await createSignedUpload("avatar", {
    contentType: meta.contentType,
    size: meta.size,
    path,
  });
  if (error || !upload) return { error };

  return { signedUrl: upload.signedUrl, token: upload.token, path: upload.path };
}

export async function confirmUsuarioAvatarUpload(meta: {
  userId: string;
  path: string;
}): Promise<{ url?: string; error?: string }> {
  const { error: authErr } = await verifyAdmin();
  if (authErr) return { error: authErr };

  const admin = createAdminClient();
  const url = publicUrlFor("avatar", meta.path);

  const { error } = await admin
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", meta.userId);
  if (error) {
    await removeUploadedFile("avatar", meta.path);
    return { error: error.message };
  }

  revalidatePath("/admin/usuarios");
  return { url };
}
