import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { modal } from '../../../../../../redux/state/modals';
import APIs from '../../../../../../services/APIs';
import './ModalPurchaseOrderDetail.css';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import { printPurchaseOrder, purchaseOrderTotals } from '../printPurchaseOrder';

const STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Borrador', color: '#9CA3AF' },
  PENDING: { label: 'Pendiente', color: '#F59E0B' },
  APPROVED: { label: 'Aprobada', color: '#3B82F6' },
  REJECTED: { label: 'Rechazada', color: '#EF4444' },
  PARTIAL: { label: 'Parcial', color: '#8B5CF6' },
  COMPLETED: { label: 'Completada', color: '#10B981' },
};

const money = (value: number) => Number(value ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const ModalPurchaseOrderDetail: React.FC = () => {
  const dispatch = useDispatch();
  const activeModal = useSelector((state: any) => state.modals);
  const modalActive = activeModal === 'purchase_order_detail_modal';
  const [loading, setLoading] = useState(false);
  const [po, setPo] = useState<any>(null);

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

  const handleUpdateStatus = async (newStatus: string, confirmText?: string) => {
    if (!po) return;

    if (confirmText) {
      const result = await Swal.fire({
        icon: newStatus === 'REJECTED' ? 'warning' : 'question',
        title: confirmText,
        showCancelButton: true,
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Volver',
      });
      if (!result.isConfirmed) return;
    }

    try {
      setLoading(true);
      const response: any = await APIs.updatePurchaseOrderStatus(po.id, newStatus);
      if (response?.status === 'success') {
        Swal.fire({ icon: 'success', title: `Orden ${STATUS_META[newStatus]?.label.toLowerCase() ?? newStatus}`, timer: 1400, showConfirmButton: false });
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

  if (!modalActive) return null;

  const close = () => dispatch(modal(''));

  if (!po && !loading) return null;

  const status = STATUS_META[po?.status] ?? { label: po?.status ?? '', color: '#6B7280' };
  const items: any[] = po?.items ?? [];
  const totals = po ? purchaseOrderTotals(po) : null;
  const creator = [po?.user?.firstName, po?.user?.firstLastName].filter(Boolean).join(' ') || '—';

  return (
    <div className='modal-po-detail-overlay active' onClick={close}>
      <div className='modal-po-detail-content active' onClick={(e) => e.stopPropagation()}>
        <div className='modal-header'>
          <div className='po-detail-title'>
            <h3>Orden de compra</h3>
            {po && <span className='po-folio-badge'>{po.serie?.name || 'OC'}-{po.folio}</span>}
            {po && (
              <span className='po-status-pill' style={{ backgroundColor: status.color + '20', color: status.color }}>
                {status.label}
              </span>
            )}
          </div>
          <button className='close-btn' onClick={close} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>

        {loading || !po ? (
          <div className='po-detail-loading'>Cargando...</div>
        ) : (
          <>
            <div className='modal-body'>
              <div className='detail-grid'>
                <div className='detail-item detail-item--wide'>
                  <label>Proveedor</label>
                  <p>{po.supplierName || '—'}</p>
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
                  <label>Elaboró</label>
                  <p>{creator}</p>
                </div>
                <div className='detail-item'>
                  <label>Creación</label>
                  <p>{po.createdAt ? format(new Date(po.createdAt), 'dd/MM/yyyy HH:mm') : '—'}</p>
                </div>
                <div className='detail-item'>
                  <label>Llegada</label>
                  <p>{po.arrivalDate ? format(new Date(po.arrivalDate), 'dd/MM/yyyy') : '—'}</p>
                </div>
                <div className='detail-item'>
                  <label>Tipo</label>
                  <p>{po.type === 1 ? 'Por requisición' : 'Directa'}</p>
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

              {po.comments && (
                <div className='detail-comments'>
                  <label>Comentarios</label>
                  <p>{po.comments}</p>
                </div>
              )}

              <div className='detail-section'>
                <h4>Artículos <span>{items.length}</span></h4>
                <div className='detail-table-wrap'>
                  <table className='detail-table'>
                    <thead>
                      <tr>
                        <th>Artículo</th>
                        <th className='r'>Cantidad</th>
                        <th>Unidad</th>
                        <th className='r'>Precio</th>
                        <th className='r'>Desc.</th>
                        <th className='c'>IVA</th>
                        <th className='r'>Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length > 0 ? (
                        items.map((item: any, index: number) => {
                          const line = Number(item.quantity || 0) * Number(item.price || 0) - Number(item.discount || 0);
                          return (
                            <tr key={index}>
                              <td data-label='Artículo' className='cell-name'>
                                <strong>{item.name || '—'}</strong>
                                {item.code && <small>{item.code}</small>}
                              </td>
                              <td data-label='Cantidad' className='r'>{Number(item.quantity)}</td>
                              <td data-label='Unidad'>{item.unit?.name || item.unitId || '—'}</td>
                              <td data-label='Precio' className='r'>{money(Number(item.price || 0))}</td>
                              <td data-label='Descuento' className='r'>{Number(item.discount || 0) ? money(Number(item.discount)) : '—'}</td>
                              <td data-label='IVA' className='c'>{item.ivaOn ? 'Sí' : 'No'}</td>
                              <td data-label='Importe' className='r cell-total'>{money(line)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className='cell-empty'>No hay artículos en esta orden.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {totals && (
                <div className='detail-totals'>
                  <div><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
                  {totals.discount > 0 && <div><span>Descuento</span><span>-{money(totals.discount)}</span></div>}
                  <div><span>IVA</span><span>{money(totals.iva)}</span></div>
                  {po.sumFreight && <div><span>Flete</span><span>{money(totals.freight)}</span></div>}
                  <div className='detail-totals__grand'><span>Total</span><span>{money(totals.total)}</span></div>
                </div>
              )}
            </div>

            <div className='modal-footer'>
              <div className='po-detail-actions'>
                <button type='button' className='po-btn po-btn--ghost' onClick={() => printPurchaseOrder(po)}>
                  <span className='material-symbols-rounded' aria-hidden>print</span>
                  Imprimir
                </button>
                <button type='button' className='po-btn po-btn--ghost' onClick={close}>Cerrar</button>
              </div>
              {po.status !== 'COMPLETED' && (
                <div className='po-detail-status-actions'>
                  {po.status !== 'REJECTED' && po.status !== 'PENDING' && (
                    <button type='button' className='po-btn po-btn--reject' onClick={() => handleUpdateStatus('REJECTED', '¿Cancelar esta orden de compra?')}>
                      <span className='material-symbols-rounded' aria-hidden>block</span>
                      Cancelar orden
                    </button>
                  )}
                  {po.status === 'PENDING' && (
                    <>
                      <button type='button' className='po-btn po-btn--reject' onClick={() => handleUpdateStatus('REJECTED', '¿Rechazar esta orden de compra?')}>
                        <span className='material-symbols-rounded' aria-hidden>close</span>
                        Rechazar
                      </button>
                      <button type='button' className='po-btn po-btn--approve' onClick={() => handleUpdateStatus('APPROVED', '¿Aprobar esta orden de compra?')}>
                        <span className='material-symbols-rounded' aria-hidden>check</span>
                        Aprobar
                      </button>
                    </>
                  )}
                  {po.status === 'APPROVED' && (
                    <button type='button' className='po-btn po-btn--approve' onClick={() => handleUpdateStatus('COMPLETED', '¿Marcar la orden como completada?')}>
                      <span className='material-symbols-rounded' aria-hidden>task_alt</span>
                      Completar
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ModalPurchaseOrderDetail;
