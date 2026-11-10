import React, { useCallback, useEffect, useState } from 'react'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import { errorText } from '../../shared/restaurantTypes'
import '../shared/kitchen.css'

interface DishTime {
  itemId: number
  name: string
  count: number
  avgMinutes: number
  worstMinutes: number
  estimatedMinutes: number | null
  lateCount: number
}

interface Times {
  count: number
  avgMinutes: number | null
  lateCount: number
  dishes: DishTime[]
}

const RANGES = [
  { id: 'today', label: 'Hoy', days: 0 },
  { id: '7', label: '7 días', days: 7 },
  { id: '30', label: '30 días', days: 30 },
] as const

/** Cuánto tarda de verdad cada platillo (de enviado a listo) contra el tiempo configurado en Menús › Platillos. */
const Tiempos: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.cocina-tiempos.view')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('7')
  const [data, setData] = useState<Times | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!(branchId > 0) || !canView) return setLoading(false)
    const days = RANGES.find((r) => r.id === range)!.days
    const from = new Date()
    if (days) from.setDate(from.getDate() - days)
    else from.setHours(0, 0, 0, 0)
    try {
      const res: any = await APIs.getKitchenTimes(branchId, from.toISOString())
      setData(res?.data ?? null)
      setError('')
    } catch (e) {
      setError(errorText(e, 'No se pudieron cargar los tiempos.'))
    } finally {
      setLoading(false)
    }
  }, [branchId, canView, range])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const maxAvg = Math.max(1, ...(data?.dishes ?? []).map((d) => Math.max(d.avgMinutes, d.estimatedMinutes ?? 0)))

  return (
    <RestaurantPage
      title='Tiempos de cocina'
      subtitle='Tiempo real de cada platillo, de que se envía a cocina a que se marca listo, contra su tiempo estimado.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading}
      error={error}
      onRetry={load}
      compact
      toolbar={
        <div className='pos-chips' role='group' aria-label='Periodo'>
          {RANGES.map((r) => (
            <button key={r.id} type='button' className={`pos-chip ${range === r.id ? 'is-active' : ''}`} aria-pressed={range === r.id} onClick={() => setRange(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      {!data?.count ? (
        <p className='restaurant-empty'>Sin platillos terminados en este periodo. Los tiempos se registran cuando cocina marca «Lista» en la pantalla de cocina.</p>
      ) : (
        <>
          <p className='kv-summary'>
            <strong>{data.count}</strong> platillos · promedio <strong>{data.avgMinutes} min</strong> ·{' '}
            <strong className={data.lateCount ? 'kv-late' : ''}>{data.lateCount}</strong> tarde ({Math.round((data.lateCount / data.count) * 100)} %)
          </p>
          <div className='kv-scroll'>
            <table className='kv-table'>
              <thead>
                <tr>
                  <th>Platillo</th>
                  <th className='num kv-hide-sm'>Veces</th>
                  <th className='num'>Promedio</th>
                  <th className='kv-hide-sm' aria-label='Comparación' />
                  <th className='num'>Estimado</th>
                  <th className='num kv-hide-sm'>Peor</th>
                  <th className='num'>Tarde</th>
                </tr>
              </thead>
              <tbody>
                {data.dishes.map((d) => {
                  const over = d.estimatedMinutes != null && d.avgMinutes > d.estimatedMinutes
                  return (
                    <tr key={d.itemId}>
                      <td><strong>{d.name}</strong></td>
                      <td className='num kv-hide-sm'>{d.count}</td>
                      <td className={`num ${over ? 'kv-late' : ''}`}>{d.avgMinutes} min</td>
                      <td className='kv-hide-sm' style={{ width: '22%' }}>
                        <div className='kv-bar' aria-hidden>
                          <span className={over ? 'is-late' : ''} style={{ width: `${(d.avgMinutes / maxAvg) * 100}%` }} />
                        </div>
                      </td>
                      <td className='num'>{d.estimatedMinutes != null ? `${d.estimatedMinutes} min` : <small>Sin configurar</small>}</td>
                      <td className='num kv-hide-sm'>{d.worstMinutes} min</td>
                      <td className={`num ${d.lateCount ? 'kv-late' : ''}`}>{d.estimatedMinutes != null ? `${Math.round((d.lateCount / d.count) * 100)} %` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </RestaurantPage>
  )
}

export default Tiempos
