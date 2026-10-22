import React from 'react'
import { dateShort, dateTime, money, qty } from '../../shared/stockFormat'
import './ReservationsTable.css'

interface Row {
  id: number
  folio: number
  serie: string
  createdAt: string
  deliveryDate: string | null
  branchName: string
  customer: string
  lines: number
  pieces: number
  amount: number
  overdue: boolean
  shortage: boolean
}

/** Pedidos con piezas apartadas; atrasados primero. Tarjetas en celular. */
const ReservationsTable: React.FC<{ rows: Row[]; onOpen: (r: Row) => void }> = ({ rows, onOpen }) => {
  if (!rows.length) {
    return (
      <div className='cash-ui__state'>
        <span className='material-symbols-rounded' aria-hidden>bookmark_added</span>
        <p>No hay pedidos con mercancía por entregar.</p>
      </div>
    )
  }
  return (
    <div className='cash-ui__list reservations'>
      <div className='cash-ui__row cash-ui__row--head reservations__row'>
        <span>Pedido</span>
        <span>Cliente</span>
        <span>Entrega</span>
        <span className='is-num'>Piezas</span>
        <span className='is-num'>Importe</span>
        <span>Alertas</span>
      </div>
      {rows.map((r) => (
        <button type='button' key={r.id} className={`cash-ui__row reservations__row ${r.overdue ? 'is-overdue' : ''}`} onClick={() => onOpen(r)}>
          <span className='reservations__order'>
            <strong>{r.serie}-{r.folio}</strong>
            <small>{r.branchName} · {dateTime(r.createdAt)}</small>
          </span>
          <span className='reservations__customer' data-label='Cliente'>{r.customer}</span>
          <span data-label='Entrega'>
            {r.deliveryDate ? <b className={r.overdue ? 'reservations__late' : ''}>{dateShort(r.deliveryDate)}</b> : <small>Sin fecha</small>}
          </span>
          <span className='is-num' data-label='Piezas'>
            <b>{qty(r.pieces)}</b>
            <small>{r.lines} renglón{r.lines === 1 ? '' : 'es'}</small>
          </span>
          <span className='is-num' data-label='Importe'>{money(r.amount)}</span>
          <span className='reservations__flags'>
            {r.overdue ? <em className='reservations__flag is-late'>Atrasado</em> : null}
            {r.shortage ? <em className='reservations__flag is-short'>Faltante</em> : null}
            {!r.overdue && !r.shortage ? <em className='reservations__flag is-ok'>En tiempo</em> : null}
          </span>
        </button>
      ))}
    </div>
  )
}

export default ReservationsTable
