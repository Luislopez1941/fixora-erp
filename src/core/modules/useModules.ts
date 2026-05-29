import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { MODULES } from './modules.config'
import type { ModuleManifest } from './module.types'
import { fetchCompanyActiveModules } from './kernel.service'

/** Lee userKind desde localStorage por si Redux aún no lo tiene al montar. */
function getUserKindFromStorage(): string | undefined {
  try {
    const raw = localStorage.getItem('user')
    if (raw) return JSON.parse(raw)?.userKind
  } catch {}
  return undefined
}

/**
 * Fallback: lee el primer companyId del JWT para sesiones antiguas
 * que no tengan activeCompanyId en Redux/localStorage.
 */
function getCompanyIdFromToken(): number | null {
  try {
    const token = localStorage.getItem('token-eco')
    if (!token) return null
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = JSON.parse(atob(parts[1]))
    const ids: number[] = payload.companyIds ?? []
    return ids.length > 0 ? ids[0] : null
  } catch {
    return null
  }
}

/**
 * Verifica si el usuario tiene un permiso.
 * `.manage` y `.create` de un módulo cubren `.view` del mismo módulo.
 */
function hasPermission(userPermissions: string[] = [], required?: string): boolean {
  if (!required) return true
  if (!userPermissions.length) return false

  // Permiso exacto
  if (userPermissions.includes(required)) return true

  // Si requiere .view y tiene .manage o .create del mismo módulo
  const [module, action] = required.split('.')
  if (action === 'view') {
    return userPermissions.some((p) => {
      const [m, a] = p.split('.')
      return m === module && (a === 'manage' || a === 'create')
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
  const activeCompanyId: number | null = useSelector(
    (state: any) => state.user?.activeCompanyId ?? null
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

  // Fallback a localStorage
  const userKind = userKindRedux ?? getUserKindFromStorage()
  const roleLevel = roleLevelRedux ?? 99

  // Solo SYSTEM / ACCOUNT con nivel 0-1 ven todo (super_admin, owner)
  const isOwner =
    (userKind === 'ACCOUNT' || userKind === 'SYSTEM') && roleLevel <= 1

  // Permisos del usuario (del rol + overrides)
  const userPermissions = useMemo(
    () => permissionsRedux ?? [],
    [permissionsRedux]
  )

  const [activeModuleIds, setActiveModuleIds] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(!isOwner)

  useEffect(() => {
    if (isOwner) {
      setActiveModuleIds(null)
      setLoading(false)
      return
    }

    const companyId = activeCompanyId ?? getCompanyIdFromToken()

    if (!companyId) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetchCompanyActiveModules(companyId).then((ids) => {
      if (!cancelled) {
        setActiveModuleIds(ids)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [activeCompanyId, isOwner])

  const modules = useMemo<ModuleManifest[]>(() => {
    return MODULES
      .filter((m) => m.enabled !== false)
      .map((m) => {
        if (isOwner || m.ownerOnly || m.key === 'dashboard') return m

        // Filtrar children por permisos individuales y por módulos activos de la empresa
        const filteredChildren = m.children?.filter((child) => {
          const hasPerm = hasPermission(userPermissions, child.requiredPermission)
          if (!hasPerm) return false
          if (!activeModuleIds) return true
          // Si el child tiene key, verificar que esté activo en la empresa
          if (child.key) return activeModuleIds.includes(child.key)
          return true
        })

        return {
          ...m,
          children: filteredChildren,
        }
      })
      .filter((m) => {
        // ownerOnly: solo visible para dueños (SYSTEM/ACCOUNT)
        if (m.ownerOnly) return isOwner

        // Dashboard siempre visible
        if (m.key === 'dashboard') return true

        // SYSTEM / ACCOUNT (nivel 0-1) ven todo sin restricción de permisos
        if (isOwner) return true

        // Para STAFF u otros: filtrar por permisos del rol
        const hasAccess = hasPermission(userPermissions, m.requiredPermission)
        if (!hasAccess) return false

        // Si tiene children pero todos fueron filtrados, no mostrar
        if (m.children && m.children.length === 0) return false

        // Filtrar por módulos activos de la empresa (solo para no-owners)
        if (!activeModuleIds) return true
        return activeModuleIds.includes(m.key)
      })
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  }, [activeModuleIds, isOwner, userPermissions])

  return { modules, loading, activeModuleIds }
}
