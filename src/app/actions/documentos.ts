"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  createSignedUpload,
  createSignedDownload,
  removeUploadedFile,
  getStoredFileSize,
} from "@/lib/uploads/server";
import { documentPath } from "@/lib/uploads/config";

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

async function revalidateDocumentos(clientId: string | null | undefined) {
  revalidatePath("/portal/documentos");
  if (clientId) revalidatePath(`/portal/planner/clientes/${clientId}/documentos`);
}

const requestSchema = z.object({
  bookingId: z.string().uuid(),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().positive(),
});

export async function requestDocumentoUpload(
  meta: z.infer<typeof requestSchema>,
): Promise<{ signedUrl?: string; token?: string; path?: string; error?: string }> {
  const { error: authErr } = await verifyPlanner();
  if (authErr) return { error: authErr };

  const parsed = requestSchema.safeParse(meta);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const path = documentPath(parsed.data.bookingId, parsed.data.fileName);
  const { upload, error } = await createSignedUpload("document", {
    contentType: parsed.data.contentType,
    size: parsed.data.size,
    path,
  });
  if (error || !upload) return { error };

  return { signedUrl: upload.signedUrl, token: upload.token, path: upload.path };
}

const confirmSchema = z.object({
  bookingId: z.string().uuid(),
  path: z.string().min(1),
  title: z.string().min(2, "El nombre del documento es requerido"),
});

export async function confirmDocumentoUpload(
  meta: z.infer<typeof confirmSchema>,
): Promise<{ document?: { id: string; created_at: string }; error?: string }> {
  const { error: authErr, user } = await verifyPlanner();
  if (authErr || !user) return { error: authErr ?? "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const parsed = confirmSchema.safeParse(meta);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings").select("client_id").eq("id", parsed.data.bookingId).single();

  const { data: inserted, error } = await admin.from("documents").insert({
    booking_id: parsed.data.bookingId,
    title: parsed.data.title.trim(),
    file_url: parsed.data.path,
    type: "contrato",
    created_by: user.id,
  }).select("id, created_at").single();
  if (error || !inserted) {
    await removeUploadedFile("document", parsed.data.path);
    return { error: error?.message ?? "Error al guardar el documento" };
  }

  if (booking?.client_id) {
    await admin.from("notifications").insert({
      user_id: booking.client_id,
      title: "Nuevo documento disponible",
      body: parsed.data.title.trim(),
      type: "new_document",
    });
  }

  await revalidateDocumentos(booking?.client_id);
  return { document: inserted };
}

export async function deleteDocumento(id: string): Promise<{ error?: string }> {
  const { error: authErr } = await verifyPlanner();
  if (authErr) return { error: authErr };

  const admin = createAdminClient();
  const { data: doc } = await admin
    .from("documents")
    .select("file_url, booking_id, bookings(client_id)")
    .eq("id", id)
    .single();
  if (!doc) return { error: "Documento no encontrado" };

  const { error } = await admin.from("documents").delete().eq("id", id);
  if (error) return { error: error.message };

  if (doc.file_url) await removeUploadedFile("document", doc.file_url);

  const clientId = (doc.bookings as { client_id: string } | null)?.client_id;
  await revalidateDocumentos(clientId);
  return {};
}

export type DocumentoConSize = {
  id: string;
  title: string;
  type: string;
  created_at: string;
  size: number | null;
};

export async function listDocumentosConTamano(
  rows: { id: string; title: string; type: string; created_at: string; file_url: string | null }[],
): Promise<DocumentoConSize[]> {
  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      created_at: r.created_at,
      size: r.file_url ? await getStoredFileSize("document", r.file_url) : null,
    })),
  );
}

export async function getDocumentoDownloadUrl(id: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  const admin = createAdminClient();
  const { data: doc } = await admin
    .from("documents")
    .select("file_url, bookings(client_id)")
    .eq("id", id)
    .single();
  if (!doc || !doc.file_url) return { error: "Documento no encontrado" };

  const isStaff = profile && ["admin", "wedding_planner"].includes(profile.role);
  const isOwner = (doc.bookings as { client_id: string } | null)?.client_id === user.id;
  if (!isStaff && !isOwner) return { error: "Sin permisos" };

  return createSignedDownload("document", doc.file_url);
}
