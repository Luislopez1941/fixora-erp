import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { MODULES } from './modules.config'
import type { ModuleManifest } from './module.types'
import { fetchBranchActiveModules } from './kernel.service'
import APIs from '../../services/APIs'
import { cachedRequest } from '../../services/requestCache'

/** Lee userKind desde localStorage por si Redux aún no lo tiene al montar. */
function getUserKindFromStorage(): string | undefined {
  try {
    const raw = localStorage.getItem('user')
    if (raw) return JSON.parse(raw)?.userKind
  } catch {}
  return undefined
}

/** Lee companyIds desde localStorage por si Redux aún no lo tiene al montar. */
function getCompanyIdsFromStorage(): number[] {
  try {
    const raw = localStorage.getItem('user')
    if (raw) return JSON.parse(raw)?.companyIds ?? []
  } catch {}
  return []
}

/** Lee branchId desde localStorage por si Redux aún no lo tiene al montar. */
function getBranchIdFromStorage(): number | null {
  try {
    const raw = localStorage.getItem('user')
    if (raw) return JSON.parse(raw)?.activeBranchId ?? null
  } catch {}
  return null
}

/** Fallback: lee el branchId del JWT para sesiones antiguas. */
function getBranchIdFromToken(): number | null {
  try {
    const token = localStorage.getItem('token-fixora')
    if (!token) return null
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload.branchId ?? null
  } catch {
    return null
  }
}

/**
 * Verifica si el usuario tiene un permiso.
 * `.manage` y `.create` de un módulo cubren `.view` del mismo módulo.
 */
function hasPermission(userPermissions: string[] = [], required?: string | string[]): boolean {
  if (!required || (Array.isArray(required) && required.length === 0)) return true
  // Varios permisos: basta con tener cualquiera
  if (Array.isArray(required)) return required.some((r) => hasPermission(userPermissions, r))
  if (!userPermissions.length) return false

  // Permiso exacto
  if (userPermissions.includes(required)) return true

  // Si requiere .view y tiene .manage o .create del MISMO módulo (permiso de módulo) o de la MISMA pantalla (permiso de pantalla).
  // Un permiso de otra pantalla del módulo no cuenta: cada pantalla se muestra solo si su propio permiso está marcado.
  const need = required.split('.')
  if (need[need.length - 1] === 'view') {
    return userPermissions.some((p) => {
      const have = p.split('.')
      const action = have[have.length - 1]
      return have.length === need.length && have.slice(0, -1).join('.') === need.slice(0, -1).join('.') && (action === 'manage' || action === 'create')
    })
  }

  return false
}

/**
 * Devuelve los módulos habilitados para la empresa activa del usuario.
 *
 * Flujo (estilo SAP/Odoo):
 *  1. Lee activeCompanyId de Redux (reactivo — cambia al seleccionar empresa).
 *  2. Fallback al JWT si no hay activeCompanyId en estado.
 *  3. Consulta GET /companies/:companyId/active-modules.
 *  4. Filtra MODULES según permisos del usuario (role/permissions).
 *  5. `dashboard` siempre visible (shell del ERP).
 *  6. Si no hay companyId o falla el backend → muestra todos.
 */
export function useModules() {
  const activeBranchId: number | null = useSelector(
    (state: any) => state.user?.activeBranchId ?? null
  )
  const userKindRedux: string | undefined = useSelector(
    (state: any) => state.user?.userKind
  )
  const roleLevelRedux: number | undefined = useSelector(
    (state: any) => state.user?.role?.level
  )
  const permissionsRedux: string[] | undefined = useSelector(
    (state: any) => state.user?.permissions
  )
  const companyIdsRedux: number[] = useSelector(
    (state: any) => state.user?.companyIds ?? []
  )
  const userIdRedux: number | undefined = useSelector(
    (state: any) => state.user?.id ?? state.user?._id
  )

  // Fallback a localStorage
  const userKind = userKindRedux ?? getUserKindFromStorage()
  const roleLevel = roleLevelRedux ?? 99
  const companyIds = companyIdsRedux.length > 0 ? companyIdsRedux : getCompanyIdsFromStorage()

  // Solo SYSTEM / ACCOUNT con nivel 0-1 ven todo (super_admin, owner)
  const isOwner =
    (userKind === 'ACCOUNT' || userKind === 'SYSTEM') && roleLevel <= 1

  // Permisos del usuario (del rol + overrides)
  const userPermissions = useMemo(
    () => permissionsRedux ?? [],
    [permissionsRedux]
  )

  const [activeModuleIds, setActiveModuleIds] = useState<string[] | null>(null)
  const [totalBranches, setTotalBranches] = useState(0)
  // Ids de TODAS las sucursales de las empresas del usuario (para el dueño).
  const [allBranchIds, setAllBranchIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Petición para contar sucursales del usuario
    const countBranches = async () => {
      try {
        const userId = userIdRedux
        if (!userId) {
          setTotalBranches(0)
          return
        }
        const response: any = await cachedRequest(`user:${userId}`, 30_000, () => APIs.getUserById(userId))
        if (response?.status === 'success' && response?.data?.userCompanies) {
          let count = 0
          const ids: number[] = []
          response.data.userCompanies.forEach((uc: any) => {
            count += uc.company?.branches?.length || 0
            ;(uc.company?.branches ?? []).forEach((b: any) => b?.id && ids.push(b.id))
          })
          setTotalBranches(count)
          setAllBranchIds(ids)
        }
      } catch (error) {
        console.error('Error al contar sucursales:', error)
      }
    }
    countBranches()
  }, [userIdRedux])

  useEffect(() => {
    // Antes: un owner con más de una empresa se quedaba con un menú fijo
    // (MULTI_COMPANY_MODULE_KEYS) sin importar su licencia. Eso contradice todo
    // el sistema de módulos por licencia — el sidebar siempre debe reflejar lo
    // que la licencia permite, tenga 1 empresa o varias.
    const branchId = activeBranchId ?? getBranchIdFromStorage() ?? getBranchIdFromToken()

    if (!branchId) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    // Dueño: ve la UNIÓN de los módulos habilitados en todas sus sucursales (no solo
    // la activa). Staff: solo los de su sucursal. Si alguna sucursal responde null
    // ("sin configurar" = mostrar todo), se muestra todo.
    const branchIds = isOwner
      ? Array.from(new Set([branchId, ...allBranchIds]))
      : [branchId]

    Promise.all(branchIds.map((id) => fetchBranchActiveModules(id))).then((results) => {
      if (cancelled) return
      const merged = results.some((r) => r === null)
        ? null
        : Array.from(new Set(results.flatMap((r) => r ?? [])))
      setActiveModuleIds(merged)
      setLoading(false)
    })

    return () => { cancelled = true }
    // companyIds se compara por valor: el selector devuelve un arreglo nuevo en cada
    // render y con la referencia el efecto repetía el GET active-modules sin parar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchId, isOwner, companyIds.join(','), allBranchIds.join(',')])

  // Un módulo está activo si la licencia trae su clave o la de algún módulo que lo incluye (ver includedIn)
  const isModuleActive = (m: ModuleManifest, ids: string[]) =>
    ids.includes(m.key) || (m.includedIn ?? []).some((key) => ids.includes(key))

  const modules = useMemo<ModuleManifest[]>(() => {
    return MODULES
      .filter((m) => m.enabled !== false)
      .map((m) => {
        // Dashboard y ownerOnly siempre se muestran tal cual
        // El panel siempre se ve, pero sus pantallas respetan el permiso de cada una
        if (m.key === 'dashboard') {
          return { ...m, children: m.children?.filter((c) => isOwner || hasPermission(userPermissions, c.requiredPermission)) }
        }
        if (m.ownerOnly) return isOwner ? m : { ...m, children: [] }

        // Filtrar children por permisos, módulos activos de la empresa,
        // y para Empresas/Sucursales: solo si tiene más de una
        const filteredChildren = m.children?.filter((child) => {
          // Ocultar Empresas dentro de Configuraciones si solo tiene 1 empresa
          if (child.key === 'configurations.companies' && companyIds.length <= 1) return false
          // Ocultar Sucursales dentro de Configuraciones si solo tiene 1 sucursal total
          if (child.key === 'configurations.branch' && totalBranches <= 1) return false

          if (isOwner) {
            // Owners: si el módulo padre está activo, mostrar todos los children
            if (!activeModuleIds) return true
            return isModuleActive(m, activeModuleIds)
          }
          // Staff: filtrar por permisos; si el padre está activo, mostrar child
          // Cada pantalla (también las que están en construcción) se muestra solo si el rol/usuario tiene su permiso marcado
          const hasPerm = hasPermission(userPermissions, child.requiredPermission)
          if (!hasPerm) return false
          if (!activeModuleIds) return true
          return isModuleActive(m, activeModuleIds)
        })

        return {
          ...m,
          children: filteredChildren,
        }
      })
      .filter((m) => {
        // Dashboard siempre visible
        if (m.key === 'dashboard') return true

        // ownerOnly: solo visible para dueños
        if (m.ownerOnly) {
          return isOwner
        }

        // Si tiene children pero todos fueron filtrados, no mostrar
        if (m.children && m.children.length === 0) return false

        // Owners: ver módulos activos de la empresa (sin restricción de permisos)
        if (isOwner) {
          if (!activeModuleIds) return true
          return isModuleActive(m, activeModuleIds)
        }

        // Staff: filtrar por permisos del rol
        const hasAccess = hasPermission(userPermissions, m.requiredPermission)
        if (!hasAccess) return false

        // Filtrar por módulos activos de la empresa
        if (!activeModuleIds) return true
        return isModuleActive(m, activeModuleIds)
      })
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  }, [activeModuleIds, isOwner, userPermissions, companyIds, totalBranches])

  return { modules, loading, activeModuleIds }
}
