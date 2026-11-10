import React from 'react'
import PosModal from '../../../shared/pos-modal/PosModal'
import { Floor } from '../../../shared/restaurantTypes'

interface Props {
  floor: Floor
  currentTableId: number | null
  busy: boolean
  onClose: () => void
  onPick: (tableId: number) => void
}

/** Pasar la cuenta a otra mesa (las libres primero; también se puede juntar con una ocupada). */
const ModalMove: React.FC<Props> = ({ floor, currentTableId, busy, onClose, onPick }) => (
  <PosModal title='Mover a otra mesa' onClose={onClose} wide>
    {floor.rooms.map((room) => {
      const tables = room.tables.filter((t) => t.id !== currentTableId)
      if (!tables.length) return null
      return (
        <div key={room.id} className='pos-field'>
          {room.name}
          <div className='pos-chips'>
            {[...tables].sort((a, b) => a.tabs.length - b.tabs.length).map((t) => (
              <button key={t.id} type='button' className={`pos-chip ${t.tabs.length ? '' : 'is-active'}`} disabled={busy} onClick={() => onPick(t.id)}>
                {t.name}
                {t.tabs.length ? ' · ocupada' : ''}
              </button>
            ))}
          </div>
        </div>
      )
    })}
    <p className='pos-note'>Las mesas resaltadas están libres. Si eliges una ocupada, quedan dos cuentas en esa mesa (puedes unirlas después).</p>
  </PosModal>
)

export default ModalMove
