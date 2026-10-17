import { useCallback, useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import APIs from '../../../services/APIs'
import { errorText, unwrap } from './ui'

/** Periodos contables de la empresa y las acciones de cerrar / reabrir (requieren accounting.manage en el servidor). */
export const usePeriods = (companyId: number) => {
  const [periods, setPeriods] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    if (!companyId) return setPeriods([])
    setLoading(true)
    try {
      setPeriods(unwrap(await APIs.getAccountingPeriods(companyId)))
    } catch (error) {
      setPeriods([])
      Swal.fire('No se pudieron cargar los periodos', errorText(error, 'Intenta de nuevo.'), 'error')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => { reload() }, [reload])

  const run = async (action: 'close' | 'reopen', year: number, month: number) => {
    const call = action === 'close' ? APIs.closeAccountingPeriod : APIs.reopenAccountingPeriod
    await call({ companyId, year, month })
  }

  /** Cierra o reabre varios periodos en orden; se detiene en el primer error y lo informa. */
  const change = async (action: 'close' | 'reopen', list: { year: number; month: number }[]) => {
    setBusy(true)
    try {
      for (const p of list) await run(action, p.year, p.month)
      return true
    } catch (error) {
      Swal.fire(action === 'close' ? 'No se pudo cerrar' : 'No se pudo reabrir', errorText(error, 'Intenta de nuevo.'), 'error')
      return false
    } finally {
      setBusy(false)
      reload()
    }
  }

  return { periods, loading, busy, reload, change }
}
