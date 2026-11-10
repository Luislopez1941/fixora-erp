/**
 * SIMULACIÓN del servicio de ajustes.
 *
 * Por ahora los ajustes se guardan en este navegador (con una pequeña espera, como si respondiera el servidor) para poder
 * revisar toda la experiencia. Cuando exista el backend, solo se cambia el cuerpo de estas tres funciones por las llamadas
 * al API (por ejemplo `ConfigurationAPIs.get('reports/conciliacion/ajustes')`, `.post(...)` y `.delete(...)`); el resto del
 * módulo no cambia porque solo usa `adjustmentsApi`.
 */
import type { Adjustment, AdjustmentInput } from './adjustments'

export const ADJUSTMENTS_SIMULATED = true

const STORAGE_KEY = 'fixora-conciliacion-ajustes-simulacion'
let memory: Adjustment[] | null = null

const read = (): Adjustment[] => {
  if (memory) return memory
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    memory = raw ? (JSON.parse(raw) as Adjustment[]) : []
  } catch {
    memory = []
  }
  return memory
}

const write = (list: Adjustment[]) => {
  memory = list
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* sin almacenamiento: queda solo en memoria mientras la pestaña esté abierta */
  }
}

const delay = <T,>(value: T) => new Promise<T>((resolve) => window.setTimeout(() => resolve(value), 250))
const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `adj-${Date.now()}-${Math.random().toString(36).slice(2)}`)

export const adjustmentsApi = {
  /** Todos los ajustes guardados. */
  list(): Promise<Adjustment[]> {
    return delay([...read()])
  },

  /** Guarda un ajuste. Un registro solo tiene un ajuste vigente: el nuevo reemplaza al anterior del mismo registro. */
  save(input: AdjustmentInput): Promise<Adjustment> {
    const adj: Adjustment = { ...input, id: newId(), createdAt: new Date().toISOString() }
    write([...read().filter((a) => !(a.side === input.side && a.key === input.key)), adj])
    return delay(adj)
  },

  /** Deshace un ajuste: el registro vuelve al resultado automático. */
  remove(id: string): Promise<void> {
    write(read().filter((a) => a.id !== id))
    return delay(undefined)
  },
}
