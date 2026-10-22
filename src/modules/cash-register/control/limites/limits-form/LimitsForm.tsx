import React, { useEffect, useMemo, useState } from 'react'
import SettingRow from '../../../shared/setting-row/SettingRow'
import MoneyInput from '../../../shared/money-input/MoneyInput'
import SaveBar from '../../../shared/save-bar/SaveBar'
import { diffFields } from '../../../shared/useCashControl'
import './LimitsForm.css'

interface Props {
  config: any
  canManage: boolean
  saving: boolean
  onSave: (patch: Record<string, any>) => Promise<boolean>
}

const pick = (c: any) => ({
  maxCashInDrawer: c?.maxCashInDrawer ?? null,
  maxExpenseAmount: c?.maxExpenseAmount ?? null,
  maxIncomeAmount: c?.maxIncomeAmount ?? null,
  maxParallelShifts: c?.maxParallelShifts ?? 1,
})

/** Formulario de límites de la sucursal. */
const LimitsForm: React.FC<Props> = ({ config, canManage, saving, onSave }) => {
  const saved = useMemo(() => pick(config), [config])
  const [draft, setDraft] = useState(saved)
  useEffect(() => setDraft(saved), [saved])
  const changes = diffFields(draft, saved)
  const dirty = Object.keys(changes).length > 0
  const set = (k: keyof typeof draft) => (v: number | null) => setDraft((d) => ({ ...d, [k]: v }))

  return (
    <section className='cash-ui__card limits-form'>
      <h2>Topes</h2>
      <SettingRow icon='savings' title='Efectivo máximo en caja' help='Cuando el efectivo esperado de un turno lo rebasa, se marca en rojo para hacer un retiro.'>
        <MoneyInput value={draft.maxCashInDrawer} onChange={set('maxCashInDrawer')} emptyLabel='Sin límite' ariaLabel='Efectivo máximo en caja' disabled={!canManage} />
      </SettingRow>
      <SettingRow icon='north_east' title='Egreso máximo por movimiento' help='No se puede registrar un egreso (gasto o retiro) mayor a este monto.'>
        <MoneyInput value={draft.maxExpenseAmount} onChange={set('maxExpenseAmount')} emptyLabel='Sin límite' ariaLabel='Egreso máximo' disabled={!canManage} />
      </SettingRow>
      <SettingRow icon='south_west' title='Ingreso máximo por movimiento' help='No se puede registrar un ingreso de efectivo mayor a este monto.'>
        <MoneyInput value={draft.maxIncomeAmount} onChange={set('maxIncomeAmount')} emptyLabel='Sin límite' ariaLabel='Ingreso máximo' disabled={!canManage} />
      </SettingRow>
      <SettingRow icon='stacks' title='Turnos abiertos a la vez' help='Solo aplica en sucursales sin cajas registradas; con cajas, cada caja admite un turno.'>
        <MoneyInput value={draft.maxParallelShifts} onChange={(v) => set('maxParallelShifts')(Math.max(1, Math.round(v ?? 1)))} suffix='turnos' step={1} ariaLabel='Turnos abiertos a la vez' disabled={!canManage} />
      </SettingRow>
      <SaveBar dirty={dirty} saving={saving} canManage={canManage} onSave={() => onSave(changes)} onDiscard={() => setDraft(saved)} />
    </section>
  )
}

export default LimitsForm
