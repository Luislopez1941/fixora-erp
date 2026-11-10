import { useCallback, useEffect, useRef, useState } from 'react'
import APIs from '../../../../services/APIs'
import { showToast } from '../../../../utils/toast'
import { errorText } from '../../shared/restaurantTypes'
import { KitchenBoard, KitchenItemStatus } from './kitchenTypes'

/**
 * Comandas activas de la sucursal, recargadas cada `every` ms sin parpadeo (la primera vez muestra carga; después
 * actualiza en silencio). `now` avanza cada 15 s para que los tiempos corran entre recargas.
 */
export function useKitchenBoard(branchId: number, enabled: boolean, areaId = 0, every = 10_000) {
  const [board, setBoard] = useState<KitchenBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const alive = useRef(true)

  const load = useCallback(async () => {
    if (!enabled || !(branchId > 0)) {
      setLoading(false)
      return
    }
    try {
      const res: any = await APIs.getKitchenTickets(branchId, areaId || undefined)
      if (!alive.current) return
      setBoard(res?.data ?? null)
      setError('')
    } catch (e) {
      if (alive.current) setError(errorText(e, 'No se pudo cargar la cocina.'))
    } finally {
      if (alive.current) setLoading(false)
    }
  }, [branchId, enabled, areaId])

  useEffect(() => {
    alive.current = true
    setLoading(true)
    load()
    const poll = setInterval(load, every)
    const tick = setInterval(() => setNow(Date.now()), 15_000)
    return () => {
      alive.current = false
      clearInterval(poll)
      clearInterval(tick)
    }
  }, [load, every])

  /** Cambia el estado al instante en pantalla y lo confirma con el servidor (si falla, se recarga). */
  const setStatus = useCallback(
    async (itemIds: number[], status: KitchenItemStatus) => {
      setBoard((b) =>
        b
          ? {
              ...b,
              tickets: b.tickets
                .map((t) => {
                  const items = t.items.filter((i) => !(status === 'SERVED' && itemIds.includes(i.id))).map((i) => (itemIds.includes(i.id) ? { ...i, status } : i))
                  return { ...t, items, ready: items.length > 0 && items.every((i) => i.status === 'READY') }
                })
                .filter((t) => t.items.length > 0),
            }
          : b,
      )
      try {
        await APIs.setKitchenItemsStatus(itemIds, status)
      } catch (e) {
        showToast({ type: 'error', title: 'No se pudo actualizar', text: errorText(e, 'Intenta de nuevo.') })
      }
      load()
    },
    [load],
  )

  const setRush = useCallback(
    async (tabId: number, ticketNo: number, rush: boolean) => {
      setBoard((b) => (b ? { ...b, tickets: b.tickets.map((t) => (t.tabId === tabId && t.ticketNo === ticketNo ? { ...t, rush } : t)) } : b))
      try {
        await APIs.setKitchenRush(tabId, ticketNo, rush)
      } catch (e) {
        showToast({ type: 'error', title: 'No se pudo cambiar la prioridad', text: errorText(e, 'Intenta de nuevo.') })
      }
      load()
    },
    [load],
  )

  return { board, loading, error, now, load, setStatus, setRush }
}
