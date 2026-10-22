/** Tipos y utilidades de plantillas de variantes (los usan esta pantalla y el modal de artículo). */
import type { FormulaToken } from './priceFormula'

export type AxisType = 'LIST' | 'COLOR' | 'TEXT' | 'NUMBER' | 'MEASURE'
export interface AxisOption {
  value: string
  hex?: string
  /** Ajuste de precio de las combinaciones con este valor (XL +20). Sin adjustType = pesos */
  adjust?: number
  adjustType?: 'PERCENT'
}
export interface TemplateAxis {
  position: number
  name: string
  type: AxisType
  options: AxisOption[]
  /** Solo Medida: m², m, cm… */
  unit?: string | null
  /** Número y Medida: rango permitido (opcional) */
  minValue?: number | null
  maxValue?: number | null
  /** Número: solo enteros (p. ej. piezas) */
  integerOnly?: boolean
}
/** Dato que NO crea variantes (marca, material…): se llena una vez por artículo y se guarda en su ficha. */
export interface TemplateField {
  name: string
  type: AxisType
  unit?: string | null
  options?: string[]
  /** Número / Medida solo para calcular el precio (p. ej. Ancho y Alto del vidrio) */
  price?: boolean
}
/** En el editor: una característica que crea variantes (combines) o que solo es un dato del artículo. */
export type Characteristic = TemplateAxis & {
  combines: boolean
  /** El usuario ya eligió a mano si crea variantes (deja de seguir al tipo) */
  touched?: boolean
  /** Eje guardado de una plantilla en uso: no se cambia */
  saved?: boolean
  /** Número / Medida que no crea variantes y solo sirve para la fórmula del precio */
  forPrice?: boolean
}
/** Cálculos del formato anterior: hoy solo sirven de atajo para armar la fórmula */
export type PriceRule = 'AREA' | 'LENGTH' | 'MULTIPLY' | 'DIVIDE'
export interface VariantTemplate {
  id: number
  name: string
  active: boolean
  systemKey: string | null
  /** Fórmula del precio (el servidor ya convierte las del formato anterior) */
  priceFormula?: FormulaToken[] | null
  axes: TemplateAxis[]
  fields?: TemplateField[]
  itemsCount?: number
  categoriesCount?: number
}
export interface TemplateCategory {
  id: number
  title: string
  level: number
  variantTemplateId: number | null
}

export const AXIS_TYPE_LABEL: Record<AxisType, string> = { LIST: 'Lista', COLOR: 'Color', TEXT: 'Texto libre', NUMBER: 'Número', MEASURE: 'Medida' }
export const MEASURE_UNITS = ['m²', 'm', 'cm', 'mm', 'kg', 'g', 'L', 'ml', 'pza', 'caja', 'par', 'docena', 'hora']
export const isNumericAxis = (a: Pick<TemplateAxis, 'type'>) => a.type === 'NUMBER' || a.type === 'MEASURE'

export const toNumber = (v: unknown) => Number(String(v ?? '').trim().replace(',', '.'))

/** Precio de una combinación con la fórmula de la plantilla y los ajustes por valor (mismo cálculo que el servidor). */
export { variantPrice, formulaText, formulaError, formulaFromRule, withFieldInputs, PRICE_BASE_KEY } from './priceFormula'
export type { FormulaToken } from './priceFormula'

/** "+$20", "−$5", "+10%" (vacío si no tiene ajuste). */
export const adjustText = (o: Pick<AxisOption, 'adjust' | 'adjustType'>) =>
  o.adjust ? `${o.adjust > 0 ? '+' : '−'}${o.adjustType === 'PERCENT' ? `${Math.abs(o.adjust)}%` : `$${Math.abs(o.adjust).toLocaleString('es-MX')}`}` : ''
export const hasAdjusts = (a: Pick<TemplateAxis, 'options'>) => a.options.some((o) => !!o.adjust)
export const money = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

/** Valor para mostrar: las medidas llevan su unidad ("2.5 m²"). */
export const displayValue = (a: Pick<TemplateAxis, 'type' | 'unit'> | undefined, value: string | null | undefined) =>
  value ? (a?.type === 'MEASURE' && a.unit ? `${value} ${a.unit}` : value) : ''

/** "1 combinación", "12 combinaciones" o, si un eje aún no tiene valores, cómo seguir. */
export function combinationsText(axes: TemplateAxis[]) {
  if (!axes.length) return 'Sin ejes: los artículos son simples'
  if (axes.some((a) => !a.options.length)) {
    return axes.some((a) => a.type === 'TEXT' || isNumericAxis(a)) ? 'Los valores libres se eligen en cada artículo' : 'Define valores para ver combinaciones'
  }
  const n = axes.reduce((acc, a) => acc * a.options.length, 1)
  return `Hasta ${n.toLocaleString('es-MX')} ${n === 1 ? 'combinación' : 'combinaciones'}`
}
export const MAX_AXES = 3
export const MAX_FIELDS = 10
export const MAX_COMBINATIONS = 200

/** Por defecto el texto libre es solo un dato (no tiene sentido combinarlo); opciones, colores, medidas y números sí crean variantes. */
export const defaultCombines = (type: AxisType) => type !== 'TEXT'
export const fieldToChar = (f: TemplateField, position: number): Characteristic => ({
  position,
  name: f.name,
  type: f.type,
  unit: f.unit ?? null,
  options: (f.options ?? []).map((value) => ({ value })),
  combines: false,
  touched: true,
  forPrice: !!f.price,
})
export const charToField = (c: Characteristic): TemplateField => ({
  name: c.name.trim(),
  type: c.type,
  ...(c.type === 'MEASURE' ? { unit: c.unit ?? null } : {}),
  ...(c.type === 'LIST' || c.type === 'COLOR' ? { options: c.options.map((o) => o.value) } : {}),
  ...(c.forPrice && isNumericAxis(c) ? { price: true } : {}),
})

const norm = (v: string) => v.trim().toLocaleLowerCase('es-MX')
export const sameValue = (a?: string | null, b?: string | null) => norm(a ?? '') === norm(b ?? '')

export const errorText = (error: any, fallback: string) => {
  const message = error?.response?.data?.message ?? error?.message
  return (Array.isArray(message) ? message.join(', ') : message) || fallback
}

export const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem('categories-picker-company-id'))
  return !Number.isNaN(id) && id > 0 ? id : null
}

/** Datos del artículo de tipo Número / Medida como "características" para la fórmula (posiciones 101+, igual que el servidor). */
export const formulaFieldAxes = (fields: Pick<TemplateAxis, 'name' | 'type' | 'unit'>[]): TemplateAxis[] =>
  fields.filter(isNumericAxis).map((f, i) => ({ position: 101 + i, name: f.name, type: f.type, unit: f.unit ?? null, options: [] }))

/**
 * Valor de ejemplo para la fórmula: el primero de la característica o uno realista y distinto de 1 para que se vea el efecto
 * (120 cm, 80 cm…). `index` = lugar de la característica en la fórmula, para que Ancho y Alto no tengan el mismo valor.
 */
const UNIT_EXAMPLES: Record<string, string[]> = {
  cm: ['120', '80', '60'],
  mm: ['1200', '800', '600'],
  m: ['1.2', '0.8', '2'],
  'm²': ['2.5', '1.5', '4'],
  g: ['500', '250', '750'],
  kg: ['2', '1.5', '5'],
  ml: ['500', '250', '750'],
  L: ['2', '1.5', '5'],
}
export const exampleValue = (a: Pick<TemplateAxis, 'options' | 'unit'>, index = 0) => {
  if (a.options[0]?.value) return a.options[0].value
  const list = UNIT_EXAMPLES[a.unit ?? ''] ?? ['4', '2', '3']
  return list[index % list.length]
}
