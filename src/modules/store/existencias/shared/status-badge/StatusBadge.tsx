import React from 'react'
import { STATUS } from '../stockFormat'
import './StatusBadge.css'

/** Etiqueta de estado de existencia (disponible, stock bajo, agotado…). */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = STATUS[status] ?? { label: status, tone: 'muted' as const }
  return <em className={`stock-status stock-status--${s.tone}`}>{s.label}</em>
}

export default StatusBadge
