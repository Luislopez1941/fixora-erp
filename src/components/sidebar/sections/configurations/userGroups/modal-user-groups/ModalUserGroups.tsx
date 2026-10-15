import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './ModalUserGroups.css'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../../redux/state/modals'
import APIs from '../../../../../../services/APIs'
import Swal from 'sweetalert2'

interface UserSummary {
  id: number
  firstName: string
  secondName?: string
  firstLastName: string
  secondLastName?: string
  email: string
}

interface UserGroup {
  id: number
  name: string
  companyId: number
  managers: UserSummary[]
  members: UserSummary[]
}

interface Props {
  group?: UserGroup | null
  companyId?: number | null
  onSaved?: () => void
}

const fullName = (u: UserSummary) =>
  [u.firstName, u.secondName, u.firstLastName, u.secondLastName].filter(Boolean).join(' ')

const ModalUserGroups: React.FC<Props> = ({ group, companyId, onSaved }) => {
  const dispatch = useDispatch()
  const modalState = useSelector((state: any) => state.modals)
  const isEdit = Boolean(group?.id)

  const [name, setName] = useState('')
  const [users, setUsers] = useState<UserSummary[]>([])
  const [managerIds, setManagerIds] = useState<number[]>([])
  const [memberIds, setMemberIds] = useState<number[]>([])
  const [managerToAdd, setManagerToAdd] = useState('')
  const [memberToAdd, setMemberToAdd] = useState('')
  const [saving, setSaving] = useState(false)

  const handleModalChange = (value: string) => dispatch(modal(value))

  const loadUsers = async () => {
    if (!companyId) return
    try {
      const res: any = await APIs.getSystemUsers({ companyId })
      setUsers(Array.isArray(res?.data) ? res.data : [])
    } catch {
      setUsers([])
    }
  }

  useEffect(() => {
    if (modalState !== 'user_groups_modal') return
    loadUsers()
    if (group) {
      setName(group.name ?? '')
      setManagerIds(group.managers.map((m) => m.id))
      setMemberIds(group.members.map((m) => m.id))
    } else {
      setName('')
      setManagerIds([])
      setMemberIds([])
    }
    setManagerToAdd('')
    setMemberToAdd('')
  }, [modalState, group, companyId])

  const findUser = (id: number) => users.find((u) => u.id === id)

  const addManager = () => {
    if (!managerToAdd) return
    const id = Number(managerToAdd)
    setManagerIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setManagerToAdd('')
  }

  const addMember = () => {
    if (!memberToAdd) return
    const id = Number(memberToAdd)
    setMemberIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setMemberToAdd('')
  }

  const removeManager = (id: number) => setManagerIds((prev) => prev.filter((m) => m !== id))
  const removeMember = (id: number) => setMemberIds((prev) => prev.filter((m) => m !== id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      Swal.fire('Falta información', 'El nombre del grupo es obligatorio.', 'warning')
      return
    }
    if (!companyId) {
      Swal.fire('Falta información', 'Selecciona una empresa.', 'warning')
      return
    }
    if (managerIds.length === 0) {
      Swal.fire('Falta información', 'Agrega al menos un manager — es quien queda restringido a ver solo a los miembros.', 'warning')
      return
    }

    setSaving(true)
    try {
      if (isEdit) {
        await APIs.updateUserGroup(group!.id, { name: name.trim(), managerIds, memberIds })
      } else {
        await APIs.createUserGroup({ name: name.trim(), companyId, managerIds, memberIds })
      }
      Swal.fire('Listo', isEdit ? 'Grupo actualizado' : 'Grupo creado', 'success')
      handleModalChange('')
      onSaved?.()
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Portal al <body>: encima del sidebar y el header.
  return createPortal(
    <div className={`user_groups_modal__overlay ${modalState === 'user_groups_modal' ? 'active' : ''}`}>
      <div className={`user_groups_modal__popup ${modalState === 'user_groups_modal' ? 'active' : ''}`}>
        <div className='user_groups_modal__header'>
          <button type='button' className='user_groups_modal__close' onClick={() => handleModalChange('')} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
          <p className='user_groups_modal__title'>{isEdit ? 'Editar grupo' : 'Nuevo grupo de usuarios'}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='user_groups_modal__body'>
            <div>
              <label className='label__general'>Nombre del grupo</label>
              <input className='inputs__general' value={name} onChange={(e) => setName(e.target.value)} placeholder='ej. Sucursal Centro' required />
            </div>

            <div className='user_groups_modal__section'>
              <label className='label__general'>Managers (ven solo a los miembros de abajo)</label>
              <div className='user_groups_modal__picker'>
                <select className='inputs__general' value={managerToAdd} onChange={(e) => setManagerToAdd(e.target.value)}>
                  <option value=''>Agregar manager...</option>
                  {users.filter((u) => !managerIds.includes(u.id)).map((u) => (
                    <option key={u.id} value={u.id}>{fullName(u)}</option>
                  ))}
                </select>
                <button type='button' className='btn__general-primary' onClick={addManager} disabled={!managerToAdd} aria-label='Agregar manager'><span className='material-symbols-rounded'>add</span></button>
              </div>
              {managerIds.length > 0 ? (
                <div className='user_groups_modal__chip-list'>
                  {managerIds.map((id) => {
                    const u = findUser(id)
                    return (
                      <span className='user_groups_modal__chip user_groups_modal__chip--manager' key={id}>
                        {u ? fullName(u) : `#${id}`}
                        <button type='button' onClick={() => removeManager(id)} aria-label='Quitar'><span className='material-symbols-rounded'>close</span></button>
                      </span>
                    )
                  })}
                </div>
              ) : <p className='user_groups_modal__hint'>Sin managers todavía.</p>}
            </div>

            <div className='user_groups_modal__section'>
              <label className='label__general'>Miembros (visibles para esos managers)</label>
              <div className='user_groups_modal__picker'>
                <select className='inputs__general' value={memberToAdd} onChange={(e) => setMemberToAdd(e.target.value)}>
                  <option value=''>Agregar miembro...</option>
                  {users.filter((u) => !memberIds.includes(u.id)).map((u) => (
                    <option key={u.id} value={u.id}>{fullName(u)}</option>
                  ))}
                </select>
                <button type='button' className='btn__general-primary' onClick={addMember} disabled={!memberToAdd} aria-label='Agregar miembro'><span className='material-symbols-rounded'>add</span></button>
              </div>
              {memberIds.length > 0 ? (
                <div className='user_groups_modal__chip-list'>
                  {memberIds.map((id) => {
                    const u = findUser(id)
                    return (
                      <span className='user_groups_modal__chip' key={id}>
                        {u ? fullName(u) : `#${id}`}
                        <button type='button' onClick={() => removeMember(id)} aria-label='Quitar'><span className='material-symbols-rounded'>close</span></button>
                      </span>
                    )
                  })}
                </div>
              ) : <p className='user_groups_modal__hint'>Sin miembros todavía.</p>}
            </div>

            <div className='user_groups_modal__actions'>
              <button type='button' className='btn__general-secondary' onClick={() => handleModalChange('')} disabled={saving}>Cancelar</button>
              <button type='submit' className='btn__general-primary' disabled={saving}>
                {saving ? (
                  <>
                    {isEdit ? 'Guardando…' : 'Creando…'}
                    <span className='loader_btn'></span>
                  </>
                ) : (
                  isEdit ? 'Guardar cambios' : 'Crear grupo'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default ModalUserGroups
