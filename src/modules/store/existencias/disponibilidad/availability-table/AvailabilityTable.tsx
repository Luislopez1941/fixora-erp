import React from 'react'
import StatusBadge from '../../shared/status-badge/StatusBadge'
import { qty } from '../../shared/stockFormat'
import './AvailabilityTable.css'

interface Row {
  id: number
  code: string | null
  name: string
  category: string | null
  track: boolean
  min: number
  onHand: number
  committed: number
  available: number
  orders: number
  status: string
}

/** Barra: parte comprometida (naranja) y parte libre (verde) de la existencia; si falta, la barra entera es roja. */
const SplitBar: React.FC<{ r: Row }> = ({ r }) => {
  if (!r.track) return null
  if (r.available < 0) return <div className='availability__bar is-short' title='Lo comprometido supera la existencia'><span style={{ width: '100%' }} /></div>
  const total = Math.max(r.onHand, 1)
  return (
    <div className='availability__bar' aria-hidden>
      <span className='is-committed' style={{ width: `${(r.committed / total) * 100}%` }} />
      <span className='is-free' style={{ width: `${(Math.max(r.available, 0) / total) * 100}%` }} />
    </div>
  )
}

/** Tabla de disponibilidad: existencia, comprometido y disponible por artículo; tarjetas en celular. */
const AvailabilityTable: React.FC<{ rows: Row[]; onOpen: (r: Row) => void }> = ({ rows, onOpen }) => {
  if (!rows.length) {
    return (
      <div className='cash-ui__state'>
        <span className='material-symbols-rounded' aria-hidden>inventory</span>
        <p>No hay artículos con estos filtros.</p>
      </div>
    )
  }
  return (
    <div className='cash-ui__list availability'>
      <div className='cash-ui__row cash-ui__row--head availability__row'>
        <span>Artículo</span>
        <span className='is-num'>Existencia</span>
        <span className='is-num'>Comprometido</span>
        <span className='is-num'>Disponible</span>
        <span>Reparto</span>
        <span>Estado</span>
      </div>
      {rows.map((r) => (
        <button type='button' key={r.id} className='cash-ui__row availability__row' onClick={() => onOpen(r)}>
          <span className='availability__item'>
            <strong>{r.name}</strong>
            <small>{[r.code, r.category].filter(Boolean).join(' · ') || 'Sin código'}</small>
          </span>
          <span className='is-num' data-label='Existencia'>{r.track ? qty(r.onHand) : '—'}</span>
          <span className='is-num' data-label='Comprometido'>
            {r.committed ? <b className='availability__committed'>{qty(r.committed)}</b> : '0'}
            {r.orders ? <small>{r.orders} pedido{r.orders === 1 ? '' : 's'}</small> : null}
          </span>
          <span className={`is-num availability__available ${r.track && r.available <= 0 ? 'is-neg' : ''}`} data-label='Disponible'>{r.track ? qty(r.available) : '—'}</span>
          <span className='availability__split' data-label='Reparto'><SplitBar r={r} /></span>
          <span className='availability__status'><StatusBadge status={r.status} /></span>
        </button>
      ))}
    </div>
  )
}

export default AvailabilityTable
