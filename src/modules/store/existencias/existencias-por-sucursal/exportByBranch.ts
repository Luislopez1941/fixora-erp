import APIs from '../../../../services/APIs'
import { STATUS, downloadCsv, fetchAllRows, qty } from '../shared/stockFormat'
import { downloadStockPdf } from '../shared/stockPdf'

export interface ByBranchQuery {
  companyId: number | null
  search?: string
  categoryId?: number
  status?: string
}

const load = (q: ByBranchQuery) => fetchAllRows((page) => APIs.getStockByBranch({ ...q, page, pageSize: 100 }))

const stamp = () => new Date().toISOString().slice(0, 10)

/** CSV: un renglón por artículo y una columna por sucursal. */
export async function exportByBranchCsv(q: ByBranchQuery) {
  const { rows, data } = await load(q)
  const branches: { id: number; name: string }[] = data.branches ?? []
  downloadCsv(
    `existencias-por-sucursal-${stamp()}.csv`,
    ['Código', 'Artículo', 'Categoría', ...branches.map((b) => b.name), 'Total', 'Mínimo', 'Máximo', 'Estado'],
    rows.map((r: any) => [
      r.code ?? '',
      r.name,
      r.category ?? '',
      ...branches.map((b) => (r.byBranch?.[b.id]?.enabled || r.byBranch?.[b.id]?.qty ? r.byBranch[b.id].qty : '')),
      r.total,
      r.min ?? '',
      r.max ?? '',
      STATUS[r.status]?.label ?? r.status,
    ]),
  )
}

/** PDF con los indicadores y la tabla artículo × sucursal. */
export async function exportByBranchPdf(q: ByBranchQuery, filterText: string) {
  const { rows, data } = await load(q)
  const branches: { id: number; name: string }[] = data.branches ?? []
  const s = data.summary ?? {}
  await downloadStockPdf({
    fileName: `existencias-por-sucursal-${stamp()}.pdf`,
    title: 'Existencias por sucursal',
    subtitle: filterText,
    kpis: [
      { label: 'Artículos', value: qty(s.items) },
      { label: 'Unidades', value: qty(s.units) },
      { label: 'Stock bajo', value: qty(s.stockBajo) },
      { label: 'Agotados', value: qty(s.agotados) },
    ],
    columns: [
      { header: 'Artículo', width: '*' },
      ...branches.map((b) => ({ header: b.name, width: 'auto' as const, align: 'right' as const })),
      { header: 'Total', width: 'auto', align: 'right' },
      { header: 'Estado', width: 'auto' },
    ],
    rows: rows.map((r: any) => [
      `${r.name}${r.code ? ` (${r.code})` : ''}`,
      ...branches.map((b) => (r.byBranch?.[b.id]?.enabled || r.byBranch?.[b.id]?.qty ? qty(r.byBranch[b.id].qty) : '—')),
      qty(r.total),
      STATUS[r.status]?.label ?? r.status,
    ]),
    statusColumn: branches.length + 2,
  })
}
