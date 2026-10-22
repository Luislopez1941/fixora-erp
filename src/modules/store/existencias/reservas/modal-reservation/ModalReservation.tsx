import React, { useEffect, useState } from 'react'
import APIs from '../../../../../services/APIs'
import { dateShort, dateTime, daysUntil, errorText, qty, ymd } from '../../shared/stockFormat'
import './ModalReservation.css'

/** Renglones de un pedido: lo pendiente de entregar contra la existencia y lo disponible en su sucursal. */
const ModalReservation: React.FC<{ orderId: number; onClose: () => void }> = ({ orderId, onClose }) => {
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    APIs.getStockReservation(orderId)
      .then((res: any) => alive && setData(res?.data ?? null))
      .catch((e: any) => alive && setError(errorText(e, 'No se pudo cargar el pedido.')))
    return () => {
      alive = false
    }
  }, [orderId])

  const o = data?.order
  const day = o?.deliveryDate ? ymd(new Date(o.deliveryDate)) : null
  const d = daysUntil(day)

  return (
    <div className='cash-ui__overlay' role='dialog' aria-modal='true' onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='cash-ui__modal reservation-modal'>
        <div className='cash-ui__modal-head'>
          <h2>{o ? `Pedido ${o.serie}-${o.folio}` : 'Pedido'}</h2>
          <button type='button' onClick={onClose} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>
        <div className='cash-ui__modal-body'>
          {error ? <p className='reservation-modal__error'>{error}</p> : null}
          {!data && !error ? (
            <div className='reservation-modal__skeleton'>
              {Array.from({ length: 5 }, (_, i) => <span key={i} className='table-skeleton__shimmer' />)}
            </div>
          ) : null}
          {o ? (
            <>
              <dl className='reservation-modal__info'>
                <div><dt>Cliente</dt><dd>{o.customer}</dd></div>
                <div><dt>Sucursal</dt><dd>{o.branchName}</dd></div>
                <div><dt>Creado</dt><dd>{dateTime(o.createdAt)}{o.seller ? ` · ${o.seller}` : ''}</dd></div>
                <div>
                  <dt>Entrega</dt>
                  <dd className={d != null && d < 0 ? 'is-late' : ''}>
                    {day ? `${dateShort(day)}${d != null && d < 0 ? ` · atrasado ${-d} día${d === -1 ? '' : 's'}` : d === 0 ? ' · hoy' : ''}` : 'Sin fecha'}
                  </dd>
                </div>
              </dl>
              {o.comments ? <p className='reservation-modal__comments'>{o.comments}</p> : null}

              <h3 className='reservation-modal__title'>Renglones</h3>
              <ul className='reservation-modal__lines'>
                {data.lines.map((l: any) => {
                  const pending = l.quantity - l.delivered
                  const done = pending <= 0
                  const short = !done && l.available != null && l.available < 0
                  return (
                    <li key={l.id} className={done ? 'is-done' : ''}>
                      <span className='reservation-modal__name'>
                        <strong>{l.name || 'Concepto'}</strong>
                        <small>{l.code || (l.itemId ? 'Sin código' : 'Concepto libre (no aparta inventario)')}</small>
                      </span>
                      <span className='reservation-modal__progress'>
                        <small>Entregado {qty(l.delivered)} de {qty(l.quantity)} {l.unit ?? ''}</small>
                        <i aria-hidden><b style={{ width: `${Math.min(100, (l.delivered / Math.max(l.quantity, 1e-9)) * 100)}%` }} /></i>
                      </span>
                      <span className='reservation-modal__stock'>
                        {done ? (
                          <em className='is-ok'>Completo</em>
                        ) : l.itemId ? (
                          <>
                            <small>Existencia {qty(l.onHand)} · Disponible <b className={short ? 'is-neg' : ''}>{qty(l.available)}</b></small>
                            {short ? <em className='is-short'>No alcanza</em> : <em className='is-ok'>Cubierto</em>}
                          </>
                        ) : (
                          <small>—</small>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
              <p className='reservation-modal__note'>
                Disponible = existencia en la sucursal menos todo lo que apartan sus pedidos activos (incluido este). Las entregas se registran en Ventas › Pedidos.
              </p>
            </>
          ) : null}
          <div className='cash-ui__modal-actions'>
            <button type='button' className='btn__general-purple' onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalReservation
