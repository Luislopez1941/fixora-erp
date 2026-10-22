import React from 'react'
import { dateTime } from '../../../shared/cashFormat'
import './AssignmentHistory.css'

interface Props {
  rows: { id: number; action: string; summary: string; createdAt: string; userName?: string }[]
}

const ICON: Record<string, string> = {
  CASH_ASSIGNMENT_CREATE: 'person_add',
  CASH_ASSIGNMENT_UPDATE: 'edit',
  CASH_ASSIGNMENT_DELETE: 'person_remove',
}

/** Últimos cambios de asignaciones de la sucursal (quién y cuándo). */
const AssignmentHistory: React.FC<Props> = ({ rows }) => {
  if (!rows.length) return <p className='assignment-history__empty'>Todavía no hay cambios registrados.</p>
  return (
    <ul className='assignment-history'>
      {rows.map((r) => (
        <li key={r.id}>
          <span className='material-symbols-rounded' aria-hidden>{ICON[r.action] ?? 'history'}</span>
          <div>
            <p>{r.summary}</p>
            <small>{dateTime(r.createdAt)}{r.userName ? ` · ${r.userName}` : ''}</small>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default AssignmentHistory
