import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { cachedRequest } from '../../../../services/requestCache'

export const EXPIRATIONS_PATH = '/auth/store/lotes-y-series/caducidades'

export interface ExpirationAlerts {
  expired: { lots: number; units: number }
  critical: { lots: number; units: number }
}

const REFRESH_MS = 10 * 60 * 1000

/**
 * Aviso de caducidades para el header y el dashboard: lotes vencidos y por vencer en 7 días de la empresa activa.
 * Se pide al montar, al volver a la pestaña y cada 10 minutos; sin permiso de Caducidades no se pide nada.
 */
export function useExpirationAlerts(): ExpirationAlerts | null {
  const can = useCan()
  const allowed = can('store.lotes-y-series-caducidades.view')
  const userState = useSelector((state: any) => state.user)
  const companyId = Number(userState?.activeCompanyId ?? userState?.companyId ?? userState?.companyIds?.[0] ?? 0)
  const [alerts, setAlerts] = useState<ExpirationAlerts | null>(null)

  useEffect(() => {
    if (!allowed || !(companyId > 0)) {
      setAlerts(null)
      return
    }
    let alive = true
    const load = () => {
      // Header y dashboard usan este hook a la vez: comparten la misma petición
      cachedRequest(`expiry-alerts:${companyId}`, 60_000, () => APIs.getExpirationAlerts(companyId))
        .then((res: any) => alive && setAlerts(res?.data ?? null))
        .catch(() => alive && setAlerts(null))
    }
    load()
    const timer = setInterval(load, REFRESH_MS)
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [allowed, companyId])

  return alerts
}

/** Total de lotes que piden atención (vencidos + por vencer en 7 días). */
export const alertCount = (a: ExpirationAlerts | null) => (a ? a.expired.lots + a.critical.lots : 0)
