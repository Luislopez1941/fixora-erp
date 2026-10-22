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
import StoreStockTable from './store-stock-table/StoreStockTable'
import ModalStoreItem from './modal-store-item/ModalStoreItem'
import ModalStockLevels from './modal-stock-levels/ModalStockLevels'
import { exportByStoreCsv, exportByStorePdf } from './exportByStore'
import './ExistenciasPorAlmacen.css'

const PAGE_SIZE = 25

/** Existencias de un almacén: mínimo / máximo, lotes por caducar y último movimiento de cada artículo. */
const ExistenciasPorAlmacen: React.FC = () => {
  const can = useCan()
  const canView = can('store.existencias-existencias-por-almacen.view')
  const canManage = can('store.existencias-existencias-por-almacen.manage')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const [storeId, setStoreId] = useState(0)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState(0)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<any | null>(null)
  const [levels, setLevels] = useState<any | null>(null)
  const term = useDebounced(search.trim())

  const query = useMemo(
    () => ({ companyId, branchId: branchId > 0 ? branchId : undefined, storeId: storeId || undefined, search: term, categoryId: categoryId || undefined, status: status || undefined }),
    [companyId, branchId, storeId, term, categoryId, status],
  )
  const { data, loading, error, reload } = useStockReport<any>(
    () => APIs.getStockByStore({ ...query, page, pageSize: PAGE_SIZE }),
    JSON.stringify([query, page]),
    canView,
  )
  const s = data?.summary
  const store = (data?.stores ?? []).find((x: any) => x.id === data?.storeId)
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v)
    setPage(1)
  }
  const exportQuery = { ...query, storeId: data?.storeId ?? undefined }
  const categoryName = (data?.categories ?? []).find((c: any) => c.id === categoryId)?.title
  const filterText = [store?.branchName, categoryName, term && `"${term}"`].filter(Boolean).join(' · ') || 'Todos los artículos'

  return (
    <StockPage
      title='Existencias por almacén'
      subtitle='Lo que hay en cada almacén contra su mínimo y máximo, con lotes y último movimiento.'
      canView={canView}
      branchId={branchId}
      onBranchChange={(id) => {
        setBranchId(id)
        setStoreId(0)
        setPage(1)
      }}
      onCompanyChange={(id) => {
        setCompanyId(id)
        setStoreId(0)
        setPage(1)
      }}
    >
      <div className='cash-ui__kpis'>
        <div><small>Artículos</small><strong>{s ? qty(s.items) : '—'}</strong></div>
        <div className='is-ok'><small>Unidades</small><strong>{s ? qty(s.units) : '—'}</strong></div>
        <div className='is-over'><small>Stock bajo</small><strong>{s ? qty(s.stockBajo) : '—'}</strong><span>{s ? `${qty(s.sobreMaximo)} sobre el máximo` : ''}</span></div>
        <div className='is-short'><small>Agotados</small><strong>{s ? qty(s.agotados) : '—'}</strong><span>{s ? `${qty(s.porCaducar)} con lotes por caducar` : ''}</span></div>
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
          { key: 'disponible', label: 'Disponibles' },
          { key: 'stock_bajo', label: 'Stock bajo', count: s?.stockBajo },
          { key: 'agotado', label: 'Agotados', count: s?.agotados },
          { key: 'sobre_maximo', label: 'Sobre máximo', count: s?.sobreMaximo },
          { key: 'por_caducar', label: 'Por caducar (30 días)', count: s?.porCaducar },
          { key: 'sin_rastreo', label: 'Sin rastreo' },
        ]}
        actions={
          <ExportButtons
            disabled={!data?.rows?.length}
            onCsv={() => exportByStoreCsv(exportQuery, store?.name ?? 'almacen')}
            onPdf={() => exportByStorePdf(exportQuery, store?.name ?? 'Almacén', filterText)}
          />
        }
      >
        <select
          className='inputs__general existencias-almacen__store'
          value={data?.storeId ?? storeId}
          onChange={(e) => {
            setStoreId(Number(e.target.value))
            setPage(1)
          }}
          aria-label='Almacén'
          disabled={!data?.stores?.length}
        >
          {(data?.stores ?? []).map((x: any) => (
            <option key={x.id} value={x.id}>{x.name}{x.predetermined ? ' (predeterminado)' : ''}{branchId > 0 ? '' : ` · ${x.branchName}`}</option>
          ))}
        </select>
      </StockFilters>

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
      ) : data && !data.stores?.length ? (
        <div className='cash-ui__state'>
          <span className='material-symbols-rounded' aria-hidden>warehouse</span>
          <p>Esta sucursal no tiene almacenes activos.</p>
        </div>
      ) : data ? (
        <div className={`existencias-almacen__body ${loading ? 'is-loading' : ''}`}>
          <StoreStockTable rows={data.rows ?? []} onOpen={setDetail} />
          {data.pagination?.total > PAGE_SIZE ? <Pagination total={data.pagination.total} page={page} pageSize={PAGE_SIZE} onPage={setPage} noun='artículos' /> : null}
        </div>
      ) : null}

      {detail && data?.storeId ? (
        <ModalStoreItem
          storeId={data.storeId}
          storeName={store?.name ?? ''}
          row={detail}
          canManage={canManage}
          onEditLevels={(item) => setLevels(item)}
          onClose={() => setDetail(null)}
        />
      ) : null}
      {levels ? (
        <ModalStockLevels
          item={levels}
          onClose={() => setLevels(null)}
          onSaved={() => {
            setLevels(null)
            setDetail(null)
            reload()
          }}
        />
      ) : null}
    </StockPage>
  )
}

export default ExistenciasPorAlmacen
