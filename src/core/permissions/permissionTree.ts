import { TAXONOMY } from '../modules/taxonomy.generated'

/**
 * Árbol de permisos tal como se ve en el menú lateral, compartido por "Roles" y "Permisos avanzados" de Usuarios:
 * módulos y pantallas en el orden del sidebar, pantallas agrupadas por su grupo y permisos antiguos en la pantalla que les toca.
 */
export type PermissionItem = {
  id: number
  name: string
  description: string
  assigned?: boolean
  actionLabel?: string
}

export type SubmoduleGroup = {
  key: string
  label: string
  permissions: PermissionItem[]
}

export type ModuleGroup = {
  key: string
  label: string
  permissions: PermissionItem[]
  submodules: SubmoduleGroup[]
}

/** Módulos que no se muestran al dar permisos: la tienda de módulos es solo del dueño. */
export const HIDDEN_PERMISSION_MODULES = ['module-store']

/** Las pantallas nuevas de Caja ("cash-register") se muestran dentro de Caja ("cash"). */
export const PERMISSION_MODULE_ALIAS: Record<string, string> = { 'cash-register': 'cash' }

// Orden del menú lateral: módulos y pantallas en el orden de la taxonomía (lo que no está ahí va al final, por nombre)
const MODULE_ORDER = new Map<string, number>()
const SCREEN_ORDER = new Map<string, number>()
const SCREEN_NAME = new Map<string, string>() // nombre de la pantalla como aparece en el menú ("Grupo › Pantalla")
TAXONOMY.forEach((m, mi) => {
  MODULE_ORDER.set(m.key, mi)
  let n = 0
  for (const g of m.groups) {
    for (const sc of g.screens) {
      const [moduleKey, subKey] = String(sc.permission).split('.')
      if (!MODULE_ORDER.has(moduleKey)) MODULE_ORDER.set(moduleKey, mi)
      if (subKey && subKey !== 'view') {
        SCREEN_ORDER.set(`${moduleKey}.${subKey}`, mi * 1000 + n++)
        if (sc.live) SCREEN_NAME.set(`${moduleKey}.${subKey}`, g.label ? `${g.label} › ${sc.label}` : sc.label)
      }
    }
  }
})

// Permisos antiguos que colgaban del módulo y ahora viven en la pantalla del menú a la que corresponden
const PERMISSION_HOME: Record<string, string> = {
  'sales.create': 'sales.sheet', // Terminal POS
  'sales.cancel': 'sales.devoluciones-y-cancelaciones-solicitudes-de-cancelacion',
  'sales.return': 'sales.devoluciones-y-cancelaciones-devoluciones',
  'sales.return.override': 'sales.devoluciones-y-cancelaciones-devoluciones',
}

function rehomePermissions(list: ModuleGroup[]): ModuleGroup[] {
  return list.map((mod) => {
    const subs = mod.submodules.map((sub) => ({ ...sub, permissions: [...sub.permissions] }))
    const moduleLevel: PermissionItem[] = []
    const place = (perm: PermissionItem) => {
      const target = PERMISSION_HOME[perm.name]
      const sub = target ? subs.find((x) => `${mod.key}.${x.key}` === target) : undefined
      if (!sub) return false
      sub.permissions.push(perm)
      return true
    }
    for (const perm of mod.permissions) if (!place(perm)) moduleLevel.push(perm)
    for (const sub of subs) {
      const keep: PermissionItem[] = []
      for (const perm of sub.permissions) {
        const target = PERMISSION_HOME[perm.name]
        if (target && target !== `${mod.key}.${sub.key}` && place(perm)) continue
        keep.push(perm)
      }
      sub.permissions = keep
    }
    return { ...mod, permissions: moduleLevel, submodules: subs.filter((sub) => sub.permissions.length > 0) }
  })
}

export function orderModules(input: ModuleGroup[]): ModuleGroup[] {
  const far = Number.MAX_SAFE_INTEGER
  const list = rehomePermissions(input)
  return [...list]
    .sort((a, b) => (MODULE_ORDER.get(a.key) ?? far) - (MODULE_ORDER.get(b.key) ?? far) || a.label.localeCompare(b.label))
    .map((mod) => ({
      ...mod,
      submodules: mod.submodules.map((sub) => ({ ...sub, label: SCREEN_NAME.get(`${mod.key}.${sub.key}`) ?? sub.label })).sort((a, b) => (SCREEN_ORDER.get(`${mod.key}.${a.key}`) ?? SCREEN_ORDER.get(`cash-register.${a.key}`) ?? far) - (SCREEN_ORDER.get(`${mod.key}.${b.key}`) ?? SCREEN_ORDER.get(`cash-register.${b.key}`) ?? far)),
    }))
}

// Las pantallas nuevas llevan "Grupo › Pantalla" en su nombre: se agrupan por el grupo y se muestra solo la pantalla
const SEP = ' › '
export function groupSubmodules(subs: SubmoduleGroup[]): { group: string; subs: SubmoduleGroup[] }[] {
  const map = new Map<string, SubmoduleGroup[]>()
  for (const sub of subs) {
    const i = sub.label.indexOf(SEP)
    const group = i >= 0 ? sub.label.slice(0, i) : ''
    const shown = i >= 0 ? { ...sub, label: sub.label.slice(i + SEP.length) } : sub
    map.set(group, [...(map.get(group) ?? []), shown])
  }
  // Las pantallas sin grupo primero
  return Array.from(map.entries()).sort(([a], [b]) => (a === '' ? -1 : b === '' ? 1 : 0)).map(([group, list]) => ({ group, subs: list }))
}

