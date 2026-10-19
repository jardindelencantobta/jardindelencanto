"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { createSignedUpload, removeUploadedFile } from "@/lib/uploads/server";
import { signedContractPath } from "@/lib/uploads/config";

export async function requestContratoFirmadoUpload(meta: {
  bookingId: string;
  fileName: string;
  contentType: string;
  size: number;
}): Promise<{ signedUrl?: string; token?: string; path?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  // Verificar que el booking pertenece al cliente
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, contract_locked")
    .eq("id", meta.bookingId)
    .eq("client_id", user.id)
    .maybeSingle();
  if (!booking) return { error: "Reserva no encontrada" };
  if (booking.contract_locked) return { error: "El contrato ya está firmado y bloqueado" };

  // Contar versiones anteriores para número de versión
  const admin = createAdminClient();
  const { count } = await admin
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", meta.bookingId)
    .eq("type", "contrato_firmado");
  const version = (count ?? 0) + 1;

  const path = signedContractPath(meta.bookingId, version);
  const { upload, error } = await createSignedUpload("signed-contract", {
    contentType: meta.contentType,
    size: meta.size,
    path,
  });
  if (error || !upload) return { error };
  return { signedUrl: upload.signedUrl, token: upload.token, path: upload.path };
}

export async function confirmContratoFirmadoUpload(
  bookingId: string,
  path: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  // Re-verificar que el booking pertenece al cliente
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, contract_locked, client_id")
    .eq("id", bookingId)
    .eq("client_id", user.id)
    .maybeSingle();
  if (!booking) return { error: "Reserva no encontrada" };
  if (booking.contract_locked) return { error: "El contrato ya está firmado" };

  const admin = createAdminClient();

  const { data: versionCount } = await admin
    .from("documents")
    .select("id", { count: "exact" })
    .eq("booking_id", bookingId)
    .eq("type", "contrato_firmado");
  const version = ((versionCount as { id: string }[] | null)?.length ?? 0) + 1;

  // Insertar el documento
  const { error: dbErr } = await admin.from("documents").insert({
    booking_id: bookingId,
    title: `Contrato firmado por el cliente v${version} — ${new Date().toLocaleDateString("es-CO")}`,
    file_url: path,
    type: "contrato_firmado",
    created_by: user.id,
  });

  if (dbErr) {
    await removeUploadedFile("signed-contract", path);
    return { error: dbErr.message };
  }

  // Bloquear el contrato
  await admin
    .from("bookings")
    .update({ contract_locked: true })
    .eq("id", bookingId);

  // Notificar a planner y admin
  const { data: staff } = await admin
    .from("profiles")
    .select("id")
    .in("role", ["admin", "wedding_planner"]);

  if (staff && staff.length > 0) {
    await admin.from("notifications").insert(
      staff.map((s) => ({
        user_id: s.id,
        title: "Contrato firmado por cliente",
        body: "El cliente ha subido el contrato firmado. Puedes descargarlo desde su ficha.",
        type: "signed_contract",
      }))
    );
  }

  revalidatePath("/portal/documentos");
  revalidatePath(`/portal/planner/clientes/${user.id}/contrato`);
  return {};
}
