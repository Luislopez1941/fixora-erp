import React, { useState, useEffect, useCallback, useMemo } from 'react'
import './Units.css'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import ModalUnits from './modal-units/ModalUnits'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId } from '../../../../../constants/category'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
import Swal from 'sweetalert2'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem('categories-picker-company-id'))
  return !Number.isNaN(id) && id > 0 ? id : null
}

const Units: React.FC = () => {
  const [units, setUnits] = useState<any[]>([])
  const [selectedUnit, setSelectedUnit] = useState<any>(null)
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const userState = useSelector((state: any) => state.user)
  const dispatch = useDispatch()

  const handleModalChange = (value: string) => {
    dispatch(modal(value))
  }

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  const persistCompanyId = useCallback((id: number) => {
    setCompanyId(id)
    localStorage.setItem('categories-picker-company-id', String(id))
  }, [])

  const fetchUnits = useCallback(async () => {
    // Empresa del selector; si no hay, la guardada o la activa de la sesión.
    const effectiveCompanyId =
      companyId ?? userState?.activeCompanyId ?? userState?.companyId ?? userState?.companyIds?.[0] ?? null
    if (!effectiveCompanyId) {
      setUnits([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response: any = await APIs.getUnits({
        companyId: effectiveCompanyId,
        branchId: branchId > 0 ? branchId : undefined,
      })
      const list = Array.isArray(response?.data) ? response.data : []
      setUnits(list)
    } catch (error) {
      console.error('Error al cargar unidades:', error)
      setUnits([])
    } finally {
      setLoading(false)
    }
  }, [branchId, companyId, userState?.activeCompanyId])

  useEffect(() => {
    fetchUnits()
  }, [fetchUnits])

  const filteredUnits = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) return units
    return units.filter(
      (unit) =>
        unit.name?.toLowerCase().includes(q) ||
        unit.symbol?.toLowerCase().includes(q),
    )
  }, [units, debouncedSearch])

  const handleDelete = async (unit: any) => {
    const result = await Swal.fire({
      title: '¿Eliminar unidad?',
      text: `Se eliminará "${unit.name}" (${unit.symbol}). Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) return

    try {
      await APIs.deleteUnit(unit.id)
      Swal.fire({
        icon: 'success',
        title: 'Unidad eliminada',
        text: 'La unidad se eliminó correctamente.',
      })
      fetchUnits()
    } catch (error) {
      console.error(error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la unidad. Inténtalo de nuevo.',
      })
    }
  }

  return (
    <div className='units'>
      <div className='units__container'>
        <div className='units__header'>
          <div className='units__header-left'>
            <CategoriesStorePicker branchId={branchId} onBranchIdChange={persistBranchId} onCompanyIdChange={persistCompanyId} />
            <div className='units__search'>
              <span className='units__search-icon material-symbols-rounded' aria-hidden>search</span>
              <input
                className='inputs__general units__search-input'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type='text'
                placeholder='Buscar unidad'
                aria-label='Buscar unidades'
              />
            </div>
          </div>
          <button
            className='btn__general-primary'
            onClick={() => {
              setSelectedUnit(null)
              handleModalChange('units_modal')
            }}
          >
            Nueva unidad
          </button>
        </div>

        {/* La tabla siempre se ve; el skeleton va dentro */}
        <div className='units__list'>
          <div className='units__row units__row--head'>
            <span>Nombre</span>
            <span>Símbolo</span>
            <span>Valor</span>
            <span>Predeterminada</span>
            <span className='units__col-actions'>Acciones</span>
          </div>

          {loading ? (
            <TableSkeleton rowClassName='units__row' cols={[{ width: '55%' }, { pill: true, width: '48px' }, { width: '30%' }, { pill: true, width: '40px' }, { actions: 2 }]} />
          ) : filteredUnits.length > 0 ? (
            filteredUnits.map((item: any) => (
              <div className='units__row' key={item.id}>
                <div className='units__cell units__cell--name' data-label='Nombre'>
                  <strong>{item.name}</strong>
                </div>
                <div className='units__cell' data-label='Símbolo'>
                  <span className='units__tag'>{item.symbol}</span>
                </div>
                <div className='units__cell' data-label='Valor'>
                  {item.value ?? 1}
                </div>
                <div className='units__cell' data-label='Predeterminada'>
                  <span className={`units__badge ${item.predetermined ? 'units__badge--yes' : 'units__badge--no'}`}>
                    {item.predetermined ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className='units__cell units__col-actions'>
                  <button
                    type='button'
                    className='units__icon-btn'
                    title='Editar unidad'
                    aria-label='Editar unidad'
                    onClick={() => {
                      setSelectedUnit(item)
                      handleModalChange('units_modal_update')
                    }}
                  >
                    <span className='material-symbols-rounded'>edit</span>
                  </button>
                  <button
                    type='button'
                    className='units__icon-btn units__icon-btn--danger'
                    title='Eliminar unidad'
                    aria-label='Eliminar unidad'
                    onClick={() => handleDelete(item)}
                  >
                    <span className='material-symbols-rounded'>delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className='units__state'>
              <p>
                {debouncedSearch.trim()
                  ? 'No se encontraron unidades con ese criterio'
                  : 'No hay unidades registradas'}
              </p>
            </div>
          )}
        </div>
      </div>
      <ModalUnits selectedUnit={selectedUnit} onSaved={fetchUnits} />
    </div>
  )
}

export default Units
