import React, { useState } from 'react'
import PosModal from '../../../shared/pos-modal/PosModal'

interface Props {
  initial?: string
  busy: boolean
  onClose: () => void
  onSave: (name: string) => void
}

/** Alta o cambio de nombre de un salón. */
const ModalRoom: React.FC<Props> = ({ initial, busy, onClose, onSave }) => {
  const [name, setName] = useState(initial ?? '')
  const submit = () => name.trim() && !busy && onSave(name.trim())
  return (
    <PosModal
      title={initial ? 'Cambiar nombre del salón' : 'Nuevo salón'}
      onClose={onClose}
      actions={
        <>
          <button type='button' className='btn__general-secondary' onClick={onClose}>Cancelar</button>
          <button type='button' className='btn__general-purple' disabled={busy || !name.trim()} onClick={submit}>Guardar</button>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); submit() }}>
        <label className='pos-field'>
          Nombre
          <input id='restaurant-room-name' value={name} maxLength={80} autoFocus placeholder='Ej. Salón principal, Terraza, Barra' onChange={(e) => setName(e.target.value)} />
        </label>
      </form>
    </PosModal>
  )
}

export default ModalRoom
