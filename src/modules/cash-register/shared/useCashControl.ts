import { useCallback, useEffect, useState } from 'react'
import APIs from '../../../services/APIs'
import { showToast } from '../../../utils/toast'
import { errorText } from './cashFormat'

export type ControlSection = 'limits' | 'opening' | 'closing' | 'authorization'

/** Carga y guarda una sección de Caja › Control (cada pantalla solo envía sus campos). */
export function useCashControl<T = any>(section: ControlSection, branchId: number, enabled: boolean) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!(branchId > 0) || !enabled) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res: any = await APIs.getCashControl(section, branchId)
      setData(res?.data ?? null)
    } catch (e) {
      setData(null)
      setError(errorText(e, 'No se pudo cargar la configuración.'))
    } finally {
      setLoading(false)
    }
  }, [section, branchId, enabled])

  useEffect(() => {
    reload()
  }, [reload])

  /** Guarda los campos indicados; devuelve true si se guardó. */
  const save = useCallback(
    async (patch: Record<string, any>, okText = 'Cambios guardados') => {
      setSaving(true)
      try {
        const res: any = await APIs.updateCashControl(section, branchId, patch)
        setData((d: any) => (d ? { ...d, config: res?.data?.config ?? d.config } : d))
        showToast({ type: 'success', title: okText })
        return true
      } catch (e) {
        showToast({ type: 'error', title: 'No se pudo guardar', text: errorText(e, 'Intenta de nuevo.') })
        return false
      } finally {
        setSaving(false)
      }
    },
    [section, branchId],
  )

  return { data, loading, saving, error, reload, save }
}

/** Campos que cambiaron entre el borrador y lo guardado (para no mandar de más). */
export const diffFields = (draft: Record<string, any>, saved: Record<string, any>) =>
  Object.fromEntries(Object.entries(draft).filter(([k, v]) => (v ?? null) !== (saved?.[k] ?? null)))
