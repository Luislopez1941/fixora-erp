import React, { useEffect, useState } from 'react'
import { Floor, RestaurantTable, TabSummary, TYPE_ICON, TYPE_LABEL, elapsed, money } from '../../../shared/restaurantTypes'
import './FloorMap.css'

interface Props {
  floor: Floor
  /** Mesa libre: abrir cuenta. Mesa ocupada: abrir su cuenta (o elegir si tiene varias). */
  onTable: (table: RestaurantTable) => void
  onTab: (tab: TabSummary) => void
  onNew: (type: 'TAKEOUT' | 'COUNTER') => void
}

const tableState = (t: RestaurantTable) =>
  !t.tabs.length ? 'free' : t.tabs.some((x) => x.status === 'BILL_REQUESTED') ? 'bill' : 'busy'

const STATE_LABEL = { free: 'Libre', busy: 'Ocupada', bill: 'Pidió la cuenta' } as const

/** Plano del POS: salones en pestañas, mesas con su estado y tiempo, y las cuentas para llevar / mostrador. */
const FloorMap: React.FC<Props> = ({ floor, onTable, onTab, onNew }) => {
  const [roomId, setRoomId] = useState<number | null>(() => {
    try {
      return Number(localStorage.getItem('restaurant-pos-room')) || null
    } catch {
      return null
    }
  })
  // El tiempo de ocupación avanza solo
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  const room = floor.rooms.find((r) => r.id === roomId) ?? floor.rooms[0]
  const pick = (id: number) => {
    setRoomId(id)
    try {
      localStorage.setItem('restaurant-pos-room', String(id))
    } catch {
      /* sin almacenamiento: solo no se recuerda */
    }
  }

  const counts = floor.rooms.flatMap((r) => r.tables).reduce(
    (acc, t) => ({ ...acc, [tableState(t)]: acc[tableState(t)] + 1 }),
    { free: 0, busy: 0, bill: 0 },
  )

  return (
    <div className='floor-map'>
      <div className='floor-map__bar'>
        <div className='floor-map__rooms' role='tablist' aria-label='Salones'>
          {floor.rooms.map((r) => {
            const busy = r.tables.filter((t) => t.tabs.length).length
            return (
              <button key={r.id} type='button' role='tab' aria-selected={room?.id === r.id} className={room?.id === r.id ? 'is-active' : ''} onClick={() => pick(r.id)}>
                {r.name}
                <span className='floor-map__count'>{busy}/{r.tables.length}</span>
              </button>
            )
          })}
        </div>
        <div className='floor-map__legend' aria-hidden>
          <span className='is-free'>{counts.free} libres</span>
          <span className='is-busy'>{counts.busy} ocupadas</span>
          <span className='is-bill'>{counts.bill} piden cuenta</span>
        </div>
        <div className='floor-map__new'>
          <button type='button' className='btn__general-secondary' onClick={() => onNew('COUNTER')}>
            <span className='material-symbols-rounded'>storefront</span> Mostrador
          </button>
          <button type='button' className='btn__general-purple' onClick={() => onNew('TAKEOUT')}>
            <span className='material-symbols-rounded'>takeout_dining</span> Para llevar
          </button>
        </div>
      </div>

      {!floor.rooms.length ? (
        <div className='floor-map__empty'>
          <span className='material-symbols-rounded' aria-hidden>table_restaurant</span>
          <p>Esta sucursal todavía no tiene salones ni mesas.</p>
          <p className='floor-map__hint'>Créalos en Restaurantes › Salón › Salones. Mientras, puedes cobrar en mostrador o para llevar.</p>
        </div>
      ) : (
        <div className='floor-map__tables'>
          {room?.tables.map((t) => {
            const state = tableState(t)
            const main = t.tabs[0]
            const subtotal = t.tabs.reduce((acc, x) => acc + x.subtotal, 0)
            return (
              <button
                key={t.id}
                type='button'
                className={`floor-table is-${state} shape-${t.shape}`}
                onClick={() => onTable(t)}
                aria-label={`${t.name}: ${STATE_LABEL[state]}`}
              >
                <span className='floor-table__name'>{t.name}</span>
                {main ? (
                  <>
                    <span className='floor-table__meta'>
                      <span className='material-symbols-rounded' aria-hidden>group</span>
                      {t.tabs.reduce((acc, x) => acc + x.guests, 0)}
                      <span className='material-symbols-rounded' aria-hidden>schedule</span>
                      {elapsed(main.openedAt, now)}
                    </span>
                    <span className='floor-table__total'>{money(subtotal)}</span>
                    {t.tabs.length > 1 ? <span className='floor-table__badge'>{t.tabs.length} cuentas</span> : null}
                    {t.tabs.some((x) => x.pendingCount) ? <span className='floor-table__pending' title='Hay platillos sin enviar a cocina' /> : null}
                  </>
                ) : (
                  <span className='floor-table__meta'>
                    <span className='material-symbols-rounded' aria-hidden>chair</span>
                    {t.seats}
                  </span>
                )}
                <span className='floor-table__state'>{STATE_LABEL[state]}</span>
              </button>
            )
          })}
        </div>
      )}

      {floor.otherTabs.length ? (
        <div className='floor-map__others'>
          <h3>Para llevar y mostrador</h3>
          <div className='floor-map__other-list'>
            {floor.otherTabs.map((t) => (
              <button key={t.id} type='button' className={`floor-other ${t.status === 'BILL_REQUESTED' ? 'is-bill' : ''}`} onClick={() => onTab(t)}>
                <span className='material-symbols-rounded' aria-hidden>{TYPE_ICON[t.type]}</span>
                <span className='floor-other__name'>{t.label || `${TYPE_LABEL[t.type]} #${t.folio}`}</span>
                <span className='floor-other__meta'>{elapsed(t.openedAt, now)} · {money(t.subtotal)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default FloorMap
