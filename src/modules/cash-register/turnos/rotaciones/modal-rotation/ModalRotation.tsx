import React, { useMemo, useState } from 'react'
import APIs from '../../../../../services/APIs'
import DateField from '../../../../../components/general/date-field/DateField'
import IOSSwitch from '../../../../../components/sidebar/sections/catalogos/shared/IOSSwitch'
import { showToast } from '../../../../../utils/toast'
import { errorText, ymd } from '../../../shared/cashFormat'
import { DAYS_SHORT, WEEK_ORDER, fmtRange } from '../../../shared/scheduleUtils'
import '../../../../../components/sidebar/sections/catalogos/shared/IOSSwitch.css'
import './ModalRotation.css'

interface Props {
  branchId: number
  rotation?: any
  schedules: any[]
  users: { id: number; name: string }[]
  onClose: () => void
  onSaved: () => void
}

const WEEK_LETTER = (i: number) => String.fromCharCode(65 + i)
/** Próximo lunes (o hoy si es lunes): buen inicio de ciclo por defecto. */
const nextMonday = () => {
  const d = new Date()
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7))
  return ymd(d)
}

/** Crear o editar una rotación: ciclo en semanas, patrón (qué horario toca cada día de cada semana) e integrantes con desfase. */
const ModalRotation: React.FC<Props> = ({ branchId, rotation, schedules, users, onClose, onSaved }) => {
  const editing = !!rotation
  const [name, setName] = useState<string>(rotation?.name ?? '')
  const [cycleWeeks, setCycleWeeks] = useState<number>(rotation?.cycleWeeks ?? 2)
  const [startDate, setStartDate] = useState<string>(rotation?.startDate ?? nextMonday())
  const [active, setActive] = useState<boolean>(rotation?.active ?? true)
  // Patrón: "semana:día" → id de horario (0 = descanso)
  const [pattern, setPattern] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = {}
    for (const s of rotation?.slots ?? []) p[`${s.weekIndex}:${s.dayOfWeek}`] = s.scheduleId ?? 0
    return p
  })
  const [members, setMembers] = useState<{ userId: number; offsetWeeks: number }[]>(() => (rotation?.members ?? []).map((m: any) => ({ userId: m.userId, offsetWeeks: m.offsetWeeks })))
  const [newMember, setNewMember] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const activeSchedules = useMemo(() => schedules.filter((s) => s.active), [schedules])
  const scheduleName = (id: number) => schedules.find((s) => s.id === id)?.name ?? ''

  const save = async () => {
    if (!name.trim()) return setError('Escribe el nombre de la rotación.')
    const slots: { weekIndex: number; dayOfWeek: number; scheduleId: number | null }[] = []
    for (let w = 0; w < cycleWeeks; w++) for (const d of WEEK_ORDER) slots.push({ weekIndex: w, dayOfWeek: d, scheduleId: pattern[`${w}:${d}`] || null })
    if (!slots.some((s) => s.scheduleId)) return setError('Pon al menos un horario en el patrón.')
    setSaving(true)
    setError('')
    const data = { branchId, name: name.trim(), cycleWeeks, startDate, active, slots, members: members.map((m) => ({ ...m, offsetWeeks: Math.min(m.offsetWeeks, cycleWeeks - 1) })) }
    try {
      if (editing) await APIs.updateCashRotation(rotation.id, data)
      else await APIs.createCashRotation(data)
      showToast({ type: 'success', title: editing ? 'Rotación actualizada' : 'Rotación creada', text: data.name })
      onSaved()
      onClose()
    } catch (e) {
      setError(errorText(e, 'No se pudo guardar la rotación.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='cash-ui__overlay' role='dialog' aria-modal='true' onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='cash-ui__modal rotation-modal'>
        <div className='cash-ui__modal-head'>
          <h2>{editing ? `Editar rotación · ${rotation.name}` : 'Nueva rotación'}</h2>
          <button type='button' onClick={onClose} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>
        <div className='cash-ui__modal-body'>
          <div className='rotation-modal__grid'>
            <label className='rotation-modal__field rotation-modal__field--wide'>
              <span>Nombre</span>
              <input className='inputs__general' value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder='Ej. Cajeros A/B' />
            </label>
            <label className='rotation-modal__field'>
              <span>Ciclo</span>
              <select className='inputs__general' value={cycleWeeks} onChange={(e) => setCycleWeeks(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>{n} semana{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </label>
            <label className='rotation-modal__field'>
              <span>Inicia el</span>
              <DateField className='inputs__general' value={startDate} onChange={(v) => v && setStartDate(v)} />
            </label>
          </div>

          <div className='rotation-modal__section'>
            <h3>Patrón</h3>
            <p>Qué horario toca cada día. Vacío = descanso. Solo aparecen los horarios activos que aplican ese día.</p>
            <div className='rotation-modal__pattern'>
              <div className='rotation-modal__pattern-row rotation-modal__pattern-row--head'>
                <span />
                {WEEK_ORDER.map((d) => <span key={d}>{DAYS_SHORT[d]}</span>)}
              </div>
              {Array.from({ length: cycleWeeks }, (_, w) => (
                <div className='rotation-modal__pattern-row' key={w}>
                  <span className='rotation-modal__week'>Sem. {WEEK_LETTER(w)}</span>
                  {WEEK_ORDER.map((d) => {
                    const key = `${w}:${d}`
                    const options = activeSchedules.filter((s) => (s.days ?? []).includes(d))
                    return (
                      <select
                        key={d}
                        className={`rotation-modal__cell ${pattern[key] ? 'is-work' : ''}`}
                        value={pattern[key] ?? 0}
                        onChange={(e) => setPattern((p) => ({ ...p, [key]: Number(e.target.value) }))}
                        aria-label={`Semana ${WEEK_LETTER(w)}, ${DAYS_SHORT[d]}`}
                        title={pattern[key] ? scheduleName(pattern[key]) : 'Descanso'}
                      >
                        <option value={0}>—</option>
                        {options.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({fmtRange(s.startTime, s.endTime)})</option>
                        ))}
                      </select>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className='rotation-modal__section'>
            <h3>Integrantes</h3>
            <p>Con desfase, cada integrante empieza en otra semana del patrón (p. ej. uno en la A y otro en la B).</p>
            {members.length ? (
              <ul className='rotation-modal__members'>
                {members.map((m, i) => (
                  <li key={m.userId}>
                    <span>{users.find((u) => u.id === m.userId)?.name ?? `Usuario ${m.userId}`}</span>
                    <select
                      className='inputs__general'
                      value={m.offsetWeeks}
                      onChange={(e) => setMembers((list) => list.map((x, j) => (j === i ? { ...x, offsetWeeks: Number(e.target.value) } : x)))}
                      aria-label='Semana en la que empieza'
                    >
                      {Array.from({ length: cycleWeeks }, (_, w) => (
                        <option key={w} value={w}>Empieza en la semana {WEEK_LETTER(w)}</option>
                      ))}
                    </select>
                    <button type='button' onClick={() => setMembers((list) => list.filter((_, j) => j !== i))} aria-label='Quitar integrante'>
                      <span className='material-symbols-rounded'>close</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='rotation-modal__empty'>Sin integrantes todavía.</p>
            )}
            <div className='rotation-modal__add'>
              <select className='inputs__general' value={newMember} onChange={(e) => setNewMember(Number(e.target.value))} aria-label='Agregar integrante'>
                <option value={0}>Agregar integrante…</option>
                {users.filter((u) => !members.some((m) => m.userId === u.id)).map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <button
                type='button'
                className='btn__general-purple'
                disabled={!newMember}
                onClick={() => {
                  // Reparte el desfase en orden: 0, 1, 2… para que no todos empiecen en la misma semana
                  setMembers((list) => [...list, { userId: newMember, offsetWeeks: list.length % cycleWeeks }])
                  setNewMember(0)
                }}
              >
                Agregar
              </button>
            </div>
          </div>

          <div className='rotation-modal__switch'>
            <div>
              <strong>Activa</strong>
              <small>Solo las rotaciones activas aparecen en el calendario.</small>
            </div>
            <IOSSwitch checked={active} onChange={setActive} ariaLabel='Rotación activa' />
          </div>

          {error ? <p className='rotation-modal__error'>{error}</p> : null}

          <div className='cash-ui__modal-actions'>
            <button type='button' className='btn__general-secondary' onClick={onClose}>Cancelar</button>
            <button type='button' className='btn__general-purple' onClick={save} disabled={saving}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear rotación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalRotation
