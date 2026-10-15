import React, { useEffect, useState, useCallback } from 'react'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import './UserGroups.css'
import APIs from '../../../../../services/APIs'
import ModalUserGroups from './modal-user-groups/ModalUserGroups'
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

const fullName = (u: UserSummary) =>
  [u.firstName, u.secondName, u.firstLastName, u.secondLastName].filter(Boolean).join(' ')

const UserGroups: React.FC = () => {
  const dispatch = useDispatch()
  const userState = useSelector((s: any) => s.user)
  const userId = Number(userState?.id ?? userState?._id)

  const [groups, setGroups] = useState<UserGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchGroups = useCallback(async (cId?: number | null) => {
    const id = cId ?? companyId
    if (!id) return
    setLoading(true)
    try {
      const res: any = await APIs.getUserGroups(id)
      setGroups(Array.isArray(res?.data) ? res.data : [])
    } catch {
      setGroups([])
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const res: any = await APIs.getCompanies(userId)
        const list = Array.isArray(res?.data) ? res.data : []
        setCompanies(list)
        // Sin empresas vinculadas se usa la activa de la sesión, para no dejar la lista vacía.
        const initialId = list[0]?.id ?? userState?.activeCompanyId ?? userState?.companyId ?? userState?.companyIds?.[0] ?? null
        if (initialId) {
          setCompanyId(initialId)
          fetchGroups(initialId)
        } else {
          setLoading(false)
        }
      } catch {
        setLoading(false)
      }
    }
    loadCompanies()
  }, [userId])

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value)
    setCompanyId(id)
    fetchGroups(id)
  }

  const handleCreate = () => {
    setSelectedGroup(null)
    dispatch(modal('user_groups_modal'))
  }

  const handleEdit = (group: UserGroup) => {
    setSelectedGroup(group)
    dispatch(modal('user_groups_modal'))
  }

  const handleDelete = async (group: UserGroup) => {
    const result = await Swal.fire({
      title: `¿Eliminar el grupo "${group.name}"?`,
      text: 'Los usuarios que eran managers de este grupo volverán a ver a todos los usuarios de la empresa. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    })
    if (!result.isConfirmed) return

    setDeletingId(group.id)
    try {
      await APIs.deleteUserGroup(group.id)
      Swal.fire('Listo', 'Grupo eliminado', 'success')
      await fetchGroups()
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo eliminar el grupo', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const initials = (u: UserSummary) =>
    fullName(u).split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

  return (
    <div className='user-groups'>
      <div className='user-groups__container'>
        <div className='user-groups__header'>
          <div className='user-groups__header-left'>
            {companies.length > 1 && (
              <select
                className='inputs__general user-groups__company-select'
                value={companyId ?? ''}
                onChange={handleCompanyChange}
              >
                <option value=''>Selecciona empresa</option>
                {companies.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          <button className='btn__general-primary' onClick={handleCreate} disabled={!companyId}>
            Nuevo grupo
          </button>
        </div>

        {/* La tabla siempre se ve; el loading va dentro */}
        <div className='user-groups__list'>
          <div className='user-groups__row user-groups__row--head'>
            <span>Grupo</span>
            <span>Managers</span>
            <span>Miembros</span>
            <span className='user-groups__col-actions'>Acciones</span>
          </div>

          {loading ? (
            <TableSkeleton rowClassName='user-groups__row' cols={[{ avatar: true }, { width: '60%' }, { pill: true, width: '80px' }, { actions: 2 }]} />
          ) : !companyId ? (
            <div className='user-groups__state'>Selecciona una empresa para ver sus grupos.</div>
          ) : groups.length > 0 ? (
            groups.map((group) => {
              const isDeleting = deletingId === group.id
              return (
                <div className='user-groups__row' key={group.id}>
                  <div className='user-groups__cell user-groups__cell--name' data-label='Grupo'>
                    <span className='user-groups__row-icon material-symbols-rounded'>groups</span>
                    <strong>{group.name}</strong>
                  </div>
                  <div className='user-groups__cell user-groups__cell--wrap' data-label='Managers'>
                    {group.managers.length > 0 ? (
                      <div className='user-groups__chips'>
                        {group.managers.map((m) => (
                          <span className='user-groups__chip' key={m.id} title={fullName(m)}>
                            <span className='user-groups__chip-avatar'>{initials(m)}</span>
                            {fullName(m)}
                          </span>
                        ))}
                      </div>
                    ) : <span className='user-groups__muted'>Sin managers</span>}
                  </div>
                  <div className='user-groups__cell' data-label='Miembros'>
                    <span className='user-groups__badge'>{group.members.length} miembro{group.members.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className='user-groups__cell user-groups__col-actions'>
                    <button className='user-groups__icon-btn' type='button' title='Editar grupo' aria-label='Editar grupo' onClick={() => handleEdit(group)}>
                      <span className='material-symbols-rounded'>edit</span>
                    </button>
                    <button
                      className='user-groups__icon-btn user-groups__icon-btn--danger'
                      type='button'
                      title='Eliminar grupo'
                      aria-label='Eliminar grupo'
                      disabled={isDeleting}
                      onClick={() => handleDelete(group)}
                    >
                      {isDeleting ? <span className='loader_btn'></span> : <span className='material-symbols-rounded'>delete</span>}
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className='user-groups__state'>
              <p>No hay grupos configurados</p>
              <span>Crea el primero para limitar qué usuarios ve cada manager</span>
            </div>
          )}
        </div>

        <ModalUserGroups group={selectedGroup} companyId={companyId} onSaved={() => fetchGroups()} />
      </div>
    </div>
  )
}

export default UserGroups
