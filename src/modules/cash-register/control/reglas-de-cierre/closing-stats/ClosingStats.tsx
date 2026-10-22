import React from 'react'
import { money } from '../../../shared/cashFormat'
import './ClosingStats.css'

interface Stats {
  days: number
  closes: number
  balanced: number
  withinTolerance: number
  outOfTolerance: number
  approved: number
  totalShort: number
  totalOver: number
}

/** Cómo cerraron los turnos de los últimos 30 días frente a la tolerancia actual. */
const ClosingStats: React.FC<{ stats: Stats; tolerance: number }> = ({ stats, tolerance }) => {
  const total = stats?.closes ?? 0
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)
  const bars = [
    { key: 'balanced', label: 'Cuadraron', n: stats.balanced, cls: 'is-ok' },
    { key: 'within', label: 'Dentro de tolerancia', n: stats.withinTolerance, cls: 'is-mid' },
    { key: 'out', label: 'Fuera de tolerancia', n: stats.outOfTolerance, cls: 'is-bad' },
  ]
  return (
    <section className='cash-ui__card closing-stats'>
      <h2>Últimos {stats.days} días</h2>
      {!total ? (
        <p className='closing-stats__empty'>No hubo cierres en este periodo.</p>
      ) : (
        <>
          <div className='closing-stats__stack' aria-hidden>
            {bars.map((b) => (b.n ? <span key={b.key} className={b.cls} style={{ flex: b.n }} /> : null))}
          </div>
          <ul>
            {bars.map((b) => (
              <li key={b.key}>
                <i className={b.cls} aria-hidden />
                <span>{b.label}</span>
                <b>{b.n} <small>({pct(b.n)}%)</small></b>
              </li>
            ))}
          </ul>
          <div className='closing-stats__totals'>
            <span>Faltantes <b className='cash-ui__diff--short'>{money(stats.totalShort)}</b></span>
            <span>Sobrantes <b className='cash-ui__diff--over'>{money(stats.totalOver)}</b></span>
            <span>Con supervisor <b>{stats.approved}</b></span>
          </div>
          <p className='closing-stats__empty'>Con la tolerancia actual de {money(tolerance)} sobre {total} cierre{total === 1 ? '' : 's'}.</p>
        </>
      )}
    </section>
  )
}

export default ClosingStats
