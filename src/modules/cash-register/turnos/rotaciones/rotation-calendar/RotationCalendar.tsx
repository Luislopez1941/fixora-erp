import React from 'react'
import { DAYS_SHORT, fmtRange } from '../../../shared/scheduleUtils'
import './RotationCalendar.css'

interface Cell {
  status: 'WORK' | 'REST' | 'NOT_STARTED'
  week: number
  scheduleName?: string
  startTime?: string
  endTime?: string
  color?: string | null
  registerName?: string | null
  scheduleActive?: boolean
}
interface Row {
  userId: number
  name: string
  rotationId: number
  rotationName: string
  days: Record<string, Cell>
}

const WEEK_LETTER = (i: number) => String.fromCharCode(65 + i)
const dowOf = (day: string) => new Date(`${day}T12:00:00`).getDay()
const label = (day: string) => `${DAYS_SHORT[dowOf(day)]} ${Number(day.slice(8, 10))}`

/** Quién trabaja cuándo: tabla integrantes × días en escritorio; en celular, un bloque por día con quién entra. */
const RotationCalendar: React.FC<{ days: string[]; rows: Row[]; today: string }> = ({ days, rows, today }) => {
  if (!rows.length) {
    return (
      <div className='cash-ui__state'>
        <span className='material-symbols-rounded' aria-hidden>event_busy</span>
        <p>No hay integrantes en rotaciones activas.</p>
      </div>
    )
  }

  return (
    <>
      <div className='rotation-calendar' style={{ ['--rc-days' as any]: days.length }}>
        <div className='rotation-calendar__row rotation-calendar__row--head'>
          <span>Integrante</span>
          {days.map((d) => (
            <span key={d} className={`${d === today ? 'is-today' : ''} ${[0, 6].includes(dowOf(d)) ? 'is-weekend' : ''}`}>{label(d)}</span>
          ))}
        </div>
        {rows.map((r) => (
          <div className='rotation-calendar__row' key={`${r.rotationId}-${r.userId}`}>
            <span className='rotation-calendar__who'>
              <strong>{r.name}</strong>
              <small>{r.rotationName}</small>
            </span>
            {days.map((d) => {
              const c = r.days[d]
              if (!c || c.status !== 'WORK') {
                return (
                  <span key={d} className={`rotation-calendar__cell is-rest ${d === today ? 'is-today' : ''}`} title={c?.status === 'NOT_STARTED' ? 'La rotación aún no inicia' : 'Descanso'}>
                    {c?.status === 'NOT_STARTED' ? '·' : 'Desc.'}
                  </span>
                )
              }
              return (
                <span
                  key={d}
                  className={`rotation-calendar__cell ${d === today ? 'is-today' : ''} ${c.scheduleActive === false ? 'is-off' : ''}`}
                  style={{ ['--rc-color' as any]: c.color || 'var(--primary-color)' }}
                  title={`${c.scheduleName} · ${fmtRange(c.startTime!, c.endTime!)}${c.registerName ? ` · ${c.registerName}` : ''} · Semana ${WEEK_LETTER(c.week)}`}
                >
                  <b>{c.scheduleName}</b>
                  <small>{fmtRange(c.startTime!, c.endTime!)}</small>
                </span>
              )
            })}
          </div>
        ))}
      </div>

      <div className='rotation-calendar-days'>
        {days.map((d) => {
          const working = rows.filter((r) => r.days[d]?.status === 'WORK')
          return (
            <section key={d} className={`rotation-calendar-days__day ${d === today ? 'is-today' : ''}`}>
              <h3>{label(d)}{d === today ? ' · Hoy' : ''}</h3>
              {working.length ? (
                <ul>
                  {working.map((r) => {
                    const c = r.days[d]
                    return (
                      <li key={`${r.rotationId}-${r.userId}`} style={{ ['--rc-color' as any]: c.color || 'var(--primary-color)' }}>
                        <strong>{r.name}</strong>
                        <span>{c.scheduleName} · {fmtRange(c.startTime!, c.endTime!)}</span>
                        <small>{r.rotationName} · Semana {WEEK_LETTER(c.week)}{c.registerName ? ` · ${c.registerName}` : ''}</small>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p>Nadie programado.</p>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}

export default RotationCalendar
