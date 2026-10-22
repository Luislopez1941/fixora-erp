import React, { useMemo, useState } from 'react'
import APIs from '../../../../../services/APIs'
import DateField from '../../../../../components/general/date-field/DateField'
import IOSSwitch from '../../../../../components/sidebar/sections/catalogos/shared/IOSSwitch'
import { showToast } from '../../../../../utils/toast'
import { errorText } from '../../../shared/cashFormat'
import '../../../../../components/sidebar/sections/catalogos/shared/IOSSwitch.css'
import './ModalAssignment.css'

interface Props {
  register: { id: number; name: string; assignments: any[] }
  /** Asignación a editar; sin ella se crea una nueva */
  assignment?: any
  users: { id: number; name: string; email?: string; role?: string | null }[]
  onClose: () => void
  onSaved: () => void
}

/** Asignar un cajero a una caja (o editar la asignación): predeterminada, vigencia y activa. */
const ModalAssignment: React.FC<Props> = ({ register, assignment, users, onClose, onSaved }) => {
  const editing = !!assignment
  const [userId, setUserId] = useState<number>(assignment?.userId ?? 0)
  const [query, setQuery] = useState('')
  const [isDefault, setIsDefault] = useState<boolean>(assignment?.isDefault ?? false)
  const [validFrom, setValidFrom] = useState<string>(assignment?.validFrom ?? '')
  const [validTo, setValidTo] = useState<string>(assignment?.validTo ?? '')
  const [active, setActive] = useState<boolean>(assignment?.active ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Al crear: solo usuarios que aún no están en esta caja, filtrados por nombre o correo
  const available = useMemo(() => {
    const taken = new Set(register.assignments.map((a) => a.userId))
    const q = query.trim().toLowerCase()
    return users.filter((u) => !taken.has(u.id) && (!q || u.name.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q)))
  }, [users, register.assignments, query])

  const save = async () => {
    if (!editing && !userId) {
      setError('Elige el usuario que vas a asignar.')
      return
    }
    if (validFrom && validTo && validFrom > validTo) {
      setError('La fecha "desde" no puede ser mayor que "hasta".')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = { isDefault, validFrom: validFrom || null, validTo: validTo || null, active }
      if (editing) await APIs.updateCashAssignment(assignment.id, payload)
      else await APIs.createCashAssignment({ registerId: register.id, userId, ...payload })
      showToast({ type: 'success', title: editing ? 'Asignación actualizada' : 'Cajero asignado', text: `Caja ${register.name}` })
      onSaved()
      onClose()
    } catch (e) {
      setError(errorText(e, 'No se pudo guardar la asignación.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='cash-ui__overlay' role='dialog' aria-modal='true' onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='cash-ui__modal assignment-modal'>
        <div className='cash-ui__modal-head'>
          <h2>{editing ? `Editar asignación · ${assignment.userName}` : `Asignar cajero · ${register.name}`}</h2>
          <button type='button' onClick={onClose} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>
        <div className='cash-ui__modal-body'>
          {!editing ? (
            <div className='assignment-modal__field'>
              <span>Usuario</span>
              <input className='inputs__general' type='search' value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Buscar por nombre o correo' />
              <div className='assignment-modal__users' role='listbox' aria-label='Usuarios'>
                {available.length ? (
                  available.map((u) => (
                    <button key={u.id} type='button' role='option' aria-selected={u.id === userId} className={u.id === userId ? 'is-active' : ''} onClick={() => setUserId(u.id)}>
                      <strong>{u.name}</strong>
                      <small>{[u.role, u.email].filter(Boolean).join(' · ')}</small>
                    </button>
                  ))
                ) : (
                  <p className='assignment-modal__empty'>No hay usuarios disponibles para asignar.</p>
                )}
              </div>
            </div>
          ) : null}

          <div className='assignment-modal__switch'>
            <div>
              <strong>Caja predeterminada</strong>
              <small>La que se le propone al abrir turno. Si ya tenía otra en esta sucursal, se reemplaza.</small>
            </div>
            <IOSSwitch checked={isDefault} onChange={setIsDefault} ariaLabel='Caja predeterminada' />
          </div>

          <div className='assignment-modal__dates'>
            <label className='assignment-modal__field'>
              <span>Vigente desde (opcional)</span>
              <DateField className='inputs__general' value={validFrom} onChange={setValidFrom} placeholder='Sin fecha' />
            </label>
            <label className='assignment-modal__field'>
              <span>Hasta (opcional)</span>
              <DateField className='inputs__general' value={validTo} min={validFrom || undefined} onChange={setValidTo} placeholder='Sin fecha' />
            </label>
          </div>

          <div className='assignment-modal__switch'>
            <div>
              <strong>Activa</strong>
              <small>Desactívala para pausarla sin borrarla.</small>
            </div>
            <IOSSwitch checked={active} onChange={setActive} ariaLabel='Asignación activa' />
          </div>

          {error ? <p className='assignment-modal__error'>{error}</p> : null}

          <div className='cash-ui__modal-actions'>
            <button type='button' className='btn__general-secondary' onClick={onClose}>Cancelar</button>
            <button type='button' className='btn__general-purple' onClick={save} disabled={saving || (!editing && !userId)}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Asignar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalAssignment
