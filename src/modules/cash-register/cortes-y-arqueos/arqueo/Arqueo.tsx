import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import CategoriesStorePicker from '../../../../components/sidebar/sections/catalogos/categories/CategoriesStorePicker'
import { readCompanyId } from '../../shared/cashFormat'
import CashCountForm from './cash-count-form/CashCountForm'
import CashCountHistory from './cash-count-history/CashCountHistory'
import ModalCashCountDetail from './modal-cash-count-detail/ModalCashCountDetail'
import '../../../../components/general/skeleton/TableSkeleton.css'
import '../../shared/CashShared.css'
import './Arqueo.css'

/** Arqueo de caja: contar el efectivo de un turno abierto contra lo esperado (pestaña Nuevo) y consultar los arqueos hechos (Historial). */
const Arqueo: React.FC = () => {
  const can = useCan()
  const canView = can('cash-register.cortes-y-arqueos-arqueo.view')
  const userState = useSelector((state: any) => state.user)

  const [tab, setTab] = useState<'count' | 'history'>('count')
  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [detailId, setDetailId] = useState<number | null>(null)
  // Sube cada vez que se guarda o cancela un arqueo, para que el historial vuelva a pedir sus datos
  const [refreshKey, setRefreshKey] = useState(0)
  const resolvedCompanyId = companyId ?? readCompanyId() ?? userState?.activeCompanyId ?? userState?.companyId ?? userState?.companyIds?.[0] ?? null

  if (!canView) {
    return (
      <div className='cash-ui'>
        <div className='cash-ui__state'>
          <span className='material-symbols-rounded' aria-hidden>lock</span>
          <p>No tienes permiso para ver los arqueos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='cash-ui'>
      <div className='cash-ui__container'>
        <div className='cash-ui__header'>
          <div className='cash-ui__title'>
            <h1>Arqueo de caja</h1>
            <p>Cuenta el efectivo de un turno abierto y compáralo con lo que el sistema espera.</p>
          </div>
          <CategoriesStorePicker
            branchId={branchId}
            onCompanyIdChange={(id) => {
              setCompanyId(id)
              localStorage.setItem('categories-picker-company-id', String(id))
            }}
            onBranchIdChange={(id) => {
              setBranchId(id)
              localStorage.setItem('categories-store-id', String(id))
              localStorage.setItem('categories-picker-branch-id', String(id))
            }}
          />
        </div>

        <div className='arqueo__tabs' role='tablist'>
          <button type='button' role='tab' aria-selected={tab === 'count'} className={tab === 'count' ? 'is-active' : ''} onClick={() => setTab('count')}>
            <span className='material-symbols-rounded'>calculate</span> Nuevo arqueo
          </button>
          <button type='button' role='tab' aria-selected={tab === 'history'} className={tab === 'history' ? 'is-active' : ''} onClick={() => setTab('history')}>
            <span className='material-symbols-rounded'>history</span> Historial
          </button>
        </div>

        {tab === 'count' ? (
          <CashCountForm
            branchId={branchId}
            onSaved={(id) => {
              setRefreshKey((k) => k + 1)
              setDetailId(id)
            }}
          />
        ) : (
          <CashCountHistory companyId={resolvedCompanyId} branchId={branchId} refreshKey={refreshKey} onOpen={setDetailId} />
        )}
      </div>

      {detailId ? (
        <ModalCashCountDetail id={detailId} onClose={() => setDetailId(null)} onChanged={() => setRefreshKey((k) => k + 1)} />
      ) : null}
    </div>
  )
}

export default Arqueo
