import React, { useCallback, useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import APIs from '../../../../../services/APIs'
import { useCan } from '../../../../../core/permissions/useCan'
import { showToast } from '../../../../../utils/toast'
import { RESULT_LABEL, dateTime, errorText, money, resultOf } from '../../../shared/cashFormat'
import { denomLabel } from '../denominations'
import { downloadCashCountPdf } from '../cashCountPdf'
import './ModalCashCountDetail.css'

interface Props {
  id: number
  onClose: () => void
  /** Se llamó al cancelar el arqueo (para refrescar el historial) */
  onChanged: () => void
}

/** Detalle de un arqueo: resumen, desglose por denominación, PDF y cancelación (supervisor, con motivo). */
const ModalCashCountDetail: React.FC<Props> = ({ id, onClose, onChanged }) => {
  const can = useCan()
  const canManage = can('cash-register.cortes-y-arqueos-arqueo.manage')
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    setData(null)
    setError('')
    try {
      const res: any = await APIs.getCashCount(id)
      setData(res?.data ?? null)
    } catch (e) {
      setError(errorText(e, 'No se pudo abrir el arqueo.'))
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const cancel = async () => {
    const r = await Swal.fire({
      title: `Cancelar arqueo #${id}`,
      input: 'text',
      inputLabel: 'Motivo de la cancelación',
      inputPlaceholder: 'Ej. se contó la caja equivocada',
      showCancelButton: true,
      confirmButtonText: 'Cancelar arqueo',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#d64545',
      inputValidator: (v) => (!v?.trim() ? 'Escribe el motivo.' : undefined),
    })
    if (!r.isConfirmed) return
    try {
      const res: any = await APIs.cancelCashCount(id, String(r.value).trim())
      setData(res?.data ?? null)
      showToast({ type: 'info', title: 'Arqueo cancelado', text: `Arqueo #${id}` })
      onChanged()
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo cancelar', text: errorText(e, 'Intenta de nuevo.') })
    }
  }

  const exportPdf = async () => {
    if (!data) return
    setExporting(true)
    try {
      await downloadCashCountPdf(data)
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo generar el PDF', text: errorText(e, 'Intenta de nuevo.') })
    } finally {
      setExporting(false)
    }
  }

  const res = data ? resultOf(data) : 'BALANCED'

  return (
    <div className='cash-ui__overlay' role='dialog' aria-modal='true' onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='cash-ui__modal'>
        <div className='cash-ui__modal-head'>
          <h2>Arqueo #{id}</h2>
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
              {data.status === 'CANCELLED' ? (
                <p className='cash-count-detail__cancelled'>Cancelado{data.cancelledByName ? ` por ${data.cancelledByName}` : ''}: {data.cancelReason}</p>
              ) : null}
              <p className='cash-count-detail__meta'>
                {dateTime(data.createdAt)} · {data.branchName}{data.registerName ? ` · ${data.registerName}` : ''} · Turno #{data.shiftId}
                <br />Contó: {data.userName || '—'} · Responsable del turno: {data.shiftUserName || '—'}
              </p>
              <div className='cash-count-detail__kpis'>
                <div><small>Esperado</small><strong>{money(data.expectedAmount)}</strong></div>
                <div><small>Contado</small><strong>{money(data.countedAmount)}</strong></div>
                <div className={`cash-ui__diff--${res.toLowerCase()}`}><small>Diferencia · {RESULT_LABEL[res]}</small><strong>{money(data.difference)}</strong></div>
              </div>
              <table className='cash-ui__table'>
                <thead><tr><th>Denominación</th><th className='is-num'>Cantidad</th><th className='is-num'>Importe</th></tr></thead>
                <tbody>
                  {(data.lines ?? []).map((l: any) => (
                    <tr key={`${l.kind}-${l.denomination}`}>
                      <td>{l.kind === 'BILL' ? 'Billete' : 'Moneda'} {denomLabel(l.denomination)}</td>
                      <td className='is-num'>{l.quantity}</td>
                      <td className='is-num'>{money(l.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.notes ? <p className='cash-count-detail__note'><b>Observaciones:</b> {data.notes}</p> : null}
              {data.otherValues ? <p className='cash-count-detail__note'><b>Otros valores:</b> {data.otherValues}</p> : null}
              <div className='cash-ui__modal-actions'>
                {canManage && data.status !== 'CANCELLED' ? (
                  <button type='button' className='cash-count-detail__danger' onClick={cancel}>Cancelar arqueo</button>
                ) : null}
                <button type='button' className='btn__general-purple' onClick={exportPdf} disabled={exporting}>
                  <span className='material-symbols-rounded'>picture_as_pdf</span> {exporting ? 'Generando…' : 'PDF'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModalCashCountDetail
