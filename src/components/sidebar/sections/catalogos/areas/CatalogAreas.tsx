import React, { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Swal from 'sweetalert2'
import './CatalogAreas.css'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
import { modal } from '../../../../../redux/state/modals'
import { setAreas } from '../../../../../redux/state/Configurations/Areas'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId } from '../../../../../constants/category'
import ModalAreas from '../../configurations/areas/modal-areas/ModalAreas'

const LS_COMPANY = 'categories-picker-company-id'

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem(LS_COMPANY))
  return !Number.isNaN(id) && id > 0 ? id : null
}

const CatalogAreas: React.FC = () => {
  const dispatch = useDispatch()
  const userState = useSelector((state: any) => state.user)
  const [searchParams] = useSearchParams()
  const urlTypeId = Number(searchParams.get('typeId'))
  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [areas, setAreasList] = useState<any[]>([])
  // Subárea en edición (null = alta)
  const [selectedArea, setSelectedArea] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [types, setTypes] = useState<any[]>([])
  const [typeFilter, setTypeFilter] = useState<number | 'ALL'>(urlTypeId > 0 ? urlTypeId : 'ALL')

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
  }, [])

  const fetchTypes = useCallback(async (cId?: number | null) => {
    const id = cId ?? companyId
    if (!id) {
      setTypes([])
      return
    }
    try {
      const res: any = await APIs.getAreaTypes(id)
      setTypes(Array.isArray(res?.data) ? res.data : [])
    } catch {
      setTypes([])
    }
  }, [companyId])

  // La empresa sale del estado (la fija el picker al resolverla), no de localStorage:
  // ahí solo se guardaba cuando el usuario elegía a mano, y una cuenta nueva siempre
  // veía la lista vacía.
  const fetchAreas = useCallback(async () => {
    // Sin empresa elegida por el selector se usa la activa de la sesión; si tampoco hay,
    // se apaga el loading en vez de dejar el skeleton para siempre.
    const effectiveCompanyId = companyId ?? userState?.activeCompanyId ?? userState?.companyId ?? userState?.companyIds?.[0] ?? null
    if (!effectiveCompanyId) {
      setAreasList([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response: any = await APIs.getAreas({
        companyId: effectiveCompanyId,
        branchId: branchId > 0 ? branchId : undefined,
        typeId: typeFilter !== 'ALL' ? typeFilter : undefined,
      })
      const list = Array.isArray(response?.data) ? response.data : []
      setAreasList(list)
      dispatch(setAreas(list))
    } catch {
      setAreasList([])
    } finally {
      setLoading(false)
    }
  }, [companyId, branchId, typeFilter, dispatch, userState?.activeCompanyId])

  useEffect(() => {
    fetchAreas()
  }, [fetchAreas])

  useEffect(() => {
    fetchTypes(companyId)
  }, [companyId])

  const handleCompanyChange = (id: number) => {
    setCompanyId(id)
  }

  const openCreateModal = () => {
    setSelectedArea(null)
    dispatch(modal('areas_modal'))
  }

  const openEditModal = (area: any) => {
    setSelectedArea(area)
    dispatch(modal('areas_modal'))
  }

  const handleDelete = async (area: any) => {
    const result = await Swal.fire({
      title: '¿Eliminar subárea?',
      text: `Se eliminará "${area.name}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!result.isConfirmed) return

    try {
      await APIs.deleteArea(area.id)
      fetchAreas()
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message ?? 'No se pudo eliminar.',
      })
    }
  }

  return (
    <div className='catalog-subareas'>
      <div className='catalog-subareas__container'>
        <header className='catalog-subareas__header'>
          <div className='catalog-subareas__header-left'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={persistBranchId}
              onCompanyIdChange={handleCompanyChange}
            />
          </div>
          <button type='button' className='btn__general-primary' onClick={openCreateModal}>
            Nueva SubÁrea
          </button>
        </header>

        <div className='catalog-subareas__filters'>
          <button
            type='button'
            className={`catalog-subareas__chip ${typeFilter === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setTypeFilter('ALL')}
          >
            Todas
          </button>
          {types.map((type) => (
            <button
              key={type.id}
              type='button'
              className={`catalog-subareas__chip ${typeFilter === type.id ? 'is-active' : ''}`}
              onClick={() => setTypeFilter(type.id)}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* La tabla siempre se ve; el skeleton va dentro */}
        <div className='catalog-subareas__list'>
          <div className='catalog-subareas__row catalog-subareas__row--head'>
            <span>SubÁrea</span>
            <span>Área</span>
            <span>Sucursal</span>
            <span className='catalog-subareas__col-actions'>Acciones</span>
          </div>

          {loading ? (
            <TableSkeleton rowClassName='catalog-subareas__row' cols={[{ width: '55%' }, { pill: true, width: '90px' }, { width: '50%' }, { actions: 2 }]} />
          ) : areas.length === 0 ? (
            <div className='catalog-subareas__state'>
              <p>No hay subáreas para este filtro</p>
            </div>
          ) : (
            areas.map((area) => (
              <div className='catalog-subareas__row' key={area.id}>
                <div className='catalog-subareas__cell catalog-subareas__cell--name' data-label='SubÁrea'>
                  <strong>{area.name}</strong>
                </div>
                <div className='catalog-subareas__cell' data-label='Área'>
                  <span className='catalog-subareas__tag'>{area.areaType?.label ?? '—'}</span>
                </div>
                <div className='catalog-subareas__cell catalog-subareas__cell--muted' data-label='Sucursal'>
                  {area.branchName || '—'}
                </div>
                <div className='catalog-subareas__cell catalog-subareas__col-actions'>
                  <button
                    type='button'
                    className='catalog-subareas__icon-btn'
                    title='Editar'
                    aria-label='Editar subárea'
                    onClick={() => openEditModal(area)}
                  >
                    <span className='material-symbols-rounded'>edit</span>
                  </button>
                  <button
                    type='button'
                    className='catalog-subareas__icon-btn catalog-subareas__icon-btn--danger'
                    title='Eliminar'
                    aria-label='Eliminar subárea'
                    onClick={() => handleDelete(area)}
                  >
                    <span className='material-symbols-rounded'>delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ModalAreas area={selectedArea} companyId={companyId} onSaved={fetchAreas} />
    </div>
  )
}

export default CatalogAreas
