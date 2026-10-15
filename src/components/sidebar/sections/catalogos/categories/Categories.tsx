import React, { useState, useEffect, useCallback, useRef } from 'react'
import './Categories.css'
import { useDispatch } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import ModalCategories from './ModalCategories'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId, categoryId } from '../../../../../constants/category'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
import Swal from 'sweetalert2'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'

const LS_COMPANY = 'categories-picker-company-id'

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([])
  const [familias, setFamilias] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [companyId, setCompanyId] = useState<number | null>(() => {
    const saved = localStorage.getItem(LS_COMPANY)
    return saved ? Number(saved) : null
  })
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [parentFilter, setParentFilter] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const dispatch = useDispatch()

  const handleModalChange = (value: string) => {
    dispatch(modal(value))
  }

  const handleDelete = async (category: any) => {
    const id = categoryId(category)
    if (id == null) {
      Swal.fire({ icon: 'warning', title: 'Categoría sin ID' })
      return
    }

    const result = await Swal.fire({
      title: '¿Eliminar categoría?',
      text: `Se eliminará "${category.title}" y todas sus subcategorías. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#586ae9',
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
        title: 'Categoría eliminada',
        text: 'La categoría se eliminó correctamente.',
        confirmButtonColor: '#586ae9',
      })
      fetchCategories()
    } catch (err: any) {
      console.error('Error al eliminar categoría:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.response?.data?.message ?? err?.message ?? 'No se pudo eliminar la categoría',
        confirmButtonColor: '#586ae9',
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
      const token = localStorage.getItem('token-fixora')
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

  const flattenCategories = (nodes: any[], parent = null): any[] => {
    let result: any[] = []
    for (const node of nodes) {
      result.push({ ...node, parent })
      if (node.subcategories && node.subcategories.length > 0) {
        result = result.concat(flattenCategories(node.subcategories, node))
      }
    }
    return result
  }

  const fetchingRef = useRef(false)

  const fetchCategories = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token-fixora')
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
      const allCats = flattenCategories(roots)
      const onlyCats = allCats.filter(c => c.level >= 2 || String(c.type ?? '').toUpperCase() === 'CATEGORY')
      setCategories(onlyCats)
    } catch (error) {
      console.error('Error al cargar categorías:', error)
      setCategories([])
    } finally {
      setIsLoading(false)
      fetchingRef.current = false
    }
  }, [branchId, companyId])

  useEffect(() => {
    fetchFamilias()
  }, [fetchFamilias])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const filteredCategories = categories.filter((c: any) => {
    if (parentFilter !== 'ALL' && String(c.parentId ?? c.parent?.id) !== parentFilter) {
      return false
    }
    if (!debouncedSearch.trim()) return true
    const q = debouncedSearch.toLowerCase()
    const title = String(c.title ?? '').toLowerCase()
    const description = String(c.description ?? '').toLowerCase()
    return title.includes(q) || description.includes(q)
  })

  return (
    <div className='categories'>
      <div className='categories__container'>
        <div className='categories__header'>
          <div className='categories__header-left'>
            <CategoriesStorePicker branchId={branchId} onBranchIdChange={persistBranchId} onCompanyIdChange={persistCompanyId} />
            <div className='categories__search'>
              <span className='categories__search-icon material-symbols-rounded' aria-hidden>search</span>
              <input
                className='inputs__general categories__search-input'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type='text'
                placeholder='Buscar categoría'
                aria-label='Buscar categorías'
              />
            </div>
            <select
              className='inputs__general categories__filter'
              value={parentFilter}
              onChange={(e) => setParentFilter(e.target.value)}
              aria-label='Filtrar por categoría padre'
            >
              <option value='ALL'>Todas las categorías</option>
              {familias.map((f) => (
                <option key={f.id} value={String(f.id)}>
                  {f.title}
                </option>
              ))}
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <button
            className='btn__general-primary'
            onClick={() => {
              setSelectedCategory(null)
              handleModalChange('categories-modal')
            }}
            disabled={familias.length === 0}
            title={familias.length === 0 ? 'Primero debes crear una familia' : undefined}
          >
            Nueva categoría
          </button>
        </div>

        {/* La tabla siempre se ve; el skeleton va dentro */}
        <div className='categories__list'>
          <div className='categories__row categories__row--head'>
            <span>Categoría</span>
            <span>Padre</span>
            <span>Subcategorías</span>
            <span>Estado</span>
            <span className='categories__col-actions'>Acciones</span>
          </div>

          {isLoading ? (
            <TableSkeleton rowClassName='categories__row' cols={[{ avatar: true }, { pill: true, width: '90px' }, { width: '40%' }, { pill: true, width: '60px' }, { actions: 2 }]} />
          ) : filteredCategories.length > 0 ? (
            filteredCategories.map((category: any, index: number) => (
              <div className='categories__row' key={category.id ?? index}>
                <div className='categories__cell categories__cell--name' data-label='Categoría'>
                  {category.image ? (
                    <img src={category.image} alt={category.title} className='categories__thumb' />
                  ) : (
                    <span className='categories__thumb categories__thumb--empty material-symbols-rounded'>sell</span>
                  )}
                  <div className='categories__name-text'>
                    <strong>{category.title}</strong>
                    {category.description && <span>{category.description}</span>}
                  </div>
                </div>
                <div className='categories__cell' data-label='Padre'>
                  <span className='categories__tag'>{category.parent?.title || 'Sin padre'}</span>
                </div>
                <div className='categories__cell' data-label='Subcategorías'>
                  {category.subcategories?.length || 0}
                </div>
                <div className='categories__cell' data-label='Estado'>
                  <span className={`categories__badge ${category.status === 'ACTIVE' ? 'categories__badge--active' : 'categories__badge--inactive'}`}>
                    {category.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className='categories__cell categories__col-actions'>
                  <button
                    type='button'
                    className='categories__icon-btn'
                    title='Editar categoría'
                    aria-label='Editar categoría'
                    onClick={() => {
                      setSelectedCategory(category)
                      handleModalChange('categories-modal-update')
                    }}
                  >
                    <span className='material-symbols-rounded'>edit</span>
                  </button>
                  <button
                    type='button'
                    className='categories__icon-btn categories__icon-btn--danger'
                    title='Eliminar categoría'
                    aria-label='Eliminar categoría'
                    onClick={() => handleDelete(category)}
                  >
                    <span className='material-symbols-rounded'>delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className='categories__state'>
              <p>No hay categorías registradas</p>
              {familias.length === 0 && <span>Primero debes crear una familia</span>}
            </div>
          )}
        </div>
      </div>
      <ModalCategories
        familias={familias}
        categories={categories}
        selectedCategory={selectedCategory}
        onSaved={fetchCategories}
      />
    </div>
  )
}

export default Categories
