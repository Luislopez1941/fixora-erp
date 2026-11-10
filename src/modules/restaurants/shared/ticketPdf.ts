import { loadPdfMake } from '../../../utils/pdf'
import { KitchenTicket, Tab, money, qty, tabTitle } from './restaurantTypes'

/**
 * Tickets de 80 mm del restaurante (se abren en una pestaña para imprimir en la térmica):
 *  · comanda para cocina/barra (lo que se envió, agrupado por estación),
 *  · pre-cuenta (lo que lleva la mesa, sin cobrar) y ticket de venta (con pagos, cambio y propina).
 */
const PAGE = { pageSize: { width: 226, height: 'auto' as const }, pageMargins: [10, 10, 10, 14] as [number, number, number, number] }
const line = { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 206, y2: 0, lineWidth: 0.6, dash: { length: 2 } }], margin: [0, 4, 0, 4] }
const time = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '')

/**
 * El navegador solo deja abrir pestañas dentro del clic: quien imprime abre antes `printWindow()` (al tocar el botón) y
 * se la pasa aquí; si no, se intenta abrir una nueva.
 */
export const printWindow = () => window.open('', '_blank')

async function open(doc: any, win?: Window | null) {
  const pdfMake = await loadPdfMake()
  const pdf = pdfMake.createPdf({ ...PAGE, defaultStyle: { fontSize: 9 }, ...doc })
  // Abre el PDF con la orden de imprimir (en la térmica basta Enter)
  await pdf.print(win && !win.closed ? win : null)
}

export async function printKitchenTicket(tab: Tab, ticket: KitchenTicket, win?: Window | null) {
  const groups = new Map<string, KitchenTicket['items']>()
  for (const i of ticket.items) groups.set(i.station ?? 'Cocina', [...(groups.get(i.station ?? 'Cocina') ?? []), i])
  const content: any[] = [
    { text: `COMANDA ${ticket.ticketNo}`, bold: true, fontSize: 14, alignment: 'center' },
    { text: tabTitle(tab), bold: true, fontSize: 12, alignment: 'center', margin: [0, 2, 0, 0] },
    { text: `Cuenta #${tab.folio} · ${tab.waiterName ?? ''} · ${time(ticket.sentAt)}`, alignment: 'center', fontSize: 8 },
    ...(ticket.estimatedMinutes ? [{ text: `Tiempo estimado: ${ticket.estimatedMinutes} min`, bold: true, alignment: 'center', fontSize: 9, margin: [0, 2, 0, 0] }] : []),
  ]
  for (const [station, items] of groups) {
    content.push(line, { text: station.toUpperCase(), bold: true, fontSize: 10 })
    for (const i of items) {
      content.push({ text: `${qty(i.quantity)}  ${i.name}`, bold: true, fontSize: 11, margin: [0, 3, 0, 0] })
      const extra = [...(i.modifiers ?? []), i.notes ? `Nota: ${i.notes}` : '', i.seat ? `Comensal ${i.seat}` : '', i.course > 1 ? `Tiempo ${i.course}` : '']
      extra.filter(Boolean).forEach((x) => content.push({ text: `   · ${x}`, fontSize: 9 }))
    }
  }
  await open({ content }, win)
}

const itemRows = (tab: Tab) =>
  tab.items
    .filter((i) => i.status !== 'CANCELLED')
    .map((i) => [
      { text: qty(i.quantity) },
      { text: i.name },
      { text: money(Number(i.quantity) * Number(i.unitPrice)), alignment: 'right' },
    ])

const header = (data: any) => [
  { text: data?.company?.name ?? '', bold: true, fontSize: 11, alignment: 'center' },
  data?.branch?.name ? { text: data.branch.name, alignment: 'center', fontSize: 8 } : '',
  data?.branch?.address ? { text: data.branch.address, alignment: 'center', fontSize: 7 } : '',
  data?.company?.taxId ? { text: `RFC ${data.company.taxId}`, alignment: 'center', fontSize: 7 } : '',
  line,
]

/** Pre-cuenta: lo que lleva la mesa (precios antes de IVA y el total estimado). No es comprobante de pago. */
export async function printPreBill(
  data: { tab: Tab; company?: any; branch?: any },
  totals?: { subtotal: number; tax: number; total: number; discount: number },
  win?: Window | null,
) {
  const { tab } = data
  const content: any[] = [
    ...header(data),
    { text: 'PRE-CUENTA', bold: true, alignment: 'center' },
    { text: `${tabTitle(tab)} · Cuenta #${tab.folio}`, alignment: 'center' },
    { text: `${tab.guests} comensal(es) · ${tab.waiterName ?? ''}`, alignment: 'center', fontSize: 8 },
    line,
    { table: { widths: [18, '*', 52], body: itemRows(tab) }, layout: 'noBorders' },
    line,
  ]
  if (totals) {
    content.push(
      { columns: [{ text: 'Subtotal' }, { text: money(totals.subtotal), alignment: 'right' }] },
      ...(totals.discount ? [{ columns: [{ text: 'Descuento' }, { text: `-${money(totals.discount)}`, alignment: 'right' }] }] : []),
      { columns: [{ text: 'IVA' }, { text: money(totals.tax), alignment: 'right' }] },
      { columns: [{ text: 'TOTAL', bold: true, fontSize: 12 }, { text: money(totals.total), alignment: 'right', bold: true, fontSize: 12 }] },
    )
  }
  content.push({ text: 'Propina no incluida', alignment: 'center', fontSize: 8, margin: [0, 8, 0, 0] })
  await open({ content }, win)
}

/** Ticket de una cuenta cobrada: partidas, totales de la venta, pagos, cambio y propina. */
export async function printSaleTicket(data: { tab: Tab; company?: any; branch?: any; tipMethod?: string | null }, change = 0, win?: Window | null) {
  const { tab } = data
  const sale = tab.sale
  const content: any[] = [
    ...header(data),
    { text: sale?.folio ? `VENTA ${sale.folio}` : 'VENTA', bold: true, alignment: 'center' },
    { text: `${tabTitle(tab)} · Cuenta #${tab.folio}`, alignment: 'center' },
    { text: `${time(sale?.createdAt ?? tab.closedAt)} · ${tab.waiterName ?? ''}`, alignment: 'center', fontSize: 8 },
    line,
    { table: { widths: [18, '*', 52], body: itemRows(tab) }, layout: 'noBorders' },
    line,
  ]
  if (sale) {
    content.push(
      { columns: [{ text: 'Subtotal' }, { text: money(sale.subtotal), alignment: 'right' }] },
      ...(Number(sale.discount) ? [{ columns: [{ text: 'Descuento' }, { text: `-${money(sale.discount)}`, alignment: 'right' }] }] : []),
      { columns: [{ text: 'IVA' }, { text: money(sale.tax), alignment: 'right' }] },
      { columns: [{ text: 'TOTAL', bold: true, fontSize: 12 }, { text: money(sale.total), alignment: 'right', bold: true, fontSize: 12 }] },
      line,
      ...sale.payments.map((p) => ({ columns: [{ text: p.paymentMethod?.name ?? 'Efectivo' }, { text: money(p.amount), alignment: 'right' }] })),
    )
    if (change > 0) content.push({ columns: [{ text: 'Cambio' }, { text: money(change), alignment: 'right' }] })
  }
  if (Number(tab.tipAmount) > 0) {
    content.push(line, { columns: [{ text: `Propina${data.tipMethod ? ` (${data.tipMethod})` : ''}` }, { text: money(tab.tipAmount), alignment: 'right' }] })
  }
  content.push({ text: '¡Gracias por su visita!', alignment: 'center', margin: [0, 10, 0, 0] })
  await open({ content }, win)
}

/**
 * Cuenta dividida para imprimir: una sección por parte (por comensal o partes iguales), con su total aproximado con IVA.
 * Es informativa (como la pre-cuenta): el cobro real lo hace la pantalla de cobro.
 */
export async function printSplitBill(
  data: { tab: Tab; company?: any; branch?: any },
  parts: { label: string; lines: { qty: string; name: string; amount: number }[]; total: number }[],
  win?: Window | null,
) {
  const { tab } = data
  const content: any[] = [...header(data), { text: 'CUENTA DIVIDIDA', bold: true, alignment: 'center' }, { text: `${tabTitle(tab)} · Cuenta #${tab.folio}`, alignment: 'center' }]
  parts.forEach((part, i) => {
    content.push(
      line,
      { text: part.label, bold: true, fontSize: 11, margin: [0, 2, 0, 2] },
      ...(part.lines.length
        ? [{ table: { widths: [18, '*', 52], body: part.lines.map((l) => [{ text: l.qty }, { text: l.name }, { text: money(l.amount), alignment: 'right' }]) }, layout: 'noBorders' }]
        : []),
      { columns: [{ text: 'TOTAL aprox. con IVA', bold: true }, { text: money(part.total), alignment: 'right', bold: true }] },
    )
    if (i < parts.length - 1) content.push({ text: '- - - - - - - - - - - - - - - -', alignment: 'center', fontSize: 8, margin: [0, 6, 0, 0] })
  })
  content.push({ text: 'Propina no incluida', alignment: 'center', fontSize: 8, margin: [0, 8, 0, 0] })
  await open({ content }, win)
}
