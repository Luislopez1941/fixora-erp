import React, { useEffect, useMemo, useState } from 'react'
import IOSSwitch from '../../../../../components/sidebar/sections/catalogos/shared/IOSSwitch'
import SettingRow from '../../../shared/setting-row/SettingRow'
import MoneyInput from '../../../shared/money-input/MoneyInput'
import SaveBar from '../../../shared/save-bar/SaveBar'
import { diffFields } from '../../../shared/useCashControl'
import './ClosingRulesForm.css'

interface Props {
  config: any
  canManage: boolean
  saving: boolean
  onSave: (patch: Record<string, any>) => Promise<boolean>
}

const pick = (c: any) => ({
  requireClosingAmount: !!c?.requireClosingAmount,
  differenceTolerance: c?.differenceTolerance ?? 0,
  allowNegativeBalance: !!c?.allowNegativeBalance,
  blockSalesAfterShiftEnd: !!c?.blockSalesAfterShiftEnd,
  shiftGraceMinutes: c?.shiftGraceMinutes ?? 0,
})

/** Formulario de reglas de cierre (agrupado en "Al cerrar" y "Horario del turno"). */
const ClosingRulesForm: React.FC<Props> = ({ config, canManage, saving, onSave }) => {
  const saved = useMemo(() => pick(config), [config])
  const [draft, setDraft] = useState(saved)
  useEffect(() => setDraft(saved), [saved])
  const changes = diffFields(draft, saved)
  const set = (k: keyof typeof draft) => (v: any) => setDraft((d) => ({ ...d, [k]: v }))

  return (
    <section className='cash-ui__card closing-rules-form'>
      <h2>Al cerrar</h2>
      <SettingRow icon='calculate' title='Capturar el efectivo contado' help='Apagado: si el cajero no captura el conteo se asume que cuadra con lo esperado.'>
        <IOSSwitch checked={draft.requireClosingAmount} onChange={set('requireClosingAmount')} disabled={!canManage} ariaLabel='Capturar el efectivo contado' />
      </SettingRow>
      <SettingRow icon='tune' title='Tolerancia de diferencia' help='Diferencia (sobrante o faltante) que se acepta sin más trámite. También la usan los arqueos.'>
        <MoneyInput value={draft.differenceTolerance} onChange={(v) => set('differenceTolerance')(v ?? 0)} ariaLabel='Tolerancia de diferencia' disabled={!canManage} />
      </SettingRow>
      <SettingRow
        icon='trending_down'
        title='Permitir cerrar con faltante'
        help='Aplica cuando el faltante rebasa la tolerancia y no se pide supervisor. Apagado: el cierre se rechaza hasta cuadrar.'
      >
        <IOSSwitch checked={draft.allowNegativeBalance} onChange={set('allowNegativeBalance')} disabled={!canManage || !!config?.requireManagerApproval} ariaLabel='Permitir cerrar con faltante' />
      </SettingRow>
      {config?.requireManagerApproval ? (
        <p className='closing-rules-form__note'>
          <span className='material-symbols-rounded' aria-hidden>verified_user</span>
          Los cierres fuera de tolerancia piden supervisor (se cambia en Control › Reglas de autorización), así que la regla de faltante no aplica.
        </p>
      ) : null}

      <h2 className='closing-rules-form__group'>Horario del turno</h2>
      <SettingRow icon='schedule' title='Dejar de vender al terminar el turno' help='Pasada la hora de salida del horario (más la tolerancia) ya no se puede cobrar en ese turno.'>
        <IOSSwitch checked={draft.blockSalesAfterShiftEnd} onChange={set('blockSalesAfterShiftEnd')} disabled={!canManage} ariaLabel='Dejar de vender al terminar el turno' />
      </SettingRow>
      <SettingRow icon='more_time' title='Tolerancia de salida' help='Minutos extra después de la hora de salida antes de bloquear (0 a 240).'>
        <MoneyInput
          value={draft.shiftGraceMinutes}
          onChange={(v) => set('shiftGraceMinutes')(Math.min(240, Math.max(0, Math.round(v ?? 0))))}
          suffix='min'
          step={1}
          ariaLabel='Tolerancia de salida en minutos'
          disabled={!canManage || !draft.blockSalesAfterShiftEnd}
        />
      </SettingRow>
      <SaveBar dirty={Object.keys(changes).length > 0} saving={saving} canManage={canManage} onSave={() => onSave(changes)} onDiscard={() => setDraft(saved)} />
    </section>
  )
}

export default ClosingRulesForm
