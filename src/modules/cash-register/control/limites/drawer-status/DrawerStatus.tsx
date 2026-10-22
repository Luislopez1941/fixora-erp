import React from 'react'
import { dateTime, money } from '../../../shared/cashFormat'
import './DrawerStatus.css'

interface Drawer {
  shiftId: number
  openedAt: string
  registerName: string | null
  userName: string
  expected: number
  overLimit: boolean
}

/** Efectivo esperado ahora en cada turno abierto contra el máximo en caja. */
const DrawerStatus: React.FC<{ drawers: Drawer[]; max: number | null; onRefresh: () => void }> = ({ drawers, max, onRefresh }) => (
  <section className='cash-ui__card drawer-status'>
    <div className='drawer-status__head'>
      <h2>Cajas ahora</h2>
      <button type='button' onClick={onRefresh} aria-label='Actualizar' title='Actualizar'>
        <span className='material-symbols-rounded'>refresh</span>
      </button>
    </div>
    {!drawers.length ? (
      <p className='drawer-status__empty'>No hay turnos abiertos en esta sucursal.</p>
    ) : (
      <ul>
        {drawers.map((d) => {
          const pct = max ? Math.min(100, Math.round((d.expected / max) * 100)) : 0
          return (
            <li key={d.shiftId} className={d.overLimit ? 'is-over' : ''}>
              <div className='drawer-status__row'>
                <span>
                  <strong>{d.registerName ?? `Turno #${d.shiftId}`}</strong>
                  <small>{d.userName} · desde {dateTime(d.openedAt)}</small>
                </span>
                <b>{money(d.expected)}</b>
              </div>
              {max ? (
                <>
                  <div className='drawer-status__bar' role='progressbar' aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <small className='drawer-status__note'>
                    {d.overLimit ? `Rebasa el máximo por ${money(d.expected - max)}: conviene hacer un retiro.` : `${pct}% del máximo (${money(max)})`}
                  </small>
                </>
              ) : null}
            </li>
          )
        })}
      </ul>
    )}
    {!max ? <p className='drawer-status__empty'>Define el efectivo máximo en caja para ver qué tan llena está cada una.</p> : null}
  </section>
)

export default DrawerStatus
