import { MAX_COMBINATIONS, TemplateAxis, sameValue } from '../../../../../../modules/catalogos/productos-y-servicios/variantes/variantTypes'

/** Una combinación del artículo tal como la edita el modal (precio y códigos como texto mientras se escriben). */
export interface VariantRow {
  id?: number
  option1?: string | null
  option2?: string | null
  option3?: string | null
  label?: string | null
  sku: string
  barcode: string
  price: string
  images: string[]
  /** El precio se cambió a mano: "Recalcular precios" no lo pisa sin preguntar */
  manual?: boolean
  // Variaciones viejas sin opciones (antes de la plantilla)
  color?: string
  colorHex?: string
  size?: string
}

export const optionOf = (row: VariantRow, position: number) => (row as any)[`option${position}`] as string | null | undefined
export const rowKey = (row: VariantRow) => [row.option1, row.option2, row.option3].map((v) => (v ?? '').trim().toLocaleLowerCase('es-MX')).join('|')
export const labelOf = (row: VariantRow) => [row.option1, row.option2, row.option3].filter(Boolean).join(' / ') || [row.size, row.color].filter(Boolean).join(' / ')

/** Lo que llega del servidor (ambos formatos) → filas editables. Solo las activas. */
export const rowsFromItem = (variations: any[]): VariantRow[] =>
  (variations ?? [])
    .filter((v) => v && v.active !== false)
    .map((v) => ({
      id: v.id,
      option1: v.option1 ?? null,
      option2: v.option2 ?? null,
      option3: v.option3 ?? null,
      label: v.label ?? null,
      sku: v.sku ?? '',
      barcode: v.barcode ?? '',
      price: v.price != null ? String(v.price) : '',
      images: Array.isArray(v.images) ? v.images : [],
      color: v.color,
      colorHex: v.colorHex,
      size: v.size,
    }))

/** Filas → cuerpo para el servidor: formato nuevo (opciones) o, si una fila vieja no tiene opciones, el de color / talla. */
export const rowsToPayload = (rows: VariantRow[]) =>
  rows.map((r) =>
    r.option1 || r.option2 || r.option3
      ? { option1: r.option1 ?? null, option2: r.option2 ?? null, option3: r.option3 ?? null, sku: r.sku.trim(), barcode: r.barcode.trim() || null, price: r.price.trim() === '' ? null : Number(r.price), images: r.images }
      : { color: r.color ?? '', colorHex: r.colorHex ?? '', size: r.size ?? '', sku: r.sku.trim(), images: r.images },
  )

/** Producto cartesiano de los valores elegidos por eje (respeta el orden de la plantilla). */
export function combinations(axes: TemplateAxis[], selected: Record<number, string[]>) {
  if (!axes.length) return [] as Record<number, string>[]
  let acc: Record<number, string>[] = [{}]
  for (const a of axes) {
    const values = selected[a.position] ?? []
    acc = acc.flatMap((c) => values.map((v) => ({ ...c, [a.position]: v })))
  }
  return acc.slice(0, MAX_COMBINATIONS + 1)
}

/** Lleva las filas de una plantilla a otra por nombre de eje (Talla → Talla); las que no encajan se descartan. */
export function remapRows(rows: VariantRow[], from: TemplateAxis[], to: TemplateAxis[]) {
  const out: VariantRow[] = []
  for (const r of rows) {
    const next: VariantRow = { ...r, id: undefined, option1: null, option2: null, option3: null }
    let ok = to.length > 0
    for (const a of to) {
      const old = from.find((x) => sameValue(x.name, a.name))
      const value = old ? optionOf(r, old.position) : null
      const allowed = a.type === 'TEXT' || (value && a.options.some((o) => sameValue(o.value, value)))
      if (!value || !allowed) ok = false
      else (next as any)[`option${a.position}`] = value
    }
    if (ok) out.push({ ...next, label: labelOf(next) })
  }
  return out
}

/** Clave corta para un SKU sugerido: "Rojo / M" → "ROJ-M". */
export const skuSuffix = (values: string[]) =>
  values
    .map((v) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 4))
    .filter(Boolean)
    .join('-')
