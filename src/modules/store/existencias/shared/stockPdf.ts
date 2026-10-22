import { cssVar, loadPdfMake, tint } from '../../../../utils/pdf'

export interface StockPdfInput {
  fileName: string
  title: string
  subtitle: string
  kpis: { label: string; value: string }[]
  columns: { header: string; width?: string | number; align?: 'left' | 'right' | 'center' }[]
  rows: (string | number)[][]
  /** Índice de una columna con texto de estado para colorear (opcional) */
  statusColumn?: number
}

const STATUS_COLORS: Record<string, string> = { Agotado: '#d64545', Faltante: '#d64545', 'Stock bajo': '#c25e00', 'Sobre máximo': '#2563eb', Disponible: '#1f9d55' }

/** Reporte tabular en PDF con los colores de la marca (encabezado, indicadores y tabla con renglones alternos). */
export async function downloadStockPdf(input: StockPdfInput) {
  const pdfMake = await loadPdfMake()
  const primary = cssVar('--primary-color', '#072a57')
  const secondary = cssVar('--secondary-color', '#fc7400')
  const generated = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
  const body = [
    input.columns.map((c) => ({ text: c.header, style: 'th', alignment: c.align ?? 'left' })),
    ...input.rows.map((r) =>
      r.map((v, i) => ({
        text: String(v ?? ''),
        alignment: input.columns[i]?.align ?? 'left',
        ...(i === input.statusColumn && STATUS_COLORS[String(v)] ? { color: STATUS_COLORS[String(v)], bold: true } : {}),
      })),
    ),
  ]
  const doc = {
    pageSize: 'LETTER',
    pageOrientation: input.columns.length > 6 ? 'landscape' : 'portrait',
    pageMargins: [28, 70, 28, 40],
    defaultStyle: { fontSize: 8, color: '#1f2937' },
    header: () => ({
      margin: [28, 20, 28, 0],
      columns: [
        { stack: [{ text: input.title, fontSize: 15, bold: true, color: primary }, { text: input.subtitle, fontSize: 8.5, color: '#6b7280', margin: [0, 2, 0, 0] }] },
        { text: `Generado: ${generated}`, alignment: 'right', fontSize: 8, color: '#6b7280' },
      ],
    }),
    footer: (page: number, pages: number) => ({ text: `Página ${page} de ${pages}`, alignment: 'center', fontSize: 7.5, color: '#9ca3af', margin: [0, 12, 0, 0] }),
    content: [
      { canvas: [{ type: 'rect', x: 0, y: 0, w: 60, h: 3, color: secondary }], margin: [0, 0, 0, 10] },
      {
        columns: input.kpis.map((k) => ({
          table: { widths: ['*'], body: [[{ stack: [{ text: k.label, fontSize: 7.5, color: '#6b7280' }, { text: k.value, fontSize: 12, bold: true, color: primary }], margin: [6, 5, 6, 5] }]] },
          layout: { hLineWidth: () => 0, vLineWidth: (i: number) => (i === 0 ? 3 : 0), vLineColor: () => secondary, fillColor: () => tint(primary, 0.94) },
        })),
        columnGap: 8,
        margin: [0, 0, 0, 12],
      },
      {
        table: { headerRows: 1, widths: input.columns.map((c) => c.width ?? '*'), body },
        layout: {
          fillColor: (row: number) => (row === 0 ? primary : row % 2 === 0 ? tint(primary, 0.96) : null),
          hLineWidth: () => 0.4,
          vLineWidth: () => 0,
          hLineColor: () => '#e5e7eb',
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
      },
    ],
    styles: { th: { bold: true, color: '#ffffff', fontSize: 8 } },
  }
  await pdfMake.createPdf(doc).download(input.fileName)
}
