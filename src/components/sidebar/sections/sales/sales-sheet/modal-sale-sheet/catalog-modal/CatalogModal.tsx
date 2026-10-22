import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import CatalogView from '../../pos-catalog/catalog-view/CatalogView'
import { CatalogItem } from '../../pos-catalog/catalog-card/CatalogCard'
import './CatalogModal.css'

interface Props {
  companyId: number | null | undefined
  branchId: number | null | undefined
  /** Agrega el artículo a la ficha con su flujo normal (variantes, medidas…) */
  onAdd: (item: CatalogItem) => Promise<void>
  onClose: () => void
}

/** El catálogo del punto de venta como modal grande encima de la ficha: se agregan artículos sin salir de la venta. */
const CatalogModal: React.FC<Props> = ({ companyId, branchId, onAdd, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Esc cierra el catálogo (no la ficha); si hay un selector de variante o medidas abierto, ese se cierra primero
      if (e.key === 'Escape' && !document.querySelector('.variant-picker, .measure-form')) {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [onClose])

  return createPortal(
    <div className='pos-catalog-modal' role='dialog' aria-modal='true' aria-label='Catálogo' onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='pos-catalog-modal__panel'>
        <header className='pos-catalog-modal__head'>
          <div>
            <h2>Catálogo</h2>
            <small>Agrega artículos a la ficha; el catálogo sigue abierto para agregar más.</small>
          </div>
          <button type='button' className='pos-catalog-modal__close' onClick={onClose} aria-label='Cerrar catálogo'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </header>
        <div className='pos-catalog-modal__body'>
          <CatalogView companyId={companyId} branchId={branchId} onAdd={onAdd} compact />
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default CatalogModal
