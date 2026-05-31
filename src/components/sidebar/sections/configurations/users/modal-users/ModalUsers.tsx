import React, { useEffect, useState } from 'react'
import './ModalUsers.css'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../../redux/state/modals'
import APIs from '../../../../../../services/APIs'
import Swal from 'sweetalert2'
import { getRoleLabel } from '../../../../../../constants/userRoles'

type Props = {
  user?: any | null
  companyId?: number | null
  createdByUserId?: number
  onSaved?: () => void
}

const emptyFields = {
  firstName: '',
  secondName: '',
  firstLastName: '',
  secondLastName: '',
  email: '',
  phone: '',
  password: '',
  roleId: '',
  branchId: '',
  areasId: '',
  companyId: '',
  userKind: 'STAFF',
}

const ModalUsers: React.FC<Props> = ({
  user,
  companyId,
  createdByUserId,
  onSaved,
}) => {
  const dispatch = useDispatch()
  const modalState = useSelector((state: any) => state.modals)
  const userState = useSelector((state: any) => state.user)
  const userId = Number(userState?.id ?? userState?._id)
  const authToken = localStorage.getItem('token-eco') || undefined
  const [fields, setFields] = useState(emptyFields)
  const [roles, setRoles] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [_allPermissions, setAllPermissions] = useState<any[]>([])
  const [rolePermissions, setRolePermissions] = useState<Set<number>>(new Set())
  const [permissionOverrides, setPermissionOverrides] = useState<Map<number, boolean>>(new Map())
  const [activeTab, setActiveTab] = useState<'info' | 'permissions'>('info')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const isEdit = Boolean(user?.id)

  const moduleLabels: Record<string, string> = {
    dashboard: 'Panel',
    users: 'Usuarios',
    roles: 'Roles y permisos',
    sales: 'Ventas',
    cobranza: 'Cobranza',
    shopping: 'Compras',
    cash: 'Caja',
    production: 'Producción',
    store: 'Almacén',
    catalogos: 'Catálogos',
    reports: 'Reportes',
    income: 'Ingresos',
    configurations: 'Configuraciones',
    delivery: 'Entregas',
    general: 'General',
  }

  const submoduleLabels: Record<string, string> = {
    sheet: 'Ficha de venta',
    quote: 'Cotización',
    order: 'Orden de venta',
    credit: 'Cuentas de crédito',
    debtors: 'Deudores',
    payments: 'Abonos',
    requisition: 'Requisición',
    purchase: 'Orden de compra',
    register: 'Caja Actual',
    orders: 'Órdenes de producción',
    queue: 'Cola',
    areas: 'Áreas',
    categories: 'Categorías',
    warehouse: 'Almacén',
    inventory: 'Inventario',
    tickets: 'Entradas',
    departures: 'Salidas',
    types: 'Tipos y áreas',
    familias: 'Familias',
    containers: 'Contenedores',
    units: 'Unidades',
    services: 'Servicios',
    articles: 'Artículos',
    prices: 'Rangos de precio',
    companies: 'Empresas',
    branch: 'Sucursales',
    series: 'Series',
    franchise: 'Franquicia',
    staff: 'Personal',
  }

  const actionLabels: Record<string, string> = {
    view: 'Ver',
    create: 'Crear',
    manage: 'Gestionar',
  }

  type PermissionItem = {
    id: number
    name: string
    description: string
    actionLabel?: string
  }

  type SubmoduleGroup = {
    key: string
    label: string
    permissions: PermissionItem[]
  }

  type ModuleGroup = {
    key: string
    label: string
    permissions: PermissionItem[]
    submodules: SubmoduleGroup[]
  }

  function buildModulesFromPermissions(perms: any[]): ModuleGroup[] {
    const modulesMap = new Map<string, ModuleGroup>()

    for (const perm of perms) {
      const parts = perm.name.split('.')
      const actionKey = parts.length >= 2 ? parts[parts.length - 1] : ''
      const actionLabel = actionLabels[actionKey] || actionKey

      if (parts.length >= 3) {
        const moduleKey = parts[0]
        const subKey = parts[1]

        if (!modulesMap.has(moduleKey)) {
          modulesMap.set(moduleKey, {
            key: moduleKey,
            label: moduleLabels[moduleKey] || moduleKey,
            permissions: [],
            submodules: [],
          })
        }
        const mod = modulesMap.get(moduleKey)!

        let sub = mod.submodules.find((s) => s.key === subKey)
        if (!sub) {
          sub = {
            key: subKey,
            label: submoduleLabels[subKey] || subKey,
            permissions: [],
          }
          mod.submodules.push(sub)
        }
        sub.permissions.push({ id: perm.id, name: perm.name, description: perm.description, actionLabel })
      } else if (parts.length === 2) {
        const moduleKey = parts[0]
        if (!modulesMap.has(moduleKey)) {
          modulesMap.set(moduleKey, {
            key: moduleKey,
            label: moduleLabels[moduleKey] || moduleKey,
            permissions: [],
            submodules: [],
          })
        }
        modulesMap.get(moduleKey)!.permissions.push({ id: perm.id, name: perm.name, description: perm.description, actionLabel })
      }
    }

    return Array.from(modulesMap.values()).sort((a, b) => a.label.localeCompare(b.label))
  }

  const [modules, setModules] = useState<ModuleGroup[]>([])
  const [expandedSubmodules, setExpandedSubmodules] = useState<Set<string>>(new Set())

  const toggleModule = (key: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleSubmodule = (key: string) => {
    setExpandedSubmodules((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Empresa seleccionada en el modal (solo editable en creación)
  const selectedCompanyId = isEdit
    ? (user?.branch?.companyId ?? companyId)
    : (Number(fields.companyId) || companyId)

  const handleModalChange = (value: string) => {
    dispatch(modal(value))
  }

  const loadCompanies = async () => {
    if (!userId) return
    try {
      const res: any = await APIs.getCompanies(userId, undefined, authToken)
      setCompanies(Array.isArray(res?.data) ? res.data : [])
    } catch {
      setCompanies([])
    }
  }

  const loadRoles = async () => {
    try {
      const res: any = await APIs.getRolesCatalog()
      setRoles(Array.isArray(res?.data) ? res.data : [])
    } catch {
      setRoles([])
    }
  }

  const visibleRoles = React.useMemo(() => {
    return roles.filter((role: any) => role.level !== 0)
  }, [roles])

  const loadCatalogs = async (targetCompanyId?: number) => {
    const coId = targetCompanyId ?? selectedCompanyId ?? companyId
    if (!coId || !userId) return
    try {
      const [branchResponse, areasResponse]: any[] = await Promise.all([
        APIs.getBranch({ companyId: coId, userId }, undefined, authToken),
        APIs.getAreas({ companyId: coId }),
      ])
      setBranches(Array.isArray(branchResponse?.data) ? branchResponse.data : [])
      setAreas(Array.isArray(areasResponse?.data) ? areasResponse.data : [])
    } catch {
      setBranches([])
      setAreas([])
    }
  }

  useEffect(() => {
    if (modalState !== 'users_modal') return
    loadCompanies()
    loadRoles()
    loadCatalogs()

    if (user) {
      setFields({
        firstName: user.firstName ?? '',
        secondName: user.secondName ?? '',
        firstLastName: user.firstLastName ?? '',
        secondLastName: user.secondLastName ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        password: '',
        roleId: user.role?.id ? String(user.role.id) : '',
        branchId: user.branch?.id ? String(user.branch.id) : '',
        areasId: user.Areas?.id ? String(user.Areas.id) : '',
        companyId: user.branch?.companyId ? String(user.branch.companyId) : (companyId ? String(companyId) : ''),
        userKind: user.userKind ?? 'STAFF',
      })
    } else {
      setFields({ ...emptyFields, companyId: companyId ? String(companyId) : '' })
    }
  }, [modalState, user, companyId])

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setFields((prev) => {
      const next = { ...prev, [name]: value }
      // Al cambiar empresa, resetear sucursal, área y rol
      if (name === 'companyId') {
        next.branchId = ''
        next.areasId = ''
        next.roleId = ''
      }
      return next
    })
  }

  const loadAllPermissions = async () => {
    try {
      const res: any = await APIs.getRolesCatalog()
      const perms = new Map<number, any>()
      ;(res?.data ?? []).forEach((role: any) => {
        ;(role.permissions ?? []).forEach((p: any) => {
          const perm = p.permission ?? p
          if (perm?.id) perms.set(perm.id, perm)
        })
      })
      const flatPerms = Array.from(perms.values())
      setAllPermissions(flatPerms)
      setModules(buildModulesFromPermissions(flatPerms))
    } catch {
      setAllPermissions([])
      setModules([])
    }
  }

  const loadRolePermissions = async (roleId: number) => {
    if (!roleId) {
      setRolePermissions(new Set())
      return
    }
    try {
      const res: any = await APIs.getRolesCatalog()
      const role = (res?.data ?? []).find((r: any) => r.id === roleId)
      const ids = new Set<number>()
      ;(role?.permissions ?? []).forEach((p: any) => {
        const perm = p.permission ?? p
        if (perm?.id) ids.add(perm.id)
      })
      setRolePermissions(ids)
    } catch {
      setRolePermissions(new Set())
    }
  }

  const loadUserOverrides = async (targetUserId: number) => {
    try {
      const res: any = await APIs.getUserPermissionOverrides(targetUserId)
      const map = new Map<number, boolean>()
      ;(res?.data ?? []).forEach((o: any) => {
        if (o.permission?.id != null) {
          map.set(o.permission.id, o.grant)
        }
      })
      setPermissionOverrides(map)
    } catch {
      setPermissionOverrides(new Map())
    }
  }

  const toggleOverride = (permissionId: number) => {
    setPermissionOverrides((prev) => {
      const next = new Map(prev)
      const current = next.get(permissionId)
      if (current === undefined) {
        // Heredado del rol → bloquear (-)
        next.set(permissionId, false)
      } else if (current === false) {
        // Bloqueado → conceder (+)
        next.set(permissionId, true)
      } else {
        // Concedido → heredado (quitar override)
        next.delete(permissionId)
      }
      return next
    })
  }

  // Recargar catálogos cuando cambia la empresa en modo creación
  useEffect(() => {
    if (isEdit) return
    const coId = Number(fields.companyId)
    if (coId > 0) {
      loadCatalogs(coId)
    }
  }, [fields.companyId])

  // Cargar permisos cuando abre el modal
  useEffect(() => {
    if (modalState !== 'users_modal') return
    loadAllPermissions()
  }, [modalState])

  // Cargar permisos del rol seleccionado
  useEffect(() => {
    const roleId = Number(fields.roleId)
    loadRolePermissions(roleId)
  }, [fields.roleId])

  // Auto-seleccionar empresa si solo hay una
  useEffect(() => {
    if (isEdit || !modalState) return
    if (companies.length === 1 && !fields.companyId) {
      setFields((prev) => ({ ...prev, companyId: String(companies[0].id) }))
    }
  }, [companies, isEdit, modalState])

  // Auto-seleccionar/limpiar sucursal según cuántas haya
  useEffect(() => {
    if (branches.length === 1 && !fields.branchId) {
      setFields((prev) => ({ ...prev, branchId: String(branches[0].id) }))
    } else if (branches.length === 0 && fields.branchId) {
      setFields((prev) => ({ ...prev, branchId: '' }))
    }
  }, [branches])

  // Cargar overrides del usuario en edición
  useEffect(() => {
    if (!isEdit || !user?.id) return
    loadUserOverrides(user.id)
  }, [isEdit, user?.id])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const targetCompanyId = isEdit ? companyId : (Number(fields.companyId) || companyId)
    if (!targetCompanyId) {
      Swal.fire('Atención', 'Selecciona una empresa', 'warning')
      setSaving(false)
      return
    }

    setSaving(true)
    try {
      const payload = {
        firstName: fields.firstName.trim(),
        secondName: fields.secondName.trim() || undefined,
        firstLastName: fields.firstLastName.trim(),
        secondLastName: fields.secondLastName.trim() || undefined,
        email: fields.email.trim(),
        phone: fields.phone.trim(),
        roleId: Number(fields.roleId),
        companyId: targetCompanyId,
        branchId: fields.branchId ? Number(fields.branchId) : undefined,
        areasId: fields.areasId ? Number(fields.areasId) : undefined,
        createdByUserId,
        userKind: fields.userKind,
      }

      let savedUserId = user?.id

      if (isEdit) {
        await APIs.updateSystemUser(user.id, {
          ...payload,
          password: fields.password.trim() || undefined,
        })
      } else {
        if (!fields.password.trim()) {
          Swal.fire('Atención', 'La contraseña es obligatoria', 'warning')
          return
        }
        const created: any = await APIs.createStaffUser({
          ...payload,
          password: fields.password.trim(),
        })
        savedUserId = created?.data?.id
      }

      // Guardar overrides de permisos
      if (savedUserId && permissionOverrides.size > 0) {
        const overrides = Array.from(permissionOverrides.entries()).map(
          ([permissionId, grant]) => ({ permissionId, grant })
        )
        await APIs.setUserPermissionOverrides(savedUserId, overrides)
      } else if (savedUserId && isEdit && permissionOverrides.size === 0) {
        // Si limpió todos los overrides, enviar array vacío
        await APIs.setUserPermissionOverrides(savedUserId, [])
      }

      Swal.fire('Listo', isEdit ? 'Usuario actualizado' : 'Personal creado', 'success')
      handleModalChange('')
      onSaved?.()
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        'No se pudo guardar el usuario'
      Swal.fire('Error', Array.isArray(message) ? message.join('. ') : message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`overlay__users_modal ${modalState === 'users_modal' ? 'active' : ''}`}>
      <div className={`popup__users_modal ${modalState === 'users_modal' ? 'active' : ''}`}>
        <div className='header__modal'>
          <a
            href='#'
            className='btn-cerrar-popup__companies_modal'
            onClick={(event) => {
              event.preventDefault()
              handleModalChange('')
            }}
          >
            ×
          </a>
          <p className='title__modals'>
            {isEdit ? 'Editar usuario' : 'Nuevo personal'}
          </p>
        </div>

        {/* Tabs */}
        <div className='users-modal__tabs'>
          <button
            type='button'
            className={`users-modal__tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Información
          </button>
          <button
            type='button'
            className={`users-modal__tab ${activeTab === 'permissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('permissions')}
          >
            Permisos
          </button>
        </div>

        <form className='users_modal' onSubmit={handleSubmit}>
          <div className='users_modal_container'>

            {/* ─── TAB INFORMACIÓN ─── */}
            {activeTab === 'info' && (
              <>
                <p className='hint'>
                  El personal inicia sesión con su correo y contraseña. Asigna empresa,
                  rol, sucursal y área de trabajo según su función.
                </p>

                {(companies.length > 1 || branches.length > 1) && (
                  <div className='row__one'>
                    {companies.length > 1 && (
                      <div>
                        <label className='label__general'>Empresa</label>
                        <select className='inputs__general' name='companyId' value={fields.companyId} onChange={handleChange} required disabled={isEdit}>
                          <option value=''>Selecciona empresa</option>
                          {companies.map((co: any) => <option key={co.id} value={co.id}>{co.name}</option>)}
                        </select>
                      </div>
                    )}
                    {branches.length > 1 && (
                      <div>
                        <label className='label__general'>Sucursal</label>
                        <select className='inputs__general' name='branchId' value={fields.branchId} onChange={handleChange}>
                          <option value=''>Sin sucursal</option>
                          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div className='row__one'>
                  <div>
                    <label className='label__general'>Nombre</label>
                    <input className='inputs__general' name='firstName' value={fields.firstName} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className='label__general'>Segundo nombre</label>
                    <input className='inputs__general' name='secondName' value={fields.secondName} onChange={handleChange} />
                  </div>
                </div>

                <div className='row__one'>
                  <div>
                    <label className='label__general'>Apellido paterno</label>
                    <input className='inputs__general' name='firstLastName' value={fields.firstLastName} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className='label__general'>Apellido materno</label>
                    <input className='inputs__general' name='secondLastName' value={fields.secondLastName} onChange={handleChange} />
                  </div>
                </div>

                <div className='row__one'>
                  <div>
                    <label className='label__general'>Correo</label>
                    <input className='inputs__general' type='email' name='email' value={fields.email} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className='label__general'>Teléfono</label>
                    <input className='inputs__general' name='phone' value={fields.phone} onChange={handleChange} required />
                  </div>
                </div>

                <div className='row__one'>
                  <div>
                    <label className='label__general'>{isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
                    <input className='inputs__general' type='password' name='password' value={fields.password} onChange={handleChange} required={!isEdit} />
                  </div>
                  <div>
                    <label className='label__general'>Rol operativo</label>
                    <select className='inputs__general' name='roleId' value={fields.roleId} onChange={handleChange} required>
                      <option value=''>Selecciona un rol</option>
                      {visibleRoles.map((role) => <option key={role.id} value={role.id}>{role.label ?? getRoleLabel(role.name)}</option>)}
                    </select>
                  </div>
                </div>

                <div className='row__one'>
                  <div>
                    <label className='label__general'>Tipo de usuario</label>
                    <select className='inputs__general' name='userKind' value={fields.userKind} onChange={handleChange}>
                      <option value='STAFF'>Personal (operativo)</option>
                      <option value='ACCOUNT'>Administrador de cuenta</option>
                    </select>
                  </div>
                  <div>
                    <label className='label__general'>Área de trabajo</label>
                    <select className='inputs__general' name='areasId' value={fields.areasId} onChange={handleChange}>
                      <option value=''>Sin área</option>
                      {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* ─── TAB PERMISOS ─── */}
            {activeTab === 'permissions' && (
              <div className='users-modal__permissions-tab'>
                <p className='users-modal__perm-hint'>
                  <span className='users-modal__perm-grant'>+ verde = conceder</span> ·{' '}
                  <span className='users-modal__perm-deny'>– rojo = bloquear</span> ·{' '}
                  <span style={{ color: '#d1d5db' }}>● gris = heredado del rol</span>
                </p>

                {modules.map((mod) => {
                  const isExpanded = expandedModules.has(mod.key)
                  const viewPerm = mod.permissions.find((p) => p.actionLabel === 'Ver' || p.name.endsWith('.view'))
                  const otherPerms = mod.permissions.filter((p) => p.id !== viewPerm?.id)
                  const viewChecked = viewPerm ? permissionOverrides.get(viewPerm.id) === true || (rolePermissions.has(viewPerm.id) && !permissionOverrides.has(viewPerm.id)) : false
                  const viewDenied = viewPerm ? permissionOverrides.get(viewPerm.id) === false : false

                  return (
                    <div key={mod.key} className='users-modal__module'>
                      <div className='users-modal__module-header'>
                        {viewPerm && (
                          <label className={`users-modal__module-view ${viewChecked ? 'checked' : ''} ${viewDenied ? 'denied' : ''}`} title='Acceso al módulo'>
                            <input
                              type='checkbox'
                              checked={viewChecked}
                              onChange={() => {
                                if (viewPerm) toggleOverride(viewPerm.id)
                              }}
                            />
                          </label>
                        )}
                        <button type='button' className='users-modal__module-toggle' onClick={() => toggleModule(mod.key)}>
                          <span className='users-modal__module-name'>{mod.label}</span>
                          <span className={`users-modal__module-arrow ${isExpanded ? 'open' : ''}`}>
                            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M9 18l6-6-6-6'/></svg>
                          </span>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className='users-modal__module-body'>
                          {/* Permisos generales del módulo */}
                          {otherPerms.map((perm) => {
                            const inherited = rolePermissions.has(perm.id)
                            const override = permissionOverrides.get(perm.id)
                            const isGranted = override === true
                            const isDenied = override === false
                            const rowClass = `users-modal__perm-row ${isGranted ? 'granted' : ''} ${isDenied ? 'denied' : ''} ${!override && inherited ? 'inherited' : ''}`
                            return (
                              <div
                                key={perm.id}
                                className={rowClass}
                                onClick={() => toggleOverride(perm.id)}
                                title={perm.description || perm.name}
                              >
                                <input type='checkbox' checked={isGranted} readOnly onClick={(e) => { e.stopPropagation(); toggleOverride(perm.id) }} />
                                <span className='users-modal__perm-action'>{perm.actionLabel || perm.name}</span>
                                <span className='users-modal__perm-desc'>{perm.description}</span>
                              </div>
                            )
                          })}

                          {/* Submódulos */}
                          {mod.submodules.map((sub) => {
                            const subExpanded = expandedSubmodules.has(`${mod.key}.${sub.key}`)
                            const subViewPerm = sub.permissions.find((p) => p.actionLabel === 'Ver' || p.name.endsWith('.view'))
                            const subOtherPerms = sub.permissions.filter((p) => p.id !== subViewPerm?.id)
                            const subViewChecked = subViewPerm ? permissionOverrides.get(subViewPerm.id) === true || (rolePermissions.has(subViewPerm.id) && !permissionOverrides.has(subViewPerm.id)) : false
                            const subViewDenied = subViewPerm ? permissionOverrides.get(subViewPerm.id) === false : false

                            return (
                              <div key={sub.key} className='users-modal__submodule'>
                                <div className='users-modal__submodule-header'>
                                  {subViewPerm && (
                                    <label className={`users-modal__submodule-view ${subViewChecked ? 'checked' : ''} ${subViewDenied ? 'denied' : ''}`} title='Acceso al submódulo'>
                                      <input
                                        type='checkbox'
                                        checked={subViewChecked}
                                        onChange={() => {
                                          if (subViewPerm) toggleOverride(subViewPerm.id)
                                        }}
                                      />
                                    </label>
                                  )}
                                  <button type='button' className='users-modal__submodule-toggle' onClick={() => toggleSubmodule(`${mod.key}.${sub.key}`)}>
                                    <span className='users-modal__submodule-name'>{sub.label}</span>
                                    <span className={`users-modal__submodule-arrow ${subExpanded ? 'open' : ''}`}>
                                      <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M9 18l6-6-6-6'/></svg>
                                    </span>
                                  </button>
                                </div>
                                {subExpanded && (
                                  <div className='users-modal__submodule-body'>
                                    {subOtherPerms.map((perm) => {
                                      const inherited = rolePermissions.has(perm.id)
                                      const override = permissionOverrides.get(perm.id)
                                      const isGranted = override === true
                                      const isDenied = override === false
                                      const rowClass = `users-modal__perm-row ${isGranted ? 'granted' : ''} ${isDenied ? 'denied' : ''} ${!override && inherited ? 'inherited' : ''}`
                                      return (
                                        <div
                                          key={perm.id}
                                          className={rowClass}
                                          onClick={() => toggleOverride(perm.id)}
                                          title={perm.description || perm.name}
                                        >
                                          <input type='checkbox' checked={isGranted} readOnly onClick={(e) => { e.stopPropagation(); toggleOverride(perm.id) }} />
                                          <span className='users-modal__perm-action'>{perm.actionLabel || perm.name}</span>
                                          <span className='users-modal__perm-desc'>{perm.description}</span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className='row__three'>
              <button type='button' className='btn__general-secondary' onClick={() => handleModalChange('')}>
                Cancelar
              </button>
              <button type='submit' className='btn__general-primary' disabled={saving}>
                {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear personal'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalUsers
