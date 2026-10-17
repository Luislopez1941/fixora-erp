import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './ModalRoles.css'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../../redux/state/modals'
import APIs from '../../../../../../services/APIs'
import Swal from 'sweetalert2'
import { MODULE_LABELS, SUBMODULE_LABELS } from '../../../../../../core/modules/taxonomy.generated'
import { groupSubmodules, orderModules, HIDDEN_PERMISSION_MODULES, PERMISSION_MODULE_ALIAS } from '../../../../../../core/permissions/permissionTree'
import type { ModuleGroup, SubmoduleGroup } from '../../../../../../core/permissions/permissionTree'

interface Props {
  role?: any | null
  onSaved?: () => void
}

// Labels fallback para modo creación (cuando no hay roleId para getRolePermissions)
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
  inventory: 'Almacén',
  general: 'General',
  accounting: 'Contabilidad',
}

const submoduleLabels: Record<string, string> = {
  // Ventas
  sheet: 'Ficha de venta',
  quote: 'Cotización',
  order: 'Orden de venta',
  // Cuentas por cobrar
  credit: 'Cuentas de crédito',
  debtors: 'Deudores',
  payments: 'Abonos',
  // Compras
  requisition: 'Requisición',
  purchase: 'Orden de compra',
  // Caja
  register: 'Caja Actual',
  current: 'Caja Actual',
  movements: 'Movimientos de Caja',
  cuts: 'Cortes de Caja',
  shifts: 'Turnos',
  registers: 'Cajas',
  schedules: 'Programación de turnos',
  config: 'Configuración',
  // Producción
  orders: 'Órdenes de producción',
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
  suppliers: 'Proveedores',
  services: 'Servicios',
  articles: 'Artículos',
  prices: 'Rangos de precio',
  // Configuraciones
  companies: 'Empresas',
  branch: 'Sucursales',
  series: 'Series',
  franchise: 'Franquicia',
  userGroups: 'Grupos de usuarios',
  // Usuarios
  staff: 'Personal',
}

// Construye la estructura jerárquica a partir de una lista plana de permisos (modo creación)
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

const ModalRoles: React.FC<Props> = ({ role, onSaved }) => {
  const dispatch = useDispatch()
  const modalState = useSelector((state: any) => state.modals)
  const isEdit = Boolean(role?.id)

  const [name, setName] = useState('')
  const [level, setLevel] = useState('')
  const [modules, setModules] = useState<ModuleGroup[]>([])
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set())
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [expandedSubmodules, setExpandedSubmodules] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState(false)

  const handleModalChange = (value: string) => {
    dispatch(modal(value))
    if (!value) setTouched(false)
  }

  // Carga permisos: edición → petición específica por rol; creación → catálogo general
  const loadPermissions = async () => {
    try {
      if (isEdit && role?.id) {
        const res: any = await APIs.getRolePermissions(role.id)
        const data = res?.data
        if (data?.modules) {
          setModules(orderModules(data.modules))
          // Pre-seleccionar los asignados
          const assigned = new Set<number>()
          for (const mod of data.modules) {
            for (const p of mod.permissions) if (p.assigned) assigned.add(p.id)
            for (const sub of mod.submodules) {
              for (const p of sub.permissions) if (p.assigned) assigned.add(p.id)
            }
          }
          setSelectedPermissionIds(assigned)
        }
        if (data?.role) {
          setName(data.role.name ?? '')
          setLevel(String(data.role.level ?? ''))
        }
      } else {
        const res: any = await APIs.getRolesCatalog()
        const perms = res?.catalog?.permissions ?? []
        setModules(buildModulesFromPermissions(perms))
        setSelectedPermissionIds(new Set())
      }
    } catch {
      setModules([])
    }
  }

  useEffect(() => {
    if (modalState !== 'roles_modal') return
    loadPermissions()
  }, [modalState, role?.id])

  const togglePermission = (id: number) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Marca o quita varios permisos de golpe; al quitar "Ver" de una pantalla también se quitan sus demás acciones
  const setMany = (viewIds: number[], on: boolean, subs: SubmoduleGroup[]) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev)
      for (const id of viewIds) {
        if (on) next.add(id)
        else next.delete(id)
      }
      if (!on) for (const sub of subs) for (const p of sub.permissions) next.delete(p.id)
      return next
    })
  }

  const toggleModule = (key: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
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

  // Validaciones (se muestran bajo el campo al intentar guardar)
  const levelNum = Number(level)
  const nameError = !name.trim()
    ? 'El nombre es requerido'
    : name.trim().length > 40
      ? 'Máximo 40 caracteres'
      : ''
  const levelError = !level
    ? 'El nivel es requerido'
    : !Number.isInteger(levelNum) || levelNum < 1
      ? 'Debe ser un entero mayor o igual a 1 (el 0 es de Super Admin)'
      : ''
  const permissionsError = selectedPermissionIds.size === 0 ? 'Selecciona al menos un permiso' : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (nameError || levelError || permissionsError) return

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        level: levelNum,
        permissionIds: Array.from(selectedPermissionIds),
      }
      if (isEdit) {
        await APIs.updateRole(role.id, payload)
        Swal.fire('Listo', 'Rol actualizado', 'success')
      } else {
        await APIs.createRole(payload)
        Swal.fire('Listo', 'Rol creado', 'success')
      }
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
    <div className={`roles_modal__overlay ${modalState === 'roles_modal' ? 'active' : ''}`}>
      <div className={`roles_modal__popup ${modalState === 'roles_modal' ? 'active' : ''}`}>
        <div className='roles_modal__header'>
          <button type='button' className='roles_modal__close' onClick={() => handleModalChange('')} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
          <p className='roles_modal__title'>{isEdit ? 'Editar rol' : 'Nuevo rol'}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className='roles_modal__body'>
            <div className='roles_modal__fields'>
              <div>
                <label className='label__general'>Nombre del rol</label>
                <input className='inputs__general' value={name} onChange={(e) => setName(e.target.value)} placeholder='ej. supervisor' />
                {touched && nameError && <small className='roles_modal__error'>{nameError}</small>}
              </div>
              <div>
                <label className='label__general'>Nivel</label>
                <input className='inputs__general' type='number' min='1' value={level} onChange={(e) => setLevel(e.target.value)} placeholder='1' />
                {touched && levelError && <small className='roles_modal__error'>{levelError}</small>}
              </div>
            </div>

            <label className='label__general'>Permisos por módulo</label>
            {touched && permissionsError && <small className='roles_modal__error'>{permissionsError}</small>}
            <div className='roles_modal__modules'>
              {modules.map((mod) => {
                const isExpanded = expandedModules.has(mod.key)
                const viewPerm = mod.permissions.find((p) => p.actionLabel === 'Ver' || p.name.endsWith('.view'))
                const otherPerms = mod.permissions.filter((p) => p.id !== viewPerm?.id)
                const viewChecked = viewPerm ? selectedPermissionIds.has(viewPerm.id) : false

                return (
                  <div key={mod.key} className={`roles_modal__module ${!viewChecked ? 'module-disabled' : ''}`}>
                    <div className='roles_modal__module-header'>
                      <label className={`roles_modal__module-view ${viewChecked ? 'checked' : ''}`} title='Acceso al módulo'>
                        <input
                          type='checkbox'
                          checked={viewChecked}
                          onChange={() => {
                            if (viewPerm) {
                              togglePermission(viewPerm.id)
                              // Si desmarca "Ver", quitar permisos del módulo y submódulos
                              if (viewChecked) {
                                for (const p of otherPerms) {
                                  if (selectedPermissionIds.has(p.id)) togglePermission(p.id)
                                }
                                for (const sub of mod.submodules) {
                                  for (const p of sub.permissions) {
                                    if (selectedPermissionIds.has(p.id)) togglePermission(p.id)
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </label>
                      <button type='button' className='roles_modal__module-toggle' onClick={() => toggleModule(mod.key)}>
                        <span className='roles_modal__module-name'>{mod.label}</span>
                        <span className={`roles_modal__module-arrow ${isExpanded ? 'open' : ''}`}>
                          <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M9 18l6-6-6-6'/></svg>
                        </span>
                      </button>
                    </div>

                    {isExpanded && (
                      <div className='roles_modal__module-body'>
                        {/* Permisos generales del módulo (excluyendo Ver) */}
                        {otherPerms.map((perm) => {
                          const checked = selectedPermissionIds.has(perm.id)
                          return (
                            <label key={perm.id} className={`roles_modal__perm-row ${checked ? 'checked' : ''} ${!viewChecked ? 'disabled' : ''}`}>
                              <input
                                type='checkbox'
                                checked={checked}
                                disabled={!viewChecked}
                                onChange={() => togglePermission(perm.id)}
                              />
                              <span className='roles_modal__perm-action'>{perm.actionLabel || perm.name}</span>
                              <span className='roles_modal__perm-desc'>{perm.description}</span>
                            </label>
                          )
                        })}

                        {/* Submódulos (pantallas) agrupados por su grupo del menú, cada uno con su desplegable de acciones */}
                        {groupSubmodules(mod.submodules).map(({ group, subs }) => {
                          const viewIds = subs.map((sub) => sub.permissions.find((p) => p.actionLabel === 'Ver' || p.name.endsWith('.view'))?.id).filter((id): id is number => id != null)
                          const allOn = viewIds.length > 0 && viewIds.every((id) => selectedPermissionIds.has(id))
                          const onCount = viewIds.filter((id) => selectedPermissionIds.has(id)).length
                          const groupKey = `${mod.key}.${group}`
                          const groupOpen = !group || expandedGroups.has(groupKey)
                          return (
                            <div key={group || 'sin-grupo'} className='roles_modal__group'>
                              {group && (
                                <div className='roles_modal__group-header'>
                                  <button type='button' className='roles_modal__group-toggle' onClick={() => toggleGroup(groupKey)} aria-expanded={groupOpen}>
                                    <span className={`roles_modal__group-arrow ${groupOpen ? 'open' : ''}`}>
                                      <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M9 18l6-6-6-6'/></svg>
                                    </span>
                                    <span className='roles_modal__group-name'>{group}</span>
                                    <span className='roles_modal__group-count'>{onCount}/{subs.length}</span>
                                  </button>
                                  <button type='button' className='roles_modal__group-all' disabled={!viewChecked} onClick={() => setMany(viewIds, !allOn, subs)}>
                                    {allOn ? 'Quitar todas' : 'Dar acceso a todas'}
                                  </button>
                                </div>
                              )}
                              {groupOpen && <div className='roles_modal__group-body'>{subs.map((sub) => {
                              const subExpanded = expandedSubmodules.has(`${mod.key}.${sub.key}`)
                              const subViewPerm = sub.permissions.find((p) => p.actionLabel === 'Ver' || p.name.endsWith('.view'))
                              const subOtherPerms = sub.permissions.filter((p) => p.id !== subViewPerm?.id)
                              const subViewChecked = subViewPerm ? selectedPermissionIds.has(subViewPerm.id) : false

                              const subDisabled = !viewChecked // bloqueado si el módulo padre no tiene Ver

                              return (
                                <div key={sub.key} className={`roles_modal__submodule ${subDisabled ? 'submodule-disabled' : ''}`}>
                                  <div className='roles_modal__submodule-header'>
                                    <label className={`roles_modal__submodule-view ${subViewChecked ? 'checked' : ''}`} title='Acceso al submódulo'>
                                      <input
                                        type='checkbox'
                                        checked={subViewChecked}
                                        disabled={subDisabled}
                                        onChange={() => {
                                          if (subViewPerm) {
                                            togglePermission(subViewPerm.id)
                                            // Si desmarca "Ver", quitar los demás del submódulo
                                            if (subViewChecked) {
                                              for (const p of subOtherPerms) {
                                                if (selectedPermissionIds.has(p.id)) {
                                                  togglePermission(p.id)
                                                }
                                              }
                                            }
                                          }
                                        }}
                                      />
                                    </label>
                                    <button
                                      type='button'
                                      className='roles_modal__submodule-toggle'
                                      disabled={subDisabled}
                                      onClick={() => toggleSubmodule(`${mod.key}.${sub.key}`)}
                                    >
                                      <span className='roles_modal__submodule-name'>{sub.label}</span>
                                      <span className={`roles_modal__submodule-arrow ${subExpanded ? 'open' : ''}`}>
                                        <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M9 18l6-6-6-6'/></svg>
                                      </span>
                                    </button>
                                  </div>
                                  {subExpanded && (
                                    <div className='roles_modal__submodule-body'>
                                      {subOtherPerms.map((perm) => {
                                        const checked = selectedPermissionIds.has(perm.id)
                                        return (
                                          <label key={perm.id} className={`roles_modal__perm-row ${checked ? 'checked' : ''} ${!subViewChecked ? 'disabled' : ''}`}>
                                            <input
                                              type='checkbox'
                                              checked={checked}
                                              disabled={!subViewChecked}
                                              onChange={() => togglePermission(perm.id)}
                                            />
                                            <span className='roles_modal__perm-action'>{perm.actionLabel || perm.name}</span>
                                            <span className='roles_modal__perm-desc'>{perm.description}</span>
                                          </label>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                              })}</div>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className='roles_modal__actions'>
              <button type='button' className='btn__general-secondary' onClick={() => handleModalChange('')}>Cancelar</button>
              <button type='submit' className='btn__general-primary' disabled={saving}>
                {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear rol'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default ModalRoles
