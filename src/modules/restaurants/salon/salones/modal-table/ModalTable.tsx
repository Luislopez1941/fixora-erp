import React, { useState } from 'react'
import PosModal from '../../../shared/pos-modal/PosModal'
import { DiningRoom, RestaurantTable } from '../../../shared/restaurantTypes'

type Mode = { kind: 'one'; table?: RestaurantTable; roomId: number } | { kind: 'bulk'; roomId: number }

interface Props {
  mode: Mode
  rooms: DiningRoom[]
  busy: boolean
  onClose: () => void
  /** Solo al editar: activar o desactivar la mesa */
  onToggleActive?: () => void
  onSave: (data: { name: string; seats: number; shape: string; diningRoomId: number; count: number; prefix: string }) => void
}

const SHAPES = [
  { value: 'square', label: 'Cuadrada', icon: 'crop_square' },
  { value: 'round', label: 'Redonda', icon: 'circle' },
  { value: 'bar', label: 'Barra', icon: 'horizontal_rule' },
]

/** Una mesa (alta o edición) o varias de un jalón ("Mesa 1…Mesa 10"). */
const ModalTable: React.FC<Props> = ({ mode, rooms, busy, onClose, onToggleActive, onSave }) => {
  const table = mode.kind === 'one' ? mode.table : undefined
  const [name, setName] = useState(table?.name ?? '')
  const [seats, setSeats] = useState(table?.seats ?? 4)
  const [shape, setShape] = useState<string>(table?.shape ?? 'square')
  const [roomId, setRoomId] = useState(table?.diningRoomId ?? mode.roomId)
  const [count, setCount] = useState(10)
  const [prefix, setPrefix] = useState('Mesa')
  const valid = mode.kind === 'bulk' ? count >= 1 && count <= 100 : !!name.trim()

  return (
    <PosModal
      title={mode.kind === 'bulk' ? 'Agregar varias mesas' : table ? `Editar ${table.name}` : 'Nueva mesa'}
      onClose={onClose}
      actions={
        <>
          {table && onToggleActive ? (
            <button type='button' className='btn__general-secondary' onClick={onToggleActive} disabled={busy}>
              {table.active ? 'Desactivar mesa' : 'Activar mesa'}
            </button>
          ) : null}
          <button type='button' className='btn__general-secondary' onClick={onClose}>Cancelar</button>
          <button
            type='button'
            className='btn__general-purple'
            disabled={busy || !valid}
            onClick={() => onSave({ name: name.trim(), seats, shape, diningRoomId: roomId, count, prefix: prefix.trim() || 'Mesa' })}
          >
            {mode.kind === 'bulk' ? `Crear ${count} mesas` : 'Guardar'}
          </button>
        </>
      }
    >
      {mode.kind === 'bulk' ? (
        <div className='pos-row'>
          <label className='pos-field'>
            ¿Cuántas?
            <input id='restaurant-bulk-count' type='number' min={1} max={100} value={count} onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} />
          </label>
          <label className='pos-field'>
            Nombre
            <input id='restaurant-bulk-prefix' value={prefix} maxLength={20} onChange={(e) => setPrefix(e.target.value)} />
          </label>
        </div>
      ) : (
        <label className='pos-field'>
          Nombre o número
          <input id='restaurant-table-name' value={name} maxLength={30} autoFocus placeholder='Ej. 12, Barra 3, VIP' onChange={(e) => setName(e.target.value)} />
        </label>
      )}
      {mode.kind === 'bulk' ? <p className='pos-note'>Se numeran después de la más alta que ya tenga el salón: {prefix || 'Mesa'} 1, {prefix || 'Mesa'} 2…</p> : null}
      <div className='pos-field'>
        Lugares
        <div className='pos-stepper'>
          <button type='button' aria-label='Uno menos' onClick={() => setSeats((s) => Math.max(1, s - 1))}>
            <span className='material-symbols-rounded'>remove</span>
          </button>
          <strong>{seats}</strong>
          <button type='button' aria-label='Uno más' onClick={() => setSeats((s) => Math.min(50, s + 1))}>
            <span className='material-symbols-rounded'>add</span>
          </button>
        </div>
      </div>
      {mode.kind === 'one' ? (
        <>
          <div className='pos-field'>
            Forma
            <div className='pos-chips'>
              {SHAPES.map((s) => (
                <button key={s.value} type='button' className={`pos-chip ${shape === s.value ? 'is-active' : ''}`} onClick={() => setShape(s.value)}>
                  <span className='material-symbols-rounded'>{s.icon}</span> {s.label}
                </button>
              ))}
            </div>
          </div>
          {table && rooms.length > 1 ? (
            <label className='pos-field'>
              Salón
              <select value={roomId} onChange={(e) => setRoomId(Number(e.target.value))}>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </label>
          ) : null}
        </>
      ) : null}
    </PosModal>
  )
}

export default ModalTable
