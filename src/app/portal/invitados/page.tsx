import { redirect } from "next/navigation";
import { Map as MapIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listGuestListsConTamano } from "@/app/actions/invitados";
import { InvitadosClienteView } from "@/components/portal/InvitadosClienteView";

export default async function InvitadosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, guest_count")
    .eq("client_id", user.id)
    .in("status", ["pending", "confirmed"])
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!booking) {
    return (
      <div className="bg-blanco rounded-2xl border border-negro/[0.07] p-12 text-center">
        <MapIcon size={36} className="text-dorado/40 mx-auto mb-4" />
        <p className="font-serif text-[1.3rem] text-negro mb-2">
          Tu evento aún no está registrado
        </p>
        <p className="text-gris text-[0.87rem] max-w-[320px] mx-auto">
          Contacta al equipo de Jardín El Encanto para comenzar la planificación de tu evento.
        </p>
      </div>
    );
  }

  const guestCount = booking.guest_count ?? 0;

  const { data: maps } = await supabase
    .from("salon_maps")
    .select("name, image_url")
    .lte("min_guests", guestCount)
    .gte("max_guests", guestCount)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);
  const map = maps?.[0] ?? null;

  const { data: rows } = await supabase
    .from("guest_tables")
    .select("id, file_url, uploaded_at")
    .eq("booking_id", booking.id)
    .order("uploaded_at", { ascending: false });

  const files = await listGuestListsConTamano(rows ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-[1.9rem] text-negro tracking-[-0.03em]">
          Distribución de <span className="text-dorado">mesas</span>
        </h2>
        <p className="text-gris text-[0.88rem] mt-1">
          Consulta el mapa de tu salón y comparte la lista de invitados por mesa.
        </p>
      </div>
      <InvitadosClienteView
        bookingId={booking.id}
        mapUrl={map?.image_url ?? null}
        mapName={map?.name ?? null}
        initialFiles={files}
      />
    </div>
  );
}
