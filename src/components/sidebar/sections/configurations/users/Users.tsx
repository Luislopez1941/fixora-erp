import React, { useCallback, useEffect, useMemo, useState } from 'react'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'
import './Users.css'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import APIs from '../../../../../services/APIs'
import ModalUsers from './modal-users/ModalUsers'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
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
  branches?: { id: number; name: string }[]
  branchIds?: number[]
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
  const [loading, setLoading] = useState(true)
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
    // Empresa: la que resuelve el selector, la guardada o, si no hay ninguna vinculada, la
    // activa de la sesión (para no dejar la tabla vacía ni el loading colgado).
    const resolvedCompanyId =
      companyId ?? readCompanyId() ?? userState?.activeCompanyId ?? userState?.companyId ?? userState?.companyIds?.[0] ?? null
    if (!resolvedCompanyId) {
      setUsers([])
      setLoading(false)
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
  }, [companyId, branchId, tab, userState?.activeCompanyId])

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
    if (kind === 'SYSTEM') return 'users__badge users__badge--system'
    if (kind === 'ACCOUNT') return 'users__badge users__badge--account'
    return 'users__badge users__badge--staff'
  }

  const initials = (user: UserRecord) =>
    (getFullName(user) || user.email || '?')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('')

  return (
    <div className='users'>
      <div className='users__container'>

        {/* ===== HEADER ===== */}
        <div className='users__header'>
          <div className='users__header-left'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={persistBranchId}
              onCompanyIdChange={handleCompanyChange}
              hideIfSingleCompany
              hideIfSingleBranch
            />
            <div className='users__tabs'>
              {(['ALL', 'ACCOUNT', 'STAFF'] as const).map((t) => (
                <button
                  key={t}
                  type='button'
                  className={`users__tab ${tab === t ? 'users__tab--active' : ''}`}
                  onClick={() => setTab(t)}
                >
                  {t === 'ALL' ? 'Todos' : t === 'ACCOUNT' ? 'Administradores' : 'Personal'}
                </button>
              ))}
            </div>
          </div>
          <button
            type='button'
            className='btn__general-primary'
            onClick={handleCreate}
            disabled={!companyId}
          >
            Nuevo usuario
          </button>
        </div>

        {/* ===== TABLA (el loading va dentro) ===== */}
        <div className='users__list'>
          <div className='users__row users__row--head'>
            <span>Usuario</span>
            <span>Tipo</span>
            <span>Rol</span>
            <span>Sucursal / Área</span>
            <span>Estado</span>
            <span className='users__col-actions'>Acciones</span>
          </div>

          {loading ? (
            <TableSkeleton rowClassName='users__row' cols={[{ avatar: true }, { pill: true, width: '90px' }, { width: '60%' }, { width: '70%' }, { pill: true, width: '56px' }, { actions: 2 }]} />
          ) : filteredUsers.length === 0 ? (
            <div className='users__state'>
              <p>No hay usuarios para mostrar</p>
            </div>
          ) : filteredUsers.map((user) => (
            <div className='users__row' key={user.id}>
              <div className='users__cell users__cell--user' data-label='Usuario'>
                <span className='users__avatar'>{initials(user)}</span>
                <div className='users__user-text'>
                  <strong className='users__name'>{getFullName(user)}</strong>
                  <span className='users__email'>{user.email}</span>
                </div>
              </div>

              <div className='users__cell' data-label='Tipo'>
                <span className={kindBadgeClass(user.userKind)}>
                  {USER_KIND_META[user.userKind]?.label ?? user.userKind}
                </span>
              </div>

              <div className='users__cell' data-label='Rol'>
                {getRoleLabel(user.role?.name) || '—'}
              </div>

              <div className='users__cell users__cell--muted' data-label='Sucursal / Área'>
                {[(user.branches?.length ? user.branches.map((b) => b.name).join(', ') : user.branch?.name), user.Areas?.name].filter(Boolean).join(' · ') || '—'}
              </div>

              <div className='users__cell' data-label='Estado'>
                {user.active
                  ? <span className='users__badge users__badge--active'>Activo</span>
                  : <span className='users__badge users__badge--inactive'>Inactivo</span>}
              </div>

              <div className='users__cell users__col-actions'>
                <button
                  type='button'
                  className='users__icon-btn'
                  title='Editar usuario'
                  aria-label='Editar usuario'
                  onClick={() => handleEdit(user)}
                >
                  <span className='material-symbols-rounded'>edit</span>
                </button>
                {user.userKind !== 'SYSTEM' && (
                  <button
                    type='button'
                    className={`users__icon-btn ${user.active ? 'users__icon-btn--danger' : 'users__icon-btn--success'}`}
                    title={user.active ? 'Desactivar usuario' : 'Activar usuario'}
                    aria-label={user.active ? 'Desactivar usuario' : 'Activar usuario'}
                    onClick={() => handleToggleActive(user)}
                  >
                    <span className='material-symbols-rounded'>{user.active ? 'person_off' : 'person_check'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

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
