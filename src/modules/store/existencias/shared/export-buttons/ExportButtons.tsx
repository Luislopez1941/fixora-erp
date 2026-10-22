import React, { useState } from 'react'
import { showToast } from '../../../../../utils/toast'
import { errorText } from '../stockFormat'
import './ExportButtons.css'

interface Props {
  onCsv: () => Promise<void>
  onPdf?: () => Promise<void>
  disabled?: boolean
}

/** Botones de exportar (CSV y PDF) con estado de "generando". */
const ExportButtons: React.FC<Props> = ({ onCsv, onPdf, disabled }) => {
  const [busy, setBusy] = useState<'' | 'csv' | 'pdf'>('')
  const run = async (kind: 'csv' | 'pdf', fn: () => Promise<void>) => {
    setBusy(kind)
    try {
      await fn()
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo exportar', text: errorText(e, 'Intenta de nuevo.') })
    } finally {
      setBusy('')
    }
  }
  return (
    <div className='export-buttons'>
      <button type='button' className='btn__general-secondary' onClick={() => run('csv', onCsv)} disabled={disabled || !!busy}>
        <span className='material-symbols-rounded'>{busy === 'csv' ? 'hourglass_top' : 'table_view'}</span> CSV
      </button>
      {onPdf ? (
        <button type='button' className='btn__general-secondary' onClick={() => run('pdf', onPdf)} disabled={disabled || !!busy}>
          <span className='material-symbols-rounded'>{busy === 'pdf' ? 'hourglass_top' : 'picture_as_pdf'}</span> PDF
        </button>
      ) : null}
    </div>
  )
}

export default ExportButtons
