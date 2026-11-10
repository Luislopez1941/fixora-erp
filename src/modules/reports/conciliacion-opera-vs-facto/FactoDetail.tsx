import React from 'react'
import { folioGroups, operaTotals, serialToText, type FactoResult } from './reconcile'
import { FACTO_STATUS } from './exportCsv'

const money = (n: number) => Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${money(Math.abs(n))}`

const Icon: React.FC<{ name: string }> = ({ name }) => <span className='material-symbols-rounded' aria-hidden>{name}</span>

const Line: React.FC<{ label: string; children: React.ReactNode; mono?: boolean }> = ({ label, children, mono }) =>
  children ? (
    <div className='conciliacion__d-line'>
      <dt>{label}</dt>
      <dd className={mono ? 'is-mono' : ''}>{children}</dd>
    </div>
  ) : null

const VERDICT_ICON: Record<string, string> = {
  conciliada: 'check_circle', diferencia: 'rule', ambigua: 'help', 'sin-opera': 'search_off',
  'sin-reserva': 'storefront', 'fuera-periodo': 'event_busy', pago: 'payments', cancelada: 'block',
}

interface Props { r: FactoResult; tolerance: number }

/** Detalle de una factura: qué pasó, Facto contra OPERA lado a lado y las filas de OPERA que se usaron. */
const FactoDetail: React.FC<Props> = ({ r, tolerance }) => {
  const f = r.facto
  const st = FACTO_STATUS[r.status]
  const groups = folioGroups(r.opera)
  const tot = operaTotals(r.opera)
  const near = (a: number, b: number) => Math.abs(a - b) < 0.005
  // Con qué total de OPERA se comparó (para que se lea con precisión qué se está restando)
  const comparedLabel = near(r.operaTotal, tot.pago) ? 'Pago total' : near(r.operaTotal, tot.pagado) ? 'Total pagado' : near(r.operaTotal, tot.ingresos) ? 'Ingresos' : 'Suma de folios'
  const factoLabel = f.totalPagado && near(r.factoAmount, f.totalPagado) ? 'Total pagado' : 'Total CFDI'
  const folios = groups.map((g) => g.folio).join(' + ')
  const diffAbs = Math.abs(r.diff)
  const paidVsCfdi = f.totalPagado && f.total ? Math.round((f.totalPagado - f.total) * 100) / 100 : 0
  const repeatedFolios = groups.filter((g) => g.rows.length > 1)

  let headline = st.label
  let detail = ''
  if (r.status === 'conciliada') {
    headline = 'Cruza con OPERA'
    detail = `Folio ${folios}. ${diffAbs < 0.005 ? 'Los montos son iguales.' : `Diferencia de ${money(diffAbs)}, dentro de la tolerancia de ${money(tolerance)}.`}`
  } else if (r.status === 'diferencia') {
    headline = 'Cruza con OPERA, pero los montos no coinciden'
    detail = `Facto ${money(r.factoAmount)} contra OPERA ${money(r.operaTotal)}: ${r.diff > 0 ? 'Facto es mayor' : 'OPERA es mayor'} por ${money(diffAbs)}.`
  } else if (r.status === 'ambigua') {
    headline = 'Hay varias filas posibles en OPERA'
    detail = 'No se pudo elegir una sola por monto. Revisa los candidatos de abajo.'
  } else if (r.status === 'sin-opera') {
    headline = 'No se encontró en OPERA'
    detail = `Tiene reserva ${f.reserva || '—'} pero ninguna fila de OPERA la respalda.`
  } else if (r.status === 'sin-reserva') {
    headline = 'Consumo sin reserva'
    detail = 'Normalmente es de restaurante o bar y no pasa por OPERA.'
  }

  return (
    <div className='conciliacion__d'>
      <div className={`conciliacion__d-verdict conciliacion__d-verdict--${st.tone}`}>
        <Icon name={VERDICT_ICON[r.status] ?? 'info'} />
        <div>
          <strong>{headline}</strong>
          {detail ? <span>{detail}</span> : null}
        </div>
      </div>

      {f.checks.map((c, i) => <div key={`c${i}`} className='conciliacion__callout conciliacion__callout--danger'><Icon name='receipt_long' />{c}</div>)}
      {Math.abs(paidVsCfdi) > tolerance ? (
        <div className='conciliacion__callout conciliacion__callout--info'>
          <Icon name='payments' />El total pagado ({money(f.totalPagado)}) es {money(Math.abs(paidVsCfdi))} {paidVsCfdi > 0 ? 'mayor' : 'menor'} que el total del CFDI ({money(f.total)}).
        </div>
      ) : null}
      {tot.cxc > tolerance ? (
        <div className='conciliacion__callout conciliacion__callout--info'>
          <Icon name='account_balance_wallet' />Parte de la cuenta quedó por cobrar (CXC): {money(tot.cxc)} de {money(tot.ingresos)} en ingresos.
        </div>
      ) : null}
      {tot.ingresos > 0 && f.totalPagado === f.total && Math.abs(tot.ingresos - f.total) > tolerance ? (
        <div className='conciliacion__callout conciliacion__callout--info'>
          <Icon name='compare_arrows' />OPERA registra ingresos por {money(tot.ingresos)} y la factura (CFDI) es por {money(f.total)}: {money(Math.abs(tot.ingresos - f.total))} de diferencia.
        </div>
      ) : null}
      {repeatedFolios.map((g) => (
        <div key={g.folio} className='conciliacion__callout conciliacion__callout--info'>
          <Icon name='content_copy' />El folio {g.folio} viene en {g.rows.length} filas de OPERA (por ejemplo, una con los ingresos y otra con el pago); se cuenta una sola vez como {money(g.amount)}.
        </div>
      ))}
      {r.notes.map((n, i) => <div key={`n${i}`} className='conciliacion__callout conciliacion__callout--info'><Icon name='info' />{n}</div>)}

      <div className='conciliacion__d-compare'>
        <section>
          <h4>Factura en Facto</h4>
          <dl>
            <Line label='Factura'>{f.serieFolio}</Line>
            <Line label='Fecha'>{f.fecha ? serialToText(f.fecha) : ''}</Line>
            <Line label='Centro de consumo'>{f.centro}</Line>
            <Line label='Huésped'>{[f.huesped, f.habitacion ? `hab. ${f.habitacion}` : ''].filter(Boolean).join(' · ')}</Line>
            <Line label='Reserva' mono>{f.reserva}</Line>
            <Line label='Forma de pago'>{f.formaPago}</Line>
            <Line label='Receptor'>{[f.rfcReceptor, f.receptor].filter(Boolean).join(' · ')}</Line>
            {f.subtotal ? <Line label='Subtotal + impuestos'>{`${money(f.subtotal)} + ${money(f.impuestos)}`}</Line> : null}
            {f.total !== f.totalPagado ? <Line label='Total CFDI'>{money(f.total)}</Line> : null}
          </dl>
          <div className='conciliacion__d-total'>
            <span>{factoLabel}</span>
            <strong>{money(r.factoAmount)}</strong>
          </div>
        </section>

        <div className={`conciliacion__d-diff ${r.opera.length && diffAbs > tolerance ? 'is-bad' : ''}`} aria-hidden={!r.opera.length}>
          {r.opera.length ? (
            <>
              <small>Diferencia</small>
              <strong>{diffAbs < 0.005 ? '$0.00' : signed(r.diff)}</strong>
            </>
          ) : null}
        </div>

        <section>
          <h4>Registro en OPERA</h4>
          {groups.length ? (
            <>
              <dl>
                <Line label='Confirmación' mono>{r.confirmacion}</Line>
                <Line label={groups.length > 1 ? 'Folios' : 'Folio'} mono>{folios}</Line>
                <Line label='Habitación'>{[...new Set(r.opera.map((o) => o.habitacion).filter(Boolean))].join(', ')}</Line>
                <Line label='Fecha'>{r.opera[0]?.fecha ? serialToText(r.opera[0].fecha) : ''}</Line>
                <Line label='Cajero'>{[...new Set(r.opera.map((o) => o.cashier).filter(Boolean))].join(', ')}</Line>
                <Line label='Ingresos (consumo)'>{money(tot.ingresos)}</Line>
                <Line label='Pago total'>{money(tot.pago)}</Line>
                {tot.pagado && !near(tot.pagado, tot.pago) ? <Line label='Total pagado'>{money(tot.pagado)}</Line> : null}
                {tot.cxc ? <Line label='Por cobrar (CXC)'>{money(tot.cxc)}</Line> : null}
              </dl>
              <div className='conciliacion__d-total'>
                <span>Se compara: {comparedLabel}</span>
                <strong>{money(r.operaTotal)}</strong>
              </div>
            </>
          ) : (
            <p className='conciliacion__d-none'>Sin filas de OPERA vinculadas.</p>
          )}
        </section>
      </div>

      {r.opera.length ? (
        <table className='conciliacion__d-rows'>
          <thead>
            <tr><th>Fila</th><th>Folio</th><th>Hab.</th><th className='is-num'>Ingresos</th><th className='is-num'>Pago</th><th className='is-num'>Pagado</th><th className='is-num'>CXC</th><th>Cajero</th></tr>
          </thead>
          <tbody>
            {r.opera.map((o) => (
              <tr key={o.key}>
                <td>{o.excelRow}</td>
                <td className='is-mono'>{o.folioOpera}</td>
                <td>{o.habitacion}</td>
                <td className='is-num'>{o.totalIngresos ? money(o.totalIngresos) : '—'}</td>
                <td className='is-num'>{o.totalPago ? money(o.totalPago) : '—'}</td>
                <td className='is-num'>{o.totalPagado ? money(o.totalPagado) : '—'}</td>
                <td className='is-num'>{o.cxc ? money(o.cxc) : '—'}</td>
                <td>{o.cashier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {r.candidates.length ? (
        <table className='conciliacion__d-rows'>
          <caption>Candidatos en OPERA</caption>
          <thead>
            <tr><th>Fila</th><th>Folio</th><th>Hab.</th><th className='is-num'>Ingresos</th><th className='is-num'>Pago</th><th>Info</th></tr>
          </thead>
          <tbody>
            {r.candidates.map((o) => (
              <tr key={o.key}>
                <td>{o.excelRow}</td>
                <td className='is-mono'>{o.folioOpera}</td>
                <td>{o.habitacion}</td>
                <td className='is-num'>{money(o.totalIngresos)}</td>
                <td className='is-num'>{money(o.totalPago)}</td>
                <td>{o.info}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <p className='conciliacion__d-tech'>
        <span>UUID <code>{f.uuid || '—'}</code></span>
        <span>ID único <code>{f.idUnico || '—'}</code></span>
        <span>Fila Excel {f.excelRow}</span>
        {r.method ? <span>Cruce: {r.method}</span> : null}
      </p>
    </div>
  )
}

export default FactoDetail
