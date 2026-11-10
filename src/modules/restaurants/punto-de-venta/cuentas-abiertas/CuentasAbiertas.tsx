import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import './CuentasAbiertas.css'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import { IVA_RATE, Tab, TYPE_ICON, elapsed, errorText, liveItems, money, tabTitle } from '../../shared/restaurantTypes'

export const POS_PATH = '/auth/restaurants/punto-de-venta/pos-de-restaurante'

/** Todas las cuentas abiertas de la sucursal (mesa, para llevar, mostrador), la más antigua primero. */
const CuentasAbiertas: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.punto-de-venta-cuentas-abiertas.view')
  const navigate = useNavigate()
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [rows, setRows] = useState<Tab[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())

  const load = useCallback(
    async (quiet = false) => {
      if (!(branchId > 0) || !canView) {
        setLoading(false)
        return
      }
      if (!quiet) setLoading(true)
      try {
        const res: any = await APIs.getRestaurantTabs({ branchId, status: 'open', pageSize: 200 })
        setRows(res?.data ?? [])
        setError('')
        setNow(Date.now())
      } catch (e) {
        if (!quiet) setError(errorText(e, 'No se pudieron cargar las cuentas.'))
      } finally {
        setLoading(false)
      }
    },
    [branchId, canView],
  )

  useEffect(() => {
    load()
    const t = setInterval(() => load(true), 30_000)
    return () => clearInterval(t)
  }, [load])

  const total = rows.reduce((acc, t) => acc + t.subtotal * (1 + IVA_RATE), 0)

  return (
    <RestaurantPage
      title='Cuentas abiertas'
      subtitle={`${rows.length} cuenta(s) sin cobrar · ${money(total)} aprox. con IVA. Toca una para continuarla en el POS.`}
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading}
      error={error}
      onRetry={() => load()}
    >
      {!rows.length ? (
        <p className='restaurant-empty'>No hay cuentas abiertas en esta sucursal.</p>
      ) : (
        <div className='restaurant-list'>
          {rows.map((t) => {
            const pending = liveItems(t).filter((i) => i.status === 'PENDING').length
            return (
              <button
                key={t.id}
                type='button'
                className={`restaurant-list__row is-link cuenta${t.status === 'BILL_REQUESTED' ? ' is-bill' : ''}`}
                onClick={() => navigate(`${POS_PATH}?tab=${t.id}`)}
              >
                <span className='cuenta__icon' aria-hidden>
                  <span className='material-symbols-rounded'>{TYPE_ICON[t.type]}</span>
                </span>
                <span className='restaurant-list__main'>
                  <strong>{tabTitle(t)}</strong>
                  <small className='cuenta__meta'>
                    <span>#{t.folio}</span>
                    {t.table?.diningRoom?.name ? <span>{t.table.diningRoom.name}</span> : null}
                    <span>{t.guests} comensal(es)</span>
                    <span>{t.waiterName ?? 'Sin mesero'}</span>
                  </small>
                </span>
                <span className='cuenta__status'>
                  {t.status === 'BILL_REQUESTED' ? <span className='restaurant-badge is-blue'>Pidió la cuenta</span> : null}
                  {pending ? <span className='restaurant-badge'>{pending} sin enviar</span> : null}
                </span>
                <span className='cuenta__time'>
                  <small>Abierta hace</small>
                  {elapsed(t.openedAt, now)}
                </span>
                <span className='restaurant-list__num'>{money(t.subtotal * (1 + IVA_RATE))}</span>
                <span className='material-symbols-rounded cuenta__go' aria-hidden>chevron_right</span>
              </button>
            )
          })}
        </div>
      )}
    </RestaurantPage>
  )
}

export default CuentasAbiertas
