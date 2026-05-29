import ConfigurationAPIs from '../../services/configurationAPIs'

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
 * Consulta los IDs de los módulos activos (habilitados) para una empresa.
 * Retorna null si no se puede obtener (fallback: mostrar todos).
 */
export async function fetchCompanyActiveModules(companyId: number): Promise<string[] | null> {
  try {
    const res = await ConfigurationAPIs.get<{ moduleIds: string[] | null }>(
      `companies/${companyId}/active-modules`
    )
    return res.moduleIds  // null = empresa nueva → fallback (mostrar todos)
  } catch {
    return null
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
 * Carga la tienda de módulos para una empresa (precios + estado actual).
 */
export async function fetchModuleStore(companyId: number): Promise<StoreModule[]> {
  try {
    return await ConfigurationAPIs.get<StoreModule[]>(`companies/${companyId}/module-store`)
  } catch {
    return []
  }
}

/**
 * Activa o desactiva un módulo para la empresa.
 */
export async function toggleModuleStore(
  companyId: number,
  moduleId:  string,
  enabled:   boolean,
): Promise<void> {
  await ConfigurationAPIs.put(`companies/${companyId}/module-store/${moduleId}`, { enabled })
}
