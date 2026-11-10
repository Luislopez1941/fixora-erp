export interface MenuCategory {
  id: number
  menuId: number
  name: string
  position: number
  active: boolean
  menu?: { id: number; name: string }
  _count?: { entries: number }
}

export interface Menu {
  id: number
  name: string
  description: string | null
  branchId: number | null
  days: number[]
  startTime: string | null
  endTime: string | null
  active: boolean
  dishCount: number
  categories: MenuCategory[]
}

export interface DishAddon {
  itemId: number
  name: string
  price: number | null
  basePrice: number | null
}

export interface Dish {
  id: number
  itemId: number
  name: string
  price: number | null
  image: string | null
  categoryId: number | null
  kindId: number | null
  effectiveKind: string | null
  category: string | null
  description: string | null
  prepMinutes: number | null
  batchSize: number | null
  allergens: string[]
  tags: string[]
  active: boolean
  menus: { menuId: number; menu: string; categoryId: number | null; category: string | null }[]
  modifierGroupIds: number[]
  addons: DishAddon[]
  availability?: { available: boolean; reason: string | null; until: string | null }
}

export interface ModifierOption {
  id: number
  groupId: number
  name: string
  priceDelta: number
  active: boolean
}

export interface ModifierGroup {
  id: number
  name: string
  required: boolean
  minSelect: number
  maxSelect: number
  active: boolean
  dishCount: number
  options: ModifierOption[]
}

export interface CatalogItem {
  id: number
  name: string
  code: string | null
  price: number | null
  image: string | null
  category: string | null
  isDish: boolean
}

export const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
export const DAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

/** "Lun a vie · 08:00–12:00" / "Todos los días · todo el día" */
export const scheduleText = (m: Pick<Menu, 'days' | 'startTime' | 'endTime'>) => {
  const days = [...m.days].sort()
  let dayText = 'Todos los días'
  if (days.length && days.length < 7) {
    const consecutive = days.every((d, i) => i === 0 || d === days[i - 1] + 1)
    dayText = consecutive && days.length > 2 ? `${DAY_NAMES[days[0] - 1]} a ${DAY_NAMES[days[days.length - 1] - 1]}` : days.map((d) => DAY_NAMES[d - 1]).join(', ')
    dayText = dayText.charAt(0).toUpperCase() + dayText.slice(1)
  }
  return `${dayText} · ${m.startTime && m.endTime ? `${m.startTime}–${m.endTime}` : 'todo el día'}`
}

export const splitList = (text: string) =>
  text
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

/** Minutos para preparar `quantity` piezas: por tandas si el platillo tiene piezas por tanda, fijo si no. */
export const prepTime = (minutesPerBatch: number | null, batchSize: number | null, quantity: number) => {
  if (!minutesPerBatch) return null
  if (!batchSize) return minutesPerBatch
  return Math.ceil(Math.max(1, quantity) / batchSize) * minutesPerBatch
}

export const prepSummary = (minutesPerBatch: number | null, batchSize: number | null) =>
  !minutesPerBatch ? '' : batchSize ? `${minutesPerBatch} min por tanda de ${batchSize}` : `${minutesPerBatch} min`
