import React from 'react'
import { dateTime, money } from '../../../shared/cashFormat'
import './OpeningHistory.css'

interface Props {
  recent: { shiftId: number; openedAt: string; status: string; openingAmount: number; registerId: number | null; registerName: string | null; userName: string }[]
  fundOf: (registerId: number | null) => number
  locked: boolean
}

/** Últimas aperturas y si se abrieron con un fondo distinto al configurado hoy. */
const OpeningHistory: React.FC<Props> = ({ recent, fundOf, locked }) => (
  <section className='cash-ui__card opening-history'>
    <h2>Últimas aperturas</h2>
    {!recent.length ? (
      <p className='opening-history__empty'>Aún no se han abierto turnos en esta sucursal.</p>
    ) : (
      <ul>
        {recent.map((s) => {
          const fund = fundOf(s.registerId)
          const differs = Math.abs(s.openingAmount - fund) > 0.005
          return (
            <li key={s.shiftId}>
              <span>
                <strong>{s.registerName ?? 'Sin caja'} · {s.userName}</strong>
                <small>{dateTime(s.openedAt)}{s.status === 'OPEN' ? ' · abierto' : ''}</small>
              </span>
              <span className='opening-history__amount'>
                <b>{money(s.openingAmount)}</b>
                {differs ? <em className='cash-ui__badge cash-ui__badge--over'>Fondo actual {money(fund)}</em> : null}
              </span>
            </li>
          )
        })}
      </ul>
    )}
    <p className='opening-history__note'>
      {locked ? 'Con fondo fijo, los turnos nuevos siempre abren con el fondo configurado.' : 'El cajero puede cambiar el fondo al abrir; aquí ves cuándo lo hizo.'}
    </p>
  </section>
)

export default OpeningHistory
