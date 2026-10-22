import React, { useState } from 'react'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import ControlPage from '../../shared/control-page/ControlPage'
import { useCashControl } from '../../shared/useCashControl'
import AuthorizationRules from './authorization-rules/AuthorizationRules'
import ReturnRules from './return-rules/ReturnRules'
import SupervisorsList from './supervisors-list/SupervisorsList'
import './ReglasDeAutorizacion.css'

/** Cuándo una operación de caja necesita a un supervisor y quiénes pueden autorizar. */
const ReglasDeAutorizacion: React.FC = () => {
  const can = useCan()
  const canView = can('cash-register.control-reglas-de-autorizacion.view')
  const canManage = can('cash-register.control-reglas-de-autorizacion.manage')
  // Las reglas de devoluciones son de la empresa y las protege el permiso de configuración de ventas
  const canManageReturns = can('sales.config.view')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const { data, loading, saving, error, reload, save } = useCashControl<any>('authorization', branchId, canView)

  return (
    <ControlPage
      title='Reglas de autorización'
      subtitle='Qué operaciones piden usuario y contraseña de un supervisor.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading || !data}
      error={error}
      onRetry={reload}
    >
      {data ? (
        <>
          <div className='reglas-autorizacion__main'>
            <AuthorizationRules config={data.config} canManage={canManage} saving={saving} onSave={save} />
            <ReturnRules companyId={data.companyId} returns={data.returns} canManage={canManageReturns} />
          </div>
          <SupervisorsList supervisors={data.supervisors ?? []} />
        </>
      ) : null}
    </ControlPage>
  )
}

export default ReglasDeAutorizacion
