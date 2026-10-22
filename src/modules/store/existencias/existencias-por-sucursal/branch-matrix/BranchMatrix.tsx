import React from 'react'
import StatusBadge from '../../shared/status-badge/StatusBadge'
import { qty } from '../../shared/stockFormat'
import './BranchMatrix.css'

interface Row {
  id: number
  code: string | null
  name: string
  category: string | null
  track: boolean
  min: number
  total: number
  status: string
  byBranch: Record<number, { qty: number; enabled: boolean }>
}

/** Celda de una sucursal: "—" si el artículo no se vende ahí y no tiene existencia; rojo en 0, naranja bajo el mínimo. */
const cellTone = (r: Row, c?: { qty: number; enabled: boolean }) => {
  if (!c || (!c.enabled && !c.qty)) return 'is-na'
  if (!r.track) return ''
  if (c.qty <= 0) return 'is-out'
  if (c.qty < r.min) return 'is-low'
  return ''
}

/** Tabla artículo × sucursal. En celular cada artículo es una tarjeta con sus sucursales. */
const BranchMatrix: React.FC<{ rows: Row[]; branches: { id: number; name: string }[]; onOpen: (r: Row) => void }> = ({ rows, branches, onOpen }) => {
  if (!rows.length) {
    return (
      <div className='cash-ui__state'>
        <span className='material-symbols-rounded' aria-hidden>inventory_2</span>
        <p>No hay artículos con estos filtros.</p>
      </div>
    )
  }
  const cols = `minmax(220px, 2.4fr) repeat(${branches.length}, minmax(92px, 1fr)) minmax(92px, 1fr) 120px`
  return (
    <div className='branch-matrix' role='table' aria-label='Existencias por sucursal'>
      <div className='branch-matrix__row branch-matrix__row--head' role='row' style={{ gridTemplateColumns: cols }}>
        <span role='columnheader'>Artículo</span>
        {branches.map((b) => <span key={b.id} role='columnheader' className='is-num'>{b.name}</span>)}
        <span role='columnheader' className='is-num'>Total</span>
        <span role='columnheader'>Estado</span>
      </div>
      {rows.map((r) => (
        <button type='button' key={r.id} className='branch-matrix__row' role='row' style={{ gridTemplateColumns: cols }} onClick={() => onOpen(r)}>
          <span className='branch-matrix__item' role='cell'>
            <strong>{r.name}</strong>
            <small>{[r.code, r.category].filter(Boolean).join(' · ') || 'Sin código'}</small>
          </span>
          {branches.map((b) => {
            const c = r.byBranch?.[b.id]
            const tone = cellTone(r, c)
            return (
              <span key={b.id} role='cell' className={`branch-matrix__cell is-num ${tone}`} data-label={b.name}>
                {tone === 'is-na' ? '—' : qty(c?.qty)}
              </span>
            )
          })}
          <span role='cell' className='branch-matrix__total is-num' data-label='Total'>{r.track ? qty(r.total) : '—'}</span>
          <span role='cell' className='branch-matrix__status'><StatusBadge status={r.status} /></span>
        </button>
      ))}
    </div>
  )
}

export default BranchMatrix
