import React, { useCallback, useEffect, useMemo, useState } from 'react'
import './Sidebar.css'
import './SidebarRail.css'
import logoFixora from '../../assets/logo-fixora.png'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { PrivateRoutes } from '../../models/routes'
import { useModules } from '../../core/modules/useModules'
import type { MenuLink, ModuleManifest } from '../../core/modules/module.types'
import { renderIcon } from '../../core/modules/icons'
import { resetUser } from '../../redux/state/UserFixora'
import SidebarClassic from './SidebarClassic'

/**
 * Sidebar de dos niveles, data-driven (se arma con el registro de módulos de core/modules):
 *   · Riel (64 px, solo iconos): un icono por módulo.
 *   · Panel (200 px): submódulos (grupos plegables) y pantallas del módulo elegido, con buscador.
 * El panel se oculta con un botón (el menú queda en 64 px) y se recuerda la elección. En pantallas medianas flota encima del
 * contenido y se cierra al navegar. En celular no se usa (hay un menú propio, ver OptionsMenu).
 */
const PRIVATE_BASE = `/${PrivateRoutes.PRIVATE}`
const STORAGE_KEY = 'fixora-sidebar-panel'
const WIDE = '(min-width: 1280px)'

const buildPath = (path?: string): string => (path ? `${PRIVATE_BASE}/${path}` : PRIVATE_BASE)
const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const readPinned = (): boolean => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'open') return true
    if (saved === 'closed') return false
  } catch {
    /* sin almacenamiento: se usa el valor por omisión */
  }
  return window.matchMedia(WIDE).matches
}

const SidebarDual: React.FC = () => {
  const { modules } = useModules()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [tip, setTip] = useState<{ label: string; top: number } | null>(null)
  const showTip = (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]')
    if (!el) return setTip(null)
    const r = el.getBoundingClientRect()
    setTip({ label: el.dataset.tip ?? '', top: r.top + r.height / 2 })
  }
  const [wide, setWide] = useState<boolean>(() => window.matchMedia(WIDE).matches)
  const [panelOpen, setPanelOpen] = useState<boolean>(readPinned)
  const [panelKey, setPanelKey] = useState<string>('') // módulo que muestra el panel
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')

  useEffect(() => {
    const media = window.matchMedia(WIDE)
    const onChange = () => setWide(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const remember = (open: boolean) => {
    setPanelOpen(open)
    try {
      localStorage.setItem(STORAGE_KEY, open ? 'open' : 'closed')
    } catch {
      /* ignorar */
    }
  }

  // Ruta actual sin /auth ('' = panel principal)
  const currentPath = pathname.replace(new RegExp(`^${PRIVATE_BASE}/?`), '').replace(/\/+$/, '')
  const isCurrent = (child: MenuLink) => child.path === currentPath

  // Módulo y grupo de la pantalla actual
  const current = useMemo(() => {
    for (const mod of modules) {
      const child = mod.children?.find((c) => c.path === currentPath)
      if (child) return { moduleKey: mod.key, group: child.group }
    }
    return null
  }, [modules, currentPath])

  // Al navegar: el panel muestra el módulo de la pantalla actual y abre su grupo; flotante, se cierra solo
  useEffect(() => {
    if (current) {
      setPanelKey(current.moduleKey)
      if (current.group) {
        const key = `${current.moduleKey}::${current.group}`
        setOpenGroups((prev) => (prev.has(key) ? prev : new Set(prev).add(key)))
      }
    }
    if (!wide) setPanelOpen(false)
    setQuery('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.moduleKey, current?.group, pathname])

  // Si no hay módulo elegido, el primero con submódulos
  const withChildren = useMemo(() => modules.filter((m) => m.children?.length), [modules])
  const panelModule: ModuleManifest | undefined = modules.find((m) => m.key === panelKey && m.children?.length) ?? withChildren[0]

  const onRailClick = (mod: ModuleManifest) => {
    if (!mod.children?.length) return
    if (panelModule?.key === mod.key && panelOpen) {
      // Segundo clic en el módulo abierto: oculta el panel
      if (wide) remember(false)
      else setPanelOpen(false)
      return
    }
    setPanelKey(mod.key)
    if (wide) remember(true)
    else setPanelOpen(true)
  }

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return []
    const rows: { mod: ModuleManifest; child: MenuLink }[] = []
    for (const mod of modules) {
      for (const child of mod.children ?? []) {
        if (normalize(`${child.label} ${child.group ?? ''} ${mod.label}`).includes(q)) rows.push({ mod, child })
      }
    }
    return rows.slice(0, 40)
  }, [modules, query])

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

  const showPanel = panelOpen && !!panelModule

  const renderLink = (child: MenuLink) => (
    <Link
      key={child.path || 'inicio'}
      to={buildPath(child.path)}
      className={`sbx-link ${child.placeholder ? 'is-soon' : ''} ${isCurrent(child) ? 'is-current' : ''}`}
      aria-current={isCurrent(child) ? 'page' : undefined}
    >
      {child.label}
    </Link>
  )

  const renderPanelBody = (mod: ModuleManifest) => {
    const children = mod.children!
    const grouped = children.some((c) => c.group)
    if (!grouped) return children.map(renderLink)
    return Array.from(new Set(children.map((c) => c.group ?? ''))).map((group) => {
      const items = children.filter((c) => (c.group ?? '') === group)
      const key = `${mod.key}::${group}`
      const open = !group || openGroups.has(key)
      return (
        <div className="sbx-block" key={key}>
          {group && (
            <button type="button" className={`sbx-group ${items.some(isCurrent) ? 'is-current' : ''}`} onClick={() => toggleGroup(key)} aria-expanded={open}>
              <span>{group}</span>
              <small>{items.length}</small>
              <span className={`sbx-group__chev material-symbols-rounded ${open ? 'open' : ''}`} aria-hidden>chevron_right</span>
            </button>
          )}
          <div className={`sbx-collapse ${open ? 'is-open' : ''}`}>
            <div className="sbx-collapse__inner">{items.map(renderLink)}</div>
          </div>
        </div>
      )
    })
  }

  return (
    <nav className={`sidebar sbx ${showPanel ? 'has-panel' : ''} ${wide ? 'is-wide' : 'is-narrow'}`} aria-label="Menú principal">
      {/* ── Nivel 1: riel de módulos ── */}
      <div className="sbx-rail" onMouseOver={showTip} onMouseLeave={() => setTip(null)} onClick={() => setTip(null)}>
        <Link to={PRIVATE_BASE} className="sbx-logo" data-tip="Inicio">
          <img src={logoFixora} alt="Fixora" />
        </Link>

        {/* Accesos directos (una sola pantalla) arriba, separados de los módulos con submenú */}
        {modules.some((m) => !m.children?.length) && (
          <ul className="sbx-rail__list sbx-rail__list--shortcuts">
            {modules.filter((m) => !m.children?.length).map((mod) => (
              <li key={mod.key}>
                <Link to={buildPath(mod.path)} className={`sbx-rail__item ${mod.path === currentPath && !current ? 'is-active' : ''}`} data-tip={mod.label} aria-label={mod.label}>
                  <span className="sbx-rail__icon">{renderIcon(mod.icon)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <ul className="sbx-rail__list">
          {modules.filter((m) => m.children?.length).map((mod) => {
            const active = panelModule?.key === mod.key && (showPanel || current?.moduleKey === mod.key)
            return (
              <li key={mod.key}>
                <button
                  type="button"
                  className={`sbx-rail__item ${active ? 'is-active' : ''} ${current?.moduleKey === mod.key ? 'is-current' : ''}`}
                  onClick={() => onRailClick(mod)}
                  data-tip={mod.label}
                  aria-label={mod.label}
                  aria-pressed={active}
                >
                  <span className="sbx-rail__icon">{renderIcon(mod.icon)}</span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="sbx-rail__bottom">
          <button type="button" className="sbx-rail__item" onClick={() => (wide ? remember(!panelOpen) : setPanelOpen((v) => !v))} data-tip={panelOpen ? 'Ocultar submenú' : 'Mostrar submenú'} aria-label="Mostrar u ocultar el submenú">
            <span className="material-symbols-rounded">{panelOpen ? 'left_panel_close' : 'left_panel_open'}</span>
          </button>
          <button type="button" className="sbx-rail__item sbx-rail__item--logout" onClick={logout} data-tip="Cerrar sesión" aria-label="Cerrar sesión">
            <span className="material-symbols-rounded">logout</span>
          </button>
        </div>
      </div>

      {tip && <div className="sbx-tip" style={{ top: tip.top }} role="tooltip">{tip.label}</div>}

      {/* ── Nivel 2: panel de submódulos ── */}
      {panelModule && (
        <>
          {showPanel && !wide && <div className="sbx-backdrop" onClick={() => setPanelOpen(false)} />}
          <aside className={`sbx-panel ${showPanel ? '' : 'is-hidden'}`} aria-label={`Submenú de ${panelModule.label}`} aria-hidden={!showPanel}>
            <div className="sbx-panel__inner">
            <header className="sbx-panel__head">
              <h2>{panelModule.label}</h2>
              <button type="button" className="sbx-panel__hide" onClick={() => (wide ? remember(false) : setPanelOpen(false))} title="Ocultar submenú" aria-label="Ocultar submenú">
                <span className="material-symbols-rounded">chevron_left</span>
              </button>
            </header>
            <div className="sbx-search">
              <span className="material-symbols-rounded" aria-hidden>search</span>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar pantalla…" aria-label="Buscar pantalla" autoComplete="off" />
            </div>
            <div className="sbx-panel__body" key={panelModule.key}>
              {query.trim() ? (
                results.length ? (
                  results.map(({ mod, child }) => (
                    <Link key={`${mod.key}:${child.path}`} to={buildPath(child.path)} className={`sbx-result ${isCurrent(child) ? 'is-current' : ''}`}>
                      <strong>{child.label}</strong>
                      <small>{child.group ? `${mod.label} › ${child.group}` : mod.label}</small>
                    </Link>
                  ))
                ) : (
                  <p className="sbx-empty">Sin resultados</p>
                )
              ) : (
                renderPanelBody(panelModule)
              )}
            </div>
            </div>
          </aside>
        </>
      )}

      {!showPanel && panelModule && (
        <button type="button" className="sbx-handle" onClick={() => (wide ? remember(true) : setPanelOpen(true))} title="Mostrar submenú" aria-label="Mostrar submenú">
          <span className="material-symbols-rounded">chevron_right</span>
        </button>
      )}
    </nav>
  )
}

/**
 * Tipo de menú por usuario (se elige en Usuarios → "Tipo de sidebar"):
 *   1 = secciones directas (una lista simple, sin submenús) · 2 = un solo sidebar con módulos desplegables · 3 = dos sidebars (riel + panel).
 */
const Sidebar: React.FC = () => {
  const sidebarType: number | undefined = useSelector((state: any) => state.user?.sidebarType)
  if (sidebarType === 1) return <SidebarClassic variant="direct" />
  if (sidebarType === 2) return <SidebarClassic variant="accordion" />
  return <SidebarDual />
}

export default Sidebar
