"use client";

import { useState, useTransition } from "react";
import { MessageCircle, Phone, Calendar, Tag, ChevronDown, Users } from "lucide-react";
import { updateContactStatus } from "@/app/actions/contactos-asesor";

type ContactStatus = "unread" | "read" | "replied" | "en_proceso";

type ContactRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string;
  subject: string | null;
  event_date: string | null;
  guest_count: string | null;
  message: string;
  status: ContactStatus;
  created_at: string;
};

const STATUS_LABEL: Record<ContactStatus, string> = {
  unread: "Nuevo",
  read: "Leído",
  en_proceso: "En Proceso",
  replied: "Respondido",
};

const STATUS_STYLE: Record<ContactStatus, string> = {
  unread: "bg-rojo/10 text-rojo border-rojo/20",
  read: "bg-negro/5 text-gris border-negro/10",
  en_proceso: "bg-dorado/10 text-dorado border-dorado/20",
  replied: "bg-verde-bosque/10 text-verde-bosque border-verde-bosque/20",
};

const STATUS_OPTIONS: ContactStatus[] = ["unread", "read", "en_proceso", "replied"];

function normalizeWA(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("57") ? digits : `57${digits}`;
}

function buildWALink(whatsapp: string, name: string, subject: string | null): string {
  const phone = normalizeWA(whatsapp);
  const eventType = subject || "tu evento";
  const text = `Hola ${name}, soy del equipo de Jardín El Encanto, vi que estás interesado en ${eventType}. ¿En qué te puedo ayudar?`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function StatusBadge({ status }: { status: ContactStatus }) {
  return (
    <span className={`text-[0.66rem] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function StatusSelect({
  id,
  status,
  onChange,
}: {
  id: string;
  status: ContactStatus;
  onChange: (id: string, s: ContactStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function select(s: ContactStatus) {
    setOpen(false);
    startTransition(async () => {
      onChange(id, s);
      await updateContactStatus(id, s);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 text-[0.72rem] text-gris border border-negro/10 rounded-lg px-2.5 py-1.5 hover:bg-negro/5 transition-colors"
      >
        Cambiar estado <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 bg-blanco border border-negro/10 rounded-xl shadow-lg py-1 min-w-[140px]">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => select(s)}
                className={`w-full text-left px-3 py-2 text-[0.78rem] hover:bg-crema/60 transition-colors ${s === status ? "font-semibold text-negro" : "text-gris"}`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ContactosAsesorView({ initialContacts }: { initialContacts: ContactRow[] }) {
  const [contacts, setContacts] = useState<ContactRow[]>(initialContacts);

  function handleStatusChange(id: string, newStatus: ContactStatus) {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
  }

  const byStatus = (s: ContactStatus) => contacts.filter((c) => c.status === s);
  const counts = {
    unread: byStatus("unread").length,
    read: byStatus("read").length,
    en_proceso: byStatus("en_proceso").length,
    replied: byStatus("replied").length,
  };

  if (contacts.length === 0) {
    return (
      <div className="bg-blanco rounded-2xl border border-negro/[0.07] p-12 text-center">
        <MessageCircle size={32} className="mx-auto text-dorado/40 mb-3" />
        <p className="text-gris text-[0.88rem]">
          Aún no tienes contactos asignados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Resumen por estado */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {(Object.entries(counts) as [ContactStatus, number][]).map(([s, n]) => (
          <div key={s} className="bg-blanco rounded-xl border border-negro/[0.07] px-4 py-3 flex items-center justify-between">
            <span className="text-[0.75rem] text-gris">{STATUS_LABEL[s]}</span>
            <span className={`text-[1.1rem] font-bold ${s === "unread" ? "text-rojo" : s === "en_proceso" ? "text-dorado" : s === "replied" ? "text-verde-bosque" : "text-gris"}`}>
              {n}
            </span>
          </div>
        ))}
      </div>

      {/* Lista de contactos */}
      <div className="space-y-3">
        {contacts
          .sort((a, b) => {
            const order: ContactStatus[] = ["unread", "en_proceso", "read", "replied"];
            const diff = order.indexOf(a.status) - order.indexOf(b.status);
            if (diff !== 0) return diff;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
          .map((c) => (
            <div
              key={c.id}
              className={`bg-blanco rounded-2xl border p-5 transition-colors ${c.status === "unread" ? "border-rojo/20 shadow-sm" : "border-negro/[0.07]"}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                {/* Info principal */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif text-[1rem] text-negro font-medium">{c.name}</span>
                    <StatusBadge status={c.status} />
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.78rem] text-gris">
                    {c.subject && (
                      <span className="flex items-center gap-1">
                        <Tag size={11} />
                        {c.subject}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(c.created_at).toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {c.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        Fecha est.: {c.event_date}
                      </span>
                    )}
                    {c.guest_count && (
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {c.guest_count} invitados
                      </span>
                    )}
                    {c.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={11} />
                        {c.phone}
                      </span>
                    )}
                  </div>

                  <p className="text-[0.82rem] text-gris line-clamp-2 leading-relaxed">
                    {c.message}
                  </p>

                  <p className="text-[0.78rem] text-gris">
                    <span className="font-medium text-negro">WhatsApp:</span>{" "}
                    {c.whatsapp}
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                  <a
                    href={buildWALink(c.whatsapp, c.name, c.subject)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#25D366] text-blanco text-[0.75rem] font-medium rounded-lg hover:bg-[#20ba5a] transition-colors whitespace-nowrap"
                  >
                    <MessageCircle size={13} />
                    Contactar
                  </a>
                  <StatusSelect
                    id={c.id}
                    status={c.status}
                    onChange={handleStatusChange}
                  />
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
