import logo from '../../../../../assets/logo-fixora.png'

// Impresión y envío de una requisición. El documento se arma aparte (iframe oculto) con el mismo diseño del
// corte de caja: así no depende de los estilos de la app ni del modo claro/oscuro.

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  DRAFT: { label: 'Borrador', bg: '#eef0f3', fg: '#5b6472' },
  PENDING: { label: 'Pendiente', bg: '#fff1e3', fg: '#c25a00' },
  APPROVED: { label: 'Aprobada', bg: '#e6eefb', fg: '#1d4fa3' },
  REJECTED: { label: 'Rechazada', bg: '#fdeaea', fg: '#b42323' },
  PARTIAL: { label: 'Parcial', bg: '#f0e9fb', fg: '#6d3bc4' },
  COMPLETED: { label: 'Completada', bg: '#e7f6ec', fg: '#1b7a43' },
}

const URGENCY: Record<string, string> = { LOW: 'Baja', NORMAL: 'Normal', HIGH: 'Alta', URGENT: 'Urgente' }

const esc = (text: unknown) =>
  String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

const when = (value?: string | null) => (value ? new Date(value).toLocaleString('es-MX') : '—')
const day = (value?: string | null) => (value ? new Date(value).toLocaleDateString('es-MX') : '—')
const qty = (value: unknown) => Number(value ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 4 })

const folioOf = (req: any) => `${req?.serie?.name || 'REQ'}-${req?.folio}`

const areaOf = (req: any) =>
  req?.areaType?.label
    ? `${req.areaType.label}${req.area?.name && req.area.name !== req.areaType.label ? ` › ${req.area.name}` : ''}`
    : req?.area?.name || '—'

const userOf = (req: any) => [req?.user?.firstName, req?.user?.firstLastName].filter(Boolean).join(' ') || '—'

export function printRequisition(req: any) {
  const status = STATUS[req?.status] ?? { label: req?.status ?? '—', bg: '#eef0f3', fg: '#5b6472' }
  const items: any[] = req?.items ?? []
  const folio = folioOf(req)
  const logoUrl = new URL(logo, window.location.origin).href

  const rows = items
    .map((item, index) => {
      const done = Number(item.deliveredQuantity ?? 0) >= Number(item.quantity ?? 0)
      return `<tr>
        <td class="n">${index + 1}</td>
        <td><strong>${esc(item.name || '—')}</strong>${item.code ? `<div class="muted">${esc(item.code)}</div>` : ''}${item.comments ? `<div class="note">${esc(item.comments)}</div>` : ''}</td>
        <td class="r">${qty(item.quantity)}</td>
        <td class="r">${qty(item.deliveredQuantity)}</td>
        <td>${esc(item.unit?.name || '—')}</td>
        <td>${esc(item.store?.name || '—')}</td>
        <td class="c"><span class="dot ${done ? 'dot--ok' : ''}"></span></td>
      </tr>`
    })
    .join('') || '<tr><td colspan="7" class="muted c">Esta requisición no tiene artículos.</td></tr>'

  const totalRequested = items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Requisición ${esc(folio)}</title>
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
  .title{font-size:13.5px;font-weight:700;color:var(--primary);margin:0 0 3mm}
  .info{display:grid;grid-template-columns:1.5fr 1.4fr 1fr .9fr .9fr .8fr;gap:6px;margin-bottom:4mm}
  .info > div{background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:5px 8px;min-width:0}
  .info .k{font-size:8.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
  .info .v{font-weight:600;margin-top:1px;font-size:11.5px;overflow-wrap:anywhere}
  .comment{border-left:3px solid var(--secondary);background:#fff7ef;border-radius:6px;padding:6px 10px;margin-bottom:4mm;font-size:11.5px}
  .comment .k{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
  h2{font-size:12px;margin:0 0 6px;color:var(--primary);display:flex;align-items:center;gap:8px}
  h2::before{content:"";width:4px;height:14px;border-radius:2px;background:var(--secondary)}
  table{width:100%;border-collapse:collapse;margin-bottom:4mm}
  th{font-size:9.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);text-align:left;padding:5px 8px;background:var(--soft);border-bottom:1px solid var(--line)}
  td{padding:5px 8px;border-bottom:1px solid var(--line);vertical-align:top}
  tbody tr:nth-child(even) td{background:#fbfcfe}
  .r{text-align:right} .c{text-align:center} .n{width:26px;color:var(--secondary);font-weight:700;text-align:center}
  .muted{color:var(--muted);font-size:11px} .note{color:var(--muted);font-size:11px;font-style:italic}
  .dot{display:inline-block;width:10px;height:10px;border-radius:50%;border:2px solid #c9d1dc}
  .dot--ok{background:#1b7a43;border-color:#1b7a43}
  tr.sum td{font-weight:700;background:var(--soft);border-top:2px solid var(--primary)}
  .sign{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin:12mm 4mm 0}
  .sign div{border-top:1.5px solid var(--primary);text-align:center;padding-top:5px;font-size:11.5px;color:var(--muted)}
  .foot{position:fixed;left:10mm;right:10mm;bottom:6mm;padding:2mm 0 0;font-size:10px;color:var(--muted);display:flex;justify-content:space-between;border-top:1px solid var(--line)}
</style></head><body><div class="page">
  <div class="top">
    <div class="brand">
      <img src="${logoUrl}" alt="Fixora">
      <div>
        <h1>Requisición<span class="tag">${esc(status.label.toUpperCase())}</span></h1>
        <div class="sub">${esc(req?.company?.name || '—')} · ${esc(req?.branch?.name || '—')}</div>
      </div>
    </div>
    <div class="folio"><div class="k">Folio</div><div class="n">${esc(folio)}</div></div>
  </div>

  ${req?.title ? `<p class="title">${esc(req.title)}</p>` : ''}

  <div class="info">
    <div><div class="k">Área solicitante</div><div class="v">${esc(areaOf(req))}</div></div>
    <div><div class="k">Solicitó</div><div class="v">${esc(userOf(req))}</div></div>
    <div><div class="k">Fecha</div><div class="v">${esc(day(req?.createdAt))}</div></div>
    <div><div class="k">Tipo</div><div class="v">${req?.option === 1 ? 'Diferencial' : 'Normal'}</div></div>
    <div><div class="k">Urgencia</div><div class="v">${esc(URGENCY[req?.urgency] || req?.urgency || '—')}</div></div>
    <div><div class="k">Artículos</div><div class="v">${items.length}</div></div>
  </div>

  ${req?.comments ? `<div class="comment"><div class="k">Comentario</div>${esc(req.comments)}</div>` : ''}

  <h2>Artículos solicitados</h2>
  <table>
    <thead><tr><th class="n">#</th><th>Artículo</th><th class="r">Solicitada</th><th class="r">Surtida</th><th>Unidad</th><th>Almacén</th><th class="c">Surtido</th></tr></thead>
    <tbody>${rows}
      <tr class="sum"><td></td><td>Total de piezas solicitadas</td><td class="r">${qty(totalRequested)}</td><td colspan="4"></td></tr>
    </tbody>
  </table>

  <div class="sign"><div>Solicitó<br>${esc(userOf(req))}</div><div>Autorizó</div><div>Recibió</div></div>
  <div class="foot"><span>Fixora ERP · Requisición ${esc(folio)}</span><span>Generado ${esc(when(new Date().toISOString()))}</span></div>
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

/** Resumen en texto de la requisición, para compartirlo por WhatsApp, correo, etc. */
export function requisitionSummary(req: any): string {
  const status = STATUS[req?.status]?.label ?? req?.status ?? '—'
  const lines = [
    `*Requisición ${folioOf(req)}* (${status})`,
    req?.title ? `Título: ${req.title}` : '',
    `Empresa: ${req?.company?.name || '—'} · ${req?.branch?.name || '—'}`,
    `Área solicitante: ${areaOf(req)}`,
    `Solicitó: ${userOf(req)} · ${day(req?.createdAt)}`,
    `Urgencia: ${URGENCY[req?.urgency] || req?.urgency || '—'}`,
    '',
    'Artículos:',
    ...(req?.items ?? []).map((item: any) => `• ${item.name || '—'}${item.code ? ` (${item.code})` : ''}: ${qty(item.quantity)} ${item.unit?.name || ''}`.trim()),
  ]
  if (req?.comments) lines.push('', `Comentario: ${req.comments}`)
  return lines.filter((line, i, all) => line !== '' || (all[i - 1] !== '' && i !== 0)).join('\n')
}

/** Comparte la requisición con el menú nativo del dispositivo; si no existe, copia el resumen al portapapeles. */
export async function shareRequisition(req: any): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  const text = requisitionSummary(req)
  const title = `Requisición ${folioOf(req)}`
  try {
    if (navigator.share) {
      await navigator.share({ title, text })
      return 'shared'
    }
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch (error: any) {
    // Cerrar el menú de compartir sin elegir nada no es un error
    return error?.name === 'AbortError' ? 'cancelled' : 'failed'
  }
}
