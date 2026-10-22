import React from 'react'
import { TemplateField, sameValue } from '../../../../../../../modules/catalogos/productos-y-servicios/variantes/variantTypes'
import './ItemFields.css'

export type AttributeValue = string | number | boolean
export type Attributes = Record<string, AttributeValue>

interface Props {
  fields: TemplateField[]
  values: Attributes
  onChange: (name: string, value: AttributeValue | null) => void
}

const isChoice = (f: TemplateField) => f.type === 'LIST' || f.type === 'COLOR'

/** Datos del artículo que no crean variantes (marca, material…): un solo valor por artículo, se guardan en su ficha. */
const ItemFields: React.FC<Props> = ({ fields, values, onChange }) => (
  <div className='item-fields'>
    {/* Primero los campos de escribir (en rejilla) y al final los de elegir una opción (a todo lo ancho) */}
    {[...fields.filter((f) => !isChoice(f)), ...fields.filter(isChoice)].map((f) => {
      const value = values[f.name]
      const text = value == null ? '' : String(value)
      if (isChoice(f)) {
        return (
          <div key={f.name} className='item-fields__field item-fields__field--wide'>
            <span className='item-fields__label'>{f.name}</span>
            <div className='item-fields__chips' role='radiogroup' aria-label={f.name}>
              {(f.options ?? []).map((o) => {
                const on = sameValue(text, o)
                return (
                  <button key={o} type='button' role='radio' aria-checked={on} className={on ? 'is-on' : ''} onClick={() => onChange(f.name, on ? null : o)}>
                    {o}
                  </button>
                )
              })}
            </div>
          </div>
        )
      }
      const numeric = f.type === 'NUMBER' || f.type === 'MEASURE'
      return (
        <label key={f.name} className='item-fields__field'>
          <span className='item-fields__label'>
            {f.name}
            {f.price ? <small className='item-fields__tag'>para el precio</small> : null}
          </span>
          <span className='item-fields__input'>
            <input
              className='inputs__general'
              value={text}
              type={numeric ? 'number' : 'text'}
              step={numeric ? 'any' : undefined}
              inputMode={numeric ? 'decimal' : undefined}
              maxLength={numeric ? undefined : 200}
              placeholder={numeric ? '0' : `Escribe ${f.name.toLowerCase()}`}
              onChange={(e) => {
                const v = e.target.value
                if (v.trim() === '') return onChange(f.name, null)
                onChange(f.name, numeric && Number.isFinite(Number(v)) ? Number(v) : v)
              }}
            />
            {f.type === 'MEASURE' && f.unit ? <em>{f.unit}</em> : null}
          </span>
        </label>
      )
    })}
  </div>
)

export default ItemFields
