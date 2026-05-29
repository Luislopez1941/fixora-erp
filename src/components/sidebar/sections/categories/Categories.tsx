import React, { useCallback, useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import './Categories.css'
import Modal from './Modal'
import './Modal.css'
import { useDispatch } from 'react-redux'
import { modal } from '../../../../redux/state/modals'
import { useSelector } from 'react-redux'
import { setCategories, updateCategories } from '../../../../redux/state/Categories'
import APIs from '../../../../services/APIs'
import CategoriesStorePicker from './CategoriesStorePicker'
import {
  CATEGORY_STATUS_LABELS,
  normalizeCategoryList,
  categoryId,
  readCategoryBranchId,
} from '../../../../constants/category'

const formatCategoryDate = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

const Categories: React.FC = () => {
  const dispatch = useDispatch()
  const categories = useSelector((state: any) => state.categories.categories)

  const setModal = (value: any) => {
    dispatch(modal(value))
  }

  const token = localStorage.getItem('token-eco')

  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [search, setSearch] = useState<string>('')

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
  }, [])

  useEffect(() => {
    localStorage.setItem('categories-store-id', String(branchId))
  }, [branchId])

  useEffect(() => {
    let cancelled = false
    const bid = Number(branchId)
    ;(async () => {
      if (!token || Number.isNaN(bid) || bid < 1) {
        if (!cancelled) dispatch(setCategories([]))
        return
      }
      try {
        const result: any = await APIs.getCategoryList(bid, token)
        const list = normalizeCategoryList(result)
        if (!cancelled) dispatch(setCategories(list))
      } catch {
        if (!cancelled) dispatch(setCategories([]))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [branchId, dispatch, token])


  const updateModalCategories = (item: any) => {
    dispatch(updateCategories(item))
    setModal('categories-modal-update')
  }

  const handleDelete = async (item: any) => {
    const id = categoryId(item)
    if (id == null) {
      Swal.fire({ title: 'Error', text: 'Categoría sin ID', icon: 'error' })
      return
    }

    const result = await Swal.fire({
      title: '¿Eliminar categoría?',
      text: `Se eliminará "${item.title}" y todas sus subcategorías. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) return

    try {
      await APIs.deleteCategory(id, token as string)
      Swal.fire({
        title: 'Eliminado',
        text: `Categoría "${item.title}" eliminada correctamente`,
        icon: 'success',
      })
      // Recargar lista
      const bid = Number(branchId)
      if (!Number.isNaN(bid) && bid >= 1) {
        const result: any = await APIs.getCategoryList(bid, token as string)
        dispatch(setCategories(normalizeCategoryList(result)))
      }
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: err?.response?.data?.message ?? err?.message ?? 'No se pudo eliminar la categoría',
        icon: 'error',
      })
    }
  }

  const filteredCategories = (categories ?? []).filter((item: any) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const title = String(item.title ?? '').toLowerCase()
    return title.includes(q)
  })


  return (
    <div className='categories'>
      <div className='categories__container'>
        <div className='row__one'>
          <div className='categories-toolbar'>
            <CategoriesStorePicker branchId={branchId} onBranchIdChange={persistBranchId} />
            <div className='categories-toolbar__search categories__search-inline'>
              <div className='categories__search-field'>
                <div className='categories__search-field__input-wrap'>
                  <input
                    className='inputs__general'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    type='text'
                    placeholder='Buscar por título'
                    aria-label='Buscar categorías'
                  />
                </div>
                <div className='categories__search-field__icon' aria-hidden>
                  <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#f5f6f7'>
                    <path d='M380-320q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l224 224q11 11 11 28t-11 28q-11 11-28 11t-28-11L532-372q-30 24-69 38t-83 14Zm0-80q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z' />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className='categories__row-actions'>
            <button className='btn__general-purple' type='button' onClick={() => setModal('categories-modal')}>
              Nueva categoría
            </button>
          </div>
        </div>
        <div className='table__categories'>
          <div>
            {categories ? (
              <div className='table__numbers'>
                <p className='text'>Total (vista)</p>
                <div className='quantities_tables'>{filteredCategories.length}</div>
              </div>
            ) : (
              <p className='text'>No hay categorías</p>
            )}
          </div>
          <div className='table__head'>
            <div className='thead'>
              <div className='th'>
                <p>Nombre</p>
              </div>
              <div className='th'>
                <p>Imagen</p>
              </div>
              <div className='th'>
                <p>Estado</p>
              </div>
              <div className='th'>
                <p>Subcategorías</p>
              </div>
              <div className='th'>
                <p>Acciones</p>
              </div>
            </div>
          </div>
          {filteredCategories.length > 0 ? (
            <div className='table__body'>
              {filteredCategories.map((item: any, index: number) => {
                const id = categoryId(item)
                const st = item.status
                const active = st === 'ACTIVE' || item.state === true
                const subCount = Array.isArray(item.subcategories) ? item.subcategories.length : 0
                return (
                  <div className='tbody__container' key={id ?? index}>
                    <div className='tbody'>
                      <div className='td td--name'>
                        <span className='td__title'>{item.title}</span>
                        {formatCategoryDate(item.createdAt) && (
                          <span className='td__meta'>{formatCategoryDate(item.createdAt)}</span>
                        )}
                      </div>
                      <div className='td td--image'>
                        {item.image ? (
                          <img
                            className='td__thumb'
                            src={item.image}
                            alt={item.title}
                          />
                        ) : (
                          <span className='td__empty'>—</span>
                        )}
                      </div>
                      <div className='td td--status'>
                        {active ? (
                          <span className='activated-status'>
                            {CATEGORY_STATUS_LABELS.ACTIVE}
                          </span>
                        ) : (
                          <span className='idle-status'>
                            {CATEGORY_STATUS_LABELS.INACTIVE}
                          </span>
                        )}
                      </div>
                      <div className='td td--count'>{subCount}</div>
                      <div className='td td--actions'>
                        <button
                          className='btn__edit-table_button'
                          type='button'
                          onClick={() => updateModalCategories(item)}
                        >
                          Editar
                        </button>
                        <button
                          className='btn__general-danger categories__delete-btn'
                          type='button'
                          onClick={() => handleDelete(item)}
                          title='Eliminar categoría'
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className='text'>No hay categorías que mostrar</p>
          )}
        </div>
      </div>
      <Modal />
    </div>
  )
}

export default Categories
