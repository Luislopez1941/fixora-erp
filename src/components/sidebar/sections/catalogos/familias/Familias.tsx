import React, { useState, useEffect, useCallback, useRef } from 'react'
import './Familias.css'
import { useDispatch } from "react-redux";
import { modal } from '../../../../../redux/state/modals';
import ModalFamilias from './ModalFamilias';
import APIs from '../../../../../services/APIs';
import { readCategoryBranchId, categoryId } from '../../../../../constants/category';
import CategoriesStorePicker from '../../categories/CategoriesStorePicker';
import Swal from 'sweetalert2'

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
  const [isLoading, setIsLoading] = useState(false)
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
      cancelButtonColor: '#5869e9',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem('token-eco')
      if (!token) {
        Swal.fire({ icon: 'warning', title: 'Sesión', text: 'No hay token de autenticación' })
        return
      }
      await APIs.deleteCategory(id, token)
      Swal.fire({
        icon: 'success',
        title: 'Familia eliminada',
        text: 'La familia se eliminó correctamente.',
        confirmButtonColor: '#5869e9',
      })
      fetchFamilias()
    } catch (err: any) {
      console.error('Error al eliminar familia:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.response?.data?.message ?? err?.message ?? 'No se pudo eliminar la familia',
        confirmButtonColor: '#5869e9',
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
      const token = localStorage.getItem('token-eco')
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

  return (
    <div className='familias'>
      <div className='familias__container'>
        <div className='familias__header'>
          <div className='familias__toolbar'>
            <div className='familias__toolbar-left'>
              <CategoriesStorePicker branchId={branchId} onBranchIdChange={persistBranchId} onCompanyIdChange={persistCompanyId} />
            </div>
            <div className='familias__toolbar-right'>
            <div className='familias__search-field'>
              <div className='familias__search-field__input-wrap'>
                <input
                  className='inputs__general'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type='text'
                  placeholder='Buscar familia'
                  aria-label='Buscar familias'
                />
              </div>
              <div className='familias__search-field__icon' aria-hidden>
                <svg xmlns='http://www.w3.org/2000/svg' height='22px' viewBox='0 -960 960 960' width='22px' fill='#f5f6f7'>
                  <path d='M380-320q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l224 224q11 11 11 28t-11 28q-11 11-28 11t-28-11L532-372q-30 24-69 38t-83 14Zm0-80q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z' />
                </svg>
              </div>
            </div>
            <select
              className='inputs__general familias__filter'
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'ALL' | 'ARTICLE' | 'SERVICE')}
            >
              <option value='ALL'>Todos</option>
              <option value='ARTICLE'>Artículos</option>
              <option value='SERVICE'>Servicios</option>
            </select>
            <button
              className='btn__general-primary familias__btn-create'
              onClick={() => handleModalChange('familias-modal')}
            >
              Nueva familia
            </button>
            </div>
          </div>
        </div>

        <div className='table__familias'>
          <div>
            {familias.length > 0 ? (
              <div className='table__numbers'>
                <p className='text'>Total de Familias</p>
                <div className='quantities_tables'>{familias.length}</div>
              </div>
            ) : (
              <p className='text'>No hay familias creadas</p>
            )}
          </div>

          <div className='table__head'>
            <div className='thead'>
              <div className='th'>
                <p>Nombre</p>
              </div>
              <div className='th'>
                <p>Tipo de Items</p>
              </div>
              <div className='th'>
                <p>Contenedores</p>
              </div>
              <div className='th'>
                <p>Estado</p>
              </div>
              <div className='th'>
                <p>Acciones</p>
              </div>
            </div>
          </div>

          <div className='table__body'>
            {isLoading ? (
              <div className='familias__loading'>
                <div className='familias__spinner' />
                <p>Cargando familias...</p>
              </div>
            ) : familias.length > 0 ? (
              familias.map((familia: any, index: number) => (
                <div className='tbody__container' key={index}>
                  <div className='tbody'>
                    <div className='td'>
                      <div className='familia__info'>
                        {familia.image && (
                          <img src={familia.image} alt={familia.title} className='familia__image' />
                        )}
                        <div>
                          <p className='familia__title'>{familia.title}</p>
                          {familia.description && (
                            <p className='familia__description'>{familia.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='td'>
                      <p>
                        {familia.allowedItemType === 'ARTICLE' && 'Artículos'}
                        {familia.allowedItemType === 'SERVICE' && 'Servicios'}
                        {!familia.allowedItemType && 'Ambos'}
                      </p>
                    </div>
                    <div className='td'>
                      <p>{familia.subcategories?.length || 0} contenedores</p>
                    </div>
                    <div className='td'>
                      <div className={`status ${familia.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {familia.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>
                    <div className='td familias__actions-cell'>
                      <button
                        className='btn__general-purple familias__btn-edit'
                        onClick={() => {
                          setSelectedFamilia(familia)
                          handleModalChange('familias-modal-update');
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type='button'
                        className='familias__btn-delete'
                        title='Eliminar familia'
                        aria-label='Eliminar familia'
                        onClick={() => handleDelete(familia)}
                      >
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512' aria-hidden>
                          <path
                            fill='currentColor'
                            d='M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64s14.3 32 32 32H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32l21.2 339c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z'
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className='empty__state'>
                <p>No hay familias registradas</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ModalFamilias selectedFamilia={selectedFamilia} onSaved={fetchFamilias} />
    </div>
  )
}

export default Familias
