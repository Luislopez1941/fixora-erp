import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import APIs from '../../../../../services/APIs'
import { useCan } from '../../../../../core/permissions/useCan'

/**
 * Reglas de devolución de la empresa: hasta cuántos días se puede devolver sin autorización y, opcionalmente, el monto a
 * partir del cual hace falta un supervisor (permiso "Autorizar fuera de plazo o monto alto"). Se guardan por separado
 * del resto de la configuración del cobro.
 */
const ReturnRulesPanel: React.FC<{ companyId: number }> = ({ companyId }) => {
  const can = useCan()
  const [days, setDays] = useState('30')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const canEdit = can('sales.config.view')

  useEffect(() => {
    if (!companyId) return
    let alive = true
    APIs.getSaleReturnConfig(companyId)
      .then((res: any) => {
        if (!alive) return
        setDays(String(res?.returnWindowDays ?? 30))
        setAmount(res?.returnSupervisorAmount != null ? String(res.returnSupervisorAmount) : '')
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [companyId])

  const save = async () => {
    setSaving(true)
    try {
      await APIs.updateSaleReturnConfig(companyId, {
        returnWindowDays: Math.max(0, Math.floor(Number(days) || 0)),
        returnSupervisorAmount: amount.trim() === '' ? null : Math.max(0, Number(amount) || 0),
      })
      Swal.fire({ icon: 'success', title: 'Reglas de devolución guardadas', timer: 1400, showConfirmButton: false })
    } catch (e: any) {
      const message = e?.response?.data?.message
      Swal.fire('Error', (Array.isArray(message) ? message.join(', ') : message) || 'No se pudo guardar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className='pos-config__panel'>
      <h3 className='pos-config__panel-title'>
        <span className='material-symbols-rounded' aria-hidden>assignment_return</span>
        Devoluciones
      </h3>
      <div className='pos-config__row'>
        <div className='pos-config__row-text'>
          <strong>Plazo para devolver (días)</strong>
          <span>Pasado este plazo, solo quien tenga el permiso de autorización puede registrar la devolución.</span>
        </div>
        <input className='inputs__general' style={{ width: 110 }} inputMode='numeric' value={days} disabled={!canEdit}
          onChange={(e) => /^\d{0,4}$/.test(e.target.value) && setDays(e.target.value)} aria-label='Plazo en días' />
      </div>
      <div className='pos-config__row'>
        <div className='pos-config__row-text'>
          <strong>Monto que pide autorización</strong>
          <span>Devoluciones mayores a este monto necesitan a un supervisor. Déjalo vacío para no poner tope.</span>
        </div>
        <input className='inputs__general' style={{ width: 130 }} inputMode='decimal' value={amount} placeholder='Sin tope' disabled={!canEdit}
          onChange={(e) => /^\d{0,9}\.?\d{0,2}$/.test(e.target.value) && setAmount(e.target.value)} aria-label='Monto con autorización' />
      </div>
      {canEdit ? (
        <div className='pos-config__row' style={{ justifyContent: 'flex-end' }}>
          <button type='button' className='btn__general-primary' onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar reglas de devolución'}
          </button>
        </div>
      ) : null}
    </section>
  )
}

export default ReturnRulesPanel
