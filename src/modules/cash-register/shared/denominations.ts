/** Billete o moneda que se cuenta en un arqueo (las activas las define Control › Denominaciones). */
export type Denomination = { value: number; kind: 'BILL' | 'COIN' }

export const keyOf = (d: Denomination) => `${d.kind}:${d.value}`
export const denomLabel = (v: number) => (v < 1 ? `${Math.round(v * 100)}¢` : `$${v.toLocaleString('es-MX')}`)
