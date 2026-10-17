import React, { Suspense, lazy, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { TAXONOMY } from './taxonomy.generated'
import { useCan } from '../permissions/useCan'
import ComingSoon from './ComingSoon'

/**
 * Pantallas nuevas de la taxonomía. Cada una tiene su carpeta en `src/modules/<módulo>/<grupo>/<pantalla>/`:
 *   · mientras la carpeta no tenga `index.tsx` se muestra "en construcción" (el menú ya la lista),
 *   · en cuanto se crea `index.tsx` (export default de un componente) aparece sola: sin tocar rutas ni menú.
 * Las pantallas que ya existían (`live`) conservan sus rutas de siempre y no pasan por aquí.
 */
const SCREEN_FILES = import.meta.glob('/src/modules/**/index.tsx') as Record<string, () => Promise<{ default: React.ComponentType }>>

const BY_PATH = new Map(
  TAXONOMY.flatMap((module) =>
    module.groups.flatMap((group) =>
      group.screens.filter((screen) => !screen.live).map((screen) => [screen.path, { module, group, screen }] as const),
    ),
  ),
)

const ModuleScreen: React.FC = () => {
  const { pathname } = useLocation()
  const can = useCan()
  const userKind = useSelector((state: any) => state.user?.userKind)
  const roleLevel = useSelector((state: any) => state.user?.role?.level ?? state.user?.roleLevel ?? 99)
  const isOwner = (userKind === 'ACCOUNT' || userKind === 'SYSTEM') && roleLevel <= 1

  const relative = pathname.replace(/^\/auth\/?/, '').replace(/\/+$/, '')
  const entry = BY_PATH.get(relative)
  const loader = entry ? SCREEN_FILES[`/src/modules/${relative}/index.tsx`] : undefined
  const Screen = useMemo(() => (loader ? lazy(loader) : null), [loader])

  if (!entry) {
    return (
      <div style={{ padding: 24 }}>
        <p>No encontramos esta página.</p>
      </div>
    )
  }
  const { module, group, screen } = entry
  // Se exige el permiso de la pantalla, esté ya creada o en construcción (el menú tampoco la muestra sin él)
  if (!can(String(screen.permission))) {
    return <ComingSoon title='Sin acceso' module={module.label} group={group.label} message='No tienes permiso para ver esta pantalla.' />
  }
  if (Screen) {
    return (
      <Suspense fallback={<div style={{ padding: 24 }}>Cargando…</div>}>
        <Screen />
      </Suspense>
    )
  }
  return (
    <ComingSoon
      title={screen.label}
      module={module.label}
      group={group.label}
      developerHint={isOwner ? { folder: `${screen.folder}/index.tsx`, permission: String(screen.permission) } : undefined}
    />
  )
}

export default ModuleScreen
