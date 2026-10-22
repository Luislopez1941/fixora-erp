import React from 'react'
import IOSSwitch from '../../../../../components/sidebar/sections/catalogos/shared/IOSSwitch'
import { denomLabel } from '../../../shared/denominations'
import './DenominationGroup.css'

export interface DenominationItem {
  kind: 'BILL' | 'COIN'
  value: number
  active: boolean
  usedQuantity: number
}

interface Props {
  title: string
  icon: string
  items: DenominationItem[]
  canManage: boolean
  busy: string
  onToggle: (d: DenominationItem) => void
  onRemove: (d: DenominationItem) => void
}

/** Billetes o monedas: cada uno con su uso en arqueos de los últimos 90 días y si está activo. */
const DenominationGroup: React.FC<Props> = ({ title, icon, items, canManage, busy, onToggle, onRemove }) => (
  <section className='cash-ui__card denomination-group'>
    <h2>
      {title} <small>{items.filter((d) => d.active).length} de {items.length} activas</small>
    </h2>
    {!items.length ? (
      <p className='denomination-group__empty'>Sin {title.toLowerCase()}.</p>
    ) : (
      <ul>
        {items.map((d) => {
          const key = `${d.kind}:${d.value}`
          return (
            <li key={key} className={`${d.active ? '' : 'is-off'} ${busy === key ? 'is-busy' : ''}`}>
              <span className={`denomination-group__chip denomination-group__chip--${d.kind.toLowerCase()}`}>
                <span className='material-symbols-rounded' aria-hidden>{icon}</span>
                {denomLabel(d.value)}
              </span>
              <small>{d.usedQuantity ? `${d.usedQuantity.toLocaleString('es-MX')} contadas en 90 días` : 'Sin uso reciente'}</small>
              {canManage ? (
                <div className='denomination-group__actions'>
                  <IOSSwitch checked={d.active} onChange={() => onToggle(d)} disabled={!!busy} ariaLabel={`${d.active ? 'Desactivar' : 'Activar'} ${denomLabel(d.value)}`} />
                  <button type='button' onClick={() => onRemove(d)} disabled={!!busy} aria-label={`Eliminar ${denomLabel(d.value)}`} title='Eliminar'>
                    <span className='material-symbols-rounded'>delete</span>
                  </button>
                </div>
              ) : (
                <em className={`cash-ui__badge ${d.active ? 'cash-ui__badge--balanced' : 'cash-ui__badge--cancelled'}`}>{d.active ? 'Activa' : 'Inactiva'}</em>
              )}
            </li>
          )
        })}
      </ul>
    )}
  </section>
)

export default DenominationGroup
