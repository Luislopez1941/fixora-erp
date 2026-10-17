import React, { useCallback, useEffect, useMemo, useState } from 'react'
import './SidebarClassic.css'
import logoFixora from '../../assets/logo-fixora.png'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { PrivateRoutes } from '../../models/routes'
import { useModules } from '../../core/modules/useModules'
import type { MenuLink } from '../../core/modules/module.types'
import { renderIcon } from '../../core/modules/icons'
import { resetUser } from '../../redux/state/UserFixora'

/**
 * Sidebar de una sola columna (tipos 1 y 2 de "Tipo de sidebar" del usuario):
 *   · direct    → todas las pantallas a la vista, bajo el nombre de su módulo (para quien ve pocas secciones).
 *   · accordion → cada módulo se despliega con todas sus pantallas seguidas (sin grupos) dentro del mismo sidebar; los grupos solo existen en el sidebar de dos niveles.
 */
const PRIVATE_BASE = `/${PrivateRoutes.PRIVATE}`
const STORAGE_KEY = 'fixora-sidebar-classic'
const buildPath = (path?: string): string => (path ? `${PRIVATE_BASE}/${path}` : PRIVATE_BASE)

interface Props {
  variant: 'direct' | 'accordion'
}

const SidebarClassic: React.FC<Props> = ({ variant }) => {
  const { modules } = useModules()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const currentPath = pathname.replace(new RegExp(`^${PRIVATE_BASE}/?`), '').replace(/\/+$/, '')
  const isCurrent = (child: MenuLink) => child.path === currentPath

  const currentModuleKey = useMemo(() => modules.find((m) => m.children?.some((c) => c.path === currentPath))?.key, [modules, currentPath])

  // El sidebar se contrae a una columna de iconos con el chevron redondo y se expande con él; se recuerda la elección
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'closed'
    } catch {
      return false
    }
  })
  const [tip, setTip] = useState<{ label: string; top: number } | null>(null)
  const showTip = (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]')
    if (!el) return setTip(null)
    const r = el.getBoundingClientRect()
    setTip({ label: el.dataset.tip ?? '', top: r.top + r.height / 2 })
  }
  const setOpen = (open: boolean) => {
    setCollapsed(!open)
    try {
      localStorage.setItem(STORAGE_KEY, open ? 'open' : 'closed')
    } catch {
      /* ignorar */
    }
  }

  const [openModules, setOpenModules] = useState<Set<string>>(new Set())

  // Abre el módulo de la pantalla actual al navegar
  useEffect(() => {
    if (currentModuleKey) setOpenModules((prev) => (prev.has(currentModuleKey) ? prev : new Set(prev).add(currentModuleKey)))
  }, [currentModuleKey])

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) =>
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const logout = useCallback(() => {
    dispatch(resetUser())
    try {
      localStorage.removeItem('token-fixora')
      localStorage.removeItem('user')
    } catch {
      /* ignorar */
    }
    navigate('/login', { replace: true })
  }, [dispatch, navigate])

  const renderLink = (child: MenuLink) => (
    <Link
      key={child.path || 'inicio'}
      to={buildPath(child.path)}
      className={`sbc-link ${child.placeholder ? 'is-soon' : ''} ${isCurrent(child) ? 'is-current' : ''}`}
      aria-current={isCurrent(child) ? 'page' : undefined}
    >
      {child.label}
    </Link>
  )

  return (
    <nav className={`sidebar sbc sbc--${variant} ${collapsed ? 'is-collapsed' : ''}`} aria-label="Menú principal">
      <button type="button" className="sbc-toggle" onClick={() => setOpen(collapsed)} title={collapsed ? 'Expandir menú' : 'Contraer menú'} aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}>
        <span className="material-symbols-rounded sbc-toggle__icon">chevron_left</span>
      </button>
      <div className="sbc-head">
        <Link to={PRIVATE_BASE} className="sbc-logo" title="Inicio">
          <img src={logoFixora} alt="Fixora" />
        </Link>
      </div>

      {collapsed && (
        <div className="sbc-mini" onMouseOver={showTip} onMouseLeave={() => setTip(null)} onClick={() => setTip(null)}>
          {modules.map((mod) =>
            mod.children?.length ? (
              <button
                key={mod.key}
                type="button"
                className={`sbc-mini__item ${currentModuleKey === mod.key ? 'is-current' : ''}`}
                data-tip={mod.label}
                aria-label={mod.label}
                onClick={() => {
                  setOpenModules((prev) => new Set(prev).add(mod.key))
                  setOpen(true)
                }}
              >
                <span className="sbc-module__icon">{renderIcon(mod.icon)}</span>
              </button>
            ) : (
              <Link key={mod.key} to={buildPath(mod.path)} className={`sbc-mini__item ${mod.path === currentPath && !currentModuleKey ? 'is-current' : ''}`} data-tip={mod.label} aria-label={mod.label}>
                <span className="sbc-module__icon">{renderIcon(mod.icon)}</span>
              </Link>
            ),
          )}
          <button type="button" className="sbc-mini__item sbc-mini__item--logout" data-tip="Cerrar sesión" aria-label="Cerrar sesión" onClick={logout}>
            <span className="material-symbols-rounded" aria-hidden>logout</span>
          </button>
        </div>
      )}
      {collapsed && tip && <div className="sbc-tip" style={{ top: tip.top }} role="tooltip">{tip.label}</div>}

      {!collapsed && (
        <>
        <div className="sbc-scroll">
          {modules.map((mod) => {
            const hasChildren = !!mod.children?.length
            if (!hasChildren) {
              return (
                <Link key={mod.key} to={buildPath(mod.path)} className={`sbc-module sbc-module--link ${mod.path === currentPath && !currentModuleKey ? 'is-current' : ''}`}>
                  <span className="sbc-module__icon">{renderIcon(mod.icon)}</span>
                  <span className="sbc-module__label">{mod.label}</span>
                </Link>
              )
            }
            if (variant === 'direct') {
              return (
                <section key={mod.key} className="sbc-section">
                  <h3 className="sbc-section__title">
                    <span className="sbc-module__icon">{renderIcon(mod.icon)}</span>
                    {mod.label}
                  </h3>
                  {mod.children!.map(renderLink)}
                </section>
              )
            }
            const open = openModules.has(mod.key)
            return (
              <section key={mod.key} className="sbc-section">
                <button type="button" className={`sbc-module ${currentModuleKey === mod.key ? 'is-current' : ''}`} onClick={() => toggle(setOpenModules, mod.key)} aria-expanded={open}>
                  <span className="sbc-module__icon">{renderIcon(mod.icon)}</span>
                  <span className="sbc-module__label">{mod.label}</span>
                  <span className={`sbc-chev material-symbols-rounded ${open ? 'open' : ''}`} aria-hidden>chevron_right</span>
                </button>
                <div className={`sbc-collapse ${open ? 'is-open' : ''}`} aria-hidden={!open}>
                  <div className="sbc-children">{mod.children!.map(renderLink)}</div>
                </div>
              </section>
            )
          })}
        </div>

        <button type="button" className="sbc-logout" onClick={logout}>
          <span className="material-symbols-rounded" aria-hidden>logout</span>
          Cerrar sesión
        </button>
        </>
      )}
    </nav>
  )
}

export default SidebarClassic
