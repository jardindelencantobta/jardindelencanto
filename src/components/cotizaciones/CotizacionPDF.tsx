import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type {
  CotizacionConfig,
  CotizacionSeccion,
  DiaSemana,
  TipoEvento,
} from "@/lib/cotizacion";
import { BRAND, SOCIAL, WHATSAPP } from "@/config/brand";

const ROJO  = "#D63B2A";
const NEGRO = "#0F0F0F";
const GRIS  = "#666666";
const CREMA = "#F6F5F1";

function fmtCOP(n: number): string {
  const parts = n.toFixed(0).split("").reverse();
  const grouped: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i > 0 && i % 3 === 0) grouped.push(".");
    grouped.push(parts[i]);
  }
  return "$ " + grouped.reverse().join("");
}

function fmtFecha(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const meses = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre",
  ];
  return `${d} de ${meses[parseInt(m, 10) - 1]} de ${y}`;
}

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: NEGRO,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 42,
    paddingTop: 95,
    paddingBottom: 58,
  },
  header: {
    position: "absolute",
    top: 10,
    left: 42,
    right: 42,
    alignItems: "center",
  },
  headerLogo: { width: 195, height: 52 },
  headerFallback: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 3,
  },
  headerContactRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 3,
  },
  headerContact: { fontSize: 7.5, color: GRIS, marginHorizontal: 5 },
  headerLine: {
    borderBottomWidth: 1,
    borderBottomColor: ROJO,
    borderBottomStyle: "solid",
    width: "100%",
    marginTop: 4,
  },

  footer: {
    position: "absolute",
    bottom: 10,
    left: 42,
    right: 42,
    borderTopWidth: 1,
    borderTopColor: ROJO,
    borderTopStyle: "solid",
    paddingTop: 4,
    alignItems: "center",
  },
  footerText: { fontSize: 7, color: GRIS, textAlign: "center" },

  // Document title
  docTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 1,
    letterSpacing: 0.5,
  },
  docSubtitle: { fontSize: 9, textAlign: "center", color: GRIS, marginBottom: 10 },

  // Info rows
  infoRow: { flexDirection: "row", marginBottom: 2.5 },
  infoLabel: { fontFamily: "Helvetica-Bold", fontSize: 8.5, width: 130 },
  infoValue: { fontSize: 8.5, flex: 1 },

  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#DDDDDD",
    borderBottomStyle: "solid",
    marginVertical: 7,
  },

  // Table — outer border left + top
  table: {
    marginTop: 5,
    borderTopWidth: 0.75,
    borderTopColor: NEGRO,
    borderTopStyle: "solid",
    borderLeftWidth: 0.75,
    borderLeftColor: NEGRO,
    borderLeftStyle: "solid",
  },

  // Table header row
  tHead: { flexDirection: "row", backgroundColor: NEGRO },

  // Section title row
  tSeccion: {
    backgroundColor: "#1E1E1E",
    paddingVertical: 3.5,
    paddingHorizontal: 6,
  },
  tSeccionText: {
    fontFamily: "Helvetica-Bold",
    color: "#E8C96E",
    fontSize: 7.5,
    letterSpacing: 0.6,
  },

  // Data rows
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#CCCCCC",
    borderBottomStyle: "solid",
  },
  tRowAlt: { backgroundColor: CREMA },

  // Cells — right + bottom border
  cellBase: {
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRightWidth: 0.75,
    borderRightColor: NEGRO,
    borderRightStyle: "solid",
  },
  cItem:   { width: "7%",  textAlign: "center", fontSize: 7.5 },
  cNombre: { width: "48%", fontSize: 8.5 },
  cDesc:   { width: "25%", fontSize: 7.5, color: GRIS },
  cCant:   { width: "20%", textAlign: "center", fontSize: 8.5 },
  cHead:   { fontFamily: "Helvetica-Bold", color: "#FFFFFF", fontSize: 7.5, letterSpacing: 0.3 },

  // Total section
  totalWrap: { marginTop: 12 },
  totalLine: {
    borderTopWidth: 1.5,
    borderTopColor: NEGRO,
    borderTopStyle: "solid",
    marginBottom: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 11, letterSpacing: 0.3 },
  totalValue: { fontFamily: "Helvetica-Bold", fontSize: 13, color: ROJO },

  promoRow: { flexDirection: "row", marginTop: 7, paddingHorizontal: 4 },
  promoLabel: { fontFamily: "Helvetica-Bold", fontSize: 8.5, marginRight: 4 },
  promoValue: { fontSize: 8.5 },

  notaText: {
    fontSize: 7.5,
    color: GRIS,
    marginTop: 3,
    paddingHorizontal: 4,
    fontStyle: "italic",
  },
});

type Props = {
  tipoEvento: TipoEvento;
  tipoEventoLabel: string;
  nombreCliente: string;
  fechaEvento: string;
  promoHasta: string;
  numInvitados: number;
  diaSemana: DiaSemana;
  diaSemanaLabel: string;
  precioTotal: number;
  secciones: CotizacionSeccion[];
  logoUrl: string | null;
  generatedAt: string;
  config: CotizacionConfig;
};

export function CotizacionPDF({
  tipoEventoLabel,
  nombreCliente,
  fechaEvento,
  promoHasta,
  numInvitados,
  diaSemana,
  diaSemanaLabel,
  precioTotal,
  secciones,
  logoUrl,
  generatedAt,
  config,
}: Props) {
  const descDtoPct: Record<DiaSemana, number> = {
    sabado_noche: config.descuento_sabado_noche,
    viernes: config.descuento_viernes,
    domingo: config.descuento_domingo,
    sabado_dia_lunes_jueves: config.descuento_sabado_dia_lunes_jueves,
  };
  const descDto = descDtoPct[diaSemana];

  // Pre-number all items to avoid mutable counter in JSX
  const flatRows: Array<
    | { type: "section"; titulo: string }
    | { type: "item"; num: number; nombre: string; descripcion: string; cantidad: string; alt: boolean }
  > = [];
  let counter = 0;
  for (const sec of secciones) {
    flatRows.push({ type: "section", titulo: sec.titulo });
    for (const item of sec.items) {
      counter++;
      flatRows.push({
        type: "item",
        num: counter,
        nombre: item.nombre,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        alt: counter % 2 === 0,
      });
    }
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Fixed Header ─────────────────────────────────────── */}
        <View style={s.header} fixed>
          {logoUrl ? (
            <Image src={logoUrl} style={s.headerLogo} />
          ) : (
            <Text style={s.headerFallback}>{BRAND.nameUpper}</Text>
          )}
          <View style={s.headerContactRow}>
            <Text style={s.headerContact}>{BRAND.address}</Text>
            <Text style={s.headerContact}>WhatsApp: {WHATSAPP.display}</Text>
            <Text style={s.headerContact}>{BRAND.email}</Text>
            <Text style={s.headerContact}>{BRAND.website}</Text>
          </View>
          <View style={s.headerLine} />
        </View>

        {/* ── Fixed Footer ─────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {[BRAND.website, SOCIAL.instagram?.handle, BRAND.email].filter(Boolean).join("  ·  ")}
          </Text>
        </View>

        {/* ── Document title ───────────────────────────────────── */}
        <Text style={s.docTitle}>COTIZACIÓN DE EVENTO</Text>
        <Text style={s.docSubtitle}>{tipoEventoLabel}</Text>

        {/* ── Info section ─────────────────────────────────────── */}
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Fecha de cotización:</Text>
          <Text style={s.infoValue}>{generatedAt}</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Señor/a:</Text>
          <Text style={s.infoValue}>{nombreCliente}</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Número de invitados:</Text>
          <Text style={s.infoValue}>{numInvitados}</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Fecha del evento:</Text>
          <Text style={s.infoValue}>{fmtFecha(fechaEvento)}</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Tipo de fecha:</Text>
          <Text style={s.infoValue}>{diaSemanaLabel}</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Promoción válida hasta:</Text>
          <Text style={s.infoValue}>{fmtFecha(promoHasta)}</Text>
        </View>

        <View style={s.divider} />

        {/* ── Items table ──────────────────────────────────────── */}
        <View style={s.table}>

          {/* Column headers */}
          <View style={s.tHead}>
            <Text style={[s.cellBase, s.cItem, s.cHead]}>ITEM</Text>
            <Text style={[s.cellBase, s.cNombre, s.cHead]}>NOMBRE</Text>
            <Text style={[s.cellBase, s.cDesc, s.cHead]}>DESCRIPCIÓN</Text>
            <Text style={[s.cellBase, s.cCant, s.cHead]}>CANTIDAD</Text>
          </View>

          {/* Flat rows (sections + items) */}
          {flatRows.map((row, i) => {
            if (row.type === "section") {
              return (
                <View key={`sec-${i}`} style={s.tSeccion}>
                  <Text style={s.tSeccionText}>{row.titulo}</Text>
                </View>
              );
            }
            return (
              <View
                key={`item-${i}`}
                style={[s.tRow, row.alt ? s.tRowAlt : {}]}
              >
                <Text style={[s.cellBase, s.cItem]}>{row.num}</Text>
                <Text style={[s.cellBase, s.cNombre]}>{row.nombre}</Text>
                <Text style={[s.cellBase, s.cDesc]}>{row.descripcion}</Text>
                <Text style={[s.cellBase, s.cCant]}>{row.cantidad}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Total section ────────────────────────────────────── */}
        <View style={s.totalWrap}>
          <View style={s.totalLine} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>PRECIO TOTAL</Text>
            <Text style={s.totalValue}>{fmtCOP(precioTotal)}</Text>
          </View>

          <View style={s.promoRow}>
            <Text style={s.promoLabel}>Promoción válida hasta:</Text>
            <Text style={s.promoValue}>{fmtFecha(promoHasta)}</Text>
          </View>

          <Text style={s.notaText}>
            * Precio incluye {descDto}% de descuento por {diaSemanaLabel.toLowerCase()}.
          </Text>
          <Text style={s.notaText}>
            * Precios en pesos colombianos. Sujeto a disponibilidad. No incluye IVA.
          </Text>
        </View>

      </Page>
    </Document>
  );
}
