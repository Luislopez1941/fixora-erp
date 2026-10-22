import React, { useCallback, useEffect, useState } from 'react'
import APIs from '../../../../../services/APIs'
import { showToast } from '../../../../../utils/toast'
import { RESULT_LABEL, dateTime, errorText, money, resultOf } from '../../../shared/cashFormat'
import { downloadClosePdf } from '../closePdf'
import './ModalCloseDetail.css'

interface Props {
  shiftId: number
  /** Desde qué pantalla se abre (para validar el permiso correcto en el servidor) */
  from?: 'differences' | 'authorizations'
  onClose: () => void
}

/** Reporte completo de un corte: esperado vs contado, ventas por forma de pago, movimientos, observaciones y PDF. */
const ModalCloseDetail: React.FC<Props> = ({ shiftId, from, onClose }) => {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    setData(null)
    setError('')
    try {
      const res: any = await APIs.getCashClose(shiftId, from)
      setData(res?.data ?? null)
    } catch (e) {
      setError(errorText(e, 'No se pudo abrir el corte.'))
    }
  }, [shiftId, from])

  useEffect(() => {
    load()
  }, [load])

  const exportPdf = async () => {
    if (!data) return
    setExporting(true)
    try {
      await downloadClosePdf(data)
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo generar el PDF', text: errorText(e, 'Intenta de nuevo.') })
    } finally {
      setExporting(false)
    }
  }

  const res = data ? resultOf({ difference: data.difference ?? 0, tolerance: data.tolerance }) : 'BALANCED'
  const userName = data?.user ? `${data.user.firstName ?? ''} ${data.user.firstLastName ?? ''}`.trim() : ''

  return (
    <div className='cash-ui__overlay' role='dialog' aria-modal='true' onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='cash-ui__modal close-detail'>
        <div className='cash-ui__modal-head'>
          <h2>Corte · Turno #{shiftId}</h2>
          <button type='button' onClick={onClose} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>
        <div className='cash-ui__modal-body'>
          {error ? (
            <div className='cash-ui__error' role='alert'>
              <span className='material-symbols-rounded' aria-hidden>error</span>
              <span>{error}</span>
              <button type='button' onClick={load} aria-label='Reintentar'>
                <span className='material-symbols-rounded'>refresh</span>
              </button>
            </div>
          ) : !data ? (
            <span className='table-skeleton__shimmer cash-ui__skel' />
          ) : (
            <>
              <p className='close-detail__meta'>
                {data.branchName}{data.registerName ? ` · ${data.registerName}` : ''} · Cajero: {userName || '—'}
                <br />Apertura {dateTime(data.openedAt)} · Cierre {data.closedAt ? dateTime(data.closedAt) : 'abierto'}
              </p>
              <div className='close-detail__kpis'>
                <div><small>Esperado</small><strong>{money(data.expectedBalance)}</strong></div>
                <div><small>Contado</small><strong>{data.closingAmount != null ? money(data.closingAmount) : '—'}</strong></div>
                <div className={`cash-ui__diff--${res.toLowerCase()}`}><small>Diferencia · {RESULT_LABEL[res]}</small><strong>{data.difference != null ? money(data.difference) : '—'}</strong></div>
              </div>

              <h3 className='close-detail__title'>Cómo se calcula lo esperado</h3>
              <dl className='close-detail__expected'>
                <div><dt>Fondo inicial</dt><dd>{money(data.openingAmount)}</dd></div>
                <div><dt>+ Ventas en efectivo</dt><dd>{money(data.cashSalesTotal)}</dd></div>
                <div><dt>+ Entradas</dt><dd>{money(data.incomes)}</dd></div>
                <div><dt>− Salidas</dt><dd>{money(data.expenses)}</dd></div>
                <div><dt>− Devoluciones en efectivo</dt><dd>{money(data.cashRefundsTotal)}</dd></div>
                <div className='is-total'><dt>Esperado</dt><dd>{money(data.expectedBalance)}</dd></div>
              </dl>

              <h3 className='close-detail__title'>Ventas por forma de pago · {money(data.salesTotal)}</h3>
              <table className='cash-ui__table'>
                <thead><tr><th>Forma de pago</th><th className='is-num'>Cobros</th><th className='is-num'>Total</th></tr></thead>
                <tbody>
                  {(data.byPaymentMethod ?? []).length ? (
                    data.byPaymentMethod.map((m: any) => (
                      <tr key={m.paymentMethodId}><td>{m.name}</td><td className='is-num'>{m.count}</td><td className='is-num'>{money(m.total)}</td></tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className='close-detail__empty'>Sin cobros en el turno</td></tr>
                  )}
                </tbody>
              </table>

              <h3 className='close-detail__title'>Movimientos de efectivo</h3>
              <table className='cash-ui__table'>
                <thead><tr><th>Concepto</th><th>Tipo</th><th className='is-num'>Importe</th></tr></thead>
                <tbody>
                  {(data.movements ?? []).length ? (
                    data.movements.map((m: any) => (
                      <tr key={m.id}>
                        <td>{m.concept}<small className='close-detail__when'>{dateTime(m.createdAt)}</small></td>
                        <td><em className={`cash-ui__badge ${m.type === 'INCOME' ? 'cash-ui__badge--balanced' : 'cash-ui__badge--short'}`}>{m.type === 'INCOME' ? 'Entrada' : 'Salida'}</em></td>
                        <td className='is-num'>{money(m.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className='close-detail__empty'>Sin entradas ni salidas</td></tr>
                  )}
                </tbody>
              </table>

              {data.closeNotes ? <p className='close-detail__note'><b>Observaciones:</b> {data.closeNotes}</p> : null}
              {data.approvedByName ? <p className='close-detail__note'><b>Autorizó la diferencia:</b> {data.approvedByName}</p> : null}

              <div className='cash-ui__modal-actions'>
                <button type='button' className='btn__general-purple' onClick={exportPdf} disabled={exporting}>
                  <span className='material-symbols-rounded'>picture_as_pdf</span> {exporting ? 'Generando…' : 'Descargar corte (PDF)'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModalCloseDetail
