#!/usr/bin/env tsx
// Genera docs/manual-administracion.pdf
// Uso: npx tsx scripts/generate-admin-manual.tsx

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
const OUT     = path.join(ROOT, 'docs', 'manual-administracion.pdf')
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
    fontFamily: 'Helvetica-Bold', fontSize: 22,
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
  mono:  { fontFamily: 'Courier', fontSize: 8 },

  // Warning / note box
  note: {
    borderLeftWidth: 2.5, borderLeftColor: G.border, borderLeftStyle: 'solid',
    paddingLeft: 9, marginBottom: 7, marginTop: 2,
  },
  noteTxt: { fontFamily: 'Helvetica-Oblique', fontSize: 8.5, color: G.medium, lineHeight: 1.5 },

  // Tip box (slightly darker background)
  tipBox: {
    backgroundColor: G.bgLight,
    padding: 8,
    marginBottom: 8, marginTop: 4,
  },
  tipTxt: { fontFamily: 'Helvetica', fontSize: 8.5, color: G.dark, lineHeight: 1.5 },
  tipLbl: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: G.dark },

  // Tables
  tbl:      { marginBottom: 10, marginTop: 4, borderWidth: 0.8, borderColor: G.border },
  tblHdr:   { flexDirection: 'row', backgroundColor: G.bgLight },
  tblRow:   { flexDirection: 'row', borderTopWidth: 0.8, borderTopColor: G.border },
  tblRowAlt:{ backgroundColor: G.bgRow },
  tblCell:  { flex: 1, padding: 5 },
  tblCell2: { flex: 2, padding: 5 },
  tblTH:    { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: G.black },
  tblTD:    { fontFamily: 'Helvetica', fontSize: 8.5, color: G.dark, lineHeight: 1.35 },
  tblMono:  { fontFamily: 'Courier', fontSize: 7.5, color: G.dark },

  // Code block
  code:   { backgroundColor: G.bgLight, padding: 8, marginBottom: 8, marginTop: 3 },
  codeLn: { fontFamily: 'Courier', fontSize: 7.5, color: G.dark, lineHeight: 1.4 },

  // Lists
  listWrap:  { marginBottom: 8 },
  listItem:  { flexDirection: 'row', marginBottom: 3, paddingLeft: 4 },
  listBul:   { width: 12, fontFamily: 'Helvetica', fontSize: 9, color: G.medium },
  listTxt:   { flex: 1, fontSize: 9, lineHeight: 1.45 },

  // Ordered list
  olItem: { flexDirection: 'row', marginBottom: 4, paddingLeft: 4 },
  olNum:  { width: 18, fontFamily: 'Helvetica-Bold', fontSize: 9, color: G.medium },
  olTxt:  { flex: 1, fontSize: 9, lineHeight: 1.45 },

  // Key-value
  kvRow:   { flexDirection: 'row', marginBottom: 4 },
  kvLabel: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: G.dark, width: 160 },
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

function Para({ children }: { children: React.ReactNode }) {
  return <Text style={S.para}>{children}</Text>
}

function B({ children }: { children: string }) {
  return <Text style={S.bold}>{children}</Text>
}

function M({ children }: { children: string }) {
  return <Text style={S.mono}>{children}</Text>
}

function KV({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={S.kvRow}>
      <Text style={S.kvLabel}>{label}</Text>
      <Text style={mono ? S.kvMono : S.kvValue}>{value}</Text>
    </View>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={S.listItem}>
      <Text style={S.listBul}>{'• '}</Text>
      <Text style={S.listTxt}>{children}</Text>
    </View>
  )
}

function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <View style={S.olItem}>
      <Text style={S.olNum}>{`${num}.`}</Text>
      <Text style={S.olTxt}>{children}</Text>
    </View>
  )
}

function Note({ children }: { children: string }) {
  return (
    <View style={S.note}>
      <Text style={S.noteTxt}>{children}</Text>
    </View>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <View style={S.tipBox}>
      <Text style={S.tipTxt}>{children}</Text>
    </View>
  )
}

function Code({ lines }: { lines: string[] }) {
  return (
    <View style={S.code}>
      {lines.map((l, i) => <Text key={i} style={S.codeLn}>{l === '' ? ' ' : l}</Text>)}
    </View>
  )
}

function Hr() {
  return <View style={S.hr} />
}

// ─── Cover ────────────────────────────────────────────────────────────────────
function CoverPage() {
  return (
    <Page size="A4" style={S.coverPage}>
      <Image src={LOGO} style={S.coverLogo} />
      <View style={S.coverSepLine} />
      <Text style={S.coverTitle}>MANUAL DE ADMINISTRACIÓN</Text>
      <Text style={S.coverSubtitle}>Hacienda El Encanto — Portal de Eventos</Text>
      <View style={S.coverSepLine2} />
      <View style={{ alignItems: 'center' }}>
        <Text style={S.coverMetaLabel}>CLIENTE</Text>
        <Text style={S.coverMetaValue}>Hacienda El Encanto — Juan Carlos Pulido</Text>
        <Text style={S.coverMetaLabel}>DESARROLLADOR</Text>
        <Text style={S.coverMetaValue}>Ing. Jeisson Rincón</Text>
        <Text style={S.coverMetaLabel}>FECHA</Text>
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
        <Text style={S.hdrTitle}>Manual de Administración — Hacienda El Encanto</Text>
        <View style={S.hdrLine} />
      </View>

      {/* Footer fijo */}
      <View style={S.ftr} fixed>
        <View style={S.ftrLine} />
        <Text
          style={S.ftrText}
          render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `Pág. ${pageNumber} / ${totalPages}  •  Manual de Administración — Hacienda El Encanto`
          }
        />
      </View>

      {/* ═══════════════════════════════════════════════════════════════════════
          1. ACCESOS AL SISTEMA
      ═══════════════════════════════════════════════════════════════════════ */}
      <H2 num={1} title="Accesos al sistema" />

      <Para>
        Todos los paneles se gestionan desde un navegador web. No se requiere
        instalación de software adicional para las tareas de administración cotidianas.
      </Para>

      <View style={S.tbl}>
        <View style={S.tblHdr}>
          <View style={S.tblCell}><Text style={S.tblTH}>Sistema</Text></View>
          <View style={S.tblCell2}><Text style={S.tblTH}>URL / Acceso</Text></View>
          <View style={S.tblCell}><Text style={S.tblTH}>Credencial</Text></View>
        </View>
        {[
          ['Portal web (producción)', 'https://www.hacienda-encanto.com', 'admin@hacienda-encanto.com'],
          ['Vercel Dashboard', 'https://vercel.com/dashboard', 'Cuenta Vercel del desarrollador'],
          ['Supabase Dashboard', 'https://supabase.com/dashboard/project/oewqyckeqolrpjbjevap', 'Cuenta Supabase del desarrollador'],
          ['GitHub', 'https://github.com/haciendaEncanto/Web', 'Cuenta GitHub haciendaEncanto'],
          ['cPanel Colombia Hosting', 'uriel.colombiahosting.com.co:2083', 'Usuario cPanel del dominio'],
          ['Google Search Console', 'https://search.google.com/search-console', 'Cuenta Google de la hacienda'],
        ].map(([sys, url, cred], i) => (
          <View key={i} style={[S.tblRow, i % 2 !== 0 ? S.tblRowAlt : {}]}>
            <View style={S.tblCell}><Text style={S.tblTD}>{sys}</Text></View>
            <View style={S.tblCell2}><Text style={S.tblMono}>{url}</Text></View>
            <View style={S.tblCell}><Text style={S.tblTD}>{cred}</Text></View>
          </View>
        ))}
      </View>

      <Note>
        Las contraseñas de todos los sistemas se entregan en documento separado por razones de seguridad.
      </Note>

      <Hr />

      {/* ═══════════════════════════════════════════════════════════════════════
          2. GESTIÓN DE USUARIOS
      ═══════════════════════════════════════════════════════════════════════ */}
      <H2 num={2} title="Gestión de usuarios" />

      <H3 title="2.1  Crear un usuario del equipo" />
      <Note>
        Solo el administrador puede crear usuarios del equipo. Los clientes los crea el wedding planner desde /portal/planner/nuevo-cliente.
      </Note>
      <View style={S.listWrap}>
        <Step num={1}>Ingresar al portal con la cuenta <M>admin@hacienda-encanto.com</M>.</Step>
        <Step num={2}>Ir a <B>Administración → Usuarios</B> (<M>/admin/usuarios</M>).</Step>
        <Step num={3}>Hacer clic en <B>+ Nuevo usuario</B>.</Step>
        <Step num={4}>Completar: nombre completo, email, teléfono (privado), contraseña temporal y rol.</Step>
        <Step num={5}>Hacer clic en <B>Crear usuario</B>. El usuario ya puede iniciar sesión de inmediato.</Step>
      </View>

      <H3 title="2.2  Cambiar contraseña de un usuario" />
      <View style={S.listWrap}>
        <Step num={1}>Ir a <B>Administración → Usuarios</B>.</Step>
        <Step num={2}>Localizar el usuario y hacer clic en el ícono de candado (<B>Cambiar contraseña</B>).</Step>
        <Step num={3}>Ingresar la nueva contraseña (mínimo 8 caracteres) y confirmar.</Step>
        <Step num={4}>El cambio es inmediato. Informar al usuario su nueva contraseña por canal seguro.</Step>
      </View>
      <Tip>
        <B>También aplica para clientes:</B>{' '}desde Administración → Clientes → ficha del cliente, el mismo ícono de candado permite cambiar su contraseña.
      </Tip>

      <H3 title="2.3  Activar o desactivar un usuario" />
      <View style={S.listWrap}>
        <Step num={1}>Ir a <B>Administración → Usuarios</B>.</Step>
        <Step num={2}>Localizar el usuario y hacer clic en el interruptor de estado (activo/inactivo).</Step>
        <Step num={3}>Un usuario inactivo no aparece en el round-robin de asesores ni puede iniciar sesión en los portales de staff/planner.</Step>
      </View>

      <H3 title="2.4  Roles disponibles y accesos" />
      <View style={S.tbl}>
        <View style={S.tblHdr}>
          <View style={S.tblCell}><Text style={S.tblTH}>Rol</Text></View>
          <View style={S.tblCell2}><Text style={S.tblTH}>Acceso</Text></View>
        </View>
        {[
          ['admin', 'Panel completo: usuarios, clientes, dashboard KPIs, todos los módulos'],
          ['wedding_planner', 'Portal planner: lista de clientes, contratos, órdenes de servicio, asignación de leads'],
          ['asesor_comercial', 'Portal asesor: leads asignados, cambio de estado, integración WhatsApp'],
          ['editor', 'Portal editor: galería, videos, imágenes del sitio, testimonios, paquetes, contenido'],
          ['staff', 'Portal staff: eventos activos (15 días), playlist del evento en solo lectura'],
          ['gerente', 'Vista gerencial: todos los eventos sin restricción de fecha'],
          ['client', 'Portal cliente: su dashboard, orden de servicio, documentos, pagos, playlist, invitados'],
        ].map(([rol, acceso], i) => (
          <View key={i} style={[S.tblRow, i % 2 !== 0 ? S.tblRowAlt : {}]}>
            <View style={S.tblCell}><Text style={S.tblMono}>{rol}</Text></View>
            <View style={S.tblCell2}><Text style={S.tblTD}>{acceso}</Text></View>
          </View>
        ))}
      </View>

      <Hr />

      {/* ═══════════════════════════════════════════════════════════════════════
          3. GESTIÓN DE CONTENIDO
      ═══════════════════════════════════════════════════════════════════════ */}
      <H2 num={3} title="Gestión de contenido" />

      <H3 title="3.1  Actualizar galería de fotos" />
      <View style={S.listWrap}>
        <Step num={1}>Ingresar como <B>admin</B> o <B>editor</B>.</Step>
        <Step num={2}>Ir a <B>Editor → Galería</B> (<M>/editor/galeria</M>).</Step>
        <Step num={3}>Seleccionar la categoría (Bodas, Quinceañeras, Empresarial, Revelación).</Step>
        <Step num={4}>Hacer clic en <B>Subir foto</B>. La foto sube directo a Supabase Storage (máx. 8 MB, formatos JPG/PNG/WebP).</Step>
        <Step num={5}>Las fotos nuevas llegan a la sección <B>Archivadas</B>. Arrastrarlas a <B>Publicadas</B> para que aparezcan en el sitio. Límite: 8 fotos publicadas por categoría.</Step>
        <Step num={6}>Reordenar con drag-and-drop. El orden se guarda automáticamente.</Step>
      </View>

      <H3 title="3.2  Cambiar videos del sitio" />
      <View style={S.listWrap}>
        <Step num={1}>Ir a <B>Editor → Videos</B> (<M>/editor/videos</M>).</Step>
        <Step num={2}>Subir el nuevo video (MP4, máx. 100 MB). El video sube directo a Supabase Storage.</Step>
        <Step num={3}>Una vez subido, hacer clic en <B>Activar</B> en el video deseado para la sección correspondiente (Home, Bodas, Quinceañeras, Empresarial, Revelación).</Step>
        <Step num={4}>Solo puede haber un video activo por sección. Activar uno desactiva automáticamente el anterior.</Step>
      </View>

      <H3 title="3.3  Editar textos e imágenes del sitio" />
      <View style={S.listWrap}>
        <Step num={1}>Ir a <B>Editor → Contenido</B> (<M>/editor/contenido</M>).</Step>
        <Step num={2}>Editar los campos disponibles: nombre de la hacienda, representante legal, NIT, dirección, WhatsApp de contacto, email, cuenta Davivienda, y las 12 cláusulas del contrato.</Step>
        <Step num={3}>Ir a <B>Editor → Imágenes del sitio</B> para cambiar las 8 imágenes del Home (tarjetas de evento, sección Nosotros, imágenes de servicios).</Step>
        <Step num={4}>Los cambios se reflejan de inmediato en el sitio sin necesidad de deploy.</Step>
      </View>

      <H3 title="3.4  Actualizar cláusulas del contrato" />
      <View style={S.listWrap}>
        <Step num={1}>Ir a <B>Editor → Contenido</B> (<M>/editor/contenido</M>).</Step>
        <Step num={2}>Editar las cláusulas 1 a 12 directamente en el formulario.</Step>
        <Step num={3}>Las cláusulas admiten variables dinámicas entre dobles llaves: <M>{'{{fecha_evento}}'}</M>, <M>{'{{hora_inicio}}'}</M>, <M>{'{{hora_fin}}'}</M>, <M>{'{{num_invitados}}'}</M>, <M>{'{{cliente_direccion}}'}</M>, <M>{'{{cliente_telefono}}'}</M>, <M>{'{{cliente_email}}'}</M>.</Step>
        <Step num={4}>Los cambios aplican a los próximos contratos generados. Los contratos ya generados no se modifican.</Step>
      </View>

      <H3 title="3.5  Subir la firma del representante legal" />
      <View style={S.listWrap}>
        <Step num={1}>Ir a <B>Editor → Contenido</B> (<M>/editor/contenido</M>).</Step>
        <Step num={2}>En la sección <B>Firma del representante</B>, subir una imagen PNG con fondo transparente de la firma manuscrita.</Step>
        <Step num={3}>La firma aparece automáticamente en todos los contratos PDF que se generen a partir de ese momento.</Step>
      </View>

      <Hr />

      {/* ═══════════════════════════════════════════════════════════════════════
          4. GESTIÓN DE LEADS
      ═══════════════════════════════════════════════════════════════════════ */}
      <H2 num={4} title="Gestión de leads" />

      <H3 title="4.1  Ver y gestionar contactos" />
      <Para>
        Los contactos entran cuando un visitante del sitio llena el formulario de contacto.
        Son asignados automáticamente a un asesor mediante round-robin.
      </Para>
      <View style={S.listWrap}>
        <Step num={1}>Ingresar como <B>admin</B>.</Step>
        <Step num={2}>Ir a <B>Dashboard → Contactos recientes</B> o al panel completo (<M>/admin/dashboard</M>).</Step>
        <Step num={3}>El asesor asignado gestiona el lead desde su portal (<M>/portal/asesor-comercial</M>) cambiando el estado a: Leído → En proceso → Respondido.</Step>
      </View>

      <H3 title="4.2  Reasignar un lead entre asesores" />
      <Note>
        La reasignación manual de leads no está disponible en la interfaz actual. Para reasignar, editar directamente la columna assigned_asesor_id en la tabla contact_messages desde Supabase Dashboard → Table Editor.
      </Note>
      <View style={S.listWrap}>
        <Step num={1}>Ingresar a Supabase Dashboard → Table Editor → tabla <M>contact_messages</M>.</Step>
        <Step num={2}>Localizar el registro del lead por nombre o fecha.</Step>
        <Step num={3}>Editar la celda <M>assigned_asesor_id</M> con el UUID del nuevo asesor (obtenido de la tabla <M>profiles</M>).</Step>
        <Step num={4}>Guardar el cambio. El lead aparecerá ahora en el panel del nuevo asesor.</Step>
      </View>

      <H3 title="4.3  Registrar un asesor en CallMeBot (notificaciones WhatsApp)" />
      <Para>
        Para que un asesor reciba notificaciones instantáneas de nuevos leads en su WhatsApp personal:
      </Para>
      <View style={S.listWrap}>
        <Step num={1}>El asesor debe enviar el mensaje <M>I allow callmebot.com to send me messages</M> al número <M>+1 (347) 798-2047</M> desde su WhatsApp.</Step>
        <Step num={2}>CallMeBot responde con una API key. Guardarla.</Step>
        <Step num={3}>En Vercel Dashboard → proyecto hacienda-encanto → Settings → Environment Variables, agregar o actualizar <M>CALLMEBOT_API_KEY_CENTRAL</M> con esa API key.</Step>
        <Step num={4}>Agregar también <M>CALLMEBOT_PHONE_CENTRAL</M> con el número del asesor en formato <M>573XXXXXXXXX</M> (sin + ni espacios).</Step>
        <Step num={5}>Hacer un nuevo deploy o redeployar desde Vercel para que las variables tomen efecto.</Step>
      </View>

      <Hr />

      {/* ═══════════════════════════════════════════════════════════════════════
          5. MANTENIMIENTO TÉCNICO
      ═══════════════════════════════════════════════════════════════════════ */}
      <H2 num={5} title="Mantenimiento técnico" />

      <H3 title="5.1  Hacer un deploy a producción" />
      <Para>
        Vercel detecta automáticamente los cambios en la rama <M>main</M> y hace deploy.
        El flujo de trabajo es:
      </Para>
      <Code lines={[
        '# 1. Trabajar en la rama develop',
        'git checkout develop',
        'git add .',
        'git commit -m "descripción del cambio"',
        'git push origin develop',
        '',
        '# 2. Cuando el cambio está listo para producción, fusionar a main',
        'git checkout main',
        'git merge develop',
        'git push origin main',
        '',
        '# Vercel detecta el push a main y despliega automáticamente.',
        '# El deploy tarda entre 1 y 3 minutos.',
      ]} />
      <Tip>
        <B>Verificar deploy:</B>{' '}Entrar a Vercel Dashboard → proyecto hacienda-encanto → pestaña Deployments. El último deployment debe aparecer con estado "Ready" (fondo verde).
      </Tip>

      <H3 title="5.2  Aplicar migraciones de base de datos" />
      <Note>
        Las migraciones son cambios en la estructura de la base de datos (nuevas tablas, columnas, políticas RLS). Solo el desarrollador debe ejecutarlas.
      </Note>
      <Code lines={[
        '# Desde la raíz del proyecto, con Supabase CLI instalado:',
        'supabase db push',
        '',
        '# Verificar que las migraciones se aplicaron:',
        'supabase migration list',
        '',
        '# Si hay cambios en el esquema, regenerar los tipos TypeScript:',
        'supabase gen types typescript --project-id oewqyckeqolrpjbjevap > src/types/database.ts',
      ]} />

      <H3 title="5.3  Renovar el dominio (anualmente)" />
      <View style={S.listWrap}>
        <Step num={1}>Ingresar a <M>uriel.colombiahosting.com.co:2083</M> con las credenciales de cPanel.</Step>
        <Step num={2}>Ir a <B>Dominios → Administrador de dominios</B> y verificar la fecha de vencimiento.</Step>
        <Step num={3}>Renovar el dominio <M>hacienda-encanto.com</M> con al menos 30 días de anticipación para evitar interrupciones del servicio.</Step>
        <Step num={4}>Después de la renovación, verificar que los registros DNS sigan apuntando a Vercel (registros A y CNAME según la configuración actual).</Step>
      </View>

      <H3 title="5.4  Backup de la base de datos" />
      <View style={S.listWrap}>
        <Step num={1}>Ingresar a Supabase Dashboard → proyecto <M>oewqyckeqolrpjbjevap</M>.</Step>
        <Step num={2}>Ir a <B>Database → Backups</B>.</Step>
        <Step num={3}>Los backups automáticos se retienen 7 días en el plan gratuito y 30 días en el plan Pro.</Step>
        <Step num={4}>Para descarga manual: ir a <B>Database → Backups → Download</B> y seleccionar el backup deseado.</Step>
      </View>
      <Tip>
        <B>Recomendación:</B>{' '}Descargar y guardar un backup mensual en un disco externo o Google Drive, especialmente antes de aplicar migraciones importantes.
      </Tip>

      <H3 title="5.5  Verificaciones periódicas de seguridad" />
      <Para>Realizar estas verificaciones al menos cada 3 meses:</Para>
      <View style={S.tbl}>
        <View style={S.tblHdr}>
          <View style={S.tblCell}><Text style={S.tblTH}>Ítem</Text></View>
          <View style={S.tblCell2}><Text style={S.tblTH}>Dónde verificar</Text></View>
          <View style={S.tblCell}><Text style={S.tblTH}>Valor esperado</Text></View>
        </View>
        {[
          ['JWT expiry', 'Supabase → Auth → Settings', '3600 segundos'],
          ['Rate Limits login', 'Supabase → Auth → Settings', 'Habilitado'],
          ['Bucket documents', 'Supabase → Storage → documents', 'Privado (no público)'],
          ['RLS login_attempts', 'Supabase → Table Editor → login_attempts', 'RLS habilitado, política USING(false)'],
          ['Variables de entorno', 'Vercel → Settings → Environment Variables', 'Sin variables faltantes'],
          ['Dominio vigente', 'cPanel Colombia Hosting', 'Fecha de vencimiento > 30 días'],
        ].map(([item, donde, valor], i) => (
          <View key={i} style={[S.tblRow, i % 2 !== 0 ? S.tblRowAlt : {}]}>
            <View style={S.tblCell}><Text style={S.tblTD}>{item}</Text></View>
            <View style={S.tblCell2}><Text style={S.tblTD}>{donde}</Text></View>
            <View style={S.tblCell}><Text style={S.tblTD}>{valor}</Text></View>
          </View>
        ))}
      </View>

      <Hr />

      {/* ═══════════════════════════════════════════════════════════════════════
          6. SOLUCIÓN DE PROBLEMAS COMUNES
      ═══════════════════════════════════════════════════════════════════════ */}
      <H2 num={6} title="Solución de problemas comunes" />

      <View style={S.tbl}>
        <View style={S.tblHdr}>
          <View style={S.tblCell}><Text style={S.tblTH}>Problema</Text></View>
          <View style={S.tblCell2}><Text style={S.tblTH}>Causa probable y solución</Text></View>
        </View>
        {[
          [
            'El sitio no carga',
            'Verificar Vercel Dashboard → Deployments. Si el último deployment está en error, revisar los logs de build. Si el dominio no resuelve, verificar DNS en cPanel.',
          ],
          [
            'Los emails no llegan (recuperación de contraseña)',
            'Ir a Supabase Dashboard → Auth → Settings → SMTP. Verificar que el servidor SMTP esté configurado y activo. Probar enviando un email de prueba.',
          ],
          [
            'Los mensajes de WhatsApp no llegan',
            'Ir a Vercel → Settings → Environment Variables y verificar que CALLMEBOT_PHONE_CENTRAL y CALLMEBOT_API_KEY_CENTRAL estén configuradas. Revisar los Runtime Logs de Vercel buscando "[callmebot]" para ver el detalle del error.',
          ],
          [
            'El contrato PDF no se genera',
            'El cliente debe tener todos los datos completos: número de CC, dirección, teléfono, email, valor total y valor de anticipo. El planner los puede completar desde la ficha del cliente en /portal/planner/clientes/[id]/contrato.',
          ],
          [
            'Un usuario no puede iniciar sesión',
            "Verificar en Supabase → Table Editor → tabla profiles que el campo is_active sea true para ese usuario. Si está en false, activarlo desde Administración → Usuarios.",
          ],
          [
            'El round-robin asigna siempre al mismo asesor',
            'Verificar en Supabase → Table Editor → tabla asesor_assignments que ambos asesores tengan fila. Si un asesor no tiene fila, insertar una con total_assignments = 0. También verificar que ambos tengan is_active = true en profiles.',
          ],
          [
            'La galería no muestra fotos nuevas',
            'Las fotos nuevas llegan a la sección Archivadas en /editor/galeria. Moverlas a Publicadas arrastrándolas. Verificar que no se supere el límite de 8 fotos publicadas por categoría.',
          ],
          [
            'El video del sitio no cambia',
            'En /editor/videos, verificar que el nuevo video tenga estado Activo para la sección correcta. Solo puede haber un video activo por sección.',
          ],
        ].map(([prob, sol], i) => (
          <View key={i} style={[S.tblRow, i % 2 !== 0 ? S.tblRowAlt : {}]}>
            <View style={S.tblCell}><Text style={[S.tblTD, { fontFamily: 'Helvetica-Bold' }]}>{prob}</Text></View>
            <View style={S.tblCell2}><Text style={S.tblTD}>{sol}</Text></View>
          </View>
        ))}
      </View>

      <Hr />

      {/* ═══════════════════════════════════════════════════════════════════════
          7. CONTACTO DE SOPORTE TÉCNICO
      ═══════════════════════════════════════════════════════════════════════ */}
      <H2 num={7} title="Contacto de soporte técnico" />

      <Para>
        Para consultas técnicas, correcciones de bugs o nuevas funcionalidades, contactar al desarrollador del sistema:
      </Para>

      <KV label="Nombre" value="Ing. Jeisson Yebrail Rincón Ariza" />
      <KV label="Email" value="ing_jeisson_rincon@outlook.com" mono />
      <KV label="Período de garantía" value="30 días desde la entrega (hasta el 29 de agosto de 2026)" />

      <Note>
        Fuera del período de garantía, el soporte y las nuevas funcionalidades se cotizarán según el alcance del requerimiento.
      </Note>

      <View style={[S.tipBox, { marginTop: 12 }]}>
        <Text style={S.tipTxt}>
          <B>Antes de contactar soporte, verificar:</B>{'\n'}
          1. El problema está en la sección 6 de este manual y tiene solución documentada.{'\n'}
          2. Los logs de Vercel (Dashboard → proyecto → Deployments → Runtime Logs) no muestran información adicional.{'\n'}
          3. El problema ocurre en producción (www.hacienda-encanto.com) y no solo localmente.
        </Text>
      </View>
    </Page>
  )
}

// ─── Document ─────────────────────────────────────────────────────────────────
function AdminManualDoc() {
  return (
    <Document
      title="Manual de Administración — Hacienda El Encanto"
      author="Ing. Jeisson Rincón"
      creator="Portal Hacienda El Encanto"
      subject="Manual de administración del Portal de Eventos — Hacienda El Encanto"
    >
      <CoverPage />
      <ContentPage />
    </Document>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🎨  Renderizando manual de administración...')
  const buf = await renderToBuffer(<AdminManualDoc />)
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, buf)
  const kb = Math.round(buf.length / 1024)
  console.log(`✅  Guardado: ${OUT}  (${kb} KB)`)
}

main().catch(e => {
  console.error('❌  Error:', e)
  process.exit(1)
})
