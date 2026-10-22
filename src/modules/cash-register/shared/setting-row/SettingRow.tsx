import React from 'react'
import './SettingRow.css'

interface Props {
  icon?: string
  title: string
  help?: React.ReactNode
  children: React.ReactNode
}

/** Renglón de configuración: título y explicación a la izquierda, control (switch / monto) a la derecha. En celular se apila. */
const SettingRow: React.FC<Props> = ({ icon, title, help, children }) => (
  <div className='setting-row'>
    {icon ? <span className='material-symbols-rounded setting-row__icon' aria-hidden>{icon}</span> : null}
    <div className='setting-row__text'>
      <strong>{title}</strong>
      {help ? <small>{help}</small> : null}
    </div>
    <div className='setting-row__control'>{children}</div>
  </div>
)

export default SettingRow
