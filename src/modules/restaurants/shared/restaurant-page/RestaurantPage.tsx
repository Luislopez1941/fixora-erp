import React from 'react'
import CategoriesStorePicker from '../../../../components/sidebar/sections/catalogos/categories/CategoriesStorePicker'
import '../../../../components/general/skeleton/TableSkeleton.css'
import '../../../cash-register/shared/CashShared.css'
import '../restaurants.css'
import './RestaurantPage.css'

interface Props {
  title: string
  subtitle: string
  canView: boolean
  branchId: number
  onBranchChange: (id: number) => void
  loading: boolean
  error?: string
  onRetry?: () => void
  /** Filtros o botones bajo el encabezado */
  toolbar?: React.ReactNode
  /** Sin título ni descripción visibles (el selector de sucursal pasa a la barra de filtros): ahorra espacio en vistas de uso diario */
  compact?: boolean
  children: React.ReactNode
}

/** Marco de las pantallas de Restaurantes (fuera del POS): encabezado, sucursal, permiso, error y carga. */
const RestaurantPage: React.FC<Props> = ({ title, subtitle, canView, branchId, onBranchChange, loading, error, onRetry, toolbar, compact, children }) => {
  if (!canView) {
    return (
      <div className='cash-ui'>
        <div className='cash-ui__state'>
          <span className='material-symbols-rounded' aria-hidden>lock</span>
          <p>No tienes permiso para ver {title.toLowerCase()}.</p>
        </div>
      </div>
    )
  }
  const picker = (
    <CategoriesStorePicker
      branchId={branchId}
      onBranchIdChange={(id) => {
        onBranchChange(id)
        localStorage.setItem('categories-store-id', String(id))
        localStorage.setItem('categories-picker-branch-id', String(id))
      }}
    />
  )
  return (
    <div className='cash-ui rest-ui'>
      <div className='cash-ui__container'>
        {compact ? (
          <div className='restaurant-page__toolbar restaurant-page__toolbar--compact'>
            <h1 className='restaurant-page__sr'>{title}</h1>
            {toolbar}
            <div className='restaurant-page__branch'>{picker}</div>
          </div>
        ) : (
          <>
            <div className='cash-ui__header'>
              <div className='cash-ui__title'>
                <h1>{title}</h1>
                <p>{subtitle}</p>
              </div>
              {picker}
            </div>
            {toolbar ? <div className='restaurant-page__toolbar'>{toolbar}</div> : null}
          </>
        )}
        {error ? (
          <div className='cash-ui__error' role='alert'>
            <span className='material-symbols-rounded' aria-hidden>error</span>
            <span>{error}</span>
            {onRetry ? (
              <button type='button' onClick={onRetry} aria-label='Reintentar'>
                <span className='material-symbols-rounded'>refresh</span>
              </button>
            ) : null}
          </div>
        ) : null}
        {!(branchId > 0) ? (
          <div className='cash-ui__state'>
            <span className='material-symbols-rounded' aria-hidden>store</span>
            <p>Elige una sucursal.</p>
          </div>
        ) : loading ? (
          <div className='restaurant-page__skeleton'>
            <span className='table-skeleton__shimmer' />
            <span className='table-skeleton__shimmer' />
            <span className='table-skeleton__shimmer' />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export default RestaurantPage
