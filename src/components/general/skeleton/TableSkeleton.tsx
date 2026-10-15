import React from 'react'
import './TableSkeleton.css'

export interface SkeletonCol {
  /** Ancho de la línea (por defecto 70%) */
  width?: string
  /** Círculo + dos líneas (columna de nombre con avatar/ícono) */
  avatar?: boolean
  /** Línea corta con forma de etiqueta */
  pill?: boolean
  /** Botones cuadrados alineados a la derecha (columna de acciones) */
  actions?: number
}

interface Props {
  /** Clase de fila de la tabla: así las columnas del skeleton calzan con las reales */
  rowClassName: string
  cols: SkeletonCol[]
  rows?: number
}

/**
 * Filas "fantasma" con brillo que se desliza (como Facebook / Airbnb) para mostrar
 * dentro de la tabla mientras carga, en lugar de un spinner.
 */
const TableSkeleton: React.FC<Props> = ({ rowClassName, cols, rows = 5 }) => (
  <div className='table-skeleton' role='status' aria-label='Cargando'>
    {Array.from({ length: rows }).map((_, r) => (
      <div className={rowClassName} key={r} aria-hidden>
        {cols.map((col, c) => (
          <div className='table-skeleton__cell' key={c}>
            {col.avatar ? (
              <>
                <span className='table-skeleton__shimmer table-skeleton__avatar' />
                <span className='table-skeleton__stack'>
                  <span className='table-skeleton__shimmer table-skeleton__line' style={{ width: col.width ?? '70%' }} />
                  <span className='table-skeleton__shimmer table-skeleton__line table-skeleton__line--thin' style={{ width: '45%' }} />
                </span>
              </>
            ) : col.actions ? (
              <span className='table-skeleton__actions'>
                {Array.from({ length: col.actions }).map((__, a) => (
                  <span className='table-skeleton__shimmer table-skeleton__btn' key={a} />
                ))}
              </span>
            ) : (
              <span
                className={`table-skeleton__shimmer table-skeleton__line ${col.pill ? 'table-skeleton__line--pill' : ''}`}
                style={{ width: col.width ?? (col.pill ? '60px' : '70%') }}
              />
            )}
          </div>
        ))}
      </div>
    ))}
  </div>
)

export default TableSkeleton
