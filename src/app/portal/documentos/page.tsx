import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listDocumentosConTamano } from "@/app/actions/documentos";
import { DocumentosClienteView } from "@/components/portal/DocumentosClienteView";

export default async function DocumentosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, contract_locked")
    .eq("client_id", user.id)
    .in("status", ["pending", "confirmed"])
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!booking) {
    return (
      <div className="bg-blanco rounded-2xl border border-negro/[0.07] p-12 text-center">
        <FileText size={36} className="text-dorado/40 mx-auto mb-4" />
        <p className="font-serif text-[1.3rem] text-negro mb-2">
          Tu evento aún no está registrado
        </p>
        <p className="text-gris text-[0.87rem] max-w-[320px] mx-auto">
          Contacta al equipo de Jardín El Encanto para comenzar la planificación de tu evento.
        </p>
      </div>
    );
  }

  const { data: rows } = await supabase
    .from("documents")
    .select("id, title, type, created_at, file_url")
    .eq("booking_id", booking.id)
    .order("created_at", { ascending: false });

  const documentos = await listDocumentosConTamano(rows ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-[1.9rem] text-negro tracking-[-0.03em]">
          Mis <span className="text-dorado">documentos</span>
        </h2>
        <p className="text-gris text-[0.88rem] mt-1">
          Contratos y archivos que el equipo comparte contigo.
        </p>
      </div>
      <DocumentosClienteView
        documentos={documentos}
        bookingId={booking.id}
        isLocked={booking.contract_locked ?? false}
      />
    </div>
  );
}
