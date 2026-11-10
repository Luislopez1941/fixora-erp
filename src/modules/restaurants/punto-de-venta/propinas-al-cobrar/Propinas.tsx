import React, { useCallback, useEffect, useState } from 'react'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import { TabType, TYPE_LABEL, dateTime, errorText, money } from '../../shared/restaurantTypes'

interface TipsData {
  total: number
  byWaiter: { waiterUserId: number | null; waiterName: string; tabs: number; total: number }[]
  rows: { id: number; folio: number; tipAmount: number; tipMethod: string | null; waiterName: string | null; closedAt: string; table: { name: string } | null; type: TabType }[]
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Propinas cobradas por mesero en un periodo. La propina se guarda aparte de la venta (no es ingreso del negocio);
 * aquí se ve cuánto juntó cada quien para repartirla.
 */
const Propinas: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.punto-de-venta-propinas-al-cobrar.view')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [data, setData] = useState<TipsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!(branchId > 0) || !canView) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res: any = await APIs.getRestaurantTips(branchId, new Date(`${from}T00:00:00`).toISOString(), new Date(`${to}T23:59:59.999`).toISOString())
      setData(res?.data ?? null)
      setError('')
    } catch (e) {
      setError(errorText(e, 'No se pudieron cargar las propinas.'))
    } finally {
      setLoading(false)
    }
  }, [branchId, canView, from, to])

  useEffect(() => {
    load()
  }, [load])

  return (
    <RestaurantPage
      title='Propinas'
      subtitle='Propinas cobradas por mesero. Van aparte del total de la venta y del corte de caja.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading}
      error={error}
      onRetry={load}
      toolbar={
        <>
          <label className='pos-field'>
            Desde
            <input id='restaurant-tips-from' type='date' value={from} max={to} onChange={(e) => setFrom(e.target.value || today())} />
          </label>
          <label className='pos-field'>
            Hasta
            <input id='restaurant-tips-to' type='date' value={to} min={from} max={today()} onChange={(e) => setTo(e.target.value || today())} />
          </label>
          <span className='pos-note'>Total: <strong>{money(data?.total ?? 0)}</strong></span>
        </>
      }
    >
      {!data?.rows.length ? (
        <p className='restaurant-empty'>No hay propinas en ese periodo.</p>
      ) : (
        <>
          <div className='restaurant-list'>
            {data.byWaiter.map((w) => (
              <div key={String(w.waiterUserId)} className='restaurant-list__row'>
                <span className='material-symbols-rounded' aria-hidden>person</span>
                <span className='restaurant-list__main'>
                  <strong>{w.waiterName}</strong>
                  <small>{w.tabs} cuenta(s)</small>
                </span>
                <span className='restaurant-list__num'>{money(w.total)}</span>
                <span />
              </div>
            ))}
          </div>
          <details>
            <summary className='pos-note'>Ver cada cuenta ({data.rows.length})</summary>
            <div className='restaurant-list' style={{ marginTop: 8 }}>
              {data.rows.map((r) => (
                <div key={r.id} className='restaurant-list__row'>
                  <span className='material-symbols-rounded' aria-hidden>receipt</span>
                  <span className='restaurant-list__main'>
                    <strong>{r.table?.name ?? TYPE_LABEL[r.type]} · #{r.folio}</strong>
                    <small>{dateTime(r.closedAt)} · {r.waiterName ?? 'Sin mesero'}{r.tipMethod ? ` · ${r.tipMethod}` : ''}</small>
                  </span>
                  <span className='restaurant-list__num'>{money(r.tipAmount)}</span>
                  <span />
                </div>
              ))}
            </div>
          </details>
        </>
      )}
    </RestaurantPage>
  )
}

export default Propinas
