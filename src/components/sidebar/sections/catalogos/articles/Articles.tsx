import React, { useCallback, useEffect, useRef, useState } from 'react'
import './Articles.css'
import Modal from './Modal'
import './Modal.css'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import { setArticles, updateArticles } from '../../../../../redux/state/Articles'
import { loadArticleDetail } from './articleDetail'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId } from '../../../../../constants/category'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
import Swal from 'sweetalert2'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'
import Pagination from '../../../../general/pagination/Pagination'
import { Link } from 'react-router-dom'

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
  const token = localStorage.getItem('token-fixora')

  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const userState = useSelector((state: any) => state.user)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 50
  const requestRef = useRef(0)

  const setModal = (value: string) => {
    dispatch(modal(value))
  }

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
    localStorage.setItem('categories-picker-branch-id', String(id))
  }, [])

  const persistCompanyId = useCallback((id: number) => {
    setCompanyId(id)
    localStorage.setItem('categories-picker-company-id', String(id))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  // Cada página es una petición: el servidor filtra (búsqueda), ordena y entrega solo los 50 de esa página
  const fetchArticles = useCallback(async () => {
    // Empresa del selector, la guardada o, si no hay ninguna vinculada, la activa de la sesión.
    const resolvedCompanyId =
      companyId ?? readCompanyId() ?? userState?.activeCompanyId ?? userState?.companyId ?? userState?.companyIds?.[0] ?? null
    if (!token || !resolvedCompanyId) {
      dispatch(setArticles([]))
      setTotal(0)
      setLoading(false)
      return
    }

    const requestId = ++requestRef.current
    setLoading(true)
    try {
      const result: any = await APIs.getItemList(token, {
        companyId: resolvedCompanyId,
        branchId: branchId > 0 ? branchId : undefined,
        page,
        pageSize,
        search: debouncedSearch,
        type: 'ARTICLE',
      })
      if (requestId !== requestRef.current) return // llegó una respuesta más nueva: esta se descarta
      const rows = normalizeItemList(result)
      const pagination = result?.pagination ?? result?.data?.pagination
      dispatch(setArticles(rows))
      setTotal(pagination?.total ?? rows.length)
      // Si la página pedida ya no existe (se borraron artículos), regresa a la última
      if (pagination?.pages && page > pagination.pages) setPage(pagination.pages)
    } catch (error) {
      if (requestId !== requestRef.current) return
      console.error('Error al cargar artículos:', error)
      dispatch(setArticles([]))
      setTotal(0)
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [branchId, companyId, dispatch, token, userState?.activeCompanyId, page, debouncedSearch])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  // Al buscar o cambiar de empresa/sucursal se vuelve a la primera página
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, branchId, companyId])

  // El modal avisa cuando crea o edita un artículo: se vuelve a pedir la página actual
  useEffect(() => {
    const refresh = () => fetchArticles()
    window.addEventListener('articles:changed', refresh)
    return () => window.removeEventListener('articles:changed', refresh)
  }, [fetchArticles])

  // El modal se abre al instante con un "Cargando…" encima y se llena cuando llega el detalle completo del artículo
  const updateModalArticles = (item: any) => {
    if (!token || item?.id == null) {
      dispatch(updateArticles(item))
      setModal('articles-modal-update')
      return
    }
    setModal('articles-modal-update')
    loadArticleDetail(item, dispatch)
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
          <div className='articles-page__header-left'>
            <CategoriesStorePicker
              branchId={branchId}
              onCompanyIdChange={persistCompanyId}
              onBranchIdChange={persistBranchId}
            />
            <div className='articles-page__search'>
              <span className='articles-page__search-icon material-symbols-rounded' aria-hidden>search</span>
              <input
                className='inputs__general articles-page__search-input'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type='text'
                placeholder='Buscar artículo'
                aria-label='Buscar artículos'
              />
            </div>
          </div>
          <div className='articles-page__toolbar-actions'>
            {/* Plantillas de variantes (Talla + Color, Sabor + Presentación…) que se asignan a los artículos */}
            <Link className='btn__general-secondary articles-page__templates-link' to='/auth/catalogos/productos-y-servicios/variantes'>
              <span className='material-symbols-rounded' aria-hidden>dashboard_customize</span> Plantillas
            </Link>
            <button className='btn__general-primary' type='button' onClick={() => setModal('articles-modal')}>
              Nuevo artículo
            </button>
          </div>
        </div>

        {/* La tabla siempre se ve; el skeleton va dentro */}
        <div className='articles-page__list'>
          <div className='articles-page__row articles-page__row--head'>
            <span>Código</span>
            <span>Artículo</span>
            <span>Categoría</span>
            <span>Unidad</span>
            <span>Almacenes</span>
            <span>Descuento</span>
            <span className='articles-page__col-actions'>Acciones</span>
          </div>

          {loading ? (
            <TableSkeleton rowClassName='articles-page__row' cols={[{ pill: true, width: '64px' }, { width: '70%' }, { width: '60%' }, { width: '55%' }, { width: '50%' }, { width: '30%' }, { actions: 2 }]} />
          ) : (articles ?? []).length > 0 ? (
            (articles ?? []).map((item: any) => (
              <div className='articles-page__row' key={item.id}>
                <div className='articles-page__cell' data-label='Código'>
                  {item.code ? <span className='articles-page__tag'>{item.code}</span> : '—'}
                </div>
                <div className='articles-page__cell articles-page__cell--name' data-label='Artículo'>
                  <strong>{item.name}</strong>
                  {item.description ? <span>{item.description}</span> : null}
                </div>
                <div className='articles-page__cell' data-label='Categoría'>
                  {item.category?.title ?? item.category?.name ?? 'Sin categoría'}
                </div>
                <div className='articles-page__cell articles-page__cell--muted' data-label='Unidad'>
                  {getUnitLabel(item)}
                </div>
                <div className='articles-page__cell articles-page__cell--muted' data-label='Almacenes'>
                  {getWarehousesLabel(item)}
                </div>
                <div className='articles-page__cell' data-label='Descuento'>
                  {Number(item.discountPercent ?? 0) > 0 ? `${Number(item.discountPercent)}%` : '—'}
                </div>
                <div className='articles-page__cell articles-page__col-actions'>
                  <button
                    type='button'
                    className='articles-page__icon-btn'
                    title='Editar artículo'
                    aria-label='Editar artículo'
                    onClick={() => updateModalArticles(item)}
                  >
                    <span className='material-symbols-rounded'>edit</span>
                  </button>
                  <button
                    type='button'
                    className='articles-page__icon-btn articles-page__icon-btn--danger'
                    title='Eliminar artículo'
                    aria-label='Eliminar artículo'
                    onClick={() => handleDelete(item)}
                  >
                    <span className='material-symbols-rounded'>delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className='articles-page__state'>
              <p>
                {debouncedSearch.trim()
                  ? 'No se encontraron artículos con ese criterio'
                  : 'No hay artículos registrados'}
              </p>
            </div>
          )}
        </div>

        {total > 0 && (
          <Pagination
            total={total}
            page={page}
            pageSize={pageSize}
            onPage={(p) => {
              setPage(p)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            noun='artículos'
          />
        )}
      </div>
      <Modal />
    </div>
  )
}

export default Articles
