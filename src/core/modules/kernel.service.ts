import ConfigurationAPIs from '../../services/configurationAPIs'
import { cachedRequest, invalidateRequests } from '../../services/requestCache'

/** Forma de un módulo reportado por el backend (/kernel/modules). */
export interface BackendModule {
  key: string
  name: string
  version: string
  enabled?: boolean
  core?: boolean
}

/**
 * Consulta los módulos ACTIVOS en el backend (Kernel).
 */
export async function fetchBackendModules(): Promise<BackendModule[]> {
  try {
    return await ConfigurationAPIs.get<BackendModule[]>('kernel/modules')
  } catch {
    return []
  }
}

/**
 * Consulta los IDs de los módulos activos (habilitados) para una sucursal.
 * null del backend se trata como [] (ningún módulo activo).
 */
export async function fetchBranchActiveModules(branchId: number): Promise<string[] | null> {
  try {
    // Sidebar, menú y demás usan el mismo hook: una sola petición por sucursal (se invalida al activar/desactivar módulos)
    const res = await cachedRequest(`branch-modules:${branchId}`, 30_000, () =>
      ConfigurationAPIs.get<{ moduleIds: string[] | null }>(`branch/${branchId}/active-modules`)
    )
    // null = sin módulos configurados → tratar como [] (ninguno activo)
    return res.moduleIds ?? []
  } catch {
    return []
  }
}

export interface StoreModule {
  moduleId:     string
  name:         string
  description:  string
  enabled:      boolean
  priceMonthly: number
  priceAnnual:  number
  currency:     string
  hasPricing:   boolean
}

/**
 * Carga la tienda de módulos para una sucursal (precios + estado actual).
 */
export async function fetchModuleStore(branchId: number): Promise<StoreModule[]> {
  try {
    return await ConfigurationAPIs.get<StoreModule[]>(`branch/${branchId}/module-store`)
  } catch {
    return []
  }
}

/**
 * Activa o desactiva un módulo para la sucursal.
 */
export async function toggleModuleStore(
  branchId: number,
  moduleId:  string,
  enabled:   boolean,
): Promise<void> {
  await ConfigurationAPIs.put(`branch/${branchId}/module-store/${moduleId}`, { enabled })
  invalidateRequests('branch-modules:')
}
