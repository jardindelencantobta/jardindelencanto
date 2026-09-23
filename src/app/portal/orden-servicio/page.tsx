import { redirect } from "next/navigation";
import { Clock3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OrdenServicioView } from "@/components/portal/orden-servicio/OrdenServicioView";

export default async function OrdenServicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, event_date, event_start_time, event_end_time, guest_count, status, service_order_approved"
    )
    .eq("client_id", user.id)
    .in("status", ["pending", "confirmed"])
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!booking) {
    return (
      <div className="bg-blanco rounded-2xl border border-negro/[0.07] p-12 text-center">
        <Clock3 size={36} className="text-dorado/40 mx-auto mb-4" />
        <p className="font-serif text-[1.3rem] text-negro mb-2">
          Tu evento aún no está registrado
        </p>
        <p className="text-gris text-[0.87rem] max-w-[320px] mx-auto">
          Contacta al equipo de Jardín El Encanto para comenzar la
          planificación de tu evento.
        </p>
      </div>
    );
  }

  const { data: sections } = await supabase
    .from("service_order_sections")
    .select(
      `id, name, sort_order,
       service_order_items (
         id, label, value, item_type, options, sort_order, filled_by
       )`
    )
    .eq("booking_id", booking.id)
    .order("sort_order")
    .order("sort_order", { referencedTable: "service_order_items" });

  return (
    <OrdenServicioView
      bookingId={booking.id}
      isApproved={booking.service_order_approved ?? false}
      sections={(sections ?? []) as Parameters<typeof OrdenServicioView>[0]["sections"]}
    />
  );
}
