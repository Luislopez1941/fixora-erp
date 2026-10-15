import React, { useState, useEffect } from 'react'
import './ModalTransfer.css'
import { useDispatch } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'

interface ModalTransferProps {
  onSaved?: () => void
  onClose?: () => void
}

const ModalTransfer: React.FC<ModalTransferProps> = ({ onSaved, onClose }) => {
  const dispatch = useDispatch()
  const [fromWarehouse, setFromWarehouse] = useState('')
  const [toWarehouse, setToWarehouse] = useState('')
  const [items, setItems] = useState([{ id: 1, itemId: '', qty: 1 }])

  const handleClose = () => {
    dispatch(modal(''))
    if (onClose) onClose()
  }

  const addItem = () => {
    setItems([...items, { id: Date.now(), itemId: '', qty: 1 }])
  }

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id))
    }
  }

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  const handleSave = () => {
    // Implement API call to create transfer
    console.log('Saving transfer:', { fromWarehouse, toWarehouse, items })
    if (onSaved) onSaved()
    handleClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-transfer">
        <div className="modal-transfer-header">
          <span className="modal-transfer-title">Nuevo Traspaso de Almacén</span>
          <div className="modal-transfer-close" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </div>
        </div>

        <div className="modal-transfer-body">
          <div className="modal-transfer-section">
            <span className="modal-transfer-section-title">Ubicaciones</span>
            <div className="modal-transfer-grid">
              <div className="modal-transfer-field">
                <label>Almacén Origen</label>
                <select
                  className="modal-transfer-select"
                  value={fromWarehouse}
                  onChange={(e) => setFromWarehouse(e.target.value)}
                >
                  <option value="">Selecciona origen...</option>
                  <option value="1">Almacén Central</option>
                  <option value="2">Tienda Norte</option>
                  <option value="3">Tienda Sur</option>
                </select>
              </div>
              <div className="modal-transfer-field">
                <label>Almacén Destino</label>
                <select
                  className="modal-transfer-select"
                  value={toWarehouse}
                  onChange={(e) => setToWarehouse(e.target.value)}
                >
                  <option value="">Selecciona destino...</option>
                  <option value="1">Almacén Central</option>
                  <option value="2">Tienda Norte</option>
                  <option value="3">Tienda Sur</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-transfer-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="modal-transfer-section-title">Artículos a Trasladar</span>
              <button className="btn-add-item" onClick={addItem} style={{
                background: 'none', border: 'none', color: 'var(--primary-color)',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>add</span>
                Agregar
              </button>
            </div>
            <div className="modal-transfer-items-table">
              <div className="modal-transfer-thead">
                <div>Artículo</div>
                <div>Cantidad</div>
                <div style={{ textAlign: 'center' }}>Acción</div>
              </div>
              <div className="modal-transfer-tbody">
                {items.map((item) => (
                  <div className="modal-transfer-row" key={item.id}>
                    <input
                      className="item-name"
                      placeholder="Buscar artículo..."
                      value={item.itemId}
                      onChange={(e) => updateItem(item.id, 'itemId', e.target.value)}
                    />
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
                    />
                    <div className="remove-item" onClick={() => removeItem(item.id)}>
                      <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>delete</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-transfer-footer">
          <button className="btn-cancel" onClick={handleClose}>Cancelar</button>
          <button className="btn-save" onClick={handleSave}>Confirmar Traspaso</button>
        </div>
      </div>
    </div>
  )
}

export default ModalTransfer
