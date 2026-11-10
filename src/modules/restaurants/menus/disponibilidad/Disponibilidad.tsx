import React, { useCallback, useState } from 'react'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import PosModal from '../../shared/pos-modal/PosModal'
import { dateTime } from '../../shared/restaurantTypes'
import { useMenuData } from '../shared/useMenuData'
import { Dish } from '../shared/menuTypes'
import '../shared/Menus.css'

type Filter = 'all' | 'off' | 'on'

const endOfDay = () => {
  const d = new Date()
  d.setHours(23, 59, 0, 0)
  return d.toISOString()
}
const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString()

/** Qué platillos se pueden pedir hoy en esta sucursal: agotado, pausado hasta una hora o disponible. */
const Disponibilidad: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.menus-disponibilidad.view')
  const canManage = can('restaurants.manage') || can('restaurants.create') || can('restaurants.update')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const fetchDishes = useCallback(() => APIs.getRestaurantDishes({ branchId, search: search || undefined }), [branchId, search])
  const { data: dishes, loading, error, busy, load, run } = useMenuData<Dish[]>(fetchDishes, canView && branchId > 0, [])
  const [pause, setPause] = useState<{ dish: Dish; reason: string; until: 'none' | '1' | '2' | 'day' } | null>(null)

  const set = (d: Dish, available: boolean, reason?: string, until?: string | null, done?: string) =>
    run(() => APIs.setRestaurantAvailability({ branchId, dishId: d.id, available, reason, until }), done ?? (available ? `${d.name} disponible` : `${d.name} agotado`), () => setPause(null))

  const shown = dishes.filter((d) => d.active).filter((d) => (filter === 'all' ? true : filter === 'off' ? !d.availability?.available : d.availability?.available))
  const offCount = dishes.filter((d) => d.active && !d.availability?.available).length

  return (
    <RestaurantPage
      title='Disponibilidad'
      subtitle={offCount ? `${offCount} platillo(s) no disponibles en esta sucursal. El POS ya no deja pedirlos.` : 'Marca lo que se agotó para que el mesero no lo ofrezca.'}
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading && !dishes.length}
      error={error}
      onRetry={load}
      toolbar={
        <>
          <label className='pos-field'>
            Buscar
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Nombre del platillo' />
          </label>
          <div className='pos-chips' role='group' aria-label='Filtrar'>
            {([['all', 'Todos'], ['off', 'No disponibles'], ['on', 'Disponibles']] as [Filter, string][]).map(([key, label]) => (
              <button key={key} type='button' className={`pos-chip ${filter === key ? 'is-active' : ''}`} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>
            ))}
          </div>
        </>
      }
    >
      {!shown.length ? (
        <p className='restaurant-empty'>{dishes.length ? 'Ningún platillo coincide con el filtro.' : 'Todavía no hay platillos. Agrégalos en "Platillos".'}</p>
      ) : (
        <div className='menus-list'>
          {shown.map((d) => {
            const on = !!d.availability?.available
            return (
              <div key={d.id} className={`menus-row ${on ? '' : 'is-off-row'}`}>
                <div className='menus-row__main'>
                  <strong>{d.name}</strong>
                  <small>
                    {on ? 'Se puede pedir' : `${d.availability?.reason ? `${d.availability.reason} · ` : ''}${d.availability?.until ? `vuelve ${dateTime(d.availability.until)}` : 'hasta que lo actives'}`}
                  </small>
                </div>
                <span className={`menus-status ${on ? '' : 'is-off'}`}>{on ? 'Disponible' : 'No disponible'}</span>
                {canManage ? (
                  <div className='menus-row__actions'>
                    {on ? (
                      <>
                        <button type='button' className='btn__general-gray' disabled={busy} onClick={() => set(d, false, 'Agotado')}>Agotado</button>
                        <button type='button' className='menus-icon' title='Pausar por un rato' aria-label={`Pausar ${d.name}`} disabled={busy} onClick={() => setPause({ dish: d, reason: '', until: '1' })}>
                          <span className='material-symbols-rounded'>schedule</span>
                        </button>
                      </>
                    ) : (
                      <button type='button' className='btn__general-purple' disabled={busy} onClick={() => set(d, true)}>Volver a activar</button>
                    )}
                  </div>
                ) : <span />}
              </div>
            )
          })}
        </div>
      )}

      {pause ? (
        <PosModal
          title={`Pausar ${pause.dish.name}`}
          onClose={() => setPause(null)}
          actions={
            <>
              <button type='button' className='btn__general-gray' onClick={() => setPause(null)}>Cancelar</button>
              <button
                type='button'
                className='btn__general-purple'
                disabled={busy}
                onClick={() => set(pause.dish, false, pause.reason || 'Pausado', pause.until === 'none' ? null : pause.until === '1' ? inHours(1) : pause.until === '2' ? inHours(2) : endOfDay(), `${pause.dish.name} pausado`)}
              >
                Pausar
              </button>
            </>
          }
        >
          <div className='pos-field'>
            Vuelve a estar disponible
            <div className='pos-chips'>
              {([['1', 'En 1 hora'], ['2', 'En 2 horas'], ['day', 'Hoy al cierre'], ['none', 'Hasta que lo active']] as ['1' | '2' | 'day' | 'none', string][]).map(([key, label]) => (
                <button key={key} type='button' className={`pos-chip ${pause.until === key ? 'is-active' : ''}`} aria-pressed={pause.until === key} onClick={() => setPause({ ...pause, until: key })}>{label}</button>
              ))}
            </div>
          </div>
          <label className='pos-field'>
            Motivo (opcional)
            <input value={pause.reason} maxLength={120} onChange={(e) => setPause({ ...pause, reason: e.target.value })} placeholder='Se acabó el pan' />
          </label>
        </PosModal>
      ) : null}
    </RestaurantPage>
  )
}

export default Disponibilidad
