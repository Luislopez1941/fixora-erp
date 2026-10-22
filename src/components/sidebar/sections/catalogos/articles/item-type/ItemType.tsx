import React from 'react'
import './ItemType.css'

export type ItemTypeValue = 'ARTICLE' | 'SERVICE'

interface Props {
  value: ItemTypeValue
  onChange: (value: ItemTypeValue) => void
}

const OPTIONS: { value: ItemTypeValue; label: string; icon: string; hint: string }[] = [
  { value: 'ARTICLE', label: 'Artículo', icon: 'inventory_2', hint: 'Se compra o fabrica y lleva existencias' },
  { value: 'SERVICE', label: 'Servicio', icon: 'design_services', hint: 'Mano de obra (sublimado, maquila…): no lleva existencias propias' },
]

/** Artículo o servicio: el mismo modal sirve para los dos */
const ItemType: React.FC<Props> = ({ value, onChange }) => (
  <div className='item-type' role='radiogroup' aria-label='Tipo'>
    {OPTIONS.map((o) => (
      <button
        key={o.value}
        type='button'
        role='radio'
        aria-checked={value === o.value}
        className={`item-type__option ${value === o.value ? 'is-on' : ''}`}
        onClick={() => onChange(o.value)}
        title={o.hint}
      >
        <span className='material-symbols-rounded' aria-hidden>{o.icon}</span>
        {o.label}
      </button>
    ))}
  </div>
)

export default ItemType
