import React, { useRef, useState } from 'react'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import TicketCard from '../shared/TicketCard'
import { useKitchenBoard } from '../shared/useKitchen'
import { elapsedSince, timing } from '../shared/kitchenTypes'
import '../shared/kitchen.css'

const AREA_KEY = 'kds-area'
const readArea = () => {
  try {
    return Number(localStorage.getItem(AREA_KEY)) || 0
  } catch {
    return 0
  }
}

/** Pantalla de cocina: comandas por llegada (urgentes primero), con filtro por estación y pantalla completa. */
const PantallaKds: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.cocina-pantalla-kds.view')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [areaId, setAreaId] = useState(readArea)
  const { board, loading, error, now, load, setStatus, setRush } = useKitchenBoard(branchId, canView, areaId)
  const boxRef = useRef<HTMLDivElement>(null)

  const pickArea = (id: number) => {
    setAreaId(id)
    try {
      localStorage.setItem(AREA_KEY, String(id))
    } catch {
      /* sin almacenamiento: el filtro dura la sesión */
    }
  }

  const tickets = board?.tickets ?? []
  const preparing = tickets.filter((t) => !t.ready)
  const lateCount = preparing.filter((t) => timing(elapsedSince(t.sentAt, now), t.estimatedMinutes) === 'late').length
  const clock = new Date(now).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  const fullscreen = () => {
    const el = boxRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined)
    else el.requestFullscreen?.().catch(() => undefined)
  }

  return (
    <RestaurantPage
      title='Pantalla de cocina'
      subtitle='Toca un platillo cuando esté listo. «Lista» avisa al mesero; «Entregada» la quita de la pantalla.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading && !board}
      error=''
    >
      <div className='kds' ref={boxRef}>
        <div className='kds__bar'>
          <div className='kds__stats' aria-live='polite'>
            <span><strong>{preparing.length}</strong>en preparación</span>
            <span><strong>{tickets.length - preparing.length}</strong>listas</span>
            <span className={lateCount ? 'is-late' : ''}><strong>{lateCount}</strong>atrasadas</span>
          </div>
          <span className='kds__clock'>{clock}</span>
          <button type='button' className='kds-btn' onClick={load} aria-label='Actualizar'>
            <span className='material-symbols-rounded'>refresh</span>
          </button>
          <button type='button' className='kds-btn' onClick={fullscreen}>
            <span className='material-symbols-rounded'>fullscreen</span> Pantalla completa
          </button>
        </div>

        {board?.stations.length ? (
          <div className='kds__chips' role='group' aria-label='Estación'>
            <button type='button' className={`kds-chip ${areaId === 0 ? 'is-active' : ''}`} aria-pressed={areaId === 0} onClick={() => pickArea(0)}>
              Todas
            </button>
            {board.stations.map((s) => (
              <button key={s.id} type='button' className={`kds-chip ${areaId === s.id ? 'is-active' : ''}`} aria-pressed={areaId === s.id} onClick={() => pickArea(s.id)}>
                {s.name}
              </button>
            ))}
          </div>
        ) : null}

        {error ? <div className='kds__error' role='alert'>{error} Reintentando…</div> : null}

        {tickets.length ? (
          <div className='kds__board'>
            {tickets.map((t) => (
              <TicketCard
                key={t.key}
                ticket={t}
                now={now}
                onItem={(id, ready) => setStatus([id], ready ? 'READY' : 'SENT')}
                onDone={(tk) => setStatus(tk.items.map((i) => i.id), tk.ready ? 'SERVED' : 'READY')}
                onRush={(tk) => setRush(tk.tabId, tk.ticketNo, !tk.rush)}
              />
            ))}
          </div>
        ) : (
          <div className='kds__empty'>
            <span className='material-symbols-rounded' style={{ fontSize: 44 }} aria-hidden>skillet</span>
            <strong>Sin comandas</strong>
            <span>{areaId ? 'Nada pendiente en esta estación.' : 'Las comandas aparecen aquí en cuanto el mesero las envía.'}</span>
          </div>
        )}
      </div>
    </RestaurantPage>
  )
}

export default PantallaKds
