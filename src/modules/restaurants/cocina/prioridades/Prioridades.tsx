import React, { useState } from 'react'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import { useKitchenBoard } from '../shared/useKitchen'
import { elapsedSince } from '../shared/kitchenTypes'
import '../shared/kitchen.css'

/**
 * Orden en que cocina ve las comandas: primero las urgentes, después por hora de llegada.
 * Aquí se marcan o quitan urgentes (cliente con prisa, mesa VIP, pedido para llevar que ya llegó).
 */
const Prioridades: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.cocina-prioridades.view')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const { board, loading, error, now, load, setRush } = useKitchenBoard(branchId, canView)
  const tickets = (board?.tickets ?? []).filter((t) => !t.ready)

  return (
    <RestaurantPage
      title='Prioridades'
      subtitle='Cocina atiende en este orden: urgentes primero y luego por hora de llegada.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading && !board}
      error={error}
      onRetry={load}
      compact
    >
      {!tickets.length ? (
        <p className='restaurant-empty'>No hay comandas en preparación.</p>
      ) : (
        <div className='kv-scroll'>
          <table className='kv-table'>
            <thead>
              <tr>
                <th className='num'>Turno</th>
                <th>Comanda</th>
                <th className='kv-hide-sm'>Platillos</th>
                <th className='num'>Espera</th>
                <th aria-label='Urgente' />
              </tr>
            </thead>
            <tbody>
              {tickets.map((t, i) => (
                <tr key={t.key}>
                  <td className='num' style={{ fontWeight: 700 }}>{i + 1}</td>
                  <td>
                    <strong>
                      {t.place}
                      {t.rush ? <span className='restaurant-badge' style={{ background: 'color-mix(in srgb, var(--rest-danger) 14%, transparent)', color: 'var(--rest-danger)' }}>Urgente</span> : null}
                    </strong>
                    <small>#{t.folio}·{t.ticketNo}{t.room ? ` · ${t.room}` : ''}</small>
                  </td>
                  <td className='kv-hide-sm'>{t.items.reduce((a, it) => a + it.quantity, 0)} piezas</td>
                  <td className='num'>{elapsedSince(t.sentAt, now)} min</td>
                  <td>
                    <div className='kv-row-actions'>
                      <button type='button' className={t.rush ? 'btn__general-gray' : 'btn__general-purple'} onClick={() => setRush(t.tabId, t.ticketNo, !t.rush)}>
                        {t.rush ? 'Quitar urgente' : 'Urgente'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </RestaurantPage>
  )
}

export default Prioridades
