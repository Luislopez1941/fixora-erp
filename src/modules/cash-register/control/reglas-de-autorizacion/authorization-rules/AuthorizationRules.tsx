import React, { useEffect, useMemo, useState } from 'react'
import IOSSwitch from '../../../../../components/sidebar/sections/catalogos/shared/IOSSwitch'
import SettingRow from '../../../shared/setting-row/SettingRow'
import MoneyInput from '../../../shared/money-input/MoneyInput'
import SaveBar from '../../../shared/save-bar/SaveBar'
import { diffFields } from '../../../shared/useCashControl'
import { money } from '../../../shared/cashFormat'
import './AuthorizationRules.css'

interface Props {
  config: any
  canManage: boolean
  saving: boolean
  onSave: (patch: Record<string, any>) => Promise<boolean>
}

/** Reglas de la sucursal: cierres fuera de tolerancia y egresos grandes. */
const AuthorizationRules: React.FC<Props> = ({ config, canManage, saving, onSave }) => {
  const saved = useMemo(() => ({ requireManagerApproval: !!config?.requireManagerApproval, expenseApprovalAmount: config?.expenseApprovalAmount ?? null }), [config])
  const [draft, setDraft] = useState(saved)
  useEffect(() => setDraft(saved), [saved])
  const changes = diffFields(draft, saved)
  const maxExpense = config?.maxExpenseAmount

  return (
    <section className='cash-ui__card authorization-rules'>
      <h2>Caja de la sucursal</h2>
      <SettingRow
        icon='point_of_sale'
        title='Cierre fuera de tolerancia'
        help={`Si la diferencia del corte rebasa ${money(config?.differenceTolerance ?? 0)} (Reglas de cierre), un supervisor debe autorizarlo al cerrar.`}
      >
        <IOSSwitch checked={draft.requireManagerApproval} onChange={(v) => setDraft((d) => ({ ...d, requireManagerApproval: v }))} disabled={!canManage} ariaLabel='Pedir supervisor en cierres fuera de tolerancia' />
      </SettingRow>
      <SettingRow icon='north_east' title='Egresos mayores a' help='Los gastos y retiros por encima de este monto piden supervisor. Vacío = nunca.'>
        <MoneyInput value={draft.expenseApprovalAmount} onChange={(v) => setDraft((d) => ({ ...d, expenseApprovalAmount: v }))} emptyLabel='Nunca' ariaLabel='Monto de egreso que pide supervisor' disabled={!canManage} />
      </SettingRow>
      {maxExpense != null && draft.expenseApprovalAmount != null && draft.expenseApprovalAmount >= maxExpense ? (
        <p className='authorization-rules__warn'>
          <span className='material-symbols-rounded' aria-hidden>warning</span>
          El egreso máximo por movimiento es {money(maxExpense)} (Límites), así que esta regla nunca se activaría.
        </p>
      ) : null}
      <SaveBar dirty={Object.keys(changes).length > 0} saving={saving} canManage={canManage} onSave={() => onSave(changes)} onDiscard={() => setDraft(saved)} />
    </section>
  )
}

export default AuthorizationRules
