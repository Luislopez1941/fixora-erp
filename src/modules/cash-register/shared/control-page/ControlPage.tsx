import React from 'react'
import CategoriesStorePicker from '../../../../components/sidebar/sections/catalogos/categories/CategoriesStorePicker'
import '../../../../components/general/skeleton/TableSkeleton.css'
import '../CashShared.css'
import './ControlPage.css'

interface Props {
  title: string
  subtitle: string
  canView: boolean
  branchId: number
  onBranchChange: (id: number) => void
  loading: boolean
  error?: string
  onRetry?: () => void
  /** Botones a la derecha de la barra (opcional) */
  actions?: React.ReactNode
  children: React.ReactNode
}

/** Marco común de las pantallas de Caja › Control: encabezado, sucursal, permiso, error y skeleton. */
const ControlPage: React.FC<Props> = ({ title, subtitle, canView, branchId, onBranchChange, loading, error, onRetry, actions, children }) => {
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

  return (
    <div className='cash-ui'>
      <div className='cash-ui__container'>
        <div className='cash-ui__header'>
          <div className='cash-ui__title'>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <CategoriesStorePicker
            branchId={branchId}
            onBranchIdChange={(id) => {
              onBranchChange(id)
              localStorage.setItem('categories-store-id', String(id))
              localStorage.setItem('categories-picker-branch-id', String(id))
            }}
          />
        </div>

        {actions ? <div className='cash-ui__filters control-page__actions'>{actions}</div> : null}

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
            <p>Elige una sucursal para ver su configuración.</p>
          </div>
        ) : loading ? (
          <div className='control-page__skeleton'>
            <span className='table-skeleton__shimmer' />
            <span className='table-skeleton__shimmer' />
          </div>
        ) : (
          <div className='control-page__body'>{children}</div>
        )}
      </div>
    </div>
  )
}

export default ControlPage
