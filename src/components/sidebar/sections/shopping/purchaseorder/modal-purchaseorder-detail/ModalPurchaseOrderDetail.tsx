import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { modal } from '../../../../../../redux/state/modals';
import APIs from '../../../../../../services/APIs';
import './ModalPurchaseOrderDetail.css';
import './ModalPurchaseOrderPrint.css';
import { format } from 'date-fns';
import Swal from 'sweetalert2';

const ModalPurchaseOrderDetail: React.FC = () => {
  const dispatch = useDispatch();
  const activeModal = useSelector((state: any) => state.modals);
  const modalActive = activeModal === 'purchase_order_detail_modal';
  const [loading, setLoading] = useState(false);
  const [po, setPo] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modalActive) {
      const id = localStorage.getItem('selected_po_id');
      if (id) {
        loadPurchaseOrder(Number(id));
      }
    }
  }, [modalActive]);

  const loadPurchaseOrder = async (id: number) => {
    setLoading(true);
    try {
      const response: any = await APIs.getPurchaseOrderById(id);
      const data = response?.data || response;
      setPo(data);
    } catch (e) {
      console.error('Error loading purchase order details', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!po) return;

    try {
      setLoading(true);
      const response: any = await APIs.updatePurchaseOrderStatus(po.id, newStatus);
      if (response?.status === 'success') {
        Swal.fire('Éxito', `La orden de compra ha sido ${newStatus.toLowerCase()}`, 'success');
        await loadPurchaseOrder(po.id);
      } else {
        Swal.fire('Error', response?.message || 'No se pudo actualizar el estado', 'error');
      }
    } catch (e) {
      console.error('Error updating status', e);
      Swal.fire('Error', 'Ocurrió un error al actualizar el estado', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!modalActive) return null;

  if (loading) {
    return (
      <div className="modal-po-detail-overlay">
        <div className="modal-po-detail-content loading">
          <div className="spinner" />
          <p>Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (!po) return null;

  return (
    <>
      <div className={`modal-po-detail-overlay ${modalActive ? 'active' : ''}`}>
        <div className={`modal-po-detail-content ${modalActive ? 'active' : ''}`}>
          <div className='modal-header'>
            <h3>Detalles de la Orden de Compra</h3>
            <button className='close-btn' onClick={() => dispatch(modal(''))}>
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>

          <div className='modal-body'>
            <div className='detail-grid'>
              <div className='detail-item'>
                <label>Folio</label>
                <p>{po.serie?.name}-{po.folio}</p>
              </div>
              <div className='detail-item'>
                <label>Fecha de Creación</label>
                <p>{po.createdAt ? format(new Date(po.createdAt), 'dd/MM/yyyy HH:mm') : '—'}</p>
              </div>
              <div className='detail-item'>
                <label>Fecha de Llegada</label>
                <p>{po.arrivalDate ? format(new Date(po.arrivalDate), 'dd/MM/yyyy') : '—'}</p>
              </div>
              <div className='detail-item'>
                <label>Estado</label>
                <p className={`status-badge ${po.status.toLowerCase()}`}>{po.status}</p>
              </div>
              <div className='detail-item'>
                <label>Empresa</label>
                <p>{po.company?.name || '—'}</p>
              </div>
              <div className='detail-item'>
                <label>Sucursal</label>
                <p>{po.branch?.name || '—'}</p>
              </div>
              <div className='detail-item'>
                <label>Proveedor</label>
                <p>{po.supplierName || '—'}</p>
              </div>
              <div className='detail-item'>
                <label>Cotización</label>
                <p>{po.quote || '—'}</p>
              </div>
              <div className='detail-item'>
                <label>Factura</label>
                <p>{po.bill || '—'}</p>
              </div>
            </div>

            <div className='detail-section'>
              <h4>Artículos</h4>
              <table className='detail-table'>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Artículo</th>
                    <th>Cantidad</th>
                    <th>Unidad</th>
                    <th>Precio</th>
                    <th>IVA</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items && po.items.length > 0 ? (
                    po.items.map((item: any, index: number) => (
                      <tr key={index}>
                        <td>{item.code || '—'}</td>
                        <td>{item.name || '—'}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unit?.name || item.unitId || '—'}</td>
                        <td>${Number(item.price || 0).toFixed(2)}</td>
                        <td>{item.ivaOn ? 'Sí' : 'No'}</td>
                        <td>${(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center' }}>No hay artículos en esta orden.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className='detail-comments'>
              <label>Comentarios</label>
              <p>{po.comments || 'Sin comentarios'}</p>
            </div>
          </div>

          <div className='modal-footer'>
            {po && po.status !== 'COMPLETED' && (
              <div className='status-actions' style={{ display: 'flex', gap: '10px', marginRight: 'auto' }}>
                {po.status === 'PENDING' && (
                  <>
                    <button className='status-btn approve' onClick={() => handleUpdateStatus('APPROVED')}>Aprobar</button>
                    <button className='status-btn reject' onClick={() => handleUpdateStatus('REJECTED')}>Rechazar</button>
                  </>
                )}
                {po.status === 'APPROVED' && (
                  <button className='status-btn complete' onClick={() => handleUpdateStatus('COMPLETED')}>Completar</button>
                )}
                {po.status !== 'REJECTED' && (
                  <button className='status-btn cancel' onClick={() => handleUpdateStatus('REJECTED')}>Cancelar</button>
                )}
              </div>
            )}
            <button className='btn-print' onClick={handlePrint} style={{ marginRight: '12px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--panel-border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>picture_as_pdf</span>
              Imprimir PDF
            </button>
            <button className='cancel-btn' onClick={() => dispatch(modal(''))}>Cerrar</button>
          </div>
        </div>
      </div>

      {po && (
        <div className="print-container" ref={printRef}>
          <div className="print-header">
            <div className="print-company-info">
              <h1>{po.company?.name || 'Empresa'}</h1>
              <p>{po.branch?.name || 'Sucursal'}</p>
              <p>Documento Oficial de Compra</p>
            </div>
            <div className="print-doc-title">
              <h2>ORDEN DE COMPRA</h2>
              <p>Folio: {po.serie?.name}-{po.folio}</p>
              <p>Fecha: {po.createdAt ? format(new Date(po.createdAt), 'dd/MM/yyyy') : '—'}</p>
            </div>
          </div>

          <div className="print-details-grid">
            <div className="print-detail-section">
              <h3>Información del Proveedor</h3>
              <div className="print-detail-row">
                <span>Proveedor:</span>
                <span>{po.supplierName || '—'}</span>
              </div>
              <div className="print-detail-row">
                <span>Cotización:</span>
                <span>{po.quote || '—'}</span>
              </div>
              <div className="print-detail-row">
                <span>Factura:</span>
                <span>{po.bill || '—'}</span>
              </div>
            </div>
            <div className="print-detail-section">
              <h3>Detalles de Entrega</h3>
              <div className="print-detail-row">
                <span>Fecha de Llegada:</span>
                <span>{po.arrivalDate ? format(new Date(po.arrivalDate), 'dd/MM/yyyy') : '—'}</span>
              </div>
              <div className="print-detail-row">
                <span>Estado:</span>
                <span>{po.status}</span>
              </div>
              <div className="print-detail-row">
                <span>Creado por:</span>
                <span>{po.user?.firstName} {po.user?.firstLastName}</span>
              </div>
            </div>
          </div>

          <div className="print-section">
            <table className="print-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Artículo</th>
                  <th>Cantidad</th>
                  <th>Unidad</th>
                  <th>Precio Unit.</th>
                  <th>IVA</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {po.items && po.items.length > 0 ? (
                  po.items.map((item: any, index: number) => (
                    <tr key={index}>
                      <td>{item.code || '—'}</td>
                      <td>{item.name || '—'}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unit?.name || item.unitId || '—'}</td>
                      <td>${Number(item.price || 0).toFixed(2)}</td>
                      <td>{item.ivaOn ? 'Sí' : 'No'}</td>
                      <td>${(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center' }}>No hay artículos en esta orden.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="print-totals">
            <div className="print-totals-table">
              {po.items && po.items.map((item: any, i: number) => {
                const sub = Number(item.quantity || 0) * Number(item.price || 0);
                return (
                  <div key={i} className="print-totals-row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>Subtotal Item {i+1}:</span>
                    <span>${sub.toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="print-totals-row grand-total" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>TOTAL GENERAL:</span>
                <span>${po.items?.reduce((acc: number, item: any) => acc + (Number(item.quantity || 0) * Number(item.price || 0)), 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="print-footer">
            <div className="signature-line">
              Firma Autorizada
            </div>
            <div className="signature-line">
              Sello de Recibida
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalPurchaseOrderDetail;
