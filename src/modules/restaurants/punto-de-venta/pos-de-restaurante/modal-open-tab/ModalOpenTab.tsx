import React, { useState } from 'react'
import PosModal from '../../../shared/pos-modal/PosModal'
import { TabType, TYPE_LABEL } from '../../../shared/restaurantTypes'

interface Props {
  /** Abrir: tipo y mesa. Editar: valores actuales */
  mode: 'open' | 'edit'
  type: TabType
  tableName?: string
  initial?: { label?: string | null; guests?: number }
  busy: boolean
  onClose: () => void
  onSubmit: (data: { label: string; guests: number }) => void
}

/** Abrir cuenta (mesa, para llevar, mostrador) o cambiar su nombre y comensales. */
const ModalOpenTab: React.FC<Props> = ({ mode, type, tableName, initial, busy, onClose, onSubmit }) => {
  const [guests, setGuests] = useState(initial?.guests ?? (type === 'DINE_IN' ? 2 : 1))
  const [label, setLabel] = useState(initial?.label ?? '')
  const title = mode === 'edit' ? 'Datos de la cuenta' : type === 'DINE_IN' ? `Abrir ${tableName ?? 'mesa'}` : `Nueva cuenta · ${TYPE_LABEL[type]}`

  return (
    <PosModal
      title={title}
      onClose={onClose}
      actions={
        <>
          <button type='button' className='btn__general-secondary' onClick={onClose}>Cancelar</button>
          <button type='button' className='btn__general-purple' disabled={busy} onClick={() => onSubmit({ label: label.trim(), guests })}>
            {mode === 'edit' ? 'Guardar' : 'Abrir cuenta'}
          </button>
        </>
      }
    >
      <form
        className='pos-modal__body'
        onSubmit={(e) => {
          e.preventDefault()
          if (!busy) onSubmit({ label: label.trim(), guests })
        }}
      >
        <div className='pos-field'>
          Comensales
          <div className='pos-stepper'>
            <button type='button' aria-label='Uno menos' onClick={() => setGuests((g) => Math.max(1, g - 1))}>
              <span className='material-symbols-rounded'>remove</span>
            </button>
            <strong>{guests}</strong>
            <button type='button' aria-label='Uno más' onClick={() => setGuests((g) => Math.min(99, g + 1))}>
              <span className='material-symbols-rounded'>add</span>
            </button>
          </div>
        </div>
        <label className='pos-field'>
          {type === 'DINE_IN' ? 'Nombre o referencia (opcional)' : 'Nombre del cliente (opcional)'}
          <input
            id='restaurant-tab-label'
            value={label}
            maxLength={80}
            autoFocus
            placeholder={type === 'DINE_IN' ? 'Ej. Cumpleaños, Sr. López' : 'Ej. Ana'}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
      </form>
    </PosModal>
  )
}

export default ModalOpenTab
