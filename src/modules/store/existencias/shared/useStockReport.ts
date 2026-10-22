import { useCallback, useEffect, useRef, useState } from 'react'
import { errorText } from './stockFormat'

/**
 * Carga un reporte paginado de existencias. `key` resume los filtros: cuando cambia se vuelve a pedir.
 * Descarta respuestas viejas si el usuario cambió filtros mientras cargaba.
 */
export function useStockReport<T = any>(fetcher: () => Promise<any>, key: string, enabled: boolean) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const seq = useRef(0)
  const fetchRef = useRef(fetcher)
  fetchRef.current = fetcher

  const reload = useCallback(async () => {
    const id = ++seq.current
    if (!enabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res: any = await fetchRef.current()
      if (id === seq.current) setData(res?.data ?? null)
    } catch (e) {
      if (id === seq.current) setError(errorText(e, 'No se pudo cargar la información.'))
    } finally {
      if (id === seq.current) setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    reload()
  }, [reload, key])

  return { data, loading, error, reload }
}

/** Valor con retraso (para la búsqueda mientras se escribe). */
export function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}
