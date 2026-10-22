import React, { useEffect, useState } from 'react'
import APIs from '../../../../../services/APIs'
import { showToast } from '../../../../../utils/toast'
import SettingRow from '../../../shared/setting-row/SettingRow'
import MoneyInput from '../../../shared/money-input/MoneyInput'
import SaveBar from '../../../shared/save-bar/SaveBar'
import { errorText } from '../../../shared/cashFormat'
import './ReturnRules.css'

interface Props {
  companyId: number
  returns: { windowDays: number; supervisorAmount: number | null }
  canManage: boolean
}

/** Reglas de devoluciones (de la empresa, las mismas de Ventas › Configuración). */
const ReturnRules: React.FC<Props> = ({ companyId, returns, canManage }) => {
  const [saved, setSaved] = useState(returns)
  const [draft, setDraft] = useState(returns)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    setSaved(returns)
    setDraft(returns)
  }, [returns])
  const dirty = draft.windowDays !== saved.windowDays || (draft.supervisorAmount ?? null) !== (saved.supervisorAmount ?? null)

  const save = async () => {
    setSaving(true)
    try {
      await APIs.updateSaleReturnConfig(companyId, { returnWindowDays: draft.windowDays, returnSupervisorAmount: draft.supervisorAmount })
      setSaved(draft)
      showToast({ type: 'success', title: 'Reglas de devolución guardadas' })
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo guardar', text: errorText(e, 'Intenta de nuevo.') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className='cash-ui__card return-rules'>
      <h2>Devoluciones <small>toda la empresa</small></h2>
      <SettingRow icon='assignment_return' title='Devoluciones mayores a' help='Por encima de este monto solo la puede hacer alguien con el permiso de autorizar devoluciones. Vacío = nunca.'>
        <MoneyInput value={draft.supervisorAmount} onChange={(v) => setDraft((d) => ({ ...d, supervisorAmount: v }))} emptyLabel='Nunca' ariaLabel='Monto de devolución que pide supervisor' disabled={!canManage} />
      </SettingRow>
      <SettingRow icon='event_busy' title='Fuera de plazo' help='Pasados estos días desde la venta, solo la puede hacer alguien con el permiso de autorizar devoluciones.'>
        <MoneyInput value={draft.windowDays} onChange={(v) => setDraft((d) => ({ ...d, windowDays: Math.max(0, Math.round(v ?? 0)) }))} suffix='días' step={1} ariaLabel='Plazo de devolución en días' disabled={!canManage} />
      </SettingRow>
      <SaveBar dirty={dirty} saving={saving} canManage={canManage} onSave={save} onDiscard={() => setDraft(saved)} />
    </section>
  )
}

export default ReturnRules
