import React, { useState } from 'react'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import ControlPage from '../../shared/control-page/ControlPage'
import { useCashControl } from '../../shared/useCashControl'
import LimitsForm from './limits-form/LimitsForm'
import DrawerStatus from './drawer-status/DrawerStatus'
import './Limites.css'

/** Límites de efectivo: máximo en caja (alerta), monto máximo por ingreso / egreso y turnos simultáneos. */
const Limites: React.FC = () => {
  const can = useCan()
  const canView = can('cash-register.control-limites.view')
  const canManage = can('cash-register.control-limites.manage')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const { data, loading, saving, error, reload, save } = useCashControl<any>('limits', branchId, canView)

  return (
    <ControlPage
      title='Límites'
      subtitle='Topes de efectivo por caja y por movimiento. Vacío = sin límite.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading || !data}
      error={error}
      onRetry={reload}
    >
      {data ? (
        <>
          <LimitsForm config={data.config} canManage={canManage} saving={saving} onSave={save} />
          <DrawerStatus drawers={data.drawers ?? []} max={data.config.maxCashInDrawer} onRefresh={reload} />
        </>
      ) : null}
    </ControlPage>
  )
}

export default Limites
