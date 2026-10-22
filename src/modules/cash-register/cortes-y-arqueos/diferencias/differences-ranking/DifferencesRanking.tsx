import React from 'react'
import { money } from '../../../shared/cashFormat'
import './DifferencesRanking.css'

interface Props {
  rows: { id: number | null; name: string; events: number; short: number; over: number; net: number }[]
  empty: string
}

/** Ranking (cajeros o cajas) ordenado por faltante: barra proporcional al faltante y el neto de cada uno. */
const DifferencesRanking: React.FC<Props> = ({ rows, empty }) => {
  if (!rows.length) return <p className='differences-ranking__empty'>{empty}</p>
  const maxShort = Math.max(...rows.map((r) => Math.abs(r.short)), 0)
  return (
    <ul className='differences-ranking'>
      {rows.map((r, i) => (
        <li key={`${r.id ?? 'none'}-${i}`}>
          <div className='differences-ranking__head'>
            <span className='differences-ranking__name' title={r.name}>{r.name}</span>
            <strong className={r.net < 0 ? 'is-short' : r.net > 0 ? 'is-over' : ''}>{money(r.net)}</strong>
          </div>
          <div className='differences-ranking__track'>
            <span style={{ width: `${maxShort > 0 ? Math.max(2, (Math.abs(r.short) / maxShort) * 100) : 0}%` }} />
          </div>
          <small>
            Faltante {money(r.short)} · Sobrante {money(r.over)} · {r.events} evento(s)
          </small>
        </li>
      ))}
    </ul>
  )
}

export default DifferencesRanking
