import React from 'react'
import CategoriesStorePicker from '../../../../../components/sidebar/sections/catalogos/categories/CategoriesStorePicker'
import '../../../../../components/general/skeleton/TableSkeleton.css'
// Kit visual común de las pantallas operativas (encabezado, indicadores, lista con tarjetas en móvil, modal)
import '../../../../cash-register/shared/CashShared.css'
import './StockPage.css'

interface Props {
  title: string
  subtitle: string
  canView: boolean
  branchId: number
  onBranchChange: (id: number) => void
  onCompanyChange?: (id: number) => void
  /** Solo empresa (sin sucursal) */
  companyOnly?: boolean
  children: React.ReactNode
}

/** Marco de las pantallas de Almacén › Existencias: título, empresa/sucursal y permiso. */
const StockPage: React.FC<Props> = ({ title, subtitle, canView, branchId, onBranchChange, onCompanyChange, companyOnly, children }) => {
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
    <div className='cash-ui stock-page'>
      <div className='cash-ui__container'>
        <div className='cash-ui__header'>
          <div className='cash-ui__title'>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <CategoriesStorePicker
            branchId={branchId}
            companyOnly={companyOnly}
            onCompanyIdChange={onCompanyChange}
            onBranchIdChange={(id) => {
              onBranchChange(id)
              localStorage.setItem('categories-store-id', String(id))
              localStorage.setItem('categories-picker-branch-id', String(id))
            }}
          />
        </div>
        {children}
      </div>
    </div>
  )
}

export default StockPage
