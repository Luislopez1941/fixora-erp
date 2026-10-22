import React from 'react'
import { DAYS_SHORT, SCHEDULE_COLORS, WEEK_ORDER, fmtRange, segmentsOf } from '../../../shared/scheduleUtils'
import './ScheduleWeek.css'

interface Props {
  schedules: any[]
  onOpen?: (schedule: any) => void
}

const HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24]

/** Vista semanal compacta: cada horario activo es un bloque de color por día (los que cruzan la medianoche se parten). */
const ScheduleWeek: React.FC<Props> = ({ schedules, onOpen }) => {
  const active = schedules.filter((s) => s.active)
  return (
    <div className='schedule-week'>
      <div className='schedule-week__hours' aria-hidden>
        {HOURS.map((h) => (
          <span key={h} style={{ top: `${(h / 24) * 100}%` }}>{h === 24 ? '' : `${String(h).padStart(2, '0')}:00`}</span>
        ))}
      </div>
      <div className='schedule-week__grid'>
        {WEEK_ORDER.map((day) => (
          <div className='schedule-week__day' key={day}>
            <span className='schedule-week__day-name'>{DAYS_SHORT[day]}</span>
            <div className='schedule-week__track'>
              {HOURS.slice(1, -1).map((h) => (
                <i key={h} className='schedule-week__line' style={{ top: `${(h / 24) * 100}%` }} />
              ))}
              {active.flatMap((s, i) =>
                segmentsOf(s)
                  .filter(([d]) => d === day)
                  .map(([, a, b], k) => (
                    <button
                      type='button'
                      key={`${s.id}-${k}`}
                      className='schedule-week__block'
                      style={{ top: `${(a / 1440) * 100}%`, height: `${((b - a) / 1440) * 100}%`, background: s.color || SCHEDULE_COLORS[i % SCHEDULE_COLORS.length] }}
                      title={`${s.name} · ${fmtRange(s.startTime, s.endTime)}${s.register?.name ? ` · ${s.register.name}` : ''}`}
                      onClick={() => onOpen?.(s)}
                    >
                      <span>{s.name}</span>
                    </button>
                  )),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ScheduleWeek
