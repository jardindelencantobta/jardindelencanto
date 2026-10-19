"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Elimina completamente a un cliente del sistema:
 * Storage → documents rows → payments → booking (cascade) → auth user (cascade a profiles)
 *
 * Solo puede llamarlo un wedding_planner o admin (verificado con SSR client).
 */
export async function deleteClient(
  clientId: string,
  bookingId: string
): Promise<{ error?: string }> {
  // Verificar que el llamador tiene permisos
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!caller || !["admin", "wedding_planner"].includes(caller.role)) {
    return { error: "Sin permisos para eliminar clientes" };
  }

  const admin = createAdminClient();

  // ── 1. Storage: archivos en documents/{bookingId}/ ──────────────────
  // Lista archivos (un nivel) y los borra. Errores no son fatales.
  const { data: storageFiles } = await admin.storage
    .from("documents")
    .list(bookingId);

  if (storageFiles && storageFiles.length > 0) {
    const paths = storageFiles.map((f) => `${bookingId}/${f.name}`);
    await admin.storage.from("documents").remove(paths);
  }

  // ── 2. Tabla documents (ON DELETE RESTRICT → borrar antes del booking) ─
  const { error: docsErr } = await admin
    .from("documents")
    .delete()
    .eq("booking_id", bookingId);
  if (docsErr) return { error: `documents: ${docsErr.message}` };

  // ── 3. Tabla payments (ON DELETE RESTRICT → borrar antes del booking) ──
  const { error: paymentsErr } = await admin
    .from("payments")
    .delete()
    .eq("booking_id", bookingId);
  if (paymentsErr) return { error: `payments: ${paymentsErr.message}` };

  // ── 4. Booking (CASCADE a: booking_packages, service_order_sections,
  //               service_order_items, booking_events, playlists,
  //               guest_tables) ────────────────────────────────────────
  const { error: bookingErr } = await admin
    .from("bookings")
    .delete()
    .eq("id", bookingId);
  if (bookingErr) return { error: `booking: ${bookingErr.message}` };

  // ── 5. Auth user (CASCADE a: profiles → messages, notifications) ─────
  const { error: authErr } = await admin.auth.admin.deleteUser(clientId);
  if (authErr) return { error: `auth: ${authErr.message}` };

  revalidatePath("/portal/planner");
  return {};
}
