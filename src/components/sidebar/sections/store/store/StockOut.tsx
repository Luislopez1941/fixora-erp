import React, { useState, useEffect, useCallback } from 'react'
import './StockOut.css'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
import { useDispatch } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'

const StockOut: React.FC = () => {
  const dispatch = useDispatch()
  const [branchId, setBranchId] = useState(() => {
    const id = Number(localStorage.getItem('categories-picker-branch-id'))
    return !Number.isNaN(id) && id > 0 ? id : 0
  })
  const [companyId, setCompanyId] = useState<number | null>(() => {
    const id = Number(localStorage.getItem('categories-picker-company-id'))
    return !Number.isNaN(id) && id > 0 ? id : null
  })
  const [outflows, setOutflows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
    localStorage.setItem('categories-picker-branch-id', String(id))
  }, [])

  const fetchOutflows = useCallback(async () => {
    if (!companyId) {
      setOutflows([])
      return
    }
    setLoading(true)
    try {
      // Currently no specific endpoint for outflows, using mock data for UI demo
      // In production, this would call APIs.getStockOuts({ companyId, branchId })
      setTimeout(() => {
        setOutflows([
          { id: 1, item: 'Camiseta Polo Blanca M', qty: 5, warehouse: 'Almacén Central', reason: 'Venta', user: 'Luis Lopez', date: '2026-10-07 10:30' },
          { id: 2, item: 'Pantalón Jean Azul 32', qty: 2, warehouse: 'Tienda Norte', reason: 'Mermas', user: 'Ana García', date: '2026-10-06 15:45' },
          { id: 3, item: 'Gorra Deportiva Negra', qty: 10, warehouse: 'Almacén Central', reason: 'Consumo Interno', user: 'Luis Lopez', date: '2026-10-05 09:15' },
        ])
        setLoading(false)
      }, 800)
    } catch (error) {
      console.error('Error al cargar salidas:', error)
      setOutflows([])
      setLoading(false)
    }
  }, [branchId, companyId])

  useEffect(() => {
    fetchOutflows()
  }, [fetchOutflows])

  const filteredOutflows = outflows.filter(item =>
    item.item.toLowerCase().includes(search.toLowerCase()) ||
    item.reason.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="store-stockout-page">
      <div className="store-stockout-content">
        <div className="store-stockout-top-bar">
          <div className="store-stockout-toolbar-left">
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={persistBranchId}
              onCompanyIdChange={(id) => setCompanyId(id)}
            />
            <div className="store-stockout-search-container">
              <div className="store-stockout-search-wrap">
                <span className="material-symbols-rounded search-icon">search</span>
                <input
                  className="store-stockout-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  placeholder="Buscar por artículo o motivo..."
                />
              </div>
            </div>
          </div>
          <div className="store-stockout-action-container">
            <button className="btn-new-outbound" onClick={() => dispatch(modal('stock_out_modal'))}>
              <span className="material-symbols-rounded">add</span>
              Nueva Salida
            </button>
          </div>
        </div>

        <div className="store-stockout-summary">
          <div className="stockout-summary-card">
            <span className="stockout-summary-label">Salidas Hoy</span>
            <strong className="stockout-summary-value">12</strong>
          </div>
          <div className="stockout-summary-card">
            <span className="stockout-summary-label">Total Mes</span>
            <strong className="stockout-summary-value">342</strong>
          </div>
          <div className="stockout-summary-card">
            <span className="stockout-summary-label">Mermas (%)</span>
            <strong className="stockout-summary-value">2.4%</strong>
          </div>
        </div>

        <div className="store-stockout-table-wrap">
          <div className="store-stockout-table">
            <div className="store-stockout-thead">
              <div className="th">Artículo</div>
              <div className="th">Cantidad</div>
              <div className="th">Almacén</div>
              <div className="th">Motivo</div>
              <div className="th">Usuario</div>
              <div className="th">Acciones</div>
            </div>
            <div className="store-stockout-tbody">
              {loading ? (
                <div className="store-stockout-loading">
                  <div className="spinner" />
                  <p>Cargando salidas...</p>
                </div>
              ) : filteredOutflows.length === 0 ? (
                <div className="store-stockout-empty">
                  <p>No hay registros de salidas</p>
                </div>
              ) : (
                filteredOutflows.map((item) => (
                  <div className="store-stockout-row-wrap" key={item.id}>
                    <div className="store-stockout-row">
                      <div className="td">
                        <p className="store-stockout-item-name">{item.item}</p>
                      </div>
                      <div className="td">
                        <p>{item.qty} pzs</p>
                      </div>
                      <div className="td">
                        <p>{item.warehouse}</p>
                      </div>
                      <div className="td">
                        <p>{item.reason}</p>
                      </div>
                      <div className="td">
                        <p>{item.user}</p>
                      </div>
                      <div className="td store-stockout-actions">
                        <div className="action-btn delete" title="Eliminar">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20 6a1 1 0 0 1 .117 1.993l-.117 .007h-.081l-.919 11a3 3 0 0 1 -2.824 2.995l-.176 .005h-8c-1.598 0 -2.904 -1.249 -2.992 -2.75l-.005 -.167l-.923 -11.083h-.08a1 1 0 0 1 -.117 -1.993l.117 -.007h16z" /><path d="M14 2a2 2 0 0 1 2 2a1 1 0 0 1 -1.993 .117l-.007 -.117h-4l-.007 .117a1 1 0 0 1 -1.993 -.117a2 2 0 0 1 1.85 -1.995l.15 -.005h4z" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StockOut
