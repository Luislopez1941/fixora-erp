import React, { useState, useEffect, useCallback, useRef } from 'react'
import './Contenedores.css'
import { useDispatch } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import ModalContenedores from './ModalContenedores'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId, categoryId } from '../../../../../constants/category'
import CategoriesStorePicker from '../../categories/CategoriesStorePicker'
import Swal from 'sweetalert2'

const LS_COMPANY = 'categories-picker-company-id'

const Contenedores: React.FC = () => {
  const [contenedores, setContenedores] = useState<any[]>([])
  const [familias, setFamilias] = useState<any[]>([])
  const [selectedContenedor, setSelectedContenedor] = useState<any>(null)
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [companyId, setCompanyId] = useState<number | null>(() => {
    const saved = localStorage.getItem(LS_COMPANY)
    return saved ? Number(saved) : null
  })
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [familiaFilter, setFamiliaFilter] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useDispatch()

  const handleModalChange = (value: string) => {
    dispatch(modal(value))
  }

  const handleDelete = async (contenedor: any) => {
    const id = categoryId(contenedor)
    if (id == null) {
      Swal.fire({ icon: 'warning', title: 'Contenedor sin ID' })
      return
    }

    const result = await Swal.fire({
      title: '¿Eliminar contenedor?',
      text: `Se eliminará "${contenedor.title}" y todas sus subcategorías. Esta acción no se puede deshacer.`,
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
        title: 'Contenedor eliminado',
        text: 'El contenedor se eliminó correctamente.',
        confirmButtonColor: '#5869e9',
      })
      fetchContenedores()
    } catch (err: any) {
      console.error('Error al eliminar contenedor:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.response?.data?.message ?? err?.message ?? 'No se pudo eliminar el contenedor',
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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  const fetchFamilias = useCallback(async () => {
    try {
      const token = localStorage.getItem('token-eco')
      if (!token) return

      const filters: Record<string, unknown> = {}
      if (branchId && !isNaN(branchId) && branchId >= 1) {
        filters.branchId = branchId
      } else if (companyId != null && !isNaN(companyId)) {
        filters.companyId = companyId
      }

      const response: any = await APIs.filterFamilias(filters, token)
      const list = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : []
      setFamilias(list)
    } catch {
      setFamilias([])
    }
  }, [branchId, companyId])

  const flattenContenedores = (roots: any[]): any[] => {
    const list: any[] = []
    for (const familia of roots) {
      const subs = familia.subcategories ?? []
      for (const sub of subs) {
        const isContenedor =
          sub.level === 2 || String(sub.type ?? '').toUpperCase() === 'CONTENEDOR'
        if (isContenedor) {
          list.push({ ...sub, parent: sub.parent ?? familia })
        }
      }
    }
    return list
  }

  const fetchingRef = useRef(false)

  const fetchContenedores = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token-eco')
      if (!token) return

      const response: any = await APIs.getCategoryList(
        branchId && !isNaN(branchId) && branchId >= 1 ? branchId : undefined,
        companyId != null && !isNaN(companyId) ? companyId : undefined,
        token
      )
      const roots = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : []
      setContenedores(flattenContenedores(roots))
    } catch (error) {
      console.error('Error al cargar contenedores:', error)
      setContenedores([])
    } finally {
      setIsLoading(false)
      fetchingRef.current = false
    }
  }, [branchId, companyId])

  useEffect(() => {
    fetchFamilias()
  }, [fetchFamilias])

  useEffect(() => {
    fetchContenedores()
  }, [fetchContenedores])

  const filteredContenedores = contenedores.filter((c: any) => {
    if (familiaFilter !== 'ALL' && String(c.parentId ?? c.parent?.id) !== familiaFilter) {
      return false
    }
    if (!debouncedSearch.trim()) return true
    const q = debouncedSearch.toLowerCase()
    const title = String(c.title ?? '').toLowerCase()
    const description = String(c.description ?? '').toLowerCase()
    return title.includes(q) || description.includes(q)
  })

  return (
    <div className='contenedores'>
      <div className='contenedores__container'>
        <div className='contenedores__header'>
          <div className='contenedores__toolbar'>
            <div className='contenedores__toolbar-left'>
              <CategoriesStorePicker branchId={branchId} onBranchIdChange={persistBranchId} onCompanyIdChange={persistCompanyId} />
            </div>
            <div className='contenedores__toolbar-right'>
              <div className='contenedores__search-field'>
                <div className='contenedores__search-field__input-wrap'>
                  <input
                    className='inputs__general'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    type='text'
                    placeholder='Buscar contenedor'
                    aria-label='Buscar contenedores'
                  />
                </div>
                <div className='contenedores__search-field__icon' aria-hidden>
                  <svg xmlns='http://www.w3.org/2000/svg' height='22px' viewBox='0 -960 960 960' width='22px' fill='#f5f6f7'>
                    <path d='M380-320q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l224 224q11 11 11 28t-11 28q-11 11-28 11t-28-11L532-372q-30 24-69 38t-83 14Zm0-80q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z' />
                  </svg>
                </div>
              </div>
              <select
                className='inputs__general contenedores__filter'
                value={familiaFilter}
                onChange={(e) => setFamiliaFilter(e.target.value)}
              >
                <option value='ALL'>Todas las familias</option>
                {familias.map((f) => (
                  <option key={f.id} value={String(f.id)}>
                    {f.title}
                  </option>
                ))}
              </select>
              <button
                className='btn__general-primary contenedores__btn-create'
                onClick={() => {
                  setSelectedContenedor(null)
                  handleModalChange('contenedores-modal')
                }}
                disabled={familias.length === 0}
              >
                Nuevo contenedor
              </button>
            </div>
          </div>
        </div>

        <div className='table__contenedores'>
          <div>
            {filteredContenedores.length > 0 ? (
              <div className='table__numbers'>
                <p className='text'>Total de Contenedores</p>
                <div className='quantities_tables'>{filteredContenedores.length}</div>
              </div>
            ) : (
              <p className='text'>No hay contenedores creados</p>
            )}
          </div>

          <div className='table__head'>
            <div className='thead'>
              <div className='th'><p>Nombre</p></div>
              <div className='th'><p>Familia</p></div>
              <div className='th'><p>Subcategorías</p></div>
              <div className='th'><p>Estado</p></div>
              <div className='th'><p>Acciones</p></div>
            </div>
          </div>

          <div className='table__body'>
            {isLoading ? (
              <div className='contenedores__loading'>
                <div className='contenedores__spinner' />
                <p>Cargando contenedores...</p>
              </div>
            ) : filteredContenedores.length > 0 ? (
              filteredContenedores.map((contenedor: any, index: number) => (
                <div className='tbody__container' key={contenedor.id ?? index}>
                  <div className='tbody'>
                    <div className='td'>
                      <div className='contenedor__info'>
                        {contenedor.image && (
                          <img src={contenedor.image} alt={contenedor.title} className='contenedor__image' />
                        )}
                        <div>
                          <p className='contenedor__title'>{contenedor.title}</p>
                          {contenedor.description && (
                            <p className='contenedor__description'>{contenedor.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='td'>
                      <span className='contenedores__familia-badge'>
                        {contenedor.parent?.title || 'Sin familia'}
                      </span>
                    </div>
                    <div className='td'>
                      <p>{contenedor.subcategories?.length || 0} subcategorías</p>
                    </div>
                    <div className='td'>
                      <div className={`status ${contenedor.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {contenedor.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>
                    <div className='td contenedores__actions-cell'>
                      <button
                        className='btn__general-purple contenedores__btn-edit'
                        onClick={() => {
                          setSelectedContenedor(contenedor)
                          handleModalChange('contenedores-modal-update')
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type='button'
                        className='contenedores__btn-delete'
                        title='Eliminar contenedor'
                        aria-label='Eliminar contenedor'
                        onClick={() => handleDelete(contenedor)}
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
                <p>No hay contenedores registrados</p>
                {familias.length === 0 && (
                  <p className='empty__state-hint'>Primero debes crear una familia</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <ModalContenedores
        familias={familias}
        selectedContenedor={selectedContenedor}
        onSaved={fetchContenedores}
      />
    </div>
  )
}

export default Contenedores
