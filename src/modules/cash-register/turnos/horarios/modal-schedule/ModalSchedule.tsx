import React, { useState } from 'react'
import APIs from '../../../../../services/APIs'
import IOSSwitch from '../../../../../components/sidebar/sections/catalogos/shared/IOSSwitch'
import { showToast } from '../../../../../utils/toast'
import { errorText } from '../../../shared/cashFormat'
import { DAYS_SHORT, SCHEDULE_COLORS, WEEK_ORDER, crossesMidnight } from '../../../shared/scheduleUtils'
import '../../../../../components/sidebar/sections/catalogos/shared/IOSSwitch.css'
import './ModalSchedule.css'

interface Props {
  branchId: number
  registers: { id: number; name: string; active?: boolean }[]
  /** Horario a editar, o base para duplicar (mode = 'duplicate'); sin él se crea uno nuevo */
  schedule?: any
  mode?: 'create' | 'edit' | 'duplicate'
  onClose: () => void
  onSaved: () => void
}

/** Crear, editar o duplicar un horario de turno (los traslapes por caja los valida el servidor). */
const ModalSchedule: React.FC<Props> = ({ branchId, registers, schedule, mode = 'create', onClose, onSaved }) => {
  const editing = mode === 'edit'
  const [name, setName] = useState<string>(schedule ? (mode === 'duplicate' ? `${schedule.name} (copia)` : schedule.name) : '')
  const [registerId, setRegisterId] = useState<number>(schedule?.registerId ?? 0)
  const [startTime, setStartTime] = useState<string>(schedule?.startTime ?? '08:00')
  const [endTime, setEndTime] = useState<string>(schedule?.endTime ?? '16:00')
  const [days, setDays] = useState<number[]>(schedule?.days ?? [1, 2, 3, 4, 5])
  const [entryTol, setEntryTol] = useState<string>(schedule?.entryToleranceMinutes != null ? String(schedule.entryToleranceMinutes) : '')
  const [exitTol, setExitTol] = useState<string>(schedule?.exitToleranceMinutes != null ? String(schedule.exitToleranceMinutes) : '')
  const [color, setColor] = useState<string>(schedule?.color ?? SCHEDULE_COLORS[0])
  const [active, setActive] = useState<boolean>(schedule?.active ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggleDay = (d: number) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

  const save = async () => {
    if (!name.trim()) return setError('Escribe el nombre del horario.')
    if (!days.length) return setError('Elige al menos un día.')
    if (startTime === endTime) return setError('La hora de inicio y la de fin no pueden ser iguales.')
    setSaving(true)
    setError('')
    const data = {
      name: name.trim(),
      registerId: registerId || null,
      startTime,
      endTime,
      days,
      active,
      color,
      entryToleranceMinutes: entryTol === '' ? null : Number(entryTol),
      exitToleranceMinutes: exitTol === '' ? null : Number(exitTol),
    }
    try {
      if (editing) await APIs.updateCashSchedule(schedule.id, data)
      else await APIs.createCashSchedule(branchId, data)
      showToast({ type: 'success', title: editing ? 'Horario actualizado' : 'Horario creado', text: data.name })
      onSaved()
      onClose()
    } catch (e) {
      setError(errorText(e, 'No se pudo guardar el horario.'))
    } finally {
      setSaving(false)
    }
  }

  const title = editing ? `Editar horario · ${schedule.name}` : mode === 'duplicate' ? 'Duplicar horario' : 'Nuevo horario'

  return (
    <div className='cash-ui__overlay' role='dialog' aria-modal='true' onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='cash-ui__modal schedule-modal'>
        <div className='cash-ui__modal-head'>
          <h2>{title}</h2>
          <button type='button' onClick={onClose} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>
        <div className='cash-ui__modal-body'>
          <div className='schedule-modal__grid'>
            <label className='schedule-modal__field schedule-modal__field--wide'>
              <span>Nombre</span>
              <input className='inputs__general' value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder='Ej. Matutino' />
            </label>
            <label className='schedule-modal__field schedule-modal__field--wide'>
              <span>Caja</span>
              <select className='inputs__general' value={registerId} onChange={(e) => setRegisterId(Number(e.target.value))}>
                <option value={0}>Toda la sucursal (sin caja específica)</option>
                {registers.filter((r) => r.active !== false || r.id === registerId).map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </label>
            <label className='schedule-modal__field'>
              <span>Entrada</span>
              <input className='inputs__general' type='time' value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
            <label className='schedule-modal__field'>
              <span>Salida</span>
              <input className='inputs__general' type='time' value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </label>
          </div>
          {startTime !== endTime && crossesMidnight({ startTime, endTime }) ? (
            <p className='schedule-modal__hint'>
              <span className='material-symbols-rounded' aria-hidden>bedtime</span> Cruza la medianoche: termina al día siguiente.
            </p>
          ) : null}

          <div className='schedule-modal__field'>
            <span>Días</span>
            <div className='schedule-modal__days' role='group' aria-label='Días de la semana'>
              {WEEK_ORDER.map((d) => (
                <button key={d} type='button' className={days.includes(d) ? 'is-active' : ''} aria-pressed={days.includes(d)} onClick={() => toggleDay(d)}>
                  {DAYS_SHORT[d]}
                </button>
              ))}
            </div>
          </div>

          <div className='schedule-modal__grid'>
            <label className='schedule-modal__field'>
              <span>Tolerancia de entrada (min)</span>
              <input className='inputs__general' type='number' min={0} max={240} value={entryTol} onChange={(e) => setEntryTol(e.target.value)} placeholder='Opcional' />
            </label>
            <label className='schedule-modal__field'>
              <span>Tolerancia de salida (min)</span>
              <input className='inputs__general' type='number' min={0} max={240} value={exitTol} onChange={(e) => setExitTol(e.target.value)} placeholder='Opcional' />
            </label>
          </div>

          <div className='schedule-modal__field'>
            <span>Color</span>
            <div className='schedule-modal__colors' role='radiogroup' aria-label='Color'>
              {SCHEDULE_COLORS.map((c) => (
                <button key={c} type='button' role='radio' aria-checked={color === c} className={color === c ? 'is-active' : ''} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />
              ))}
            </div>
          </div>

          <div className='schedule-modal__switch'>
            <div>
              <strong>Activo</strong>
              <small>Los horarios inactivos no cuentan para la ficha de cobro ni para los traslapes.</small>
            </div>
            <IOSSwitch checked={active} onChange={setActive} ariaLabel='Horario activo' />
          </div>

          {error ? <p className='schedule-modal__error'>{error}</p> : null}

          <div className='cash-ui__modal-actions'>
            <button type='button' className='btn__general-secondary' onClick={onClose}>Cancelar</button>
            <button type='button' className='btn__general-purple' onClick={save} disabled={saving}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear horario'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalSchedule
