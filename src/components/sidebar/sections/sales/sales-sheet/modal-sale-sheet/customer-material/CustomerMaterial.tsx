import React from 'react'
import './CustomerMaterial.css'

interface Props {
  on: boolean
  /** Cambio de precio cuando el cliente trae su material (p. ej. -40) */
  adjust: number
  /** Insumos que el cliente puede traer (no se descuentan del almacén) */
  materials: string[]
  onChange: (on: boolean) => void
}

const money = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)

/** Interruptor de la línea del POS: "El cliente trae su material" (no se descuenta del almacén y cambia el precio). */
const CustomerMaterial: React.FC<Props> = ({ on, adjust, materials, onChange }) => (
  <button
    type='button'
    role='switch'
    aria-checked={on}
    className={`customer-material ${on ? 'is-on' : ''}`}
    title={`No se descuenta del almacén: ${materials.join(', ')}`}
    onClick={() => onChange(!on)}
  >
    <span className='customer-material__track' aria-hidden />
    <span>
      El cliente trae su material
      {adjust ? <em> ({adjust > 0 ? '+' : '−'}{money(Math.abs(adjust))})</em> : null}
    </span>
  </button>
)

export default CustomerMaterial
