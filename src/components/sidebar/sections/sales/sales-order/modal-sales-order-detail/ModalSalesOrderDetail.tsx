import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { modal } from '../../../../../../redux/state/modals';
import APIs from '../../../../../../services/APIs';
import { useCan } from '../../../../../../core/permissions/useCan';
import {
  money,
  printSalesOrder,
  SALES_ORDER_STATUS,
  SALES_ORDERS_CHANGED,
  salesOrderCustomer,
  salesOrderFolio,
  salesOrderTotals,
  shareSalesOrder,
} from '../printSalesOrder';
import './ModalSalesOrderDetail.css';

// Cantidad entregada de un concepto: se guarda al salir del campo o con Enter (no en cada tecla)
const DeliveryInput: React.FC<{ value: number; max: number; disabled: boolean; onCommit: (value: number) => void }> = ({ value, max, disabled, onCommit }) => {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const commit = () => {
    const next = text === '' ? 0 : Number(text);
    if (!Number.isFinite(next) || next < 0 || next > max) {
      setText(String(value));
      return;
    }
    if (next !== value) onCommit(next);
  };

  return (
    <input
      type='number'
      inputMode='decimal'
      className='sd-delivery'
      min={0}
      max={max}
      disabled={disabled}
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
    />
  );
};

const ModalSalesOrderDetail: React.FC = () => {
  const dispatch = useDispatch();
  const activeModal = useSelector((state: any) => state.modals);
  const modalActive = activeModal === 'sales_order_detail_modal';
  const can = useCan();
  const canManage = can('sales.order.manage');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<any>(null);

  const load = async (id: number, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response: any = await APIs.getSalesOrderById(id);
      setOrder(response?.data ?? response);
    } catch (e) {
      console.error('Error loading sales order details', e);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!modalActive) return;
    const id = localStorage.getItem('selected_sales_order_id');
    if (id) load(Number(id));
  }, [modalActive]);

  const close = () => dispatch(modal(''));

  const apiError = (e: any, fallback: string) => {
    const message = e?.response?.data?.message;
    Swal.fire('Error', (Array.isArray(message) ? message.join(', ') : message) || fallback, 'error');
  };

  const changeStatus = async (status: string, confirmText: string) => {
    if (!order) return;
    const result = await Swal.fire({
      icon: status === 'CANCELLED' ? 'warning' : 'question',
      title: confirmText,
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Volver',
    });
    if (!result.isConfirmed) return;
    try {
      await APIs.updateSalesOrderStatus(order.id, status);
      Swal.fire({ icon: 'success', title: `Orden ${SALES_ORDER_STATUS[status]?.label.toLowerCase() ?? status}`, timer: 1400, showConfirmButton: false });
      window.dispatchEvent(new Event(SALES_ORDERS_CHANGED));
      await load(order.id, true);
    } catch (e) {
      apiError(e, 'No se pudo actualizar el estado');
    }
  };

  const saveDelivery = async (itemId: number, quantity: number) => {
    setSaving(true);
    try {
      await APIs.updateSalesOrderItemDelivery(itemId, quantity);
      window.dispatchEvent(new Event(SALES_ORDERS_CHANGED));
      await load(order.id, true);
    } catch (e) {
      apiError(e, 'No se pudo registrar la entrega');
      await load(order.id, true);
    } finally {
      setSaving(false);
    }
  };

  // Atajo: marca todo lo ordenado como entregado
  const deliverAll = async () => {
    const result = await Swal.fire({
      icon: 'question',
      title: '¿Marcar todo como entregado?',
      text: 'Se registra la cantidad completa de cada concepto y la orden pasa a Completada.',
      showCancelButton: true,
      confirmButtonText: 'Sí, entregar todo',
      cancelButtonText: 'Volver',
    });
    if (!result.isConfirmed) return;
    setSaving(true);
    try {
      for (const item of order.items) {
        if (Number(item.deliveredQuantity) < Number(item.quantity)) {
          await APIs.updateSalesOrderItemDelivery(item.id, Number(item.quantity));
        }
      }
      window.dispatchEvent(new Event(SALES_ORDERS_CHANGED));
      await load(order.id, true);
    } catch (e) {
      apiError(e, 'No se pudo registrar la entrega');
      await load(order.id, true);
    } finally {
      setSaving(false);
    }
  };

  const edit = () => {
    localStorage.setItem('selected_sales_order_id', String(order.id));
    dispatch(modal('sales_order_modal'));
  };

  const share = async () => {
    const result = await shareSalesOrder(order);
    if (result === 'copied') {
      Swal.fire({ icon: 'success', title: 'Resumen copiado', text: 'Pégalo en WhatsApp, correo o donde quieras compartirlo.', timer: 1800, showConfirmButton: false });
    } else if (result === 'failed') {
      Swal.fire('Error', 'No se pudo compartir la orden de venta.', 'error');
    }
  };

  if (!modalActive) return null;
  if (!order && !loading) return null;

  const status = SALES_ORDER_STATUS[order?.status] ?? { label: order?.status ?? '', color: '#5b6472', bg: '#eef0f3' };
  const items: any[] = order?.items ?? [];
  const totals = salesOrderTotals(items);
  const creator = [order?.user?.firstName, order?.user?.firstLastName].filter(Boolean).join(' ') || '—';
  const hasDeliveries = items.some((i) => Number(i.deliveredQuantity) > 0);
  const deliveredItems = items.filter((i) => Number(i.deliveredQuantity) >= Number(i.quantity)).length;
  const isActive = order?.status === 'ACTIVE';

  return (
    <div className='sd-overlay' onClick={close}>
      <div className='sd-popup' onClick={(e) => e.stopPropagation()}>
        <div className='sd-header'>
          <div className='sd-title'>
            <h3>Orden de venta</h3>
            {order && <span className='sd-folio'>{salesOrderFolio(order)}</span>}
            {order && (
              <span className='sd-status' style={{ backgroundColor: status.color + '20', color: status.color }}>
                {status.label}
              </span>
            )}
          </div>
          <button className='sd-close' onClick={close} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>

        {loading || !order ? (
          <div className='sd-loading'>Cargando...</div>
        ) : (
          <>
            <div className='sd-body'>
              <div className='sd-grid'>
                <div className='sd-item sd-item--wide'>
                  <label>Cliente</label>
                  <p>{salesOrderCustomer(order)}</p>
                </div>
                {order.title && (
                  <div className='sd-item sd-item--wide'>
                    <label>Título</label>
                    <p>{order.title}</p>
                  </div>
                )}
                <div className='sd-item'>
                  <label>Empresa</label>
                  <p>{order.company?.name || '—'}</p>
                </div>
                <div className='sd-item'>
                  <label>Sucursal</label>
                  <p>{order.branch?.name || '—'}</p>
                </div>
                <div className='sd-item'>
                  <label>Elaboró</label>
                  <p>{creator}</p>
                </div>
                <div className='sd-item'>
                  <label>Fecha</label>
                  <p>{order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm') : '—'}</p>
                </div>
                <div className='sd-item'>
                  <label>Fecha de entrega</label>
                  <p>{order.deliveryDate ? format(new Date(order.deliveryDate), 'dd/MM/yyyy') : '—'}</p>
                </div>
                <div className='sd-item'>
                  <label>Condiciones de pago</label>
                  <p>{order.paymentTerms || '—'}</p>
                </div>
                {order.quotation && (
                  <div className='sd-item'>
                    <label>Cotización origen</label>
                    <p>{order.quotation.serie?.name || 'COT'}-{order.quotation.folio}</p>
                  </div>
                )}
              </div>

              {order.comments && (
                <div className='sd-note'>
                  <label>Comentarios</label>
                  <p>{order.comments}</p>
                </div>
              )}

              <div className='sd-section-title'>
                Conceptos <span>{items.length}</span>
                <small>{deliveredItems} de {items.length} entregados</small>
              </div>
              <div className='sd-table-wrap'>
                <table className='sd-table'>
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th className='r'>Cantidad</th>
                      <th className='r'>Entregado</th>
                      <th>Unidad</th>
                      <th className='r'>Precio</th>
                      <th className='c'>IVA</th>
                      <th className='r'>Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan={7} className='sd-empty'>Esta orden de venta no tiene conceptos.</td></tr>
                    ) : (
                      items.map((item: any) => {
                        const line = Number(item.quantity || 0) * Number(item.price || 0) - Number(item.discount || 0);
                        const done = Number(item.deliveredQuantity) >= Number(item.quantity);
                        return (
                          <tr key={item.id}>
                            <td data-label='Descripción' className='sd-name'>
                              <strong>{item.name || '—'}</strong>
                              {item.code && <small>{item.code}</small>}
                              {item.comments && <em>{item.comments}</em>}
                            </td>
                            <td data-label='Cantidad' className='r'>{Number(item.quantity)}</td>
                            <td data-label='Entregado' className='r'>
                              {canManage && isActive ? (
                                <DeliveryInput
                                  value={Number(item.deliveredQuantity)}
                                  max={Number(item.quantity)}
                                  disabled={saving}
                                  onCommit={(v) => saveDelivery(item.id, v)}
                                />
                              ) : (
                                <span className={done ? 'sd-done' : ''}>{Number(item.deliveredQuantity)}</span>
                              )}
                            </td>
                            <td data-label='Unidad'>{item.unit?.name || '—'}</td>
                            <td data-label='Precio' className='r'>{money(Number(item.price || 0))}</td>
                            <td data-label='IVA' className='c'>{item.ivaOn ? 'Sí' : 'No'}</td>
                            <td data-label='Importe' className='r sd-total-cell'>{money(line)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className='sd-totals'>
                <div><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
                {totals.discount > 0 && <div><span>Descuento</span><span>-{money(totals.discount)}</span></div>}
                <div><span>IVA</span><span>{money(totals.iva)}</span></div>
                <div className='sd-totals__grand'><span>Total</span><span>{money(totals.total)}</span></div>
              </div>
            </div>

            <div className='sd-footer'>
              <div className='sd-actions'>
                <button type='button' className='sd-btn sd-btn--ghost' onClick={() => printSalesOrder(order)}>
                  <span className='material-symbols-rounded' aria-hidden>print</span>
                  Imprimir
                </button>
                <button type='button' className='sd-btn sd-btn--ghost' onClick={share}>
                  <span className='material-symbols-rounded' aria-hidden>share</span>
                  Compartir
                </button>
                {canManage && isActive && !hasDeliveries && (
                  <button type='button' className='sd-btn sd-btn--ghost' onClick={edit}>
                    <span className='material-symbols-rounded' aria-hidden>edit</span>
                    Editar
                  </button>
                )}
              </div>
              {canManage && (
                <div className='sd-actions sd-actions--status'>
                  {isActive && (
                    <>
                      <button type='button' className='sd-btn sd-btn--reject' onClick={() => changeStatus('CANCELLED', '¿Cancelar esta orden de venta?')}>
                        <span className='material-symbols-rounded' aria-hidden>block</span>
                        Cancelar orden
                      </button>
                      <button type='button' className='sd-btn sd-btn--approve' disabled={saving} onClick={deliverAll}>
                        <span className='material-symbols-rounded' aria-hidden>task_alt</span>
                        Entregar todo
                      </button>
                    </>
                  )}
                  {order.status === 'CANCELLED' && (
                    <button type='button' className='sd-btn sd-btn--ghost' onClick={() => changeStatus('ACTIVE', '¿Reabrir esta orden de venta?')}>
                      <span className='material-symbols-rounded' aria-hidden>undo</span>
                      Reabrir
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

export default ModalSalesOrderDetail;
