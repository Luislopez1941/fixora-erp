import APIs from '../../../../services/APIs'
import { STATUS, dateShort, downloadCsv, fetchAllRows, qty } from '../shared/stockFormat'
import { downloadStockPdf } from '../shared/stockPdf'

export interface ByStoreQuery {
  companyId: number | null
  branchId?: number
  storeId?: number
  search?: string
  categoryId?: number
  status?: string
}

const load = (q: ByStoreQuery) => fetchAllRows((page) => APIs.getStockByStore({ ...q, page, pageSize: 100 }))
const stamp = () => new Date().toISOString().slice(0, 10)
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()

export async function exportByStoreCsv(q: ByStoreQuery, storeName: string) {
  const { rows } = await load(q)
  downloadCsv(
    `existencias-${slug(storeName)}-${stamp()}.csv`,
    ['Código', 'Artículo', 'Categoría', 'Existencia', 'Mínimo', 'Máximo', 'Lotes', 'Próxima caducidad', 'Último movimiento', 'Estado'],
    rows.map((r: any) => [r.code ?? '', r.name, r.category ?? '', r.qty, r.min ?? '', r.max ?? '', r.lots || '', r.nextExpiry ?? '', r.lastMove ? r.lastMove.slice(0, 10) : '', STATUS[r.status]?.label ?? r.status]),
  )
}

export async function exportByStorePdf(q: ByStoreQuery, storeName: string, filterText: string) {
  const { rows, data } = await load(q)
  const s = data.summary ?? {}
  await downloadStockPdf({
    fileName: `existencias-${slug(storeName)}-${stamp()}.pdf`,
    title: `Existencias · ${storeName}`,
    subtitle: filterText,
    kpis: [
      { label: 'Artículos', value: qty(s.items) },
      { label: 'Unidades', value: qty(s.units) },
      { label: 'Stock bajo', value: qty(s.stockBajo) },
      { label: 'Agotados', value: qty(s.agotados) },
      { label: 'Por caducar (30 d)', value: qty(s.porCaducar) },
    ],
    columns: [
      { header: 'Artículo', width: '*' },
      { header: 'Existencia', width: 'auto', align: 'right' },
      { header: 'Mín.', width: 'auto', align: 'right' },
      { header: 'Máx.', width: 'auto', align: 'right' },
      { header: 'Próx. caducidad', width: 'auto' },
      { header: 'Estado', width: 'auto' },
    ],
    rows: rows.map((r: any) => [
      `${r.name}${r.code ? ` (${r.code})` : ''}`,
      r.track ? qty(r.qty) : '—',
      qty(r.min),
      r.max != null ? qty(r.max) : '—',
      r.nextExpiry ? dateShort(r.nextExpiry) : '',
      STATUS[r.status]?.label ?? r.status,
    ]),
    statusColumn: 5,
  })
}
