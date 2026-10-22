import type { Denomination } from '../../shared/denominations'

export type { Denomination } from '../../shared/denominations'
export { keyOf, denomLabel } from '../../shared/denominations'

/** Respaldo de MXN por si el servidor no manda las denominaciones de la empresa en /cash-counts/expected. */
export const DEFAULT_DENOMINATIONS: Denomination[] = [
  { value: 1000, kind: 'BILL' }, { value: 500, kind: 'BILL' }, { value: 200, kind: 'BILL' }, { value: 100, kind: 'BILL' },
  { value: 50, kind: 'BILL' }, { value: 20, kind: 'BILL' }, { value: 20, kind: 'COIN' }, { value: 10, kind: 'COIN' },
  { value: 5, kind: 'COIN' }, { value: 2, kind: 'COIN' }, { value: 1, kind: 'COIN' }, { value: 0.5, kind: 'COIN' },
]
