#!/usr/bin/env tsx
// Genera docs/documentacion-tecnica.pdf desde docs/documentacion-tecnica.md
// Uso: npx tsx scripts/generate-pdf.tsx

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

// ─── Grayscale palette ────────────────────────────────────────────────────────
const G = {
  black:   '#000000',
  dark:    '#222222',
  medium:  '#555555',
  border:  '#BBBBBB',
  bgLight: '#EEEEEE',   // table header, code bg
  bgRow:   '#F6F6F6',   // alternating rows
  white:   '#FFFFFF',
}

// ─── Paths ────────────────────────────────────────────────────────────────────
const ROOT = process.cwd()
const MD   = path.join(ROOT, 'docs', 'documentacion-tecnica.md')
const OUT  = path.join(ROOT, 'docs', 'documentacion-tecnica.pdf')

// Logo como data URI — evita problemas de resolución de rutas en Windows
const logoBuffer = fs.readFileSync(path.join(ROOT, 'public', 'logo-jardin-pdf.png'))
const LOGO_SRC = `data:image/png;base64,${logoBuffer.toString('base64')}`

const MARGIN = 50

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
    fontFamily: 'Helvetica-Bold', fontSize: 24,
    color: G.black, textAlign: 'center', marginBottom: 12,
    letterSpacing: 1,
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

  // Headings
  h2wrap: { marginTop: 20, marginBottom: 8 },
  h2:     { fontFamily: 'Helvetica-Bold', fontSize: 14, color: G.black },
  h2line: { height: 0.8, backgroundColor: G.border, marginTop: 4 },
  h3:     {
    fontFamily: 'Helvetica-Bold', fontSize: 11, color: G.dark,
    marginTop: 14, marginBottom: 5,
  },
  h4wrap: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 9, marginBottom: 3,
  },
  h4bar:  { width: 2.5, height: 11, backgroundColor: G.medium, marginRight: 5 },
  h4:     { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: G.dark },

  // Body blocks
  para:   { marginBottom: 6, lineHeight: 1.5, fontSize: 9 },
  bq:     {
    borderLeftWidth: 2.5, borderLeftColor: G.border, borderLeftStyle: 'solid',
    paddingLeft: 9, marginBottom: 7, marginTop: 2,
  },
  bqTxt:  { fontFamily: 'Helvetica-Oblique', fontSize: 8.5, color: G.medium, lineHeight: 1.5 },
  hr:     { height: 0.8, backgroundColor: G.bgLight, marginVertical: 8 },

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
  tblTH:     { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: G.black },
  tblTD:     { fontFamily: 'Helvetica', fontSize: 8.5, color: G.dark, lineHeight: 1.35 },

  // Code blocks
  code:   {
    backgroundColor: G.bgLight,
    padding: 8,
    marginBottom: 8, marginTop: 3,
  },
  codeLn: { fontFamily: 'Courier', fontSize: 7, color: G.dark, lineHeight: 1.3 },

  // Lists
  listWrap: { marginBottom: 6 },
  listItem: { flexDirection: 'row', marginBottom: 2.5, paddingLeft: 4 },
  listBul:  { width: 12, fontFamily: 'Helvetica', fontSize: 9, color: G.medium, paddingTop: 0.5 },
  listTxt:  { flex: 1, fontSize: 9, lineHeight: 1.45 },
})

// ─── Version number normalizer ────────────────────────────────────────────────
// Convierte ^4.5.1 → v4.5.1, ~2 → v2 (solo fuera de patrones regex)
function normalizeVersions(text: string): string {
  return text
    .replace(/(?<![/\w])\^(\d)/g, 'v$1')
    .replace(/(?<![/\w])~(\d)/g, 'v$1')
}

// ─── Inline text parser ───────────────────────────────────────────────────────
function inline(raw: string): React.ReactNode[] {
  // Strip markdown links, then normalize versions in plain-text segments
  const stripped = raw.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  const parts = stripped.split(/(\*\*[^*]+\*\*|`[^`]+`)/).filter(p => p !== '')

  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**') && p.length > 4)
      return (
        <Text key={i} style={{ fontFamily: 'Helvetica-Bold' }}>
          {normalizeVersions(p.slice(2, -2))}
        </Text>
      )
    if (p.startsWith('`') && p.endsWith('`') && p.length > 2)
      // Code spans: keep content unchanged
      return (
        <Text key={i} style={{ fontFamily: 'Courier', fontSize: 7.5, backgroundColor: G.bgLight }}>
          {p.slice(1, -1)}
        </Text>
      )
    return <Text key={i}>{normalizeVersions(p)}</Text>
  })
}

// ─── Markdown block types ─────────────────────────────────────────────────────
type MdBlock =
  | { t: 'h1' | 'h2' | 'h3' | 'h4' | 'hr' | 'para' | 'bq'; text: string }
  | { t: 'tbl'; rows: string[][] }
  | { t: 'code'; lines: string[]; lang: string }
  | { t: 'list'; items: string[] }

// ─── Markdown parser ──────────────────────────────────────────────────────────
function parseMd(md: string): MdBlock[] {
  // Strip \r — el archivo tiene CRLF y el \r rompe el regex de separadores de tabla
  const lines = md.replace(/\r/g, '').split('\n')
  const out: MdBlock[] = []
  let i = 0
  while (i < lines.length) {
    const l = lines[i]

    if (l.startsWith('#### ')) { out.push({ t: 'h4', text: l.slice(5).trim() }); i++; continue }
    if (l.startsWith('### '))  { out.push({ t: 'h3', text: l.slice(4).trim() }); i++; continue }
    if (l.startsWith('## '))   { out.push({ t: 'h2', text: l.slice(3).trim() }); i++; continue }
    if (l.startsWith('# '))    { out.push({ t: 'h1', text: l.slice(2).trim() }); i++; continue }

    if (/^---+$/.test(l.trim())) { out.push({ t: 'hr', text: '' }); i++; continue }

    // Code block
    if (l.startsWith('```')) {
      const lang = l.slice(3).trim(); i++
      const cl: string[] = []
      while (i < lines.length && !lines[i].startsWith('```')) { cl.push(lines[i]); i++ }
      i++; out.push({ t: 'code', lines: cl, lang }); continue
    }

    // Blockquote
    if (l.startsWith('> ')) {
      const bl: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) { bl.push(lines[i].slice(2)); i++ }
      out.push({ t: 'bq', text: bl.join('\n') }); continue
    }

    // Table
    if (l.startsWith('|')) {
      const tl: string[] = []
      while (i < lines.length && lines[i].startsWith('|')) { tl.push(lines[i]); i++ }
      const rows: string[][] = tl
        .filter(r => !/^\|[-:\s|]+\|$/.test(r))
        .map(r => r.split('|').slice(1, -1).map(c => c.trim()))
        .filter(r => r.some(c => c.length > 0))
      if (rows.length) out.push({ t: 'tbl', rows }); continue
    }

    // List
    if (/^[-*] /.test(l)) {
      const items: string[] = []
      while (i < lines.length && /^[-*] /.test(lines[i])) { items.push(lines[i].slice(2).trim()); i++ }
      out.push({ t: 'list', items }); continue
    }

    if (l.trim() === '') { i++; continue }

    // Paragraph
    const pl: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('|') &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('> ') &&
      !/^[-*] /.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim())
    ) { pl.push(lines[i]); i++ }
    if (pl.length) out.push({ t: 'para', text: pl.join(' ') })
  }
  return out
}

// ─── Block renderer ───────────────────────────────────────────────────────────
function RenderBlock({ b }: { b: MdBlock }) {
  switch (b.t) {
    case 'h1': return null

    case 'h2': return (
      <View style={S.h2wrap}>
        <Text style={S.h2}>{b.text}</Text>
        <View style={S.h2line} />
      </View>
    )

    case 'h3': return <Text style={S.h3}>{b.text}</Text>

    case 'h4': return (
      <View style={S.h4wrap}>
        <View style={S.h4bar} />
        <Text style={S.h4}>{b.text.replace(/`/g, '')}</Text>
      </View>
    )

    case 'hr': return <View style={S.hr} />

    case 'para': return <Text style={S.para}>{inline(b.text)}</Text>

    case 'bq': return (
      <View style={S.bq}>
        {b.text.split('\n').map((ln, j) => (
          <Text key={j} style={S.bqTxt}>{inline(ln)}</Text>
        ))}
      </View>
    )

    case 'tbl': {
      const [hdr, ...body] = b.rows
      if (!hdr) return null
      return (
        <View style={S.tbl}>
          <View style={S.tblHdr}>
            {hdr.map((c, j) => (
              <View key={j} style={S.tblCell}>
                <Text style={S.tblTH}>{inline(c)}</Text>
              </View>
            ))}
          </View>
          {body.map((row, ri) => (
            <View key={ri} style={[S.tblRow, ri % 2 !== 0 ? S.tblRowAlt : {}]}>
              {row.map((c, ci) => (
                <View key={ci} style={S.tblCell}>
                  <Text style={S.tblTD}>{inline(c)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )
    }

    case 'code': return (
      <View style={S.code}>
        {b.lines.map((ln, j) => (
          <Text key={j} style={S.codeLn}>{ln === '' ? ' ' : ln}</Text>
        ))}
      </View>
    )

    case 'list': return (
      <View style={S.listWrap}>
        {b.items.map((item, j) => (
          <View key={j} style={S.listItem}>
            <Text style={S.listBul}>{'- '}</Text>
            <Text style={S.listTxt}>{inline(item)}</Text>
          </View>
        ))}
      </View>
    )

    default: return null
  }
}

// ─── Cover page ───────────────────────────────────────────────────────────────
function CoverPage() {
  return (
    <Page size="A4" style={S.coverPage}>
      <Image src={LOGO_SRC} style={S.coverLogo} />
      <View style={S.coverSepLine} />
      <Text style={S.coverTitle}>{'DOCUMENTACIÓN TÉCNICA'}</Text>
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

// ─── PDF Document ─────────────────────────────────────────────────────────────
function TechDoc({ blocks }: { blocks: MdBlock[] }) {
  return (
    <Document
      title="Documentación Técnica — Hacienda El Encanto"
      author="Ing. Jeisson Rincón"
      creator="Portal Hacienda El Encanto"
      subject="Documentación técnica del sistema de gestión de eventos"
    >
      <CoverPage />

      {/* Páginas de contenido */}
      <Page size="A4" style={S.page}>
        {/* Header fijo */}
        <View style={S.hdr} fixed>
          <Image src={LOGO_SRC} style={S.hdrLogo} />
          <Text style={S.hdrTitle}>Documentación Técnica — Hacienda El Encanto</Text>
          <View style={S.hdrLine} />
        </View>

        {/* Footer fijo */}
        <View style={S.ftr} fixed>
          <View style={S.ftrLine} />
          <Text
            style={S.ftrText}
            render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
              `Pág. ${pageNumber} / ${totalPages}`
            }
          />
        </View>

        {/* Contenido */}
        {blocks.map((b, i) => (
          <RenderBlock key={i} b={b} />
        ))}
      </Page>
    </Document>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📄  Leyendo markdown...')
  const md = fs.readFileSync(MD, 'utf-8')

  console.log('🔍  Parseando bloques...')
  const blocks = parseMd(md)
  console.log(`    → ${blocks.length} bloques encontrados`)

  console.log('🎨  Renderizando PDF...')
  const buf = await renderToBuffer(<TechDoc blocks={blocks} />)

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, buf)

  const kb = Math.round(buf.length / 1024)
  console.log(`✅  Guardado: ${OUT}  (${kb} KB)`)
}

main().catch(e => {
  console.error('❌  Error:', e)
  process.exit(1)
})
