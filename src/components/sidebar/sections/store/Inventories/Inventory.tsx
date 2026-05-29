import React, { useCallback, useEffect, useMemo, useState } from 'react'
import '../../categories/Categories.css'
import './Inventory.css'
import CategoriesStorePicker from '../../categories/CategoriesStorePicker'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId } from '../../../../../constants/category'

const LS_COMPANY = 'categories-picker-company-id'

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem(LS_COMPANY))
  return !Number.isNaN(id) && id > 0 ? id : null
}

type StockStatus = 'disponible' | 'stock_bajo' | 'agotado' | 'sin_rastreo'

const STATUS_LABEL: Record<StockStatus, string> = {
  disponible: 'En stock',
  stock_bajo: 'Stock bajo',
  agotado: 'Desabasto',
  sin_rastreo: 'Sin rastreo',
}

const STATUS_CLASS: Record<StockStatus, string> = {
  disponible: 'inventory-status--ok',
  stock_bajo: 'inventory-status--low',
  agotado: 'inventory-status--out',
  sin_rastreo: 'inventory-status--none',
}

const Inventory: React.FC = () => {
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const [items, setItems] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
    localStorage.setItem('categories-picker-branch-id', String(id))
  }, [])

  const fetchInventory = useCallback(async () => {
    const resolvedCompanyId = companyId ?? readCompanyId()
    if (!resolvedCompanyId) {
      setItems([])
      setSummary(null)
      return
    }

    setLoading(true)
    try {
      const response: any = await APIs.getInventory({
        companyId: resolvedCompanyId,
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
  }, [branchId, companyId, statusFilter])

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
    <div className='inventory'>
      <div className='inventory__container'>
        <div className='inventory__header'>
          <div className='inventory__toolbar'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={persistBranchId}
              onCompanyIdChange={(id) => setCompanyId(id)}
            />
          </div>
          <div className='inventory__filters'>
            <input
              className='inputs__general'
              type='text'
              placeholder='Buscar artículo o código'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className='traditional__selector inventory__status-filter'
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value='all'>Todos</option>
              <option value='stock_bajo'>Stock bajo</option>
              <option value='agotado'>Desabasto</option>
            </select>
          </div>
        </div>

        {summary ? (
          <div className='inventory__summary'>
            <div className='inventory__summary-card'>
              <span>Artículos</span>
              <strong>{summary.totalItems ?? 0}</strong>
            </div>
            <div className='inventory__summary-card inventory__summary-card--ok'>
              <span>En stock</span>
              <strong>{summary.disponibles ?? 0}</strong>
            </div>
            <div className='inventory__summary-card inventory__summary-card--low'>
              <span>Stock bajo</span>
              <strong>{summary.stockBajo ?? 0}</strong>
            </div>
            <div className='inventory__summary-card inventory__summary-card--out'>
              <span>Desabasto</span>
              <strong>{summary.agotados ?? 0}</strong>
            </div>
          </div>
        ) : null}

        <div className='table__inventory'>
          <div className='table__head'>
            <div className='thead inventory__thead'>
              <div className='th'><p>Código</p></div>
              <div className='th'><p>Artículo</p></div>
              <div className='th'><p>Stock total</p></div>
              <div className='th'><p>Estado</p></div>
              <div className='th'><p>Tallas</p></div>
            </div>
          </div>

          {loading ? (
            <p className='inventory__empty'>Cargando inventario...</p>
          ) : filteredItems.length === 0 ? (
            <p className='inventory__empty'>No hay artículos para mostrar</p>
          ) : (
            <div className='table__body inventory__body'>
              {filteredItems.map((item) => {
                const status = (item.status ?? 'sin_rastreo') as StockStatus
                const canExpand = item.hasVariations || (item.generalStock ?? 0) > 0
                const isExpanded = expandedId === item.itemId
                const variations = item.variations ?? []

                return (
                  <div className='inventory__row-wrap' key={item.itemId}>
                    <div
                      className={`inventory__row ${canExpand ? 'inventory__row--expandable' : ''}`}
                      onClick={() => canExpand && toggleExpand(item.itemId)}
                      role={canExpand ? 'button' : undefined}
                    >
                      <div className='td'>{item.code || '—'}</div>
                      <div className='td'>{item.name}</div>
                      <div className='td'>{item.trackInventory ? item.totalStock : '—'}</div>
                      <div className='td'>
                        <span className={`inventory-status ${STATUS_CLASS[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                      </div>
                      <div className='td'>
                        {item.hasVariations ? (
                          <span className='inventory__sizes-hint'>
                            {variations.length} tallas
                            {item.outOfStockCount > 0 ? ` · ${item.outOfStockCount} agotadas` : ''}
                            {item.lowStockCount > 0 ? ` · ${item.lowStockCount} bajas` : ''}
                          </span>
                        ) : (
                          '—'
                        )}
                      </div>
                    </div>

                    {isExpanded && (variations.length > 0 || (item.generalStock ?? 0) > 0) ? (
                      <div className='inventory__sizes-panel'>
                        <p className='inventory__sizes-title'>Existencias por talla</p>
                        <div className='inventory__sizes-grid'>
                          {(item.generalStock ?? 0) > 0 ? (
                            <div className={`inventory__size-card ${STATUS_CLASS.disponible}`}>
                              <div className='inventory__size-card__header'>
                                <span>Sin talla asignada</span>
                              </div>
                              <div className='inventory__size-card__size'>General</div>
                              <div className='inventory__size-card__stock'>{item.generalStock} pzs</div>
                              <div className={`inventory-status ${STATUS_CLASS.disponible}`}>
                                Entradas sin talla
                              </div>
                            </div>
                          ) : null}
                          {variations.map((v: any) => {
                            const vStatus = (v.status ?? 'agotado') as StockStatus
                            return (
                              <div
                                className={`inventory__size-card ${STATUS_CLASS[vStatus]}`}
                                key={v.id}
                              >
                                <div className='inventory__size-card__header'>
                                  <span
                                    className='inventory__size-color'
                                    style={{ backgroundColor: v.colorHex || '#586ae9' }}
                                  />
                                  <span>{v.color}</span>
                                </div>
                                <div className='inventory__size-card__size'>{v.size}</div>
                                <div className='inventory__size-card__stock'>{v.stock} pzs</div>
                                <div className={`inventory-status ${STATUS_CLASS[vStatus]}`}>
                                  {STATUS_LABEL[vStatus]}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Inventory
