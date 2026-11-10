import React, { useState } from 'react'
import PosModal from '../../../shared/pos-modal/PosModal'
import { Tab, liveItems, qty } from '../../../shared/restaurantTypes'

const COURSE = ['', 'Entrada', 'Plato fuerte', 'Postre']

interface Props {
  tab: Tab
  busy: boolean
  onClose: () => void
  /** Marchar: enviar a cocina solo ese tiempo */
  onFire: (course: number) => void
  /** Volver a pedir lo de una comanda ya enviada */
  onRepeat: (ticketNo: number) => void
  onReprint: (ticketNo: number) => void
  onPrintBill: (mode: 'full' | 'seats' | 'equal', parts?: number) => void
  onWaiter: () => void
}

/** Más acciones de la cuenta: marchar tiempos, repetir ronda, reimprimir comanda e imprimir la cuenta dividida. */
const ModalMore: React.FC<Props> = ({ tab, busy, onClose, onFire, onRepeat, onReprint, onPrintBill, onWaiter }) => {
  const items = liveItems(tab)
  const pendingCourses = [...new Set(items.filter((i) => i.status === 'PENDING').map((i) => i.course))].sort()
  const tickets = [...new Set(items.map((i) => i.kitchenTicketNo).filter((n): n is number => n != null))].sort((a, b) => b - a)
  const hasSeats = items.some((i) => i.seat)
  const [parts, setParts] = useState(Math.max(2, tab.guests))

  const summary = (ticketNo: number) =>
    items
      .filter((i) => i.kitchenTicketNo === ticketNo)
      .map((i) => `${qty(i.quantity)} ${i.name}`)
      .join(', ')

  return (
    <PosModal title='Más acciones' onClose={onClose}>
      {pendingCourses.length > 1 ? (
        <div className='pos-field'>
          Marchar un tiempo
          <div className='pos-chips'>
            {pendingCourses.map((c) => (
              <button key={c} type='button' className='pos-chip' disabled={busy} onClick={() => onFire(c)}>
                <span className='material-symbols-rounded'>skillet</span> {COURSE[c] ?? `Tiempo ${c}`}
              </button>
            ))}
          </div>
          <span className='pos-note'>Envía a cocina solo ese tiempo; lo demás espera hasta que lo marches.</span>
        </div>
      ) : null}

      <div className='pos-field'>
        Imprimir cuenta
        <div className='pos-chips'>
          <button type='button' className='pos-chip' disabled={busy || !items.length} onClick={() => onPrintBill('full')}>
            <span className='material-symbols-rounded'>receipt_long</span> Completa
          </button>
          <button type='button' className='pos-chip' disabled={busy || !hasSeats} onClick={() => onPrintBill('seats')} title={hasSeats ? '' : 'Asigna comensal a los platillos para usarla'}>
            <span className='material-symbols-rounded'>group</span> Por comensal
          </button>
        </div>
        <div className='pos-row' style={{ alignItems: 'end' }}>
          <div className='pos-stepper'>
            <button type='button' aria-label='Una parte menos' onClick={() => setParts((n) => Math.max(2, n - 1))}>
              <span className='material-symbols-rounded'>remove</span>
            </button>
            <strong>{parts}</strong>
            <button type='button' aria-label='Una parte más' onClick={() => setParts((n) => Math.min(20, n + 1))}>
              <span className='material-symbols-rounded'>add</span>
            </button>
          </div>
          <button type='button' className='btn__general-gray' disabled={busy || !items.length} onClick={() => onPrintBill('equal', parts)}>
            Dividir en {parts} partes iguales
          </button>
        </div>
      </div>

      {tickets.length ? (
        <div className='pos-field'>
          Comandas enviadas
          <ul className='pos-pick'>
            {tickets.map((n) => (
              <li key={n}>
                <label>
                  <span className='pos-pick__main'>
                    <strong>Comanda {n}</strong>
                    <small>{summary(n)}</small>
                  </span>
                  <span className='pos-pick__end' style={{ display: 'flex', gap: 6 }}>
                    <button type='button' className='btn__general-gray' disabled={busy} onClick={() => onRepeat(n)}>Repetir</button>
                    <button type='button' className='btn__general-gray' disabled={busy} onClick={() => onReprint(n)}>Reimprimir</button>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button type='button' className='btn__general-gray' disabled={busy} onClick={onWaiter}>
        <span className='material-symbols-rounded'>badge</span> Cambiar mesero
      </button>
    </PosModal>
  )
}

export default ModalMore
