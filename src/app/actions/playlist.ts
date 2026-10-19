"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { PlaylistSection } from "@/lib/playlist-templates";

const itemSchema = z.object({
  section: z.string().min(1),
  song_url: z.string().optional().nullable(),
  no_aplica: z.boolean().optional(),
});

const saveSchema = z.object({
  bookingId: z.string().uuid(),
  items: z.array(itemSchema).min(1),
});

export type SavePlaylistItem = {
  section: PlaylistSection;
  song_url?: string | null;
  no_aplica?: boolean;
};

export async function savePlaylist(
  bookingId: string,
  items: SavePlaylistItem[],
): Promise<{ error?: string }> {
  const parsed = saveSchema.safeParse({ bookingId, items });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, client_id")
    .eq("id", parsed.data.bookingId)
    .eq("client_id", user.id)
    .maybeSingle();
  if (!booking) return { error: "Reserva no encontrada" };

  const rows = parsed.data.items.map((i) => ({
    booking_id: parsed.data.bookingId,
    section: i.section as PlaylistSection,
    song_url: i.song_url?.trim() || null,
    no_aplica: i.no_aplica ?? false,
  }));

  const { error } = await supabase
    .from("playlists")
    .upsert(rows, { onConflict: "booking_id,section" });
  if (error) return { error: error.message };

  const admin = createAdminClient();
  const { data: staffProfiles } = await admin
    .from("profiles").select("id").in("role", ["admin", "wedding_planner"]);
  if (staffProfiles?.length) {
    const { data: clientProfile } = await supabase
      .from("profiles").select("full_name, email").eq("id", user.id).single();
    const name = clientProfile?.full_name ?? clientProfile?.email ?? "Un cliente";
    await admin.from("notifications").insert(
      staffProfiles.map((s) => ({
        user_id: s.id,
        title: "Playlist actualizada",
        body: `${name} actualizó su playlist musical.`,
        type: "playlist_updated",
      })),
    );
  }

  revalidatePath("/portal/playlist");
  revalidatePath(`/portal/planner/clientes/${booking.client_id}/playlist`);
  revalidatePath(`/admin/clientes/${booking.client_id}/playlist`);
  return {};
}
