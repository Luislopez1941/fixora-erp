import { useCallback, useEffect, useState } from 'react'
import { showToast } from '../../../../utils/toast'
import { errorText } from '../../shared/restaurantTypes'

/** Carga una lista del backend y ofrece `run` para guardar (con aviso) y recargar. */
export function useMenuData<T>(fetcher: () => Promise<any>, enabled: boolean, fallback: T) {
  const [data, setData] = useState<T>(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }
    try {
      const res: any = await fetcher()
      setData(res?.data ?? fallback)
      setError('')
    } catch (e) {
      setError(errorText(e, 'No se pudo cargar la información.'))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, enabled])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const run = async (fn: () => Promise<any>, ok: string, after?: () => void) => {
    setBusy(true)
    try {
      await fn()
      showToast({ type: 'success', title: ok })
      after?.()
      await load()
      return true
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo guardar', text: errorText(e, 'Intenta de nuevo.') })
      return false
    } finally {
      setBusy(false)
    }
  }

  return { data, loading, error, busy, load, run }
}
