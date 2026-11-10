import React, { useMemo, useState } from 'react'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import { useKitchenBoard } from '../shared/useKitchen'
import { elapsedSince, timing } from '../shared/kitchenTypes'
import '../shared/kitchen.css'

/**
 * Comandas atrasadas (más tiempo que el estimado del platillo más lento) y las que están por vencerse (80 %).
 * Sin tiempo estimado se usa una regla general: 15 min por vencer, 20 min atrasada.
 */
const AlertasRetraso: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.cocina-alertas-de-retraso.view')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const { board, loading, error, now, load, setRush } = useKitchenBoard(branchId, canView)

  const rows = useMemo(
    () =>
      (board?.tickets ?? [])
        .filter((t) => !t.ready)
        .map((t) => {
          const elapsed = elapsedSince(t.sentAt, now)
          const limit = t.estimatedMinutes ?? 20
          return { t, elapsed, state: timing(elapsed, t.estimatedMinutes), over: elapsed - limit }
        })
        .filter((r) => r.state !== 'ok')
        .sort((a, b) => b.over - a.over),
    [board, now],
  )
  const late = rows.filter((r) => r.state === 'late').length

  return (
    <RestaurantPage
      title='Alertas de retraso'
      subtitle='Comandas que ya pasaron su tiempo estimado o están por pasarlo. Se actualiza sola.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading && !board}
      error={error}
      onRetry={load}
      compact
    >
      {!rows.length ? (
        <p className='restaurant-empty'>Todo va a tiempo. Ninguna comanda está atrasada ni por vencerse.</p>
      ) : (
        <>
          <p className='kv-summary'>
            <strong className='kv-late'>{late}</strong> atrasadas · <strong>{rows.length - late}</strong> por vencerse
          </p>
          <div className='kv-scroll'>
            <table className='kv-table'>
              <thead>
                <tr>
                  <th>Comanda</th>
                  <th className='kv-hide-sm'>Platillos</th>
                  <th className='num'>Lleva</th>
                  <th className='num'>Estimado</th>
                  <th aria-label='Acciones' />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ t, elapsed, state, over }) => (
                  <tr key={t.key}>
                    <td>
                      <strong>{t.place}</strong>
                      <small>#{t.folio}·{t.ticketNo}{t.waiter ? ` · ${t.waiter}` : ''}</small>
                    </td>
                    <td className='kv-hide-sm'>{t.items.filter((i) => i.status === 'SENT').map((i) => `${i.quantity} ${i.name}`).join(', ')}</td>
                    <td className={`num ${state === 'late' ? 'kv-late' : 'kv-near'}`}>
                      {elapsed} min
                      {state === 'late' ? <small>+{Math.max(1, Math.round(over))} min</small> : null}
                    </td>
                    <td className='num'>{t.estimatedMinutes ? `${t.estimatedMinutes} min` : '—'}</td>
                    <td>
                      <div className='kv-row-actions'>
                        <button type='button' className={t.rush ? 'btn__general-gray' : 'btn__general-purple'} onClick={() => setRush(t.tabId, t.ticketNo, !t.rush)}>
                          {t.rush ? 'Quitar urgente' : 'Marcar urgente'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </RestaurantPage>
  )
}

export default AlertasRetraso
