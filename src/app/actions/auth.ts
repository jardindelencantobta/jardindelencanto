"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { z } from "zod";
import { BRAND } from "@/config/brand";

export type AuthState = { error: string } | null;

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MINUTES = 15;

const registerSchema = z
  .object({
    full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    phone: z.string().optional(),
    password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export async function login(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const email = parsed.data.email.toLowerCase();
  const admin = createAdminClient();
  const windowStart = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000).toISOString();

  // Contar intentos fallidos recientes para este email
  const { count: recentFailures } = await admin
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("attempted_at", windowStart);

  const failures = recentFailures ?? 0;

  if (failures >= LOGIN_MAX_ATTEMPTS) {
    return {
      error: `Demasiados intentos fallidos. Espera ${LOGIN_WINDOW_MINUTES} minutos e intenta nuevamente.`,
    };
  }

  // Delay progresivo: 1s, 2s, 4s, 8s tras el 1.°, 2.°, 3.° y 4.° fallo
  if (failures > 0) {
    const delayMs = Math.min(Math.pow(2, failures - 1), 16) * 1000;
    await new Promise((r) => setTimeout(r, delayMs));
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Registrar intento fallido y limpiar intentos expirados
    await admin.from("login_attempts").insert({ email });
    void admin
      .from("login_attempts")
      .delete()
      .lt("attempted_at", windowStart);
    return { error: "Credenciales inválidas. Verifica tu email y contraseña." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  // Registrar actividad inicial para que proxy.ts no detecte sesión "expirada"
  // en el primer request tras el login (cuando last_active_at venía de antes).
  await createAdminClient()
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", data.user.id);

  const destinations: Record<string, string> = {
    client: "/portal/dashboard",
    admin: "/admin/dashboard",
    wedding_planner: "/portal/planner",
    asesor_comercial: "/portal/asesor-comercial",
    asesor_logistica: "/portal/asesor-logistica",
    staff: "/portal/staff",
    editor: "/editor/galeria",
    gerente: "/portal/gerente",
  };

  redirect(destinations[profile?.role ?? "client"] ?? "/portal/dashboard");
}

export type RegisterState = { error?: string; success?: boolean } | null;

export async function register(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { confirmPassword: _, ...fields } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: fields.email,
    password: fields.password,
    options: {
      data: { full_name: fields.full_name, phone: fields.phone ?? null },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type ResetPasswordState = { error?: string; success?: boolean } | null;

const resetPasswordSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido"),
});

export async function requestPasswordReset(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    email: (formData.get("email") as string)?.trim(),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${BRAND.url}/update-password`,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export type UpdatePasswordState = { error?: string; success?: boolean } | null;

export async function updatePassword(
  _prev: UpdatePasswordState,
  formData: FormData
): Promise<UpdatePasswordState> {
  const password = formData.get("password") as string;
  const confirm = formData.get("confirmPassword") as string;

  if (!password || password.length < 8)
    return { error: "La contraseña debe tener mínimo 8 caracteres" };
  if (password !== confirm)
    return { error: "Las contraseñas no coinciden" };

  const supabase = await createClient();
  const { data: updateData, error } = await supabase.auth.updateUser({ password });

  if (error) {
    if (error.message.includes("session")) {
      return { error: "El enlace expiró o ya fue utilizado. Solicita uno nuevo." };
    }
    return { error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", updateData.user.id)
    .single();

  const destinations: Record<string, string> = {
    client: "/portal/dashboard",
    admin: "/admin/dashboard",
    wedding_planner: "/portal/planner",
    asesor_comercial: "/portal/asesor-comercial",
    asesor_logistica: "/portal/asesor-logistica",
    staff: "/portal/staff",
    editor: "/editor/galeria",
    gerente: "/portal/gerente",
  };

  redirect(destinations[profile?.role ?? "client"] ?? "/portal/dashboard");
}
