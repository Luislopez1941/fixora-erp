import React, { useState, useRef } from 'react'
import './Sidebar.css'
import astra from '../../assets/astra.svg'
import { Link } from 'react-router-dom'
import { PrivateRoutes } from '../../models/routes'
import { useModules } from '../../core/modules/useModules'
import type { ModuleManifest } from '../../core/modules/module.types'
import { renderIcon, ChevronIcon } from '../../core/modules/icons'

/**
 * Sidebar data-driven.
 *
 * Los ítems se generan desde el registro de módulos (core/modules), no están
 * hardcodeados. Agregar/quitar un módulo = editar `modules.config.ts`.
 * Mantiene el mismo diseño y clases CSS del sidebar original.
 */
const PRIVATE_BASE = `/${PrivateRoutes.PRIVATE}`

const buildPath = (path?: string): string => {
  if (!path) return PRIVATE_BASE
  return `${PRIVATE_BASE}/${path}`
}

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(true)
  const [activeMenu, setActiveMenu] = useState<string>('')
  const [popupData, setPopupData] = useState<{
    mod: ModuleManifest
    top: number
    left: number
  } | null>(null)

  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openPopup = (mod: ModuleManifest, el: HTMLElement) => {
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current)
      popupTimerRef.current = null
    }
    const rect = el.getBoundingClientRect()
    setPopupData({
      mod,
      top: rect.top,
      left: rect.right + 8,
    })
  }

  const closePopup = () => {
    popupTimerRef.current = setTimeout(() => setPopupData(null), 120)
  }

  const cancelClosePopup = () => {
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current)
      popupTimerRef.current = null
    }
  }

  const { modules } = useModules()

  const toggleSidebar = () => setCollapsed((prev) => !prev)
  const openSubMenu = (value: string) =>
    setActiveMenu((prev) => (prev === value ? '' : value))

  const renderModule = (mod: ModuleManifest) => {
    const hasChildren = !!mod.children?.length

    // Módulo de enlace simple (Dashboard, Ingresos)
    if (!hasChildren) {
      return (
        <li className="item" key={mod.key}>
          <Link to={buildPath(mod.path)} className="tooltip">
            {renderIcon(mod.icon)}
            <span className="link hide">{mod.label}</span>
            <span className="tooltip__content">{mod.label}</span>
          </Link>
        </li>
      )
    }

    // Módulo con submenú
    const isActive = activeMenu === mod.key
    return (
      <li className="item" key={mod.key}>
        <a
          className="tooltip sub-menu-toggle"
          onClick={() => openSubMenu(mod.key)}
          onMouseEnter={(e) => collapsed && openPopup(mod, e.currentTarget)}
          onMouseLeave={closePopup}
        >
          {renderIcon(mod.icon)}
          <span className="link hide">{mod.label}</span>
          <span className="chevron hide">{ChevronIcon}</span>
          <span className="tooltip__content">{mod.label}</span>
        </a>
        <div className={`sub-menu ${isActive ? 'active' : ''}`}>
          <div className="sub-menu-container">
            {mod.children!.map((child, idx) => (
              <Link
                to={buildPath(child.path)}
                className="sub-menu-link"
                key={`${mod.key}-${idx}`}
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      </li>
    )
  }

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-top-wrapper">
        <div className="sidebar-top">
          <a href="#" className="logo__wrapper">
            <img src={astra} alt="Logo" className="logo-small" />
            <span className="hide">Astra</span>
          </a>
        </div>
        <div className="expand-btn" onClick={toggleSidebar}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.00979 2.72L10.3565 7.06667C10.8698 7.58 10.8698 8.42 10.3565 8.93333L6.00979 13.28"
              strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="sidebar-links">
        <h2>Main</h2>
        <ul className="menu_sidebar">{modules.map(renderModule)}</ul>

        <div className="sidebar-links bottom-links">
          <h2>Settings</h2>
          <ul>
            <li>
              <a href="#settings" title="Settings" className="tooltip">
                {renderIcon('settings')}
                <span className="link hide">Settings</span>
                <span className="tooltip__content">Settings</span>
              </a>
            </li>
          </ul>
        </div>

        {popupData && (
          <div
            className="tooltip__sub-popup-fixed"
            style={{ top: popupData.top, left: popupData.left }}
            onMouseEnter={cancelClosePopup}
            onMouseLeave={() => setPopupData(null)}
          >
            <div className="tooltip__sub-popup-title">{popupData.mod.label}</div>
            {popupData.mod.children!.map((child, idx) => (
              <Link
                to={buildPath(child.path)}
                className="tooltip__sub-popup-link"
                key={`popup-${idx}`}
                onClick={() => setPopupData(null)}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
        <div className="divider"></div>
        <div className="sidebar__profile">
          <div className="btn__logout_close">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-logout" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2"></path>
              <path d="M9 12h12l-3 -3"></path>
              <path d="M18 15l3 -3"></path>
            </svg>
          </div>
          <button className="btn__logout">Cerrar sesion</button>
        </div>
      </div>
    </nav>
  )
}

export default Sidebar
