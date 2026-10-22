import React, { useEffect, useMemo, useState } from 'react'
import IOSSwitch from '../../../../../components/sidebar/sections/catalogos/shared/IOSSwitch'
import SettingRow from '../../../shared/setting-row/SettingRow'
import MoneyInput from '../../../shared/money-input/MoneyInput'
import SaveBar from '../../../shared/save-bar/SaveBar'
import { diffFields } from '../../../shared/useCashControl'
import './FundSettings.css'

interface Props {
  config: any
  canManage: boolean
  saving: boolean
  onSave: (patch: Record<string, any>) => Promise<boolean>
}

/** Fondo predeterminado de la sucursal y si el cajero puede cambiarlo al abrir. */
const FundSettings: React.FC<Props> = ({ config, canManage, saving, onSave }) => {
  const saved = useMemo(() => ({ defaultOpeningAmount: config?.defaultOpeningAmount ?? 0, lockOpeningAmount: !!config?.lockOpeningAmount }), [config])
  const [draft, setDraft] = useState(saved)
  useEffect(() => setDraft(saved), [saved])
  const changes = diffFields(draft, saved)

  return (
    <section className='cash-ui__card fund-settings'>
      <h2>Sucursal</h2>
      <SettingRow icon='account_balance_wallet' title='Fondo predeterminado' help='Se propone al abrir un turno en cualquier caja que no tenga fondo propio.'>
        <MoneyInput value={draft.defaultOpeningAmount} onChange={(v) => setDraft((d) => ({ ...d, defaultOpeningAmount: v ?? 0 }))} ariaLabel='Fondo predeterminado' disabled={!canManage} />
      </SettingRow>
      <SettingRow icon='lock' title='Fondo fijo' help='Encendido: el turno se abre exactamente con el fondo configurado y el cajero no puede cambiarlo.'>
        <IOSSwitch checked={draft.lockOpeningAmount} onChange={(v) => setDraft((d) => ({ ...d, lockOpeningAmount: v }))} disabled={!canManage} ariaLabel='Fondo fijo' />
      </SettingRow>
      <SaveBar dirty={Object.keys(changes).length > 0} saving={saving} canManage={canManage} onSave={() => onSave(changes)} onDiscard={() => setDraft(saved)} />
    </section>
  )
}

export default FundSettings
