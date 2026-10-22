import React, { useState } from 'react'
import APIs from '../../../../../services/APIs'
import { showToast } from '../../../../../utils/toast'
import { errorText } from '../../shared/stockFormat'
import './ModalStockLevels.css'

interface Props {
  item: { id: number; name: string; min: number | null; max: number | null }
  onClose: () => void
  onSaved: () => void
}

const toInt = (v: string) => (v.trim() === '' ? null : Math.max(0, Math.floor(Number(v))))

/** Cambia el mínimo (alerta de stock bajo) y el máximo de un artículo. Aplican en todos los almacenes. */
const ModalStockLevels: React.FC<Props> = ({ item, onClose, onSaved }) => {
  const [min, setMin] = useState(item.min != null ? String(item.min) : '')
  const [max, setMax] = useState(item.max != null ? String(item.max) : '')
  const [saving, setSaving] = useState(false)
  const minN = toInt(min)
  const maxN = toInt(max)
  const invalid = (min !== '' && Number.isNaN(minN)) || (max !== '' && Number.isNaN(maxN)) || (minN != null && maxN != null && maxN < minN)

  const save = async () => {
    setSaving(true)
    try {
      await APIs.updateStockLevels(item.id, { minStockAlert: minN, maxStock: maxN })
      showToast({ type: 'success', title: 'Mínimo y máximo guardados', text: item.name })
      onSaved()
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo guardar', text: errorText(e, 'Intenta de nuevo.') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='cash-ui__overlay stock-levels-modal__overlay' role='dialog' aria-modal='true' onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='cash-ui__modal stock-levels-modal'>
        <div className='cash-ui__modal-head'>
          <h2>Mínimo y máximo</h2>
          <button type='button' onClick={onClose} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>
        <div className='cash-ui__modal-body'>
          <p className='stock-levels-modal__name'>{item.name}</p>
          <div className='stock-levels-modal__grid'>
            <label>
              <span>Mínimo</span>
              <input className='inputs__general' type='number' min={0} step={1} inputMode='numeric' value={min} onChange={(e) => setMin(e.target.value)} placeholder='5' />
              <small>Abajo de este número se marca "stock bajo". Vacío = 5.</small>
            </label>
            <label>
              <span>Máximo</span>
              <input className='inputs__general' type='number' min={0} step={1} inputMode='numeric' value={max} onChange={(e) => setMax(e.target.value)} placeholder='Sin máximo' />
              <small>Arriba se marca "sobre máximo". Vacío = sin máximo.</small>
            </label>
          </div>
          {minN != null && maxN != null && maxN < minN ? <p className='stock-levels-modal__error'>El máximo no puede ser menor que el mínimo.</p> : null}
          <p className='stock-levels-modal__note'>
            <span className='material-symbols-rounded' aria-hidden>info</span>
            Son del artículo: aplican en todos los almacenes y sucursales.
          </p>
          <div className='cash-ui__modal-actions'>
            <button type='button' className='btn__general-secondary' onClick={onClose}>Cancelar</button>
            <button type='button' className='btn__general-purple' onClick={save} disabled={saving || invalid}>{saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalStockLevels
