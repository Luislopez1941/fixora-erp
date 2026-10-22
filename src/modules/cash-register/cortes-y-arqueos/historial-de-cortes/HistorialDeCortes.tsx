import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import CategoriesStorePicker from '../../../../components/sidebar/sections/catalogos/categories/CategoriesStorePicker'
import DateField from '../../../../components/general/date-field/DateField'
import TableSkeleton from '../../../../components/general/skeleton/TableSkeleton'
import Pagination from '../../../../components/general/pagination/Pagination'
import { showToast } from '../../../../utils/toast'
import { RANGES, RESULT_LABEL, dateTime, downloadCsv, errorText, money, readCompanyId, resultOf } from '../../shared/cashFormat'
import ModalCloseDetail from './modal-close-detail/ModalCloseDetail'
import '../../../../components/general/skeleton/TableSkeleton.css'
import '../../shared/CashShared.css'
import './HistorialDeCortes.css'

const PAGE_SIZE = 20

/** Historial de cortes: turnos cerrados con ventas por forma de pago, esperado, contado y diferencia; detalle y PDF del corte. */
const HistorialDeCortes: React.FC = () => {
  const can = useCan()
  const canView = can('cash-register.cortes-y-arqueos-historial-de-cortes.view')
  const userState = useSelector((state: any) => state.user)

  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [range, setRange] = useState<[string, string]>(() => RANGES[2].get())
  const [rangeKey, setRangeKey] = useState('month')
  const [resultFilter, setResultFilter] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detailId, setDetailId] = useState<number | null>(null)
  const reqRef = useRef(0)
  const resolvedCompanyId = companyId ?? readCompanyId() ?? userState?.activeCompanyId ?? userState?.companyId ?? userState?.companyIds?.[0] ?? null

  useEffect(() => setPage(1), [range, resultFilter, branchId, companyId])

  const params = useCallback(
    (p: number, pageSize: number) => ({
      companyId: resolvedCompanyId ?? undefined,
      branchId: branchId > 0 ? branchId : undefined,
      from: range[0],
      to: range[1],
      result: resultFilter || undefined,
      page: p,
      pageSize,
    }),
    [resolvedCompanyId, branchId, range, resultFilter],
  )

  const load = useCallback(async () => {
    if (!resolvedCompanyId || !canView) return
    const id = ++reqRef.current
    setLoading(true)
    setError('')
    try {
      const res: any = await APIs.getCashCloses(params(page, PAGE_SIZE))
      if (id !== reqRef.current) return
      setRows(res?.data ?? [])
      setSummary(res?.summary ?? {})
      setTotal(res?.pagination?.total ?? 0)
    } catch (e) {
      if (id !== reqRef.current) return
      setRows([])
      setTotal(0)
      setError(errorText(e, 'No se pudo cargar el historial de cortes.'))
    } finally {
      if (id === reqRef.current) setLoading(false)
    }
  }, [resolvedCompanyId, canView, page, params])

  useEffect(() => {
    load()
  }, [load])

  const exportCsv = async () => {
    try {
      const res: any = await APIs.getCashCloses(params(1, 1000))
      downloadCsv(
        `cortes_${range[0]}_${range[1]}.csv`,
        ['Turno', 'Sucursal', 'Caja', 'Cajero', 'Apertura', 'Cierre', 'Fondo inicial', 'Ventas efectivo', 'Otras formas de pago', 'Esperado', 'Contado', 'Diferencia', 'Resultado', 'Autorizó', 'Observaciones'],
        (res?.data ?? []).map((r: any) => [
          r.id, r.branchName, r.registerName ?? '', r.userName ?? '', dateTime(r.openedAt), dateTime(r.closedAt), r.openingAmount, r.cashSales, r.otherSales,
          r.expected ?? '', r.counted ?? '', r.difference ?? '', r.difference != null ? RESULT_LABEL[resultOf(r)] : '', r.approvedByName ?? '', r.closeNotes ?? '',
        ]),
      )
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo exportar', text: errorText(e, 'Intenta de nuevo.') })
    }
  }

  if (!canView) {
    return (
      <div className='cash-ui'>
        <div className='cash-ui__state'>
          <span className='material-symbols-rounded' aria-hidden>lock</span>
          <p>No tienes permiso para ver el historial de cortes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='cash-ui'>
      <div className='cash-ui__container'>
        <div className='cash-ui__header'>
          <div className='cash-ui__title'>
            <h1>Historial de cortes</h1>
            <p>Turnos cerrados: lo que se vendió, lo que se esperaba en caja y lo que se contó.</p>
          </div>
          <CategoriesStorePicker
            branchId={branchId}
            onCompanyIdChange={(id) => {
              setCompanyId(id)
              localStorage.setItem('categories-picker-company-id', String(id))
            }}
            onBranchIdChange={(id) => {
              setBranchId(id)
              localStorage.setItem('categories-store-id', String(id))
              localStorage.setItem('categories-picker-branch-id', String(id))
            }}
          />
        </div>

        <div className='cash-ui__filters'>
          <div className='cash-ui__ranges' role='group' aria-label='Periodo'>
            {RANGES.map((r) => (
              <button key={r.key} type='button' className={`cash-ui__chip ${rangeKey === r.key ? 'is-active' : ''}`} onClick={() => { setRange(r.get()); setRangeKey(r.key) }}>
                {r.label}
              </button>
            ))}
          </div>
          <div className='cash-ui__dates'>
            <DateField className='inputs__general' value={range[0]} onChange={(v) => { if (v) { setRange([v, range[1] < v ? v : range[1]]); setRangeKey('') } }} placeholder='Desde' />
            <span aria-hidden>→</span>
            <DateField className='inputs__general' value={range[1]} min={range[0]} onChange={(v) => { if (v) { setRange([range[0], v]); setRangeKey('') } }} placeholder='Hasta' />
          </div>
          <select className='inputs__general cash-ui__select' value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} aria-label='Resultado'>
            <option value=''>Todos los cortes</option>
            <option value='BALANCED'>Cuadran</option>
            <option value='OVER'>Con sobrante</option>
            <option value='SHORT'>Con faltante</option>
            <option value='OUT'>Fuera de tolerancia</option>
          </select>
          <div className='cash-ui__actions'>
            <button type='button' className='btn__general-purple' onClick={exportCsv} disabled={total === 0}>
              <span className='material-symbols-rounded'>download</span> CSV
            </button>
          </div>
        </div>

        {error ? (
          <div className='cash-ui__error' role='alert'>
            <span className='material-symbols-rounded' aria-hidden>error</span>
            <span>{error}</span>
            <button type='button' onClick={load} aria-label='Reintentar'>
              <span className='material-symbols-rounded'>refresh</span>
            </button>
          </div>
        ) : null}

        <div className='cash-ui__kpis'>
          <div><small>Cortes</small><strong>{summary.closes ?? 0}</strong></div>
          <div className='is-ok'><small>Ventas en efectivo</small><strong>{money(summary.cashSales)}</strong></div>
          <div><small>Otras formas de pago</small><strong>{money(summary.otherSales)}</strong></div>
          <div className={(summary.netDifference ?? 0) < 0 ? 'is-short' : (summary.netDifference ?? 0) > 0 ? 'is-over' : ''}><small>Diferencia neta</small><strong>{money(summary.netDifference)}</strong></div>
          <div className='is-warn'><small>Fuera de tolerancia</small><strong>{summary.outOfTolerance ?? 0}</strong></div>
        </div>

        <div className='cash-ui__list'>
          <div className='cash-ui__row cash-ui__row--head closes__row'>
            <span>Turno / caja</span><span>Cajero</span><span>Apertura · cierre</span><span className='is-num'>Fondo</span><span className='is-num'>Efectivo</span><span className='is-num'>Otras</span><span className='is-num'>Esperado</span><span className='is-num'>Contado</span><span className='is-num'>Diferencia</span>
          </div>
          {loading ? (
            <TableSkeleton rowClassName='cash-ui__row closes__row' cols={[{ width: '70%' }, { width: '60%' }, { width: '80%' }, { width: '60%' }, { width: '60%' }, { width: '60%' }, { width: '60%' }, { width: '60%' }, { pill: true, width: '70px' }]} />
          ) : rows.length ? (
            rows.map((r) => {
              const res = r.difference != null ? resultOf(r) : null
              return (
                <button type='button' className='cash-ui__row closes__row' key={r.id} onClick={() => setDetailId(r.id)}>
                  <span data-label='Turno / caja'>#{r.id} · {r.registerName ?? 'Sin caja'}<small>{r.branchName}</small></span>
                  <span data-label='Cajero'>{r.userName || '—'}</span>
                  <span data-label='Apertura · cierre'>{dateTime(r.openedAt)}<small>{dateTime(r.closedAt)}</small></span>
                  <span data-label='Fondo' className='is-num'>{money(r.openingAmount)}</span>
                  <span data-label='Efectivo' className='is-num'>{money(r.cashSales)}</span>
                  <span data-label='Otras' className='is-num'>{money(r.otherSales)}</span>
                  <span data-label='Esperado' className='is-num'>{r.expected != null ? money(r.expected) : '—'}</span>
                  <span data-label='Contado' className='is-num'>{r.counted != null ? money(r.counted) : '—'}</span>
                  <span data-label='Diferencia' className={`is-num ${res ? `cash-ui__diff--${res.toLowerCase()}` : ''}`}>
                    {r.difference != null ? money(r.difference) : '—'}
                    {res ? <small>{RESULT_LABEL[res]}</small> : null}
                  </span>
                </button>
              )
            })
          ) : (
            <div className='cash-ui__state'>
              <span className='material-symbols-rounded' aria-hidden>receipt_long</span>
              <p>No hay cortes en este periodo.</p>
            </div>
          )}
        </div>
        {total > PAGE_SIZE && <Pagination total={total} page={page} pageSize={PAGE_SIZE} onPage={setPage} noun='cortes' />}
      </div>

      {detailId ? <ModalCloseDetail shiftId={detailId} onClose={() => setDetailId(null)} /> : null}
    </div>
  )
}

export default HistorialDeCortes
