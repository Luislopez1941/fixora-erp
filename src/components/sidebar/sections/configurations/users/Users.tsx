import React, { useCallback, useEffect, useMemo, useState } from 'react'
import './Users.css'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import APIs from '../../../../../services/APIs'
import ModalUsers from './modal-users/ModalUsers'
import CategoriesStorePicker from '../../categories/CategoriesStorePicker'
import { readCategoryBranchId } from '../../../../../constants/category'
import {
  USER_KIND_META,
  getFullName,
  getRoleLabel,
} from '../../../../../constants/userRoles'

type UserRecord = {
  id: number
  email: string
  phone: string
  active: boolean
  userKind: 'SYSTEM' | 'ACCOUNT' | 'STAFF'
  firstName?: string
  secondName?: string
  firstLastName?: string
  secondLastName?: string
  businessName?: string
  role?: { id: number; name: string; level: number }
  branch?: { id: number; name: string } | null
  Areas?: { id: number; name: string } | null
  permissions?: string[]
}

const LS_COMPANY = 'categories-picker-company-id'

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem(LS_COMPANY))
  return !Number.isNaN(id) && id > 0 ? id : null
}

const Users: React.FC = () => {
  const dispatch = useDispatch()
  const userState = useSelector((store: any) => store.user)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'ALL' | 'ACCOUNT' | 'STAFF'>('ALL')
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const isFetchingRef = React.useRef(false)
  const fetchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
  }, [])

  const handleCompanyChange = useCallback((id: number) => {
    setCompanyId(id)
  }, [])

  const fetchUsers = useCallback(async () => {
    const resolvedCompanyId = companyId ?? readCompanyId()
    if (!resolvedCompanyId) {
      setUsers([])
      return
    }
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current)
    fetchTimeoutRef.current = setTimeout(async () => {
      if (isFetchingRef.current) return
      isFetchingRef.current = true
      setLoading(true)
      try {
        const response: any = await APIs.getSystemUsers({
          companyId: resolvedCompanyId,
          branchId: branchId > 0 ? branchId : undefined,
          userKind: tab === 'ALL' ? undefined : tab,
        })
        setUsers(Array.isArray(response?.data) ? response.data : [])
      } catch {
        setUsers([])
      } finally {
        setLoading(false)
        isFetchingRef.current = false
      }
    }, 100)
  }, [companyId, branchId, tab])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = useMemo(() => {
    if (tab === 'ALL') return users
    return users.filter((user) => user.userKind === tab)
  }, [users, tab])

  const handleCreate = () => {
    setSelectedUser(null)
    dispatch(modal('users_modal'))
  }

  const handleEdit = (user: UserRecord) => {
    setSelectedUser(user)
    dispatch(modal('users_modal'))
  }

  const handleToggleActive = async (user: UserRecord) => {
    try {
      await APIs.setUserStatus(user.id, { active: !user.active })
      fetchUsers()
    } catch {
      // noop
    }
  }

  const kindBadgeClass = (kind: UserRecord['userKind']) => {
    if (kind === 'SYSTEM') return 'users__badge users__badgeSystem'
    if (kind === 'ACCOUNT') return 'users__badge users__badgeAccount'
    return 'users__badge users__badgeStaff'
  }

  return (
    <div className='users'>
      <div className='users__container'>

        {/* ===== HEADER ===== */}
        <div className='users__header-row'>
          <div className='users__header-left'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={persistBranchId}
              onCompanyIdChange={handleCompanyChange}
              hideIfSingleCompany
              hideIfSingleBranch
            />
          </div>
          <div className='users__header-right'>
            <div className='users__tabs'>
              {(['ALL', 'ACCOUNT', 'STAFF'] as const).map((t) => (
                <button
                  key={t}
                  type='button'
                  className={`users__tab ${tab === t ? 'users__tabActive' : ''}`}
                  onClick={() => setTab(t)}
                >
                  {t === 'ALL' ? 'Todos' : t === 'ACCOUNT' ? 'Administradores' : 'Personal'}
                </button>
              ))}
            </div>
            <button
              type='button'
              className='btn__general-primary'
              onClick={handleCreate}
              disabled={!companyId}
            >
              + Crear usuario
            </button>
          </div>
        </div>

        {/* Tabla */}
        {!companyId ? (
          <div className='users__no-company'>Selecciona una empresa para ver sus usuarios.</div>
        ) : loading ? (
          <div className='users__loading'>Cargando usuarios…</div>
        ) : (
          <div className='users__table'>
            {/* Head */}
            <div className='users__thead'>
              <div className='users__th'>Nombre</div>
              <div className='users__th'>Correo</div>
              <div className='users__th'>Tipo</div>
              <div className='users__th'>Rol</div>
              <div className='users__th'>Sucursal / Área</div>
              <div className='users__th'>Estado</div>
              <div className='users__th'>Acciones</div>
            </div>

            {/* Body */}
            <div className='users__tbody'>
              {filteredUsers.length === 0 ? (
                <div className='users__empty-row'>No hay usuarios para mostrar.</div>
              ) : filteredUsers.map((user) => (
                <div className='users__row' key={user.id}>
                  {/* Nombre + teléfono */}
                  <div className='users__td users__td--name'>
                    <span className='users__name'>{getFullName(user)}</span>
                    {user.phone && <span className='users__phone'>{user.phone}</span>}
                  </div>

                  {/* Correo */}
                  <div className='users__td'>
                    <span className='users__email'>{user.email}</span>
                  </div>

                  {/* Tipo */}
                  <div className='users__td'>
                    <span className={kindBadgeClass(user.userKind)}>
                      {USER_KIND_META[user.userKind]?.label ?? user.userKind}
                    </span>
                  </div>

                  {/* Rol */}
                  <div className='users__td'>
                    {getRoleLabel(user.role?.name) || '—'}
                  </div>

                  {/* Sucursal / Área */}
                  <div className='users__td'>
                    {[user.branch?.name, user.Areas?.name].filter(Boolean).join(' · ') || '—'}
                  </div>

                  {/* Estado */}
                  <div className='users__td'>
                    {user.active
                      ? <span className='users__badge users__badgeActive'>Activo</span>
                      : <span className='users__badge users__badgeInactive'>Inactivo</span>
                    }
                  </div>

                  {/* Acciones */}
                  <div className='users__td'>
                    <div className='users__actions'>
                      <button
                        type='button'
                        className='btn__general-primary'
                        onClick={() => handleEdit(user)}
                      >
                        Editar
                      </button>
                      {user.userKind !== 'SYSTEM' && (
                        <button
                          type='button'
                          className='btn__general-danger'
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.active ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ModalUsers
          user={selectedUser}
          companyId={companyId}
          createdByUserId={userState?.id ?? userState?._id}
          onSaved={fetchUsers}
        />
      </div>
    </div>
  )
}

export default Users
