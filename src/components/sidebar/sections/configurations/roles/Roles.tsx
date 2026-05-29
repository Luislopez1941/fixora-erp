import React, { useEffect, useState } from 'react'
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
  containers: 'Contenedores',
  units: 'Unidades',
  services: 'Servicios',
  articles: 'Artículos',
  prices: 'Rangos precio',
  // Configuraciones
  companies: 'Empresas',
  branch: 'Sucursales',
  series: 'Series',
  franchise: 'Franquicia',
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
  const [loading, setLoading] = useState(false)
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

  return (
    <div className='roles'>
      <div className='roles__container'>
        <div className='roles__header-row'>
          <div className='roles__count-bar'>
            <span>Total de roles</span>
            <span className='roles__count-num'>{roles.length}</span>
          </div>
          <button className='btn__general-primary' onClick={handleCreate}>+ Crear rol</button>
        </div>

        <div className='roles__table'>
          <div className='roles__thead'>
            <div className='roles__th'>Rol</div>
            <div className='roles__th'>Nivel</div>
            <div className='roles__th'>Usuarios</div>
            <div className='roles__th'>Permisos</div>
          </div>

          {loading ? (
            <div className='roles__loading'>Cargando roles…</div>
          ) : roles.length > 0 ? (
            <div className='roles__tbody'>
              {roles.map((role) => (
                <div className='roles__row' key={role.id}>
                  <div className='roles__td roles__td--name'>
                    <span className='roles__name'>{role.label ?? getRoleLabel(role.name)}</span>
                    <span className='roles__sub'>{role.name}</span>
                  </div>
                  <div className='roles__td'>{role.level}</div>
                  <div className='roles__td'>{role.usersCount ?? 0}</div>
                  <div className='roles__td'>
                    <div className='roles__permissions'>
                      {(role.permissions ?? []).slice(0, 6).map((permission: any) => (
                        <span className={`roles__chip ${getChipClass(permission.name)}`} key={permission.id}>
                          {getPermissionLabel(permission.name)}
                        </span>
                      ))}
                      {(role.permissions ?? []).length > 6 ? (
                        <span className='roles__chip roles__chip-more'>
                          +{(role.permissions ?? []).length - 6} mas
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className='roles__td roles__td--actions'>
                    <button className='btn__general-primary' onClick={() => handleEdit(role)}>Editar</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='roles__empty'>No hay roles configurados. Ejecuta el seed del backend.</div>
          )}
        </div>
        <ModalRoles role={selectedRole} onSaved={fetchRoles} />
      </div>
    </div>
  )
}

export default Roles
