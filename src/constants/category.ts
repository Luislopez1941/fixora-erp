export const CATEGORY_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const

export type CategoryStatus = (typeof CATEGORY_STATUS)[keyof typeof CATEGORY_STATUS]

export const CATEGORY_STATUS_LABELS: Record<CategoryStatus, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
}

export const CATEGORY_STATUS_OPTIONS = (Object.keys(CATEGORY_STATUS) as CategoryStatus[]).map((value) => ({
  value,
  label: CATEGORY_STATUS_LABELS[value],
}))

/** Normaliza respuesta GET lista (array directo o envuelto). */
export function normalizeCategoryList(res: unknown): any[] {
  if (Array.isArray(res)) return res
  if (res && typeof res === 'object' && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: any[] }).data
  }
  if (res && typeof res === 'object' && Array.isArray((res as { categories?: unknown }).categories)) {
    return (res as { categories: any[] }).categories
  }
  return []
}

export function categoryId(item: { id?: number | string; _id?: number | string }): string | number | undefined {
  return item.id ?? item._id
}

/** Fila UI antes de armar el JSON de subcategorías (nivel 1 con hijos solo-título). */
export type SubcategoryDraftRow = {
  title: string
  nestedTitles: string[]
  nestedDraft: string
}

export function createEmptySubcategoryDraftRow(): SubcategoryDraftRow {
  return { title: '', nestedTitles: [], nestedDraft: '' }
}

/**
 * Construye el arreglo `subcategories` del body (árbol: título, hijos `{ title }[]`).
 */
export function buildSubcategoriesTreePayload(rows: SubcategoryDraftRow[]): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  for (const row of rows) {
    const title = row.title.trim()
    if (!title) continue
    const node: Record<string, unknown> = { title }
    const leaves = row.nestedTitles
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => ({ title: t }))
    if (leaves.length) node.subcategories = leaves
    out.push(node)
  }
  return out
}

/** ID de sucursal para listar/crear categorías (persistido junto al picker). */
export function readCategoryBranchId(): number {
  const br = Number(localStorage.getItem('categories-picker-branch-id'))
  if (!Number.isNaN(br) && br >= 1) return br
  return Number(localStorage.getItem('categories-store-id') || '1')
}
