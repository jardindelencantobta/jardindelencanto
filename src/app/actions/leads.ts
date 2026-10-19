"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppNotification, sendWhatsAppToPhone, buildLeadMessage } from "@/lib/callmebot";

export async function reassignLead(
  leadId: string,
  asesorId: string | null
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "gerente"].includes(profile.role)) {
    return { error: "Sin permisos para reasignar leads" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("contact_messages")
    .update({ assigned_asesor_id: asesorId })
    .eq("id", leadId);

  return { error: error?.message ?? null };
}

export async function resendLeadNotification(
  leadId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "gerente"].includes(profile.role)) {
    return { error: "Sin permisos" };
  }

  const admin = createAdminClient();
  const { data: lead } = await admin
    .from("contact_messages")
    .select(
      "name, whatsapp, email, subject, event_date, guest_count, message, assigned_asesor_id"
    )
    .eq("id", leadId)
    .single();

  if (!lead) return { error: "Lead no encontrado" };

  let asesorName = "el equipo";
  let asesorPhone: string | null = null;
  let asesorApiKey: string | null = null;

  if (lead.assigned_asesor_id) {
    const { data: asesor } = await admin
      .from("profiles")
      .select("full_name, phone, callmebot_api_key")
      .eq("id", lead.assigned_asesor_id)
      .single();
    if (asesor) {
      asesorName = asesor.full_name ?? "el equipo";
      asesorPhone = asesor.phone ?? null;
      asesorApiKey = asesor.callmebot_api_key ?? null;
    }
  }

  const msg = buildLeadMessage({
    name: lead.name,
    whatsapp: lead.whatsapp,
    email: lead.email ?? null,
    subject: lead.subject ?? null,
    event_date: lead.event_date ?? null,
    guest_count: lead.guest_count ?? null,
    message: lead.message,
    asesorName,
    isResend: true,
  });

  void sendWhatsAppNotification(msg);
  if (asesorPhone && asesorApiKey) {
    void sendWhatsAppToPhone(asesorPhone, asesorApiKey, msg);
  }

  return { error: null };
}

export async function deleteTestLeads(): Promise<{ deleted: number; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { deleted: 0, error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { deleted: 0, error: "Solo admin puede eliminar leads de prueba" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("contact_messages")
    .delete()
    .or(
      "name.ilike.%jeisson rincon%,name.ilike.%ing yeye rincon%,name.ilike.%Ing. Yeye%"
    )
    .select("id");

  if (error) return { deleted: 0, error: error.message };
  return { deleted: data?.length ?? 0, error: null };
}
