import React, { useState } from 'react'
import APIs from '../../../../../services/APIs'
import { showToast } from '../../../../../utils/toast'
import MoneyInput from '../../../shared/money-input/MoneyInput'
import { errorText, money } from '../../../shared/cashFormat'
import './ModalRegisterFund.css'

interface Props {
  register: { id: number; name: string; openingAmount: number | null }
  branchFund: number
  onClose: () => void
  onSaved: () => void
}

/** Cambia el fondo propio de una caja o la regresa al de la sucursal. */
const ModalRegisterFund: React.FC<Props> = ({ register, branchFund, onClose, onSaved }) => {
  const [own, setOwn] = useState(register.openingAmount != null)
  const [amount, setAmount] = useState<number>(register.openingAmount ?? branchFund)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await APIs.setCashRegisterFund(register.id, own ? amount : null)
      showToast({ type: 'success', title: 'Fondo actualizado', text: `${register.name}: ${own ? money(amount) : 'usa el de la sucursal'}` })
      onSaved()
      onClose()
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo guardar', text: errorText(e, 'Intenta de nuevo.') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='cash-ui__overlay' role='dialog' aria-modal='true' onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='cash-ui__modal register-fund-modal'>
        <div className='cash-ui__modal-head'>
          <h2>Fondo de {register.name}</h2>
          <button type='button' onClick={onClose} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>
        <div className='cash-ui__modal-body'>
          <div className='register-fund-modal__options' role='radiogroup'>
            <button type='button' role='radio' aria-checked={!own} className={!own ? 'is-active' : ''} onClick={() => setOwn(false)}>
              <span className='material-symbols-rounded'>store</span>
              <strong>El de la sucursal</strong>
              <small>{money(branchFund)}</small>
            </button>
            <button type='button' role='radio' aria-checked={own} className={own ? 'is-active' : ''} onClick={() => setOwn(true)}>
              <span className='material-symbols-rounded'>point_of_sale</span>
              <strong>Uno propio</strong>
              <small>Solo para esta caja</small>
            </button>
          </div>
          {own ? (
            <div className='register-fund-modal__amount'>
              <span>Fondo de la caja</span>
              <MoneyInput value={amount} onChange={(v) => setAmount(v ?? 0)} ariaLabel='Fondo de la caja' />
            </div>
          ) : null}
          <div className='cash-ui__modal-actions'>
            <button type='button' className='btn__general-secondary' onClick={onClose}>Cancelar</button>
            <button type='button' className='btn__general-purple' onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalRegisterFund
