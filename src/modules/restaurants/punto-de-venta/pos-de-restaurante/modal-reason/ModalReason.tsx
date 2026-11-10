import React, { useState } from 'react'
import PosModal from '../../../shared/pos-modal/PosModal'

interface Props {
  title: string
  text: string
  confirmLabel: string
  busy: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}

const REASONS = ['El cliente cambió de opinión', 'Error al capturar', 'Platillo agotado', 'Tardó demasiado', 'Cortesía de la casa']

/** Pide el motivo de una cancelación (queda en la bitácora). */
const ModalReason: React.FC<Props> = ({ title, text, confirmLabel, busy, onClose, onConfirm }) => {
  const [reason, setReason] = useState('')
  return (
    <PosModal
      title={title}
      onClose={onClose}
      actions={
        <>
          <button type='button' className='btn__general-secondary' onClick={onClose}>Volver</button>
          <button type='button' className='btn__general-danger' disabled={busy || !reason.trim()} onClick={() => onConfirm(reason.trim())}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className='pos-note'>{text}</p>
      <div className='pos-chips'>
        {REASONS.map((r) => (
          <button key={r} type='button' className={`pos-chip ${reason === r ? 'is-active' : ''}`} onClick={() => setReason(r)}>
            {r}
          </button>
        ))}
      </div>
      <label className='pos-field'>
        Motivo
        <input id='restaurant-cancel-reason' value={reason} maxLength={255} autoFocus onChange={(e) => setReason(e.target.value)} placeholder='Escribe el motivo' />
      </label>
    </PosModal>
  )
}

export default ModalReason
