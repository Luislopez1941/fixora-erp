import React from 'react'
import './CatalogPager.css'

interface Props {
  page: number
  pageSize: number
  shown: number
  hasMore: boolean
  total: number
  totalCapped: boolean
  loading: boolean
  onPage: (page: number) => void
}

/** Anterior / Siguiente con la página y cuántos artículos hay (aprox. si son más de mil). */
const CatalogPager: React.FC<Props> = ({ page, pageSize, shown, hasMore, total, totalCapped, loading, onPage }) => {
  const from = shown ? (page - 1) * pageSize + 1 : 0
  const to = (page - 1) * pageSize + shown
  return (
    <nav className='catalog-pager' aria-label='Páginas del catálogo'>
      <button type='button' className='catalog-pager__btn' onClick={() => onPage(page - 1)} disabled={page <= 1 || loading}>
        <span className='material-symbols-rounded' aria-hidden>chevron_left</span>
        Anterior
      </button>
      <span className='catalog-pager__info'>
        <strong>Página {page}</strong>
        <small>
          {shown ? `${from}–${to} de ${totalCapped ? 'más de 1,000' : total.toLocaleString('es-MX')}` : 'Sin artículos'}
        </small>
      </span>
      <button type='button' className='catalog-pager__btn' onClick={() => onPage(page + 1)} disabled={!hasMore || loading}>
        Siguiente
        <span className='material-symbols-rounded' aria-hidden>chevron_right</span>
      </button>
    </nav>
  )
}

export default CatalogPager
