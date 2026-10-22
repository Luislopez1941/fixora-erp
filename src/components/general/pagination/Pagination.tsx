import React from 'react'
import './Pagination.css'

interface Props {
  /** Total de registros (ya filtrados) */
  total: number
  /** Página actual, desde 1 */
  page: number
  pageSize: number
  onPage: (page: number) => void
  /** Nombre de lo que se pagina, en plural ("artículos") */
  noun?: string
}

/** Números a mostrar: primera, última, la actual y sus vecinas; los huecos van como puntos suspensivos. */
const pagesToShow = (page: number, pages: number): (number | '…')[] => {
  const set = new Set([1, 2, pages - 1, pages, page - 1, page, page + 1])
  const list = Array.from(set).filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)
  const out: (number | '…')[] = []
  list.forEach((n, i) => {
    if (i > 0 && n - list[i - 1] > 1) out.push('…')
    out.push(n)
  })
  return out
}

/** Paginador de las listas en filas: cuadritos con los números de página centrados y el rango visible debajo. */
const Pagination: React.FC<Props> = ({ total, page, pageSize, onPage, noun = 'registros' }) => {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pages)
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(total, current * pageSize)

  return (
    <nav className='pager' aria-label='Paginación'>
      {pages > 1 && (
        <div className='pager__controls'>
          <button type='button' className='pager__btn' disabled={current === 1} onClick={() => onPage(current - 1)} aria-label='Página anterior'>
            <span className='material-symbols-rounded'>chevron_left</span>
          </button>
          {pagesToShow(current, pages).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className='pager__gap pager__num'>…</span>
            ) : (
              <button key={p} type='button' className={`pager__btn pager__num ${p === current ? 'is-current' : ''}`} onClick={() => onPage(p)} aria-current={p === current ? 'page' : undefined}>
                {p}
              </button>
            ),
          )}
          {/* En celular los números se cambian por "Página X de Y" (cabe en una línea) */}
          <span className='pager__compact' aria-live='polite'>
            Página <strong>{current}</strong> de <strong>{pages}</strong>
          </span>
          <button type='button' className='pager__btn' disabled={current === pages} onClick={() => onPage(current + 1)} aria-label='Página siguiente'>
            <span className='material-symbols-rounded'>chevron_right</span>
          </button>
        </div>
      )}
      <span className='pager__info'>
        Mostrando <strong>{from}–{to}</strong> de <strong>{total}</strong> {noun}
      </span>
    </nav>
  )
}

export default Pagination
