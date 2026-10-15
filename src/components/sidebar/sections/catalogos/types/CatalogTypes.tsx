import React, { useCallback, useEffect, useState } from 'react'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Swal from 'sweetalert2'
import './CatalogTypes.css'
import APIs from '../../../../../services/APIs'
import { modal } from '../../../../../redux/state/modals'
import ModalAreas from '../../configurations/areas/modal-areas/ModalAreas'
import ModalAreaType from './modal-area-type/ModalAreaType'
import CategoriesStorePicker from '../categories/CategoriesStorePicker'
import { readCategoryBranchId } from '../../../../../constants/category'

interface AreaType {
  id: number
  companyId: number
  branchId: number | null
  branch: { id: number; name: string } | null
  label: string
  description: string | null
  color: string
  isProduction: boolean
  areasCount: number
}

const AREA_ICONS: Record<string, string> = {
  General: 'corporate_fare',
  Ventas: 'point_of_sale',
  Compras: 'shopping_bag',
  Almacén: 'warehouse',
  Producción: 'precision_manufacturing',
  Administración: 'admin_panel_settings',
}

const CatalogTypes: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [companyId, setCompanyId] = useState<number | null>(null)
  // Todo el catálogo se filtra por empresa y sucursal (0 = todas las sucursales de la empresa)
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [types, setTypes] = useState<AreaType[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [selectedType, setSelectedType] = useState<AreaType | null>(null)

  const fetchTypes = useCallback(async (cId?: number | null, bId?: number) => {
    const id = cId ?? companyId
    const branch = bId ?? branchId
    if (!id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res: any = await APIs.getAreaTypes(id, branch > 0 ? branch : undefined)
      setTypes(Array.isArray(res?.data) ? res.data : [])
    } catch {
      setTypes([])
    } finally {
      setLoading(false)
    }
  }, [companyId, branchId])

  // El selector de empresa/sucursal fija companyId y branchId; al cambiar cualquiera se recarga la lista
  useEffect(() => {
    if (companyId) fetchTypes(companyId, branchId)
  }, [companyId, branchId])

  const viewSubAreas = (typeId: number) => {
    navigate(`/auth/catalogos/areas?typeId=${typeId}`)
  }

  const openCreateAreaModal = () => {
    dispatch(modal('areas_modal'))
  }

  const openCreateTypeModal = () => {
    setSelectedType(null)
    dispatch(modal('area_type_modal'))
  }

  const openEditTypeModal = (type: AreaType) => {
    setSelectedType(type)
    dispatch(modal('area_type_modal_update'))
  }

  const handleDeleteType = async (type: AreaType) => {
    const result = await Swal.fire({
      title: `¿Eliminar "${type.label}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    })
    if (!result.isConfirmed) return

    setDeletingId(type.id)
    try {
      await APIs.deleteAreaType(type.id)
      await fetchTypes()
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo eliminar el tipo', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className='catalog-types'>
      <div className='catalog-types__container'>
        <header className='catalog-types__header'>
          <div className='catalog-types__header-left'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={(id) => {
                setBranchId(id)
                localStorage.setItem('categories-store-id', String(id))
              }}
              onCompanyIdChange={(id) => setCompanyId(id)}
            />
          </div>
          <div className='catalog-types__header-actions'>
            <button type='button' className='btn__general-secondary' onClick={openCreateTypeModal} disabled={!companyId}>
              Nuevo tipo
            </button>
            <button type='button' className='btn__general-primary' onClick={openCreateAreaModal} disabled={!companyId}>
              Crear subárea
            </button>
          </div>
        </header>

        {/* La tabla siempre se ve; el loading va dentro */}
        <div className='catalog-types__list'>
          <div className='catalog-types__row catalog-types__row--head'>
            <span>Tipo</span>
            <span>Descripción</span>
            <span>Áreas</span>
            <span>Sucursal</span>
            <span className='catalog-types__col-actions'>Acciones</span>
          </div>

          {loading ? (
            <TableSkeleton rowClassName='catalog-types__row' cols={[{ avatar: true }, { width: '70%' }, { pill: true, width: '70px' }, { width: '50%' }, { actions: 2 }]} />
          ) : !companyId ? (
            <div className='catalog-types__state'>Selecciona una empresa para ver sus tipos de área.</div>
          ) : types.length === 0 ? (
            <div className='catalog-types__state'>
              <p>No hay tipos de área configurados</p>
              <span>Crea el primero con "Nuevo tipo"</span>
            </div>
          ) : types.map((type, index) => {
            const isDeleting = deletingId === type.id
            // Alterna entre los dos colores de marca (primario / secundario)
            const accent = index % 2 === 0 ? 'var(--primary-color)' : 'var(--secondary-color)'
            return (
              <div className='catalog-types__row' key={type.id} style={{ '--type-accent': accent } as React.CSSProperties}>
                <div className='catalog-types__cell catalog-types__cell--name' data-label='Tipo'>
                  <span className='catalog-types__icon material-symbols-rounded'>
                    {AREA_ICONS[type.label] ?? 'category'}
                  </span>
                  <strong>{type.label}</strong>
                  {type.isProduction && <span className='catalog-types__tag'>Producción</span>}
                </div>
                <div className='catalog-types__cell catalog-types__cell--muted' data-label='Descripción'>
                  {type.description || '—'}
                </div>
                <div className='catalog-types__cell' data-label='Áreas'>
                  <span className='catalog-types__count'>{type.areasCount} área{type.areasCount === 1 ? '' : 's'}</span>
                </div>
                <div className='catalog-types__cell catalog-types__cell--muted' data-label='Sucursal'>
                  {type.branch?.name ?? 'Todas'}
                </div>
                <div className='catalog-types__cell catalog-types__col-actions'>
                  <button
                    type='button'
                    className='catalog-types__icon-btn'
                    title='Ver subáreas'
                    aria-label='Ver subáreas'
                    onClick={() => viewSubAreas(type.id)}
                  >
                    <span className='material-symbols-rounded'>arrow_forward</span>
                  </button>
                  <button
                    type='button'
                    className='catalog-types__icon-btn'
                    title='Editar tipo'
                    aria-label='Editar tipo'
                    onClick={() => openEditTypeModal(type)}
                  >
                    <span className='material-symbols-rounded'>edit</span>
                  </button>
                  <button
                    type='button'
                    className='catalog-types__icon-btn catalog-types__icon-btn--danger'
                    title={type.areasCount > 0 ? `No se puede eliminar — ${type.areasCount} área(s) lo usan` : 'Eliminar tipo'}
                    aria-label='Eliminar tipo'
                    disabled={isDeleting || type.areasCount > 0}
                    onClick={() => handleDeleteType(type)}
                  >
                    {isDeleting ? <span className='loader_btn'></span> : <span className='material-symbols-rounded'>delete</span>}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ModalAreas onSaved={() => fetchTypes()} />
      <ModalAreaType companyId={companyId} type={selectedType} onSaved={() => fetchTypes()} />
    </div>
  )
}

export default CatalogTypes
