/**
 * Generador mínimo de PDF (sin dependencias): tabla en hoja carta horizontal con encabezado repetido,
 * tarjetas de cifras opcionales y numeración de páginas. Usa Helvetica estándar (codificación WinAnsi).
 */
import { saveBlob } from './download'

export interface PdfColumn { header: string; weight: number; align?: 'left' | 'right' }
export interface PdfKpi { label: string; value: string }
export interface PdfReport {
  title: string
  subtitle?: string
  kpis?: PdfKpi[]
  columns: PdfColumn[]
  rows: string[][]
  /** Fila final resaltada (por ejemplo, los totales). */
  totalRow?: string[]
  footerNote?: string
}

// Anchos de Helvetica (por 1000) para los caracteres 32–126
const W = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584]

const REPLACE: Record<string, string> = { '→': '->', '←': '<-', '−': '-', '–': '-', '—': '-', '“': '"', '”': '"', '‘': "'", '’': "'", '…': '...', '•': '-', '\u00a0': ' ' }

/** Deja solo caracteres que Helvetica/WinAnsi puede dibujar. */
const clean = (s: string) =>
  Array.from(String(s ?? ''))
    .map((ch) => {
      if (REPLACE[ch] !== undefined) return REPLACE[ch]
      const c = ch.charCodeAt(0)
      if (c < 32) return ' '
      return c < 256 ? ch : '?'
    })
    .join('')

const charW = (ch: string) => {
  const c = ch.charCodeAt(0)
  if (c >= 32 && c <= 126) return W[c - 32]
  const base = ch.normalize('NFD')[0]
  const b = base ? base.charCodeAt(0) : 0
  return b >= 32 && b <= 126 ? W[b - 32] : 556
}
const textW = (s: string, size: number, bold = false) => (Array.from(s).reduce((a, ch) => a + charW(ch), 0) / 1000) * size * (bold ? 1.06 : 1)

function fit(s: string, max: number, size: number, bold = false) {
  const t = clean(s)
  if (textW(t, size, bold) <= max) return t
  let out = t
  while (out.length > 1 && textW(out + '...', size, bold) > max) out = out.slice(0, -1)
  return out + '...'
}

const hex = (s: string) => Array.from(s).map((ch) => ch.charCodeAt(0).toString(16).padStart(2, '0')).join('')
const n = (v: number) => v.toFixed(2)

const PAGE_W = 792
const PAGE_H = 612
const M = 30
const ROW_H = 13
const HEAD_H = 18
const BLUE = '0.027 0.165 0.341'
const INK = '0.12 0.14 0.18'
const MUTED = '0.42 0.46 0.52'

const FONT_SIZE = 7

export function buildPdf(report: PdfReport): Uint8Array {
  const { columns } = report
  const tableW = PAGE_W - M * 2
  const totalWeight = columns.reduce((a, c) => a + c.weight, 0)
  const colW = columns.map((c) => (c.weight / totalWeight) * tableW)
  const colX = colW.map((_, i) => M + colW.slice(0, i).reduce((a, w) => a + w, 0))

  const rows = [...report.rows]
  const hasKpis = !!report.kpis?.length
  const firstTop = PAGE_H - M - (hasKpis ? 112 : 52)
  const laterTop = PAGE_H - M - 4
  const capFor = (top: number) => Math.max(1, Math.floor((top - HEAD_H - (M + 18)) / ROW_H))

  // Reparte las filas por página (la fila de totales va al final, siempre)
  const pages: { top: number; rows: string[][] }[] = []
  let i = 0
  let first = true
  while (i < rows.length || first) {
    const top = first ? firstTop : laterTop
    const cap = capFor(top)
    pages.push({ top, rows: rows.slice(i, i + cap) })
    i += cap
    first = false
  }
  if (report.totalRow) {
    const last = pages[pages.length - 1]
    if (last.rows.length >= capFor(last.top)) pages.push({ top: laterTop, rows: [] })
  }

  const stamp = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

  const drawText = (x: number, y: number, str: string, size: number, color = INK, bold = false) =>
    `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${color} rg ${n(x)} ${n(y)} Td <${hex(clean(str))}> Tj ET\n`
  const rect = (x: number, y: number, w: number, h: number, color: string) => `${color} rg ${n(x)} ${n(y)} ${n(w)} ${n(h)} re f\n`

  const contents = pages.map((pg, pi) => {
    let s = ''
    if (pi === 0) {
      s += drawText(M, PAGE_H - M - 14, report.title, 16, BLUE, true)
      if (report.subtitle) s += drawText(M, PAGE_H - M - 29, fit(report.subtitle, tableW, 9), 9, MUTED)
      if (hasKpis) {
        const k = report.kpis ?? []
        const gap = 10
        const bw = (tableW - gap * (k.length - 1)) / k.length
        k.forEach((kp, ki) => {
          const x = M + ki * (bw + gap)
          const y = PAGE_H - M - 42 - 46
          s += rect(x, y, bw, 46, '0.95 0.96 0.98')
          s += drawText(x + 10, y + 31, fit(kp.label, bw - 20, 7.5), 7.5, MUTED)
          s += drawText(x + 10, y + 11, fit(kp.value, bw - 20, 15, true), 15, INK, true)
        })
      }
    }

    // Encabezado de la tabla
    let y = pg.top - HEAD_H
    s += rect(M, y, tableW, HEAD_H, BLUE)
    columns.forEach((c, ci) => {
      const t = fit(c.header, colW[ci] - 8, FONT_SIZE, true)
      const x = c.align === 'right' ? colX[ci] + colW[ci] - 4 - textW(t, FONT_SIZE, true) : colX[ci] + 4
      s += drawText(x, y + 6, t, FONT_SIZE, '1 1 1', true)
    })

    const drawRow = (r: string[], idx: number, strong = false) => {
      y -= ROW_H
      if (strong) s += rect(M, y, tableW, ROW_H, '0.90 0.93 0.97')
      else if (idx % 2 === 1) s += rect(M, y, tableW, ROW_H, '0.965 0.972 0.98')
      columns.forEach((c, ci) => {
        const t = fit(r[ci] ?? '', colW[ci] - 8, FONT_SIZE, strong)
        const x = c.align === 'right' ? colX[ci] + colW[ci] - 4 - textW(t, FONT_SIZE, strong) : colX[ci] + 4
        s += drawText(x, y + 4, t, FONT_SIZE, INK, strong)
      })
    }
    pg.rows.forEach((r, ri) => drawRow(r, ri))
    if (!report.rows.length && pi === 0) {
      y -= ROW_H
      s += drawText(M + 4, y + 4, 'Sin registros.', FONT_SIZE, MUTED)
    }
    if (report.totalRow && pi === pages.length - 1) drawRow(report.totalRow, 0, true)

    // Pie de página
    s += drawText(M, M - 4, `${report.title}  |  ${stamp}${report.footerNote ? `  |  ${report.footerNote}` : ''}`, 6.5, MUTED)
    const label = `Pagina ${pi + 1} de ${pages.length}`
    s += drawText(PAGE_W - M - textW(label, 7), M - 4, label, 7, MUTED)
    return s
  })

  // Objetos: 1 catálogo, 2 páginas, 3 y 4 fuentes, luego (página, contenido) por cada hoja
  const objs: string[] = []
  const pageIds = pages.map((_, k) => 5 + k * 2)
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objs[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
  pages.forEach((_, k) => {
    objs[5 + k * 2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + k * 2} 0 R >>`
    objs[6 + k * 2] = `<< /Length ${contents[k].length} >>\nstream\n${contents[k]}endstream`
  })

  const te = new TextEncoder()
  const parts: Uint8Array[] = []
  const offsets: number[] = []
  let pos = 0
  const push = (str: string) => { const b = te.encode(str); parts.push(b); pos += b.length }
  push('%PDF-1.4\n')
  for (let id = 1; id < objs.length; id++) {
    offsets[id] = pos
    push(`${id} 0 obj\n${objs[id]}\nendobj\n`)
  }
  const xref = pos
  push(`xref\n0 ${objs.length}\n0000000000 65535 f \n`)
  for (let id = 1; id < objs.length; id++) push(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`)
  push(`trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`)

  const out = new Uint8Array(pos)
  let p = 0
  for (const b of parts) { out.set(b, p); p += b.length }
  return out
}

export function downloadPdf(fileName: string, report: PdfReport) {
  saveBlob(new Blob([buildPdf(report)], { type: 'application/pdf' }), fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`)
}
