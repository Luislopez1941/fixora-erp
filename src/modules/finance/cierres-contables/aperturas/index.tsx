import React from 'react'
import { useCan } from '../../../../core/permissions/useCan'
import EntryForm from '../../shared/EntryForm'
import { AccPage, useAccountingCompany } from '../../shared/ui'

/** Aperturas: asiento de apertura de un ejercicio (saldos iniciales de activo, pasivo y capital). Se guarda marcado como OPENING. */
const Aperturas: React.FC = () => {
  const can = useCan()
  const { companies, companyId, setCompanyId } = useAccountingCompany()
  const year = new Date().getFullYear()
  return (
    <AccPage title='Aperturas' subtitle='Registra los saldos iniciales del ejercicio con un asiento de apertura: los cargos deben igualar a los abonos.' companies={companies} companyId={companyId} onCompany={setCompanyId}>
      <EntryForm key={companyId} companyId={companyId} presetDescription={`Asiento de apertura ${year}`} presetDate={`${year}-01-01`} sourceType='OPENING' canPost={can('accounting.create')} />
    </AccPage>
  )
}

export default Aperturas
