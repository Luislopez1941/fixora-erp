import React, { useEffect, useState } from 'react'
import APIs from '../../../../../services/APIs'
import StatusBadge from '../../shared/status-badge/StatusBadge'
import { errorText, qty } from '../../shared/stockFormat'
import './ModalItemStores.css'

interface Props {
  row: { id: number; name: string; code: string | null; total: number; min: number; status: string }
  companyId: number | null
  onClose: () => void
}

/** Detalle de un artículo: cuánto hay en cada almacén, agrupado por sucursal. */
const ModalItemStores: React.FC<Props> = ({ row, companyId, onClose }) => {
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    APIs.getStockItemStores(row.id, companyId)
      .then((res: any) => alive && setData(res?.data ?? null))
      .catch((e: any) => alive && setError(errorText(e, 'No se pudo cargar el detalle.')))
    return () => {
      alive = false
    }
  }, [row.id, companyId])

  const groups: { branch: string; stores: any[]; total: number }[] = []
  for (const s of data?.stores ?? []) {
    let g = groups.find((x) => x.branch === s.branchName)
    if (!g) groups.push((g = { branch: s.branchName, stores: [], total: 0 }))
    g.stores.push(s)
    g.total += s.qty
  }

  return (
    <div className='cash-ui__overlay' role='dialog' aria-modal='true' onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='cash-ui__modal item-stores-modal'>
        <div className='cash-ui__modal-head'>
          <h2>{row.name}</h2>
          <button type='button' onClick={onClose} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>
        <div className='cash-ui__modal-body'>
          <div className='item-stores-modal__summary'>
            <span>{row.code || 'Sin código'}</span>
            <span>Total <b>{qty(row.total)}</b></span>
            <span>Mínimo <b>{qty(row.min)}</b></span>
            <StatusBadge status={row.status} />
          </div>
          {error ? <p className='item-stores-modal__error'>{error}</p> : null}
          {!data && !error ? (
            <div className='item-stores-modal__skeleton'>
              {Array.from({ length: 4 }, (_, i) => <span key={i} className='table-skeleton__shimmer' />)}
            </div>
          ) : null}
          {groups.map((g) => (
            <section key={g.branch} className='item-stores-modal__group'>
              <header>
                <span className='material-symbols-rounded' aria-hidden>storefront</span>
                <strong>{g.branch}</strong>
                <b>{qty(g.total)}</b>
              </header>
              <ul>
                {g.stores.map((s) => (
                  <li key={s.storeId} className={s.qty <= 0 ? 'is-zero' : ''}>
                    <span>{s.storeName}</span>
                    <b>{qty(s.qty)}</b>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <div className='cash-ui__modal-actions'>
            <button type='button' className='btn__general-purple' onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalItemStores
