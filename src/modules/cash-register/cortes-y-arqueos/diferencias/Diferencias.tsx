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
import ModalCashCountDetail from '../arqueo/modal-cash-count-detail/ModalCashCountDetail'
import ModalCloseDetail from '../historial-de-cortes/modal-close-detail/ModalCloseDetail'
import DifferencesByDay from './differences-by-day/DifferencesByDay'
import DifferencesRanking from './differences-ranking/DifferencesRanking'
import '../../../../components/general/skeleton/TableSkeleton.css'
import '../../shared/CashShared.css'
import './Diferencias.css'

const PAGE_SIZE = 20
const TYPE_LABEL: Record<string, string> = { COUNT: 'Arqueo', CLOSE: 'Cierre' }

/** Diferencias de caja: sobrantes y faltantes de arqueos y cierres de turno, con indicadores, gráfica por día y rankings. */
const Diferencias: React.FC = () => {
  const can = useCan()
  const canView = can('cash-register.cortes-y-arqueos-diferencias.view')
  const userState = useSelector((state: any) => state.user)

  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [range, setRange] = useState<[string, string]>(() => RANGES[2].get())
  const [rangeKey, setRangeKey] = useState('month')
  const [type, setType] = useState('')
  const [result, setResult] = useState('')
  const [page, setPage] = useState(1)
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<{ type: string; id: number } | null>(null)
  const reqRef = useRef(0)
  const resolvedCompanyId = companyId ?? readCompanyId() ?? userState?.activeCompanyId ?? userState?.companyId ?? userState?.companyIds?.[0] ?? null

  useEffect(() => setPage(1), [range, type, result, branchId, companyId])

  const params = useCallback(
    (p: number, pageSize: number) => ({
      companyId: resolvedCompanyId ?? undefined,
      branchId: branchId > 0 ? branchId : undefined,
      from: range[0],
      to: range[1],
      type: type || undefined,
      result: result || undefined,
      page: p,
      pageSize,
    }),
    [resolvedCompanyId, branchId, range, type, result],
  )

  const load = useCallback(async () => {
    if (!resolvedCompanyId || !canView) return
    const id = ++reqRef.current
    setLoading(true)
    setError('')
    try {
      const res: any = await APIs.getCashDifferences(params(page, PAGE_SIZE))
      if (id !== reqRef.current) return
      setReport(res ?? null)
    } catch (e) {
      if (id !== reqRef.current) return
      setReport(null)
      setError(errorText(e, 'No se pudieron cargar las diferencias.'))
    } finally {
      if (id === reqRef.current) setLoading(false)
    }
  }, [resolvedCompanyId, canView, page, params])

  useEffect(() => {
    load()
  }, [load])

  const exportCsv = async () => {
    try {
      const res: any = await APIs.getCashDifferences(params(1, 1000))
      downloadCsv(
        `diferencias-caja_${range[0]}_${range[1]}.csv`,
        ['Fecha', 'Tipo', 'Folio', 'Turno', 'Sucursal', 'Caja', 'Cajero', 'Esperado', 'Contado', 'Diferencia', 'Tolerancia', 'Resultado', 'Observaciones'],
        (res?.data ?? []).map((r: any) => [dateTime(r.at), TYPE_LABEL[r.type] ?? r.type, r.refId, r.shiftId, r.branchName, r.registerName ?? '', r.userName ?? '', r.expected, r.counted, r.difference, r.tolerance, RESULT_LABEL[resultOf(r)], r.notes ?? '']),
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
          <p>No tienes permiso para ver las diferencias de caja.</p>
        </div>
      </div>
    )
  }

  const s = report?.summary ?? {}
  const rows: any[] = report?.data ?? []
  const total = report?.pagination?.total ?? 0

  return (
    <div className='cash-ui'>
      <div className='cash-ui__container'>
        <div className='cash-ui__header'>
          <div className='cash-ui__title'>
            <h1>Diferencias de caja</h1>
            <p>Sobrantes y faltantes de los arqueos y de los cierres de turno.</p>
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
          <select className='inputs__general cash-ui__select' value={type} onChange={(e) => setType(e.target.value)} aria-label='Tipo'>
            <option value=''>Arqueos y cierres</option>
            <option value='COUNT'>Solo arqueos</option>
            <option value='CLOSE'>Solo cierres</option>
          </select>
          <select className='inputs__general cash-ui__select' value={result} onChange={(e) => setResult(e.target.value)} aria-label='Resultado'>
            <option value=''>Todos los resultados</option>
            <option value='OUT'>Fuera de tolerancia</option>
            <option value='SHORT'>Faltantes</option>
            <option value='OVER'>Sobrantes</option>
            <option value='BALANCED'>Cuadran</option>
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
          <div className='is-short'><small>Total faltante</small><strong>{money(s.totalShort)}</strong></div>
          <div className='is-over'><small>Total sobrante</small><strong>{money(s.totalOver)}</strong></div>
          <div className={(s.net ?? 0) < 0 ? 'is-short' : (s.net ?? 0) > 0 ? 'is-over' : 'is-ok'}><small>Neto</small><strong>{money(s.net)}</strong></div>
          <div><small>Con diferencia</small><strong>{s.withDifference ?? 0}</strong><span>de {s.events ?? 0} eventos</span></div>
          <div className='is-warn'><small>Fuera de tolerancia</small><strong>{s.outOfTolerancePct ?? 0}%</strong><span>{s.outOfTolerance ?? 0} evento(s)</span></div>
        </div>

        <div className='diferencias__grid'>
          <section className='cash-ui__card diferencias__chart'>
            <h2>Diferencia por día</h2>
            {loading ? <span className='table-skeleton__shimmer cash-ui__skel' /> : <DifferencesByDay rows={report?.byDay ?? []} />}
          </section>
          <section className='cash-ui__card'>
            <h2>Por cajero</h2>
            {loading ? <span className='table-skeleton__shimmer cash-ui__skel' /> : <DifferencesRanking rows={report?.byUser ?? []} empty='Ningún cajero con diferencias.' />}
          </section>
          <section className='cash-ui__card'>
            <h2>Por caja</h2>
            {loading ? <span className='table-skeleton__shimmer cash-ui__skel' /> : <DifferencesRanking rows={report?.byRegister ?? []} empty='Ninguna caja con diferencias.' />}
          </section>
        </div>

        <div className='cash-ui__list'>
          <div className='cash-ui__row cash-ui__row--head diferencias__row'>
            <span>Fecha</span><span>Tipo</span><span>Caja</span><span>Cajero</span><span className='is-num'>Esperado</span><span className='is-num'>Contado</span><span className='is-num'>Diferencia</span><span>Resultado</span>
          </div>
          {loading ? (
            <TableSkeleton rowClassName='cash-ui__row diferencias__row' cols={[{ width: '80%' }, { pill: true, width: '60px' }, { width: '70%' }, { width: '60%' }, { width: '60%' }, { width: '60%' }, { width: '60%' }, { pill: true, width: '70px' }]} />
          ) : rows.length ? (
            rows.map((r) => {
              const res = resultOf(r)
              return (
                <button type='button' className='cash-ui__row diferencias__row' key={`${r.type}-${r.refId}`} onClick={() => setOpen({ type: r.type, id: r.refId })}>
                  <span data-label='Fecha'>{dateTime(r.at)}<small>Turno #{r.shiftId}</small></span>
                  <span data-label='Tipo'><em className='cash-ui__badge cash-ui__badge--info'>{TYPE_LABEL[r.type] ?? r.type}</em></span>
                  <span data-label='Caja'>{r.registerName ?? '—'}<small>{r.branchName}</small></span>
                  <span data-label='Cajero'>{r.userName || '—'}</span>
                  <span data-label='Esperado' className='is-num'>{money(r.expected)}</span>
                  <span data-label='Contado' className='is-num'>{money(r.counted)}</span>
                  <span data-label='Diferencia' className={`is-num cash-ui__diff--${res.toLowerCase()}`}>{money(r.difference)}</span>
                  <span data-label='Resultado'><em className={`cash-ui__badge cash-ui__badge--${res.toLowerCase()}`}>{RESULT_LABEL[res]}</em></span>
                </button>
              )
            })
          ) : (
            <div className='cash-ui__state'>
              <span className='material-symbols-rounded' aria-hidden>verified</span>
              <p>No hay diferencias con este filtro.</p>
            </div>
          )}
        </div>
        {total > PAGE_SIZE && <Pagination total={total} page={page} pageSize={PAGE_SIZE} onPage={setPage} noun='eventos' />}
      </div>

      {open?.type === 'COUNT' ? <ModalCashCountDetail id={open.id} onClose={() => setOpen(null)} onChanged={load} /> : null}
      {open?.type === 'CLOSE' ? <ModalCloseDetail shiftId={open.id} from='differences' onClose={() => setOpen(null)} /> : null}
    </div>
  )
}

export default Diferencias
