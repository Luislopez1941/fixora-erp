import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import Swal from 'sweetalert2'
import '../../categories/Categories.css'
import '../../production/production.css'
import './CatalogAreasTypes.css'
import CategoriesStorePicker from '../../categories/CategoriesStorePicker'
import { modal } from '../../../../../redux/state/modals'
import { setAreas } from '../../../../../redux/state/Configurations/Areas'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId } from '../../../../../constants/category'
import {
  AREA_TYPE_OPTIONS,
  SERIES_MODULE_TYPES,
  getAreaTypeLabel,
} from '../../../../../constants/catalogTypes'
import { URGENCY_OPTIONS } from '../../../../../constants/urgencyPricing'
import ModalAreas from '../../configurations/areas/modal-areas/ModalAreas'

const LS_COMPANY = 'categories-picker-company-id'

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem(LS_COMPANY))
  return !Number.isNaN(id) && id > 0 ? id : null
}

const CatalogAreasTypes: React.FC = () => {
  const dispatch = useDispatch()
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [areas, setAreasList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [presetType, setPresetType] = useState<string>('GENERAL')

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

  const countsByType = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const area of areas) {
      const key = area.type ?? 'GENERAL'
      counts[key] = (counts[key] ?? 0) + 1
    }
    return counts
  }, [areas])

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
          <h1 className='production__title'>Tipos y áreas</h1>
          <p className='production__subtitle'>
            Configura las áreas generales del sistema: ventas, compras, almacén, producción y
            administración.
          </p>
        </header>

        <div className='production__toolbar'>
          <CategoriesStorePicker
            branchId={branchId}
            onBranchIdChange={persistBranchId}
            onCompanyIdChange={fetchAreas}
          />
        </div>

        <section className='catalog-areas-types__grid'>
          {AREA_TYPE_OPTIONS.map((typeOption) => (
            <article
              key={typeOption.value}
              className={`catalog-areas-types__card ${
                typeFilter === typeOption.value ? 'is-active' : ''
              }`}
              style={{ borderColor: `${typeOption.color}55` }}
            >
              <div
                className='catalog-areas-types__card-badge'
                style={{ background: `${typeOption.color}22`, color: typeOption.color }}
              >
                {typeOption.label}
              </div>
              <p>{typeOption.description}</p>
              <strong>{countsByType[typeOption.value] ?? 0} áreas</strong>
              <div className='catalog-areas-types__card-actions'>
                <button
                  type='button'
                  className='production__action-btn production__action-btn--edit'
                  onClick={() => setTypeFilter(typeOption.value)}
                >
                  Ver
                </button>
                <button
                  type='button'
                  className='btn__general-purple'
                  onClick={() => openCreateModal(typeOption.value)}
                >
                  Agregar
                </button>
              </div>
            </article>
          ))}
        </section>

        <section className='catalog-areas-types__series'>
          <h2>Cargo por urgencia (ventas)</h2>
          <p>Recargo sobre el subtotal después de descuento. A mayor urgencia, mayor costo.</p>
          <div className='catalog-areas-types__series-grid'>
            {URGENCY_OPTIONS.map((item) => (
              <div key={item.value} className='catalog-areas-types__series-item'>
                <span className='catalog-areas-types__series-id'>
                  {item.percent > 0 ? `+${Math.round(item.percent * 100)}%` : '0%'}
                </span>
                <div>
                  <strong>{item.label}</strong>
                  <small>
                    {item.percent > 0 ? 'Cargo extra en ficha de venta' : 'Sin recargo'}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className='catalog-areas-types__series'>
          <h2>Tipos de serie (folios)</h2>
          <p>Módulos del sistema vinculados a ventas, compras y almacén.</p>
          <div className='catalog-areas-types__series-grid'>
            {SERIES_MODULE_TYPES.map((item) => (
              <div key={item.id} className='catalog-areas-types__series-item'>
                <span className='catalog-areas-types__series-id'>{item.id}</span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{getAreaTypeLabel(item.areaType)}</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className='production__panel-head'>
          <div className='production__filters'>
            <button
              type='button'
              className={`production__filter-btn ${typeFilter === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setTypeFilter('ALL')}
            >
              Todas
            </button>
            {AREA_TYPE_OPTIONS.map((typeOption) => (
              <button
                key={typeOption.value}
                type='button'
                className={`production__filter-btn ${
                  typeFilter === typeOption.value ? 'is-active' : ''
                }`}
                onClick={() => setTypeFilter(typeOption.value)}
              >
                {typeOption.label}
              </button>
            ))}
          </div>
          <button
            type='button'
            className='btn__general-purple'
            onClick={() => openCreateModal(presetType)}
          >
            Nueva área
          </button>
        </div>

        <section className='production__table-wrap'>
          <div className='production__table-head catalog-areas-types__head'>
            <span>Área</span>
            <span>Tipo</span>
            <span>Sucursal</span>
            <span>Acciones</span>
          </div>
          <div className='production__table-body'>
            {loading ? (
              <div className='production__loading'>
                <span className='production__spinner' />
                Cargando áreas…
              </div>
            ) : areas.length === 0 ? (
              <p className='production__empty'>No hay áreas para este tipo</p>
            ) : (
              areas.map((area) => {
                const meta = AREA_TYPE_OPTIONS.find((item) => item.value === area.type)
                return (
                  <div className='production__table-row catalog-areas-types__row' key={area.id}>
                    <span className='production-areas__name'>{area.name}</span>
                    <span>
                      <span
                        className='production__status production__status--progress'
                        style={{
                          background: `${meta?.color ?? '#586ae9'}22`,
                          color: meta?.color ?? '#c5cbff',
                        }}
                      >
                        {getAreaTypeLabel(area.type)}
                      </span>
                    </span>
                    <span>{area.branchName ?? '—'}</span>
                    <div className='production__actions'>
                      <button
                        type='button'
                        className='production__action-btn production__action-btn--delete'
                        onClick={() => handleDelete(area)}
                      >
                        Eliminar
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

export default CatalogAreasTypes
