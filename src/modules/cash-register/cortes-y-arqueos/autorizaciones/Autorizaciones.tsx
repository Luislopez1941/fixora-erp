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
import { RANGES, dateTime, downloadCsv, errorText, money, readCompanyId } from '../../shared/cashFormat'
import ModalCashCountDetail from '../arqueo/modal-cash-count-detail/ModalCashCountDetail'
import ModalCloseDetail from '../historial-de-cortes/modal-close-detail/ModalCloseDetail'
import ModalResolveAuthorization from './modal-resolve-authorization/ModalResolveAuthorization'
import { STATUS_BADGE, STATUS_LABEL, TYPE_LABEL } from './authorizationLabels'
import '../../../../components/general/skeleton/TableSkeleton.css'
import '../../shared/CashShared.css'
import './Autorizaciones.css'

const PAGE_SIZE = 20
const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'PENDING', label: 'Pendientes' },
  { key: 'AUTHORIZED', label: 'Autorizadas' },
  { key: 'REJECTED', label: 'Rechazadas' },
  { key: '', label: 'Todas' },
]

/** Autorizaciones de caja: bandeja de lo que necesita (o ya tuvo) la autorización de un supervisor. */
const Autorizaciones: React.FC = () => {
  const can = useCan()
  const canView = can('cash-register.cortes-y-arqueos-autorizaciones.view')
  const userState = useSelector((state: any) => state.user)

  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [range, setRange] = useState<[string, string]>(() => RANGES[2].get())
  const [rangeKey, setRangeKey] = useState('month')
  const [status, setStatus] = useState('PENDING')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [source, setSource] = useState<{ type: string; id: number } | null>(null)
  const reqRef = useRef(0)
  const resolvedCompanyId = companyId ?? readCompanyId() ?? userState?.activeCompanyId ?? userState?.companyId ?? userState?.companyIds?.[0] ?? null

  useEffect(() => setPage(1), [range, status, type, branchId, companyId])

  const params = useCallback(
    (p: number, pageSize: number) => ({
      companyId: resolvedCompanyId ?? undefined,
      branchId: branchId > 0 ? branchId : undefined,
      from: range[0],
      to: range[1],
      status: status || undefined,
      type: type || undefined,
      page: p,
      pageSize,
    }),
    [resolvedCompanyId, branchId, range, status, type],
  )

  const load = useCallback(async () => {
    if (!resolvedCompanyId || !canView) return
    const id = ++reqRef.current
    setLoading(true)
    setError('')
    try {
      const res: any = await APIs.getCashAuthorizations(params(page, PAGE_SIZE))
      if (id !== reqRef.current) return
      setReport(res ?? null)
    } catch (e) {
      if (id !== reqRef.current) return
      setReport(null)
      setError(errorText(e, 'No se pudieron cargar las autorizaciones.'))
    } finally {
      if (id === reqRef.current) setLoading(false)
    }
  }, [resolvedCompanyId, canView, page, params])

  useEffect(() => {
    load()
  }, [load])

  const exportCsv = async () => {
    try {
      const res: any = await APIs.getCashAuthorizations(params(1, 1000))
      downloadCsv(
        `autorizaciones-caja_${range[0]}_${range[1]}.csv`,
        ['Fecha', 'Tipo', 'Folio', 'Turno', 'Sucursal', 'Caja', 'Solicitante', 'Diferencia / importe', 'Estado', 'Resolvió', 'Resuelto', 'Comentario'],
        (res?.data ?? []).map((r: any) => [dateTime(r.at), TYPE_LABEL[r.type] ?? r.type, r.refId, r.shiftId ?? '', r.branchName, r.registerName ?? '', r.requesterName ?? '', r.amount, STATUS_LABEL[r.status] ?? r.status, r.supervisorName ?? '', dateTime(r.resolvedAt), r.comment ?? '']),
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
          <p>No tienes permiso para ver las autorizaciones de caja.</p>
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
            <h1>Autorizaciones de caja</h1>
            <p>Diferencias fuera de tolerancia por autorizar y lo que ya pasó por un supervisor.</p>
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

        <div className='autorizaciones__tabs' role='tablist'>
          {STATUS_TABS.map((t) => (
            <button key={t.key || 'all'} type='button' role='tab' aria-selected={status === t.key} className={status === t.key ? 'is-active' : ''} onClick={() => setStatus(t.key)}>
              {t.label}
              {t.key === 'PENDING' && s.pending ? <span className='autorizaciones__count'>{s.pending}</span> : null}
            </button>
          ))}
        </div>

        <div className='cash-ui__filters'>
          {status !== 'PENDING' ? (
            <>
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
            </>
          ) : (
            <p className='autorizaciones__hint'>Las pendientes se muestran sin importar la fecha.</p>
          )}
          <select className='inputs__general cash-ui__select' value={type} onChange={(e) => setType(e.target.value)} aria-label='Tipo'>
            <option value=''>Todos los tipos</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
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
          <div className='is-short'><small>Pendientes</small><strong>{s.pending ?? 0}</strong><span>{money(s.pendingAmount)} en diferencias</span></div>
          <div className='is-ok'><small>Autorizadas hoy</small><strong>{s.authorizedToday ?? 0}</strong></div>
          <div className='is-ok'><small>Autorizadas en el periodo</small><strong>{s.authorized ?? 0}</strong></div>
          <div><small>Rechazadas</small><strong>{s.rejected ?? 0}</strong></div>
          <div className='is-warn'><small>Tiempo promedio de respuesta</small><strong>{s.avgResponseMinutes ? `${s.avgResponseMinutes} min` : '—'}</strong></div>
        </div>

        <div className='cash-ui__list'>
          <div className='cash-ui__row cash-ui__row--head autorizaciones__row'>
            <span>Fecha</span><span>Tipo</span><span>Caja</span><span>Solicitante</span><span className='is-num'>Diferencia</span><span>Estado</span><span>Resolvió</span>
          </div>
          {loading ? (
            <TableSkeleton rowClassName='cash-ui__row autorizaciones__row' cols={[{ width: '80%' }, { pill: true, width: '90px' }, { width: '70%' }, { width: '60%' }, { width: '60%' }, { pill: true, width: '80px' }, { width: '60%' }]} />
          ) : rows.length ? (
            rows.map((r) => (
              <button type='button' className={`cash-ui__row autorizaciones__row ${r.status === 'PENDING' ? 'is-pending' : ''}`} key={`${r.type}-${r.refId}`} onClick={() => setSelected(r)}>
                <span data-label='Fecha'>{dateTime(r.at)}<small>{r.shiftId ? `Turno #${r.shiftId}` : `Devolución #${r.refId}`}</small></span>
                <span data-label='Tipo'><em className='cash-ui__badge cash-ui__badge--info'>{TYPE_LABEL[r.type] ?? r.type}</em></span>
                <span data-label='Caja'>{r.registerName ?? '—'}<small>{r.branchName}</small></span>
                <span data-label='Solicitante'>{r.requesterName || '—'}</span>
                <span data-label='Diferencia' className={`is-num ${r.amount < 0 ? 'cash-ui__diff--short' : 'cash-ui__diff--over'}`}>{money(r.amount)}</span>
                <span data-label='Estado'><em className={`cash-ui__badge ${STATUS_BADGE[r.status] ?? ''}`}>{STATUS_LABEL[r.status] ?? r.status}</em></span>
                <span data-label='Resolvió'>{r.supervisorName || (r.status === 'PENDING' ? '—' : 'Supervisor')}<small>{r.resolvedAt && r.status !== 'PENDING' ? dateTime(r.resolvedAt) : ''}</small></span>
              </button>
            ))
          ) : (
            <div className='cash-ui__state'>
              <span className='material-symbols-rounded' aria-hidden>{status === 'PENDING' ? 'task_alt' : 'inbox'}</span>
              <p>{status === 'PENDING' ? 'No hay autorizaciones pendientes.' : 'No hay autorizaciones con este filtro.'}</p>
            </div>
          )}
        </div>
        {total > PAGE_SIZE && <Pagination total={total} page={page} pageSize={PAGE_SIZE} onPage={setPage} noun='solicitudes' />}
      </div>

      {selected ? (
        <ModalResolveAuthorization
          item={selected}
          onClose={() => setSelected(null)}
          onResolved={load}
          onOpenSource={(it) => setSource({ type: it.type, id: it.type === 'CLOSE' ? it.shiftId : it.refId })}
        />
      ) : null}
      {source?.type === 'CLOSE' ? <ModalCloseDetail shiftId={source.id} from='authorizations' onClose={() => setSource(null)} /> : null}
      {source && (source.type === 'COUNT' || source.type === 'COUNT_CANCEL') ? <ModalCashCountDetail id={source.id} onClose={() => setSource(null)} onChanged={load} /> : null}
    </div>
  )
}

export default Autorizaciones
