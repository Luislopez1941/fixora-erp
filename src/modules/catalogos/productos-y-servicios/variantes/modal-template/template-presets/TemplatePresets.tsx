import React from 'react'
import { TEMPLATE_PRESETS, TemplatePreset } from '../templatePresets'
import './TemplatePresets.css'

/** "Empieza con un ejemplo": tarjetas grandes que llenan la plantilla en un clic. */
const TemplatePresets: React.FC<{ onPick: (p: TemplatePreset) => void }> = ({ onPick }) => (
  <div className='template-presets'>
    <p className='template-presets__title'>¿Qué vendes? Elige un ejemplo para empezar</p>
    <div className='template-presets__grid'>
      {TEMPLATE_PRESETS.map((p) => (
        <button key={p.key} type='button' className={`template-presets__card ${p.key === 'blank' ? 'is-blank' : ''}`} onClick={() => onPick(p)}>
          <span className='material-symbols-rounded' aria-hidden>{p.icon}</span>
          <strong>{p.name}</strong>
          <small>{p.hint}</small>
        </button>
      ))}
    </div>
  </div>
)

export default TemplatePresets
