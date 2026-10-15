import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { resetUser } from '../../redux/state/UserFixora'
import logoFixora from '../../assets/logo-fixora.png'
import './Header.css'

const ROUTE_LABELS: Record<string, string> = {
  /* Root */
  auth: 'Inicio',
  dashboard: 'Dashboard',
  Dashboard: 'Dashboard',
  /* Catálogos */
  catalogos: 'Catálogo',
  'menu-catalogo': 'Catálogo',
  areas: 'SubÁreas',
  /* Etiquetas que dependen del segmento anterior ("padre/hijo"): en Configuraciones es el catálogo de Áreas */
  'configurations/areas': 'Áreas',
  'tipos-areas': 'Áreas',
  types: 'Áreas',
  familias: 'Familias',
  categories: 'Categorías',
  units: 'Unidades',
  services: 'Servicios',
  articles: 'Artículos',
  'price-ranges': 'Rangos de Precio',
  products: 'Productos',
  /* Caja */
  cash: 'Caja',
  shifts: 'Turnos',
  cuts: 'Cortes',
  config: 'Configuración',
  movements: 'Movimientos',
  current: 'Caja actual',
  /* Ventas */
  sales: 'Ventas',
  'menu-sales': 'Ventas',
  'sales-sheet': 'Hoja de Ventas',
  'pos-config': 'Configurar cobro',
  quotation: 'Cotizaciones',
  salesorder: 'Pedidos',
  /* Cobranza */
  cobranza: 'Cobranza',
  'menu-cobranza': 'Cobranza',
  'credit-accounts': 'Cuentas de Crédito',
  debtors: 'Deudores',
  'credit-payments': 'Pagos',
  /* Compras */
  shopping: 'Compras',
  'menu-shopping': 'Compras',
  purchaseorders: 'Órdenes de Compra',
  requisitions: 'Requisiciones',
  /* Producción */
  production: 'Producción',
  'menu-production': 'Producción',
  orders: 'Órdenes',
  queue: 'Cola de Producción',
  /* Almacén */
  store: 'Almacén',
  'menu-store': 'Almacén',
  inventory: 'Inventario',
  tickets: 'Tickets',
  departures: 'Salidas',
  /* Configuraciones */
  configurations: 'Configuraciones',
  'menu-settings': 'Configuraciones',
  companies: 'Empresas',
  'branch-offices': 'Sucursales',
  roles: 'Roles',
  users: 'Usuarios',
  series: 'Series',
  audit: 'Auditoría',
  /* Otros */
  income: 'Ingresos',
  reports: 'Reportes',
  'module-store': 'Tienda de Módulos',
  options: 'Menú',
}

const HeaderBreadcrumb: React.FC = () => {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  // Remove 'auth' and numeric IDs
  const meaningful = segments
    .filter((s) => s !== 'auth')
    .filter((s) => !/^\d+$/.test(s))

  // Segments to display: always at least ['Inicio']
  const crumbs = meaningful.length === 0
    ? [{ label: 'Inicio', active: true }]
    : meaningful.map((seg, idx) => ({
        label: ROUTE_LABELS[`${meaningful[idx - 1]}/${seg}`] ?? ROUTE_LABELS[seg] ?? seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        active: idx === meaningful.length - 1,
      }))

  return (
    <nav className='header-breadcrumb'>
      <span className='header-breadcrumb__home'>
        <span className='material-symbols-rounded' style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>home</span>
      </span>
      {crumbs.map((crumb, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && (
            <span className='header-breadcrumb__sep'>/</span>
          )}
          <span className={`header-breadcrumb__item${crumb.active ? ' header-breadcrumb__item--active' : ''}`}>
            {crumb.label}
          </span>
        </React.Fragment>
      ))}
    </nav>
  )
}

const Header: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('crm-theme') as 'dark' | 'light') ?? 'light'
  })
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('crm-theme', theme)
  }, [theme])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const handleLogout = () => {
    dispatch(resetUser())
    localStorage.removeItem('token-fixora')
    localStorage.removeItem('user')
    window.location.href = '/auth'
  }

  return (
    <div className='hero'>
      <div className='hero__container'>
        <div className='hero__left'>
          <div className="astra_logo">
            <img src={logoFixora} alt="Fixora" className="fixora-logo" />
            <span className="fixora-brand">Fixora</span>
          </div>
          <HeaderBreadcrumb />
        </div>
        <div className='row__one'>
          <button className='theme-toggle' onClick={toggleTheme} title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0zM7.05 18.36l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
              </svg>
            )}
          </button>
          <div className='sale'>
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M120-160q-33 0-56.5-23.5T40-240v-400q0-17 11.5-28.5T80-680q17 0 28.5 11.5T120-640v400h640q17 0 28.5 11.5T800-200q0 17-11.5 28.5T760-160H120Zm160-160q-33 0-56.5-23.5T200-400v-320q0-33 23.5-56.5T280-800h560q33 0 56.5 23.5T920-720v320q0 33-23.5 56.5T840-320H280Zm80-80q0-33-23.5-56.5T280-480v80h80Zm400 0h80v-80q-33 0-56.5 23.5T760-400Zm-200-40q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM280-640q33 0 56.5-23.5T360-720h-80v80Zm560 0v-80h-80q0 33 23.5 56.5T840-640Z" /></svg>
          </div>
          <div className='bell' ref={notifRef}>
            <button
              className='bell__trigger'
              onClick={() => setNotifOpen(prev => !prev)}
              aria-haspopup="true"
              aria-expanded={notifOpen}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-bell"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14.235 19c.865 0 1.322 1.024 .745 1.668a3.992 3.992 0 0 1 -2.98 1.332a3.992 3.992 0 0 1 -2.98 -1.332c-.552 -.616 -.158 -1.579 .634 -1.661l.11 -.006h4.471z" /><path d="M12 2c1.358 0 2.506 .903 2.875 2.141l.046 .171l.008 .043a8.013 8.013 0 0 1 4.024 6.069l.028 .287l.019 .289v2.931l.021 .136a3 3 0 0 0 1.143 1.847l.167 .117l.162 .099c.86 .487 .56 1.766 -.377 1.864l-.116 .006h-16c-1.028 0 -1.387 -1.364 -.493 -1.87a3 3 0 0 0 1.472 -2.063l.021 -.143l.001 -2.97a8 8 0 0 1 3.821 -6.454l.248 -.146l.01 -.043a3.003 3.003 0 0 1 2.562 -2.29l.182 -.017l.176 -.004z" /></svg>
            </button>
            {notifOpen && (
              <div className='bell__dropdown'>
                <div className='bell__dropdown-header'>
                  <span>Notificaciones</span>
                  <span className='bell__dropdown-count'>0</span>
                </div>
                <div className='bell__dropdown-divider' />
                <div className='bell__dropdown-empty'>
                  <span className='material-symbols-rounded'>notifications_off</span>
                  <span>Sin notificaciones</span>
                </div>
              </div>
            )}
          </div>
          <div className='user' ref={userMenuRef}>
            <button
              className='user__trigger'
              onClick={() => setUserMenuOpen(prev => !prev)}
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-user"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" /><path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" /></svg>
            </button>
            {userMenuOpen && (
              <div className='user__dropdown'>
                <button className='user__dropdown-item' onClick={() => { navigate('/auth/profile'); setUserMenuOpen(false) }}>
                  <span className='material-symbols-rounded user__dropdown-icon'>person</span>
                  <span>Mi perfil</span>
                </button>
                <div className='user__dropdown-divider' />
                <button className='user__dropdown-item user__dropdown-item--danger' onClick={handleLogout}>
                  <span className='material-symbols-rounded user__dropdown-icon'>logout</span>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
