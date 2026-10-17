import type { ModuleManifest, MenuLink } from './module.types'
import { TAXONOMY, SHORTCUTS } from './taxonomy.generated'

// Pantallas nuevas que ya tienen su archivo (src/modules/<ruta>/index.tsx): dejan de ser "en construcción" y pasan a exigir su permiso.
const BUILT = new Set(Object.keys(import.meta.glob('/src/modules/**/index.tsx')))
const isBuilt = (path: string) => BUILT.has(`/src/modules/${path}/index.tsx`)

/**
 * Registro de módulos del frontend.
 *
 * Ya NO se edita a mano: el menú sale de `scripts/modules/taxonomy.mjs` (módulos → grupos → pantallas) y se genera con
 * `node scripts/modules/generate.mjs`. Ahí se renombra, se agrega o se reordena; las `key` de los módulos son la clave de la
 * licencia y no cambian nunca.
 *
 * Las rutas son relativas al área privada (se les antepone `/auth/`).
 */
const fromTaxonomy: ModuleManifest[] = TAXONOMY.map((m) => {
  const children: MenuLink[] = m.groups.flatMap((g) =>
    g.screens.map((s) => ({
      key: `${m.key}.${s.key}`,
      label: s.label,
      path: s.path,
      requiredPermission: s.permission,
      ...(g.label ? { group: g.label } : {}),
      ...(s.live || isBuilt(s.path) ? {} : { placeholder: true }),
    })),
  )
  return {
    key: m.key,
    label: m.label,
    icon: m.icon,
    order: m.order,
    ...(m.requiredPermission ? { requiredPermission: m.requiredPermission } : {}),
    ...(m.ownerOnly ? { ownerOnly: true } : {}),
    ...(m.includedIn ? { includedIn: m.includedIn } : {}),
    children,
  }
})

const shortcuts: ModuleManifest[] = SHORTCUTS.map((s) => ({
  key: s.key,
  label: s.label,
  icon: s.icon,
  order: s.order,
  path: s.path,
  requiredPermission: s.requiredPermission,
  includedIn: s.includedIn,
}))

export const MODULES: ModuleManifest[] = [...fromTaxonomy, ...shortcuts]
