import React, { useState, useEffect, useCallback, useMemo } from 'react'
import './WarehouseInventory.css'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
import APIs from '../../../../../services/APIs'

type StockStatus = 'disponible' | 'stock_bajo' | 'agotado' | 'sin_rastreo'

const STATUS_LABEL: Record<StockStatus, string> = {
  disponible: 'En stock',
  stock_bajo: 'Stock bajo',
  agotado: 'Desabasto',
  sin_rastreo: 'Sin rastreo',
}

const STATUS_CLASS: Record<StockStatus, string> = {
  disponible: 'status--ok',
  stock_bajo: 'status--low',
  agotado: 'status--out',
  sin_rastreo: 'status--none',
}

interface WarehouseInventoryProps {
  branchId: number
  setBranchId: (id: number) => void
  companyId: number | null
  setCompanyId: (id: number | null) => void
}

const WarehouseInventory: React.FC<WarehouseInventoryProps> = ({
  branchId,
  setBranchId,
  companyId,
  setCompanyId,
}) => {
  const [items, setItems] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const fetchInventory = useCallback(async () => {
    if (!companyId) {
      setItems([])
      setSummary(null)
      return
    }

    setLoading(true)
    try {
      const response: any = await APIs.getInventory({
        companyId,
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
    <div className="warehouse-inventory-page">
      <div className="warehouse-inventory-content">
        <div className="warehouse-inventory-top-bar">
          <div className="warehouse-inventory-toolbar-left">
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={setBranchId}
              onCompanyIdChange={setCompanyId}
            />
            <div className="warehouse-inventory-search-container">
              <div className="warehouse-inventory-search-wrap">
                <span className="material-symbols-rounded search-icon">search</span>
                <input
                  className="inputs__general warehouse-inventory-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  placeholder="Buscar artículo o código..."
                />
              </div>
            </div>
            <div className="warehouse-inventory-filter-container">
              <select
                className="traditional__selector warehouse-inventory-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="stock_bajo">Stock bajo</option>
                <option value="agotado">Desabasto</option>
              </select>
            </div>
          </div>
        </div>

        {summary && (
          <div className="warehouse-inventory-summary">
            <div className="inventory-summary-card">
              <span className="summary-label">Artículos</span>
              <strong className="summary-value">{summary.totalItems ?? 0}</strong>
            </div>
            <div className={`inventory-summary-card ${STATUS_CLASS.disponible}`}>
              <span className="summary-label">En stock</span>
              <strong className="summary-value">{summary.disponibles ?? 0}</strong>
            </div>
            <div className={`inventory-summary-card ${STATUS_CLASS.stock_bajo}`}>
              <span className="summary-label">Stock bajo</span>
              <strong className="summary-value">{summary.stockBajo ?? 0}</strong>
            </div>
            <div className={`inventory-summary-card ${STATUS_CLASS.agotado}`}>
              <span className="summary-label">Desabasto</span>
              <strong className="summary-value">{summary.agotados ?? 0}</strong>
            </div>
          </div>
        )}

        <div className="warehouse-inventory-table-wrap">
          <div className="warehouse-inventory-table">
            <div className="warehouse-inventory-thead">
              <div className="th">Código</div>
              <div className="th">Artículo</div>
              <div className="th">Stock total</div>
              <div className="th">Estado</div>
              <div className="th">Tallas</div>
            </div>
            <div className="warehouse-inventory-tbody">
              {loading ? (
                <div className="warehouse-inventory-loading">
                  <div className="spinner" />
                  <p>Cargando inventario...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="warehouse-inventory-empty">
                  <p>No hay artículos para mostrar</p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const status = (item.status ?? 'sin_rastreo') as StockStatus
                  const canExpand = item.hasVariations || (item.generalStock ?? 0) > 0
                  const isExpanded = expandedId === item.itemId
                  const variations = item.variations ?? []

                  return (
                    <div className="inventory-row-wrap" key={item.itemId}>
                      <div
                        className={`inventory-row ${canExpand ? 'inventory-row--expandable' : ''}`}
                        onClick={() => canExpand && toggleExpand(item.itemId)}
                        role={canExpand ? 'button' : undefined}
                      >
                        <div className="td">{item.code || '—'}</div>
                        <div className="td inventory-item-name">{item.name}</div>
                        <div className="td">{item.trackInventory ? item.totalStock : '—'}</div>
                        <div className="td">
                          <span className={`inventory-status ${STATUS_CLASS[status]}`}>
                            {STATUS_LABEL[status]}
                          </span>
                        </div>
                        <div className="td">
                          {item.hasVariations ? (
                            <span className="inventory-sizes-hint">
                              {variations.length} tallas
                              {item.outOfStockCount > 0 ? ` · ${item.outOfStockCount} agotadas` : ''}
                              {item.lowStockCount > 0 ? ` · ${item.lowStockCount} bajas` : ''}
                            </span>
                          ) : (
                            '—'
                          )}
                        </div>
                      </div>

                      {isExpanded && (variations.length > 0 || (item.generalStock ?? 0) > 0) && (
                        <div className="inventory-sizes-panel">
                          <p className="inventory-sizes-title">Existencias por talla</p>
                          <div className="inventory-sizes-grid">
                            {(item.generalStock ?? 0) > 0 && (
                              <div className={`inventory-size-card ${STATUS_CLASS.disponible}`}>
                                <div className="inventory-size-card__header">
                                  <span>Sin talla asignada</span>
                                </div>
                                <div className="inventory-size-card__size">General</div>
                                <div className="inventory-size-card__stock">{item.generalStock} pzs</div>
                                <div className={`inventory-status ${STATUS_CLASS.disponible}`}>
                                  Entradas sin talla
                                </div>
                              </div>
                            )}
                            {variations.map((v: any) => {
                              const vStatus = (v.status ?? 'agotado') as StockStatus
                              return (
                                <div
                                  className={`inventory-size-card ${STATUS_CLASS[vStatus]}`}
                                  key={v.id}
                                >
                                  <div className="inventory-size-card__header">
                                    <span
                                      className="inventory-size-color"
                                      style={{ backgroundColor: v.colorHex || '#586ae9' }}
                                    />
                                    <span>{v.color}</span>
                                  </div>
                                  <div className="inventory-size-card__size">{v.size}</div>
                                  <div className="inventory-size-card__stock">{v.stock} pzs</div>
                                  <div className={`inventory-status ${STATUS_CLASS[vStatus]}`}>
                                    {STATUS_LABEL[vStatus]}
                                  </div>
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
      </div>
    </div>
  )
}

export default WarehouseInventory
