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
import BranchTotals from './branch-totals/BranchTotals'
import BranchMatrix from './branch-matrix/BranchMatrix'
import ModalItemStores from './modal-item-stores/ModalItemStores'
import { exportByBranchCsv, exportByBranchPdf } from './exportByBranch'
import './ExistenciasPorSucursal.css'

const PAGE_SIZE = 25

/** Existencias de cada artículo en todas las sucursales de la empresa (una columna por sucursal). */
const ExistenciasPorSucursal: React.FC = () => {
  const can = useCan()
  const canView = can('store.existencias-existencias-por-sucursal.view')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState(0)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<any | null>(null)
  const term = useDebounced(search.trim())

  const query = useMemo(() => ({ companyId, search: term, categoryId: categoryId || undefined, status: status || undefined }), [companyId, term, categoryId, status])
  const { data, loading, error, reload } = useStockReport<any>(
    () => APIs.getStockByBranch({ ...query, page, pageSize: PAGE_SIZE }),
    JSON.stringify([query, page]),
    canView,
  )
  const s = data?.summary
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v)
    setPage(1)
  }
  const categoryName = (data?.categories ?? []).find((c: any) => c.id === categoryId)?.title
  const filterText = [categoryName, term && `"${term}"`].filter(Boolean).join(' · ') || 'Todos los artículos'

  return (
    <StockPage
      title='Existencias por sucursal'
      subtitle='Cuánto hay de cada artículo en cada sucursal (suma de sus almacenes).'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      onCompanyChange={(id) => {
        setCompanyId(id)
        setPage(1)
      }}
      companyOnly
    >
      <div className='cash-ui__kpis'>
        <div><small>Artículos</small><strong>{s ? qty(s.items) : '—'}</strong></div>
        <div className='is-ok'><small>Unidades en existencia</small><strong>{s ? qty(s.units) : '—'}</strong></div>
        <div className='is-over'><small>Stock bajo</small><strong>{s ? qty(s.stockBajo) : '—'}</strong><span>debajo del mínimo</span></div>
        <div className='is-short'><small>Agotados</small><strong>{s ? qty(s.agotados) : '—'}</strong><span>{s ? `${qty(s.faltaEnSucursal)} faltan en alguna sucursal` : ''}</span></div>
      </div>

      {data?.branches?.length ? <BranchTotals branches={data.branches} /> : null}

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
          { key: 'disponible', label: 'Disponibles' },
          { key: 'stock_bajo', label: 'Stock bajo', count: s?.stockBajo },
          { key: 'agotado', label: 'Agotados', count: s?.agotados },
          { key: 'falta_en_sucursal', label: 'Falta en alguna sucursal', count: s?.faltaEnSucursal },
          { key: 'sin_rastreo', label: 'Sin rastreo' },
        ]}
        actions={<ExportButtons disabled={!data?.rows?.length} onCsv={() => exportByBranchCsv(query)} onPdf={() => exportByBranchPdf(query, filterText)} />}
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
        <div className={`existencias-sucursal__body ${loading ? 'is-loading' : ''}`}>
          <BranchMatrix rows={data.rows ?? []} branches={data.branches ?? []} onOpen={setDetail} />
          {data.pagination?.total > PAGE_SIZE ? <Pagination total={data.pagination.total} page={page} pageSize={PAGE_SIZE} onPage={setPage} noun='artículos' /> : null}
        </div>
      ) : null}

      {detail ? <ModalItemStores row={detail} companyId={companyId} onClose={() => setDetail(null)} /> : null}
    </StockPage>
  )
}

export default ExistenciasPorSucursal
