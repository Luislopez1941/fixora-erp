import React, { useState, useEffect, useCallback } from 'react'
import './Store.css'
import { useDispatch } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import ModalStore from './modal-store/ModalStore'
import WarehouseManager from './WarehouseManager'
import { readCategoryBranchId } from '../../../../../constants/category'

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem('categories-picker-company-id'))
  return !Number.isNaN(id) && id > 0 ? id : null
}

const Store: React.FC = () => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null)
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const dispatch = useDispatch()

  const handleModalChange = (value: string) => {
    dispatch(modal(value))
  }

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
    localStorage.setItem('categories-picker-branch-id', String(id))
  }, [])

  useEffect(() => {
    const handleOpenModal = () => {
      setSelectedWarehouse(null)
      handleModalChange('store_modal')
    }
    const handleUpdateModal = (e: any) => {
      setSelectedWarehouse(e.detail)
      handleModalChange('store_modal_update')
    }

    window.addEventListener('open-store-modal', handleOpenModal)
    window.addEventListener('update-store-modal', handleUpdateModal)
    return () => {
      window.removeEventListener('open-store-modal', handleOpenModal)
      window.removeEventListener('update-store-modal', handleUpdateModal)
    }
  }, [handleModalChange])

  return (
    <div className='store-main'>
      <WarehouseManager
        branchId={branchId}
        setBranchId={persistBranchId}
        companyId={companyId}
        setCompanyId={setCompanyId}
      />
      <ModalStore selectedWarehouse={selectedWarehouse} onSaved={() => {}} />
    </div>
  )
}

export default Store
