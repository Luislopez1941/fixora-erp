import React, { useCallback, useEffect, useMemo, useState } from 'react'
import './Articles.css'
import Modal from './Modal'
import './Modal.css'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import { setArticles, updateArticles } from '../../../../../redux/state/Articles'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId } from '../../../../../constants/category'
import CategoriesStorePicker from '../../categories/CategoriesStorePicker'
import Swal from 'sweetalert2'

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem('categories-picker-company-id'))
  return !Number.isNaN(id) && id > 0 ? id : null
}

const normalizeItemList = (res: unknown): any[] => {
  if (Array.isArray(res)) return res
  if (res && typeof res === 'object' && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: any[] }).data
  }
  return []
}

const getUnitLabel = (item: any): string => {
  const linked =
    item.productUnits?.find((pu: any) => pu.predetermined) ?? item.productUnits?.[0]
  const unit = linked?.unit
  if (!unit) return '—'
  return `${unit.name} (${unit.symbol})`
}

const getWarehousesLabel = (item: any): string => {
  const stores =
    item.stores ??
    (item.productStores ?? []).map((ps: any) => ps.store ?? { name: ps.name })
  if (stores.length === 0) return '—'
  if (stores.length === 1) {
    return stores[0]?.name ?? '1 almacén'
  }
  return `${stores.length} almacenes`
}

const Articles: React.FC = () => {
  const dispatch = useDispatch()
  const articles = useSelector((state: any) => state.articles.articles)
  const token = localStorage.getItem('token-eco')

  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const setModal = (value: string) => {
    dispatch(modal(value))
  }

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
    localStorage.setItem('categories-picker-branch-id', String(id))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  const fetchArticles = useCallback(async () => {
    const resolvedCompanyId = companyId ?? readCompanyId()
    if (!token || !resolvedCompanyId) {
      dispatch(setArticles([]))
      return
    }

    setLoading(true)
    try {
      const result: any = await APIs.getItemList(token, {
        companyId: resolvedCompanyId,
        branchId: branchId > 0 ? branchId : undefined,
      })
      const filtered = normalizeItemList(result).filter((item: any) => item.type === 'ARTICLE')
      dispatch(setArticles(filtered))
    } catch (error) {
      console.error('Error al cargar artículos:', error)
      dispatch(setArticles([]))
    } finally {
      setLoading(false)
    }
  }, [branchId, companyId, dispatch, token])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const filteredArticles = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    const list = articles ?? []
    if (!q) return list
    return list.filter((item: any) => {
      const name = String(item.name ?? '').toLowerCase()
      const code = String(item.code ?? '').toLowerCase()
      const desc = String(item.description ?? '').toLowerCase()
      const category = String(item.category?.title ?? item.category?.name ?? '').toLowerCase()
      const unit = getUnitLabel(item).toLowerCase()
      return (
        name.includes(q) ||
        code.includes(q) ||
        desc.includes(q) ||
        category.includes(q) ||
        unit.includes(q)
      )
    })
  }, [articles, debouncedSearch])

  const updateModalArticles = async (item: any) => {
    if (!token || item?.id == null) {
      dispatch(updateArticles(item))
      setModal('articles-modal-update')
      return
    }

    try {
      const full: any = await APIs.getItemById(item.id, token)
      const data = full?.data ?? full ?? item
      dispatch(updateArticles(data))
    } catch {
      dispatch(updateArticles(item))
    }
    setModal('articles-modal-update')
  }

  const handleDelete = async (item: any) => {
    const id = item.id
    if (id == null) {
      Swal.fire({ icon: 'warning', title: 'Artículo sin ID' })
      return
    }

    const result = await Swal.fire({
      title: '¿Eliminar artículo?',
      text: `Se eliminará "${item.name}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) return

    try {
      await APIs.deleteItem(id, token as string)
      Swal.fire({
        icon: 'success',
        title: 'Artículo eliminado',
        text: 'El artículo se eliminó correctamente.',
      })
      fetchArticles()
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.response?.data?.message ?? err?.message ?? 'No se pudo eliminar el artículo.',
      })
    }
  }

  return (
    <div className='articles-page'>
      <div className='articles-page__container'>
        <div className='articles-page__header'>
          <div className='articles-page__toolbar'>
            <div className='articles-page__toolbar-left'>
              <CategoriesStorePicker
                branchId={branchId}
                onCompanyIdChange={setCompanyId}
                onBranchIdChange={persistBranchId}
              />
            </div>
            <div className='articles-page__toolbar-right'>
              <div className='articles-page__search-field'>
                <div className='articles-page__search-field__input-wrap'>
                  <input
                    className='inputs__general'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    type='text'
                    placeholder='Buscar artículo'
                    aria-label='Buscar artículos'
                  />
                </div>
                <div className='articles-page__search-field__icon' aria-hidden>
                  <svg xmlns='http://www.w3.org/2000/svg' height='22px' viewBox='0 -960 960 960' width='22px' fill='#f5f6f7'>
                    <path d='M380-320q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l224 224q11 11 11 28t-11 28q-11 11-28 11t-28-11L532-372q-30 24-69 38t-83 14Zm0-80q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z' />
                  </svg>
                </div>
              </div>
              <button
                className='btn__general-primary articles-page__btn-create'
                type='button'
                onClick={() => setModal('articles-modal')}
              >
                Nuevo artículo
              </button>
            </div>
          </div>
        </div>

        <div className='table__articles-page'>
          <div>
            {loading ? (
              <p className='text articles-page__loading'>Cargando artículos...</p>
            ) : filteredArticles.length > 0 ? (
              <div className='table__numbers'>
                <p className='text'>Total de artículos</p>
                <div className='quantities_tables'>{filteredArticles.length}</div>
              </div>
            ) : (
              <p className='text'>
                {readCompanyId() || companyId
                  ? 'No hay artículos registrados'
                  : 'Selecciona una empresa para ver artículos'}
              </p>
            )}
          </div>

          <div className='table__head'>
            <div className='thead'>
              <div className='th'>
                <p>Artículo</p>
              </div>
              <div className='th'>
                <p>Código</p>
              </div>
              <div className='th'>
                <p>Categoría</p>
              </div>
              <div className='th'>
                <p>Unidad</p>
              </div>
              <div className='th'>
                <p>Almacenes</p>
              </div>
              <div className='th'>
                <p>Descuento</p>
              </div>
              <div className='th'>
                <p>Acciones</p>
              </div>
            </div>
          </div>

          <div className='table__body'>
            {!loading && filteredArticles.length > 0 ? (
              filteredArticles.map((item: any) => (
                <div className='tbody__container' key={item.id}>
                  <div className='tbody'>
                    <div className='td articles-page__name-cell'>
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt=''
                          className='articles-page__thumb'
                        />
                      ) : (
                        <div className='articles-page__thumb articles-page__thumb--empty' aria-hidden>
                          <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z' />
                          </svg>
                        </div>
                      )}
                      <div className='articles-page__info'>
                        <p className='articles-page__name'>{item.name}</p>
                        {item.description ? (
                          <p className='articles-page__desc'>{item.description}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className='td'>
                      <span className='articles-page__code'>{item.code || '—'}</span>
                    </div>
                    <div className='td'>
                      <p>{item.category?.title ?? item.category?.name ?? 'Sin categoría'}</p>
                    </div>
                    <div className='td'>
                      <span className='articles-page__unit'>{getUnitLabel(item)}</span>
                    </div>
                    <div className='td'>
                      <span className='articles-page__warehouse'>{getWarehousesLabel(item)}</span>
                    </div>
                    <div className='td'>
                      {Number(item.discountPercent ?? 0) > 0
                        ? `${Number(item.discountPercent)}%`
                        : '—'}
                    </div>
                    <div className='td articles-page__actions-cell'>
                      <div
                        className='edit-icon'
                        title='Editar artículo'
                        aria-label='Editar artículo'
                        onClick={() => updateModalArticles(item)}
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
                        title='Eliminar artículo'
                        aria-label='Eliminar artículo'
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
                    ? 'No se encontraron artículos con ese criterio'
                    : 'No hay artículos registrados para esta empresa'}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <Modal />
    </div>
  )
}

export default Articles
