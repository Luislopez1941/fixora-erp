import React, { useEffect, useState } from 'react';
import './ModalRequisitionDetail.css';
import { useDispatch, useSelector } from 'react-redux';
import { modal } from '../../../../../../redux/state/modals';
import APIs from '../../../../../../services/APIs';
import Swal from 'sweetalert2';
import { printRequisition, shareRequisition } from '../printRequisition';
import { useCan } from '../../../../../../core/permissions/useCan';

const STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Borrador', color: '#9CA3AF' },
  PENDING: { label: 'Pendiente', color: '#F59E0B' },
  APPROVED: { label: 'Aprobada', color: '#3B82F6' },
  REJECTED: { label: 'Rechazada', color: '#EF4444' },
  PARTIAL: { label: 'Parcial', color: '#8B5CF6' },
  COMPLETED: { label: 'Completada', color: '#10B981' },
};

const ModalRequisitionDetail: React.FC = () => {
  const dispatch = useDispatch();
  const can = useCan();
  const canApprove = can('shopping.requisition.approve');
  const canReject = can('shopping.requisition.reject');
  const canManage = can('shopping.requisition.manage');
  const modalState = useSelector((state: any) => state.modals);
  const isOpen = modalState === 'requisition_detail_modal';

  const requisitionId = localStorage.getItem('selected_req_id');

  const [requisition, setRequisition] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && requisitionId) {
      fetchDetails();
    }
  }, [isOpen, requisitionId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const response: any = await APIs.getRequisitionById(Number(requisitionId));
      // El backend devuelve la requisición directamente (no envuelta en { data })
      setRequisition(response?.data ?? response ?? null);
    } catch (error) {
      console.error('Error fetching requisition details:', error);
      Swal.fire('Error', 'No se pudieron cargar los detalles.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await APIs.updateRequisitionStatus(Number(requisitionId), newStatus);
      Swal.fire('Actualizado', 'El estado ha sido actualizado.', 'success');
      fetchDetails();
    } catch (error) {
      const message = (error as any)?.response?.data?.message;
      Swal.fire('Error', (Array.isArray(message) ? message.join(', ') : message) || 'No se pudo actualizar el estado.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Aprobar o rechazar desde el pie del detalle (misma confirmación que en el listado)
  const decide = async (newStatus: 'APPROVED' | 'REJECTED') => {
    const approving = newStatus === 'APPROVED';
    const result = await Swal.fire({
      icon: approving ? 'question' : 'warning',
      title: approving ? 'Aprobar requisición' : 'Rechazar requisición',
      text: `${approving ? '¿Aprobar' : '¿Rechazar'} la requisición ${requisition?.serie?.name || 'REQ'}-${requisition?.folio}?`,
      showCancelButton: true,
      confirmButtonText: approving ? 'Aprobar' : 'Rechazar',
      cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) await handleStatusChange(newStatus);
  };

  const handleShare = async () => {
    const result = await shareRequisition(requisition);
    if (result === 'copied') {
      Swal.fire({ icon: 'success', title: 'Resumen copiado', text: 'Pégalo en WhatsApp, correo o donde quieras compartirlo.', timer: 1800, showConfirmButton: false });
    } else if (result === 'failed') {
      Swal.fire('Error', 'No se pudo compartir la requisición.', 'error');
    }
  };

  const handleDeliveryUpdate = async (itemId: number, deliveredQuantity: number) => {
    setIsUpdating(true);
    try {
      await APIs.updateRequisitionItemDelivery(itemId, deliveredQuantity);
      fetchDetails();
    } catch (error) {
      Swal.fire('Error', 'No se pudo actualizar el surtido.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  const status = STATUS_META[requisition?.status] ?? { label: requisition?.status ?? '', color: '#6B7280' };
  const areaText = requisition?.areaType?.label
    ? `${requisition.areaType.label}${requisition.area?.name && requisition.area.name !== requisition.areaType.label ? ` › ${requisition.area.name}` : ''}`
    : (requisition?.area?.name || 'N/A');
  const items: any[] = requisition?.items ?? [];
  const isPending = requisition?.status === 'PENDING';

  return (
    <div className={`modal-req-detail-overlay ${isOpen ? 'active' : ''}`} onClick={() => dispatch(modal(''))}>
      <div className="modal-req-detail-popup" onClick={(e) => e.stopPropagation()}>
        <div className="modal-req-detail-header">
          <div className="modal-req-detail-title">
            <h2>Requisición</h2>
            {requisition && (
              <span className="req-folio-badge">
                {requisition.serie?.name || 'REQ'}-{requisition.folio}
              </span>
            )}
            {requisition && (
              <span className="req-status-pill" style={{ backgroundColor: status.color + '20', color: status.color }}>
                {status.label}
              </span>
            )}
          </div>
          <button className="modal-req-detail-close" onClick={() => dispatch(modal(''))} aria-label="Cerrar">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {loading ? (
          <div className="modal-req-detail-loading">Cargando...</div>
        ) : requisition ? (
          <>
            <div className="modal-req-detail-body">
              <div className="modal-req-detail-info-grid">
                <div className="info-item info-item--wide">
                  <label>Título</label>
                  <p>{requisition.title}</p>
                </div>
                <div className="info-item">
                  <label>Empresa</label>
                  <p>{requisition.company?.name || '—'}</p>
                </div>
                <div className="info-item">
                  <label>Sucursal</label>
                  <p>{requisition.branch?.name || '—'}</p>
                </div>
                <div className="info-item">
                  <label>Área solicitante</label>
                  <p>{areaText}</p>
                </div>
                <div className="info-item">
                  <label>Creó</label>
                  <p>{requisition.user?.firstName} {requisition.user?.firstLastName}</p>
                </div>
                <div className="info-item">
                  <label>Fecha</label>
                  <p>{new Date(requisition.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="info-item">
                  <label>Serie</label>
                  <p title="La serie identifica la secuencia de numeración (ej. REQ para regulares).">{requisition.serie?.name || 'REQ'}</p>
                </div>
              </div>

              {requisition.comments && (
                <div className="modal-req-detail-note">
                  <label>Comentario</label>
                  <p>{requisition.comments}</p>
                </div>
              )}

              <div className="modal-req-detail-section-title">
                Artículos <span>{items.length}</span>
              </div>

              <div className="modal-req-detail-table-wrap">
                <table className="modal-req-detail-table">
                  <thead>
                    <tr>
                      <th>Artículo</th>
                      <th>Solicitada</th>
                      <th>Surtida</th>
                      <th>Unidad</th>
                      <th>Almacén</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any) => {
                      const done = Number(item.deliveredQuantity) >= Number(item.quantity);
                      return (
                        <tr key={item.id}>
                          <td data-label="Artículo" className="cell-name">
                            <strong>{item.name || '—'}</strong>
                            {item.code && <small>{item.code}</small>}
                          </td>
                          <td data-label="Solicitada">{Number(item.quantity)}</td>
                          <td data-label="Surtida">
                            <input
                              type="number"
                              className="delivery-input"
                              value={Number(item.deliveredQuantity)}
                              disabled={isUpdating}
                              onChange={(e) => handleDeliveryUpdate(item.id, Number(e.target.value))}
                            />
                          </td>
                          <td data-label="Unidad">{item.unit?.name || '—'}</td>
                          <td data-label="Almacén">{item.store?.name || '—'}</td>
                          <td className="cell-state">
                            <span className={`delivery-status ${done ? 'delivery-status--done' : ''} material-symbols-rounded`} title={done ? 'Surtido completo' : 'Pendiente de surtir'}>
                              {done ? 'check_circle' : 'schedule'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {items.length === 0 && (
                      <tr><td colSpan={6} className="cell-empty">Esta requisición no tiene artículos.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <footer className="modal-req-detail-footer">
              {canManage && (
                <label className="modal-req-detail-status-field">
                  <span>Estado</span>
                  <select
                    value={requisition.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={isUpdating}
                    className="status-select"
                  >
                    <option value="DRAFT">Borrador</option>
                    <option value="PENDING">Pendiente</option>
                    <option value="APPROVED" disabled={!canApprove}>Aprobada</option>
                    <option value="REJECTED" disabled={!canReject}>Rechazada</option>
                    <option value="PARTIAL">Parcial</option>
                    <option value="COMPLETED">Completada</option>
                  </select>
                </label>
              )}
              <div className="modal-req-detail-actions">
                <button type="button" className="req-btn req-btn--ghost" onClick={() => printRequisition(requisition)}>
                  <span className="material-symbols-rounded" aria-hidden>print</span>
                  Imprimir
                </button>
                <button type="button" className="req-btn req-btn--ghost" onClick={handleShare}>
                  <span className="material-symbols-rounded" aria-hidden>share</span>
                  Compartir
                </button>
                <button type="button" className="req-btn req-btn--ghost" onClick={() => dispatch(modal(''))}>
                  Cerrar
                </button>
                {isPending && canReject && (
                  <button type="button" className="req-btn req-btn--reject" disabled={isUpdating} onClick={() => decide('REJECTED')}>
                    <span className="material-symbols-rounded" aria-hidden>close</span>
                    Rechazar
                  </button>
                )}
                {isPending && canApprove && (
                  <button type="button" className="req-btn req-btn--approve" disabled={isUpdating} onClick={() => decide('APPROVED')}>
                    <span className="material-symbols-rounded" aria-hidden>check</span>
                    Aprobar
                  </button>
                )}
              </div>
            </footer>
          </>
        ) : (
          <div className="modal-req-detail-empty">No se encontró la requisición.</div>
        )}
      </div>
    </div>
  );
};

export default ModalRequisitionDetail;
