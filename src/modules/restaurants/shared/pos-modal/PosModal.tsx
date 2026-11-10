import React, { useEffect } from 'react'
import '../../../cash-register/shared/CashShared.css'
import '../restaurants.css'
import './PosModal.css'

interface Props {
  title: string
  onClose: () => void
  children: React.ReactNode
  /** Botones de abajo (Cancelar / Confirmar) */
  actions?: React.ReactNode
  wide?: boolean
}

/** Ventana de los módulos de restaurante: el mismo marco que las de Caja (cerrar con Esc o tocando fuera). */
const PosModal: React.FC<Props> = ({ title, onClose, children, actions, wide }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className='cash-ui__overlay' role='dialog' aria-modal='true' aria-label={title} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`cash-ui__modal pos-modal rest-ui ${wide ? 'is-wide' : ''}`}>
        <div className='cash-ui__modal-head'>
          <h2>{title}</h2>
          <button type='button' onClick={onClose} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>
        <div className='cash-ui__modal-body pos-modal__body'>
          {children}
          {actions ? <div className='cash-ui__modal-actions'>{actions}</div> : null}
        </div>
      </div>
    </div>
  )
}

export default PosModal
