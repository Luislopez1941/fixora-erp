/**
 * Puente para agregar artículos a la ficha de cobro desde fuera de ella (el catálogo del encabezado): se deja el
 * artículo en espera y la ficha, al abrirse o si ya está abierta, lo agrega con su flujo normal (variantes, medidas…).
 */
export interface SheetItem {
  id: number
  name?: string
  /** Mostrar el aviso "… agregado a la ficha" */
  notify?: boolean
}

export const SHEET_ADD_EVENT = 'pos:add-to-sheet'

const pending: SheetItem[] = []

export function addToSheet(item: SheetItem) {
  pending.push(item)
  window.dispatchEvent(new Event(SHEET_ADD_EVENT))
}

/** Los artículos en espera (y vacía la lista). */
export function takePendingSheetItems(): SheetItem[] {
  return pending.splice(0)
}
