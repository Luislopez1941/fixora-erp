import React from 'react'
import './CatalogFilters.css'

export interface CatalogFilterValues {
  code: string
  name: string
  familyId: number
  inStock: boolean
}

interface Props {
  values: CatalogFilterValues
  families: { id: number; title: string }[]
  onChange: (patch: Partial<CatalogFilterValues>) => void
  /** Buscar ya (Enter o el botón) */
  onSearch: () => void
  searching: boolean
}

/** Filtros del catálogo: código, nombre, familia y "solo con existencia". Escribir busca solo; Enter busca al momento. */
const CatalogFilters: React.FC<Props> = ({ values, families, onChange, onSearch, searching }) => {
  const enter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSearch()
    }
  }
  return (
    <div className='catalog-filters'>
      <label className='catalog-filters__field'>
        <span>Código</span>
        <span className='catalog-filters__input'>
          <span className='material-symbols-rounded' aria-hidden>barcode_scanner</span>
          <input value={values.code} onChange={(e) => onChange({ code: e.target.value })} onKeyDown={enter} placeholder='Código o código de barras' />
        </span>
      </label>
      <label className='catalog-filters__field catalog-filters__field--wide'>
        <span>Nombre</span>
        <span className='catalog-filters__input'>
          <span className='material-symbols-rounded' aria-hidden>search</span>
          <input value={values.name} onChange={(e) => onChange({ name: e.target.value })} onKeyDown={enter} placeholder='Nombre del artículo' />
        </span>
      </label>
      <label className='catalog-filters__field'>
        <span>Familia</span>
        <select value={values.familyId} onChange={(e) => onChange({ familyId: Number(e.target.value) })}>
          <option value={0}>Todas</option>
          {families.map((f) => (
            <option key={f.id} value={f.id}>{f.title}</option>
          ))}
        </select>
      </label>
      <button
        type='button'
        role='switch'
        aria-checked={values.inStock}
        className={`catalog-filters__stock ${values.inStock ? 'is-on' : ''}`}
        onClick={() => onChange({ inStock: !values.inStock })}
      >
        <span className='catalog-filters__track' aria-hidden />
        Solo con existencia
      </button>
      <button type='button' className='catalog-filters__search' onClick={onSearch} disabled={searching}>
        <span className='material-symbols-rounded' aria-hidden>search</span>
        Buscar
      </button>
    </div>
  )
}

export default CatalogFilters
