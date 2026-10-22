import React, { useState } from 'react'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import ControlPage from '../../shared/control-page/ControlPage'
import { useCashControl } from '../../shared/useCashControl'
import FundSettings from './fund-settings/FundSettings'
import RegisterFunds from './register-funds/RegisterFunds'
import ModalRegisterFund from './modal-register-fund/ModalRegisterFund'
import OpeningHistory from './opening-history/OpeningHistory'
import './FondosIniciales.css'

/** Fondos iniciales: con cuánto efectivo abre cada turno (por sucursal y, si se quiere, por caja). */
const FondosIniciales: React.FC = () => {
  const can = useCan()
  const canView = can('cash-register.control-fondos-iniciales.view')
  const canManage = can('cash-register.control-fondos-iniciales.manage')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const { data, loading, saving, error, reload, save } = useCashControl<any>('opening', branchId, canView)
  const [editing, setEditing] = useState<any | null>(null)

  const branchFund = Number(data?.config?.defaultOpeningAmount ?? 0)
  const fundOf = (registerId: number | null) => {
    const r = (data?.registers ?? []).find((x: any) => x.id === registerId)
    return r?.openingAmount ?? branchFund
  }

  return (
    <ControlPage
      title='Fondos iniciales'
      subtitle='El efectivo con el que se abre cada turno para dar cambio.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading || !data}
      error={error}
      onRetry={reload}
    >
      {data ? (
        <>
          <div className='fondos__main'>
            <FundSettings config={data.config} canManage={canManage} saving={saving} onSave={save} />
            <RegisterFunds registers={data.registers ?? []} branchFund={branchFund} canManage={canManage} onEdit={setEditing} />
          </div>
          <OpeningHistory recent={data.recent ?? []} fundOf={fundOf} locked={!!data.config.lockOpeningAmount} />
        </>
      ) : null}
      {editing ? <ModalRegisterFund register={editing} branchFund={branchFund} onClose={() => setEditing(null)} onSaved={reload} /> : null}
    </ControlPage>
  )
}

export default FondosIniciales
