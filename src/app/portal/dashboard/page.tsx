import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  Users,
  MapPin,
  FileText,
  CreditCard,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { CountdownTimer } from "@/components/portal/CountdownTimer";

const EVENT_TYPE_LABEL: Record<string, string> = {
  boda: "Boda",
  quince: "Quinceañera",
  empresarial: "Evento Empresarial",
  revelacion: "Revelación de Género",
};

const STATUS_CONFIG = {
  pending: {
    label: "Pendiente de confirmación",
    color: "text-amber-600 bg-amber-50 border-amber-200",
    icon: Clock3,
  },
  confirmed: {
    label: "Confirmada",
    color: "text-verde bg-verde/5 border-verde/20",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelada",
    color: "text-rojo bg-rojo/5 border-rojo/20",
    icon: Clock3,
  },
  completed: {
    label: "Completada",
    color: "text-gris bg-negro/5 border-negro/15",
    icon: CheckCircle2,
  },
} as const;

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateStr}T12:00:00`));
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:${m} ${suffix}`;
}

type BookingRow = {
  id: string;
  event_date: string;
  event_start_time: string;
  event_end_time: string;
  event_type: string;
  guest_count: number;
  status: keyof typeof STATUS_CONFIG;
  service_order_approved: boolean | null;
  spaces: { name: string } | null;
};

export default async function ClientDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Roles de staff van a su propio panel
  if (profile.role !== "client") {
    const staffDest: Record<string, string> = {
      admin: "/admin/dashboard",
      wedding_planner: "/portal/planner",
      asesor_comercial: "/portal/asesor-comercial",
      asesor_logistica: "/portal/asesor-logistica",
      staff: "/portal/staff",
    };
    redirect(staffDest[profile.role] ?? "/portal/planner");
  }

  const firstName = profile.full_name?.split(" ")[0] ?? "bienvenido";

  const { data } = await supabase
    .from("bookings")
    .select(
      "id, event_date, event_start_time, event_end_time, event_type, guest_count, status, service_order_approved, spaces(name)"
    )
    .eq("client_id", user.id)
    .in("status", ["pending", "confirmed"])
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const booking = data as BookingRow | null;
  const statusCfg = booking ? STATUS_CONFIG[booking.status] : null;

  const hora = new Date().getHours();
  const greeting =
    hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-[1.9rem] md:text-[2.3rem] text-negro leading-tight tracking-[-0.03em]">
          {greeting},{" "}
          <span className="text-dorado capitalize">{firstName}</span>
        </h2>
        <p className="text-gris text-[0.88rem] mt-1">
          {booking
            ? "Aquí tienes el resumen de tu evento"
            : "Bienvenido a tu portal de cliente"}
        </p>
      </div>

      {booking ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Cuenta regresiva */}
            <div className="lg:col-span-3 bg-negro rounded-2xl p-5 sm:p-7 md:p-9 flex flex-col gap-5 sm:gap-6">
              <div>
                <p className="text-[0.6rem] tracking-[0.35em] text-dorado uppercase font-light">
                  Cuenta regresiva
                </p>
                <p className="font-serif text-blanco/70 text-[0.9rem] mt-0.5 capitalize">
                  {formatDate(booking.event_date)}
                </p>
              </div>

              <CountdownTimer
                eventDate={booking.event_date}
                startTime={booking.event_start_time}
              />

              <div className="flex items-center gap-2 mt-auto">
                <span
                  className={`inline-flex items-center gap-1.5 text-[0.72rem] px-3 py-1.5 rounded-full border font-medium ${statusCfg?.color}`}
                >
                  {statusCfg && <statusCfg.icon size={12} />}
                  {statusCfg?.label}
                </span>
              </div>
            </div>

            {/* Detalles del evento */}
            <div className="lg:col-span-2 bg-blanco rounded-2xl border border-negro/[0.07] p-6 flex flex-col gap-4">
              <p className="text-[0.6rem] tracking-[0.35em] text-dorado uppercase font-light">
                Tu evento
              </p>

              <div className="space-y-3 flex-1">
                <DetailRow
                  icon={CalendarDays}
                  label="Fecha"
                  value={formatDate(booking.event_date)}
                />
                <DetailRow
                  icon={Clock}
                  label="Horario"
                  value={`${formatTime(booking.event_start_time)} – ${formatTime(booking.event_end_time)}`}
                />
                <DetailRow
                  icon={MapPin}
                  label="Espacio"
                  value={booking.spaces?.name ?? "Por confirmar"}
                />
                <DetailRow
                  icon={Users}
                  label="Invitados"
                  value={`${booking.guest_count} personas`}
                />
              </div>

              <div className="pt-3 border-t border-negro/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-[0.75rem] text-gris">Tipo de evento</span>
                  <span className="text-[0.82rem] font-medium text-negro">
                    {EVENT_TYPE_LABEL[booking.event_type] ?? booking.event_type}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[0.75rem] text-gris">Orden de servicio</span>
                  <span
                    className={`text-[0.75rem] font-medium ${
                      booking.service_order_approved ? "text-verde" : "text-amber-600"
                    }`}
                  >
                    {booking.service_order_approved ? "Aprobada" : "Pendiente"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Accesos rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QuickLink href="/portal/documentos" icon={FileText} title="Documentos" description="Contratos y archivos" />
            <QuickLink href="/portal/pagos" icon={CreditCard} title="Pagos" description="Estado de cuenta" />
            <QuickLink href="/portal/mensajes" icon={MessageSquare} title="Mensajes" description="Comunícate con el equipo" />
          </div>

          {!booking.service_order_approved && (
            <div className="bg-dorado/8 border border-dorado/20 rounded-xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.85rem] font-medium text-negro">
                  Tu orden de servicio está lista para revisar
                </p>
                <p className="text-[0.78rem] text-gris mt-0.5">
                  Revisa los detalles de tu evento y aprueba cuando estés de acuerdo
                </p>
              </div>
              <Link
                href="/portal/evento"
                className="shrink-0 text-[0.78rem] font-medium px-4 py-2.5 bg-dorado text-blanco rounded-lg hover:bg-dorado/90 transition-colors"
              >
                Revisar
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="bg-blanco rounded-2xl border border-negro/[0.07] p-10 text-center">
          <CalendarDays size={40} className="text-dorado/50 mx-auto mb-4" />
          <p className="font-serif text-[1.4rem] text-negro mb-2">
            Tu evento aún no está registrado
          </p>
          <p className="text-gris text-[0.87rem] max-w-[360px] mx-auto mb-6">
            Contacta al equipo de Jardín El Encanto para comenzar a planear
            el día más especial de tu vida.
          </p>
          <Link
            href="/#contacto"
            className="inline-flex items-center gap-2 text-[0.82rem] font-medium px-5 py-3 bg-rojo text-blanco rounded-lg hover:bg-rojo-pro transition-colors"
          >
            Contactar al equipo
            <ChevronRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-crema flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} className="text-dorado" />
      </div>
      <div className="min-w-0">
        <p className="text-[0.68rem] text-gris uppercase tracking-wide">{label}</p>
        <p className="text-[0.83rem] text-negro font-medium leading-snug mt-0.5 capitalize">
          {value}
        </p>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 bg-blanco rounded-xl border border-negro/[0.07] p-4 hover:border-dorado/30 hover:shadow-sm transition-all duration-200 group"
    >
      <div className="w-10 h-10 rounded-lg bg-crema flex items-center justify-center shrink-0 group-hover:bg-dorado/10 transition-colors">
        <Icon size={17} className="text-dorado" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[0.85rem] font-medium text-negro">{title}</p>
        <p className="text-[0.75rem] text-gris truncate">{description}</p>
      </div>
      <ChevronRight
        size={15}
        className="text-negro/20 group-hover:text-dorado/50 transition-colors shrink-0"
      />
    </Link>
  );
}
