import React, { useState, useEffect, useCallback, useMemo } from 'react'
import './Units.css'
import { useDispatch } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import ModalUnits from './modal-units/ModalUnits'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId } from '../../../../../constants/category'
import CategoriesStorePicker from '../../categories/CategoriesStorePicker'
import Swal from 'sweetalert2'

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
  const [loading, setLoading] = useState(false)
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

  const fetchUnits = useCallback(async () => {
    const companyId = readCompanyId()
    if (!companyId) {
      setUnits([])
      return
    }

    setLoading(true)
    try {
      const response: any = await APIs.getUnits({
        companyId,
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
  }, [branchId])

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
          <div className='units__toolbar'>
            <div className='units__toolbar-left'>
              <CategoriesStorePicker branchId={branchId} onBranchIdChange={persistBranchId} />
            </div>
            <div className='units__toolbar-right'>
              <div className='units__search-field'>
                <div className='units__search-field__input-wrap'>
                  <input
                    className='inputs__general'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    type='text'
                    placeholder='Buscar unidad'
                    aria-label='Buscar unidades'
                  />
                </div>
                <div className='units__search-field__icon' aria-hidden>
                  <svg xmlns='http://www.w3.org/2000/svg' height='22px' viewBox='0 -960 960 960' width='22px' fill='#f5f6f7'>
                    <path d='M380-320q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l224 224q11 11 11 28t-11 28q-11 11-28 11t-28-11L532-372q-30 24-69 38t-83 14Zm0-80q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z' />
                  </svg>
                </div>
              </div>
              <button
                className='btn__general-primary units__btn-create'
                onClick={() => {
                  setSelectedUnit(null)
                  handleModalChange('units_modal')
                }}
              >
                Nueva unidad
              </button>
            </div>
          </div>
        </div>

        <div className='table__units'>
          <div>
            {loading ? (
              <p className='text units__loading'>Cargando unidades...</p>
            ) : filteredUnits.length > 0 ? (
              <div className='table__numbers'>
                <p className='text'>Total de unidades</p>
                <div className='quantities_tables'>{filteredUnits.length}</div>
              </div>
            ) : (
              <p className='text'>
                {readCompanyId() ? 'No hay unidades registradas' : 'Selecciona una empresa para ver unidades'}
              </p>
            )}
          </div>

          <div className='table__head'>
            <div className='thead'>
              <div className='th'>
                <p>Nombre</p>
              </div>
              <div className='th'>
                <p>Símbolo</p>
              </div>
              <div className='th'>
                <p>Valor</p>
              </div>
              <div className='th'>
                <p>Predeterminado</p>
              </div>
              <div className='th'>
                <p>Acciones</p>
              </div>
            </div>
          </div>

          <div className='table__body'>
            {!loading && filteredUnits.length > 0 ? (
              filteredUnits.map((item: any) => (
                <div className='tbody__container' key={item.id}>
                  <div className='tbody'>
                    <div className='td'>
                      <p className='unit__name'>{item.name}</p>
                    </div>
                    <div className='td'>
                      <span className='unit__symbol'>{item.symbol}</span>
                    </div>
                    <div className='td'>
                      <p className='unit__value'>{item.value ?? 1}</p>
                    </div>
                    <div className='td'>
                      <div className={`status ${item.predetermined ? 'active' : 'inactive'}`}>
                        {item.predetermined ? 'Sí' : 'No'}
                      </div>
                    </div>
                    <div className='td units__actions-cell'>
                      <div
                        className='edit-icon'
                        title='Editar unidad'
                        aria-label='Editar unidad'
                        onClick={() => {
                          setSelectedUnit(item)
                          handleModalChange('units_modal_update')
                        }}
                      >
                        <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden>
                          <path stroke='none' d='M0 0h24v24H0z' fill='none' />
                          <path d='M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1' />
                          <path d='M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z' />
                          <path d='M16 5l3 3' />
                        </svg>
                      </div>
                      <div
                        className='delete-icon'
                        title='Eliminar unidad'
                        aria-label='Eliminar unidad'
                        onClick={() => handleDelete(item)}
                      >
                        <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
                          <path stroke='none' d='M0 0h24v24H0z' fill='none' />
                          <path d='M20 6a1 1 0 0 1 .117 1.993l-.117 .007h-.081l-.919 11a3 3 0 0 1 -2.824 2.995l-.176 .005h-8c-1.598 0 -2.904 -1.249 -2.992 -2.75l-.005 -.167l-.923 -11.083h-.08a1 1 0 0 1 -.117 -1.993l.117 -.007h16z' />
                          <path d='M14 2a2 2 0 0 1 2 2a1 1 0 0 1 -1.993 .117l-.007 -.117h-4l-.007 .117a1 1 0 0 1 -1.993 -.117a2 2 0 0 1 1.85 -1.995l.15 -.005h4z' />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : !loading ? (
              <div className='empty__state'>
                <p>
                  {debouncedSearch.trim()
                    ? 'No se encontraron unidades con ese criterio'
                    : 'No hay unidades registradas para esta empresa'}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <ModalUnits selectedUnit={selectedUnit} onSaved={fetchUnits} />
    </div>
  )
}

export default Units
