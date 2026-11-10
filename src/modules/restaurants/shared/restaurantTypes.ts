/** Tipos y formatos compartidos del POS de restaurante (las respuestas de /restaurants/*). */

export type TabType = 'DINE_IN' | 'TAKEOUT' | 'COUNTER' | 'DELIVERY'
export type TabStatus = 'OPEN' | 'BILL_REQUESTED' | 'PAID' | 'CANCELLED'
export type ItemStatus = 'PENDING' | 'SENT' | 'READY' | 'SERVED' | 'CANCELLED'

export interface TabSummary {
  id: number
  folio: number
  type: TabType
  status: TabStatus
  tableId: number | null
  label: string | null
  guests: number
  waiterName: string | null
  openedAt: string
  billRequestedAt: string | null
  itemCount: number
  pendingCount: number
  subtotal: number
}

export interface RestaurantTable {
  id: number
  name: string
  seats: number
  shape: 'square' | 'round' | 'bar'
  active: boolean
  position: number
  diningRoomId: number
  tabs: TabSummary[]
}

export interface DiningRoom {
  id: number
  name: string
  active: boolean
  position: number
  tables: RestaurantTable[]
}

export interface Floor {
  companyId: number
  rooms: DiningRoom[]
  otherTabs: TabSummary[]
}

export interface TabItem {
  id: number
  itemId: number
  itemVariationId: number | null
  name: string
  quantity: string | number
  unitPrice: string | number
  modifiers: string[] | null
  notes: string | null
  seat: number | null
  course: number
  status: ItemStatus
  kitchenTicketNo: number | null
  sentAt: string | null
  cancelReason: string | null
}

export interface Tab {
  id: number
  folio: number
  type: TabType
  typeLabel: string
  status: TabStatus
  tableId: number | null
  table: { id: number; name: string; diningRoom: { id: number; name: string } } | null
  label: string | null
  guests: number
  waiterName: string | null
  customerId: number | null
  notes: string | null
  discount: string | number
  tipAmount: string | number
  kitchenTickets: number
  openedAt: string
  closedAt: string | null
  cancelReason: string | null
  items: TabItem[]
  subtotal: number
  pendingCount: number
  sale: {
    id: number
    folio: number | null
    subtotal: string | number
    tax: string | number
    discount: string | number
    total: string | number
    createdAt: string
    payments: { amount: string | number; reference: string | null; paymentMethod: { id: number; name: string; code: string } | null }[]
  } | null
}

export interface KitchenTicket {
  ticketNo: number
  sentAt: string
  /** Minutos que tarda la comanda (el platillo más lento, por tandas); vacío si ningún platillo tiene tiempo */
  estimatedMinutes?: number | null
  items: { estimatedMinutes?: number | null; id: number; name: string; quantity: number; modifiers: string[]; notes: string | null; seat: number | null; course: number; station: string | null }[]
}

/** IVA con el que Ventas calcula el total (los precios del catálogo van antes de impuestos). */
export const IVA_RATE = 0.16

export const TYPE_LABEL: Record<TabType, string> = {
  DINE_IN: 'Mesa',
  TAKEOUT: 'Para llevar',
  COUNTER: 'Mostrador',
  DELIVERY: 'Domicilio',
}

export const TYPE_ICON: Record<TabType, string> = {
  DINE_IN: 'table_restaurant',
  TAKEOUT: 'takeout_dining',
  COUNTER: 'storefront',
  DELIVERY: 'delivery_dining',
}

export const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  PENDING: 'Sin enviar',
  SENT: 'En cocina',
  READY: 'Listo',
  SERVED: 'Servido',
  CANCELLED: 'Cancelado',
}

export const money = (n: number | string | null | undefined) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(Number(n) || 0)

export const qty = (n: number | string) => {
  const v = Number(n)
  return Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

/** "12 min", "1 h 05 min" desde una fecha */
export const elapsed = (iso: string | null | undefined, now = Date.now()) => {
  if (!iso) return ''
  const min = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000))
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`
}

export const dateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

/** Nombre corto de la cuenta: "Mesa 4", "Para llevar · Ana", "Mostrador #12" */
export const tabTitle = (t: { type: TabType; folio: number; label?: string | null; table?: { name: string } | null }) => {
  if (t.type === 'DINE_IN' && t.table) return t.label ? `${t.table.name} · ${t.label}` : t.table.name
  return t.label ? `${TYPE_LABEL[t.type]} · ${t.label}` : `${TYPE_LABEL[t.type]} #${t.folio}`
}

export const errorText = (e: any, fallback: string) => {
  const m = e?.response?.data?.message ?? e?.message
  if (Array.isArray(m)) return m.join(', ')
  return m ? String(m) : fallback
}

export const liveItems = (tab: Pick<Tab, 'items'> | null | undefined) => (tab?.items ?? []).filter((i) => i.status !== 'CANCELLED')
