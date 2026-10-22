import React from 'react'
import './SaveBar.css'

interface Props {
  dirty: boolean
  saving: boolean
  canManage: boolean
  onSave: () => void
  onDiscard: () => void
}

/** Pie de los formularios de Control: aviso de cambios sin guardar + Descartar / Guardar. */
const SaveBar: React.FC<Props> = ({ dirty, saving, canManage, onSave, onDiscard }) => {
  if (!canManage) return <p className='save-bar__readonly'>Solo lectura: no tienes permiso para cambiar esta configuración.</p>
  return (
    <div className={`save-bar ${dirty ? 'is-dirty' : ''}`}>
      <span>{dirty ? 'Tienes cambios sin guardar' : 'Todo guardado'}</span>
      <div>
        <button type='button' className='btn__general-secondary' onClick={onDiscard} disabled={!dirty || saving}>Descartar</button>
        <button type='button' className='btn__general-purple' onClick={onSave} disabled={!dirty || saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

export default SaveBar
