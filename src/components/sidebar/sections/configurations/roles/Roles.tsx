import React, { useEffect, useState } from 'react'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'
import './Roles.css'
import APIs from '../../../../../services/APIs'
import { getRoleLabel } from '../../../../../constants/userRoles'
import { useDispatch } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import ModalRoles from './modal-roles/ModalRoles'

const permissionColors: Record<string, string> = {
  users: 'roles__chip--users',
  roles: 'roles__chip--roles',
  sales: 'roles__chip--sales',
  store: 'roles__chip--store',
  inventory: 'roles__chip--inventory',
  production: 'roles__chip--production',
  delivery: 'roles__chip--delivery',
  reports: 'roles__chip--reports',
  configurations: 'roles__chip--configurations',
  dashboard: 'roles__chip--reports',
}

const actionLabels: Record<string, string> = {
  view: 'Ver',
  create: 'Crear',
  manage: 'Gestionar',
}

const submoduleLabels: Record<string, string> = {
  // Ventas
  sheet: 'Ficha',
  quote: 'Cotización',
  order: 'Orden',
  // Cobranza
  credit: 'Cuentas crédito',
  debtors: 'Deudores',
  payments: 'Abonos',
  // Compras
  requisition: 'Requisición',
  purchase: 'Orden compra',
  // Caja
  register: 'Caja',
  // Producción
  orders: 'Órdenes',
  queue: 'Cola',
  areas: 'Áreas',
  categories: 'Categorías',
  // Almacén
  warehouse: 'Almacén',
  inventory: 'Inventario',
  tickets: 'Entradas',
  departures: 'Salidas',
  // Catálogos
  types: 'Tipos y áreas',
  familias: 'Familias',
  containers: 'Categorías',
  units: 'Unidades',
  services: 'Servicios',
  articles: 'Artículos',
  prices: 'Rangos precio',
  // Configuraciones
  companies: 'Empresas',
  branch: 'Sucursales',
  series: 'Series',
  franchise: 'Franquicia',
  userGroups: 'Grupos de usuarios',
  // Usuarios
  staff: 'Personal',
}

function getChipClass(name: string): string {
  const module = name.split('.')[0]
  return permissionColors[module] || 'roles__chip--default'
}

function getPermissionLabel(name: string): string {
  const parts = name.split('.')
  if (parts.length >= 3) {
    const sub = submoduleLabels[parts[1]] || parts[1]
    const action = actionLabels[parts[2]] || parts[2]
    return `${sub} — ${action}`
  }
  if (parts.length === 2) {
    return actionLabels[parts[1]] || parts[1]
  }
  return name
}

const Roles: React.FC = () => {
  const dispatch = useDispatch()
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<any | null>(null)

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const response: any = await APIs.getRolesCatalog()
      const allRoles = Array.isArray(response?.data) ? response.data : []
      setRoles(allRoles.filter((role: any) => role.level !== 0))
    } catch {
      setRoles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleCreate = () => {
    setSelectedRole(null)
    dispatch(modal('roles_modal'))
  }

  const handleEdit = (role: any) => {
    setSelectedRole(role)
    dispatch(modal('roles_modal'))
  }

  const MAX_CHIPS = 5

  return (
    <div className='roles'>
      <div className='roles__container'>
        <div className='roles__header'>
          <button className='btn__general-primary' onClick={handleCreate}>Nuevo rol</button>
        </div>

        {/* La tabla siempre se ve; el loading va dentro */}
        <div className='roles__list'>
          <div className='roles__row roles__row--head'>
            <span>Rol</span>
            <span>Nivel</span>
            <span>Usuarios</span>
            <span>Permisos</span>
            <span className='roles__col-actions'>Acciones</span>
          </div>

          {loading ? (
            <TableSkeleton rowClassName='roles__row' cols={[{ avatar: true }, { pill: true, width: '64px' }, { width: '30%' }, { width: '85%' }, { actions: 1 }]} />
          ) : roles.length > 0 ? (
            roles.map((role) => {
              const permissions = role.permissions ?? []
              return (
                <div className='roles__row' key={role.id}>
                  <div className='roles__cell roles__cell--name' data-label='Rol'>
                    <span className='roles__row-icon material-symbols-rounded'>admin_panel_settings</span>
                    <div className='roles__name-text'>
                      <strong>{role.label ?? getRoleLabel(role.name)}</strong>
                      <span className='roles__sub'>{role.name}</span>
                    </div>
                  </div>
                  <div className='roles__cell' data-label='Nivel'>
                    <span className='roles__badge'>Nivel {role.level}</span>
                  </div>
                  <div className='roles__cell' data-label='Usuarios'>{role.usersCount ?? 0}</div>
                  <div className='roles__cell roles__cell--wrap' data-label='Permisos'>
                    <div className='roles__permissions'>
                      {permissions.slice(0, MAX_CHIPS).map((permission: any) => (
                        <span className={`roles__chip ${getChipClass(permission.name)}`} key={permission.id}>
                          {getPermissionLabel(permission.name)}
                        </span>
                      ))}
                      {permissions.length > MAX_CHIPS ? (
                        <span className='roles__chip roles__chip--more'>+{permissions.length - MAX_CHIPS} más</span>
                      ) : null}
                      {permissions.length === 0 ? <span className='roles__muted'>Sin permisos</span> : null}
                    </div>
                  </div>
                  <div className='roles__cell roles__col-actions'>
                    <button className='roles__icon-btn' type='button' title='Editar rol' aria-label='Editar rol' onClick={() => handleEdit(role)}>
                      <span className='material-symbols-rounded'>edit</span>
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className='roles__state'>
              <p>No hay roles configurados</p>
              <span>Ejecuta el seed del backend para crear los roles base</span>
            </div>
          )}
        </div>

        <ModalRoles role={selectedRole} onSaved={fetchRoles} />
      </div>
    </div>
  )
}

export default Roles
