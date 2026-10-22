import React from 'react'
import { qty } from '../../shared/stockFormat'
import './BranchTotals.css'

/** Unidades y artículos con existencia en cada sucursal (con los filtros de categoría y búsqueda). */
const BranchTotals: React.FC<{ branches: { id: number; name: string; units: number; withStock: number }[] }> = ({ branches }) => {
  const max = Math.max(1, ...branches.map((b) => b.units))
  return (
    <section className='branch-totals' aria-label='Totales por sucursal'>
      {branches.map((b) => (
        <div key={b.id} className='branch-totals__item'>
          <div className='branch-totals__head'>
            <span className='material-symbols-rounded' aria-hidden>storefront</span>
            <strong>{b.name}</strong>
          </div>
          <b>{qty(b.units)} <small>unidades</small></b>
          <div className='branch-totals__bar' aria-hidden>
            <span style={{ width: `${Math.round((b.units / max) * 100)}%` }} />
          </div>
          <small>{qty(b.withStock)} artículos con existencia</small>
        </div>
      ))}
    </section>
  )
}

export default BranchTotals
