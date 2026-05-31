import React, { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Swal from 'sweetalert2'
import '../../categories/Categories.css'
import '../../production/production.css'
import '../catalog-views.css'
import CategoriesStorePicker from '../../categories/CategoriesStorePicker'
import { modal } from '../../../../../redux/state/modals'
import { setAreas } from '../../../../../redux/state/Configurations/Areas'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId } from '../../../../../constants/category'
import {
  AREA_TYPE_OPTIONS,
  getAreaTypeLabel,
} from '../../../../../constants/catalogTypes'
import ModalAreas from '../../configurations/areas/modal-areas/ModalAreas'

const LS_COMPANY = 'categories-picker-company-id'

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem(LS_COMPANY))
  return !Number.isNaN(id) && id > 0 ? id : null
}

const CatalogAreas: React.FC = () => {
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const urlType = searchParams.get('type') ?? 'ALL'
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [areas, setAreasList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>(urlType)
  const [presetType, setPresetType] = useState<string>(urlType !== 'ALL' ? urlType : 'GENERAL')

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
  }, [])

  const fetchAreas = useCallback(async () => {
    const companyId = readCompanyId()
    if (!companyId) {
      setAreasList([])
      return
    }

    setLoading(true)
    try {
      const response: any = await APIs.getAreas({
        companyId,
        branchId: branchId > 0 ? branchId : undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
      })
      const list = Array.isArray(response?.data) ? response.data : []
      setAreasList(list)
      dispatch(setAreas(list))
    } catch {
      setAreasList([])
    } finally {
      setLoading(false)
    }
  }, [branchId, typeFilter, dispatch])

  useEffect(() => {
    fetchAreas()
  }, [fetchAreas])

  const openCreateModal = (type: string) => {
    setPresetType(type)
    sessionStorage.setItem('areas-modal-preset-type', type)
    dispatch(modal('areas_modal'))
  }

  const handleDelete = async (area: any) => {
    const result = await Swal.fire({
      title: '¿Eliminar área?',
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
    <div className='catalog-areas-types production'>
      <div className='production__container'>
        <header className='production__header'>
          <span className='production__eyebrow'>Catálogo</span>
          <h1 className='production__title'>SubÁreas</h1>
          <p className='production__subtitle'>
            Configura las subáreas del sistema filtradas por tipo de área.
          </p>
        </header>

        <div className='production__toolbar'>
          <CategoriesStorePicker
            branchId={branchId}
            onBranchIdChange={persistBranchId}
            onCompanyIdChange={fetchAreas}
          />
        </div>

        <div className='subareas__toolbar'>
          <div className='subareas__toolbar-left'>
            <span className='subareas__toolbar-title'>Filtrando por:</span>
            {typeFilter !== 'ALL' ? (
              (() => {
                const meta = AREA_TYPE_OPTIONS.find((t) => t.value === typeFilter)
                return (
                  <span
                    className='subareas__toolbar-badge'
                    style={{
                      '--filter-color': meta?.color ?? '#586ae9',
                      '--filter-color-bg': `${meta?.color ?? '#586ae9'}18`,
                      '--filter-color-border': `${meta?.color ?? '#586ae9'}28`,
                    } as React.CSSProperties}
                  >
                    {meta?.label ?? typeFilter}
                  </span>
                )
              })()
            ) : (
              <span className='subareas__toolbar-badge'>Todas</span>
            )}
          </div>
          <button
            type='button'
            className='catalog-area__btn catalog-area__btn--primary'
            onClick={() => openCreateModal(presetType)}
          >
            <span className='material-symbols-rounded' style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>add</span>
            Nueva SubÁrea
          </button>
        </div>

        <div className='subareas__filters'>
          <button
            type='button'
            className={`subareas__chip ${typeFilter === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setTypeFilter('ALL')}
          >
            Todas
          </button>
          {AREA_TYPE_OPTIONS.map((typeOption) => (
            <button
              key={typeOption.value}
              type='button'
              className={`subareas__chip ${typeFilter === typeOption.value ? 'is-active' : ''}`}
              onClick={() => setTypeFilter(typeOption.value)}
              style={
                typeFilter === typeOption.value
                  ? { background: typeOption.color, boxShadow: `0 4px 12px ${typeOption.color}40` }
                  : {}
              }
            >
              {typeOption.label}
            </button>
          ))}
        </div>

        <section className='subareas__table-wrap'>
          <div className='subareas__table-head'>
            <span>SubÁrea</span>
            <span>Tipo</span>
            <span>Sucursal</span>
            <span>Acciones</span>
          </div>
          <div className='subareas__table-body'>
            {loading ? (
              <div className='subareas__loading'>
                <span className='subareas__spinner' />
                Cargando subáreas…
              </div>
            ) : areas.length === 0 ? (
              <div className='subareas__empty'>
                <span className='material-symbols-rounded' style={{ fontSize: 40, marginBottom: 12, opacity: 0.4, fontVariationSettings: "'FILL' 1" }}>grid_view</span>
                <p>No hay subáreas para este filtro</p>
              </div>
            ) : (
              areas.map((area) => {
                const meta = AREA_TYPE_OPTIONS.find((item) => item.value === area.type)
                return (
                  <div className='subareas__table-row' key={area.id}>
                    <span className='subareas__name'>{area.name}</span>
                    <span>
                      <span
                        className='subareas__type-badge'
                        style={{
                          background: `${meta?.color ?? '#586ae9'}18`,
                          color: meta?.color ?? '#c5cbff',
                          border: `1px solid ${meta?.color ?? '#586ae9'}28`,
                        }}
                      >
                        {getAreaTypeLabel(area.type)}
                      </span>
                    </span>
                    <span className='subareas__branch'>{area.branchName ?? '—'}</span>
                    <div className='subareas__actions'>
                      <button
                        type='button'
                        className='subareas__action-btn subareas__action-btn--delete'
                        onClick={() => handleDelete(area)}
                        title='Eliminar'
                      >
                        <span className='material-symbols-rounded' style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>delete</span>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>

      <ModalAreas onSaved={fetchAreas} />
    </div>
  )
}

export default CatalogAreas
