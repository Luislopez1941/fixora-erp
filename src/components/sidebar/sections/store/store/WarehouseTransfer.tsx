import React, { useState, useEffect, useCallback } from 'react'
import './WarehouseTransfer.css'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
import { useDispatch } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'

const WarehouseTransfer: React.FC = () => {
  const dispatch = useDispatch()
  const [branchId, setBranchId] = useState(() => {
    const id = Number(localStorage.getItem('categories-picker-branch-id'))
    return !Number.isNaN(id) && id > 0 ? id : 0
  })
  const [companyId, setCompanyId] = useState<number | null>(() => {
    const id = Number(localStorage.getItem('categories-picker-company-id'))
    return !Number.isNaN(id) && id > 0 ? id : null
  })
  const [transfers, setTransfers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
    localStorage.setItem('categories-picker-branch-id', String(id))
  }, [])

  const fetchTransfers = useCallback(async () => {
    if (!companyId) {
      setTransfers([])
      return
    }
    setLoading(true)
    try {
      // Mock data for UI demonstration
      setTimeout(() => {
        setTransfers([
          { id: 'TR-001', from: 'Almacén Central', to: 'Tienda Norte', date: '2026-10-07', status: 'Completed', user: 'Luis Lopez' },
          { id: 'TR-002', from: 'Almacén Central', to: 'Tienda Sur', date: '2026-10-06', status: 'Pending', user: 'Ana García' },
          { id: 'TR-003', from: 'Almacén Este', to: 'Almacén Central', date: '2026-10-05', status: 'Completed', user: 'Carlos Ruiz' },
        ])
        setLoading(false)
      }, 800)
    } catch (error) {
      console.error('Error al cargar traspasos:', error)
      setTransfers([])
      setLoading(false)
    }
  }, [branchId, companyId])

  useEffect(() => {
    fetchTransfers()
  }, [fetchTransfers])

  const filteredTransfers = transfers.filter(t =>
    t.id.toLowerCase().includes(search.toLowerCase()) ||
    t.from.toLowerCase().includes(search.toLowerCase()) ||
    t.to.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="warehouse-transfer-page">
      <div className="warehouse-transfer-content">
        <div className="warehouse-transfer-top-bar">
          <div className="warehouse-transfer-toolbar-left">
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={persistBranchId}
              onCompanyIdChange={(id) => setCompanyId(id)}
            />
            <div className="warehouse-transfer-search-container">
              <div className="warehouse-transfer-search-wrap">
                <span className="material-symbols-rounded search-icon">search</span>
                <input
                  className="warehouse-transfer-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  placeholder="Buscar traspaso, origen o destino..."
                />
              </div>
            </div>
          </div>
          <div className="warehouse-transfer-action-container">
            <button className="btn-new-transfer" onClick={() => dispatch(modal('transfer_modal'))}>
              <span className="material-symbols-rounded">add</span>
              Nuevo Traspaso
            </button>
          </div>
        </div>

        <div className="warehouse-transfer-summary">
          <div className="transfer-summary-card">
            <span className="summary-label">Traspasos Hoy</span>
            <strong className="summary-value">4</strong>
          </div>
          <div className="transfer-summary-card">
            <span className="summary-label">Pendientes</span>
            <strong className="summary-value">2</strong>
          </div>
          <div className="transfer-summary-card">
            <span className="summary-label">Total Mes</span>
            <strong className="summary-value">45</strong>
          </div>
        </div>

        <div className="warehouse-transfer-table-wrap">
          <div className="warehouse-transfer-table">
            <div className="warehouse-transfer-thead">
              <div className="th">ID Traspaso</div>
              <div className="th">Origen</div>
              <div className="th">Destino</div>
              <div className="th">Fecha</div>
              <div className="th">Usuario</div>
              <div className="th">Acciones</div>
            </div>
            <div className="warehouse-transfer-tbody">
              {loading ? (
                <div className="warehouse-transfer-loading">
                  <div className="spinner" />
                  <p>Cargando traspasos...</p>
                </div>
              ) : filteredTransfers.length === 0 ? (
                <div className="warehouse-transfer-empty">
                  <p>No hay traspasos registrados</p>
                </div>
              ) : (
                filteredTransfers.map((item) => (
                  <div className="warehouse-transfer-row-wrap" key={item.id}>
                    <div className="warehouse-transfer-row">
                      <div className="td">
                        <p className="transfer-id">{item.id}</p>
                      </div>
                      <div className="td">
                        <p>{item.from}</p>
                      </div>
                      <div className="td">
                        <p>{item.to}</p>
                      </div>
                      <div className="td">
                        <p>{item.date}</p>
                      </div>
                      <div className="td">
                        <p>{item.user}</p>
                      </div>
                      <div className="td warehouse-transfer-actions">
                        <div className="action-btn view" title="Ver Detalles">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M21 12a9 9 0 1 1 -18 0a9 9 0 0 1 18 0" /><path d="M15 12h6" /></svg>
                        </div>
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

export default WarehouseTransfer
