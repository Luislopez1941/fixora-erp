import React, { useState } from 'react'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import ControlPage from '../../shared/control-page/ControlPage'
import { useCashControl } from '../../shared/useCashControl'
import ClosingRulesForm from './closing-rules-form/ClosingRulesForm'
import ClosingSimulator from './closing-simulator/ClosingSimulator'
import ClosingStats from './closing-stats/ClosingStats'
import './ReglasDeCierre.css'

/** Reglas de cierre de turno: conteo obligatorio, tolerancia, faltantes y horario. Con simulador para probarlas. */
const ReglasDeCierre: React.FC = () => {
  const can = useCan()
  const canView = can('cash-register.control-reglas-de-cierre.view')
  const canManage = can('cash-register.control-reglas-de-cierre.manage')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const { data, loading, saving, error, reload, save } = useCashControl<any>('closing', branchId, canView)

  return (
    <ControlPage
      title='Reglas de cierre'
      subtitle='Qué pasa al cerrar un turno según la diferencia entre lo contado y lo esperado.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading || !data}
      error={error}
      onRetry={reload}
    >
      {data ? (
        <>
          <ClosingRulesForm config={data.config} canManage={canManage} saving={saving} onSave={save} />
          <div className='reglas-cierre__side'>
            <ClosingSimulator config={data.config} />
            <ClosingStats stats={data.stats} tolerance={data.config.differenceTolerance} />
          </div>
        </>
      ) : null}
    </ControlPage>
  )
}

export default ReglasDeCierre
