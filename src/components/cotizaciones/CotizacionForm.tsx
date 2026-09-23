"use client";

import { useState, useTransition } from "react";
import { FileDown, Loader2, Send, ExternalLink } from "lucide-react";
import {
  calcularPrecio,
  detectarDiaSemana,
  TIPO_EVENTO_LABELS,
  DIA_SEMANA_LABELS,
  type CotizacionConfig,
  type TipoEvento,
  type DiaSemana,
} from "@/lib/cotizacion";
import { generarCotizacionPDF } from "@/app/actions/cotizaciones";

// ── Helpers ────────────────────────────────────────────────────────────

const fieldBase =
  "w-full border px-3 py-2.5 text-[0.83rem] text-negro bg-blanco placeholder:text-gris/40 focus:outline-none transition-colors rounded-lg";

function inputCls(err?: boolean) {
  return `${fieldBase} ${err ? "border-red-400 focus:border-red-400" : "border-negro/10 focus:border-dorado/70"}`;
}

function fmtCOP(n: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[0.72rem] text-gris uppercase tracking-wider mb-1.5">
        {label}
        {required && <span className="text-dorado ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const DIA_DESCUENTO: Record<DiaSemana, number> = {
  sabado_noche: 20,
  viernes: 30,
  domingo: 35,
  sabado_dia_lunes_jueves: 40,
};

// ── Component ──────────────────────────────────────────────────────────

export function CotizacionForm({ config }: { config: CotizacionConfig }) {
  const [tipoEvento, setTipoEvento] = useState<TipoEvento>("boda");
  const [nombreCliente, setNombreCliente] = useState("");
  const [fechaEvento, setFechaEvento] = useState("");
  const [promoHasta, setPromoHasta] = useState("");
  const [numInvitados, setNumInvitados] = useState(100);
  const [diaSemana, setDiaSemana] = useState<DiaSemana>("sabado_noche");
  const [whatsapp, setWhatsapp] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Auto-detect day when date changes
  const handleFechaChange = (val: string) => {
    setFechaEvento(val);
    if (val) setDiaSemana(detectarDiaSemana(val));
  };

  // Real-time price
  const precio = calcularPrecio(numInvitados, diaSemana, config);
  const descPct = DIA_DESCUENTO[diaSemana];

  const handleGenerarPDF = () => {
    setError(null);
    startTransition(async () => {
      const result = await generarCotizacionPDF({
        tipoEvento,
        nombreCliente,
        fechaEvento,
        promoHasta,
        numInvitados,
        diaSemana,
        whatsappCliente: whatsapp || undefined,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setPdfUrl(result.pdfUrl ?? null);
      }
    });
  };

  const handleSendWhatsApp = () => {
    if (!pdfUrl || !whatsapp) return;
    const num = whatsapp.replace(/\D/g, "");
    const msg =
      `¡Hola${nombreCliente ? ` ${nombreCliente}` : ""}! 🌿\n\n` +
      `Te compartimos la cotización de tu evento en *Jardín El Encanto*:\n\n` +
      `📋 Evento: ${TIPO_EVENTO_LABELS[tipoEvento]}\n` +
      `👥 Invitados: ${numInvitados}\n` +
      `💰 Total: ${fmtCOP(precio)}\n\n` +
      `📎 Ver cotización: ${pdfUrl}\n\n` +
      `¡Estamos encantados de celebrar contigo!\n` +
      `🌐 www.hacienda-encanto.com`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const canGenerate =
    nombreCliente.trim() &&
    fechaEvento &&
    promoHasta &&
    numInvitados >= 10;

  const canSendWA = pdfUrl && whatsapp.trim();

  return (
    <div className="space-y-8 max-w-3xl">

      {/* ── Form fields ─────────────────────────────────── */}
      <div className="bg-blanco border border-negro/[0.07] rounded-xl p-6 shadow-sm">
        <h3 className="font-serif text-[1.15rem] text-negro mb-5">
          Datos del evento
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo de evento" required>
            <select
              value={tipoEvento}
              onChange={(e) => setTipoEvento(e.target.value as TipoEvento)}
              className={inputCls()}
            >
              {(Object.entries(TIPO_EVENTO_LABELS) as [TipoEvento, string][]).map(
                ([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                )
              )}
            </select>
          </Field>

          <Field label="Señor/a" required>
            <input
              type="text"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              placeholder="Nombre completo del cliente"
              className={inputCls()}
            />
          </Field>

          <Field label="Fecha del evento" required>
            <input
              type="date"
              value={fechaEvento}
              onChange={(e) => handleFechaChange(e.target.value)}
              className={inputCls()}
            />
          </Field>

          <Field label="Promoción válida hasta" required>
            <input
              type="date"
              value={promoHasta}
              onChange={(e) => setPromoHasta(e.target.value)}
              className={inputCls()}
            />
          </Field>

          <Field label="Número de invitados" required>
            <input
              type="number"
              min={10}
              value={numInvitados}
              onChange={(e) => setNumInvitados(Math.max(10, parseInt(e.target.value) || 10))}
              className={inputCls()}
            />
          </Field>

          <Field label="Tipo de fecha / Descuento">
            <select
              value={diaSemana}
              onChange={(e) => setDiaSemana(e.target.value as DiaSemana)}
              className={inputCls()}
            >
              {(Object.entries(DIA_SEMANA_LABELS) as [DiaSemana, string][]).map(
                ([val, label]) => (
                  <option key={val} value={val}>
                    {label} ({DIA_DESCUENTO[val]}% dto.)
                  </option>
                )
              )}
            </select>
          </Field>
        </div>
      </div>

      {/* ── Price preview ───────────────────────────────── */}
      <div className="bg-negro rounded-xl p-6">
        <p className="text-blanco/50 text-[0.72rem] uppercase tracking-wider mb-1">
          Precio estimado
        </p>
        <p className="font-serif text-[2.2rem] text-dorado leading-none">
          {fmtCOP(precio)}
        </p>
        <p className="text-blanco/40 text-[0.78rem] mt-2">
          {TIPO_EVENTO_LABELS[tipoEvento]} · {numInvitados} invitados ·{" "}
          {DIA_SEMANA_LABELS[diaSemana]} ({descPct}% descuento)
        </p>
      </div>

      {/* ── Generate PDF ────────────────────────────────── */}
      <div className="space-y-3">
        {error && (
          <p className="text-red-500 text-[0.83rem] bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleGenerarPDF}
          disabled={!canGenerate || isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-rojo text-blanco text-[0.83rem] font-medium rounded-lg hover:bg-rojo/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <FileDown size={15} />
          )}
          {isPending ? "Generando PDF…" : "Generar cotización PDF"}
        </button>

        {!canGenerate && (
          <p className="text-gris text-[0.75rem]">
            Completa Señor/a, Fecha del evento, Promoción válida hasta y al menos 10 invitados.
          </p>
        )}
      </div>

      {/* ── PDF result + WhatsApp ───────────────────────── */}
      {pdfUrl && (
        <div className="bg-blanco border border-dorado/30 rounded-xl p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-dorado/10 flex items-center justify-center shrink-0">
              <FileDown size={16} className="text-dorado" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.83rem] font-medium text-negro">
                Cotización generada
              </p>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[0.75rem] text-dorado hover:underline"
              >
                Ver / Descargar PDF <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* WhatsApp send */}
          <div className="border-t border-negro/[0.06] pt-4 space-y-3">
            <p className="text-[0.72rem] text-gris uppercase tracking-wider">
              Enviar por WhatsApp
            </p>
            <div className="flex gap-2">
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="WhatsApp cliente (ej: 3001234567)"
                className={`flex-1 ${inputCls()}`}
              />
              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={!canSendWA}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-blanco text-[0.83rem] font-medium rounded-lg hover:bg-[#1ebe5d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send size={14} />
                Enviar
              </button>
            </div>
            <p className="text-[0.72rem] text-gris/70">
              El mensaje incluye el enlace al PDF de la cotización.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
