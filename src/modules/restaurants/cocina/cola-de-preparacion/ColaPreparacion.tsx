import React, { useMemo, useState } from 'react'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import { useKitchenBoard } from '../shared/useKitchen'
import { elapsedSince } from '../shared/kitchenTypes'
import '../shared/kitchen.css'

interface Line {
  name: string
  station: string | null
  quantity: number
  itemIds: number[]
  places: string[]
  oldestSentAt: string
  mods: string[]
}

type Group = 'estacion' | 'espera'

const NO_STATION = 'Sin estación'

/** Lo que hay que preparar sumado por platillo: "8 Tacos al pastor" en vez de ocho comandas sueltas. */
const ColaPreparacion: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.cocina-cola-de-preparacion.view')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [areaId, setAreaId] = useState(0)
  const [group, setGroup] = useState<Group>('estacion')
  const { board, loading, error, now, load, setStatus } = useKitchenBoard(branchId, canView, areaId)

  const lines = useMemo(() => {
    const map = new Map<string, Line>()
    for (const t of board?.tickets ?? []) {
      for (const i of t.items) {
        if (i.status !== 'SENT') continue
        const key = `${i.name}|${i.station ?? ''}`
        const cur = map.get(key) ?? { name: i.name, station: i.station, quantity: 0, itemIds: [], places: [], oldestSentAt: t.sentAt, mods: [] }
        cur.quantity += i.quantity
        cur.itemIds.push(i.id)
        if (!cur.places.includes(t.place)) cur.places.push(t.place)
        if (new Date(t.sentAt) < new Date(cur.oldestSentAt)) cur.oldestSentAt = t.sentAt
        for (const m of [...i.modifiers, ...(i.notes ? [i.notes] : [])]) if (!cur.mods.includes(m)) cur.mods.push(m)
        map.set(key, cur)
      }
    }
    return [...map.values()].sort((a, b) => new Date(a.oldestSentAt).getTime() - new Date(b.oldestSentAt).getTime())
  }, [board])

  const sections = useMemo(() => {
    if (group === 'espera') return [{ title: '', lines }]
    const by = new Map<string, Line[]>()
    for (const l of lines) by.set(l.station ?? NO_STATION, [...(by.get(l.station ?? NO_STATION) ?? []), l])
    return [...by.entries()]
      .map(([title, list]) => ({ title, lines: list }))
      .sort((a, b) => (a.title === NO_STATION ? 1 : b.title === NO_STATION ? -1 : a.title.localeCompare(b.title)))
  }, [lines, group])

  const total = lines.reduce((a, l) => a + l.quantity, 0)
  const oldest = lines.length ? elapsedSince(lines[0].oldestSentAt, now) : 0

  return (
    <RestaurantPage
      title='Cola de preparación'
      subtitle='Todo lo que falta por preparar, sumado por platillo. Marca «Listos» cuando salgan.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading && !board}
      error={error}
      onRetry={load}
      compact
      toolbar={
        <>
          {board?.stations.length ? (
            <label className='pos-field'>
              Estación
              <select value={areaId} onChange={(e) => setAreaId(Number(e.target.value))}>
                <option value={0}>Todas</option>
                {board.stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
          ) : null}
          <div className='pos-chips' role='group' aria-label='Agrupar'>
            <button type='button' className={`pos-chip ${group === 'estacion' ? 'is-active' : ''}`} aria-pressed={group === 'estacion'} onClick={() => setGroup('estacion')}>
              Por estación
            </button>
            <button type='button' className={`pos-chip ${group === 'espera' ? 'is-active' : ''}`} aria-pressed={group === 'espera'} onClick={() => setGroup('espera')}>
              Por espera
            </button>
          </div>
        </>
      }
    >
      {!lines.length ? (
        <div className='kq-empty'>
          <span className='material-symbols-rounded' aria-hidden>skillet</span>
          <strong>Todo al día</strong>
          <span>Los platillos nuevos aparecen aquí en cuanto el mesero envía la comanda.</span>
        </div>
      ) : (
        <>
          <p className='kq-summary' aria-live='polite'>
            <span><strong>{total}</strong> piezas</span>
            <span><strong>{lines.length}</strong> platillos</span>
            <span className={oldest >= 20 ? 'is-late' : oldest >= 15 ? 'is-near' : ''}>
              más antiguo: <strong>{oldest} min</strong>
            </span>
          </p>
          {sections.map((sec) => (
            <section key={sec.title || 'todos'} className='kq-group'>
              {sec.title ? (
                <h2 className='kq-group__title'>
                  {sec.title} <small>{sec.lines.reduce((a, l) => a + l.quantity, 0)} piezas</small>
                </h2>
              ) : null}
              <ul className='kq-list'>
                {sec.lines.map((l) => {
                  const wait = elapsedSince(l.oldestSentAt, now)
                  const level = wait >= 20 ? 'late' : wait >= 15 ? 'near' : 'ok'
                  return (
                    <li key={`${l.name}|${l.station}`} className='kq-row'>
                      <span className='kq-row__qty'>{l.quantity % 1 ? l.quantity.toFixed(1) : l.quantity}</span>
                      <div className='kq-row__main'>
                        <strong>{l.name}</strong>
                        {l.mods.length ? <span className='kq-row__mods'>{l.mods.join(' · ')}</span> : null}
                        <span className='kq-row__places'>{l.places.join(' · ')}</span>
                      </div>
                      <span className={`kq-row__wait is-${level}`} aria-label={`${wait} minutos esperando`}>
                        <i aria-hidden />
                        {wait} min
                      </span>
                      <button type='button' className='kq-row__done' onClick={() => setStatus(l.itemIds, 'READY')} aria-label={`${l.quantity} ${l.name} listos`}>
                        <span className='material-symbols-rounded' aria-hidden>check</span>
                        <span className='kq-row__done-text'>Listos</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </>
      )}
    </RestaurantPage>
  )
}

export default ColaPreparacion
