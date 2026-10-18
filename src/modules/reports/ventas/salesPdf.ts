/**
 * PDF del reporte de ventas con pdfmake (descarga directa). pdfmake y sus fuentes se cargan con import dinámico solo al
 * exportar, para no engordar la carga inicial de la app.
 */
const money = (n: number) => Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })
const qty = (n: number) => Number(n || 0).toLocaleString('es-MX', { maximumFractionDigits: 2 })
const dmy = (ymd: string) => ymd.split('-').reverse().join('/')
const TZ = 'America/Mexico_City'
const dateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('es-MX', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

const STATUS_LABEL: Record<string, string> = { COMPLETED: 'Completada', CANCELLED: 'Cancelada', DRAFT: 'Borrador' }

// Colores de la app: se leen de las variables del tema (--primary-color / --secondary-color) para que el PDF siga la marca;
// si no existen se usan los de fixora. Con tintes muy suaves para que también se lea bien impreso en blanco y negro.
const cssVar = (name: string, fallback: string) => {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return /^#[0-9a-f]{6}$/i.test(v) ? v : fallback
  } catch {
    return fallback
  }
}
/** Mezcla un color con blanco (0 = color, 1 = blanco) para fondos suaves. */
const tint = (hex: string, amount: number) => {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, '0')
  return `#${mix((n >> 16) & 255)}${mix((n >> 8) & 255)}${mix(n & 255)}`
}
let PRIMARY = '#072a57'
let SECONDARY = '#fc7400'
const DARK = '#111827'
const MUTED = '#6b7280'
const BORDER = '#e5e7eb'
let ZEBRA = tint(PRIMARY, 0.95)

export interface SalesPdfInput {
  companyName?: string
  branchName?: string
  from: string
  to: string
  filtersText: string[]
  summary: any
  rows: any[]
  totalRows: number
}

let pdfMakePromise: Promise<any> | null = null
/** Carga pdfmake + fuentes una sola vez. */
async function loadPdfMake() {
  if (!pdfMakePromise) {
    pdfMakePromise = Promise.all([import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts')]).then(([pdfMod, fontsMod]: any[]) => {
      const pdfMake = pdfMod.default ?? pdfMod
      const fonts = fontsMod.default ?? fontsMod
      if (typeof pdfMake.addVirtualFileSystem === 'function') pdfMake.addVirtualFileSystem(fonts)
      else pdfMake.vfs = fonts?.pdfMake?.vfs ?? fonts?.vfs ?? fonts
      return pdfMake
    })
    pdfMakePromise.catch(() => {
      pdfMakePromise = null
    })
  }
  return pdfMakePromise
}

/** Tabla con encabezado repetido en cada página, filas cebra y columnas numéricas alineadas a la derecha. */
const table = (head: string[], body: (string | number)[][], opts: { widths?: (string | number)[]; numCols?: number[]; footer?: (string | number)[] } = {}) => {
  const num = new Set(opts.numCols ?? [])
  const cell = (v: string | number, i: number, extra: Record<string, unknown> = {}) => ({ text: String(v ?? ''), alignment: num.has(i) ? 'right' : 'left', ...extra })
  const rows: any[] = [head.map((h, i) => cell(h, i, { style: 'th', fillColor: PRIMARY, color: '#ffffff' }))]
  if (body.length) body.forEach((r) => rows.push(r.map((v, i) => cell(v, i))))
  else rows.push([{ text: 'Sin datos', colSpan: head.length, alignment: 'center', color: MUTED }, ...head.slice(1).map(() => ({}))])
  // Fila de totales: fondo del secundario muy suave, en negritas y con línea superior del secundario
  if (opts.footer) rows.push(opts.footer.map((v, i) => cell(v, i, { bold: true, fillColor: tint(SECONDARY, 0.88), color: DARK })))
  const last = rows.length - 1
  return {
    table: { headerRows: 1, dontBreakRows: true, widths: opts.widths ?? head.map((_, i) => (i === 0 ? '*' : 'auto')), body: rows },
    layout: {
      fillColor: (rowIndex: number) => (rowIndex === 0 || (opts.footer && rowIndex === last) ? null : rowIndex % 2 === 0 ? ZEBRA : null),
      hLineWidth: (i: number) => (opts.footer && i === last ? 1.2 : i === rows.length ? 0.8 : 0),
      vLineWidth: () => 0,
      hLineColor: (i: number) => (opts.footer && i === last ? SECONDARY : BORDER),
      paddingLeft: () => 5,
      paddingRight: () => 5,
      paddingTop: () => 3.5,
      paddingBottom: () => 3.5,
    },
    fontSize: 8.5,
  }
}

/** Título de sección con una barrita del color secundario a la izquierda. */
const sectionTitle = (text: string) => ({
  margin: [0, 12, 0, 5],
  columnGap: 0,
  columns: [
    { width: 4, canvas: [{ type: 'rect', x: 0, y: 1, w: 3, h: 11, color: SECONDARY }] },
    { width: '*', text, fontSize: 10.5, bold: true, color: PRIMARY, margin: [3, 0, 0, 0] },
  ],
})

export async function downloadSalesPdf(input: SalesPdfInput) {
  const pdfMake = await loadPdfMake()
  PRIMARY = cssVar('--primary-color', '#072a57')
  SECONDARY = cssVar('--secondary-color', '#fc7400')
  ZEBRA = tint(PRIMARY, 0.95)
  const { summary: s, rows } = input
  const k = s?.kpis ?? {}
  const byHour = s?.range?.granularity === 'hour'
  const generated = new Date().toLocaleString('es-MX', { timeZone: TZ, dateStyle: 'long', timeStyle: 'short' })

  const kpis: [string, string, string?][] = [
    ['Ventas', money(k.total), `${qty(k.tickets)} tickets`],
    ['Ticket promedio', money(k.averageTicket)],
    ['Unidades', qty(k.units)],
    ['Descuentos', money(k.discount)],
    ['Impuestos', money(k.tax)],
    ['Devoluciones', money(k.returnsTotal), `Neto ${money(k.netTotal)}`],
    ['Canceladas', qty(k.cancelled), money(k.cancelledTotal)],
  ]
  // Caja de indicador: franja del color a la izquierda, etiqueta pequeña y el valor grande
  const kpiBox = ([label, value, hint]: [string, string, string?], i: number) => ({
    table: {
      widths: [3, '*'],
      body: [[
        { text: '', fillColor: i === 0 ? SECONDARY : PRIMARY },
        {
          stack: [
            { text: label.toUpperCase(), fontSize: 6.5, color: MUTED, bold: true, characterSpacing: 0.4 },
            { text: value, fontSize: 12.5, bold: true, color: i === 0 ? SECONDARY : PRIMARY, margin: [0, 2, 0, 0] },
            ...(hint ? [{ text: hint, fontSize: 7, color: MUTED }] : []),
          ],
          margin: [6, 5, 4, 5],
          fillColor: tint(PRIMARY, 0.96),
        },
      ]],
    },
    layout: 'noBorders',
  })

  const sumOf = (list: any[], key: string) => list.reduce((acc, r) => acc + Number(r[key] || 0), 0)
  const twoCols = (left: any[], right: any[]) => ({ columns: [{ width: '*', stack: left }, { width: '*', stack: right }], columnGap: 16, margin: [0, 0, 0, 4] })

  const detailTotals = {
    units: sumOf(rows, 'units'),
    total: sumOf(rows.filter((r) => r.status === 'COMPLETED'), 'total'),
    returned: sumOf(rows, 'returned'),
  }

  const doc = {
    pageSize: 'LETTER',
    pageOrientation: 'landscape',
    pageMargins: [32, 64, 32, 40],
    info: { title: `Reporte de ventas ${dmy(input.from)} - ${dmy(input.to)}`, author: 'Fixora' },
    defaultStyle: { fontSize: 9, color: '#1f2937' },
    styles: {
      h1: { fontSize: 16, bold: true, color: DARK },
      h2: { fontSize: 10.5, bold: true, color: DARK, margin: [0, 12, 0, 5] },
      th: { bold: true, fontSize: 7.5, color: MUTED },
    },
    // Banda del color primario con texto blanco y una línea del secundario debajo
    background: () => ({
      canvas: [
        { type: 'rect', x: 0, y: 0, w: 792, h: 46, color: PRIMARY },
        { type: 'rect', x: 0, y: 46, w: 792, h: 3, color: SECONDARY },
      ],
    }),
    header: (currentPage: number) => ({
      margin: [32, 11, 32, 0],
      columns: [
        {
          stack: [
            { text: 'Reporte de ventas', fontSize: 15, bold: true, color: '#ffffff' },
            { text: [input.companyName, input.branchName].filter(Boolean).join(' · ') || ' ', fontSize: 8.5, color: tint(PRIMARY, 0.7) },
          ],
        },
        {
          width: 'auto',
          alignment: 'right',
          stack: [
            { text: `Del ${dmy(input.from)} al ${dmy(input.to)}`, fontSize: 9.5, bold: true, color: '#ffffff' },
            { text: currentPage === 1 ? `Generado: ${generated}` : `Página ${currentPage}`, fontSize: 7.5, color: tint(PRIMARY, 0.7) },
          ],
        },
      ],
    }),
    footer: (currentPage: number, pageCount: number) => ({
      margin: [32, 8, 32, 0],
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 728, y2: 0, lineWidth: 0.5, lineColor: BORDER }] },
        {
          margin: [0, 5, 0, 0],
          columns: [
            { text: [{ text: 'Fixora', bold: true, color: PRIMARY }, ' · Reporte de ventas'], fontSize: 7.5, color: MUTED },
            { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', fontSize: 7.5, color: MUTED },
          ],
        },
      ],
    }),
    content: [
      ...(input.filtersText.length ? [{ text: `Filtros: ${input.filtersText.join(' · ')}`, fontSize: 8, color: MUTED, margin: [0, 0, 0, 8] }] : []),
      { columns: kpis.map((kp, i) => ({ width: '*', ...kpiBox(kp, i) })), columnGap: 6, margin: [0, 0, 0, 4] },

      twoCols(
        [
          sectionTitle(byHour ? 'Ventas por hora' : 'Ventas por día'),
          table(
            [byHour ? 'Hora' : 'Día', 'Tickets', 'Total'],
            (s?.byPeriod ?? []).map((p: any) => [byHour ? p.period : dmy(String(p.period)), p.tickets, money(p.total)]),
            { numCols: [1, 2], footer: ['Total', sumOf(s?.byPeriod ?? [], 'tickets'), money(sumOf(s?.byPeriod ?? [], 'total'))] },
          ),
        ],
        [
          sectionTitle('Formas de pago'),
          table(['Forma de pago', 'Tickets', 'Total'], (s?.byPaymentMethod ?? []).map((m: any) => [m.name, m.tickets, money(m.total)]), {
            numCols: [1, 2],
            footer: ['Total', '', money(sumOf(s?.byPaymentMethod ?? [], 'total'))],
          }),
        ],
      ),
      twoCols(
        [sectionTitle('Artículos más vendidos'), table(['Artículo', 'Unid.', 'Total'], (s?.topItems ?? []).map((r: any) => [`${r.code ? `${r.code} · ` : ''}${r.name}`, qty(r.units), money(r.total)]), { numCols: [1, 2] })],
        [sectionTitle('Categorías'), table(['Categoría', 'Unid.', 'Total'], (s?.topCategories ?? []).map((r: any) => [r.name, qty(r.units), money(r.total)]), { numCols: [1, 2] })],
      ),
      twoCols(
        [sectionTitle('Sucursales'), table(['Sucursal', 'Tickets', 'Total'], (s?.byBranch ?? []).map((r: any) => [r.name, r.tickets, money(r.total)]), { numCols: [1, 2] })],
        [sectionTitle('Vendedores'), table(['Vendedor', 'Tickets', 'Total'], (s?.bySeller ?? []).map((r: any) => [r.name, r.tickets, money(r.total)]), { numCols: [1, 2] })],
      ),

      {
        ...sectionTitle(`Detalle de ventas (${qty(input.totalRows)}${input.totalRows > rows.length ? `, se muestran ${qty(rows.length)}` : ''})`),
        pageBreak: 'before',
        margin: [0, 0, 0, 5],
      },
      table(
        ['Folio', 'Fecha', 'Estado', 'Cliente', 'Vendedor', 'Sucursal', 'Formas de pago', 'Unid.', 'Total', 'Devuelto'],
        rows.map((r) => [
          `${r.serie ? `${r.serie}-` : ''}${r.folio ?? r.id}`,
          dateTime(r.date),
          STATUS_LABEL[r.status] ?? r.status,
          r.customer,
          r.seller || '—',
          r.branch || '—',
          r.paymentMethods || '—',
          qty(r.units),
          money(r.total),
          r.returned > 0 ? money(r.returned) : '—',
        ]),
        {
          widths: ['auto', 'auto', 'auto', '*', 'auto', 'auto', '*', 'auto', 'auto', 'auto'],
          numCols: [7, 8, 9],
          footer: ['Totales', '', '', '', '', '', '(total sin canceladas)', qty(detailTotals.units), money(detailTotals.total), money(detailTotals.returned)],
        },
      ),
    ],
  }

  const fileName = `reporte-ventas_${input.from}_${input.to}.pdf`
  await pdfMake.createPdf(doc).download(fileName)
}
