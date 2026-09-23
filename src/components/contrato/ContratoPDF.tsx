import type { ReactNode } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import {
  HACIENDA_INFO,
  VARIABLE_ITEM_LABELS,
  VARIABLE_ITEM_TYPES,
  VARIABLE_ITEM_ORDER,
  DEFAULT_CONTRACT_ITEMS,
  type ContractItems,
  type HaciendaData,
} from "@/lib/contract-items";
import { BRAND } from "@/config/brand";

const NEGRO = "#0F0F0F";
const GRIS  = "#666666";
const LINEA = "#CCCCCC";

const ORDINALS = [
  "PRIMERA", "SEGUNDA", "TERCERA", "CUARTA", "QUINTA", "SEXTA",
  "SÉPTIMA", "OCTAVA", "NOVENA", "DÉCIMA",
  "DÉCIMA PRIMERA", "DÉCIMA SEGUNDA", "DÉCIMA TERCERA", "DÉCIMA CUARTA",
  "DÉCIMA QUINTA", "DÉCIMA SEXTA", "DÉCIMA SÉPTIMA", "DÉCIMA OCTAVA",
  "DÉCIMA NOVENA", "VIGÉSIMA",
];

const EVENT_LABEL: Record<string, string> = {
  boda:        "Boda",
  quince:      "Quinceañera",
  empresarial: "Evento Empresarial",
  revelacion:  "Revelación de Género",
};

const MONTHS = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: NEGRO,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 50,
    paddingTop: 90,
    paddingBottom: 58,
  },

  // ── Header (repetido en cada página) ────────────────────────────────
  header: {
    position: "absolute",
    top: 10,
    left: 50,
    right: 50,
    alignItems: "center",
  },
  // ratio SVG 640:170 — altura 65pt → ancho proporcional 245pt, centrado
  headerLogo: {
    width: 245,
    height: 65,
  },
  headerLogoFallback: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 4,
  },
  headerLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#D63B2A",
    borderBottomStyle: "solid",
    width: "100%",
    marginTop: 6,
  },

  // ── Footer (repetido en cada página) ────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 10,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: "#D63B2A",
    borderTopStyle: "solid",
    paddingTop: 5,
    alignItems: "center",
  },
  footerText: {
    fontSize: 7.5,
    color: GRIS,
    textAlign: "center",
    lineHeight: 1.55,
  },

  // ── Título ───────────────────────────────────────────────────────────
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12.5,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  // ── Cuerpo ───────────────────────────────────────────────────────────
  body: {
    fontSize: 11,
    lineHeight: 1.65,
    textAlign: "justify",
    marginBottom: 8,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },

  // ── Tabla de ítems (4 columnas) ────────────────────────────────────
  table: {
    marginTop: 8,
    marginBottom: 8,
    borderTopWidth: 0.75,
    borderTopColor: NEGRO,
    borderTopStyle: "solid",
    borderLeftWidth: 0.75,
    borderLeftColor: NEGRO,
    borderLeftStyle: "solid",
  },
  tHead: {
    flexDirection: "row",
    backgroundColor: NEGRO,
  },
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: NEGRO,
    borderBottomStyle: "solid",
  },
  tRowAlt: {
    backgroundColor: "#F6F5F1",
  },
  tHBase: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#FFFFFF",
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderRightWidth: 0.5,
    borderRightColor: "#444444",
    borderRightStyle: "solid",
    textAlign: "center",
    letterSpacing: 0.4,
  },
  tHLast: {
    borderRightWidth: 0,
  },
  tItem: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRightWidth: 0.75,
    borderRightColor: NEGRO,
    borderRightStyle: "solid",
    textAlign: "left",
  },
  tQty: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRightWidth: 0.75,
    borderRightColor: NEGRO,
    borderRightStyle: "solid",
    textAlign: "center",
  },
  tQtyLast: {
    borderRightWidth: 1,
    borderRightColor: LINEA,
    borderRightStyle: "solid",
  },
  wItem: { width: "35%" },
  wQty:  { width: "15%" },

  // ── Nota de capilla (solo cuando capilla=true) ───────────────────────
  capillaNote: {
    fontFamily: "Helvetica-BoldOblique",
    fontSize: 11,
    textDecoration: "underline",
    textAlign: "justify",
    lineHeight: 1.65,
    marginTop: 6,
    marginBottom: 8,
  },

  // ── Firmas ───────────────────────────────────────────────────────────
  firmasRow: {
    flexDirection: "row",
    marginTop: 30,
    gap: 24,
  },
  firmaBox: {
    flex: 1,
  },
  firmaRole: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 24,
  },
  firmaImgWrap: {
    height: 46,
    marginBottom: 2,
  },
  firmaImg: {
    width: 90,
    height: 44,
    objectFit: "contain",
  },
  firmaLine: {
    borderBottomWidth: 0.75,
    borderBottomColor: NEGRO,
    borderBottomStyle: "solid",
    width: "85%",
    marginBottom: 3,
  },
  firmaName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  firmaCC: {
    fontSize: 9.5,
  },
  firmaRoleLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    marginTop: 1,
  },
});

// ── Tipos públicos ──────────────────────────────────────────────────────
export interface ContractPDFData {
  clientName:         string;
  clientCc:           string;
  clientPhone:        string;
  clientAddress:      string;
  clientEmail:        string;
  eventType:          string;
  eventDate:          string;
  eventStartTime:     string;
  eventEndTime:       string;
  guestCount:         number;
  capilla:            boolean | null;
  valorTotal:         number | null;
  valorAnticipo:      number | null;
  fechaSegundoAbono:  string | null;
  valorSegundoAbono:  number | null;
  fechaTercerAbono:   string | null;
  valorTercerAbono:   number | null;
  contractItems:      ContractItems;
  clauses:            string[];
  extraClauses?:      { text: string }[];
  firmaUrl:           string | null;
  logoUrl?:           string | null;
  version:            number;
  generatedAt:        string;
  otroSi?:            string;
  haciendaData?:      HaciendaData;
}

// ── Helpers ────────────────────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${parseInt(day)} del mes de ${MONTHS[parseInt(m) - 1]} del ${y}`;
}

function fmtDateFile(d: string | null) {
  if (!d) return "Fecha";
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
}

function fmtTime(t: string): string {
  if (!t) return "—";
  const [h, min] = t.split(":");
  const hours = parseInt(h, 10);
  const ampm = hours >= 12 ? "P.M." : "A.M.";
  const h12 = hours % 12 || 12;
  return `${h12}:${min} ${ampm}`;
}

function fmtPhone(n: string): string {
  const clean = n.replace(/\D/g, "");
  if (clean.length === 10) return `+57 ${clean.slice(0, 3)} ${clean.slice(3, 7)} ${clean.slice(7)}`;
  return n;
}

function fmtMoney(n: number | null) {
  if (!n) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(n);
}

// Reemplaza {{variable}} con valores en negrilla, texto plano lo demás
function renderTemplate(template: string, vars: Record<string, string>) {
  const result: ReactNode[] = [];
  const regex = /\{\{(\w+)\}\}/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) result.push(template.slice(lastIndex, match.index));
    result.push(<Text key={key++} style={s.bold}>{vars[match[1]] ?? `[${match[1]}]`}</Text>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < template.length) result.push(template.slice(lastIndex));
  return result;
}

type ItemRow = { label: string; value: string };

function buildItemRows(items: ContractItems, capilla: boolean | null): ItemRow[] {
  const rows: ItemRow[] = [];
  const merged = { ...DEFAULT_CONTRACT_ITEMS, ...items };

  for (const key of VARIABLE_ITEM_ORDER) {
    const val  = merged[key as keyof ContractItems];
    const type = VARIABLE_ITEM_TYPES[key as keyof ContractItems];

    if (type === "sino-fixed-1" || type === "sino") {
      if (!val) continue;
    } else if (type === "cantidad") {
      if (!val || parseInt(val as string, 10) <= 0) continue;
    } else {
      if (!val || !(val as string).trim()) continue;
    }

    let displayVal: string;
    if (type === "sino-fixed-1") {
      displayVal = "1";
    } else if (type === "sino") {
      const k = key as keyof ContractItems;
      displayVal = (k === "gaseosa_agua" || k === "coctel") ? "(ILIMITADO)" : "Sí";
    } else {
      displayVal = String(val);
    }

    rows.push({
      label: VARIABLE_ITEM_LABELS[key as keyof ContractItems].toUpperCase(),
      value: displayVal,
    });
  }

  if (capilla === true) {
    rows.push({ label: "CAPILLA", value: "Sí" });
  }

  return rows;
}

// ── Componente ──────────────────────────────────────────────────────────
export function ContratoPDF({
  clientName, clientCc, clientPhone, clientAddress, clientEmail,
  eventType, eventDate, eventStartTime, eventEndTime, guestCount, capilla,
  valorTotal, valorAnticipo, fechaSegundoAbono, valorSegundoAbono, fechaTercerAbono, valorTercerAbono,
  contractItems, clauses, extraClauses, firmaUrl, logoUrl, otroSi,
  haciendaData,
}: ContractPDFData) {
  const h: HaciendaData = haciendaData ?? { ...HACIENDA_INFO };

  const itemRows = buildItemRows(contractItems, capilla);
  const pairs: [ItemRow, ItemRow | null][] = [];
  for (let i = 0; i < itemRows.length; i += 2) {
    pairs.push([itemRows[i], itemRows[i + 1] ?? null]);
  }

  const now    = new Date();
  const nowDay = now.getDate();
  const nowMon = MONTHS[now.getMonth()];
  const nowYr  = now.getFullYear();

  // Variables dinámicas compartidas entre cláusulas
  const templateVars: Record<string, string> = {
    fecha_evento:         fmtDate(eventDate),
    hora_inicio:          fmtTime(eventStartTime),
    hora_fin:             fmtTime(eventEndTime),
    tipo_evento:          (EVENT_LABEL[eventType] ?? eventType).toUpperCase(),
    num_invitados:        String(guestCount),
    cliente_direccion:    clientAddress || "—",
    cliente_telefono:     clientPhone ? fmtPhone(clientPhone) : "—",
    cliente_email:        clientEmail || "—",
    valor_total:          fmtMoney(valorTotal),
    valor_anticipo:       fmtMoney(valorAnticipo),
    fecha_segundo_abono:  fmtDate(fechaSegundoAbono),
    valor_segundo_abono:  fmtMoney(valorSegundoAbono),
    fecha_tercer_abono:   fmtDate(fechaTercerAbono),
    valor_tercer_abono:   fmtMoney(valorTercerAbono),
  };

  // Cláusulas 3–N: array para renderizar título en bold
  const clauseItems: { title: string; text: string }[] = [];
  for (let i = 2; i < clauses.length; i++) {
    const text = clauses[i];
    if (!text) continue;
    clauseItems.push({ title: `CLAUSULA ${ORDINALS[i] ?? `N°${i + 1}`}: `, text });
  }

  return (
    <Document
      title={`${EVENT_LABEL[eventType] ?? eventType} ${fmtDateFile(eventDate)} ${clientName}`}
      author={h.nombre}
      subject="Contrato de prestación de servicios"
    >
      <Page size="LETTER" style={s.page}>

        {/* ── Header fijo ─── */}
        <View style={s.header} fixed>
          {logoUrl ? (
            <Image src={logoUrl} style={s.headerLogo} />
          ) : (
            <Text style={s.headerLogoFallback}>{h.nombre}</Text>
          )}
          <View style={s.headerLine} />
        </View>

        {/* ── Título ─── */}
        <Text style={s.title}>
          {"CONTRATO DE PRESTACIÓN DE SERVICIOS Y SUMINISTROS"}
        </Text>

        {/* ── Intro + Cláusulas 1 y 2 (texto corrido) ─── */}
        <Text style={s.body}>
          {"Entre los suscritos a saber "}
          <Text style={s.bold}>{h.representante.toUpperCase()}</Text>
          {" mayor de edad y vecino de Bogotá, identificada con C.C "}
          <Text style={s.bold}>{h.cc_representante}</Text>
          {", como representante legal de la "}
          <Text style={s.bold}>{h.nombre}</Text>
          {" NIT "}
          <Text style={s.bold}>{h.nit}</Text>
          {", parte que en lo sucesivo y que para efectos del siguiente contrato se denominará "}
          <Text style={s.bold}>{"EL CONTRATISTA"}</Text>
          {" por una parte; y por la otra "}
          <Text style={s.bold}>{clientName.toUpperCase()}</Text>
          {" mayor de edad, identificado(a) con CC "}
          <Text style={s.bold}>{clientCc}</Text>
          {", quien de ahora en adelante se llamará el "}
          <Text style={s.bold}>{"CONTRATANTE"}</Text>
          {", hemos acordado celebrar el presente contrato contenido dentro de las siguientes cláusulas: "}
          <Text style={s.bold}>{"CLAUSULA PRIMERA – OBJETO: "}</Text>
          {renderTemplate(clauses[0] ?? "", templateVars)}
          {" "}
          <Text style={s.bold}>{"CLAUSULA SEGUNDA: "}</Text>
          {renderTemplate(clauses[1] ?? "", templateVars)}
        </Text>

        {/* ── Tabla de ítems (4 columnas) ─── */}
        <View style={s.table}>
          <View style={s.tHead}>
            <Text style={[s.tHBase, s.wItem]}>{"ÍTEM"}</Text>
            <Text style={[s.tHBase, s.wQty]}>{"CANTIDAD"}</Text>
            <Text style={[s.tHBase, s.wItem]}>{"ÍTEM"}</Text>
            <Text style={[s.tHBase, s.wQty, s.tHLast]}>{"CANTIDAD"}</Text>
          </View>
          {pairs.map(([left, right], i) => (
            <View key={i} style={[s.tRow, i % 2 === 1 ? s.tRowAlt : {}]}>
              <Text style={[s.tItem, s.wItem]}>{left.label}</Text>
              <Text style={[s.tQty, s.wQty]}>{left.value}</Text>
              <Text style={[s.tItem, s.wItem]}>{right ? right.label : ""}</Text>
              <Text style={[s.tQty, s.wQty, s.tQtyLast]}>
                {right ? right.value : ""}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Nota de capilla (solo cuando capilla=true) ─── */}
        {capilla === true && (
          <Text style={s.capillaNote}>
            {"CAPILLA, montaje interno ó externo: interno capilla decorada con telas en el techo y cortinas en las paredes, silletería tifanny, alfombra roja, reclinatorio, diván, mesa sacerdote, arreglos decorativos, canastilla para pétalos, almohada para argollas, atril. Externo, zonas verdes, altar con telas, silletería tifanny, alfombra roja, reclinatorio, diván, mesa sacerdote, arreglos decorativos, canastilla para pétalos, almohada para argollas, atril."}
          </Text>
        )}

        {/* ── Cláusulas 3–N: bloque continuo, títulos en bold ─── */}
        <Text style={s.body}>
          {clauseItems.map((c, i) => (
            <Text key={i}>
              {"  "}
              <Text style={s.bold}>{c.title}</Text>
              {renderTemplate(c.text, templateVars)}
            </Text>
          ))}
          {extraClauses && extraClauses.length > 0 && extraClauses.map((ec, i) => (
            <Text key={`extra-${i}`}>
              {"  "}
              <Text style={s.bold}>{`CLÁUSULA ADICIONAL ${i + 1}: `}</Text>
              {renderTemplate(ec.text, templateVars)}
            </Text>
          ))}
        </Text>

        {/* ── Otro Sí ─── */}
        {otroSi ? (
          <Text style={s.body}>
            <Text style={s.bold}>{"OTRO SÍ: "}</Text>
            {otroSi}
          </Text>
        ) : null}

        {/* ── Párrafo de constancia ─── */}
        <Text style={[s.body, { marginTop: 12 }]}>
          {`Para constancia de este, se firman dos copias del mismo tenor en Bogotá, a los ${nowDay} días del mes de ${nowMon} de ${nowYr}.`}
        </Text>

        {/* ── Bloque de firmas ─── */}
        <View style={s.firmasRow}>
          <View style={s.firmaBox}>
            <Text style={s.firmaRole}>{"EL CONTRATISTA"}</Text>
            <View style={s.firmaImgWrap}>
              {firmaUrl ? <Image src={firmaUrl} style={s.firmaImg} /> : null}
            </View>
            <View style={s.firmaLine} />
            <Text style={s.firmaName}>{h.representante}</Text>
            <Text style={s.firmaCC}>{"C.C " + h.cc_representante}</Text>
            <Text style={s.firmaRoleLabel}>{"CONTRATISTA"}</Text>
          </View>
          <View style={s.firmaBox}>
            <Text style={s.firmaRole}>{"EL CONTRATANTE"}</Text>
            <View style={s.firmaImgWrap} />
            <View style={s.firmaLine} />
            <Text style={s.firmaName}>{clientName}</Text>
            <Text style={s.firmaCC}>{"C.C " + clientCc}</Text>
            <Text style={s.firmaRoleLabel}>{"CONTRATANTE"}</Text>
          </View>
        </View>

        {/* ── Footer fijo ─── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {`${BRAND.website}\nDirección ${h.direccion}\nWhatsapp ${fmtPhone(h.whatsapp)}`}
          </Text>
        </View>

      </Page>
    </Document>
  );
}
