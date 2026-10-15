import React, { useState, useEffect, useCallback, useRef } from 'react'
import './Familias.css'
import { useDispatch } from "react-redux";
import { modal } from '../../../../../redux/state/modals';
import ModalFamilias from './ModalFamilias';
import APIs from '../../../../../services/APIs';
import { readCategoryBranchId, categoryId } from '../../../../../constants/category';
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker';
import Swal from 'sweetalert2'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'

const LS_COMPANY = 'categories-picker-company-id'

const Familias: React.FC = () => {
  const [familias, setFamilias] = useState<any[]>([])
  const [selectedFamilia, setSelectedFamilia] = useState<any>(null)
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [companyId, setCompanyId] = useState<number | null>(() => {
    const saved = localStorage.getItem(LS_COMPANY)
    return saved ? Number(saved) : null
  })
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ARTICLE' | 'SERVICE'>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const dispatch = useDispatch();

  const handleModalChange = (value: any) => {
    dispatch(modal(value));
  };

  const handleDelete = async (familia: any) => {
    const id = categoryId(familia)
    if (id == null) {
      Swal.fire({ icon: 'warning', title: 'Familia sin ID' })
      return
    }

    const result = await Swal.fire({
      title: '¿Eliminar familia?',
      text: `Se eliminará "${familia.title}" y todas sus subcategorías. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#072a57',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem('token-fixora')
      if (!token) {
        Swal.fire({ icon: 'warning', title: 'Sesión', text: 'No hay token de autenticación' })
        return
      }
      await APIs.deleteCategory(id, token)
      Swal.fire({
        icon: 'success',
        title: 'Familia eliminada',
        text: 'La familia se eliminó correctamente.',
        confirmButtonColor: '#072a57',
      })
      fetchFamilias()
    } catch (err: any) {
      console.error('Error al eliminar familia:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.response?.data?.message ?? err?.message ?? 'No se pudo eliminar la familia',
        confirmButtonColor: '#072a57',
      })
    }
  }

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
  }, [])

  const persistCompanyId = useCallback((id: number) => {
    setCompanyId(id)
    localStorage.setItem(LS_COMPANY, String(id))
  }, [])

  // Debounce para la búsqueda (espera 500ms después de que el usuario deja de escribir)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  const fetchingRef = useRef(false)

  const fetchFamilias = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token-fixora')
      if (!token) return

      const filters: Record<string, unknown> = {}

      if (branchId && !isNaN(branchId) && branchId >= 1) {
        filters.branchId = branchId
      } else if (companyId != null && !isNaN(companyId)) {
        filters.companyId = companyId
      }

      if (typeFilter !== 'ALL') {
        filters.allowedItemType = typeFilter
      }

      if (debouncedSearch.trim()) {
        filters.search = debouncedSearch.trim()
      }

      const response: any = await APIs.filterFamilias(filters, token)
      const list = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : []
      setFamilias(list)
    } catch (error) {
      console.error('Error al cargar familias:', error)
      setFamilias([])
    } finally {
      setIsLoading(false)
      fetchingRef.current = false
    }
  }, [branchId, companyId, typeFilter, debouncedSearch])

  useEffect(() => {
    fetchFamilias()
  }, [fetchFamilias])

  const typeLabel = (type?: string | null) =>
    type === 'ARTICLE' ? 'Artículos' : type === 'SERVICE' ? 'Servicios' : 'Ambos'

  return (
    <div className='familias'>
      <div className='familias__container'>
        <div className='familias__header'>
          <div className='familias__header-left'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={persistBranchId}
              onCompanyIdChange={persistCompanyId}
            />
            <div className='familias__search'>
              <span className='familias__search-icon material-symbols-rounded' aria-hidden>search</span>
              <input
                className='inputs__general familias__search-input'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type='text'
                placeholder='Buscar familia'
                aria-label='Buscar familias'
              />
            </div>
            <select
              className='inputs__general familias__filter'
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'ALL' | 'ARTICLE' | 'SERVICE')}
              aria-label='Filtrar por tipo de items'
            >
              <option value='ALL'>Todos</option>
              <option value='ARTICLE'>Artículos</option>
              <option value='SERVICE'>Servicios</option>
            </select>
          </div>
          <button className='btn__general-primary' onClick={() => handleModalChange('familias-modal')}>
            Nueva familia
          </button>
        </div>

        {/* La tabla siempre se ve; el skeleton va dentro */}
        <div className='familias__list'>
          <div className='familias__row familias__row--head'>
            <span>Familia</span>
            <span>Tipo de items</span>
            <span>Categorías</span>
            <span>Estado</span>
            <span className='familias__col-actions'>Acciones</span>
          </div>

          {isLoading ? (
            <TableSkeleton rowClassName='familias__row' cols={[{ avatar: true }, { pill: true, width: '80px' }, { width: '50%' }, { pill: true, width: '60px' }, { actions: 2 }]} />
          ) : familias.length > 0 ? (
            familias.map((familia: any, index: number) => (
              <div className='familias__row' key={familia.id ?? index}>
                <div className='familias__cell familias__cell--name' data-label='Familia'>
                  {familia.image ? (
                    <img src={familia.image} alt={familia.title} className='familias__thumb' />
                  ) : (
                    <span className='familias__thumb familias__thumb--empty material-symbols-rounded'>category</span>
                  )}
                  <div className='familias__name-text'>
                    <strong>{familia.title}</strong>
                    {familia.description && <span>{familia.description}</span>}
                  </div>
                </div>
                <div className='familias__cell' data-label='Tipo de items'>
                  <span className='familias__tag'>{typeLabel(familia.allowedItemType)}</span>
                </div>
                <div className='familias__cell' data-label='Categorías'>
                  {familia.subcategories?.length || 0}
                </div>
                <div className='familias__cell' data-label='Estado'>
                  <span className={`familias__badge ${familia.status === 'ACTIVE' ? 'familias__badge--active' : 'familias__badge--inactive'}`}>
                    {familia.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </span>
                  {familia.availableInBranch === false && (
                    <span className='familias__badge familias__badge--inactive' title='La familia está deshabilitada en la sucursal seleccionada'>No disponible aquí</span>
                  )}
                </div>
                <div className='familias__cell familias__col-actions'>
                  <button
                    type='button'
                    className='familias__icon-btn'
                    title='Editar familia'
                    aria-label='Editar familia'
                    onClick={() => {
                      setSelectedFamilia(familia)
                      handleModalChange('familias-modal-update')
                    }}
                  >
                    <span className='material-symbols-rounded'>edit</span>
                  </button>
                  <button
                    type='button'
                    className='familias__icon-btn familias__icon-btn--danger'
                    title='Eliminar familia'
                    aria-label='Eliminar familia'
                    onClick={() => handleDelete(familia)}
                  >
                    <span className='material-symbols-rounded'>delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className='familias__state'>
              <p>No hay familias registradas</p>
              <span>Crea la primera con "Nueva familia"</span>
            </div>
          )}
        </div>
      </div>
      <ModalFamilias selectedFamilia={selectedFamilia} onSaved={fetchFamilias} />
    </div>
  )
}

export default Familias
