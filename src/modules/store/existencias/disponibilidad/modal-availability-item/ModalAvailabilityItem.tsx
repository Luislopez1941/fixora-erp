import React, { useEffect, useState } from 'react'
import APIs from '../../../../../services/APIs'
import StatusBadge from '../../shared/status-badge/StatusBadge'
import { dateShort, daysUntil, errorText, qty, ymd } from '../../shared/stockFormat'
import './ModalAvailabilityItem.css'

interface Props {
  row: { id: number; name: string; code: string | null; onHand: number; committed: number; available: number; status: string }
  companyId: number | null
  branchId?: number
  onClose: () => void
}

/** Qué pedidos comprometen el artículo y en qué almacenes está la existencia. */
const ModalAvailabilityItem: React.FC<Props> = ({ row, companyId, branchId, onClose }) => {
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    APIs.getStockAvailabilityItem(row.id, { companyId, branchId })
      .then((res: any) => alive && setData(res?.data ?? null))
      .catch((e: any) => alive && setError(errorText(e, 'No se pudo cargar el detalle.')))
    return () => {
      alive = false
    }
  }, [row.id, companyId, branchId])

  return (
    <div className='cash-ui__overlay' role='dialog' aria-modal='true' onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='cash-ui__modal availability-modal'>
        <div className='cash-ui__modal-head'>
          <h2>{row.name}</h2>
          <button type='button' onClick={onClose} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>
        <div className='cash-ui__modal-body'>
          <div className='availability-modal__math'>
            <div><small>Existencia</small><b>{qty(row.onHand)}</b></div>
            <span aria-hidden>−</span>
            <div><small>Comprometido</small><b className='is-committed'>{qty(row.committed)}</b></div>
            <span aria-hidden>=</span>
            <div><small>Disponible</small><b className={row.available < 0 ? 'is-neg' : 'is-free'}>{qty(row.available)}</b></div>
            <StatusBadge status={row.status} />
          </div>

          {error ? <p className='availability-modal__error'>{error}</p> : null}
          {!data && !error ? (
            <div className='availability-modal__skeleton'>
              {Array.from({ length: 4 }, (_, i) => <span key={i} className='table-skeleton__shimmer' />)}
            </div>
          ) : null}

          {data ? (
            <>
              <section className='availability-modal__section'>
                <h3>Pedidos que lo apartan</h3>
                {data.orders?.length ? (
                  <ul>
                    {data.orders.map((o: any) => {
                      const day = o.deliveryDate ? ymd(new Date(o.deliveryDate)) : null
                      const d = daysUntil(day)
                      return (
                        <li key={o.orderId}>
                          <span>
                            <strong>{o.serie}-{o.folio} · {o.customer}</strong>
                            <small className={d != null && d < 0 ? 'is-late' : ''}>
                              {o.branchName}{day ? ` · entrega ${dateShort(day)}${d != null && d < 0 ? ' (atrasado)' : ''}` : ' · sin fecha de entrega'}
                            </small>
                          </span>
                          <b>{qty(o.pending)}</b>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className='availability-modal__empty'>Ningún pedido activo aparta este artículo.</p>
                )}
              </section>
              <section className='availability-modal__section'>
                <h3>Existencia por almacén</h3>
                {data.stores?.length ? (
                  <ul>
                    {data.stores.map((s: any) => (
                      <li key={s.storeId}>
                        <span>
                          <strong>{s.storeName}</strong>
                          <small>{s.branchName}</small>
                        </span>
                        <b className={s.qty <= 0 ? 'is-neg' : ''}>{qty(s.qty)}</b>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className='availability-modal__empty'>Sin existencia en los almacenes.</p>
                )}
              </section>
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

export default ModalAvailabilityItem
