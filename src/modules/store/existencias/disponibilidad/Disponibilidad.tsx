import React, { useMemo, useState } from 'react'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import Pagination from '../../../../components/general/pagination/Pagination'
import StockPage from '../shared/stock-page/StockPage'
import StockFilters from '../shared/stock-filters/StockFilters'
import ExportButtons from '../shared/export-buttons/ExportButtons'
import { useDebounced, useStockReport } from '../shared/useStockReport'
import { qty, readCompanyId } from '../shared/stockFormat'
import AvailabilityTable from './availability-table/AvailabilityTable'
import ModalAvailabilityItem from './modal-availability-item/ModalAvailabilityItem'
import { exportAvailabilityCsv, exportAvailabilityPdf } from './exportAvailability'
import './Disponibilidad.css'

const PAGE_SIZE = 25

/** Disponible para vender = existencia − lo comprometido en pedidos de venta activos (pendiente de entregar). */
const Disponibilidad: React.FC = () => {
  const can = useCan()
  const canView = can('store.existencias-disponibilidad.view')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState(0)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<any | null>(null)
  const term = useDebounced(search.trim())

  const query = useMemo(
    () => ({ companyId, branchId: branchId > 0 ? branchId : undefined, search: term, categoryId: categoryId || undefined, status: status || undefined }),
    [companyId, branchId, term, categoryId, status],
  )
  const { data, loading, error, reload } = useStockReport<any>(
    () => APIs.getStockAvailability({ ...query, page, pageSize: PAGE_SIZE }),
    JSON.stringify([query, page]),
    canView,
  )
  const s = data?.summary
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v)
    setPage(1)
  }
  const categoryName = (data?.categories ?? []).find((c: any) => c.id === categoryId)?.title
  const scopeText = [branchId > 0 ? 'Sucursal seleccionada' : 'Toda la empresa', categoryName, term && `"${term}"`].filter(Boolean).join(' · ')

  return (
    <StockPage
      title='Disponibilidad'
      subtitle='Lo que de verdad se puede vender: existencia menos lo apartado en pedidos de venta por entregar.'
      canView={canView}
      branchId={branchId}
      onBranchChange={reset(setBranchId)}
      onCompanyChange={reset(setCompanyId)}
    >
      <div className='cash-ui__kpis'>
        <div><small>Existencia</small><strong>{s ? qty(s.onHand) : '—'}</strong><span>unidades</span></div>
        <div className='is-over'><small>Comprometido</small><strong>{s ? qty(s.committed) : '—'}</strong><span>{s ? `en ${qty(s.committedItems)} artículos` : ''}</span></div>
        <div className='is-ok'><small>Disponible</small><strong>{s ? qty(s.available) : '—'}</strong><span>para vender</span></div>
        <div className='is-short'><small>Faltantes</small><strong>{s ? qty(s.faltantes) : '—'}</strong><span>{s ? `${qty(s.shortUnits)} unidades no alcanzan` : ''}</span></div>
      </div>

      <StockFilters
        search={search}
        onSearch={reset(setSearch)}
        categories={data?.categories ?? []}
        categoryId={categoryId}
        onCategory={reset(setCategoryId)}
        status={status}
        onStatus={reset(setStatus)}
        statuses={[
          { key: '', label: 'Todos' },
          { key: 'comprometido', label: 'Con pedidos', count: s?.committedItems },
          { key: 'faltante', label: 'Faltantes', count: s?.faltantes },
          { key: 'agotado', label: 'Agotados' },
          { key: 'stock_bajo', label: 'Stock bajo' },
          { key: 'disponible', label: 'Disponibles' },
          { key: 'sin_rastreo', label: 'Sin rastreo' },
        ]}
        actions={<ExportButtons disabled={!data?.rows?.length} onCsv={() => exportAvailabilityCsv(query)} onPdf={() => exportAvailabilityPdf(query, scopeText)} />}
      />

      {error ? (
        <div className='cash-ui__error' role='alert'>
          <span className='material-symbols-rounded' aria-hidden>error</span>
          <span>{error}</span>
          <button type='button' onClick={reload} aria-label='Reintentar'>
            <span className='material-symbols-rounded'>refresh</span>
          </button>
        </div>
      ) : null}

      {loading && !data ? (
        <div className='stock-page__table-skeleton'>
          {Array.from({ length: 8 }, (_, i) => <span key={i} className='table-skeleton__shimmer' />)}
        </div>
      ) : data ? (
        <div className={`disponibilidad__body ${loading ? 'is-loading' : ''}`}>
          <AvailabilityTable rows={data.rows ?? []} onOpen={setDetail} />
          {data.pagination?.total > PAGE_SIZE ? <Pagination total={data.pagination.total} page={page} pageSize={PAGE_SIZE} onPage={setPage} noun='artículos' /> : null}
        </div>
      ) : null}

      {detail ? <ModalAvailabilityItem row={detail} companyId={companyId} branchId={branchId > 0 ? branchId : undefined} onClose={() => setDetail(null)} /> : null}
    </StockPage>
  )
}

export default Disponibilidad
