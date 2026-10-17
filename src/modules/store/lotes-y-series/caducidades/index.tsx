import React, { useCallback, useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import { useSelector } from 'react-redux'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import CategoriesStorePicker from '../../../../components/sidebar/sections/catalogos/categories/CategoriesStorePicker'
import TableSkeleton from '../../../../components/general/skeleton/TableSkeleton'
import Pagination from '../../../../components/general/pagination/Pagination'
import './Caducidades.css'

const PAGE_SIZE = 50

type Status = 'EXPIRED' | 'CRITICAL' | 'SOON' | 'WATCH' | 'OK'

const CARDS: { id: '' | Status; key: string; label: string; tone: string }[] = [
  { id: 'EXPIRED', key: 'expired', label: 'Vencidos', tone: 'expired' },
  { id: 'CRITICAL', key: 'critical', label: 'Vencen en 7 días', tone: 'critical' },
  { id: 'SOON', key: 'soon', label: 'Vencen en 30 días', tone: 'soon' },
  { id: 'WATCH', key: 'watch', label: 'Vencen en 60 días', tone: 'watch' },
  { id: 'OK', key: 'ok', label: 'Vigentes', tone: 'ok' },
  { id: '', key: 'total', label: 'Todos', tone: '' },
]

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem('categories-picker-company-id'))
  return !Number.isNaN(id) && id > 0 ? id : null
}

const errorText = (error: any, fallback: string) => {
  const message = error?.response?.data?.message
  return (Array.isArray(message) ? message.join(', ') : message) || fallback
}

const dateText = (iso?: string | null) => (iso ? String(iso).slice(0, 10).split('-').reverse().join('/') : '')

/** Etiqueta y tono según los días que faltan para caducar. */
const expiryBadge = (days: number): { label: string; tone: Status } => {
  if (days < 0) return { label: days === -1 ? 'Venció ayer' : `Venció hace ${-days} días`, tone: 'EXPIRED' }
  if (days === 0) return { label: 'Vence hoy', tone: 'CRITICAL' }
  if (days <= 7) return { label: days === 1 ? 'Vence mañana' : `Vence en ${days} días`, tone: 'CRITICAL' }
  if (days <= 30) return { label: `Vence en ${days} días`, tone: 'SOON' }
  if (days <= 60) return { label: `Vence en ${days} días`, tone: 'WATCH' }
  return { label: `Vence en ${days} días`, tone: 'OK' }
}

const qty = (n: number) => Number(n).toLocaleString('es-MX', { maximumFractionDigits: 4 })

/** Caducidades: lotes con existencia ordenados por fecha de caducidad, con resumen por corte y baja por caducidad (merma). */
const Caducidades: React.FC = () => {
  const can = useCan()
  const canWriteOff = can('store.lotes-y-series-caducidades.manage')
  const userState = useSelector((state: any) => state.user)

  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const [stores, setStores] = useState<any[]>([])
  const [storeId, setStoreId] = useState(0)
  const [status, setStatus] = useState<'' | Status>('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<any[]>([])
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestRef = useRef(0)

  const resolvedCompanyId = companyId ?? readCompanyId() ?? userState?.activeCompanyId ?? userState?.companyId ?? userState?.companyIds?.[0] ?? null

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  // Almacenes de la empresa/sucursal para el filtro
  useEffect(() => {
    if (!resolvedCompanyId) return setStores([])
    let alive = true
    APIs.getWarehouses({ companyId: resolvedCompanyId, branchId: branchId > 0 ? branchId : undefined })
      .then((r: any) => alive && setStores(Array.isArray(r) ? r : r?.data ?? []))
      .catch(() => alive && setStores([]))
    setStoreId(0)
    return () => {
      alive = false
    }
  }, [resolvedCompanyId, branchId])

  useEffect(() => {
    setPage(1)
  }, [status, debouncedSearch, storeId, branchId, companyId])

  // Cada página y cada filtro es una petición al servidor; una respuesta vieja nunca pisa a una nueva
  const load = useCallback(async () => {
    if (!resolvedCompanyId) {
      setRows([])
      setSummary({})
      setTotal(0)
      setLoading(false)
      return
    }
    const requestId = ++requestRef.current
    setLoading(true)
    setError('')
    try {
      const res: any = await APIs.getExpirations({
        companyId: resolvedCompanyId,
        branchId: branchId > 0 ? branchId : undefined,
        storeId: storeId > 0 ? storeId : undefined,
        status: status || undefined,
        search: debouncedSearch,
        page,
        pageSize: PAGE_SIZE,
      })
      if (requestId !== requestRef.current) return
      setRows(res?.data ?? [])
      setSummary(res?.summary ?? {})
      setTotal(res?.pagination?.total ?? 0)
    } catch (e) {
      if (requestId !== requestRef.current) return
      setRows([])
      setSummary({})
      setTotal(0)
      setError(errorText(e, 'No se pudieron cargar las caducidades.'))
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [resolvedCompanyId, branchId, storeId, status, debouncedSearch, page])

  useEffect(() => {
    load()
  }, [load])

  const writeOff = async (lot: any) => {
    const result = await Swal.fire({
      title: 'Baja por caducidad',
      html: `
        <p style="margin:0 0 12px;font-size:.9rem">${lot.itemName}<br/><small>Lote ${lot.lotCode} · ${qty(lot.remainingQuantity)} disponibles</small></p>
        <input id="wo-qty" class="swal2-input" type="number" min="0" step="any" max="${lot.remainingQuantity}" value="${lot.remainingQuantity}" placeholder="Cantidad" />
        <input id="wo-reason" class="swal2-input" type="text" maxlength="200" value="Caducado" placeholder="Motivo" />`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Dar de baja',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      preConfirm: () => {
        const quantity = Number((document.getElementById('wo-qty') as HTMLInputElement).value)
        const reason = (document.getElementById('wo-reason') as HTMLInputElement).value.trim()
        if (!(quantity > 0) || quantity > lot.remainingQuantity) {
          Swal.showValidationMessage(`La cantidad debe ser mayor a 0 y de máximo ${qty(lot.remainingQuantity)}.`)
          return false
        }
        if (!reason) {
          Swal.showValidationMessage('Escribe el motivo de la baja.')
          return false
        }
        return { quantity, reason }
      },
    })
    if (!result.isConfirmed || !result.value) return
    try {
      const res: any = await APIs.writeOffLot(lot.id, result.value)
      await Swal.fire({ icon: 'success', title: 'Baja registrada', text: res?.message, timer: 1800, showConfirmButton: false })
      load()
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo dar de baja', text: errorText(e, 'Intenta de nuevo.') })
    }
  }

  return (
    <div className='expirations'>
      <div className='expirations__container'>
        <div className='expirations__header'>
          <div className='expirations__title'>
            <h1>Caducidades</h1>
            <p>Lotes con existencia, del que vence primero al último. Las salidas descuentan primero lo que caduca antes.</p>
          </div>
          <div className='expirations__filters'>
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
            <select className='inputs__general expirations__select' value={storeId} onChange={(e) => setStoreId(Number(e.target.value))} aria-label='Almacén'>
              <option value={0}>Todos los almacenes</option>
              {stores.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className='expirations__search'>
              <span className='expirations__search-icon material-symbols-rounded' aria-hidden>search</span>
              <input
                className='inputs__general expirations__search-input'
                type='text'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Buscar artículo, código o lote'
                aria-label='Buscar'
              />
            </div>
          </div>
        </div>

        <div className='expirations__cards'>
          {CARDS.map((card) => (
            <button
              key={card.key}
              type='button'
              className={`expirations__card ${card.tone ? `expirations__card--${card.tone}` : ''} ${status === card.id ? 'is-active' : ''}`}
              onClick={() => setStatus(card.id)}
              aria-pressed={status === card.id}
            >
              <small>{card.label}</small>
              <strong>{summary[card.key] ?? 0}</strong>
            </button>
          ))}
        </div>

        <div className='expirations__list'>
          <div className='expirations__row expirations__row--head'>
            <span>Caducidad</span>
            <span>Lote</span>
            <span>Artículo</span>
            <span>Almacén</span>
            <span>Existencia</span>
            <span className='expirations__col-actions' />
          </div>

          {loading ? (
            <TableSkeleton rowClassName='expirations__row' cols={[{ width: '70%' }, { pill: true, width: '70px' }, { width: '75%' }, { width: '60%' }, { width: '40%' }, { actions: 1 }]} />
          ) : error ? (
            <div className='expirations__state'>
              <span className='material-symbols-rounded' aria-hidden>error</span>
              <p>{error}</p>
            </div>
          ) : rows.length > 0 ? (
            rows.map((lot: any) => {
              const badge = expiryBadge(lot.daysLeft)
              return (
                <div className='expirations__row' key={lot.id}>
                  <div className='expirations__cell expirations__date' data-label='Caducidad'>
                    <strong>{dateText(lot.expiryDate)}</strong>
                    <span className={`expirations__badge expirations__badge--${badge.tone.toLowerCase()}`}>{badge.label}</span>
                  </div>
                  <div className='expirations__cell' data-label='Lote'>
                    <span className='expirations__code'>{lot.lotCode}</span>
                  </div>
                  <div className='expirations__cell expirations__cell--name' data-label='Artículo'>
                    {lot.itemCode ? <span className='expirations__code'>{lot.itemCode}</span> : null}
                    <div className='expirations__name'>
                      <strong>{lot.itemName}</strong>
                      {lot.variationColor || lot.variationSize ? <small>{[lot.variationColor, lot.variationSize].filter(Boolean).join(' · ')}</small> : null}
                    </div>
                  </div>
                  <div className='expirations__cell expirations__cell--muted' data-label='Almacén'>{lot.storeName}</div>
                  <div className='expirations__cell expirations__qty' data-label='Existencia'>
                    {qty(lot.remainingQuantity)}
                    <small>de {qty(lot.initialQuantity)} recibidos</small>
                  </div>
                  <div className='expirations__cell expirations__col-actions'>
                    {canWriteOff && (
                      <button type='button' className='expirations__action' onClick={() => writeOff(lot)} title='Sacar del almacén lo que caducó'>
                        <span className='material-symbols-rounded' aria-hidden>delete_sweep</span>
                        Dar de baja
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className='expirations__state'>
              <span className='material-symbols-rounded' aria-hidden>event_available</span>
              <p>{debouncedSearch || status || storeId ? 'No hay lotes con ese filtro' : 'No hay lotes con caducidad'}</p>
              <small>Los lotes se crean al capturar el lote y la fecha de caducidad en una entrada de almacén.</small>
            </div>
          )}
        </div>

        {total > PAGE_SIZE && (
          <Pagination
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            onPage={(p) => {
              setPage(p)
            }}
            noun='lotes'
          />
        )}
      </div>
    </div>
  )
}

export default Caducidades
