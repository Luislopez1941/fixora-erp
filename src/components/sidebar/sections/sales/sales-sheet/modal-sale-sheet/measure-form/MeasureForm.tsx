import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  PRICE_BASE_KEY,
  formulaText,
  toNumber,
  variantPrice,
  withFieldInputs,
} from '../../../../../../../modules/catalogos/productos-y-servicios/variantes/variantTypes'
import './MeasureForm.css'

export interface MeasureResult {
  measures: Record<string, number>
  /** Precio unitario calculado con la fórmula de la plantilla */
  price: number
  quantity: number
  /** "120 cm × 80 cm" para la línea */
  text: string
}

interface Props {
  /** Artículo del detalle para venta (variantTemplate, attributes, price) */
  product: any
  /** Variante elegida (si la plantilla también crea variantes) */
  variation?: any | null
  onConfirm: (result: MeasureResult) => void
  onClose: () => void
}

const money = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n)

/** Medidas "para el precio" que usa la fórmula del artículo (solo si su precio es según la plantilla). */
export const priceFieldsOf = (product: any): any[] => {
  const tpl = product?.variantTemplate
  const formula: any[] = tpl?.priceFormula ?? []
  if (product?.priceMode !== 'TEMPLATE' || !formula.length) return []
  const used = new Set(formula.filter((t) => t.t === 'axis').map((t) => String(t.name).trim().toLowerCase()))
  return (tpl?.fields ?? []).filter((f: any) => f.price && (f.type === 'NUMBER' || f.type === 'MEASURE') && used.has(String(f.name).trim().toLowerCase()))
}

/**
 * Mini-formulario al vender vidrio, tela, cable…: se escriben las medidas de esta pieza y la cantidad; el precio se
 * calcula en vivo con la misma fórmula que usa el servidor (que lo vuelve a calcular al cobrar).
 */
const MeasureForm: React.FC<Props> = ({ product, variation, onConfirm, onClose }) => {
  const fields = useMemo(() => priceFieldsOf(product), [product])
  const tpl = product?.variantTemplate
  const axes: any[] = tpl?.axes ?? []
  const [values, setValues] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState('1')
  const first = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => first.current?.focus(), 0)
  }, [])

  const result = useMemo(() => {
    const measures: Record<string, number> = {}
    for (const f of fields) {
      const n = toNumber(values[f.name])
      if (!Number.isFinite(n) || n <= 0) return { error: `Escribe ${f.name.toLowerCase()}.` }
      measures[f.name] = n
    }
    const attrs = { ...(product?.attributes ?? {}), ...measures }
    const stored = toNumber(attrs[PRICE_BASE_KEY])
    // Sin variantes la base es el "Precio base" de la ficha; con variantes, el precio del artículo
    const base = !axes.length && Number.isFinite(stored) ? stored : Number(product?.price ?? 0)
    const inputs = withFieldInputs(axes, { 1: variation?.option1, 2: variation?.option2, 3: variation?.option3 }, tpl?.fields ?? [], attrs)
    try {
      const price = variantPrice(tpl.priceFormula, inputs.axes, inputs.values, base)
      if (price == null) return { error: 'No se pudo calcular el precio.' }
      const text = fields.map((f) => `${measures[f.name]}${f.unit ? ` ${f.unit}` : ''}`).join(' × ')
      return { measures, price, text, how: formulaText(tpl.priceFormula, { base, adj: 0, axes: inputs.axes, values: inputs.values }) }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'No se pudo calcular el precio.' }
    }
  }, [fields, values, product, variation, axes, tpl])

  const qty = Number(quantity)
  const ready = 'price' in result && Number.isFinite(qty) && qty > 0
  const confirm = () => {
    if (!ready || !('price' in result)) return
    onConfirm({ measures: result.measures!, price: result.price!, quantity: qty, text: result.text! })
  }

  return createPortal(
    <div className='measure-form' role='dialog' aria-modal='true' aria-label={`Medidas de ${product?.name ?? ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className='measure-form__panel'
        onSubmit={(e) => {
          e.preventDefault()
          confirm()
        }}
      >
        <header className='measure-form__head'>
          <div>
            <h3>{product?.name}</h3>
            <small>{variation?.label ? `${variation.label} · ` : ''}Escribe las medidas de esta pieza</small>
          </div>
          <button type='button' className='measure-form__close' onClick={onClose} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </header>

        <div className='measure-form__body'>
          <div className='measure-form__fields'>
            {fields.map((f, i) => (
              <label key={f.name} className='measure-form__field'>
                <span>{f.name}</span>
                <span className='measure-form__input'>
                  <input
                    ref={i === 0 ? first : undefined}
                    type='number'
                    step='any'
                    min={0}
                    inputMode='decimal'
                    value={values[f.name] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    placeholder='0'
                  />
                  {f.unit ? <em>{f.unit}</em> : null}
                </span>
              </label>
            ))}
            <label className='measure-form__field'>
              <span>Cantidad</span>
              <span className='measure-form__input'>
                <input type='number' step='any' min={0} inputMode='decimal' value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                <em>pzas</em>
              </span>
            </label>
          </div>

          <div className={`measure-form__price ${'error' in result ? 'is-empty' : ''}`}>
            {'price' in result ? (
              <>
                <small>{result.how}</small>
                <strong>{money(result.price!)}</strong>
                {qty > 1 ? <span>× {qty} = {money(result.price! * qty)}</span> : null}
              </>
            ) : (
              <small>{result.error}</small>
            )}
          </div>
        </div>

        <footer className='measure-form__foot'>
          <button type='button' className='measure-form__cancel' onClick={onClose}>Cancelar</button>
          <button type='submit' className='measure-form__add' disabled={!ready}>Agregar</button>
        </footer>
      </form>
    </div>,
    document.body,
  )
}

export default MeasureForm
