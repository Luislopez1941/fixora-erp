import React from 'react'
import './PriceMode.css'

export type PriceModeValue = 'TEMPLATE' | 'MANUAL'

interface Props {
  value: PriceModeValue
  onChange: (mode: PriceModeValue) => void
  /** Cómo calcula la plantilla, en palabras (p. ej. "Precio × Ancho × Alto") */
  how?: string
}

/** ¿Quién pone el precio de este artículo? La plantilla (fórmula y ajustes) o la persona, a mano. */
const PriceMode: React.FC<Props> = ({ value, onChange, how }) => (
  <div className='price-mode'>
    <span className='price-mode__q'>Precio</span>
    <div className='price-mode__options' role='radiogroup' aria-label='Modo de precio'>
      <button type='button' role='radio' aria-checked={value === 'TEMPLATE'} className={value === 'TEMPLATE' ? 'is-active' : ''} onClick={() => onChange('TEMPLATE')}>
        <span className='material-symbols-rounded' aria-hidden>calculate</span>
        <span>
          <strong>Según la plantilla</strong>
          <small>{how ?? 'Fórmula y ajustes'}</small>
        </span>
      </button>
      <button type='button' role='radio' aria-checked={value === 'MANUAL'} className={value === 'MANUAL' ? 'is-active' : ''} onClick={() => onChange('MANUAL')}>
        <span className='material-symbols-rounded' aria-hidden>edit</span>
        <span>
          <strong>Precio manual</strong>
          <small>Tú los escribes</small>
        </span>
      </button>
    </div>
  </div>
)

export default PriceMode
