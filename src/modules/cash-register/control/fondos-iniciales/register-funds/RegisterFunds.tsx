import React from 'react'
import { money } from '../../../shared/cashFormat'
import './RegisterFunds.css'

const TYPE_LABEL: Record<string, string> = { MAIN: 'Principal', EXPRESS: 'Rápida', SELF_SERVICE: 'Autoservicio', MOBILE: 'Móvil' }

interface Props {
  registers: { id: number; name: string; type: string; active: boolean; openingAmount: number | null }[]
  branchFund: number
  canManage: boolean
  onEdit: (r: any) => void
}

/** Fondo de cada caja: el suyo propio o el de la sucursal. */
const RegisterFunds: React.FC<Props> = ({ registers, branchFund, canManage, onEdit }) => (
  <section className='cash-ui__card register-funds'>
    <h2>Por caja</h2>
    {!registers.length ? (
      <p className='register-funds__empty'>Esta sucursal no tiene cajas registradas: todos los turnos usan el fondo de la sucursal.</p>
    ) : (
      <ul>
        {registers.map((r) => (
          <li key={r.id} className={r.active ? '' : 'is-inactive'}>
            <span className='register-funds__name'>
              <strong>{r.name}</strong>
              <small>{TYPE_LABEL[r.type] ?? r.type}{r.active ? '' : ' · inactiva'}</small>
            </span>
            <span className='register-funds__amount'>
              <b>{money(r.openingAmount ?? branchFund)}</b>
              <small>{r.openingAmount == null ? 'De la sucursal' : 'Propio'}</small>
            </span>
            {canManage ? (
              <button type='button' onClick={() => onEdit(r)} aria-label={`Cambiar fondo de ${r.name}`} title='Cambiar fondo'>
                <span className='material-symbols-rounded'>edit</span>
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    )}
  </section>
)

export default RegisterFunds
