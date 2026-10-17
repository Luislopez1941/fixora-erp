import React from 'react'
import { useCan } from '../../../../core/permissions/useCan'
import EntryForm from '../../shared/EntryForm'
import { AccPage, useAccountingCompany } from '../../shared/ui'

/** Ajustes: asientos de ajuste previos al cierre (provisiones, devengos, reclasificaciones). Se guardan marcados como ADJUSTMENT. */
const Ajustes: React.FC = () => {
  const can = useCan()
  const { companies, companyId, setCompanyId } = useAccountingCompany()
  return (
    <AccPage title='Ajustes' subtitle='Registra ajustes contables antes de cerrar el periodo: provisiones, devengos y reclasificaciones.' companies={companies} companyId={companyId} onCompany={setCompanyId}>
      <EntryForm key={companyId} companyId={companyId} presetDescription='Ajuste contable' sourceType='ADJUSTMENT' canPost={can('accounting.create')} />
    </AccPage>
  )
}

export default Ajustes
