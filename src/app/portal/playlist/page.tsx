import { redirect } from "next/navigation";
import { Music2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PlaylistClienteView } from "@/components/portal/PlaylistClienteView";

export default async function PlaylistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, event_type")
    .eq("client_id", user.id)
    .in("status", ["pending", "confirmed"])
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!booking) {
    return (
      <div className="bg-blanco rounded-2xl border border-negro/[0.07] p-12 text-center">
        <Music2 size={36} className="text-dorado/40 mx-auto mb-4" />
        <p className="font-serif text-[1.3rem] text-negro mb-2">
          Tu evento aún no está registrado
        </p>
        <p className="text-gris text-[0.87rem] max-w-[320px] mx-auto">
          Contacta al equipo de Jardín El Encanto para comenzar la planificación de tu evento.
        </p>
      </div>
    );
  }

  const { data: items } = await supabase
    .from("playlists")
    .select("section, song_url, no_aplica")
    .eq("booking_id", booking.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-[1.9rem] text-negro tracking-[-0.03em]">
          Mi <span className="text-dorado">música</span>
        </h2>
        <p className="text-gris text-[0.88rem] mt-1">
          Comparte las canciones y playlists para los momentos clave de tu evento.
        </p>
      </div>
      <PlaylistClienteView
        bookingId={booking.id}
        eventType={booking.event_type}
        initialItems={items ?? []}
      />
    </div>
  );
}
