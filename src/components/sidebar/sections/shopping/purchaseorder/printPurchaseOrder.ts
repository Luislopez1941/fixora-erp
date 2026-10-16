import logo from '../../../../../assets/logo-fixora.png'

// Impresión de una orden de compra. Se arma aparte (iframe oculto) con el mismo diseño de la requisición y del corte de caja:
// así no depende de los estilos de la app ni del modo claro/oscuro.

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  DRAFT: { label: 'Borrador', bg: '#eef0f3', fg: '#5b6472' },
  PENDING: { label: 'Pendiente', bg: '#fff1e3', fg: '#c25a00' },
  APPROVED: { label: 'Aprobada', bg: '#e6eefb', fg: '#1d4fa3' },
  REJECTED: { label: 'Rechazada', bg: '#fdeaea', fg: '#b42323' },
  PARTIAL: { label: 'Parcial', bg: '#f0e9fb', fg: '#6d3bc4' },
  COMPLETED: { label: 'Completada', bg: '#e7f6ec', fg: '#1b7a43' },
}

const esc = (text: unknown) =>
  String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

const money = (value: number) => Number(value ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
const qty = (value: unknown) => Number(value ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 4 })
const day = (value?: string | null) => (value ? new Date(value).toLocaleDateString('es-MX') : '—')
const when = (value?: string | null) => (value ? new Date(value).toLocaleString('es-MX') : '—')

export const purchaseOrderFolio = (po: any) => `${po?.serie?.name || 'OC'}-${po?.folio}`

/** Importes de la orden con la misma fórmula del modal de captura: subtotal - descuentos + IVA (16 %) + flete si se suma. */
export function purchaseOrderTotals(po: any) {
  const items: any[] = po?.items ?? []
  let subtotal = 0
  let discount = 0
  let iva = 0
  for (const item of items) {
    const line = Number(item.quantity ?? 0) * Number(item.price ?? 0)
    subtotal += line
    discount += Number(item.discount ?? 0)
    if (item.ivaOn) iva += line * 0.16
  }
  const freight = po?.sumFreight ? Number(po?.freightCost ?? 0) : 0
  return { subtotal, discount, iva, freight, total: subtotal - discount + iva + freight }
}

export function printPurchaseOrder(po: any) {
  const status = STATUS[po?.status] ?? { label: po?.status ?? '—', bg: '#eef0f3', fg: '#5b6472' }
  const items: any[] = po?.items ?? []
  const folio = purchaseOrderFolio(po)
  const totals = purchaseOrderTotals(po)
  const creator = [po?.user?.firstName, po?.user?.firstLastName].filter(Boolean).join(' ') || '—'
  const logoUrl = new URL(logo, window.location.origin).href

  const rows = items
    .map((item, index) => {
      const line = Number(item.quantity ?? 0) * Number(item.price ?? 0) - Number(item.discount ?? 0)
      return `<tr>
        <td class="n">${index + 1}</td>
        <td><strong>${esc(item.name || '—')}</strong>${item.code ? `<div class="muted">${esc(item.code)}</div>` : ''}${item.comments ? `<div class="note">${esc(item.comments)}</div>` : ''}</td>
        <td class="r">${qty(item.quantity)}</td>
        <td>${esc(item.unit?.name || '—')}</td>
        <td class="r">${money(Number(item.price ?? 0))}</td>
        <td class="r">${Number(item.discount ?? 0) ? money(Number(item.discount)) : '—'}</td>
        <td class="c">${item.ivaOn ? 'Sí' : 'No'}</td>
        <td class="r"><strong>${money(line)}</strong></td>
      </tr>`
    })
    .join('') || '<tr><td colspan="8" class="muted c">Esta orden no tiene artículos.</td></tr>'

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Orden de compra ${esc(folio)}</title>
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
  .tag{display:inline-block;margin-left:8px;vertical-align:middle;padding:1px 8px;border-radius:999px;font-size:9px;font-weight:700;letter-spacing:.04em;background:${status.bg};color:${status.fg}}
  .info{display:grid;grid-template-columns:1.5fr 1.2fr 1fr 1fr 1fr;gap:6px;margin-bottom:4mm}
  .info > div{background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:5px 8px;min-width:0}
  .info .k{font-size:8.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
  .info .v{font-weight:600;margin-top:1px;font-size:11.5px;overflow-wrap:anywhere}
  .comment{border-left:3px solid var(--secondary);background:#fff7ef;border-radius:6px;padding:6px 10px;margin-bottom:4mm;font-size:11.5px}
  .comment .k{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
  h2{font-size:12px;margin:0 0 6px;color:var(--primary);display:flex;align-items:center;gap:8px}
  h2::before{content:"";width:4px;height:14px;border-radius:2px;background:var(--secondary)}
  table{width:100%;border-collapse:collapse;margin-bottom:4mm}
  th{font-size:9.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);text-align:left;padding:5px 8px;background:var(--soft);border-bottom:1px solid var(--line)}
  td{padding:5px 8px;border-bottom:1px solid var(--line);vertical-align:top}
  tbody tr:nth-child(even) td{background:#fbfcfe}
  .r{text-align:right} .c{text-align:center} .n{width:26px;color:var(--secondary);font-weight:700;text-align:center}
  .muted{color:var(--muted);font-size:11px} .note{color:var(--muted);font-size:11px;font-style:italic}
  .totals{margin-left:auto;width:78mm;border:1px solid var(--line);border-radius:10px;overflow:hidden;break-inside:avoid}
  .totals div{display:flex;justify-content:space-between;padding:5px 12px;border-bottom:1px solid var(--line);font-size:12px}
  .totals div:last-child{border-bottom:none}
  .totals .grand{background:var(--primary);color:#fff;font-weight:700;font-size:14px}
  .totals .grand span:last-child{color:var(--secondary)}
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin:14mm 8mm 0}
  .sign div{border-top:1.5px solid var(--primary);text-align:center;padding-top:5px;font-size:11.5px;color:var(--muted)}
  .foot{position:fixed;left:10mm;right:10mm;bottom:6mm;padding:2mm 0 0;font-size:10px;color:var(--muted);display:flex;justify-content:space-between;border-top:1px solid var(--line)}
</style></head><body><div class="page">
  <div class="top">
    <div class="brand">
      <img src="${logoUrl}" alt="Fixora">
      <div>
        <h1>Orden de compra<span class="tag">${esc(status.label.toUpperCase())}</span></h1>
        <div class="sub">${esc(po?.company?.name || '—')} · ${esc(po?.branch?.name || '—')}</div>
      </div>
    </div>
    <div class="folio"><div class="k">Folio</div><div class="n">${esc(folio)}</div></div>
  </div>

  <div class="info">
    <div><div class="k">Proveedor</div><div class="v">${esc(po?.supplierName || '—')}</div></div>
    <div><div class="k">Elaboró</div><div class="v">${esc(creator)}</div></div>
    <div><div class="k">Fecha</div><div class="v">${esc(day(po?.createdAt))}</div></div>
    <div><div class="k">Llegada</div><div class="v">${esc(day(po?.arrivalDate))}</div></div>
    <div><div class="k">Tipo</div><div class="v">${po?.type === 1 ? 'Por requisición' : 'Directa'}</div></div>
    <div><div class="k">Cotización</div><div class="v">${esc(po?.quote || '—')}</div></div>
    <div><div class="k">Factura</div><div class="v">${esc(po?.bill || '—')}</div></div>
    <div><div class="k">Artículos</div><div class="v">${items.length}</div></div>
  </div>

  ${po?.comments ? `<div class="comment"><div class="k">Comentarios</div>${esc(po.comments)}</div>` : ''}

  <h2>Artículos</h2>
  <table>
    <thead><tr><th class="n">#</th><th>Artículo</th><th class="r">Cant.</th><th>Unidad</th><th class="r">Precio</th><th class="r">Desc.</th><th class="c">IVA</th><th class="r">Importe</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>${money(totals.subtotal)}</span></div>
    ${totals.discount ? `<div><span>Descuento</span><span>-${money(totals.discount)}</span></div>` : ''}
    <div><span>IVA</span><span>${money(totals.iva)}</span></div>
    ${po?.sumFreight ? `<div><span>Flete${po?.freightComments ? ` (${esc(po.freightComments)})` : ''}</span><span>${money(totals.freight)}</span></div>` : ''}
    <div class="grand"><span>Total</span><span>${money(totals.total)}</span></div>
  </div>

  <div class="sign"><div>Autorizó</div><div>Recibió</div></div>
  <div class="foot"><span>Fixora ERP · Orden de compra ${esc(folio)}</span><span>Generado ${esc(when(new Date().toISOString()))}</span></div>
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
