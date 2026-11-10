import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import { errorText } from '../../shared/restaurantTypes'
import '../shared/kitchen.css'

interface StationRow {
  id: number | null
  name: string
  production: boolean
  preparing: number
  ready: number
  doneToday: number
  avgMinutesToday: number | null
  dishCount: number
}

/** Estaciones de la cocina (parrilla, fríos, barra…): su carga ahora y su ritmo de hoy. Se dan de alta en Catálogos › Áreas. */
const Estaciones: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.cocina-estaciones.view')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [rows, setRows] = useState<StationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!(branchId > 0) || !canView) return setLoading(false)
    try {
      const res: any = await APIs.getKitchenStations(branchId)
      setRows(res?.data ?? [])
      setError('')
    } catch (e) {
      setError(errorText(e, 'No se pudieron cargar las estaciones.'))
    } finally {
      setLoading(false)
    }
  }, [branchId, canView])

  useEffect(() => {
    setLoading(true)
    load()
    const t = setInterval(load, 20_000)
    return () => clearInterval(t)
  }, [load])

  const busiest = Math.max(1, ...rows.map((r) => r.preparing))

  return (
    <RestaurantPage
      title='Estaciones'
      subtitle='Dónde se prepara cada platillo y cuánto trabajo tiene cada estación en este momento.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading}
      error={error}
      onRetry={load}
      compact
      toolbar={
        <Link to='/auth/catalogos/areas' className='btn__general-gray'>
          <span className='material-symbols-rounded'>add</span> Nueva estación (Catálogos › Áreas)
        </Link>
      }
    >
      {!rows.length ? (
        <p className='restaurant-empty'>
          Esta sucursal no tiene estaciones. Créalas en Catálogos › Áreas (por ejemplo Parrilla, Fríos, Barra) y asígnales platillos en Enrutamiento.
        </p>
      ) : (
        <div className='kv-scroll'>
          <table className='kv-table'>
            <thead>
              <tr>
                <th>Estación</th>
                <th>Carga ahora</th>
                <th className='num'>Listos sin servir</th>
                <th className='num kv-hide-sm'>Hechos hoy</th>
                <th className='num'>Promedio hoy</th>
                <th className='num kv-hide-sm'>Platillos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id ?? 'none'}>
                  <td>
                    <strong>{r.name}</strong>
                    {r.id == null ? <small>Platillos sin estación asignada</small> : null}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ minWidth: 24, fontWeight: 700 }}>{r.preparing}</span>
                      <div className='kv-bar' aria-hidden>
                        <span style={{ width: `${(r.preparing / busiest) * 100}%` }} className={r.preparing >= 8 ? 'is-late' : ''} />
                      </div>
                    </div>
                  </td>
                  <td className='num'>{r.ready}</td>
                  <td className='num kv-hide-sm'>{r.doneToday}</td>
                  <td className='num'>{r.avgMinutesToday != null ? `${r.avgMinutesToday} min` : '—'}</td>
                  <td className='num kv-hide-sm'>{r.id == null ? '—' : r.dishCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </RestaurantPage>
  )
}

export default Estaciones
