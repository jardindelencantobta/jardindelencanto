#!/usr/bin/env tsx
// Genera docs/acta-entrega.pdf — Acta de entrega del proyecto
// Uso: npx tsx scripts/generate-acta.tsx

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'
import * as fs from 'fs'
import * as path from 'path'

// ─── Palette ──────────────────────────────────────────────────────────────────
const G = {
  black:   '#000000',
  dark:    '#222222',
  medium:  '#555555',
  border:  '#BBBBBB',
  bgLight: '#EEEEEE',
  bgRow:   '#F6F6F6',
  white:   '#FFFFFF',
}

// ─── Paths ────────────────────────────────────────────────────────────────────
const ROOT    = process.cwd()
const OUT     = path.join(ROOT, 'docs', 'acta-entrega.pdf')
const logoBuf = fs.readFileSync(path.join(ROOT, 'public', 'logo-jardin-pdf.png'))
const LOGO    = `data:image/png;base64,${logoBuf.toString('base64')}`
const MARGIN  = 50

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // Cover
  coverPage: {
    backgroundColor: G.white,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 60,
    paddingTop: 80,
  },
  coverLogo:      { width: 180, marginBottom: 28 },
  coverSepLine:   { width: '60%', height: 1, backgroundColor: G.border, marginBottom: 28 },
  coverTitle:     {
    fontFamily: 'Helvetica-Bold', fontSize: 26,
    color: G.black, textAlign: 'center', marginBottom: 10, letterSpacing: 1,
  },
  coverSubtitle:  {
    fontFamily: 'Helvetica', fontSize: 13,
    color: G.medium, textAlign: 'center', marginBottom: 32,
  },
  coverSepLine2:  { width: '50%', height: 1, backgroundColor: G.border, marginBottom: 32 },
  coverMetaLabel: {
    fontFamily: 'Helvetica-Bold', fontSize: 9,
    color: G.medium, textAlign: 'center', marginBottom: 4,
  },
  coverMetaValue: {
    fontFamily: 'Helvetica', fontSize: 10,
    color: G.dark, textAlign: 'center', marginBottom: 10,
  },

  // Content page
  page: {
    backgroundColor: G.white,
    paddingTop: 80,
    paddingBottom: 60,
    paddingLeft: MARGIN,
    paddingRight: MARGIN,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: G.dark,
    lineHeight: 1.45,
  },

  // Fixed header
  hdr: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 62,
    paddingTop: 18,
    paddingHorizontal: MARGIN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: G.white,
  },
  hdrLogo:  { width: 80, height: 24 },
  hdrTitle: { fontFamily: 'Helvetica', fontSize: 8, color: G.medium },
  hdrLine:  {
    position: 'absolute', bottom: 0, left: MARGIN, right: MARGIN,
    height: 0.8, backgroundColor: G.border,
  },

  // Fixed footer
  ftr: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 42,
    paddingHorizontal: MARGIN,
    paddingBottom: 14,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: G.white,
  },
  ftrLine: { width: '100%', height: 0.8, backgroundColor: G.border, marginBottom: 8 },
  ftrText: { fontFamily: 'Helvetica', fontSize: 8, color: G.medium, textAlign: 'center' },

  // Section headings
  h2wrap: { marginTop: 20, marginBottom: 10 },
  h2:     { fontFamily: 'Helvetica-Bold', fontSize: 14, color: G.black },
  h2line: { height: 0.8, backgroundColor: G.border, marginTop: 5 },
  h3:     {
    fontFamily: 'Helvetica-Bold', fontSize: 10.5, color: G.dark,
    marginTop: 12, marginBottom: 5,
  },

  // Body
  para:  { marginBottom: 6, lineHeight: 1.5, fontSize: 9 },
  bold:  { fontFamily: 'Helvetica-Bold' },
  note:  {
    borderLeftWidth: 2.5, borderLeftColor: G.border, borderLeftStyle: 'solid',
    paddingLeft: 9, marginBottom: 7, marginTop: 2,
  },
  noteTxt: { fontFamily: 'Helvetica-Oblique', fontSize: 8.5, color: G.medium, lineHeight: 1.5 },

  // Tables
  tbl:    {
    marginBottom: 10, marginTop: 4,
    borderWidth: 0.8, borderColor: G.border,
  },
  tblHdr: { flexDirection: 'row', backgroundColor: G.bgLight },
  tblRow: {
    flexDirection: 'row',
    borderTopWidth: 0.8, borderTopColor: G.border,
  },
  tblRowAlt: { backgroundColor: G.bgRow },
  tblCell:   { flex: 1, padding: 5 },
  tblCell2:  { flex: 2, padding: 5 },
  tblTH:     { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: G.black },
  tblTD:     { fontFamily: 'Helvetica', fontSize: 8.5, color: G.dark, lineHeight: 1.35 },
  tblTDMono: { fontFamily: 'Courier', fontSize: 7.5, color: G.dark, lineHeight: 1.35 },

  // Bullet lists
  listWrap: { marginBottom: 8 },
  listItem: { flexDirection: 'row', marginBottom: 3, paddingLeft: 4 },
  listBul:  { width: 12, fontFamily: 'Helvetica', fontSize: 9, color: G.medium },
  listTxt:  { flex: 1, fontSize: 9, lineHeight: 1.45 },

  // Ordered lists
  olItem: { flexDirection: 'row', marginBottom: 3, paddingLeft: 4 },
  olNum:  { width: 18, fontFamily: 'Helvetica-Bold', fontSize: 9, color: G.medium },
  olTxt:  { flex: 1, fontSize: 9, lineHeight: 1.45 },

  // Signature block
  sigRow: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 40,
  },
  sigCol:  { flex: 1, alignItems: 'center' },
  sigLine: { width: '100%', height: 0.8, backgroundColor: G.dark, marginBottom: 6 },
  sigName: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: G.dark, textAlign: 'center' },
  sigRole: { fontFamily: 'Helvetica', fontSize: 8.5, color: G.medium, textAlign: 'center', marginTop: 2 },
  sigDate: { fontFamily: 'Helvetica', fontSize: 8, color: G.medium, textAlign: 'center', marginTop: 2 },
  sigSpace: { height: 60 },

  // Info key-value pairs
  kvRow:   { flexDirection: 'row', marginBottom: 4 },
  kvLabel: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: G.dark, width: 140 },
  kvValue: { flex: 1, fontFamily: 'Helvetica', fontSize: 9, color: G.dark },
  kvMono:  { flex: 1, fontFamily: 'Courier', fontSize: 8, color: G.dark },

  // Divider
  hr: { height: 0.8, backgroundColor: G.bgLight, marginVertical: 10 },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function H2({ num, title }: { num: number; title: string }) {
  return (
    <View style={S.h2wrap}>
      <Text style={S.h2}>{`${num}. ${title}`}</Text>
      <View style={S.h2line} />
    </View>
  )
}

function H3({ title }: { title: string }) {
  return <Text style={S.h3}>{title}</Text>
}

function KV({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={S.kvRow}>
      <Text style={S.kvLabel}>{label}</Text>
      <Text style={mono ? S.kvMono : S.kvValue}>{value}</Text>
    </View>
  )
}

function Bullet({ text, bold }: { text: string; bold?: string }) {
  return (
    <View style={S.listItem}>
      <Text style={S.listBul}>{'• '}</Text>
      <Text style={S.listTxt}>
        {bold ? <Text style={S.bold}>{bold}</Text> : null}{text}
      </Text>
    </View>
  )
}

function Ordered({ num, text, bold }: { num: number; text: string; bold?: string }) {
  return (
    <View style={S.olItem}>
      <Text style={S.olNum}>{`${num}.`}</Text>
      <Text style={S.olTxt}>
        {bold ? <Text style={S.bold}>{bold}</Text> : null}{text}
      </Text>
    </View>
  )
}

function Note({ text }: { text: string }) {
  return (
    <View style={S.note}>
      <Text style={S.noteTxt}>{text}</Text>
    </View>
  )
}

function TblRow2({ cells, alt, header }: { cells: string[]; alt?: boolean; header?: boolean }) {
  return (
    <View style={[S.tblRow, alt ? S.tblRowAlt : {}]}>
      {cells.map((c, i) => (
        <View key={i} style={i === 0 ? S.tblCell : S.tblCell2}>
          <Text style={header ? S.tblTH : (i === 1 && !header ? S.tblTDMono : S.tblTD)}>{c}</Text>
        </View>
      ))}
    </View>
  )
}

// ─── Cover ────────────────────────────────────────────────────────────────────
function CoverPage() {
  return (
    <Page size="A4" style={S.coverPage}>
      <Image src={LOGO} style={S.coverLogo} />
      <View style={S.coverSepLine} />
      <Text style={S.coverTitle}>ACTA DE ENTREGA</Text>
      <Text style={S.coverSubtitle}>Hacienda El Encanto — Portal de Eventos</Text>
      <View style={S.coverSepLine2} />
      <View style={{ alignItems: 'center' }}>
        <Text style={S.coverMetaLabel}>CLIENTE</Text>
        <Text style={S.coverMetaValue}>Hacienda El Encanto — Juan Carlos Pulido</Text>
        <Text style={S.coverMetaLabel}>DESARROLLADOR</Text>
        <Text style={S.coverMetaValue}>Ing. Jeisson Rincón</Text>
        <Text style={S.coverMetaLabel}>FECHA DE ENTREGA</Text>
        <Text style={S.coverMetaValue}>29 de julio de 2026</Text>
      </View>
    </Page>
  )
}

// ─── Content ──────────────────────────────────────────────────────────────────
function ContentPage() {
  return (
    <Page size="A4" style={S.page}>
      {/* Header fijo */}
      <View style={S.hdr} fixed>
        <Image src={LOGO} style={S.hdrLogo} />
        <Text style={S.hdrTitle}>Acta de Entrega — Hacienda El Encanto</Text>
        <View style={S.hdrLine} />
      </View>

      {/* Footer fijo */}
      <View style={S.ftr} fixed>
        <View style={S.ftrLine} />
        <Text
          style={S.ftrText}
          render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `Pág. ${pageNumber} / ${totalPages}  •  Acta de Entrega — Hacienda El Encanto`
          }
        />
      </View>

      {/* ── 1. Información general ─────────────────────────────────────────── */}
      <H2 num={1} title="Información general del proyecto" />

      <KV label="Nombre del proyecto" value="Portal de Eventos — Hacienda El Encanto" />
      <KV label="URL de producción" value="https://www.hacienda-encanto.com" mono />
      <KV label="Repositorio" value="github.com/haciendaEncanto/Web" mono />
      <KV label="Fecha de inicio" value="Mayo de 2026" />
      <KV label="Fecha de entrega" value="29 de julio de 2026" />
      <KV label="Stack tecnológico" value="Next.js 16 + TypeScript + Tailwind v4 + Supabase (PostgreSQL + Storage + Auth)" />
      <KV label="Plataforma de deploy" value="Vercel (serverless, build automático desde rama main)" />
      <KV label="Dominio y hosting" value="hacienda-encanto.com — Colombia Hosting (renovación anual)" />

      <View style={S.hr} />

      {/* ── 2. Módulos entregados ──────────────────────────────────────────── */}
      <H2 num={2} title="Módulos entregados" />

      <H3 title="2.1  Sitio público (5 páginas)" />
      <View style={S.listWrap}>
        <Bullet text="Home: NavBar, Hero con video en loop, secciones de eventos, galería aleatoria, testimonios, contacto y footer." />
        <Bullet text="/bodas, /quince-anos, /eventos-empresariales, /revelacion-de-genero: plantilla reutilizable con hero, galería, paquetes y formulario de contacto." />
        <Bullet text="SEO: sitemap.ts y robots.ts nativos de App Router. reCAPTCHA v3 en formularios de contacto." />
      </View>

      <H3 title="2.2  Portal del cliente" />
      <View style={S.listWrap}>
        <Bullet text="Dashboard: cuenta regresiva al evento, accesos rápidos." />
        <Bullet text="Orden de servicio: visualización de secciones con barra de progreso, botón de aprobación." />
        <Bullet text="Actividades: línea de tiempo del evento." />
        <Bullet text="Documentos: descarga de contrato PDF y otros documentos." />
        <Bullet text="Pagos: historial de pagos y subida de comprobante." />
        <Bullet text="Mensajes: link directo a WhatsApp del equipo." />
        <Bullet text="Playlist: toggle de música propia, URLs por tipo de evento." />
        <Bullet text="Invitados: mapa del salón según número de invitados, subir/descargar Excel." />
        <Bullet text="Contrato: visualización, aprobación y solicitud de ajustes." />
        <Bullet text="Perfil: edición de datos y foto de perfil." />
      </View>

      <H3 title="2.3  Portal del wedding planner" />
      <View style={S.listWrap}>
        <Bullet text="Lista de clientes con pestañas Activos / Cumplidos." />
        <Bullet text="Ficha de cliente con tabs: Contrato / Actividades / Invitados / Documentos / Pagos / Playlist." />
        <Bullet text="Creación de clientes: Auth + perfil + booking con validación de solapamiento de horario." />
        <Bullet text="Generación de contrato PDF con ítems configurables y cláusulas dinámicas." />
        <Bullet text="Orden de servicio: formulario completo, inicialización automática al aprobar contrato." />
        <Bullet text="Mapas de salón: upload y gestión de planos por capacidad." />
      </View>

      <H3 title="2.4  Portal del asesor comercial" />
      <View style={S.listWrap}>
        <Bullet text="Panel de leads: lista de contactos asignados, detalle por lead, cambio de estado (Nuevo / En proceso / Respondido)." />
        <Bullet text="Botón wa.me con mensaje prellenado (nombre, tipo de evento, fecha, teléfono)." />
        <Bullet text="Asignación automática round-robin entre asesores activos." />
        <Bullet text="Notificaciones instantáneas vía CallMeBot al recibir un nuevo lead." />
      </View>

      <H3 title="2.5  Portal del staff (DJ / Animador)" />
      <View style={S.listWrap}>
        <Bullet text="Vista acotada: solo eventos de los próximos 15 días." />
        <Bullet text="Playlist del evento en modo solo lectura." />
      </View>

      <H3 title="2.6  Portal del editor" />
      <View style={S.listWrap}>
        <Bullet text="Gestión de galería: subida con drag-and-drop, reordenamiento, archivo/restauración." />
        <Bullet text="Gestión de videos: activar/desactivar video principal por sección." />
        <Bullet text="Imágenes del sitio: 8 imágenes del Home editables (tarjetas de evento, Nosotros, Servicios)." />
        <Bullet text="Testimonios: CRUD completo con foto." />
        <Bullet text="Paquetes: nombre y contenido por tipo de evento (sin precios públicos)." />
        <Bullet text="Contenido: 12 cláusulas del contrato, datos de la hacienda, firma del representante." />
      </View>

      <H3 title="2.7  Panel de administración" />
      <View style={S.listWrap}>
        <Bullet text="Dashboard: KPIs (eventos activos, este mes, realizados), próximos eventos, contactos recientes, EventosManager con filtros." />
        <Bullet text="Gestión de clientes: CRUD completo, acceso a todas las fichas, cambio de contraseña." />
        <Bullet text="Gestión de usuarios del equipo (planner, editor, staff, asesores, gerente): CRUD, activar/desactivar, cambio de contraseña." />
      </View>

      <H3 title="2.8  Módulo de contrato PDF" />
      <View style={S.listWrap}>
        <Bullet text="Generación server-side con react-pdf/renderer: nombre {Tipo} {DD-MM-YYYY} {Cliente}." />
        <Bullet text="Ítems opcionales configurables (DJ, maestro de ceremonias, catering, decoración, etc.)." />
        <Bullet text="12 cláusulas con variables dinámicas: fecha, hora, invitados, dirección, teléfono, email." />
        <Bullet text="Flujo completo: borrador → aprobación cliente → bloqueo → inicialización de orden de servicio." />
      </View>

      <H3 title="2.9  Sistema de leads con round-robin" />
      <View style={S.listWrap}>
        <Bullet text="Formulario de contacto con validación de número WhatsApp colombiano." />
        <Bullet text="Asignación automática al asesor con menos asignaciones y más antiguo en la cola." />
        <Bullet text="Notificación instantánea al número central y al asesor asignado mediante CallMeBot." />
      </View>

      <H3 title="2.10  Seguridad" />
      <View style={S.listWrap}>
        <Bullet text="Headers HTTP: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP, Permissions-Policy." />
        <Bullet text="Rate limiting de login: máx. 5 intentos en 15 minutos, delay progresivo (1s, 2s, 4s…)." />
        <Bullet text="Validación Zod en todos los formularios del servidor." />
        <Bullet text="reCAPTCHA v3 en formularios públicos de contacto." />
        <Bullet text="Row-Level Security (RLS) en todas las tablas de Supabase." />
        <Bullet text="Uploads directos a Supabase Storage vía signed URL (el archivo nunca pasa por el servidor de la app)." />
      </View>

      <View style={S.hr} />

      {/* ── 3. Credenciales ─────────────────────────────────────────────────── */}
      <H2 num={3} title="Credenciales del sistema" />

      <Note text="Las contraseñas de todos los usuarios se entregan en documento separado por razones de seguridad." />

      <H3 title="3.1  URLs del sistema" />
      <View style={[S.tbl, { marginTop: 4 }]}>
        <View style={S.tblHdr}>
          <View style={S.tblCell}><Text style={S.tblTH}>Sistema</Text></View>
          <View style={S.tblCell2}><Text style={S.tblTH}>URL</Text></View>
        </View>
        {[
          ['Portal web', 'https://www.hacienda-encanto.com'],
          ['Supabase Dashboard', 'https://supabase.com/dashboard/project/oewqyckeqolrpjbjevap'],
          ['Vercel Dashboard', 'https://vercel.com/dashboard → proyecto hacienda-encanto'],
          ['Repositorio GitHub', 'https://github.com/haciendaEncanto/Web'],
        ].map(([label, url], i) => (
          <View key={i} style={[S.tblRow, i % 2 !== 0 ? S.tblRowAlt : {}]}>
            <View style={S.tblCell}><Text style={S.tblTD}>{label}</Text></View>
            <View style={S.tblCell2}><Text style={S.tblTDMono}>{url}</Text></View>
          </View>
        ))}
      </View>

      <H3 title="3.2  Usuarios del sistema" />
      <View style={S.tbl}>
        <View style={S.tblHdr}>
          <View style={S.tblCell}><Text style={S.tblTH}>Email</Text></View>
          <View style={S.tblCell}><Text style={S.tblTH}>Rol</Text></View>
          <View style={S.tblCell}><Text style={S.tblTH}>Nombre</Text></View>
        </View>
        {[
          ['admin@hacienda-encanto.com', 'Administrador', 'Admin Hacienda'],
          ['planner@hacienda-encanto.com', 'Wedding Planner', 'Jonny Delgado'],
          ['asesor@hacienda-encanto.com', 'Asesor Comercial', 'David Castillo'],
          ['editor@hacienda-encanto.com', 'Editor', 'Editor Hacienda'],
          ['jeissondeejay11@gmail.com', 'Staff', 'Staff DJ'],
          ['ing_jeisson_rincon@outlook.com', 'Cliente (prueba)', 'Jeisson Rincón'],
        ].map(([email, rol, nombre], i) => (
          <View key={i} style={[S.tblRow, i % 2 !== 0 ? S.tblRowAlt : {}]}>
            <View style={S.tblCell}><Text style={S.tblTDMono}>{email}</Text></View>
            <View style={S.tblCell}><Text style={S.tblTD}>{rol}</Text></View>
            <View style={S.tblCell}><Text style={S.tblTD}>{nombre}</Text></View>
          </View>
        ))}
      </View>

      <View style={S.hr} />

      {/* ── 4. Pendientes y recomendaciones ────────────────────────────────── */}
      <H2 num={4} title="Pendientes y recomendaciones" />

      <Text style={S.para}>
        El sistema está completamente funcional y en producción. Los siguientes ítems
        son operativos o de contenido, y no requieren desarrollo adicional:
      </Text>

      <View style={S.listWrap}>
        <Ordered num={1}
          bold="Videos galería empresarial y revelación de género: "
          text="Subir desde /editor/videos cuando el cliente los entregue. La sección ya está integrada y lista para recibir el contenido." />
        <Ordered num={2}
          bold="Fotos galería empresarial y revelación de género: "
          text="Subir desde /editor/galeria en las categorías correspondientes." />
        <Ordered num={3}
          bold="Tour virtual 360°: "
          text="Ir a la hacienda con el OPPO Reno 12, grabar y procesar en Kuula.com. Luego cargar la URL del tour en /editor/contenido (clave vista_360_url). El botón en el sitio ya está conectado." />
        <Ordered num={4}
          bold="Registrar asesores en CallMeBot: "
          text="Jonny Delgado y David Castillo deben enviar 'I allow callmebot.com to send me messages' al número +1 (347) 798-2047 desde su WhatsApp, obtener su API key, y configurarla en Vercel Environment Variables (CALLMEBOT_API_KEY_CENTRAL)." />
        <Ordered num={5}
          bold="Verificar configuración en Supabase Dashboard: "
          text="(a) JWT expiry en 3600 segundos. (b) Rate Limits adecuados. (c) Bucket 'documents' en modo privado. (d) RLS habilitado en todas las tablas, especialmente login_attempts." />
        <Ordered num={6}
          bold="Renovar dominio anualmente: "
          text="El dominio hacienda-encanto.com está registrado con Colombia Hosting. Renovar antes del vencimiento para evitar pérdida del sitio." />
      </View>

      <View style={S.hr} />

      {/* ── 5. Garantía y soporte ───────────────────────────────────────────── */}
      <H2 num={5} title="Garantía y soporte" />

      <View style={S.listWrap}>
        <Bullet
          bold="Período de garantía: "
          text="30 días calendario a partir de la fecha de entrega (hasta el 29 de agosto de 2026). Durante este período se corregirán sin costo adicional los errores de funcionamiento imputables al desarrollo." />
        <Bullet
          bold="Alcance de la garantía: "
          text="Corrección de bugs en módulos entregados. No incluye nuevas funcionalidades, cambios de diseño ni contenido (fotos, videos, textos)." />
        <Bullet
          bold="Contacto para soporte: "
          text="Ing. Jeisson Rincón — ing_jeisson_rincon@outlook.com" />
        <Bullet
          bold="Fuera de garantía: "
          text="Una vez vencido el período, el soporte y las mejoras se cotizarán por separado según alcance." />
      </View>

      <View style={S.hr} />

      {/* ── 6. Firmas ───────────────────────────────────────────────────────── */}
      <H2 num={6} title="Firmas" />

      <Text style={[S.para, { marginBottom: 4 }]}>
        Con la firma del presente documento, ambas partes declaran conformidad con
        los módulos entregados y las condiciones descritas en este acta.
      </Text>

      <View style={S.sigRow}>
        {/* Firma desarrollador */}
        <View style={S.sigCol}>
          <View style={S.sigSpace} />
          <View style={S.sigLine} />
          <Text style={S.sigName}>Ing. Jeisson Rincón</Text>
          <Text style={S.sigRole}>Desarrollador</Text>
          <Text style={S.sigDate}>Fecha: ___________________</Text>
        </View>

        {/* Firma cliente */}
        <View style={S.sigCol}>
          <View style={S.sigSpace} />
          <View style={S.sigLine} />
          <Text style={S.sigName}>Juan Carlos Pulido</Text>
          <Text style={S.sigRole}>Hacienda El Encanto — Cliente</Text>
          <Text style={S.sigDate}>Fecha: ___________________</Text>
        </View>
      </View>
    </Page>
  )
}

// ─── Document ─────────────────────────────────────────────────────────────────
function ActaDoc() {
  return (
    <Document
      title="Acta de Entrega — Hacienda El Encanto"
      author="Ing. Jeisson Rincón"
      creator="Portal Hacienda El Encanto"
      subject="Acta de entrega del Portal de Eventos — Hacienda El Encanto"
    >
      <CoverPage />
      <ContentPage />
    </Document>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🎨  Renderizando acta de entrega...')
  const buf = await renderToBuffer(<ActaDoc />)
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, buf)
  const kb = Math.round(buf.length / 1024)
  console.log(`✅  Guardado: ${OUT}  (${kb} KB)`)
}

main().catch(e => {
  console.error('❌  Error:', e)
  process.exit(1)
})
