import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import './Inventory.css'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
import APIs from '../../../../../services/APIs'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'
import Pagination from '../../../../general/pagination/Pagination'
import { useCan } from '../../../../../core/permissions/useCan'
import { modal } from '../../../../../redux/state/modals'
import ArticleModal from '../../catalogos/articles/Modal'
import '../../catalogos/articles/Modal.css'
import { loadArticleDetail } from '../../catalogos/articles/articleDetail'
import { STATUS_CLASS } from './inventoryStatus'
import InventoryRow from './inventory-row/InventoryRow'
import ModalItemDetail from './modal-item-detail/ModalItemDetail'

const PAGE_SIZE = 30
/** Una página ya vista se reutiliza durante este tiempo (volver de página o de otra pantalla es instantáneo) */
const CACHE_TTL = 60_000

type PageData = { items: any[]; summary: any; total: number }
// Caché en memoria del módulo: sobrevive a salir y volver a la pantalla
const pageCache = new Map<string, { at: number; data: PageData }>()
const fresh = (key: string) => {
  const hit = pageCache.get(key)
  return hit && Date.now() - hit.at < CACHE_TTL ? hit.data : null
}

const Inventory: React.FC = () => {
  const dispatch = useDispatch()
  const can = useCan()
  const canEdit = can('catalogos.articles.manage')
  const modalState = useSelector((state: any) => state.modals)
  const [branchId, setBranchId] = useState(() => {
    const id = Number(localStorage.getItem('categories-picker-branch-id'))
    return !Number.isNaN(id) && id > 0 ? id : 0
  })
  const [companyId, setCompanyId] = useState<number | null>(() => {
    const id = Number(localStorage.getItem('categories-picker-company-id'))
    return !Number.isNaN(id) && id > 0 ? id : null
  })
  const [items, setItems] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const userState = useSelector((state: any) => state.user)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [total, setTotal] = useState(0)
  const requestRef = useRef(0)
  const [detail, setDetail] = useState<any | null>(null)
  const [editing, setEditing] = useState(false)

  const effectiveCompanyId: number | null =
    companyId ?? userState?.activeCompanyId ?? userState?.companyId ?? userState?.companyIds?.[0] ?? null

  // Los filtros en una sola clave. La página va ligada a esa clave: al cambiar un filtro la página vuelve a 1 en el mismo
  // render (antes un efecto la regresaba después y se disparaban DOS peticiones: la vieja página con el filtro nuevo y la 1).
  const filtersKey = JSON.stringify([effectiveCompanyId, branchId, statusFilter, debouncedSearch.trim()])
  const [pageState, setPageState] = useState({ key: filtersKey, page: 1 })
  const page = pageState.key === filtersKey ? pageState.page : 1
  const setPage = useCallback((p: number) => setPageState({ key: filtersKey, page: p }), [filtersKey])

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
    localStorage.setItem('categories-picker-branch-id', String(id))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  const requestFor = useCallback(
    (p: number) => ({
      companyId: effectiveCompanyId ?? undefined,
      branchId: branchId > 0 ? branchId : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page: p,
      pageSize: PAGE_SIZE,
      search: debouncedSearch.trim(),
    }),
    [effectiveCompanyId, branchId, statusFilter, debouncedSearch],
  )
  const cacheKey = (p: number) => `${filtersKey}|${p}`

  const fetchPage = useCallback(
    async (p: number): Promise<PageData> => {
      const response: any = await APIs.getInventory(requestFor(p))
      const data = {
        items: Array.isArray(response?.data) ? response.data : [],
        summary: response?.summary ?? null,
        total: response?.pagination?.total ?? 0,
      }
      pageCache.set(`${filtersKey}|${p}`, { at: Date.now(), data })
      return data
    },
    [requestFor, filtersKey],
  )

  // Cada página es una petición (el servidor entrega solo esos 30 y el resumen). Si la página ya está en caché se muestra al
  // instante; mientras llega una nueva se conservan los datos actuales (sin parpadeo de skeleton). Una respuesta vieja nunca
  // pisa a una nueva. Al terminar se pide en segundo plano la página siguiente.
  const fetchInventory = useCallback(async () => {
    if (!effectiveCompanyId) {
      setItems([])
      setSummary(null)
      setTotal(0)
      setLoading(false)
      return
    }
    const requestId = ++requestRef.current
    const cached = fresh(cacheKey(page))
    if (cached) {
      setItems(cached.items)
      setSummary(cached.summary)
      setTotal(cached.total)
      setLoading(false)
    } else {
      setLoading(true)
    }
    try {
      const data = cached ?? (await fetchPage(page))
      if (requestId !== requestRef.current) return
      setItems(data.items)
      setSummary(data.summary)
      setTotal(data.total)
      const pages = Math.ceil(data.total / PAGE_SIZE)
      if (page < pages && !fresh(cacheKey(page + 1))) fetchPage(page + 1).catch(() => undefined)
    } catch (error) {
      if (requestId !== requestRef.current) return
      console.error('Error al cargar inventario:', error)
      setItems([])
      setSummary(null)
      setTotal(0)
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId, filtersKey, page, fetchPage])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  const openDetail = useCallback((item: any) => setDetail(item), [])
  const closeDetail = useCallback(() => setDetail(null), [])

  // "Editar artículo" abre el mismo modal de edición de Artículos; al cerrarlo se refrescan los datos (pueden haber cambiado)
  const openEdit = useCallback(
    (item: any) => {
      setDetail(null)
      setEditing(true)
      dispatch(modal('articles-modal-update'))
      loadArticleDetail({ id: item.itemId, name: item.name, code: item.code }, dispatch)
    },
    [dispatch],
  )
  useEffect(() => {
    if (editing && !modalState) {
      setEditing(false)
      pageCache.clear()
      fetchInventory()
    }
  }, [editing, modalState, fetchInventory])

  const showSkeleton = loading && items.length === 0

  return (
    <div className='inventory-list'>
      <div className='inventory-list__container'>
        <div className='inventory-list__header'>
          <CategoriesStorePicker
            branchId={branchId}
            onBranchIdChange={persistBranchId}
            onCompanyIdChange={(id) => setCompanyId(id)}
          />
          <div className='inventory-list__search'>
            <span className='inventory-list__search-icon material-symbols-rounded' aria-hidden>search</span>
            <input
              className='inputs__general inventory-list__search-input'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type='text'
              placeholder='Buscar artículo o código'
              aria-label='Buscar artículos'
            />
          </div>
          <select
            className='inputs__general inventory-list__filter'
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label='Filtrar por estado'
          >
            <option value='all'>Todos los estados</option>
            <option value='stock_bajo'>Stock bajo</option>
            <option value='agotado'>Desabasto</option>
          </select>
        </div>

        {/* Resumen: siempre ocupa su lugar para que la página no salte al cargar */}
        <div className='inventory-list__summary inventory-list__summary--accent'>
          {([
            ['Artículos', summary?.totalItems, ''],
            ['En stock', summary?.disponibles, STATUS_CLASS.disponible],
            ['Stock bajo', summary?.stockBajo, STATUS_CLASS.stock_bajo],
            ['Desabasto', summary?.agotados, STATUS_CLASS.agotado],
          ] as [string, number | undefined, string][]).map(([label, value, cls]) => (
            <div className={`inventory-list__card ${cls}`} key={label}>
              <div className='inventory-list__card-text'>
                <span><i className='inventory-list__card-dot' aria-hidden />{label}</span>
                {showSkeleton ? (
                  <span className='table-skeleton__shimmer inventory-list__card-sk' />
                ) : (
                  <b>{value ?? 0}</b>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* La tabla siempre se ve; el skeleton va dentro */}
        <div className={`inventory-list__list ${loading && !showSkeleton ? 'is-refreshing' : ''}`}>
          <div className='inventory-list__row inventory-list__row--head inventory-row'>
            <span>Código</span>
            <span>Artículo</span>
            <span>Stock total</span>
            <span>Estado</span>
            <span>Variantes</span>
            <span />
          </div>

          {showSkeleton ? (
            <TableSkeleton rowClassName='inventory-list__row' cols={[{ pill: true, width: '64px' }, { width: '65%' }, { width: '35%' }, { pill: true, width: '72px' }, { width: '50%' }]} />
          ) : items.length === 0 ? (
            <div className='inventory-list__state'>
              <p>{debouncedSearch.trim() ? 'No se encontraron artículos con ese criterio' : 'No hay artículos para mostrar'}</p>
            </div>
          ) : (
            items.map((item) => <InventoryRow key={item.itemId} item={item} onOpen={openDetail} />)
          )}
        </div>

        {total > 0 && (
          <Pagination total={total} page={page} pageSize={PAGE_SIZE} onPage={setPage} noun='artículos' />
        )}
      </div>

      {detail ? <ModalItemDetail item={detail} branchId={branchId > 0 ? branchId : undefined} canEdit={canEdit} onEdit={openEdit} onClose={closeDetail} /> : null}
      {editing ? <ArticleModal /> : null}
    </div>
  )
}

export default Inventory
