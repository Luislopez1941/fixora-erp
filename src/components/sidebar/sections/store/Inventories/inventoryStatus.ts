/** Estados de existencia del inventario: etiqueta y clase de color (comunes a la lista, la fila y el detalle). */
export type StockStatus = 'disponible' | 'stock_bajo' | 'agotado' | 'sin_rastreo'

export const STATUS_LABEL: Record<StockStatus, string> = {
  disponible: 'En stock',
  stock_bajo: 'Stock bajo',
  agotado: 'Desabasto',
  sin_rastreo: 'Sin rastreo',
}

export const STATUS_CLASS: Record<StockStatus, string> = {
  disponible: 'is-ok',
  stock_bajo: 'is-low',
  agotado: 'is-out',
  sin_rastreo: 'is-none',
}

export const qty = (n: number | null | undefined) => Number(n ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 2 })
