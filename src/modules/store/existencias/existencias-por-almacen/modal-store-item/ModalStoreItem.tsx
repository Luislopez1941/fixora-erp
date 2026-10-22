import React, { useEffect, useState } from 'react'
import APIs from '../../../../../services/APIs'
import StatusBadge from '../../shared/status-badge/StatusBadge'
import { dateShort, dateTime, daysUntil, errorText, qty } from '../../shared/stockFormat'
import { MOVEMENT_LABEL } from '../movementLabels'
import './ModalStoreItem.css'

interface Props {
  storeId: number
  storeName: string
  row: { id: number; name: string; code: string | null; qty: number; min: number; max: number | null; status: string; track: boolean }
  canManage: boolean
  onEditLevels: (item: { id: number; name: string; min: number | null; max: number | null }) => void
  onClose: () => void
}

/** Detalle de un artículo en el almacén: variaciones, lotes vigentes y últimos movimientos del kardex. */
const ModalStoreItem: React.FC<Props> = ({ storeId, storeName, row, canManage, onEditLevels, onClose }) => {
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    APIs.getStockStoreItem(storeId, row.id)
      .then((res: any) => alive && setData(res?.data ?? null))
      .catch((e: any) => alive && setError(errorText(e, 'No se pudo cargar el detalle.')))
    return () => {
      alive = false
    }
  }, [storeId, row.id])

  const variations: any[] = (data?.variations ?? []).filter((v: any) => v.variationId !== 0 || (data?.variations ?? []).length > 1)

  return (
    <div className='cash-ui__overlay' role='dialog' aria-modal='true' onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='cash-ui__modal store-item-modal'>
        <div className='cash-ui__modal-head'>
          <h2>{row.name}</h2>
          <button type='button' onClick={onClose} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>
        <div className='cash-ui__modal-body'>
          <div className='store-item-modal__summary'>
            <div>
              <small>{storeName}</small>
              <strong>{row.track ? qty(row.qty) : '—'}</strong>
              <StatusBadge status={row.status} />
            </div>
            <div>
              <small>Mínimo / máximo</small>
              <strong>{qty(row.min)} / {row.max != null ? qty(row.max) : '—'}</strong>
              {canManage ? (
                <button type='button' className='store-item-modal__link' onClick={() => onEditLevels({ id: row.id, name: row.name, min: data?.item?.minStockAlert ?? row.min, max: data?.item?.maxStock ?? row.max })}>
                  <span className='material-symbols-rounded' aria-hidden>edit</span> Cambiar
                </button>
              ) : null}
            </div>
          </div>

          {error ? <p className='store-item-modal__error'>{error}</p> : null}
          {!data && !error ? (
            <div className='store-item-modal__skeleton'>
              {Array.from({ length: 5 }, (_, i) => <span key={i} className='table-skeleton__shimmer' />)}
            </div>
          ) : null}

          {data ? (
            <>
              {variations.length ? (
                <section className='store-item-modal__section'>
                  <h3>Variaciones</h3>
                  <ul className='store-item-modal__vars'>
                    {variations.map((v: any) => (
                      <li key={v.variationId}>
                        {v.colorHex ? <i style={{ background: v.colorHex }} aria-hidden /> : null}
                        <span>{v.variationId === 0 ? 'Sin variación' : [v.color, v.size].filter(Boolean).join(' · ')}</span>
                        <b className={v.qty <= 0 ? 'is-zero' : ''}>{qty(v.qty)}</b>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className='store-item-modal__section'>
                <h3>Lotes vigentes</h3>
                {data.lots?.length ? (
                  <ul className='store-item-modal__lots'>
                    {data.lots.map((l: any, i: number) => {
                      const d = daysUntil(l.expiryDate)
                      return (
                        <li key={`${l.lotCode}-${i}`}>
                          <span>
                            <strong>{l.lotCode}</strong>
                            <small>Recibido {dateShort(String(l.receivedAt).slice(0, 10))}</small>
                          </span>
                          <span className={d == null ? '' : d < 0 ? 'is-bad' : d <= 30 ? 'is-warn' : ''}>
                            {l.expiryDate ? `${d != null && d < 0 ? 'Venció' : 'Caduca'} ${dateShort(l.expiryDate)}` : 'Sin caducidad'}
                            {d != null && d >= 0 && d <= 30 ? <small> · {d === 0 ? 'hoy' : `en ${d} días`}</small> : null}
                          </span>
                          <b>{qty(l.remaining)} <small>de {qty(l.initial)}</small></b>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className='store-item-modal__empty'>Sin lotes con existencia en este almacén.</p>
                )}
              </section>

              <section className='store-item-modal__section'>
                <h3>Últimos movimientos</h3>
                {data.moves?.length ? (
                  <ul className='store-item-modal__moves'>
                    {data.moves.map((m: any, i: number) => (
                      <li key={i}>
                        <span className={`store-item-modal__delta ${m.delta >= 0 ? 'is-in' : 'is-out'}`}>{m.delta >= 0 ? '+' : ''}{qty(m.delta)}</span>
                        <span>
                          <strong>{MOVEMENT_LABEL[m.type] ?? m.type}</strong>
                          <small>{[dateTime(m.at), m.userName, m.reason].filter(Boolean).join(' · ')}</small>
                        </span>
                        <b title='Saldo después del movimiento'>{qty(m.balance)}</b>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className='store-item-modal__empty'>Sin movimientos registrados en el kardex.</p>
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

export default ModalStoreItem
