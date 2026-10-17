import React from 'react'
import { useCan } from '../../../../core/permissions/useCan'
import EntryForm from '../../shared/EntryForm'
import { AccPage, useAccountingCompany } from '../../shared/ui'

/** Asientos: captura manual de un asiento de partida doble (cargos = abonos). Al contabilizar ya no se edita: se anula en Pólizas. */
const Asientos: React.FC = () => {
  const can = useCan()
  const { companies, companyId, setCompanyId } = useAccountingCompany()
  return (
    <AccPage title='Asientos' subtitle='Registra un asiento manual. Debe cuadrar: la suma de cargos igual a la de abonos.' companies={companies} companyId={companyId} onCompany={setCompanyId}>
      <EntryForm key={companyId} companyId={companyId} canPost={can('accounting.create')} />
    </AccPage>
  )
}

export default Asientos
