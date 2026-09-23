"use client";

import { useState, useMemo, useTransition, useRef } from "react";
import { createPortal } from "react-dom";
import {
  MessageCircle,
  ChevronDown,
  X,
  Users,
  Calendar,
  Tag,
  Phone,
  Mail,
  User,
  Inbox,
  RefreshCw,
  Send,
} from "lucide-react";
import { updateContactStatus } from "@/app/actions/contactos-asesor";
import { reassignLead, resendLeadNotification } from "@/app/actions/leads";

type ContactStatus = "unread" | "read" | "replied" | "en_proceso";

export type LeadRow = {
  id: string;
  created_at: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string;
  subject: string | null;
  event_date: string | null;
  guest_count: string | null;
  message: string;
  status: ContactStatus;
  assigned_asesor_id: string | null;
  asesor_name: string | null;
  asesor_phone: string | null;
};

type AsesorOption = { id: string; full_name: string | null; role: string };

const STATUS_LABEL: Record<ContactStatus, string> = {
  unread: "Nuevo",
  read: "Leído",
  en_proceso: "En proceso",
  replied: "Respondido",
};

const STATUS_STYLE: Record<ContactStatus, string> = {
  unread: "bg-rojo/10 text-rojo border-rojo/20",
  read: "bg-negro/5 text-gris border-negro/10",
  en_proceso: "bg-dorado/10 text-dorado border-dorado/20",
  replied: "bg-verde-bosque/10 text-verde-bosque border-verde-bosque/20",
};

const ALL_STATUSES: ContactStatus[] = ["unread", "read", "en_proceso", "replied"];

function normalizeWA(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("57") ? digits : `57${digits}`;
}

function buildWALink(lead: LeadRow): string {
  const phone = normalizeWA(lead.whatsapp);
  if (!phone) return "#";
  const eventType = lead.subject || "tu evento";
  const datePart = lead.event_date ? ` el ${lead.event_date}` : "";
  const text = `Hola ${lead.name ?? ""}, soy del equipo de Jardín El Encanto. Vi tu consulta sobre ${eventType}${datePart}. ¿En qué te puedo ayudar?`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function safeStatusStyle(status: string | null | undefined): string {
  return STATUS_STYLE[(status ?? "unread") as ContactStatus] ?? STATUS_STYLE.unread;
}

function safeStatusLabel(status: string | null | undefined): string {
  return STATUS_LABEL[(status ?? "unread") as ContactStatus] ?? STATUS_LABEL.unread;
}

function StatusBadge({ status }: { status: ContactStatus | null | undefined }) {
  return (
    <span
      className={`text-[0.63rem] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${safeStatusStyle(status)}`}
    >
      {safeStatusLabel(status)}
    </span>
  );
}

type DropPos = { top: number; right: number; openUp: boolean };

const DROP_HEIGHT = ALL_STATUSES.length * 38 + 8; // altura aproximada del dropdown

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
  const [dropPos, setDropPos] = useState<DropPos | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [, start] = useTransition();

  function handleOpen() {
    if (open) { setOpen(false); return; }
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < DROP_HEIGHT + 8;
    setDropPos({
      top: openUp ? rect.top - DROP_HEIGHT - 4 : rect.bottom + 4,
      right: window.innerWidth - rect.right,
      openUp,
    });
    setOpen(true);
  }

  function select(s: ContactStatus) {
    setOpen(false);
    onChange(id, s);
    start(async () => {
      await updateContactStatus(id, s);
    });
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-1 text-[0.72rem] text-gris border border-negro/10 rounded-lg px-2.5 py-1.5 hover:bg-negro/5 transition-colors"
      >
        {safeStatusLabel(status)} <ChevronDown size={11} />
      </button>
      {open && dropPos && createPortal(
        <>
          <div className="fixed inset-0 z-[200]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[201] bg-blanco border border-negro/10 rounded-xl shadow-lg py-1 min-w-[140px]"
            style={{ top: dropPos.top, right: dropPos.right }}
          >
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={(e) => { e.stopPropagation(); select(s); }}
                className={`w-full text-left px-3 py-2 text-[0.78rem] hover:bg-crema/60 transition-colors ${s === status ? "font-semibold text-negro" : "text-gris"}`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

function DetailPanel({
  lead,
  asesores,
  onClose,
  onStatusChange,
  onReassign,
}: {
  lead: LeadRow;
  asesores: AsesorOption[];
  onClose: () => void;
  onStatusChange: (id: string, s: ContactStatus) => void;
  onReassign: (leadId: string, asesorId: string | null, name: string | null) => void;
}) {
  console.log("[leads] DetailPanel render:", { id: lead.id, name: lead.name, status: lead.status, whatsapp: lead.whatsapp });
  const [reassigning, startReassign] = useTransition();
  const [newAsesorId, setNewAsesorId] = useState(lead.assigned_asesor_id ?? "");
  const [reassignError, setReassignError] = useState<string | null>(null);
  const [sending, startSend] = useTransition();
  const [sendMsg, setSendMsg] = useState<string | null>(null);

  function handleReassign() {
    const targetId = newAsesorId || null;
    const asesor = asesores.find((a) => a.id === targetId);
    startReassign(async () => {
      const { error } = await reassignLead(lead.id, targetId);
      if (error) {
        setReassignError(error);
      } else {
        setReassignError(null);
        onReassign(lead.id, targetId, asesor?.full_name ?? null);
      }
    });
  }

  function handleResend() {
    setSendMsg(null);
    startSend(async () => {
      const { error } = await resendLeadNotification(lead.id);
      setSendMsg(error ?? "✓ Enviado al número central");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="flex-1 bg-negro/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-[480px] bg-blanco h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-negro/[0.07] shrink-0">
          <div>
            <h3 className="font-serif text-[1.3rem] text-negro leading-tight">
              {lead.name}
            </h3>
            <p className="text-[0.75rem] text-gris mt-0.5">
              {formatDate(lead.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={lead.status} />
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-negro/5 text-gris transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Contacto */}
          <section className="space-y-2">
            <h4 className="text-[0.65rem] uppercase tracking-[2px] text-dorado font-medium">
              Contacto
            </h4>
            <div className="space-y-1.5 text-[0.82rem]">
              <div className="flex items-center gap-2 text-gris">
                <Phone size={13} className="shrink-0 text-gris/50" />
                <span className="font-medium text-negro">{lead.whatsapp}</span>
              </div>
              {lead.email && (
                <div className="flex items-center gap-2 text-gris">
                  <Mail size={13} className="shrink-0 text-gris/50" />
                  <span>{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-gris">
                  <Phone size={13} className="shrink-0 text-gris/50" />
                  <span>{lead.phone}</span>
                </div>
              )}
            </div>
          </section>

          {/* Evento */}
          <section className="space-y-2">
            <h4 className="text-[0.65rem] uppercase tracking-[2px] text-dorado font-medium">
              Evento
            </h4>
            <div className="space-y-1.5 text-[0.82rem]">
              {lead.subject && (
                <div className="flex items-center gap-2 text-gris">
                  <Tag size={13} className="shrink-0 text-gris/50" />
                  <span>{lead.subject}</span>
                </div>
              )}
              {lead.event_date && (
                <div className="flex items-center gap-2 text-gris">
                  <Calendar size={13} className="shrink-0 text-gris/50" />
                  <span>Fecha estimada: {lead.event_date}</span>
                </div>
              )}
              {lead.guest_count && (
                <div className="flex items-center gap-2 text-gris">
                  <Users size={13} className="shrink-0 text-gris/50" />
                  <span>{lead.guest_count} invitados</span>
                </div>
              )}
            </div>
          </section>

          {/* Mensaje */}
          <section className="space-y-2">
            <h4 className="text-[0.65rem] uppercase tracking-[2px] text-dorado font-medium">
              Mensaje
            </h4>
            <p className="text-[0.82rem] text-gris leading-relaxed bg-crema/60 rounded-xl p-4">
              {lead.message}
            </p>
          </section>

          {/* Estado */}
          <section className="space-y-2">
            <h4 className="text-[0.65rem] uppercase tracking-[2px] text-dorado font-medium">
              Estado
            </h4>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(lead.id, s)}
                  className={`text-[0.72rem] px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                    lead.status === s
                      ? STATUS_STYLE[s] + " shadow-sm"
                      : "border-negro/10 text-gris hover:bg-negro/5"
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </section>

          {/* Reasignar asesor */}
          <section className="space-y-2">
            <h4 className="text-[0.65rem] uppercase tracking-[2px] text-dorado font-medium">
              Asesor asignado
            </h4>
            <div className="flex gap-2">
              <select
                value={newAsesorId}
                onChange={(e) => setNewAsesorId(e.target.value)}
                className="flex-1 text-[0.82rem] border border-negro/10 rounded-lg px-3 py-2 bg-blanco text-negro focus:outline-none focus:border-dorado"
              >
                <option value="">Sin asignar</option>
                {asesores.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name ?? a.id}
                  </option>
                ))}
              </select>
              <button
                onClick={handleReassign}
                disabled={reassigning}
                className="flex items-center gap-1.5 px-3 py-2 bg-negro text-blanco text-[0.75rem] font-medium rounded-lg hover:bg-negro/80 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={13} className={reassigning ? "animate-spin" : ""} />
                Guardar
              </button>
            </div>
            {reassignError && (
              <p className="text-rojo text-[0.75rem]">{reassignError}</p>
            )}
            {lead.asesor_name && (
              <p className="text-[0.75rem] text-gris">
                Actualmente:{" "}
                <span className="font-medium text-negro">{lead.asesor_name}</span>
              </p>
            )}
          </section>
        </div>

        {/* Footer — acciones */}
        <div className="px-6 py-4 border-t border-negro/[0.07] shrink-0 space-y-2">
          <a
            href={buildWALink(lead)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-blanco py-3 rounded-xl text-[0.85rem] font-medium hover:bg-[#20ba5a] transition-colors"
          >
            <MessageCircle size={16} />
            Contactar por WhatsApp
          </a>
          <button
            onClick={handleResend}
            disabled={sending}
            className="flex items-center justify-center gap-2 w-full border border-negro/10 text-gris py-2.5 rounded-xl text-[0.82rem] font-medium hover:bg-negro/5 transition-colors disabled:opacity-50"
          >
            <Send size={14} className={sending ? "animate-pulse" : ""} />
            {sending ? "Enviando…" : "Reenviar WhatsApp (central + asesor)"}
          </button>
          {sendMsg && (
            <p
              className={`text-[0.72rem] text-center ${
                sendMsg.startsWith("✓") ? "text-verde-bosque" : "text-rojo"
              }`}
            >
              {sendMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const inputBase =
  "text-[0.8rem] border border-negro/10 rounded-lg px-3 py-2 bg-blanco text-negro focus:outline-none focus:border-dorado";

export function LeadsManager({
  initialLeads,
  asesores,
}: {
  initialLeads: LeadRow[];
  asesores: AsesorOption[];
}) {
  const [leads, setLeads] = useState<LeadRow[]>(initialLeads);
  const [selected, setSelected] = useState<LeadRow | null>(null);

  // Filtros
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAsesor, setFilterAsesor] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const subjects = useMemo(
    () =>
      Array.from(new Set(leads.map((l) => l.subject).filter(Boolean))).sort() as string[],
    [leads]
  );

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      if (filterAsesor !== "all") {
        if (filterAsesor === "__none__") {
          if (l.assigned_asesor_id !== null) return false;
        } else if (l.assigned_asesor_id !== filterAsesor) return false;
      }
      if (filterSubject !== "all" && l.subject !== filterSubject) return false;
      if (filterDateFrom && l.created_at.slice(0, 10) < filterDateFrom) return false;
      if (filterDateTo && l.created_at.slice(0, 10) > filterDateTo) return false;
      return true;
    });
  }, [leads, filterStatus, filterAsesor, filterSubject, filterDateFrom, filterDateTo]);

  const counts = useMemo(
    () => ({
      total: leads.length,
      unread: leads.filter((l) => l.status === "unread").length,
      en_proceso: leads.filter((l) => l.status === "en_proceso").length,
      replied: leads.filter((l) => l.status === "replied").length,
    }),
    [leads]
  );

  function handleStatusChange(id: string, status: ContactStatus) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev));
    void updateContactStatus(id, status);
  }

  function handleReassign(
    leadId: string,
    asesorId: string | null,
    name: string | null
  ) {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, assigned_asesor_id: asesorId, asesor_name: name }
          : l
      )
    );
    setSelected((prev) =>
      prev?.id === leadId
        ? { ...prev, assigned_asesor_id: asesorId, asesor_name: name }
        : prev
    );
  }

  const hasFilters =
    filterStatus !== "all" ||
    filterAsesor !== "all" ||
    filterSubject !== "all" ||
    filterDateFrom !== "" ||
    filterDateTo !== "";

  function clearFilters() {
    setFilterStatus("all");
    setFilterAsesor("all");
    setFilterSubject("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  }

  return (
    <>
      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.total, color: "text-negro" },
          { label: "Nuevos", value: counts.unread, color: "text-rojo" },
          { label: "En proceso", value: counts.en_proceso, color: "text-dorado" },
          { label: "Respondidos", value: counts.replied, color: "text-verde-bosque" },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-blanco rounded-xl border border-negro/[0.07] px-4 py-3 flex items-center justify-between"
          >
            <span className="text-[0.75rem] text-gris">{k.label}</span>
            <span className={`text-[1.4rem] font-bold ${k.color}`}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-blanco rounded-xl border border-negro/[0.07] p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={inputBase}
          >
            <option value="all">Todos los estados</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>

          <select
            value={filterAsesor}
            onChange={(e) => setFilterAsesor(e.target.value)}
            className={inputBase}
          >
            <option value="all">Todos los asesores</option>
            <option value="__none__">Sin asignar</option>
            {asesores.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name ?? a.id}
              </option>
            ))}
          </select>

          {subjects.length > 0 && (
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className={inputBase}
            >
              <option value="all">Todos los tipos</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className={inputBase}
            title="Desde"
            placeholder="Desde"
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className={inputBase}
            title="Hasta"
            placeholder="Hasta"
          />

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-[0.78rem] text-gris hover:text-rojo transition-colors"
            >
              <X size={13} />
              Limpiar
            </button>
          )}

        </div>
        <p className="text-[0.72rem] text-gris/70">
          {filtered.length} de {leads.length} leads
        </p>
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <div className="bg-blanco rounded-2xl border border-negro/[0.07] p-12 text-center">
          <Inbox size={32} className="mx-auto text-dorado/40 mb-3" />
          <p className="text-gris text-[0.88rem]">
            {hasFilters ? "Ningún lead coincide con los filtros." : "Aún no hay leads registrados."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop: tabla */}
          <div className="hidden lg:block bg-blanco rounded-2xl border border-negro/[0.07] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[0.78rem]">
                <thead>
                  <tr className="border-b border-negro/[0.07] bg-crema/40">
                    <th className="text-left px-4 py-3 text-[0.65rem] uppercase tracking-[1.5px] text-gris font-medium">
                      Fecha
                    </th>
                    <th className="text-left px-4 py-3 text-[0.65rem] uppercase tracking-[1.5px] text-gris font-medium">
                      Nombre
                    </th>
                    <th className="text-left px-4 py-3 text-[0.65rem] uppercase tracking-[1.5px] text-gris font-medium">
                      WhatsApp
                    </th>
                    <th className="text-left px-4 py-3 text-[0.65rem] uppercase tracking-[1.5px] text-gris font-medium">
                      Tipo
                    </th>
                    <th className="text-left px-4 py-3 text-[0.65rem] uppercase tracking-[1.5px] text-gris font-medium">
                      Fecha est.
                    </th>
                    <th className="text-left px-4 py-3 text-[0.65rem] uppercase tracking-[1.5px] text-gris font-medium">
                      Invitados
                    </th>
                    <th className="text-left px-4 py-3 text-[0.65rem] uppercase tracking-[1.5px] text-gris font-medium">
                      Asesor
                    </th>
                    <th className="text-left px-4 py-3 text-[0.65rem] uppercase tracking-[1.5px] text-gris font-medium">
                      Estado
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-negro/[0.04]">
                  {filtered.map((l) => (
                    <tr
                      key={l.id}
                      onClick={() => {
                        console.log("[leads] click tr:", { id: l.id, name: l.name, status: l.status, whatsapp: l.whatsapp, message: l.message?.slice(0, 60) });
                        setSelected(l);
                      }}
                      className="hover:bg-crema/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3 text-gris whitespace-nowrap">
                        {formatDate(l.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-negro">{l.name}</p>
                        {l.email && (
                          <p className="text-gris text-[0.72rem] truncate max-w-[160px]">
                            {l.email}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gris whitespace-nowrap">
                        {l.whatsapp}
                      </td>
                      <td className="px-4 py-3 text-gris">
                        {l.subject ?? <span className="text-gris/40">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gris whitespace-nowrap">
                        {l.event_date ?? <span className="text-gris/40">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gris text-center">
                        {l.guest_count ?? <span className="text-gris/40">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gris">
                        {l.asesor_name ?? (
                          <span className="text-gris/40 italic text-[0.72rem]">
                            Sin asignar
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <StatusSelect
                          id={l.id}
                          status={l.status}
                          onChange={handleStatusChange}
                        />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={buildWALink(l)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#25D366] text-blanco text-[0.7rem] font-medium rounded-lg hover:bg-[#20ba5a] transition-colors"
                        >
                          <MessageCircle size={12} />
                          WA
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map((l) => (
              <div
                key={l.id}
                onClick={() => {
                  console.log("[leads] click card:", { id: l.id, name: l.name, status: l.status, whatsapp: l.whatsapp, message: l.message?.slice(0, 60) });
                  setSelected(l);
                }}
                className={`bg-blanco rounded-2xl border p-4 cursor-pointer transition-colors ${
                  l.status === "unread"
                    ? "border-rojo/20 shadow-sm"
                    : "border-negro/[0.07]"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-serif font-medium text-negro">{l.name}</p>
                    <p className="text-[0.72rem] text-gris mt-0.5">
                      {formatDate(l.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.75rem] text-gris mb-3">
                  {l.subject && (
                    <span className="flex items-center gap-1">
                      <Tag size={10} /> {l.subject}
                    </span>
                  )}
                  {l.event_date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={10} /> {l.event_date}
                    </span>
                  )}
                  {l.guest_count && (
                    <span className="flex items-center gap-1">
                      <Users size={10} /> {l.guest_count} inv.
                    </span>
                  )}
                </div>
                <p className="text-[0.78rem] text-gris line-clamp-2 mb-3">
                  {l.message}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[0.72rem] text-gris">
                    <User size={11} />
                    {l.asesor_name ?? (
                      <span className="italic text-gris/50">Sin asignar</span>
                    )}
                  </div>
                  <a
                    href={buildWALink(l)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#25D366] text-blanco text-[0.72rem] font-medium rounded-lg hover:bg-[#20ba5a] transition-colors"
                  >
                    <MessageCircle size={12} />
                    WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detail panel — via portal para evitar que fixed quede atrapado en un ancestro con transform/backdrop-filter */}
      {selected &&
        createPortal(
          <DetailPanel
            lead={selected}
            asesores={asesores}
            onClose={() => setSelected(null)}
            onStatusChange={handleStatusChange}
            onReassign={handleReassign}
          />,
          document.body
        )}
    </>
  );
}
