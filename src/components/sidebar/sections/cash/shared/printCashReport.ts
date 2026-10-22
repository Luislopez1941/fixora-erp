import logo from '../../../../assets/logo-fixora.png'

// Impresión del reporte de corte de caja: arma un documento aparte (en un iframe oculto)
// para que el resultado no dependa de los estilos de la app ni del modo claro/oscuro.

export interface CashReportData {
  shiftId: number
  status?: string
  branchName?: string | null
  user?: { firstName?: string; firstLastName?: string } | null
  openedAt?: string | null
  closedAt?: string | null
  openingAmount: number
  cashSalesTotal: number
  salesTotal?: number
  incomes: number
  expenses: number
  expectedBalance: number
  byPaymentMethod?: { code: string; name: string; count: number; total: number }[]
  movements?: { id: number; type: string; amount: number; concept: string; createdAt: string }[]
  closingAmount?: number | null
  difference?: number | null
}

export type CutKind = 'PARTIAL' | 'FINAL'

const money = (value: number) =>
  Number(value ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

const when = (value?: string | null) => (value ? new Date(value).toLocaleString('es-MX') : '—')

const esc = (text: unknown) =>
  String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

export const differenceLabel = (difference: number | null | undefined) =>
  difference == null ? '—' : difference === 0 ? 'Cuadrado' : difference > 0 ? 'Sobrante' : 'Faltante'

export function printCashReport(report: CashReportData, kind: CutKind, counted?: number | null) {
  const countedAmount = counted ?? report.closingAmount ?? null
  const difference = countedAmount != null ? countedAmount - report.expectedBalance : report.difference ?? null
  const cashier = [report.user?.firstName, report.user?.firstLastName].filter(Boolean).join(' ') || '—'

  const methods = (report.byPaymentMethod ?? [])
    .map((m) => `<tr><td>${esc(m.name)}</td><td class="r">${m.count}</td><td class="r">${money(m.total)}</td></tr>`)
    .join('') || '<tr><td colspan="3" class="muted">Sin cobros registrados</td></tr>'

  const movements = (report.movements ?? [])
    .map((m) => `<tr><td>${esc(when(m.createdAt))}</td><td>${esc(m.concept)}</td><td class="r">${m.type === 'INCOME' ? '+' : '-'}${money(m.amount)}</td></tr>`)
    .join('')

  // Estado de la diferencia: cuadrado (verde), sobrante (naranja) o faltante (rojo)
  const diffClass = difference == null ? 'neutral' : difference === 0 ? 'ok' : difference > 0 ? 'over' : 'short'
  const logoUrl = new URL(logo, window.location.origin).href
  const printedAt = when(new Date().toISOString())

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Corte de caja #${report.shiftId}</title>
<style>
  :root{--primary:#072a57;--secondary:#fc7400;--ink:#1c2430;--muted:#6b7686;--line:#e3e8ef;--soft:#f5f7fb}
  *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @page{size:A4;margin:10mm}
  body{font-family:"Poppins","Segoe UI",Arial,Helvetica,sans-serif;color:var(--ink);margin:0;font-size:12.5px;line-height:1.4}
  .page{padding:0 0 14mm}
  .top{background:var(--primary);color:#fff;padding:12px 18px;border-radius:14px;border-bottom:4px solid var(--secondary);display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:6mm}
  .brand{display:flex;align-items:center;gap:14px}
  .brand img{height:38px;background:#fff;border-radius:10px;padding:5px 9px;display:block}
  .top h1{font-size:19px;margin:0;font-weight:700;line-height:1.15}
  .top .sub{margin-top:2px;color:#c9d6ea;font-size:11.5px}
  .folio{text-align:right}
  .folio .n{font-size:28px;font-weight:700;color:var(--secondary);line-height:1}
  .folio .k{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#c9d6ea}
  .tag{display:inline-block;margin-left:8px;vertical-align:middle;background:var(--secondary);color:#fff;padding:2px 10px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.04em}
  .body{padding:0}
  .info{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:8mm}
  .info > div{background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:8px 10px}
  .info .k{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
  .info .v{font-weight:600;margin-top:2px}
  h2{font-size:13px;margin:0 0 8px;color:var(--primary);display:flex;align-items:center;gap:8px}
  h2::before{content:"";width:4px;height:14px;border-radius:2px;background:var(--secondary)}
  .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:8mm}
  .kpi{border-radius:12px;padding:12px 14px;border:1px solid var(--line)}
  .kpi .k{font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
  .kpi .v{font-size:20px;font-weight:700;margin-top:2px}
  .kpi.main{background:var(--primary);border-color:var(--primary)} .kpi.main .k{color:#c9d6ea} .kpi.main .v{color:#fff}
  .kpi.ok{background:#e7f6ec;border-color:#bfe5cc} .kpi.ok .v{color:#1b7a43}
  .kpi.over{background:#fff1e3;border-color:#ffd2a6} .kpi.over .v{color:#c25a00}
  .kpi.short{background:#fdeaea;border-color:#f3bcbc} .kpi.short .v{color:#b42323}
  .kpi.neutral .v{color:var(--ink)}
  .kpi .h{font-size:11px;margin-top:2px;color:var(--muted)}
  table{width:100%;border-collapse:collapse;margin-bottom:8mm}
  th{font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);text-align:left;padding:6px 10px;background:var(--soft);border-bottom:1px solid var(--line)}
  td{padding:7px 10px;border-bottom:1px solid var(--line)}
  tbody tr:nth-child(even) td{background:#fbfcfe}
  .r{text-align:right} .muted{color:var(--muted)}
  .op{width:26px;color:var(--secondary);font-weight:700;text-align:center}
  tr.sum td{font-weight:700;background:var(--soft);border-top:2px solid var(--primary)}
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin:18mm 6mm 0}
  .sign div{border-top:1.5px solid var(--primary);text-align:center;padding-top:5px;font-size:11.5px;color:var(--muted)}
  .foot{position:fixed;left:0;right:0;bottom:0;padding:3mm 0 0;font-size:10px;color:var(--muted);display:flex;justify-content:space-between;border-top:1px solid var(--line)}
</style></head><body><div class="page">
  <div class="top">
    <div class="brand">
      <img src="${logoUrl}" alt="Fixora">
      <div>
        <h1>Corte de caja ${kind === 'FINAL' ? 'final' : 'parcial'}<span class="tag">${kind === 'FINAL' ? 'TURNO CERRADO' : 'TURNO ABIERTO'}</span></h1>
        <div class="sub">${esc(report.branchName ?? '—')}</div>
      </div>
    </div>
    <div class="folio"><div class="k">Turno</div><div class="n">#${report.shiftId}</div></div>
  </div>

  <div class="body">
    <div class="info">
      <div><div class="k">Cajero</div><div class="v">${esc(cashier)}</div></div>
      <div><div class="k">Apertura</div><div class="v">${esc(when(report.openedAt))}</div></div>
      <div><div class="k">${kind === 'FINAL' ? 'Cierre' : 'Impreso'}</div><div class="v">${esc(when(kind === 'FINAL' ? report.closedAt : new Date().toISOString()))}</div></div>
    </div>

    <div class="kpis">
      <div class="kpi main"><div class="k">Efectivo esperado</div><div class="v">${money(report.expectedBalance)}</div></div>
      <div class="kpi"><div class="k">Efectivo contado</div><div class="v">${countedAmount != null ? money(countedAmount) : '—'}</div></div>
      <div class="kpi ${diffClass}"><div class="k">Diferencia</div><div class="v">${difference != null ? money(difference) : '—'}</div><div class="h">${esc(differenceLabel(difference))}</div></div>
    </div>

    <h2>¿Cómo se calculó el efectivo esperado?</h2>
    <table>
      <tbody>
        <tr><td class="op"></td><td>Fondo inicial</td><td class="r">${money(report.openingAmount)}</td></tr>
        <tr><td class="op">+</td><td>Ventas en efectivo</td><td class="r">${money(report.cashSalesTotal)}</td></tr>
        <tr><td class="op">+</td><td>Ingresos de caja</td><td class="r">${money(report.incomes)}</td></tr>
        <tr><td class="op">−</td><td>Egresos de caja</td><td class="r">${money(report.expenses)}</td></tr>
        <tr class="sum"><td class="op">=</td><td>Efectivo esperado</td><td class="r">${money(report.expectedBalance)}</td></tr>
      </tbody>
    </table>

    <h2>Ventas por método de pago</h2>
    <table><thead><tr><th>Método</th><th class="r">Cobros</th><th class="r">Total</th></tr></thead><tbody>${methods}
      <tr class="sum"><td>Total vendido</td><td></td><td class="r">${money(report.salesTotal ?? 0)}</td></tr></tbody></table>

    ${movements ? `<h2>Movimientos de caja</h2><table><thead><tr><th>Fecha</th><th>Concepto</th><th class="r">Monto</th></tr></thead><tbody>${movements}</tbody></table>` : ''}

    <div class="sign"><div>Cajero<br>${esc(cashier)}</div><div>Supervisor</div></div>
  </div>
  <div class="foot"><span>Fixora ERP · Corte de caja #${report.shiftId}</span><span>Generado ${esc(printedAt)}</span></div>
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
  // Espera a que carguen las imágenes (logo) y el documento pinte antes de abrir el diálogo de impresión
  const images = Array.from(doc.images)
  Promise.all(images.map((img) => (img.complete ? Promise.resolve() : new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res() }))))
    .then(() => new Promise((res) => setTimeout(res, 250)))
    .then(() => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
      setTimeout(() => frame.remove(), 1500)
    })
}
