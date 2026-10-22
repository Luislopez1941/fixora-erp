import React from 'react'
import './MoneyInput.css'

interface Props {
  value: number | null
  onChange: (v: number | null) => void
  /** Si se permite vacío (= sin límite), qué texto mostrar */
  emptyLabel?: string
  ariaLabel: string
  suffix?: string
  step?: number
  disabled?: boolean
}

/** Campo de monto con "$". Vacío = null (sin límite) cuando se da emptyLabel. */
const MoneyInput: React.FC<Props> = ({ value, onChange, emptyLabel, ariaLabel, suffix, step = 0.01, disabled }) => (
  <label className={`money-input ${disabled ? 'is-disabled' : ''}`}>
    {suffix ? null : <span aria-hidden>$</span>}
    <input
      type='number'
      inputMode='decimal'
      min={0}
      step={step}
      value={value ?? ''}
      placeholder={emptyLabel ?? '0.00'}
      aria-label={ariaLabel}
      disabled={disabled}
      onChange={(e) => {
        const raw = e.target.value
        if (raw === '') return onChange(emptyLabel ? null : 0)
        const n = Number(raw)
        if (Number.isFinite(n) && n >= 0) onChange(n)
      }}
    />
    {suffix ? <span aria-hidden>{suffix}</span> : null}
  </label>
)

export default MoneyInput
