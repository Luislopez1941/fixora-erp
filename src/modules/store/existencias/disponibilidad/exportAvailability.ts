import APIs from '../../../../services/APIs'
import { STATUS, downloadCsv, fetchAllRows, qty } from '../shared/stockFormat'
import { downloadStockPdf } from '../shared/stockPdf'

export interface AvailabilityQuery {
  companyId: number | null
  branchId?: number
  search?: string
  categoryId?: number
  status?: string
}

const load = (q: AvailabilityQuery) => fetchAllRows((page) => APIs.getStockAvailability({ ...q, page, pageSize: 100 }))
const stamp = () => new Date().toISOString().slice(0, 10)

export async function exportAvailabilityCsv(q: AvailabilityQuery) {
  const { rows } = await load(q)
  downloadCsv(
    `disponibilidad-${stamp()}.csv`,
    ['Código', 'Artículo', 'Categoría', 'Existencia', 'Comprometido', 'Pedidos', 'Disponible', 'Mínimo', 'Estado'],
    rows.map((r: any) => [r.code ?? '', r.name, r.category ?? '', r.onHand, r.committed, r.orders, r.available, r.min, STATUS[r.status]?.label ?? r.status]),
  )
}

export async function exportAvailabilityPdf(q: AvailabilityQuery, scopeText: string) {
  const { rows, data } = await load(q)
  const s = data.summary ?? {}
  await downloadStockPdf({
    fileName: `disponibilidad-${stamp()}.pdf`,
    title: 'Disponibilidad',
    subtitle: scopeText,
    kpis: [
      { label: 'Existencia', value: qty(s.onHand) },
      { label: 'Comprometido', value: qty(s.committed) },
      { label: 'Disponible', value: qty(s.available) },
      { label: 'Artículos faltantes', value: qty(s.faltantes) },
    ],
    columns: [
      { header: 'Artículo', width: '*' },
      { header: 'Existencia', width: 'auto', align: 'right' },
      { header: 'Comprometido', width: 'auto', align: 'right' },
      { header: 'Disponible', width: 'auto', align: 'right' },
      { header: 'Estado', width: 'auto' },
    ],
    rows: rows.map((r: any) => [`${r.name}${r.code ? ` (${r.code})` : ''}`, qty(r.onHand), qty(r.committed), qty(r.available), STATUS[r.status]?.label ?? r.status]),
    statusColumn: 4,
  })
}
