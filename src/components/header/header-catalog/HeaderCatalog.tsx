import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { modal } from '../../../redux/state/modals'
import { useCan } from '../../../core/permissions/useCan'
import CatalogModal from '../../sidebar/sections/sales/sales-sheet/modal-sale-sheet/catalog-modal/CatalogModal'
import { addToSheet } from '../../sidebar/sections/sales/sales-sheet/modal-sale-sheet/sheetBridge'
import './HeaderCatalog.css'

const SHEET_PATH = '/auth/sales/sales-sheet'

const readId = (key: string): number | undefined => {
  const id = Number(localStorage.getItem(key))
  return !Number.isNaN(id) && id > 0 ? id : undefined
}

/**
 * Ícono del encabezado que abre el catálogo de artículos desde cualquier pantalla. "Agregar a la ficha" lleva el artículo
 * a la ficha de cobro: si no estás en Terminal POS te lleva ahí y abre la ficha (o usa la que ya está abierta).
 */
const HeaderCatalog: React.FC = () => {
  const can = useCan()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const dispatch = useDispatch()
  const [open, setOpen] = useState(false)

  if (!can('sales.sheet.view')) return null

  const add = async (item: { id: number; name: string }) => {
    addToSheet({ id: item.id, name: item.name, notify: true })
    if (!pathname.startsWith(SHEET_PATH)) navigate(SHEET_PATH)
    dispatch(modal('sales-sheet_modal'))
  }

  return (
    <>
      <button
        type='button'
        className={`header-catalog ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(true)}
        title='Catálogo de artículos'
        aria-label='Catálogo de artículos'
      >
        <span className='material-symbols-rounded' aria-hidden>grid_view</span>
      </button>
      {open ? (
        <CatalogModal
          companyId={readId('categories-picker-company-id')}
          branchId={readId('categories-store-id')}
          onAdd={add}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}

export default HeaderCatalog
