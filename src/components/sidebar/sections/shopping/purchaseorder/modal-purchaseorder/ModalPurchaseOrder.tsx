import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { modal } from '../../../../../../redux/state/modals';
import APIs from '../../../../../../services/APIs';
import Swal from 'sweetalert2';
import './ModalPurchaseOrder.css';

interface PurchaseOrderItem {
  productId?: number;
  quantity: number;
  unitId: number;
  storeId: number;
  price: number;
  discount: number;
  ivaOn: boolean;
  comments: string;
  code?: string;
  name?: string;
}

const ModalPurchaseOrder: React.FC = () => {
  const dispatch = useDispatch();
  const userState = useSelector((state: any) => state.user);
  const activeModal = useSelector((state: any) => state.modals);
  const modalActive = activeModal === 'purchase_order_modal';
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [poId, setPoId] = useState<number | null>(null);

  // Header States
  const [selectedCompany, setSelectedCompany] = useState<number>(0);
  const [selectedBranch, setSelectedBranch] = useState<number>(0);
  const [arrivalDate, setArrivalDate] = useState('');
  const [quote, setQuote] = useState('');
  const [bill, setBill] = useState('');
  const [purchaseType, setPurchaseType] = useState(0); // 0: Direct, 1: By Requisition
  const [freightProvider, setFreightProvider] = useState<number>(0);
  const [freightCost, setFreightCost] = useState(0);
  const [sumFreight, setSumFreight] = useState(false);
  const [freightComments, setFreightComments] = useState('');
  const [generalComments, setGeneralComments] = useState('');

  // Data for selects
  const [companies, setCompanies] = useState<any[]>([]);
  const [branchOffices, setBranchOffices] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Requisition Filter States
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [reqFilterLoading, setReqFilterLoading] = useState(false);
  const [reqStartDate, setReqStartDate] = useState('');
  const [reqEndDate, setReqEndDate] = useState('');

  // Items Table
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    productId: undefined,
    quantity: 0,
    unitId: 0,
    storeId: 0,
    price: 0,
    discount: 0,
    ivaOn: false,
    comments: '',
    code: '',
    name: ''
  });

  const loadInitialData = async () => {
    try {
      const userId = userState?.id || 1;
      const compData = await APIs.getCompaniesByUser(userId);
      const companiesList = Array.isArray(compData) ? compData : (compData?.data || []);
      setCompanies(companiesList);
      // Alta con una sola empresa (o la activa de la sesión si no hay lista): se elige sola.
      if (!window.location.pathname.match(/\d+$/) && !isEditMode) {
        const onlyCompanyId = companiesList.length === 1
          ? companiesList[0].id
          : companiesList.length === 0 ? (userState?.activeCompanyId ?? userState?.companyId ?? 0) : 0;
        if (onlyCompanyId) await handleCompanyChange(onlyCompanyId);
      }

      const supplData = await APIs.getSuppliers({ id_usuario: userId, is_flete: true });
      setSuppliers(Array.isArray(supplData) ? supplData : (supplData?.data || []));

      const unitsData = await APIs.getUnits();
      setUnits(Array.isArray(unitsData) ? unitsData : (unitsData?.data || []));
    } catch (e) {
      console.error('Error loading initial data', e);
    }
  };

  const loadPurchaseOrder = async (id: number) => {
    setLoading(true);
    try {
      const response: any = await APIs.getPurchaseOrderById(id);
      const po = response?.data || response;
      if (!po) throw new Error('Order not found');

      setSelectedCompany(po.companyId);
      setSelectedBranch(po.branchId);
      setArrivalDate(po.arrivalDate ? new Date(po.arrivalDate).toISOString().split('T')[0] : '');
      setQuote(po.quote || '');
      setBill(po.bill || '');
      setPurchaseType(po.type || 0);
      setFreightProvider(po.freightProviderId || 0);
      setFreightCost(po.freightCost || 0);
      setSumFreight(po.sumFreight || false);
      setFreightComments(po.freightComments || '');
      setGeneralComments(po.comments || '');

      if (po.items) {
        setItems(po.items.map((item: any) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitId: item.unitId,
          storeId: item.storeId,
          price: item.price,
          discount: item.discount,
          ivaOn: item.ivaOn,
          comments: item.comments || '',
          code: item.code || '',
          name: item.name || '',
        })));
      }
    } catch (e) {
      console.error('Error loading purchase order', e);
      Swal.fire('Error', 'No se pudo cargar la orden de compra', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    const id = localStorage.getItem('selected_po_id');
    if (id) {
      setIsEditMode(true);
      setPoId(Number(id));
      loadPurchaseOrder(Number(id));
    }
  }, []);

  const handleCompanyChange = async (companyId: number) => {
    setSelectedCompany(companyId);
    setSelectedBranch(0);
    try {
      const userId = userState?.id || 1;
      const response = await APIs.getBranchOffices(companyId, userId);
      const branchesList = Array.isArray(response) ? response : (response?.data || []);
      setBranchOffices(branchesList);
      // Con una sola sucursal se elige sola.
      if (branchesList.length === 1) setSelectedBranch(branchesList[0].id);
    } catch (e) {
      console.error('Error loading branches', e);
    }
  };

  const filterRequisitions = async () => {
    if (!selectedCompany || !selectedBranch) {
      Swal.fire('Atención', 'Por favor seleccione empresa y sucursal', 'warning');
      return;
    }
    setReqFilterLoading(true);
    try {
      const response: any = await APIs.getRequisitions({
        companyId: selectedCompany,
        branchId: selectedBranch,
        userId: userState?.id || 1,
        status: 'PENDING',
        desde: reqStartDate,
        hasta: reqEndDate,
      });
      if (response?.status === 'success' && Array.isArray(response.data)) {
        setRequisitions(response.data);
      } else {
        setRequisitions(Array.isArray(response) ? response : (response?.data || []));
      }
    } catch (e) {
      console.error('Error filtering requisitions', e);
      setRequisitions([]);
    } finally {
      setReqFilterLoading(false);
    }
  };

  const addRequisitionItems = async (req: any) => {
    try {
      let requisitionData = req;

      // El objeto proporcionado usa "items" en lugar de "conceptos"
      if (!requisitionData.items && !requisitionData.conceptos) {
        const detailResponse: any = await APIs.getRequisitionById(req.id);
        if (detailResponse?.status === 'success') {
          requisitionData = detailResponse.data;
        } else if (Array.isArray(detailResponse)) {
          requisitionData = detailResponse[0];
        } else {
          requisitionData = detailResponse;
        }
      }

      const itemsList = requisitionData.items || requisitionData.conceptos;

      if (!itemsList || !Array.isArray(itemsList)) {
        Swal.fire('Error', 'Esta requisición no tiene artículos o no se pudieron obtener', 'error');
        return;
      }

      const newItems: PurchaseOrderItem[] = itemsList.map((item: any) => ({
        productId: item.productId || item.id_articulo,
        quantity: Number(item.quantity) || 0,
        unitId: item.unitId || item.unidad || 0,
        storeId: selectedBranch,
        price: 0,
        discount: 0,
        ivaOn: false,
        comments: item.comments || item.comentarios || '',
        code: item.code || item.codigo,
        name: item.name || item.descripcion,
      }));

      setItems([...items, ...newItems]);
      Swal.fire('Éxito', `Se han agregado ${newItems.length} artículos de la requisición`, 'success');
    } catch (e) {
      console.error('Error adding requisition items', e);
      Swal.fire('Error', 'Ocurrió un error al obtener los artículos de la requisición', 'error');
    }
  };

  const addItem = () => {
    setItems([...items, { ...currentItem }]);
    setCurrentItem({
      productId: undefined,
      quantity: 0,
      unitId: 0,
      storeId: 0,
      price: 0,
      discount: 0,
      ivaOn: false,
      comments: '',
      code: '',
      name: ''
    });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    setItems(newItems);
  };

  const updateItemUnit = (index: number, unitId: number) => {
    const newItems = [...items];
    newItems[index].unitId = unitId;
    setItems(newItems);
  };

  const updateItemPrice = (index: number, price: number) => {
    const newItems = [...items];
    newItems[index].price = price;
    setItems(newItems);
  };

  const updateItemIva = (index: number, ivaOn: boolean) => {
    const newItems = [...items];
    newItems[index].ivaOn = ivaOn;
    setItems(newItems);
  };

  const updateItemComments = (index: number, comments: string) => {
    const newItems = [...items];
    newItems[index].comments = comments;
    setItems(newItems);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let ivaTotal = 0;

    items.forEach(item => {
      const itemSubtotal = item.quantity * item.price;
      subtotal += itemSubtotal;
      totalDiscount += Number(item.discount || 0);
      if (item.ivaOn) {
        ivaTotal += itemSubtotal * 0.16;
      }
    });

    const total = subtotal - totalDiscount + ivaTotal + (sumFreight ? freightCost : 0);
    return { subtotal, totalDiscount, ivaTotal, total };
  };

  const { subtotal, totalDiscount, ivaTotal, total } = calculateTotals();

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        companyId: selectedCompany,
        branchId: selectedBranch,
        arrivalDate: arrivalDate,
        quote: quote,
        bill: bill,
        type: purchaseType,
        freightProviderId: freightProvider,
        freightCost: freightCost,
        sumFreight: sumFreight,
        freightComments: freightComments,
        comments: generalComments,
        userId: userState?.id || 1,
        items: items
      };

      let response;
      if (isEditMode && poId) {
        response = await APIs.updatePurchaseOrder(poId, payload);
      } else {
        response = await APIs.createPurchaseOrder(payload);
      }

      if (response.status === 'success') {
        Swal.fire('Éxito', isEditMode ? 'Orden de compra actualizada correctamente' : 'Orden de compra creada correctamente', 'success');
        dispatch(modal(''));
        localStorage.removeItem('selected_po_id');
      } else {
        Swal.fire('Error', response.message || 'Error al procesar la orden', 'error');
      }
    } catch (e) {
      Swal.fire('Error', 'Ocurrió un error al procesar la orden', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`modal-purchase-order-overlay ${modalActive ? 'active' : ''}`}>
      <div className={`modal-purchase-order-content ${modalActive ? 'active' : ''}`}>
        <div className='modal-header'>
          <div className='header-type-selector'>
            <div className='radio-group'>
              <label>
                <input type="radio" checked={purchaseType === 0} onChange={() => setPurchaseType(0)} disabled={isEditMode} /> Directa
              </label>
              <label>
                <input type="radio" checked={purchaseType === 1} onChange={() => setPurchaseType(1)} disabled={isEditMode} /> Por Requisición
              </label>
            </div>
          </div>
          <button className='close-btn' onClick={() => dispatch(modal(''))}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className='modal-body'>
          <div className='header-grid'>
            {companies.length > 1 && (
            <div className='input-group'>
              <label>Empresa</label>
              <select value={selectedCompany} onChange={(e) => handleCompanyChange(Number(e.target.value))} disabled={isEditMode}>
                <option value={0}>Seleccione Empresa</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            )}
            {branchOffices.length > 1 && (
            <div className='input-group'>
              <label>Sucursal</label>
              <select value={selectedBranch} onChange={(e) => setSelectedBranch(Number(e.target.value))} disabled={!selectedCompany || isEditMode}>
                <option value={0}>Seleccione Sucursal</option>
                {branchOffices.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            )}
            <div className='input-group'>
              <label>Fecha de Llegada</label>
              <input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
            </div>
            <div className='input-group'>
              <label>Cotización</label>
              <input type="text" value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Ej: COT-123" />
            </div>
            <div className='input-group'>
              <label>Factura</label>
              <input type="text" value={bill} onChange={(e) => setBill(e.target.value)} placeholder="Ej: FAC-456" />
            </div>
          </div>

          <div className='freight-section'>
            <h4>Datos de Flete</h4>
            <div className='freight-grid'>
              <div className='input-group'>
                <label>Proveedor Flete</label>
                <select value={freightProvider} onChange={(e) => setFreightProvider(Number(e.target.value))}>
                  <option value={0}>Seleccione Proveedor</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.nombre_comercial}</option>)}
                </select>
              </div>
              <div className='input-group'>
                <label>Costo Flete</label>
                <input type="number" value={freightCost} onChange={(e) => setFreightCost(Number(e.target.value))} />
              </div>
              <div className='input-group checkbox-group'>
                <label>Sumar al Total</label>
                <input type="checkbox" checked={sumFreight} onChange={(e) => setSumFreight(e.target.checked)} />
              </div>
              <div className='input-group full-width'>
                <label>Comentarios Flete</label>
                <input type="text" value={freightComments} onChange={(e) => setFreightComments(e.target.value)} />
              </div>
            </div>
          </div>

          <div className='input-group full-width'>
            <label>Comentarios Generales</label>
            <textarea value={generalComments} onChange={(e) => setGeneralComments(e.target.value)}></textarea>
          </div>

          <div className='items-section'>
            <h4>Artículos</h4>
            {purchaseType === 0 ? (
              <>
                <div className='item-entry-grid'>
                  <div className='input-group'>
                    <label>Artículo</label>
                    <input type="text" value={currentItem.name} onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})} placeholder="Buscar artículo..." />
                  </div>
                  <div className='input-group'>
                    <label>Cantidad</label>
                    <input type="number" value={currentItem.quantity} onChange={(e) => setCurrentItem({...currentItem, quantity: Number(e.target.value)})} />
                  </div>
                  <div className='input-group'>
                    <label>Unidad</label>
                    <select value={currentItem.unitId} onChange={(e) => setCurrentItem({...currentItem, unitId: Number(e.target.value)})}>
                      <option value={0}>Seleccione</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className='input-group'>
                    <label>Precio Unit.</label>
                    <input type="number" value={currentItem.price} onChange={(e) => setCurrentItem({...currentItem, price: Number(e.target.value)})} />
                  </div>
                  <div className='input-group'>
                    <label>IVA</label>
                    <input type="checkbox" checked={currentItem.ivaOn} onChange={(e) => setCurrentItem({...currentItem, ivaOn: e.target.checked})} />
                  </div>
                  <button className='add-item-btn' onClick={addItem}>Agregar</button>
                </div>
              </>
            ) : (
              <div className='requisition-filter-container'>
                <div className='filter-row'>
                  <div className='input-group'>
                    <label>Desde</label>
                    <input type="date" value={reqStartDate} onChange={(e) => setReqStartDate(e.target.value)} />
                  </div>
                  <div className='input-group'>
                    <label>Hasta</label>
                    <input type="date" value={reqEndDate} onChange={(e) => setReqEndDate(e.target.value)} />
                  </div>
                  <button className='filter-btn' onClick={filterRequisitions} disabled={reqFilterLoading}>
                    {reqFilterLoading ? 'Buscando...' : 'Filtrar Requisiciones'}
                  </button>
                </div>
                <div className='requisition-table-wrap'>
                  <table className='requisition-table'>
                    <thead>
                      <tr>
                        <th>Folio</th>
                        <th>Empresa</th>
                        <th>Sucursal</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requisitions.length > 0 ? (
                        requisitions.map((req, index) => (
                          <tr key={index}>
                            <td>{req.serie?.name ? `${req.serie.name}-${req.folio}` : req.folio}</td>
                            <td>{req.company?.name || req.companyId}</td>
                            <td>{req.branch?.name || req.branchId}</td>
                            <td>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}</td>
                            <td>
                              <button className='add-req-btn' onClick={() => addRequisitionItems(req)}>Agregar Artículos</button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center' }}>
                            {reqFilterLoading ? 'Cargando...' : 'No se encontraron requisiciones pendientes.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className='items-table-wrap'>
              <table className='items-table'>
                <thead>
                  <tr>
                    <th>Artículo</th>
                    <th>Cant.</th>
                    <th>Unid.</th>
                    <th>Precio</th>
                    <th>Desc.</th>
                    <th>IVA</th>
                    <th>Comentarios</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name || item.code || 'N/A'}</td>
                      <td>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(index, Number(e.target.value))}
                          className="item-input"
                        />
                      </td>
                      <td>
                        <select
                          value={item.unitId}
                          onChange={(e) => updateItemUnit(index, Number(e.target.value))}
                          className="item-input"
                        >
                          <option value={0}>Seleccione</option>
                          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItemPrice(index, Number(e.target.value))}
                          className="item-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].discount = Number(e.target.value);
                            setItems(newItems);
                          }}
                          className="item-input"
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={item.ivaOn}
                          onChange={(e) => updateItemIva(index, e.target.checked)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.comments}
                          onChange={(e) => updateItemComments(index, e.target.value)}
                          className="item-input"
                        />
                      </td>
                      <td>${(item.quantity * item.price - item.discount).toFixed(2)}</td>
                      <td>
                        <button className='remove-btn' onClick={() => removeItem(index)}>
                          <span className="material-symbols-rounded">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className='totals-section'>
            <div className='total-row'>
              <span>Subtotal:</span>
              <span className='value'>${subtotal.toFixed(2)}</span>
            </div>
            <div className='total-row'>
              <span>Descuento:</span>
              <span className='value'>-${totalDiscount.toFixed(2)}</span>
            </div>
            <div className='total-row'>
              <span>IVA Total:</span>
              <span className='value'>${ivaTotal.toFixed(2)}</span>
            </div>
            <div className='total-row'>
              <span>Flete:</span>
              <span className='value'>${sumFreight ? freightCost.toFixed(2) : '0.00'}</span>
            </div>
            <div className='total-row grand-total'>
              <span>Total:</span>
              <span className='value'>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className='modal-footer'>
          <button className='cancel-btn' onClick={() => {
            dispatch(modal(''));
            localStorage.removeItem('selected_po_id');
          }}>Cancelar</button>
          <button className='save-btn' disabled={loading} onClick={handleSave}>
            {loading ? 'Guardando...' : isEditMode ? 'Actualizar Orden de Compra' : 'Crear Orden de Compra'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPurchaseOrder;
