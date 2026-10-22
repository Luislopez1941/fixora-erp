import React from 'react'
import StatusBadge from '../../shared/status-badge/StatusBadge'
import { dateShort, dateTime, daysUntil, qty } from '../../shared/stockFormat'
import './StoreStockTable.css'

interface Row {
  id: number
  code: string | null
  name: string
  category: string | null
  track: boolean
  min: number
  max: number | null
  qty: number
  vars: number
  lots: number
  nextExpiry: string | null
  lastMove: string | null
  status: string
}

/** Barra de nivel: dónde está la existencia entre 0, el mínimo y el máximo (o el doble del mínimo si no hay máximo). */
const LevelBar: React.FC<{ r: Row }> = ({ r }) => {
  if (!r.track) return <small className='store-stock__muted'>Sin rastreo</small>
  const top = Math.max(r.max ?? r.min * 2, r.min, r.qty, 1)
  const pct = Math.min(100, Math.max(0, (r.qty / top) * 100))
  const minPct = Math.min(100, (r.min / top) * 100)
  return (
    <div className='store-stock__level'>
      <div className={`store-stock__bar is-${r.status}`}>
        <span style={{ width: `${pct}%` }} />
        <i style={{ left: `${minPct}%` }} title={`Mínimo ${qty(r.min)}`} />
      </div>
      <small>Mín. {qty(r.min)}{r.max != null ? ` · Máx. ${qty(r.max)}` : ''}</small>
    </div>
  )
}

const ExpiryCell: React.FC<{ r: Row }> = ({ r }) => {
  if (!r.lots) return <small className='store-stock__muted'>—</small>
  const d = daysUntil(r.nextExpiry)
  const tone = d == null ? '' : d < 0 ? 'is-bad' : d <= 30 ? 'is-warn' : ''
  return (
    <span className='store-stock__lots'>
      <b>{r.lots} lote{r.lots === 1 ? '' : 's'}</b>
      {r.nextExpiry ? <small className={tone}>{d != null && d < 0 ? 'Vencido' : 'Caduca'} {dateShort(r.nextExpiry)}</small> : <small>Sin caducidad</small>}
    </span>
  )
}

/** Tabla de existencias del almacén; tarjetas en celular. */
const StoreStockTable: React.FC<{ rows: Row[]; onOpen: (r: Row) => void }> = ({ rows, onOpen }) => {
  if (!rows.length) {
    return (
      <div className='cash-ui__state'>
        <span className='material-symbols-rounded' aria-hidden>inventory_2</span>
        <p>No hay artículos con estos filtros en este almacén.</p>
      </div>
    )
  }
  return (
    <div className='cash-ui__list store-stock'>
      <div className='cash-ui__row cash-ui__row--head store-stock__row'>
        <span>Artículo</span>
        <span className='is-num'>Existencia</span>
        <span>Nivel</span>
        <span>Lotes</span>
        <span>Último movimiento</span>
        <span>Estado</span>
      </div>
      {rows.map((r) => (
        <button type='button' key={r.id} className='cash-ui__row store-stock__row' onClick={() => onOpen(r)}>
          <span className='store-stock__item'>
            <strong>{r.name}</strong>
            <small>{[r.code, r.category, r.vars ? `${r.vars} variación${r.vars === 1 ? '' : 'es'}` : ''].filter(Boolean).join(' · ') || 'Sin código'}</small>
          </span>
          <span className='is-num store-stock__qty' data-label='Existencia'>{r.track ? qty(r.qty) : '—'}</span>
          <span data-label='Nivel'><LevelBar r={r} /></span>
          <span data-label='Lotes'><ExpiryCell r={r} /></span>
          <span data-label='Último movimiento'><small>{r.lastMove ? dateTime(r.lastMove) : 'Sin movimientos'}</small></span>
          <span className='store-stock__status'><StatusBadge status={r.status} /></span>
        </button>
      ))}
    </div>
  )
}

export default StoreStockTable
