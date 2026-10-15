import React, { useEffect, useState } from 'react';
import './ModalRequisitionDetail.css';
import { useDispatch, useSelector } from 'react-redux';
import { modal } from '../../../../../../redux/state/modals';
import APIs from '../../../../../../services/APIs';
import Swal from 'sweetalert2';

const ModalRequisitionDetail: React.FC = () => {
  const dispatch = useDispatch();
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
      setRequisition(response.data);
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
      Swal.fire('Error', 'No se pudo actualizar el estado.', 'error');
    } finally {
      setIsUpdating(false);
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

  return (
    <div className={`modal-req-detail-overlay ${isOpen ? 'active' : ''}`}>
      <div className="modal-req-detail-popup">
        <div className="modal-req-detail-header">
          <div className="modal-req-detail-title">
            <h2 style={{ margin: 0 }}>Detalles de Requisición</h2>
            <span className="req-folio-badge">
              {requisition?.serie?.name}-{requisition?.folio}-{requisition?.createdAt?.substring(0, 4)}
            </span>
          </div>
          <button className="modal-req-detail-close" onClick={() => dispatch(modal(''))}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {loading ? (
          <div className="modal-req-detail-loading">Cargando...</div>
        ) : requisition ? (
          <div className="modal-req-detail-body">
            <div className="modal-req-detail-info-grid">
              <div className="info-item">
                <label>Título</label>
                <p>{requisition.title}</p>
              </div>
              <div className="info-item">
                <label>Empresa</label>
                <p>{requisition.company?.name}</p>
              </div>
              <div className="info-item">
                <label>Sucursal</label>
                <p>{requisition.branch?.name}</p>
              </div>
              <div className="info-item">
                <label>Área</label>
                <p>{requisition.area?.name || 'N/A'}</p>
              </div>
              <div className="info-item">
                <label>Usuario</label>
                <p>{requisition.user?.firstName} {requisition.user?.firstLastName}</p>
              </div>
              <div className="info-item">
                <label>Serie</label>
                <p title="La serie identifica la secuencia de numeración (ej. REQ para regulares).">{requisition.serie?.name || 'REQ'}</p>
              </div>
              <div className="info-item">
                <label>Fecha</label>
                <p>{new Date(requisition.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="modal-req-detail-status-section">
              <label>Estado Actual</label>
              <select
                value={requisition.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdating}
                className="status-select"
              >
                <option value="DRAFT">Borrador</option>
                <option value="PENDING">Pendiente</option>
                <option value="APPROVED">Aprobada</option>
                <option value="REJECTED">Rechazada</option>
                <option value="PARTIAL">Parcial</option>
                <option value="COMPLETED">Completada</option>
              </select>
            </div>

            <div className="modal-req-detail-table-wrap">
              <table className="modal-req-detail-table">
                <thead>
                  <tr>
                    <th>Artículo</th>
                    <th>Cant. Solicitada</th>
                    <th>Cant. Surtida</th>
                    <th>Unidad</th>
                    <th>Almacén</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {requisition.items.map((item: any) => (
                    <tr key={item.id}>
                      <td>{item.code} - {item.name}</td>
                      <td>{item.quantity}</td>
                      <td>
                        <input
                          type="number"
                          className="delivery-input"
                          value={item.deliveredQuantity}
                          onChange={(e) => handleDeliveryUpdate(item.id, Number(e.target.value))}
                        />
                      </td>
                      <td>{item.unit?.name || '—'}</td>
                      <td>{item.store?.name || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="delivery-status">
                          {item.deliveredQuantity >= item.quantity ? '✅' : '⏳'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="modal-req-detail-empty">No se encontró la requisición.</div>
        )}
      </div>
    </div>
  );
};

export default ModalRequisitionDetail;
