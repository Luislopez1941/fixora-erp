import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { modal } from '../../../../../../redux/state/modals';
import APIs from '../../../../../../services/APIs';
import { useCan } from '../../../../../../core/permissions/useCan';
import {
  money,
  printQuotation,
  QUOTATION_STATUS,
  QUOTATIONS_CHANGED,
  quotationCustomer,
  quotationFolio,
  quotationTotals,
  shareQuotation,
} from '../printQuotation';
import { SALES_ORDERS_CHANGED } from '../../sales-order/printSalesOrder';
import './ModalQuotationDetail.css';

const ModalQuotationDetail: React.FC = () => {
  const dispatch = useDispatch();
  const activeModal = useSelector((state: any) => state.modals);
  const modalActive = activeModal === 'quotation_detail_modal';
  const can = useCan();
  const canManage = can('sales.quote.manage');
  const canCreateOrder = can('sales.order.create') || can('sales.order.manage');

  const [loading, setLoading] = useState(false);
  const [quotation, setQuotation] = useState<any>(null);

  const load = async (id: number) => {
    setLoading(true);
    try {
      const response: any = await APIs.getQuotationById(id);
      setQuotation(response?.data ?? response);
    } catch (e) {
      console.error('Error loading quotation details', e);
      setQuotation(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!modalActive) return;
    const id = localStorage.getItem('selected_quotation_id');
    if (id) load(Number(id));
  }, [modalActive]);

  const close = () => dispatch(modal(''));

  const changeStatus = async (status: string, confirmText?: string) => {
    if (!quotation) return;
    if (confirmText) {
      const result = await Swal.fire({
        icon: status === 'REJECTED' ? 'warning' : 'question',
        title: confirmText,
        showCancelButton: true,
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Volver',
      });
      if (!result.isConfirmed) return;
    }
    try {
      await APIs.updateQuotationStatus(quotation.id, status);
      Swal.fire({ icon: 'success', title: `Cotización ${QUOTATION_STATUS[status]?.label.toLowerCase() ?? status}`, timer: 1400, showConfirmButton: false });
      window.dispatchEvent(new Event(QUOTATIONS_CHANGED));
      await load(quotation.id);
    } catch (e: any) {
      const message = e?.response?.data?.message;
      Swal.fire('Error', (Array.isArray(message) ? message.join(', ') : message) || 'No se pudo actualizar el estado', 'error');
    }
  };

  // Convierte la cotización en orden de venta (copia cliente y conceptos y la marca como aceptada)
  const createOrder = async () => {
    const result = await Swal.fire({
      icon: 'question',
      title: '¿Crear la orden de venta?',
      text: 'Se copian el cliente y los conceptos de esta cotización y la cotización queda como aceptada.',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear orden',
      cancelButtonText: 'Volver',
    });
    if (!result.isConfirmed) return;
    try {
      const response: any = await APIs.createSalesOrderFromQuotation(quotation.id);
      const created = response?.data;
      Swal.fire({
        icon: 'success',
        title: 'Orden de venta creada',
        text: created ? `Folio ${created.serie?.name || 'OV'}-${created.folio}. La encuentras en Ventas > Orden de venta.` : undefined,
      });
      window.dispatchEvent(new Event(QUOTATIONS_CHANGED));
      window.dispatchEvent(new Event(SALES_ORDERS_CHANGED));
      await load(quotation.id);
    } catch (e: any) {
      const message = e?.response?.data?.message;
      Swal.fire('Error', (Array.isArray(message) ? message.join(', ') : message) || 'No se pudo crear la orden de venta', 'error');
    }
  };

  const edit = () => {
    localStorage.setItem('selected_quotation_id', String(quotation.id));
    dispatch(modal('quotation_modal'));
  };

  const share = async () => {
    const result = await shareQuotation(quotation);
    if (result === 'copied') {
      Swal.fire({ icon: 'success', title: 'Resumen copiado', text: 'Pégalo en WhatsApp, correo o donde quieras compartirlo.', timer: 1800, showConfirmButton: false });
    } else if (result === 'failed') {
      Swal.fire('Error', 'No se pudo compartir la cotización.', 'error');
    }
  };

  if (!modalActive) return null;
  if (!quotation && !loading) return null;

  const status = QUOTATION_STATUS[quotation?.status] ?? { label: quotation?.status ?? '', color: '#5b6472', bg: '#eef0f3' };
  const items: any[] = quotation?.items ?? [];
  const totals = quotationTotals(items);
  const creator = [quotation?.user?.firstName, quotation?.user?.firstLastName].filter(Boolean).join(' ') || '—';
  const editable = quotation && quotation.status !== 'ACCEPTED';

  return (
    <div className='qd-overlay' onClick={close}>
      <div className='qd-popup' onClick={(e) => e.stopPropagation()}>
        <div className='qd-header'>
          <div className='qd-title'>
            <h3>Cotización</h3>
            {quotation && <span className='qd-folio'>{quotationFolio(quotation)}</span>}
            {quotation && (
              <span className='qd-status' style={{ backgroundColor: status.color + '20', color: status.color }}>
                {status.label}
              </span>
            )}
          </div>
          <button className='qd-close' onClick={close} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>

        {loading || !quotation ? (
          <div className='qd-loading'>Cargando...</div>
        ) : (
          <>
            <div className='qd-body'>
              <div className='qd-grid'>
                <div className='qd-item qd-item--wide'>
                  <label>Cliente</label>
                  <p>{quotationCustomer(quotation)}</p>
                </div>
                {quotation.title && (
                  <div className='qd-item qd-item--wide'>
                    <label>Título</label>
                    <p>{quotation.title}</p>
                  </div>
                )}
                <div className='qd-item'>
                  <label>Empresa</label>
                  <p>{quotation.company?.name || '—'}</p>
                </div>
                <div className='qd-item'>
                  <label>Sucursal</label>
                  <p>{quotation.branch?.name || '—'}</p>
                </div>
                <div className='qd-item'>
                  <label>Elaboró</label>
                  <p>{creator}</p>
                </div>
                <div className='qd-item'>
                  <label>Fecha</label>
                  <p>{quotation.createdAt ? format(new Date(quotation.createdAt), 'dd/MM/yyyy HH:mm') : '—'}</p>
                </div>
                <div className='qd-item'>
                  <label>Vigencia</label>
                  <p>{quotation.validUntil ? format(new Date(quotation.validUntil), 'dd/MM/yyyy') : '—'}</p>
                </div>
                <div className='qd-item'>
                  <label>Condiciones de pago</label>
                  <p>{quotation.paymentTerms || '—'}</p>
                </div>
                <div className='qd-item'>
                  <label>Tiempo de entrega</label>
                  <p>{quotation.deliveryTime || '—'}</p>
                </div>
                {quotation.salesOrders?.length > 0 && (
                  <div className='qd-item'>
                    <label>Orden de venta</label>
                    <p>{quotation.salesOrders[0].serie?.name || 'OV'}-{quotation.salesOrders[0].folio}</p>
                  </div>
                )}
              </div>

              {quotation.comments && (
                <div className='qd-note'>
                  <label>Comentarios</label>
                  <p>{quotation.comments}</p>
                </div>
              )}

              <div className='qd-section-title'>Conceptos <span>{items.length}</span></div>
              <div className='qd-table-wrap'>
                <table className='qd-table'>
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th className='r'>Cantidad</th>
                      <th>Unidad</th>
                      <th className='r'>Precio</th>
                      <th className='r'>Desc.</th>
                      <th className='c'>IVA</th>
                      <th className='r'>Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan={7} className='qd-empty'>Esta cotización no tiene conceptos.</td></tr>
                    ) : (
                      items.map((item: any, index: number) => {
                        const line = Number(item.quantity || 0) * Number(item.price || 0) - Number(item.discount || 0);
                        return (
                          <tr key={index}>
                            <td data-label='Descripción' className='qd-name'>
                              <strong>{item.name || '—'}</strong>
                              {item.code && <small>{item.code}</small>}
                              {item.comments && <em>{item.comments}</em>}
                            </td>
                            <td data-label='Cantidad' className='r'>{Number(item.quantity)}</td>
                            <td data-label='Unidad'>{item.unit?.name || '—'}</td>
                            <td data-label='Precio' className='r'>{money(Number(item.price || 0))}</td>
                            <td data-label='Descuento' className='r'>{Number(item.discount || 0) ? money(Number(item.discount)) : '—'}</td>
                            <td data-label='IVA' className='c'>{item.ivaOn ? 'Sí' : 'No'}</td>
                            <td data-label='Importe' className='r qd-total-cell'>{money(line)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className='qd-totals'>
                <div><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
                {totals.discount > 0 && <div><span>Descuento</span><span>-{money(totals.discount)}</span></div>}
                <div><span>IVA</span><span>{money(totals.iva)}</span></div>
                <div className='qd-totals__grand'><span>Total</span><span>{money(totals.total)}</span></div>
              </div>
            </div>

            <div className='qd-footer'>
              <div className='qd-actions'>
                <button type='button' className='qd-btn qd-btn--ghost' onClick={() => printQuotation(quotation)}>
                  <span className='material-symbols-rounded' aria-hidden>print</span>
                  Imprimir
                </button>
                <button type='button' className='qd-btn qd-btn--ghost' onClick={share}>
                  <span className='material-symbols-rounded' aria-hidden>share</span>
                  Compartir
                </button>
                {canManage && editable && (
                  <button type='button' className='qd-btn qd-btn--ghost' onClick={edit}>
                    <span className='material-symbols-rounded' aria-hidden>edit</span>
                    Editar
                  </button>
                )}
              </div>
              {(canManage || canCreateOrder) && (
                <div className='qd-actions qd-actions--status'>
                  {canCreateOrder && ['SENT', 'ACCEPTED'].includes(quotation.status) && !(quotation.salesOrders?.length > 0) && (
                    <button type='button' className='qd-btn qd-btn--approve' onClick={createOrder}>
                      <span className='material-symbols-rounded' aria-hidden>receipt_long</span>
                      Crear orden de venta
                    </button>
                  )}
                  {canManage && quotation.status === 'DRAFT' && (
                    <button type='button' className='qd-btn qd-btn--approve' onClick={() => changeStatus('SENT', '¿Marcar la cotización como enviada?')}>
                      <span className='material-symbols-rounded' aria-hidden>send</span>
                      Marcar como enviada
                    </button>
                  )}
                  {canManage && quotation.status === 'SENT' && (
                    <>
                      <button type='button' className='qd-btn qd-btn--reject' onClick={() => changeStatus('REJECTED', '¿Marcar la cotización como rechazada?')}>
                        <span className='material-symbols-rounded' aria-hidden>close</span>
                        Rechazada
                      </button>
                      <button type='button' className='qd-btn qd-btn--approve' onClick={() => changeStatus('ACCEPTED', '¿El cliente aceptó la cotización?')}>
                        <span className='material-symbols-rounded' aria-hidden>check</span>
                        Aceptada
                      </button>
                    </>
                  )}
                  {canManage && (quotation.status === 'REJECTED' || quotation.status === 'EXPIRED') && (
                    <button type='button' className='qd-btn qd-btn--ghost' onClick={() => changeStatus('DRAFT', '¿Regresar la cotización a borrador?')}>
                      <span className='material-symbols-rounded' aria-hidden>undo</span>
                      Volver a borrador
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

export default ModalQuotationDetail;
