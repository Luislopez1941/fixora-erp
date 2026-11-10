import React from 'react'
import { COURSE, KitchenTicket, elapsedSince, timing } from './kitchenTypes'

interface Props {
  ticket: KitchenTicket
  now: number
  onItem: (itemId: number, ready: boolean) => void
  onDone: (ticket: KitchenTicket) => void
  onRush: (ticket: KitchenTicket) => void
}

const qty = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

/** Comanda en la pantalla de cocina: tocar un platillo lo marca listo; el botón grande cierra la comanda completa. */
const TicketCard: React.FC<Props> = ({ ticket, now, onItem, onDone, onRush }) => {
  const elapsed = elapsedSince(ticket.sentAt, now)
  const t = ticket.ready ? 'ok' : timing(elapsed, ticket.estimatedMinutes)
  const courses = [...new Set(ticket.items.map((i) => i.course))].sort()
  const showCourses = courses.length > 1

  return (
    <article className={`kds-card t-${t} ${ticket.rush ? 'is-rush' : ''} ${ticket.ready ? 'is-ready' : ''}`} aria-label={`${ticket.place}, comanda ${ticket.ticketNo}`}>
      <header className='kds-card__head'>
        <div className='kds-card__place'>{ticket.place}</div>
        <div className='kds-card__timer' aria-label={`${elapsed} minutos`}>
          <strong>{elapsed}′</strong>
          <small>{ticket.estimatedMinutes ? `de ${ticket.estimatedMinutes}′` : 'min'}</small>
        </div>
        <div className='kds-card__meta'>
          #{ticket.folio}·{ticket.ticketNo}
          {ticket.waiter ? ` · ${ticket.waiter}` : ''}
          {ticket.guests > 1 ? ` · ${ticket.guests} pers.` : ''}
        </div>
        {ticket.rush || (t === 'late' && !ticket.ready) ? (
          <div className='kds-card__flag'>
            {ticket.rush ? <span className='kds-tag'>Urgente</span> : null}
            {t === 'late' && !ticket.ready ? <span className='kds-tag is-late'>Atrasada</span> : null}
          </div>
        ) : null}
      </header>

      <div className='kds-card__items'>
        {courses.map((course) => (
          <React.Fragment key={course}>
            {showCourses ? <div className='kds-course'>{COURSE[course] ?? `Tiempo ${course}`}</div> : null}
            {ticket.items
              .filter((i) => i.course === course)
              .map((i) => {
                const ready = i.status === 'READY'
                return (
                  <button
                    key={i.id}
                    type='button'
                    className={`kds-item ${ready ? 'is-ready' : ''}`}
                    aria-pressed={ready}
                    aria-label={`${qty(i.quantity)} ${i.name}${ready ? ', listo' : ''}`}
                    onClick={() => onItem(i.id, !ready)}
                  >
                    <span className='kds-item__qty'>{qty(i.quantity)}</span>
                    <span>
                      <span className='kds-item__name'>{i.name}</span>
                      {i.modifiers.length ? <span className='kds-item__mods'>{i.modifiers.join(' · ')}</span> : null}
                      {i.notes ? <span className='kds-item__note'>“{i.notes}”</span> : null}
                      {i.seat ? <span className='kds-item__seat'>Comensal {i.seat}</span> : null}
                    </span>
                    <span className='kds-item__check' aria-hidden>
                      <span className='material-symbols-rounded'>check</span>
                    </span>
                  </button>
                )
              })}
          </React.Fragment>
        ))}
      </div>

      <footer className='kds-card__foot'>
        <button
          type='button'
          className={`kds-rush ${ticket.rush ? 'is-on' : ''}`}
          aria-pressed={ticket.rush}
          aria-label={ticket.rush ? 'Quitar urgente' : 'Marcar urgente'}
          title={ticket.rush ? 'Quitar urgente' : 'Marcar urgente'}
          onClick={() => onRush(ticket)}
        >
          <span className='material-symbols-rounded'>priority_high</span>
        </button>
        <button type='button' className='kds-done' onClick={() => onDone(ticket)}>
          {ticket.ready ? 'Entregada' : 'Lista'}
        </button>
      </footer>
    </article>
  )
}

export default TicketCard
