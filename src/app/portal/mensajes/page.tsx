import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { WHATSAPP } from "@/config/brand";

const WHATSAPP_NUMBER = WHATSAPP.intl;

export default async function MensajesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const { data: booking } = await supabase
    .from("bookings")
    .select("event_date")
    .eq("client_id", user.id)
    .in("status", ["pending", "confirmed"])
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const name = profile?.full_name ?? profile?.email ?? "Cliente";
  const eventDateLabel = booking?.event_date
    ? new Date(booking.event_date + "T00:00:00").toLocaleDateString("es-CO", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  const message = eventDateLabel
    ? `Hola, soy ${name}, tengo una consulta sobre mi evento del ${eventDateLabel}`
    : `Hola, soy ${name}, tengo una consulta sobre mi evento`;

  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-blanco rounded-2xl border border-negro/[0.07] p-10 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-[#25D366]/10 flex items-center justify-center mx-auto">
          <WhatsAppIcon size={30} />
        </div>
        <div>
          <h2 className="font-serif text-[1.6rem] text-negro tracking-[-0.02em] mb-2">
            Mensajes
          </h2>
          <p className="text-gris text-[0.9rem] leading-relaxed">
            Comunícate directamente con el equipo de tu evento
          </p>
        </div>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-blanco text-[0.85rem] font-medium rounded-xl hover:bg-[#1ebe5b] transition-colors"
        >
          <WhatsAppIcon size={18} color="white" />
          Escribir por WhatsApp
        </a>
      </div>
    </div>
  );
}
