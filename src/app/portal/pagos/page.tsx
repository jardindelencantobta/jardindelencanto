import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PagosClienteView } from "@/components/portal/PagosClienteView";

export default async function PagosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, total_amount")
    .eq("client_id", user.id)
    .in("status", ["pending", "confirmed"])
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!booking) {
    return (
      <div className="bg-blanco rounded-2xl border border-negro/[0.07] p-12 text-center">
        <CreditCard size={36} className="text-dorado/40 mx-auto mb-4" />
        <p className="font-serif text-[1.3rem] text-negro mb-2">
          Tu evento aún no está registrado
        </p>
        <p className="text-gris text-[0.87rem] max-w-[320px] mx-auto">
          Contacta al equipo de Jardín El Encanto para comenzar la planificación de tu evento.
        </p>
      </div>
    );
  }

  const { data: pagos } = await supabase
    .from("payments")
    .select("id, concept, amount, payment_date, payment_method, status, receipt_url")
    .eq("booking_id", booking.id)
    .order("payment_date", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-[1.9rem] text-negro tracking-[-0.03em]">
          Mis <span className="text-dorado">pagos</span>
        </h2>
        <p className="text-gris text-[0.88rem] mt-1">
          Estado de cuenta de tu evento y comprobantes de pago.
        </p>
      </div>
      <PagosClienteView bookingId={booking.id} totalAmount={booking.total_amount} pagos={pagos ?? []} />
    </div>
  );
}
