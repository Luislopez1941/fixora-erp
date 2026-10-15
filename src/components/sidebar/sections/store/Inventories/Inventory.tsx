import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import './Inventory.css'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
import APIs from '../../../../../services/APIs'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'

type StockStatus = 'disponible' | 'stock_bajo' | 'agotado' | 'sin_rastreo'

const STATUS_LABEL: Record<StockStatus, string> = {
  disponible: 'En stock',
  stock_bajo: 'Stock bajo',
  agotado: 'Desabasto',
  sin_rastreo: 'Sin rastreo',
}

const STATUS_CLASS: Record<StockStatus, string> = {
  disponible: 'is-ok',
  stock_bajo: 'is-low',
  agotado: 'is-out',
  sin_rastreo: 'is-none',
}

const Inventory: React.FC = () => {
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
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
    localStorage.setItem('categories-picker-branch-id', String(id))
  }, [])

  const fetchInventory = useCallback(async () => {
    // Empresa del selector o, si no hay ninguna vinculada, la activa de la sesión
    const effectiveCompanyId =
      companyId ?? userState?.activeCompanyId ?? userState?.companyId ?? userState?.companyIds?.[0] ?? null
    if (!effectiveCompanyId) {
      setItems([])
      setSummary(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response: any = await APIs.getInventory({
        companyId: effectiveCompanyId,
        branchId: branchId > 0 ? branchId : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })
      setItems(Array.isArray(response?.data) ? response.data : [])
      setSummary(response?.summary ?? null)
    } catch (error) {
      console.error('Error al cargar inventario:', error)
      setItems([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [branchId, companyId, statusFilter, userState?.activeCompanyId])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => {
      const name = String(item.name ?? '').toLowerCase()
      const code = String(item.code ?? '').toLowerCase()
      return name.includes(q) || code.includes(q)
    })
  }, [items, search])

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

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
        <div className='inventory-list__summary'>
          {([
            ['Artículos', summary?.totalItems, ''],
            ['En stock', summary?.disponibles, STATUS_CLASS.disponible],
            ['Stock bajo', summary?.stockBajo, STATUS_CLASS.stock_bajo],
            ['Desabasto', summary?.agotados, STATUS_CLASS.agotado],
          ] as [string, number | undefined, string][]).map(([label, value, cls]) => (
            <div className={`inventory-list__card ${cls}`} key={label}>
              <span>{label}</span>
              {loading ? (
                <span className='table-skeleton__shimmer inventory-list__card-sk' />
              ) : (
                <b>{value ?? 0}</b>
              )}
            </div>
          ))}
        </div>

        {/* La tabla siempre se ve; el skeleton va dentro */}
        <div className='inventory-list__list'>
          <div className='inventory-list__row inventory-list__row--head'>
            <span>Código</span>
            <span>Artículo</span>
            <span>Stock total</span>
            <span>Estado</span>
            <span>Tallas</span>
          </div>

          {loading ? (
            <TableSkeleton rowClassName='inventory-list__row' cols={[{ pill: true, width: '64px' }, { width: '65%' }, { width: '35%' }, { pill: true, width: '72px' }, { width: '50%' }]} />
          ) : filteredItems.length === 0 ? (
            <div className='inventory-list__state'>
              <p>{search.trim() ? 'No se encontraron artículos con ese criterio' : 'No hay artículos para mostrar'}</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const status = (item.status ?? 'sin_rastreo') as StockStatus
              const canExpand = item.hasVariations || (item.generalStock ?? 0) > 0
              const isExpanded = expandedId === item.itemId
              const variations = item.variations ?? []

              return (
                <div className='inventory-list__item' key={item.itemId}>
                  <div
                    className={`inventory-list__row ${canExpand ? 'inventory-list__row--expandable' : ''}`}
                    onClick={() => canExpand && toggleExpand(item.itemId)}
                    role={canExpand ? 'button' : undefined}
                    aria-expanded={canExpand ? isExpanded : undefined}
                  >
                    <div className='inventory-list__cell' data-label='Código'>
                      {item.code ? <span className='inventory-list__tag'>{item.code}</span> : '—'}
                    </div>
                    <div className='inventory-list__cell inventory-list__cell--name' data-label='Artículo'>
                      {canExpand && (
                        <span className={`inventory-list__chevron material-symbols-rounded ${isExpanded ? 'is-open' : ''}`}>chevron_right</span>
                      )}
                      <strong>{item.name}</strong>
                    </div>
                    <div className='inventory-list__cell' data-label='Stock total'>
                      {item.trackInventory ? item.totalStock : '—'}
                    </div>
                    <div className='inventory-list__cell' data-label='Estado'>
                      <span className={`inventory-list__status ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
                    </div>
                    <div className='inventory-list__cell inventory-list__cell--muted' data-label='Tallas'>
                      {item.hasVariations
                        ? `${variations.length} tallas${item.outOfStockCount > 0 ? ` · ${item.outOfStockCount} agotadas` : ''}${item.lowStockCount > 0 ? ` · ${item.lowStockCount} bajas` : ''}`
                        : '—'}
                    </div>
                  </div>

                  {isExpanded && (variations.length > 0 || (item.generalStock ?? 0) > 0) && (
                    <div className='inventory-list__sizes'>
                      <p className='inventory-list__sizes-title'>Existencias por talla</p>
                      <div className='inventory-list__sizes-grid'>
                        {(item.generalStock ?? 0) > 0 && (
                          <div className={`inventory-list__size ${STATUS_CLASS.disponible}`}>
                            <span className='inventory-list__size-label'>Sin talla asignada</span>
                            <strong>General</strong>
                            <b>{item.generalStock} pzs</b>
                            <span className={`inventory-list__status ${STATUS_CLASS.disponible}`}>Entradas sin talla</span>
                          </div>
                        )}
                        {variations.map((v: any) => {
                          const vStatus = (v.status ?? 'agotado') as StockStatus
                          return (
                            <div className={`inventory-list__size ${STATUS_CLASS[vStatus]}`} key={v.id}>
                              <span className='inventory-list__size-label'>
                                <span className='inventory-list__swatch' style={{ backgroundColor: v.colorHex || '#586ae9' }} />
                                {v.color}
                              </span>
                              <strong>{v.size}</strong>
                              <b>{v.stock} pzs</b>
                              <span className={`inventory-list__status ${STATUS_CLASS[vStatus]}`}>{STATUS_LABEL[vStatus]}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default Inventory
