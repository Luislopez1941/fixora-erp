import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../../../cash-register/shared/CashShared.css'
import { POS_PATH } from '../cuentas-abiertas/CuentasAbiertas'

/** Dividir, unir y cobrar con varias formas de pago se hace dentro de la cuenta, en el POS. */
const DividirCuenta: React.FC = () => {
  const navigate = useNavigate()
  return (
    <div className='cash-ui'>
      <div className='cash-ui__state'>
        <span className='material-symbols-rounded' aria-hidden>call_split</span>
        <p>Dividir y unir cuentas, y cobrar con varias formas de pago, se hace dentro de cada cuenta en el POS de restaurante.</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Abre la mesa → <b>Dividir</b> (por platillo o por comensal) o <b>Unir</b>. Al <b>Cobrar</b>, agrega otra forma de pago para pagos mixtos.
        </p>
        <button type='button' className='btn__general-purple' onClick={() => navigate(POS_PATH)}>
          Ir al POS de restaurante
        </button>
      </div>
    </div>
  )
}

export default DividirCuenta
