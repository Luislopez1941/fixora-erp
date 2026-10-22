import React, { useState } from 'react'
import MoneyInput from '../../../shared/money-input/MoneyInput'
import { denomLabel } from '../../../shared/denominations'
import './ModalDenomination.css'

interface Props {
  existing: { kind: 'BILL' | 'COIN'; value: number }[]
  onClose: () => void
  onSave: (d: { kind: 'BILL' | 'COIN'; value: number }) => Promise<void>
}

/** Agrega un billete o una moneda. */
const ModalDenomination: React.FC<Props> = ({ existing, onClose, onSave }) => {
  const [kind, setKind] = useState<'BILL' | 'COIN'>('BILL')
  const [value, setValue] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const duplicate = value != null && existing.some((d) => d.kind === kind && Math.abs(d.value - value) < 0.005)
  const valid = value != null && value > 0 && !duplicate

  return (
    <div className='cash-ui__overlay' role='dialog' aria-modal='true' onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='cash-ui__modal denomination-modal'>
        <div className='cash-ui__modal-head'>
          <h2>Agregar denominación</h2>
          <button type='button' onClick={onClose} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>
        <div className='cash-ui__modal-body'>
          <div className='denomination-modal__kind' role='radiogroup' aria-label='Tipo'>
            {([['BILL', 'payments', 'Billete'], ['COIN', 'toll', 'Moneda']] as const).map(([k, icon, label]) => (
              <button key={k} type='button' role='radio' aria-checked={kind === k} className={kind === k ? 'is-active' : ''} onClick={() => setKind(k)}>
                <span className='material-symbols-rounded'>{icon}</span> {label}
              </button>
            ))}
          </div>
          <div className='denomination-modal__value'>
            <span>Valor</span>
            <MoneyInput value={value} onChange={setValue} emptyLabel='Ej. 2000' ariaLabel='Valor de la denominación' />
          </div>
          {duplicate ? <p className='denomination-modal__error'>Ya existe {kind === 'BILL' ? 'un billete' : 'una moneda'} de {denomLabel(value!)}.</p> : null}
          <div className='cash-ui__modal-actions'>
            <button type='button' className='btn__general-secondary' onClick={onClose}>Cancelar</button>
            <button
              type='button'
              className='btn__general-purple'
              disabled={!valid || saving}
              onClick={async () => {
                setSaving(true)
                await onSave({ kind, value: Math.round(value! * 100) / 100 })
                setSaving(false)
              }}
            >
              {saving ? 'Guardando…' : 'Agregar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalDenomination
