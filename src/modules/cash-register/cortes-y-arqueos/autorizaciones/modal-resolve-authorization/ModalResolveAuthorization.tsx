import React, { useState } from 'react'
import APIs from '../../../../../services/APIs'
import { useCan } from '../../../../../core/permissions/useCan'
import { showToast } from '../../../../../utils/toast'
import { dateTime, errorText, money } from '../../../shared/cashFormat'
import { STATUS_BADGE, STATUS_LABEL, TYPE_LABEL, isResolvable } from '../authorizationLabels'
import './ModalResolveAuthorization.css'

interface Props {
  item: any
  onClose: () => void
  /** Después de autorizar o rechazar (recarga la bandeja) */
  onResolved: () => void
  /** Abre el detalle del cierre o del arqueo */
  onOpenSource: (item: any) => void
}

/** Contexto de una solicitud y, si está pendiente y el usuario es supervisor, autorizar o rechazar (rechazo con motivo). */
const ModalResolveAuthorization: React.FC<Props> = ({ item, onClose, onResolved, onOpenSource }) => {
  const can = useCan()
  const canManage = can('cash-register.cortes-y-arqueos-autorizaciones.manage')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState<'' | 'AUTHORIZED' | 'REJECTED'>('')
  const [error, setError] = useState('')
  const pending = item.status === 'PENDING'

  const resolve = async (decision: 'AUTHORIZED' | 'REJECTED') => {
    if (decision === 'REJECTED' && !comment.trim()) {
      setError('Escribe el motivo del rechazo.')
      return
    }
    setSaving(decision)
    setError('')
    try {
      await APIs.resolveCashAuthorization({ refType: item.type, refId: item.refId, decision, comment: comment.trim() || undefined })
      showToast({
        type: decision === 'AUTHORIZED' ? 'success' : 'info',
        title: decision === 'AUTHORIZED' ? 'Diferencia autorizada' : 'Diferencia rechazada',
        text: `${TYPE_LABEL[item.type]} #${item.refId}`,
        details: [{ label: 'Diferencia', value: money(item.amount), strong: true }],
      })
      onResolved()
      onClose()
    } catch (e) {
      setError(errorText(e, 'No se pudo registrar la resolución.'))
    } finally {
      setSaving('')
    }
  }

  return (
    <div className='cash-ui__overlay' role='dialog' aria-modal='true' onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='cash-ui__modal resolve-auth'>
        <div className='cash-ui__modal-head'>
          <h2>{TYPE_LABEL[item.type] ?? item.type} #{item.refId}</h2>
          <button type='button' onClick={onClose} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>
        <div className='cash-ui__modal-body'>
          <div className='resolve-auth__status'>
            <em className={`cash-ui__badge ${STATUS_BADGE[item.status] ?? ''}`}>{STATUS_LABEL[item.status] ?? item.status}</em>
            {item.resolvedAt && !pending ? <span>{dateTime(item.resolvedAt)}{item.supervisorName ? ` · ${item.supervisorName}` : ''}</span> : null}
          </div>

          <dl className='resolve-auth__facts'>
            <div><dt>Fecha</dt><dd>{dateTime(item.at)}</dd></div>
            <div><dt>Sucursal / caja</dt><dd>{item.branchName}{item.registerName ? ` · ${item.registerName}` : ''}</dd></div>
            <div><dt>Solicitante</dt><dd>{item.requesterName || '—'}</dd></div>
            {item.shiftId ? <div><dt>Turno</dt><dd>#{item.shiftId}</dd></div> : null}
            <div><dt>{item.type === 'RETURN' ? 'Importe devuelto' : 'Diferencia'}</dt><dd className={item.amount < 0 ? 'is-short' : 'is-over'}>{money(item.amount)}</dd></div>
            {isResolvable(item.type) ? <div><dt>Tolerancia</dt><dd>{money(item.tolerance)}</dd></div> : null}
          </dl>
          {item.notes ? <p className='resolve-auth__note'><b>Observaciones del cajero:</b> {item.notes}</p> : null}
          {item.comment ? <p className='resolve-auth__note'><b>{item.status === 'REJECTED' ? 'Motivo del rechazo' : 'Comentario'}:</b> {item.comment}</p> : null}

          {pending && isResolvable(item.type) ? (
            canManage ? (
              <>
                <label className='resolve-auth__field'>
                  <span>Comentario (obligatorio si rechazas)</span>
                  <textarea className='inputs__general' rows={3} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} placeholder='Ej. se verificó el faltante con el cajero' />
                </label>
                {error ? <p className='resolve-auth__error'>{error}</p> : null}
              </>
            ) : (
              <p className='resolve-auth__hint'>Solo un supervisor con permiso puede autorizar o rechazar.</p>
            )
          ) : null}

          <div className='cash-ui__modal-actions'>
            {item.type !== 'RETURN' ? (
              <button type='button' className='resolve-auth__link' onClick={() => onOpenSource(item)}>
                <span className='material-symbols-rounded'>open_in_new</span> Ver {item.type === 'CLOSE' ? 'corte' : 'arqueo'}
              </button>
            ) : null}
            {pending && isResolvable(item.type) && canManage ? (
              <>
                <button type='button' className='resolve-auth__reject' onClick={() => resolve('REJECTED')} disabled={!!saving}>
                  {saving === 'REJECTED' ? 'Rechazando…' : 'Rechazar'}
                </button>
                <button type='button' className='resolve-auth__approve' onClick={() => resolve('AUTHORIZED')} disabled={!!saving}>
                  {saving === 'AUTHORIZED' ? 'Autorizando…' : 'Autorizar'}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalResolveAuthorization
