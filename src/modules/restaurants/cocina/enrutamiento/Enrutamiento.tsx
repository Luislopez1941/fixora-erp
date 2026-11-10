import React, { useCallback, useEffect, useMemo, useState } from 'react'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import { showToast } from '../../../../utils/toast'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import { errorText } from '../../shared/restaurantTypes'
import { Station } from '../shared/kitchenTypes'
import '../shared/kitchen.css'

interface DishRoute {
  itemId: number
  name: string
  category: string | null
  areaId: number | null
}

/** A qué estación va cada platillo cuando el mesero lo envía (y en qué pantalla de cocina aparece). */
const Enrutamiento: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.cocina-enrutamiento.view')
  const canManage = can('restaurants.manage') || can('restaurants.create') || can('restaurants.update')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [stations, setStations] = useState<Station[]>([])
  const [dishes, setDishes] = useState<DishRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [onlyMissing, setOnlyMissing] = useState(false)

  const load = useCallback(async () => {
    if (!(branchId > 0) || !canView) return setLoading(false)
    try {
      const res: any = await APIs.getKitchenRoutes(branchId)
      setStations(res?.data?.stations ?? [])
      setDishes(res?.data?.dishes ?? [])
      setError('')
    } catch (e) {
      setError(errorText(e, 'No se pudieron cargar los platillos.'))
    } finally {
      setLoading(false)
    }
  }, [branchId, canView])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const change = async (d: DishRoute, areaId: number | null) => {
    setDishes((list) => list.map((x) => (x.itemId === d.itemId ? { ...x, areaId } : x)))
    try {
      await APIs.setKitchenRoute(d.itemId, areaId)
      showToast({ type: 'success', title: areaId ? `${d.name} → ${stations.find((s) => s.id === areaId)?.name}` : `${d.name} sin estación` })
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo guardar', text: errorText(e, 'Intenta de nuevo.') })
      load()
    }
  }

  const missing = dishes.filter((d) => !d.areaId).length
  const shown = useMemo(
    () => dishes.filter((d) => (!onlyMissing || !d.areaId) && d.name.toLowerCase().includes(search.trim().toLowerCase())),
    [dishes, onlyMissing, search],
  )

  return (
    <RestaurantPage
      title='Enrutamiento'
      subtitle='Elige la estación que prepara cada platillo. La comanda llega a esa estación en la pantalla de cocina.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading}
      error={error}
      onRetry={load}
      compact
      toolbar={
        <>
          <label className='pos-field'>
            Buscar
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Nombre del platillo' />
          </label>
          <div className='pos-chips'>
            <button type='button' className={`pos-chip ${!onlyMissing ? 'is-active' : ''}`} aria-pressed={!onlyMissing} onClick={() => setOnlyMissing(false)}>
              Todos <small>{dishes.length}</small>
            </button>
            <button type='button' className={`pos-chip ${onlyMissing ? 'is-active' : ''}`} aria-pressed={onlyMissing} onClick={() => setOnlyMissing(true)}>
              Sin estación <small>{missing}</small>
            </button>
          </div>
        </>
      }
    >
      {!stations.length ? (
        <p className='restaurant-empty'>Primero crea estaciones en Catálogos › Áreas (Parrilla, Fríos, Barra…).</p>
      ) : !shown.length ? (
        <p className='restaurant-empty'>{dishes.length ? 'Ningún platillo coincide.' : 'Todavía no hay platillos. Créalos en Menús › Platillos.'}</p>
      ) : (
        <div className='kv-scroll'>
          <table className='kv-table'>
            <thead>
              <tr>
                <th>Platillo</th>
                <th>Estación</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((d) => (
                <tr key={d.itemId}>
                  <td>
                    <strong>{d.name}</strong>
                    {d.category ? <small>{d.category}</small> : null}
                  </td>
                  <td style={{ width: '40%' }}>
                    <select
                      aria-label={`Estación de ${d.name}`}
                      value={d.areaId ?? ''}
                      disabled={!canManage}
                      onChange={(e) => change(d, e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value=''>Sin estación</option>
                      {stations.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
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

export default Enrutamiento
