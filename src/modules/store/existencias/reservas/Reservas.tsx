import React, { useMemo, useState } from 'react'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import Pagination from '../../../../components/general/pagination/Pagination'
import DateField from '../../../../components/general/date-field/DateField'
import StockPage from '../shared/stock-page/StockPage'
import StockFilters from '../shared/stock-filters/StockFilters'
import ExportButtons from '../shared/export-buttons/ExportButtons'
import { useDebounced, useStockReport } from '../shared/useStockReport'
import { dateShort, money, qty, readCompanyId } from '../shared/stockFormat'
import ReservationsTable from './reservations-table/ReservationsTable'
import ModalReservation from './modal-reservation/ModalReservation'
import { exportReservationsCsv, exportReservationsPdf } from './exportReservations'
import './Reservas.css'

const PAGE_SIZE = 25

/** Mercancía apartada: pedidos de venta activos con piezas por entregar, atrasos y faltantes de existencia. */
const Reservas: React.FC = () => {
  const can = useCan()
  const canView = can('store.existencias-reservas.view')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<number | null>(null)
  const term = useDebounced(search.trim())

  const query = useMemo(
    () => ({ companyId, branchId: branchId > 0 ? branchId : undefined, search: term, status: status || undefined, from: from || undefined, to: to || undefined }),
    [companyId, branchId, term, status, from, to],
  )
  const { data, loading, error, reload } = useStockReport<any>(
    () => APIs.getStockReservations({ ...query, page, pageSize: PAGE_SIZE }),
    JSON.stringify([query, page]),
    canView,
  )
  const s = data?.summary
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v)
    setPage(1)
  }
  const scopeText =
    [branchId > 0 ? 'Sucursal seleccionada' : 'Toda la empresa', from || to ? `Creados ${from ? `desde ${dateShort(from)}` : ''}${to ? ` hasta ${dateShort(to)}` : ''}` : '', term && `"${term}"`]
      .filter(Boolean)
      .join(' · ')

  return (
    <StockPage
      title='Reservas'
      subtitle='Mercancía apartada en pedidos de venta activos que falta entregar.'
      canView={canView}
      branchId={branchId}
      onBranchChange={reset(setBranchId)}
      onCompanyChange={reset(setCompanyId)}
    >
      <div className='cash-ui__kpis'>
        <div><small>Pedidos por entregar</small><strong>{s ? qty(s.orders) : '—'}</strong></div>
        <div className='is-over'><small>Piezas apartadas</small><strong>{s ? qty(s.pieces) : '—'}</strong><span>{s ? money(s.amount) : ''}</span></div>
        <div className='is-short'><small>Atrasados</small><strong>{s ? qty(s.overdue) : '—'}</strong><span>pasó la fecha de entrega</span></div>
        <div className='is-short'><small>Con faltante</small><strong>{s ? qty(s.shortage) : '—'}</strong><span>no alcanza la existencia</span></div>
      </div>

      <StockFilters
        search={search}
        onSearch={reset(setSearch)}
        placeholder='Buscar por cliente o folio'
        status={status}
        onStatus={reset(setStatus)}
        statuses={[
          { key: '', label: 'Todas' },
          { key: 'overdue', label: 'Atrasadas', count: s?.overdue },
          { key: 'shortage', label: 'Con faltante', count: s?.shortage },
          { key: 'on_time', label: 'A tiempo' },
        ]}
        actions={<ExportButtons disabled={!data?.rows?.length} onCsv={() => exportReservationsCsv(query)} onPdf={() => exportReservationsPdf(query, scopeText)} />}
      >
        <div className='cash-ui__dates reservas__dates'>
          <DateField className='inputs__general' value={from} onChange={(v) => reset(setFrom)(v || '')} placeholder='Creado desde' />
          <span aria-hidden>→</span>
          <DateField className='inputs__general' value={to} min={from || undefined} onChange={(v) => reset(setTo)(v || '')} placeholder='Hasta' />
          {from || to ? (
            <button type='button' className='reservas__clear' onClick={() => { setFrom(''); setTo(''); setPage(1) }} aria-label='Quitar fechas'>
              <span className='material-symbols-rounded'>close</span>
            </button>
          ) : null}
        </div>
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
          {Array.from({ length: 6 }, (_, i) => <span key={i} className='table-skeleton__shimmer' />)}
        </div>
      ) : data ? (
        <div className={`reservas__body ${loading ? 'is-loading' : ''}`}>
          <ReservationsTable rows={data.rows ?? []} onOpen={(r) => setDetail(r.id)} />
          {data.pagination?.total > PAGE_SIZE ? <Pagination total={data.pagination.total} page={page} pageSize={PAGE_SIZE} onPage={setPage} noun='pedidos' /> : null}
        </div>
      ) : null}

      {detail ? <ModalReservation orderId={detail} onClose={() => setDetail(null)} /> : null}
    </StockPage>
  )
}

export default Reservas
