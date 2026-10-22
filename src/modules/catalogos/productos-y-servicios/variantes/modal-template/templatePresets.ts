import { FormulaToken, TemplateAxis, TemplateField, PriceRule } from '../variantTypes'

/** Ejemplos para empezar en un clic (se pueden editar antes de guardar). */
export interface TemplatePreset {
  key: string
  icon: string
  name: string
  hint: string
  axes: TemplateAxis[]
  /** Datos que no crean variantes */
  fields?: TemplateField[]
  /** Atajo del cálculo (se convierte en fórmula) o la fórmula directa */
  priceRule?: PriceRule | null
  formula?: FormulaToken[]
}

const list = (values: string[]) => values.map((value) => ({ value }))
const colors = [
  { value: 'Negro', hex: '#111827' },
  { value: 'Blanco', hex: '#ffffff' },
  { value: 'Rojo', hex: '#d62828' },
  { value: 'Azul', hex: '#1d4ed8' },
]

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    key: 'ropa',
    icon: 'apparel',
    name: 'Ropa',
    hint: 'Talla y color + marca',
    axes: [
      { position: 1, name: 'Talla', type: 'LIST', options: list(['S', 'M', 'L', 'XL']) },
      { position: 2, name: 'Color', type: 'COLOR', options: colors },
    ],
    fields: [
      { name: 'Marca', type: 'TEXT' },
      { name: 'Material', type: 'TEXT' },
    ],
  },
  {
    key: 'calzado',
    icon: 'steps',
    name: 'Calzado',
    hint: 'Número y color',
    axes: [
      { position: 1, name: 'Número', type: 'LIST', options: list(['23', '24', '25', '26', '27']) },
      { position: 2, name: 'Color', type: 'COLOR', options: colors.slice(0, 2) },
    ],
  },
  {
    key: 'medida',
    icon: 'straighten',
    name: 'Por medida',
    hint: 'Ancho × alto por m², sin variantes',
    // Ancho y Alto solo calculan el precio: se escriben al crear cada artículo
    axes: [],
    fields: [
      { name: 'Ancho', type: 'MEASURE', unit: 'cm', price: true },
      { name: 'Alto', type: 'MEASURE', unit: 'cm', price: true },
    ],
    formula: [{ t: 'base' }, { t: 'op', v: '*' }, { t: 'axis', name: 'Ancho' }, { t: 'op', v: '*' }, { t: 'axis', name: 'Alto' }],
  },
  {
    key: 'medida-piezas',
    icon: 'grid_view',
    name: 'Medida en piezas',
    hint: '(Precio × ancho × alto) ÷ piezas',
    axes: [{ position: 1, name: 'Piezas', type: 'NUMBER', integerOnly: true, options: list(['1', '2', '4']) }],
    fields: [
      { name: 'Ancho', type: 'MEASURE', unit: 'cm', price: true },
      { name: 'Alto', type: 'MEASURE', unit: 'cm', price: true },
    ],
    formula: [
      { t: '(' },
      { t: 'base' },
      { t: 'op', v: '*' },
      { t: 'axis', name: 'Ancho' },
      { t: 'op', v: '*' },
      { t: 'axis', name: 'Alto' },
      { t: ')' },
      { t: 'op', v: '/' },
      { t: 'axis', name: 'Piezas' },
    ],
  },
  {
    key: 'paquetes',
    icon: 'inventory_2',
    name: 'Paquetes',
    hint: '6, 12 o 24 piezas',
    priceRule: 'MULTIPLY',
    axes: [{ position: 1, name: 'Piezas', type: 'MEASURE', unit: 'pza', options: list(['6', '12', '24']) }],
  },
  {
    key: 'datos',
    icon: 'description',
    name: 'Solo datos',
    hint: 'Marca, modelo… sin variantes',
    axes: [],
    fields: [
      { name: 'Marca', type: 'TEXT' },
      { name: 'Modelo', type: 'TEXT' },
      { name: 'Garantía (meses)', type: 'NUMBER' },
    ],
  },
  { key: 'blank', icon: 'add', name: 'Desde cero', hint: 'La armo yo', axes: [{ position: 1, name: '', type: 'LIST', options: [] }] },
]
