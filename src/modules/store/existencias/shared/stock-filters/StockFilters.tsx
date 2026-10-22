import React from 'react'
import './StockFilters.css'

interface Props {
  search: string
  onSearch: (v: string) => void
  placeholder?: string
  categories?: { id: number; title: string }[]
  categoryId?: number
  onCategory?: (id: number) => void
  statuses: { key: string; label: string; count?: number }[]
  status: string
  onStatus: (key: string) => void
  /** Filtros propios de la pantalla (almacén, fechas…) */
  children?: React.ReactNode
  /** Botones a la derecha (exportar…) */
  actions?: React.ReactNode
}

/** Barra de filtros de existencias: búsqueda, categoría, filtros propios y estados como chips. */
const StockFilters: React.FC<Props> = ({ search, onSearch, placeholder, categories, categoryId, onCategory, statuses, status, onStatus, children, actions }) => (
  <div className='stock-filters'>
    <div className='stock-filters__row'>
      <label className='stock-filters__search'>
        <span className='material-symbols-rounded' aria-hidden>search</span>
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder ?? 'Buscar por nombre, código o código de barras'} aria-label='Buscar' />
        {search ? (
          <button type='button' onClick={() => onSearch('')} aria-label='Limpiar búsqueda'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        ) : null}
      </label>
      {categories && onCategory ? (
        <select className='inputs__general stock-filters__select' value={categoryId ?? 0} onChange={(e) => onCategory(Number(e.target.value))} aria-label='Categoría'>
          <option value={0}>Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      ) : null}
      {children}
      {actions ? <div className='stock-filters__actions'>{actions}</div> : null}
    </div>
    <div className='stock-filters__chips' role='tablist' aria-label='Estado'>
      {statuses.map((s) => (
        <button key={s.key} type='button' role='tab' aria-selected={status === s.key} className={`cash-ui__chip ${status === s.key ? 'is-active' : ''}`} onClick={() => onStatus(s.key)}>
          {s.label}
          {s.count != null ? <b>{s.count}</b> : null}
        </button>
      ))}
    </div>
  </div>
)

export default StockFilters
