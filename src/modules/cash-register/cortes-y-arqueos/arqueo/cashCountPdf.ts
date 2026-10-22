import { cssVar, loadPdfMake, tint } from '../../../../utils/pdf'
import { RESULT_LABEL, resultOf } from '../../shared/cashFormat'

/** PDF de un arqueo (pdfmake, descarga directa): encabezado, resumen, desglose por denominación y firmas. */
const money = (n: number) => Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })
const TZ = 'America/Mexico_City'
const dateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('es-MX', { timeZone: TZ, dateStyle: 'long', timeStyle: 'short' }) : ''


export async function downloadCashCountPdf(c: any) {
  const pdfMake = await loadPdfMake()
  const PRIMARY = cssVar('--primary-color', '#072a57')
  const SECONDARY = cssVar('--secondary-color', '#fc7400')
  const MUTED = '#6b7280'
  const BORDER = '#e5e7eb'
  const result = resultOf(c)
  const resultColor = result === 'BALANCED' ? '#1f9d55' : result === 'OVER' ? '#2563eb' : result === 'SHORT' ? '#d64545' : MUTED
  const d = c.expectedDetail ?? {}

  const row = (label: string, value: string, opts: Record<string, unknown> = {}) => [
    { text: label, color: MUTED },
    { text: value, alignment: 'right', ...opts },
  ]
  const box = (label: string, value: string, color: string) => ({
    table: {
      widths: [3, '*'],
      body: [[
        { text: '', fillColor: color },
        {
          stack: [
            { text: label.toUpperCase(), fontSize: 7, bold: true, color: MUTED, characterSpacing: 0.4 },
            { text: value, fontSize: 15, bold: true, color, margin: [0, 2, 0, 0] },
          ],
          margin: [8, 6, 6, 6],
          fillColor: tint(PRIMARY, 0.96),
        },
      ]],
    },
    layout: 'noBorders',
  })
  const bills = (c.lines ?? []).filter((l: any) => l.kind === 'BILL')
  const coins = (c.lines ?? []).filter((l: any) => l.kind === 'COIN')
  const linesTable = (title: string, list: any[]) => ({
    table: {
      headerRows: 1,
      widths: ['*', 'auto', 'auto'],
      body: [
        [title, 'Cantidad', 'Importe'].map((h, i) => ({ text: h, bold: true, fontSize: 8, color: '#fff', fillColor: PRIMARY, alignment: i ? 'right' : 'left' })),
        ...(list.length
          ? list.map((l: any) => [money(l.denomination), { text: String(l.quantity), alignment: 'right' }, { text: money(l.amount), alignment: 'right' }])
          : [[{ text: 'Sin piezas', colSpan: 3, color: MUTED, alignment: 'center' }, {}, {}]]),
        [{ text: 'Subtotal', bold: true }, '', { text: money(list.reduce((a: number, l: any) => a + l.amount, 0)), bold: true, alignment: 'right' }],
      ],
    },
    layout: {
      fillColor: (i: number) => (i > 0 && i % 2 === 0 ? tint(PRIMARY, 0.95) : null),
      hLineWidth: (i: number, node: any) => (i === node.table.body.length - 1 ? 1 : 0),
      hLineColor: () => SECONDARY,
      vLineWidth: () => 0,
      paddingTop: () => 3,
      paddingBottom: () => 3,
    },
    fontSize: 9,
  })
  const signature = (label: string, name?: string) => ({
    width: '*',
    stack: [
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.8, lineColor: '#9ca3af' }], margin: [0, 40, 0, 4] },
      { text: label, bold: true, fontSize: 9 },
      { text: name ?? ' ', fontSize: 8, color: MUTED },
    ],
  })

  const doc = {
    pageSize: 'LETTER',
    pageMargins: [40, 70, 40, 50],
    info: { title: `Arqueo #${c.id}`, author: 'Fixora' },
    defaultStyle: { fontSize: 9.5, color: '#1f2937' },
    background: () => ({
      canvas: [
        { type: 'rect', x: 0, y: 0, w: 612, h: 50, color: PRIMARY },
        { type: 'rect', x: 0, y: 50, w: 612, h: 3, color: SECONDARY },
      ],
    }),
    header: () => ({
      margin: [40, 12, 40, 0],
      columns: [
        { stack: [{ text: `Arqueo de caja #${c.id}`, fontSize: 15, bold: true, color: '#fff' }, { text: `${c.branchName ?? ''}${c.registerName ? ` · ${c.registerName}` : ''}`, fontSize: 9, color: tint(PRIMARY, 0.7) }] },
        { width: 'auto', alignment: 'right', stack: [{ text: dateTime(c.createdAt), fontSize: 9, bold: true, color: '#fff' }, { text: `Turno #${c.shiftId}`, fontSize: 8, color: tint(PRIMARY, 0.7) }] },
      ],
    }),
    footer: (page: number, pages: number) => ({
      margin: [40, 10, 40, 0],
      columns: [
        { text: [{ text: 'Fixora', bold: true, color: PRIMARY }, ' · Arqueo de caja'], fontSize: 7.5, color: MUTED },
        { text: `Página ${page} de ${pages}`, alignment: 'right', fontSize: 7.5, color: MUTED },
      ],
    }),
    content: [
      ...(c.status === 'CANCELLED'
        ? [{ text: `CANCELADO${c.cancelReason ? `: ${c.cancelReason}` : ''}${c.cancelledByName ? ` (por ${c.cancelledByName})` : ''}`, bold: true, color: '#d64545', margin: [0, 0, 0, 8] }]
        : []),
      {
        columns: [
          { width: '*', ...box('Esperado', money(c.expectedAmount), PRIMARY) },
          { width: '*', ...box('Contado', money(c.countedAmount), PRIMARY) },
          { width: '*', ...box(`Diferencia · ${RESULT_LABEL[result]}`, money(c.difference), resultColor) },
        ],
        columnGap: 8,
        margin: [0, 0, 0, 12],
      },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'Cómo se calcula lo esperado', bold: true, color: PRIMARY, margin: [0, 0, 0, 4] },
              {
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    row('Fondo inicial', money(d.openingAmount)),
                    row('+ Ventas en efectivo', money(d.cashSales)),
                    row('+ Entradas de efectivo', money(d.incomes)),
                    row('− Salidas de efectivo', money(d.expenses)),
                    row('− Devoluciones en efectivo', money(d.cashRefunds)),
                    row('= Esperado', money(c.expectedAmount), { bold: true, color: PRIMARY }),
                  ],
                },
                layout: { hLineWidth: (i: number, node: any) => (i === node.table.body.length - 1 ? 0.8 : 0), vLineWidth: () => 0, hLineColor: () => BORDER },
              },
            ],
          },
          {
            width: '*',
            stack: [
              { text: 'Datos', bold: true, color: PRIMARY, margin: [0, 0, 0, 4] },
              {
                table: {
                  widths: ['auto', '*'],
                  body: [
                    row('Contó', c.userName || '—'),
                    row('Responsable del turno', c.shiftUserName || '—'),
                    row('Turno abierto', dateTime(c.shiftOpenedAt)),
                    row('Tolerancia', money(c.tolerance)),
                  ],
                },
                layout: 'noBorders',
              },
            ],
          },
        ],
        columnGap: 20,
        margin: [0, 0, 0, 12],
      },
      { text: 'Desglose por denominación', bold: true, color: PRIMARY, margin: [0, 0, 0, 4] },
      { columns: [{ width: '*', ...linesTable('Billetes', bills) }, { width: '*', ...linesTable('Monedas', coins) }], columnGap: 16 },
      ...(c.notes ? [{ text: 'Observaciones', bold: true, color: PRIMARY, margin: [0, 12, 0, 2] }, { text: c.notes }] : []),
      ...(c.otherValues ? [{ text: 'Otros valores (no suman al efectivo)', bold: true, color: PRIMARY, margin: [0, 10, 0, 2] }, { text: c.otherValues }] : []),
      { columns: [signature('Cajero', c.shiftUserName), signature('Supervisor', c.userName !== c.shiftUserName ? c.userName : undefined)], columnGap: 40, margin: [0, 20, 0, 0] },
    ],
  }
  await pdfMake.createPdf(doc).download(`arqueo-${c.id}.pdf`)
}
