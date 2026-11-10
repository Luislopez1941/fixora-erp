import React, { useEffect, useState } from 'react'
import APIs from '../../../../../services/APIs'
import PosModal from '../../../shared/pos-modal/PosModal'
import { TabItem, qty } from '../../../shared/restaurantTypes'

interface Props {
  item: TabItem
  guests: number
  busy: boolean
  onClose: () => void
  onSave: (data: { quantity?: number; modifiers?: string[]; notes: string; seat: number | null; course: number }) => void
}

// Indicaciones rápidas que más se usan en cocina; se pueden escribir otras
const QUICK = ['Sin cebolla', 'Sin chile', 'Sin hielo', 'Poco picante', 'Bien cocido', 'Término medio', 'Para llevar', 'Aparte']

/**
 * Detalle de una partida: cantidad e indicaciones solo antes de enviarla a cocina; comensal, tiempo y nota siempre.
 */
const ModalItem: React.FC<Props> = ({ item, guests, busy, onClose, onSave }) => {
  // Opciones del platillo (Menús › Modificadores): se ofrecen como indicaciones rápidas para cocina
  const [groups, setGroups] = useState<{ id: number; name: string; required: boolean; options: string[] }[]>([])
  useEffect(() => {
    if (item.status !== 'PENDING') return
    let alive = true
    Promise.all([APIs.getRestaurantDishes({ search: undefined }), APIs.getRestaurantModifierGroups()])
      .then(([dishes, all]: any[]) => {
        const dish = (dishes?.data ?? []).find((d: any) => d.itemId === item.itemId)
        const ids: number[] = dish?.modifierGroupIds ?? []
        const found = (all?.data ?? [])
          .filter((g: any) => ids.includes(g.id) && g.active)
          .map((g: any) => ({ id: g.id, name: g.name, required: g.required, options: g.options.filter((o: any) => o.active).map((o: any) => o.name as string) }))
        if (alive) setGroups(found)
      })
      .catch(() => alive && setGroups([]))
    return () => {
      alive = false
    }
  }, [item.itemId, item.status])
  const editable = item.status === 'PENDING'
  const [quantity, setQuantity] = useState(Number(item.quantity))
  const [modifiers, setModifiers] = useState<string[]>(item.modifiers ?? [])
  const [custom, setCustom] = useState('')
  const [notes, setNotes] = useState(item.notes ?? '')
  const [seat, setSeat] = useState<number | null>(item.seat)
  const [course, setCourse] = useState(item.course || 1)

  const toggle = (m: string) => setModifiers((list) => (list.includes(m) ? list.filter((x) => x !== m) : [...list, m]))
  const addCustom = () => {
    const v = custom.trim()
    if (v && !modifiers.includes(v)) setModifiers((list) => [...list, v])
    setCustom('')
  }
  const grouped = groups.flatMap((g) => g.options)
  const extras = modifiers.filter((m) => !QUICK.includes(m) && !grouped.includes(m))

  return (
    <PosModal
      title={item.name}
      onClose={onClose}
      actions={
        <>
          <button type='button' className='btn__general-secondary' onClick={onClose}>Cancelar</button>
          <button
            type='button'
            className='btn__general-purple'
            disabled={busy || !(quantity > 0)}
            onClick={() => onSave({ ...(editable ? { quantity, modifiers } : {}), notes: notes.trim(), seat, course })}
          >
            Guardar
          </button>
        </>
      }
    >
      {editable ? (
        <>
          <div className='pos-field'>
            Cantidad
            <div className='pos-stepper'>
              <button type='button' aria-label='Uno menos' onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                <span className='material-symbols-rounded'>remove</span>
              </button>
              <strong>{qty(quantity)}</strong>
              <button type='button' aria-label='Uno más' onClick={() => setQuantity((q) => q + 1)}>
                <span className='material-symbols-rounded'>add</span>
              </button>
            </div>
          </div>
          {groups.map((g) => (
            <div key={g.id} className='pos-field'>
              {g.name}{g.required ? ' (obligatorio)' : ''}
              <div className='pos-chips'>
                {g.options.map((m) => (
                  <button key={m} type='button' className={`pos-chip ${modifiers.includes(m) ? 'is-active' : ''}`} onClick={() => toggle(m)} aria-pressed={modifiers.includes(m)}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className='pos-field'>
            Indicaciones para cocina
            <div className='pos-chips'>
              {[...QUICK, ...extras].map((m) => (
                <button key={m} type='button' className={`pos-chip ${modifiers.includes(m) ? 'is-active' : ''}`} onClick={() => toggle(m)} aria-pressed={modifiers.includes(m)}>
                  {m}
                </button>
              ))}
            </div>
            <div className='pos-row'>
              <input
                id='restaurant-item-custom-modifier'
                value={custom}
                maxLength={60}
                placeholder='Otra indicación'
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustom()
                  }
                }}
              />
              <button type='button' className='btn__general-secondary' onClick={addCustom} disabled={!custom.trim()}>
                Agregar indicación
              </button>
            </div>
          </div>
        </>
      ) : (
        <p className='pos-note'>
          Ya se envió a cocina ({qty(item.quantity)}). Para cambiar la cantidad o las indicaciones, cancélala y agrégala de nuevo.
        </p>
      )}

      <div className='pos-field'>
        Comensal
        <div className='pos-chips'>
          <button type='button' className={`pos-chip ${seat == null ? 'is-active' : ''}`} onClick={() => setSeat(null)}>Compartido</button>
          {Array.from({ length: Math.max(guests, seat ?? 0) }, (_, i) => i + 1).map((n) => (
            <button key={n} type='button' className={`pos-chip ${seat === n ? 'is-active' : ''}`} onClick={() => setSeat(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className='pos-field'>
        Tiempo
        <div className='pos-chips'>
          {['Entrada', 'Plato fuerte', 'Postre'].map((name, i) => (
            <button key={name} type='button' className={`pos-chip ${course === i + 1 ? 'is-active' : ''}`} onClick={() => setCourse(i + 1)}>
              {name}
            </button>
          ))}
        </div>
      </div>

      <label className='pos-field'>
        Nota
        <input id='restaurant-item-note' value={notes} maxLength={255} placeholder='Ej. Salsa aparte' onChange={(e) => setNotes(e.target.value)} />
      </label>
    </PosModal>
  )
}

export default ModalItem
