import React, { useState } from 'react'
import MoneyInput from '../../../shared/money-input/MoneyInput'
import { money } from '../../../shared/cashFormat'
import './ClosingSimulator.css'

type Outcome = { tone: 'ok' | 'warn' | 'block' | 'approval'; icon: string; title: string; text: string }

/** Lo mismo que decide el servidor al cerrar (CashService.closeShift), con las reglas guardadas. */
export const closingOutcome = (config: any, expected: number, counted: number): Outcome => {
  const diff = Math.round((counted - expected) * 100) / 100
  const tol = Number(config?.differenceTolerance ?? 0)
  if (Math.abs(diff) < 0.01) return { tone: 'ok', icon: 'check_circle', title: 'Cuadra', text: 'El turno se cierra sin diferencia.' }
  const kind = diff < 0 ? 'faltante' : 'sobrante'
  if (Math.abs(diff) <= tol) return { tone: 'ok', icon: 'check_circle', title: `Se cierra con ${kind} de ${money(Math.abs(diff))}`, text: `Está dentro de la tolerancia (${money(tol)}).` }
  if (config?.requireManagerApproval) {
    return { tone: 'approval', icon: 'verified_user', title: 'Pide supervisor', text: `El ${kind} de ${money(Math.abs(diff))} rebasa la tolerancia: un supervisor debe autorizar con su usuario y contraseña.` }
  }
  if (diff < 0 && !config?.allowNegativeBalance) {
    return { tone: 'block', icon: 'block', title: 'No se puede cerrar', text: `El faltante de ${money(Math.abs(diff))} rebasa la tolerancia y la sucursal no permite cerrar con faltante.` }
  }
  return { tone: 'warn', icon: 'warning', title: `Se cierra con ${kind} de ${money(Math.abs(diff))}`, text: 'Queda registrado fuera de tolerancia y aparece en Diferencias y en Autorizaciones.' }
}

/** Prueba las reglas guardadas con un monto esperado y uno contado. */
const ClosingSimulator: React.FC<{ config: any }> = ({ config }) => {
  const [expected, setExpected] = useState(1500)
  const [counted, setCounted] = useState(1480)
  const o = closingOutcome(config, expected, counted)

  return (
    <section className='cash-ui__card closing-simulator'>
      <h2>Simulador</h2>
      <div className='closing-simulator__inputs'>
        <div>
          <span>Esperado</span>
          <MoneyInput value={expected} onChange={(v) => setExpected(v ?? 0)} ariaLabel='Efectivo esperado' />
        </div>
        <div>
          <span>Contado</span>
          <MoneyInput value={counted} onChange={(v) => setCounted(v ?? 0)} ariaLabel='Efectivo contado' />
        </div>
      </div>
      <div className={`closing-simulator__result is-${o.tone}`} aria-live='polite'>
        <span className='material-symbols-rounded' aria-hidden>{o.icon}</span>
        <div>
          <strong>{o.title}</strong>
          <small>{o.text}</small>
        </div>
      </div>
      <p className='closing-simulator__note'>Usa las reglas guardadas; guarda los cambios para simular con los nuevos valores.</p>
    </section>
  )
}

export default ClosingSimulator
