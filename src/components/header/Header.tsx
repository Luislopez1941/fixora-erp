import React from 'react'
import { useLocation } from 'react-router-dom'
import './Header.css'
import astra from '../../assets/astra.svg'

const ROUTE_LABELS: Record<string, string> = {
  catalogos: 'Catálogo',
  areas: 'SubÁreas',
  types: 'Áreas',
  familias: 'Familias',
  contenedores: 'Contenedores',
  units: 'Unidades',
  services: 'Servicios',
  articles: 'Artículos',
  'price-ranges': 'Rangos de Precio',
  sales: 'Ventas',
  cobranza: 'Cobranza',
  shopping: 'Compras',
  production: 'Producción',
  store: 'Almacén',
  reports: 'Reportes',
  income: 'Ingresos',
  users: 'Usuarios',
  configurations: 'Configuraciones',
  dashboard: 'Panel',
  'module-store': 'Tienda de Módulos',
}

const HeaderBreadcrumb: React.FC = () => {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  // Skip 'auth' segment
  const meaningful = segments.filter((s) => s !== 'auth')
  if (meaningful.length === 0) return null

  return (
    <nav className='header-breadcrumb'>
      {meaningful.map((seg, idx) => {
        const label = ROUTE_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1)
        return (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <span className='header-breadcrumb__sep'>
                <span className='material-symbols-rounded' style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>chevron_right</span>
              </span>
            )}
            <span className='header-breadcrumb__item'>{label}</span>
          </React.Fragment>
        )
      })}
    </nav>
  )
}

const Header: React.FC = () => {
  return (
    <div className='hero'>
      <div className='hero__container'>
        <div className='hero__left'>
          <div className="astra_logo">
            <a href="#" className="logo__wrapper">
              <img src={astra} alt="Logo" className="logo-small" />
              <span className="hide">
                Astra
              </span>
            </a>
          </div>
          <HeaderBreadcrumb />
        </div>
        <div className='row__one'>
          <div className='sale'>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M120-160q-33 0-56.5-23.5T40-240v-400q0-17 11.5-28.5T80-680q17 0 28.5 11.5T120-640v400h640q17 0 28.5 11.5T800-200q0 17-11.5 28.5T760-160H120Zm160-160q-33 0-56.5-23.5T200-400v-320q0-33 23.5-56.5T280-800h560q33 0 56.5 23.5T920-720v320q0 33-23.5 56.5T840-320H280Zm80-80q0-33-23.5-56.5T280-480v80h80Zm400 0h80v-80q-33 0-56.5 23.5T760-400Zm-200-40q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM280-640q33 0 56.5-23.5T360-720h-80v80Zm560 0v-80h-80q0 33 23.5 56.5T840-640Z" /></svg>
          </div>
          <div className='bell'>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-bell"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14.235 19c.865 0 1.322 1.024 .745 1.668a3.992 3.992 0 0 1 -2.98 1.332a3.992 3.992 0 0 1 -2.98 -1.332c-.552 -.616 -.158 -1.579 .634 -1.661l.11 -.006h4.471z" /><path d="M12 2c1.358 0 2.506 .903 2.875 2.141l.046 .171l.008 .043a8.013 8.013 0 0 1 4.024 6.069l.028 .287l.019 .289v2.931l.021 .136a3 3 0 0 0 1.143 1.847l.167 .117l.162 .099c.86 .487 .56 1.766 -.377 1.864l-.116 .006h-16c-1.028 0 -1.387 -1.364 -.493 -1.87a3 3 0 0 0 1.472 -2.063l.021 -.143l.001 -2.97a8 8 0 0 1 3.821 -6.454l.248 -.146l.01 -.043a3.003 3.003 0 0 1 2.562 -2.29l.182 -.017l.176 -.004z" /></svg>
          </div>
          <div className='user'>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-user"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" /><path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" /></svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
