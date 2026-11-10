export type KitchenItemStatus = 'SENT' | 'READY' | 'SERVED'

export interface KitchenItem {
  id: number
  name: string
  quantity: number
  modifiers: string[]
  notes: string | null
  seat: number | null
  course: number
  status: KitchenItemStatus
  station: string | null
  areaId: number | null
  readyAt: string | null
}

export interface KitchenTicket {
  key: string
  tabId: number
  ticketNo: number
  folio: number
  place: string
  room: string | null
  guests: number
  waiter: string | null
  sentAt: string
  elapsedMinutes: number
  estimatedMinutes: number | null
  late: boolean
  rush: boolean
  ready: boolean
  items: KitchenItem[]
}

export interface Station {
  id: number
  name: string
  production: boolean
}

export interface KitchenBoard {
  now: string
  stations: Station[]
  tickets: KitchenTicket[]
}

/** Minutos desde que se envió, con el reloj local (la lista se recarga cada pocos segundos). */
export const elapsedSince = (iso: string, now: number) => Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000))

/** a tiempo | por vencer (80 % del estimado) | atrasada */
export const timing = (elapsed: number, estimated: number | null): 'ok' | 'near' | 'late' => {
  if (estimated == null) return elapsed >= 20 ? 'late' : elapsed >= 15 ? 'near' : 'ok'
  if (elapsed > estimated) return 'late'
  if (elapsed >= estimated * 0.8) return 'near'
  return 'ok'
}

export const COURSE = ['', 'Entrada', 'Plato fuerte', 'Postre']
