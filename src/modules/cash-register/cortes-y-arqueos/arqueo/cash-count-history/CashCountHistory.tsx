import React, { useCallback, useEffect, useRef, useState } from 'react'
import APIs from '../../../../../services/APIs'
import DateField from '../../../../../components/general/date-field/DateField'
import TableSkeleton from '../../../../../components/general/skeleton/TableSkeleton'
import Pagination from '../../../../../components/general/pagination/Pagination'
import { showToast } from '../../../../../utils/toast'
import { RANGES, RESULT_LABEL, dateTime, downloadCsv, errorText, money, resultOf } from '../../../shared/cashFormat'
import './CashCountHistory.css'

const PAGE_SIZE = 20

interface Props {
  companyId: number | null
  branchId: number
  /** Cambia cuando se guarda o cancela un arqueo (vuelve a pedir la lista) */
  refreshKey: number
  onOpen: (id: number) => void
}

/** Historial de arqueos: filtros por fecha y resultado, indicadores del periodo, lista (tarjetas en celular) y CSV. */
const CashCountHistory: React.FC<Props> = ({ companyId, branchId, refreshKey, onOpen }) => {
  const [range, setRange] = useState<[string, string]>(() => RANGES[2].get())
  const [rangeKey, setRangeKey] = useState('month')
  const [resultFilter, setResultFilter] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const reqRef = useRef(0)

  useEffect(() => setPage(1), [range, resultFilter, branchId, companyId])

  const params = useCallback(
    (p: number, pageSize: number) => ({
      companyId: companyId ?? undefined,
      branchId: branchId > 0 ? branchId : undefined,
      from: range[0],
      to: range[1],
      result: resultFilter || undefined,
      page: p,
      pageSize,
    }),
    [companyId, branchId, range, resultFilter],
  )

  const load = useCallback(async () => {
    if (!companyId) return
    const id = ++reqRef.current
    setLoading(true)
    setError('')
    try {
      const res: any = await APIs.getCashCounts(params(page, PAGE_SIZE))
      if (id !== reqRef.current) return
      setRows(res?.data ?? [])
      setSummary(res?.summary ?? {})
      setTotal(res?.pagination?.total ?? 0)
    } catch (e) {
      if (id !== reqRef.current) return
      setRows([])
      setTotal(0)
      setError(errorText(e, 'No se pudo cargar el historial de arqueos.'))
    } finally {
      if (id === reqRef.current) setLoading(false)
    }
  }, [companyId, page, params])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const exportCsv = async () => {
    try {
      const res: any = await APIs.getCashCounts(params(1, 500))
      const list: any[] = res?.data ?? []
      downloadCsv(
        `arqueos_${range[0]}_${range[1]}.csv`,
        ['Arqueo', 'Fecha', 'Sucursal', 'Caja', 'Turno', 'Contó', 'Esperado', 'Contado', 'Diferencia', 'Resultado', 'Observaciones'],
        list.map((r) => [r.id, dateTime(r.createdAt), r.branchName, r.registerName ?? '', r.shiftId, r.userName ?? '', r.expectedAmount, r.countedAmount, r.difference, RESULT_LABEL[resultOf(r)], r.notes ?? '']),
      )
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo exportar', text: errorText(e, 'Intenta de nuevo.') })
    }
  }

  return (
    <>
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
          <option value=''>Todos los resultados</option>
          <option value='BALANCED'>Cuadra</option>
          <option value='OVER'>Sobrante</option>
          <option value='SHORT'>Faltante</option>
          <option value='CANCELLED'>Cancelados</option>
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
        <div><small>Arqueos</small><strong>{summary.total ?? 0}</strong></div>
        <div className='is-ok'><small>Cuadran</small><strong>{summary.balanced ?? 0}</strong></div>
        <div className='is-over'><small>Sobrantes</small><strong>{summary.over ?? 0}</strong><span>{money(summary.overAmount)}</span></div>
        <div className='is-short'><small>Faltantes</small><strong>{summary.short ?? 0}</strong><span>{money(summary.shortAmount)}</span></div>
        <div><small>Cancelados</small><strong>{summary.cancelled ?? 0}</strong></div>
      </div>

      <div className='cash-ui__list'>
        <div className='cash-ui__row cash-ui__row--head cash-count-history__row'>
          <span>Fecha</span><span>Caja</span><span>Contó</span><span className='is-num'>Esperado</span><span className='is-num'>Contado</span><span className='is-num'>Diferencia</span><span>Resultado</span>
        </div>
        {loading ? (
          <TableSkeleton rowClassName='cash-ui__row cash-count-history__row' cols={[{ width: '80%' }, { width: '70%' }, { width: '60%' }, { width: '60%' }, { width: '60%' }, { width: '60%' }, { pill: true, width: '70px' }]} />
        ) : rows.length ? (
          rows.map((r) => {
            const res = resultOf(r)
            return (
              <button type='button' className='cash-ui__row cash-count-history__row' key={r.id} onClick={() => onOpen(r.id)}>
                <span data-label='Fecha'>{dateTime(r.createdAt)}<small>#{r.id} · Turno #{r.shiftId}</small></span>
                <span data-label='Caja'>{r.registerName ?? '—'}<small>{r.branchName}</small></span>
                <span data-label='Contó'>{r.userName || '—'}</span>
                <span data-label='Esperado' className='is-num'>{money(r.expectedAmount)}</span>
                <span data-label='Contado' className='is-num'>{money(r.countedAmount)}</span>
                <span data-label='Diferencia' className={`is-num cash-ui__diff--${res.toLowerCase()}`}>{money(r.difference)}</span>
                <span data-label='Resultado'><em className={`cash-ui__badge cash-ui__badge--${res.toLowerCase()}`}>{RESULT_LABEL[res]}</em></span>
              </button>
            )
          })
        ) : (
          <div className='cash-ui__state'>
            <span className='material-symbols-rounded' aria-hidden>receipt_long</span>
            <p>No hay arqueos en este periodo.</p>
          </div>
        )}
      </div>
      {total > PAGE_SIZE && <Pagination total={total} page={page} pageSize={PAGE_SIZE} onPage={setPage} noun='arqueos' />}
    </>
  )
}

export default CashCountHistory
