import React from 'react'
import './ComingSoon.css'

interface Props {
  title: string
  module: string
  group: string | null
  message?: string
  /** Solo para el dueño: dónde crear el archivo y qué permiso usa la pantalla. */
  developerHint?: { folder: string; permission: string }
}

/** Marcador de una pantalla que ya está en el menú pero todavía no tiene su archivo. */
const ComingSoon: React.FC<Props> = ({ title, module, group, message, developerHint }) => (
  <div className='soon'>
    <div className='soon__card'>
      <p className='soon__crumb'>
        {module}
        {group ? ` › ${group}` : ''}
      </p>
      <span className='soon__icon material-symbols-rounded' aria-hidden>construction</span>
      <h2>{title}</h2>
      <p>{message ?? 'Esta pantalla todavía está en construcción. Pronto estará disponible.'}</p>
      {developerHint && (
        <div className='soon__hint'>
          <strong>Para crearla</strong>
          <span>Archivo: <code>{developerHint.folder}</code></span>
          <span>Permiso: <code>{developerHint.permission}</code></span>
        </div>
      )}
    </div>
  </div>
)

export default ComingSoon
