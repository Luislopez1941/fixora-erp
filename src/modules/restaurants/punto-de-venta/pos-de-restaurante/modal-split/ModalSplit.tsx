import React, { useMemo, useState } from 'react'
import PosModal from '../../../shared/pos-modal/PosModal'
import { Tab, liveItems, money, qty } from '../../../shared/restaurantTypes'

interface Props {
  tab: Tab
  busy: boolean
  onClose: () => void
  onSplit: (parts: { tabItemId: number; quantity?: number }[], label: string) => void
}

/**
 * Dividir: lo elegido pasa a una cuenta nueva de la misma mesa. De una partida de varias piezas se elige cuántas pasan.
 * "Por comensal" marca de un toque lo de ese comensal.
 */
const ModalSplit: React.FC<Props> = ({ tab, busy, onClose, onSplit }) => {
  const items = liveItems(tab)
  const [picked, setPicked] = useState<Record<number, number>>({})
  const [label, setLabel] = useState('')
  const seats = useMemo(() => [...new Set(items.map((i) => i.seat).filter((s): s is number => !!s))].sort((a, b) => a - b), [items])

  const set = (id: number, n: number) =>
    setPicked((p) => {
      const next = { ...p }
      if (n <= 0) delete next[id]
      else next[id] = n
      return next
    })
  const bySeat = (seat: number) => {
    const next: Record<number, number> = {}
    items.filter((i) => i.seat === seat).forEach((i) => (next[i.id] = Number(i.quantity)))
    setPicked(next)
    setLabel(`Comensal ${seat}`)
  }
  const chosen = Object.entries(picked)
  const amount = chosen.reduce((acc, [id, n]) => acc + n * Number(items.find((i) => i.id === Number(id))?.unitPrice ?? 0), 0)

  return (
    <PosModal
      title={`Dividir la cuenta #${tab.folio}`}
      onClose={onClose}
      wide
      actions={
        <>
          <button type='button' className='btn__general-secondary' onClick={onClose}>Cancelar</button>
          <button
            type='button'
            className='btn__general-purple'
            disabled={busy || !chosen.length}
            onClick={() =>
              onSplit(
                chosen.map(([id, n]) => {
                  const item = items.find((i) => i.id === Number(id))!
                  return n >= Number(item.quantity) ? { tabItemId: item.id } : { tabItemId: item.id, quantity: n }
                }),
                label,
              )
            }
          >
            Pasar a cuenta nueva · {money(amount)}
          </button>
        </>
      }
    >
      {seats.length ? (
        <div className='pos-field'>
          Por comensal
          <div className='pos-chips'>
            {seats.map((s) => (
              <button key={s} type='button' className='pos-chip' onClick={() => bySeat(s)}>
                <span className='material-symbols-rounded'>person</span> {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className='pos-note'>Tip: si al tomar la orden asignas cada platillo a un comensal, aquí puedes separar por persona de un toque.</p>
      )}
      <ul className='pos-pick'>
        {items.map((i) => {
          const total = Number(i.quantity)
          const n = picked[i.id] ?? 0
          return (
            <li key={i.id}>
              <label className={n ? 'is-checked' : ''}>
                <input type='checkbox' checked={!!n} onChange={() => set(i.id, n ? 0 : total)} />
                <span className='pos-pick__main'>
                  <strong>{i.name}</strong>
                  <small>{qty(total)} × {money(i.unitPrice)}{i.seat ? ` · comensal ${i.seat}` : ''}</small>
                </span>
                {n && total > 1 && Number.isInteger(total) ? (
                  <span className='pos-stepper' onClick={(e) => e.preventDefault()}>
                    <button type='button' aria-label='Una menos' onClick={() => set(i.id, Math.max(1, n - 1))}>
                      <span className='material-symbols-rounded'>remove</span>
                    </button>
                    <strong>{n}</strong>
                    <button type='button' aria-label='Una más' onClick={() => set(i.id, Math.min(total, n + 1))}>
                      <span className='material-symbols-rounded'>add</span>
                    </button>
                  </span>
                ) : null}
              </label>
            </li>
          )
        })}
      </ul>
      <label className='pos-field'>
        Nombre de la cuenta nueva (opcional)
        <input id='restaurant-split-label' value={label} maxLength={80} onChange={(e) => setLabel(e.target.value)} placeholder='Ej. Comensal 2, Sr. López' />
      </label>
    </PosModal>
  )
}

export default ModalSplit
