import { cssVar, loadPdfMake, tint } from '../../../../utils/pdf'
import { RESULT_LABEL, resultOf } from '../../shared/cashFormat'

/** PDF de un corte de caja (reimpresión): resumen, ventas por forma de pago, movimientos, esperado vs contado y firmas. */
const money = (n: number | null | undefined) => Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })
const TZ = 'America/Mexico_City'
const dateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('es-MX', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' }) : '—')

export async function downloadClosePdf(c: any) {
  const pdfMake = await loadPdfMake()
  const PRIMARY = cssVar('--primary-color', '#072a57')
  const SECONDARY = cssVar('--secondary-color', '#fc7400')
  const MUTED = '#6b7280'
  const res = resultOf({ difference: c.difference ?? 0, tolerance: c.tolerance })
  const resColor = res === 'BALANCED' ? '#1f9d55' : res === 'OVER' ? '#2563eb' : '#d64545'
  const userName = c.user ? `${c.user.firstName ?? ''} ${c.user.firstLastName ?? ''}`.trim() : '—'

  const table = (head: string[], body: (string | number)[][], numCols: number[]) => ({
    table: {
      headerRows: 1,
      widths: head.map((_, i) => (i === 0 ? '*' : 'auto')),
      body: [
        head.map((h, i) => ({ text: h, bold: true, fontSize: 8, color: '#fff', fillColor: PRIMARY, alignment: numCols.includes(i) ? 'right' : 'left' })),
        ...(body.length ? body.map((r) => r.map((v, i) => ({ text: String(v), alignment: numCols.includes(i) ? 'right' : 'left' }))) : [[{ text: 'Sin registros', colSpan: head.length, color: MUTED, alignment: 'center' }, ...head.slice(1).map(() => ({}))]]),
      ],
    },
    layout: {
      fillColor: (i: number) => (i > 0 && i % 2 === 0 ? tint(PRIMARY, 0.95) : null),
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingTop: () => 3,
      paddingBottom: () => 3,
    },
    fontSize: 9,
    margin: [0, 0, 0, 10],
  })
  const title = (t: string) => ({ text: t, bold: true, color: PRIMARY, margin: [0, 6, 0, 4] })
  const box = (label: string, value: string, color: string) => ({
    width: '*',
    table: { widths: [3, '*'], body: [[{ text: '', fillColor: color }, { stack: [{ text: label.toUpperCase(), fontSize: 7, bold: true, color: MUTED }, { text: value, fontSize: 14, bold: true, color }], margin: [8, 6, 6, 6], fillColor: tint(PRIMARY, 0.96) }]] },
    layout: 'noBorders',
  })
  const signature = (label: string, name?: string) => ({
    width: '*',
    stack: [
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.8, lineColor: '#9ca3af' }], margin: [0, 36, 0, 4] },
      { text: label, bold: true, fontSize: 9 },
      { text: name ?? ' ', fontSize: 8, color: MUTED },
    ],
  })

  const doc = {
    pageSize: 'LETTER',
    pageMargins: [40, 70, 40, 50],
    info: { title: `Corte del turno #${c.shiftId}`, author: 'Fixora' },
    defaultStyle: { fontSize: 9.5, color: '#1f2937' },
    background: () => ({ canvas: [{ type: 'rect', x: 0, y: 0, w: 612, h: 50, color: PRIMARY }, { type: 'rect', x: 0, y: 50, w: 612, h: 3, color: SECONDARY }] }),
    header: () => ({
      margin: [40, 12, 40, 0],
      columns: [
        { stack: [{ text: `Corte de caja · Turno #${c.shiftId}`, fontSize: 15, bold: true, color: '#fff' }, { text: `${c.branchName ?? ''}${c.registerName ? ` · ${c.registerName}` : ''}`, fontSize: 9, color: tint(PRIMARY, 0.7) }] },
        { width: 'auto', alignment: 'right', stack: [{ text: `Cierre: ${dateTime(c.closedAt)}`, fontSize: 9, bold: true, color: '#fff' }, { text: `Apertura: ${dateTime(c.openedAt)}`, fontSize: 8, color: tint(PRIMARY, 0.7) }] },
      ],
    }),
    footer: (page: number, pages: number) => ({
      margin: [40, 10, 40, 0],
      columns: [{ text: [{ text: 'Fixora', bold: true, color: PRIMARY }, ' · Corte de caja'], fontSize: 7.5, color: MUTED }, { text: `Página ${page} de ${pages}`, alignment: 'right', fontSize: 7.5, color: MUTED }],
    }),
    content: [
      { columns: [box('Esperado', money(c.expectedBalance), PRIMARY), box('Contado', c.closingAmount != null ? money(c.closingAmount) : '—', PRIMARY), box(`Diferencia · ${RESULT_LABEL[res]}`, c.difference != null ? money(c.difference) : '—', resColor)], columnGap: 8, margin: [0, 0, 0, 12] },
      title('Cómo se calcula lo esperado'),
      table(['Concepto', 'Importe'], [
        ['Fondo inicial', money(c.openingAmount)],
        ['+ Ventas en efectivo', money(c.cashSalesTotal)],
        ['+ Entradas de efectivo', money(c.incomes)],
        ['− Salidas de efectivo', money(c.expenses)],
        ['− Devoluciones en efectivo', money(c.cashRefundsTotal)],
        ['= Esperado', money(c.expectedBalance)],
      ], [1]),
      title('Ventas por forma de pago'),
      table(['Forma de pago', 'Cobros', 'Total'], (c.byPaymentMethod ?? []).map((m: any) => [m.name, m.count, money(m.total)]), [1, 2]),
      title('Movimientos de efectivo'),
      table(['Fecha', 'Tipo', 'Concepto', 'Importe'], (c.movements ?? []).map((m: any) => [dateTime(m.createdAt), m.type === 'INCOME' ? 'Entrada' : 'Salida', m.concept, money(m.amount)]), [3]),
      ...(c.closeNotes ? [title('Observaciones'), { text: c.closeNotes }] : []),
      ...(c.approvedByName ? [{ text: `Autorizó la diferencia: ${c.approvedByName}`, color: MUTED, margin: [0, 6, 0, 0] }] : []),
      { columns: [signature('Cajero', userName), signature('Supervisor', c.approvedByName || undefined)], columnGap: 40, margin: [0, 16, 0, 0] },
    ],
  }
  await pdfMake.createPdf(doc).download(`corte-turno-${c.shiftId}.pdf`)
}
