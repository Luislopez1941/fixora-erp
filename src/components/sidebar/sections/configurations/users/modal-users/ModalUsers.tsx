import BranchAvailabilityPicker from '../../../catalogos/shared/BranchAvailabilityPicker'
import React, { useEffect, useState } from 'react'
import './ModalUsers.css'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../../redux/state/modals'
import APIs from '../../../../../../services/APIs'
import { fetchBranchActiveModules } from '../../../../../../core/modules/kernel.service'
import Swal from 'sweetalert2'
import { getRoleLabel } from '../../../../../../constants/userRoles'
import { MODULE_LABELS, SUBMODULE_LABELS, TAXONOMY } from '../../../../../../core/modules/taxonomy.generated'
import { renderIcon } from '../../../../../../core/modules/icons'
import { groupSubmodules, orderModules, HIDDEN_PERMISSION_MODULES, PERMISSION_MODULE_ALIAS } from '../../../../../../core/permissions/permissionTree'

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
  sidebarType: '3',
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
  const authToken = localStorage.getItem('token-fixora') || undefined
  const [fields, setFields] = useState(emptyFields)
  const [roles, setRoles] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  // Sucursales donde puede operar (null = todas). La principal es la actual si sigue marcada, si no la primera.
  const [userBranchIds, setUserBranchIds] = useState<number[] | null>(null)
  const [areas, setAreas] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [_allPermissions, setAllPermissions] = useState<any[]>([])
  const [rolePermissions, setRolePermissions] = useState<Set<number>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [permissionOverrides, setPermissionOverrides] = useState<Map<number, boolean>>(new Map())
  const [activeTab, setActiveTab] = useState<'info' | 'company' | 'modules' | 'permissions'>('info')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const isEdit = Boolean(user?.id)

  const moduleLabels: Record<string, string> = {
    dashboard: 'Panel',
    users: 'Usuarios',
    roles: 'Roles y permisos',
    sales: 'Ventas',
    cobranza: 'Cuentas por cobrar',
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
    accounting: 'Contabilidad',
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
    current: 'Caja Actual',
    movements: 'Movimientos de Caja',
    cuts: 'Cortes de Caja',
    shifts: 'Turnos',
    registers: 'Cajas',
    schedules: 'Programación de turnos',
    config: 'Configuración',
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
    containers: 'Categorías',
    units: 'Unidades',
    suppliers: 'Proveedores',
    services: 'Servicios',
    articles: 'Artículos',
    prices: 'Rangos de precio',
    companies: 'Empresas',
    branch: 'Sucursales',
    series: 'Series',
    franchise: 'Franquicia',
    userGroups: 'Grupos de usuarios',
    staff: 'Personal',
  }

  const actionLabels: Record<string, string> = {
    view: 'Ver',
    create: 'Crear',
    manage: 'Gestionar',
    approve: 'Aprobar',
    override: 'Autorizar fuera de plazo o monto alto',
    cancel: 'Cancelar',
    return: 'Devolver',
    reject: 'Rechazar',
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
      if (HIDDEN_PERMISSION_MODULES.includes(parts[0])) continue
      const rawModule = parts[0]
      parts[0] = PERMISSION_MODULE_ALIAS[parts[0]] ?? parts[0]
      const actionKey = parts.length >= 2 ? parts[parts.length - 1] : ''
      const actionLabel = actionLabels[actionKey] || actionKey

      if (parts.length >= 3) {
        const moduleKey = parts[0]
        const subKey = parts[1]

        if (!modulesMap.has(moduleKey)) {
          modulesMap.set(moduleKey, {
            key: moduleKey,
            label: moduleLabels[moduleKey] || MODULE_LABELS[moduleKey] || moduleKey,
            permissions: [],
            submodules: [],
          })
        }
        const mod = modulesMap.get(moduleKey)!

        let sub = mod.submodules.find((s) => s.key === subKey)
        if (!sub) {
          sub = {
            key: subKey,
            label: submoduleLabels[subKey] || SUBMODULE_LABELS[`${rawModule}.${subKey}`] || subKey,
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
            label: moduleLabels[moduleKey] || MODULE_LABELS[moduleKey] || moduleKey,
            permissions: [],
            submodules: [],
          })
        }
        modulesMap.get(moduleKey)!.permissions.push({ id: perm.id, name: perm.name, description: perm.description, actionLabel })
      }
    }

    return orderModules(Array.from(modulesMap.values()))
  }

  const [modules, setModules] = useState<ModuleGroup[]>([])
  const [expandedSubmodules, setExpandedSubmodules] = useState<Set<string>>(new Set())
  const [, setActiveModuleIds] = useState<string[] | null>(null)

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
        sidebarType: String(user.sidebarType ?? 3),
      })
    } else {
      setFields({ ...emptyFields, companyId: companyId ? String(companyId) : '' })
    }
  }, [modalState, user, companyId])

  useEffect(() => {
    if (modalState !== 'users_modal') return
    setUserBranchIds(user?.branchIds?.length ? user.branchIds : null)
    setActiveTab('info')
  }, [modalState, user])

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

  const loadAllPermissions = async (moduleIds?: string[] | null) => {
    try {
      const res: any = await APIs.getRolesCatalog()
      // Catálogo COMPLETO de permisos del sistema — antes esto se armaba
      // recorriendo los permisos ya asignados a algún rol (res.data), así que
      // si ningún rol tenía todavía cierto permiso asignado, ese permiso NUNCA
      // aparecía aquí para poder dárselo a un usuario. res.catalog.permissions
      // es la lista real de TODO lo que existe, se le haya asignado a un rol o no.
      let flatPerms = res?.catalog?.permissions ?? []

      // Filtrar solo permisos de módulos activos de la empresa
      if (moduleIds && moduleIds.length > 0) {
        // El prefijo del permiso no siempre es el id del módulo licenciado (cash -> cash-register)
        const moduleAliases: Record<string, string> = { cash: 'cash-register' }
        flatPerms = flatPerms.filter((perm: any) => {
          const moduleKey = perm.name.split('.')[0]
          return moduleIds.includes(moduleKey) || (moduleAliases[moduleKey] ? moduleIds.includes(moduleAliases[moduleKey]) : false)
        })
      }

      setAllPermissions(flatPerms)
      setModules(buildModulesFromPermissions(flatPerms))
    } catch {
      setAllPermissions([])
      setModules([])
    }
  }

  const loadActiveModules = async (branchId?: number | null) => {
    const targetId = branchId ?? (isEdit ? user?.branch?.id : (fields.branchId ? Number(fields.branchId) : null))
    if (!targetId) {
      // Sin sucursal resuelta todavía (usuario nuevo sin sucursal elegida aún,
      // o un usuario existente sin sucursal asignada) — antes esto se salía
      // sin cargar el catálogo de permisos, dejando la pestaña Permisos
      // completamente vacía. Carga igual el catálogo completo, sin filtrar
      // por módulos activos de ninguna sucursal en particular.
      setActiveModuleIds(null)
      await loadAllPermissions(null)
      return
    }
    try {
      const ids = await fetchBranchActiveModules(targetId)
      setActiveModuleIds(ids)
      // Recargar permisos filtrados con los módulos activos
      await loadAllPermissions(ids)
    } catch {
      setActiveModuleIds(null)
      await loadAllPermissions(null)
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
      if (next.has(permissionId)) {
        // Ya había un override puesto (de un click anterior) → lo quita y
        // vuelve a heredar del rol.
        next.delete(permissionId)
      } else {
        // Sin override todavía: pone el OPUESTO de lo que el checkbox está
        // mostrando AHORA (heredado del rol) — así el primer click siempre
        // se nota de inmediato. Antes esto siempre ponía "bloqueado" sin
        // importar el estado heredado, así que si el rol YA no lo concedía
        // (checkbox sin marcar), el primer click lo dejaba "bloqueado
        // explícito" — visualmente IDÉNTICO a como ya estaba — y hacía
        // falta un segundo click para que se viera algún cambio.
        const inherited = rolePermissions.has(permissionId)
        next.set(permissionId, !inherited)
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

  // Cargar módulos activos y permisos cuando abre el modal o cambia sucursal
  useEffect(() => {
    if (modalState !== 'users_modal') return
    loadActiveModules()
  }, [modalState, selectedCompanyId, fields.branchId])

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

  // ───────────── Acceso por módulo ─────────────
  // Un módulo agrupa los permisos de sus pantallas (taxonomía). Se elige un NIVEL por módulo y se traduce a "excepciones" sobre
  // lo que ya da el rol: Sin acceso (nada), Consulta (solo ver) o Completo (ver + crear + gestionar). Las acciones especiales
  // (aprobar, cancelar, devolver, autorizar…) solo se quitan con "Sin acceso"; ajustarlas una por una sigue en Permisos avanzados.
  type AccessLevel = 'none' | 'view' | 'full'
  const stemOf = (name: string) => name.split('.').slice(0, -1).join('.')
  const actionOf = (name: string) => name.split('.').pop() ?? ''
  const isViewPerm = (name: string) => actionOf(name) === 'view'
  const isWritePerm = (name: string) => ['create', 'manage'].includes(actionOf(name))

  const effective = (permissionId: number) =>
    permissionOverrides.has(permissionId) ? permissionOverrides.get(permissionId) === true : rolePermissions.has(permissionId)

  const accessModules = React.useMemo(() => {
    return TAXONOMY.filter((m) => !m.ownerOnly)
      .map((m) => {
        const stems = new Set<string>()
        const addStem = (perm?: string | string[]) => (Array.isArray(perm) ? perm : perm ? [perm] : []).forEach((x) => stems.add(stemOf(x)))
        addStem(m.requiredPermission)
        m.groups.forEach((g) => g.screens.forEach((sc) => addStem(sc.permission)))
        const perms = _allPermissions.filter((perm: any) => stems.has(stemOf(perm.name)))
        const screens = m.groups.reduce((n, g) => n + g.screens.length, 0)
        return { key: m.key, label: m.label, icon: m.icon, screens, perms }
      })
      // Solo los módulos que existen en la licencia de la sucursal (el catálogo ya viene filtrado)
      .filter((m) => m.perms.length > 0)
  }, [_allPermissions])

  const levelOf = (mod: { perms: any[] }): AccessLevel | 'custom' => {
    const views = mod.perms.filter((x) => isViewPerm(x.name))
    const writes = mod.perms.filter((x) => isWritePerm(x.name))
    const viewsOn = views.filter((x) => effective(x.id)).length
    const writesOn = writes.filter((x) => effective(x.id)).length
    if (viewsOn === 0) return writesOn === 0 ? 'none' : 'custom'
    if (viewsOn < views.length) return 'custom'
    if (writesOn === 0) return 'view'
    if (writesOn === writes.length) return 'full'
    return 'custom'
  }

  const setModuleLevel = (mod: { perms: any[] }, level: AccessLevel) => {
    setPermissionOverrides((prev) => {
      const next = new Map(prev)
      for (const perm of mod.perms) {
        let desired: boolean | undefined
        if (isViewPerm(perm.name)) desired = level !== 'none'
        else if (isWritePerm(perm.name)) desired = level === 'full'
        else desired = level === 'none' ? false : undefined // acciones especiales: solo se quitan con "Sin acceso"
        if (desired === undefined) continue
        // Solo se guarda una excepción cuando difiere de lo que ya da el rol
        if (desired === rolePermissions.has(perm.id)) next.delete(perm.id)
        else next.set(perm.id, desired)
      }
      return next
    })
  }

  const resetModule = (mod: { perms: any[] }) => {
    setPermissionOverrides((prev) => {
      const next = new Map(prev)
      mod.perms.forEach((perm) => next.delete(perm.id))
      return next
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const targetCompanyId = isEdit ? companyId : (Number(fields.companyId) || companyId)
    if (!targetCompanyId) {
      Swal.fire('Atención', 'Selecciona una empresa', 'warning')
      setSaving(false)
      return
    }

    // Sucursales elegidas: la principal es la actual si sigue marcada; si no, la primera marcada
    const allBranchIds: number[] = branches.map((b: any) => b.id)
    const chosen: number[] = branches.length > 1 ? (userBranchIds ?? allBranchIds) : allBranchIds
    const currentMain = fields.branchId ? Number(fields.branchId) : null
    const mainBranchId = chosen.includes(currentMain as number) ? (currentMain as number) : (chosen[0] ?? null)

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
        branchId: mainBranchId ?? undefined,
        branchIds: chosen.filter((b) => b !== mainBranchId),
        areasId: fields.areasId ? Number(fields.areasId) : undefined,
        createdByUserId,
        userKind: fields.userKind,
        sidebarType: Number(fields.sidebarType) || 3,
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
      // Si el backend manda un mensaje claro (ej. límite de la licencia), es una
      // regla de negocio esperada — se muestra como warning, no como error.
      const backendMessage = error?.response?.data?.message
      const message = backendMessage ?? error?.message ?? 'No se pudo guardar el usuario'
      const text = Array.isArray(message) ? message.join('. ') : message
      Swal.fire(backendMessage ? 'Atención' : 'Error', text, backendMessage ? 'warning' : 'error')
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
            className={`users-modal__tab ${activeTab === 'company' ? 'active' : ''}`}
            onClick={() => setActiveTab('company')}
          >
            Empresa y sucursales
          </button>
          <button
            type='button'
            className={`users-modal__tab ${activeTab === 'modules' ? 'active' : ''}`}
            onClick={() => setActiveTab('modules')}
          >
            Acceso a módulos
          </button>
          <button
            type='button'
            className={`users-modal__tab ${activeTab === 'permissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('permissions')}
          >
            Permisos avanzados
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

                <div className='row__one'>
                  <div>
                    <label className='label__general'>Tipo de sidebar</label>
                    <select className='inputs__general' name='sidebarType' value={fields.sidebarType} onChange={handleChange}>
                      <option value='1'>1 · Secciones directas</option>
                      <option value='2'>2 · Un sidebar con submódulos</option>
                      <option value='3'>3 · Dos sidebars (completo)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* ─── TAB PERMISOS ─── */}
            {/* ─── TAB EMPRESA Y SUCURSALES ─── */}
            {activeTab === 'company' && (
              <div className='users-modal__company'>
                <div>
                  <label className='label__general'>Empresa</label>
                  {!isEdit && companies.length > 1 ? (
                    <select className='inputs__general' name='companyId' value={fields.companyId} onChange={handleChange} required>
                      <option value=''>Selecciona empresa</option>
                      {companies.map((co: any) => <option key={co.id} value={co.id}>{co.name}</option>)}
                    </select>
                  ) : (
                    <p className='users-modal__static'>{companies.find((co: any) => String(co.id) === String(fields.companyId))?.name ?? companies[0]?.name ?? '—'}</p>
                  )}
                </div>
                <BranchAvailabilityPicker
                  companyId={Number(fields.companyId) || companyId || null}
                  value={userBranchIds}
                  onChange={setUserBranchIds}
                  title='Sucursales donde puede trabajar'
                  hint={branches.length > 1 ? 'Marca todas las sucursales donde este usuario puede operar; la primera es su sucursal principal.' : undefined}
                />
              </div>
            )}

            {/* ─── TAB ACCESO A MÓDULOS ─── */}
            {activeTab === 'modules' && (
              <div className='users-modal__access'>
                <p className='users-modal__perm-hint'>
                  Decide a qué módulos entra este usuario. Parte de lo que ya da su rol y aquí lo ajustas: <b>Sin acceso</b> oculta el módulo,{' '}
                  <b>Consulta</b> solo deja ver y <b>Completo</b> deja ver, crear y gestionar.
                </p>
                {!fields.roleId && <p className='users-modal__access-warn'>Elige primero el rol en la pestaña Información: el acceso se calcula sobre lo que ese rol ya permite.</p>}
                {accessModules.length === 0 && <p className='users-modal__access-empty'>Esta sucursal todavía no tiene módulos activos.</p>}
                <div className='users-modal__access-summary'>
                  {accessModules.filter((m) => levelOf(m) !== 'none').length} de {accessModules.length} módulos con acceso
                </div>
                <ul className='users-modal__access-list'>
                  {accessModules.map((m) => {
                    const level = levelOf(m)
                    const views = m.perms.filter((x: any) => isViewPerm(x.name))
                    const on = views.filter((x: any) => effective(x.id)).length
                    const hasOverride = m.perms.some((x: any) => permissionOverrides.has(x.id))
                    return (
                      <li key={m.key} className={`users-modal__access-row ${level === 'none' ? 'is-off' : ''}`}>
                        <span className='users-modal__access-icon'>{renderIcon(m.icon)}</span>
                        <div className='users-modal__access-text'>
                          <strong>{m.label}</strong>
                          <small>
                            {on} de {views.length} pantallas
                            {hasOverride && ' · ajustado para este usuario'}
                          </small>
                        </div>
                        <div className='users-modal__access-control' role='radiogroup' aria-label={`Acceso a ${m.label}`}>
                          {([['none', 'Sin acceso'], ['view', 'Consulta'], ['full', 'Completo']] as [AccessLevel, string][]).map(([value, label]) => (
                            <button
                              key={value}
                              type='button'
                              role='radio'
                              aria-checked={level === value}
                              className={`users-modal__access-btn users-modal__access-btn--${value} ${level === value ? 'active' : ''}`}
                              onClick={() => setModuleLevel(m, value)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        {level === 'custom' && (
                          <div className='users-modal__access-custom'>
                            <span>Personalizado</span>
                            {hasOverride && <button type='button' onClick={() => resetModule(m)}>Restablecer al rol</button>}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

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

                          {/* Pantallas agrupadas como en el menú (Punto de venta, Gestión comercial…) */}
                          {groupSubmodules(mod.submodules).map(({ group, subs }) => {
                            const groupKey = `${mod.key}.${group}`
                            const groupOpen = !group || expandedGroups.has(groupKey)
                            const viewPerms = subs.map((sub) => sub.permissions.find((p) => p.actionLabel === 'Ver' || p.name.endsWith('.view'))).filter(Boolean) as { id: number }[]
                            const isOn = (id: number) => (permissionOverrides.has(id) ? permissionOverrides.get(id) === true : rolePermissions.has(id))
                            const onCount = viewPerms.filter((p) => isOn(p.id)).length
                            return (
                              <div key={group || 'sin-grupo'} className='users-modal__group'>
                                {group && (
                                  <button
                                    type='button'
                                    className='users-modal__group-toggle'
                                    aria-expanded={groupOpen}
                                    onClick={() =>
                                      setExpandedGroups((prev) => {
                                        const next = new Set(prev)
                                        if (next.has(groupKey)) next.delete(groupKey)
                                        else next.add(groupKey)
                                        return next
                                      })
                                    }
                                  >
                                    <span className={`users-modal__group-arrow ${groupOpen ? 'open' : ''}`}>
                                      <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M9 18l6-6-6-6'/></svg>
                                    </span>
                                    <span className='users-modal__group-name'>{group}</span>
                                    <span className='users-modal__group-count'>{onCount}/{subs.length}</span>
                                  </button>
                                )}
                                {groupOpen && (
                                  <div className='users-modal__group-body'>
                                    {subs.map((sub) => {
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
