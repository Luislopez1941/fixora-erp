import logo from '../../../../../assets/logo-fixora.png'

// Impresión y envío de una orden de venta. Se arma aparte (iframe oculto) con el mismo diseño de las cotizaciones,
// las requisiciones y el corte de caja: así no depende de los estilos de la app ni del modo claro/oscuro.

// Evento que avisa a la lista que una orden de venta cambió (la crean, editan, cambian de estado, registran entregas o borran los modales)
export const SALES_ORDERS_CHANGED = 'sales-orders-changed'

export const SALES_ORDER_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Activa', color: '#1d4fa3', bg: '#e6eefb' },
  COMPLETED: { label: 'Completada', color: '#1b7a43', bg: '#e7f6ec' },
  CANCELLED: { label: 'Cancelada', color: '#b42323', bg: '#fdeaea' },
}

const esc = (text: unknown) =>
  String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

export const money = (value: number) => Number(value ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
const qty = (value: unknown) => Number(value ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 4 })
const day = (value?: string | null) => (value ? new Date(value).toLocaleDateString('es-MX') : '—')
const when = (value?: string | null) => (value ? new Date(value).toLocaleString('es-MX') : '—')

export const salesOrderFolio = (q: any) => `${q?.serie?.name || 'OV'}-${q?.folio}`

/** Nombre del cliente: el registrado (razón social o nombre) o el nombre libre que se escribió. */
export const salesOrderCustomer = (q: any) => {
  const c = q?.customer
  const registered = c?.businessName || [c?.firstName, c?.lastName].filter(Boolean).join(' ')
  return registered || q?.customerName || '—'
}

/** Importes: subtotal - descuentos + IVA (16 %) sobre las partidas marcadas. Misma fórmula del modal de captura. */
export function salesOrderTotals(items: any[] = []) {
  let subtotal = 0
  let discount = 0
  let iva = 0
  for (const item of items) {
    const line = Number(item.quantity ?? 0) * Number(item.price ?? 0)
    subtotal += line
    discount += Number(item.discount ?? 0)
    if (item.ivaOn) iva += line * 0.16
  }
  return { subtotal, discount, iva, total: subtotal - discount + iva }
}

export function printSalesOrder(q: any) {
  const status = SALES_ORDER_STATUS[q?.status] ?? { label: q?.status ?? '—', color: '#5b6472', bg: '#eef0f3' }
  const items: any[] = q?.items ?? []
  const folio = salesOrderFolio(q)
  const totals = salesOrderTotals(items)
  const creator = [q?.user?.firstName, q?.user?.firstLastName].filter(Boolean).join(' ') || '—'
  const logoUrl = new URL(logo, window.location.origin).href

  const rows = items
    .map((item, index) => {
      const line = Number(item.quantity ?? 0) * Number(item.price ?? 0) - Number(item.discount ?? 0)
      return `<tr>
        <td class="n">${index + 1}</td>
        <td><strong>${esc(item.name || '—')}</strong>${item.code ? `<div class="muted">${esc(item.code)}</div>` : ''}${item.comments ? `<div class="note">${esc(item.comments)}</div>` : ''}</td>
        <td class="r">${qty(item.quantity)}</td>
        <td class="r">${qty(item.deliveredQuantity)}</td>
        <td>${esc(item.unit?.name || '—')}</td>
        <td class="r">${money(Number(item.price ?? 0))}</td>
        <td class="r">${Number(item.discount ?? 0) ? money(Number(item.discount)) : '—'}</td>
        <td class="c">${item.ivaOn ? 'Sí' : 'No'}</td>
        <td class="r"><strong>${money(line)}</strong></td>
      </tr>`
    })
    .join('') || '<tr><td colspan="9" class="muted c">Esta orden de venta no tiene conceptos.</td></tr>'

  const terms = [
    q?.paymentTerms ? `<div><span class="k">Condiciones de pago</span>${esc(q.paymentTerms)}</div>` : '',
    q?.deliveryTime ? `<div><span class="k">Tiempo de entrega</span>${esc(q.deliveryTime)}</div>` : '',
  ].filter(Boolean).join('')

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Orden de venta ${esc(folio)}</title>
<style>
  :root{--primary:#072a57;--secondary:#fc7400;--ink:#1c2430;--muted:#6b7686;--line:#e3e8ef;--soft:#f5f7fb}
  *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  /* margen 0 en la hoja: así el navegador no imprime su fecha y título arriba; el espacio lo da .page */
  @page{size:A4;margin:0}
  body{font-family:"Poppins","Segoe UI",Arial,Helvetica,sans-serif;color:var(--ink);margin:0;font-size:12.5px;line-height:1.4}
  .page{padding:9mm 10mm 16mm}
  .top{background:var(--primary);color:#fff;padding:8px 14px;border-radius:12px;border-bottom:3px solid var(--secondary);display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:4mm}
  .brand{display:flex;align-items:center;gap:10px;min-width:0}
  .brand img{height:28px;background:#fff;border-radius:8px;padding:4px 7px;display:block}
  .top h1{font-size:15px;margin:0;font-weight:700;line-height:1.15}
  .top .sub{margin-top:1px;color:#c9d6ea;font-size:10.5px}
  .folio{text-align:right;white-space:nowrap;flex-shrink:0}
  .folio .n{font-size:20px;font-weight:700;color:var(--secondary);line-height:1}
  .folio .k{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#c9d6ea;margin-bottom:1px}
  .tag{display:inline-block;margin-left:8px;vertical-align:middle;padding:1px 8px;border-radius:999px;font-size:9px;font-weight:700;letter-spacing:.04em;background:${status.bg};color:${status.color}}
  .title{font-size:13.5px;font-weight:700;color:var(--primary);margin:0 0 3mm}
  .info{display:grid;grid-template-columns:2fr 1.4fr 1fr 1fr;gap:6px;margin-bottom:4mm}
  .info > div{background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:5px 8px;min-width:0}
  .info .k{font-size:8.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
  .info .v{font-weight:600;margin-top:1px;font-size:11.5px;overflow-wrap:anywhere}
  .comment{border-left:3px solid var(--secondary);background:#fff7ef;border-radius:6px;padding:6px 10px;margin-bottom:4mm;font-size:11.5px}
  .comment .k,.terms .k{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
  h2{font-size:12px;margin:0 0 6px;color:var(--primary);display:flex;align-items:center;gap:8px}
  h2::before{content:"";width:4px;height:14px;border-radius:2px;background:var(--secondary)}
  table{width:100%;border-collapse:collapse;margin-bottom:4mm}
  th{font-size:9.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);text-align:left;padding:5px 8px;background:var(--soft);border-bottom:1px solid var(--line)}
  td{padding:5px 8px;border-bottom:1px solid var(--line);vertical-align:top}
  tbody tr:nth-child(even) td{background:#fbfcfe}
  .r{text-align:right} .c{text-align:center} .n{width:26px;color:var(--secondary);font-weight:700;text-align:center}
  .muted{color:var(--muted);font-size:11px} .note{color:var(--muted);font-size:11px;font-style:italic}
  .bottom{display:flex;gap:10mm;align-items:flex-start;break-inside:avoid}
  .terms{flex:1;display:flex;flex-direction:column;gap:6px;font-size:11.5px}
  .terms > div{background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:6px 10px}
  .totals{margin-left:auto;width:78mm;border:1px solid var(--line);border-radius:10px;overflow:hidden}
  .totals div{display:flex;justify-content:space-between;padding:5px 12px;border-bottom:1px solid var(--line);font-size:12px}
  .totals div:last-child{border-bottom:none}
  .totals .grand{background:var(--primary);color:#fff;font-weight:700;font-size:14px}
  .totals .grand span:last-child{color:var(--secondary)}
  .legal{margin-top:4mm;font-size:10.5px;color:var(--muted)}
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin:14mm 8mm 0}
  .sign div{border-top:1.5px solid var(--primary);text-align:center;padding-top:5px;font-size:11.5px;color:var(--muted)}
  .foot{position:fixed;left:10mm;right:10mm;bottom:6mm;padding:2mm 0 0;font-size:10px;color:var(--muted);display:flex;justify-content:space-between;border-top:1px solid var(--line)}
</style></head><body><div class="page">
  <div class="top">
    <div class="brand">
      <img src="${logoUrl}" alt="Fixora">
      <div>
        <h1>Orden de venta<span class="tag">${esc(status.label.toUpperCase())}</span></h1>
        <div class="sub">${esc(q?.company?.name || '—')} · ${esc(q?.branch?.name || '—')}</div>
      </div>
    </div>
    <div class="folio"><div class="k">Folio</div><div class="n">${esc(folio)}</div></div>
  </div>

  ${q?.title ? `<p class="title">${esc(q.title)}</p>` : ''}

  <div class="info">
    <div><div class="k">Cliente</div><div class="v">${esc(salesOrderCustomer(q))}</div></div>
    <div><div class="k">Elaboró</div><div class="v">${esc(creator)}</div></div>
    <div><div class="k">Fecha</div><div class="v">${esc(day(q?.createdAt))}</div></div>
    <div><div class="k">Entrega</div><div class="v">${esc(day(q?.deliveryDate))}</div></div>
  </div>

  ${q?.comments ? `<div class="comment"><span class="k">Comentarios</span>${esc(q.comments)}</div>` : ''}

  <h2>Conceptos</h2>
  <table>
    <thead><tr><th class="n">#</th><th>Descripción</th><th class="r">Cant.</th><th class="r">Entreg.</th><th>Unidad</th><th class="r">Precio</th><th class="r">Desc.</th><th class="c">IVA</th><th class="r">Importe</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="bottom">
    <div class="terms">${terms}</div>
    <div class="totals">
      <div><span>Subtotal</span><span>${money(totals.subtotal)}</span></div>
      ${totals.discount ? `<div><span>Descuento</span><span>-${money(totals.discount)}</span></div>` : ''}
      <div><span>IVA</span><span>${money(totals.iva)}</span></div>
      <div class="grand"><span>Total</span><span>${money(totals.total)}</span></div>
    </div>
  </div>

  ${q?.quotation ? `<p class="legal">Orden generada a partir de la cotización ${esc(`${q.quotation.serie?.name || 'COT'}-${q.quotation.folio}`)}.</p>` : ''}

  <div class="sign"><div>Elaboró<br>${esc(creator)}</div><div>Recibí de conformidad (cliente)</div></div>
  <div class="foot"><span>Fixora ERP · Orden de venta ${esc(folio)}</span><span>Generado ${esc(when(new Date().toISOString()))}</span></div>
</div></body></html>`

  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(frame)
  const doc = frame.contentDocument
  if (!doc || !frame.contentWindow) {
    frame.remove()
    return
  }
  doc.open()
  doc.write(html)
  doc.close()
  // Espera a que cargue el logo y el documento pinte antes de abrir el diálogo de impresión
  const images = Array.from(doc.images)
  Promise.all(images.map((img) => (img.complete ? Promise.resolve() : new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res() }))))
    .then(() => new Promise((res) => setTimeout(res, 250)))
    .then(() => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
      setTimeout(() => frame.remove(), 1500)
    })
}

/** Resumen en texto de la orden de venta, para mandarla por WhatsApp, correo, etc. */
export function salesOrderSummary(q: any): string {
  const status = SALES_ORDER_STATUS[q?.status]?.label ?? q?.status ?? '—'
  const totals = salesOrderTotals(q?.items ?? [])
  const lines = [
    `*Orden de venta ${salesOrderFolio(q)}* (${status})`,
    q?.title ? `${q.title}` : '',
    `Cliente: ${salesOrderCustomer(q)}`,
    `Fecha: ${day(q?.createdAt)}${q?.deliveryDate ? ` · Entrega: ${day(q.deliveryDate)}` : ''}`,
    '',
    'Conceptos:',
    ...(q?.items ?? []).map((item: any) => `• ${item.name || '—'}: ${qty(item.quantity)} ${item.unit?.name || ''} × ${money(Number(item.price ?? 0))}`.replace(/\s+/g, ' ').trim()),
    '',
    `*Total: ${money(totals.total)}*`,
  ]
  if (q?.paymentTerms) lines.push(`Condiciones de pago: ${q.paymentTerms}`)
  if (q?.deliveryTime) lines.push(`Tiempo de entrega: ${q.deliveryTime}`)
  return lines.join('\n')
}

/** Comparte la orden de venta con el menú nativo del dispositivo; si no existe, copia el resumen al portapapeles. */
export async function shareSalesOrder(q: any): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  const text = salesOrderSummary(q)
  const title = `Orden de venta ${salesOrderFolio(q)}`
  try {
    if (navigator.share) {
      await navigator.share({ title, text })
      return 'shared'
    }
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch (error: any) {
    return error?.name === 'AbortError' ? 'cancelled' : 'failed'
  }
}
