import React, { useState, useEffect, useRef } from 'react';
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
  // Unidades propias del artículo (cuando viene de la búsqueda); si no, se usa la lista general de la empresa
  units?: any[];
}

// Campo numérico que deja borrar todo el contenido mientras se escribe (un <input type="number"> ligado directo a Number()
// regresa siempre a "0" al vaciarlo). El texto se guarda aparte y al estado sale el número; vacío cuenta como 0.
const NumericInput: React.FC<{
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
  min?: number;
}> = ({ value, onValueChange, className, min = 0 }) => {
  const [text, setText] = useState(value === 0 ? '' : String(value));

  // Si el valor cambia desde fuera (carga de una orden, requisición…), se refleja en el texto
  useEffect(() => {
    if (Number(text || 0) !== Number(value)) setText(value === 0 ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type='number'
      inputMode='decimal'
      min={min}
      className={className}
      placeholder='0'
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        setText(e.target.value);
        onValueChange(e.target.value === '' ? 0 : Number(e.target.value));
      }}
    />
  );
};

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
  // Búsqueda de artículos (igual que en Requisiciones): se busca con la lupa y los resultados salen en un dropdown
  const [searchState, setSearchState] = useState({ type: 1 as 1 | 2, field: '' }); // 1: código, 2: nombre
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  // Catálogos del modal (empresas, proveedores de envío, unidades). Al crear una orden con una sola empresa, se elige sola.
  const loadInitialData = async (autoSelectCompany: boolean) => {
    try {
      const userId = userState?.id || 1;
      const compData = await APIs.getCompaniesByUser(userId);
      const companiesList = Array.isArray(compData) ? compData : (compData?.data || []);
      setCompanies(companiesList);
      if (autoSelectCompany) {
        const onlyCompanyId = companiesList.length === 1
          ? companiesList[0].id
          : companiesList.length === 0 ? (userState?.activeCompanyId ?? userState?.companyId ?? 0) : 0;
        if (onlyCompanyId) await handleCompanyChange(onlyCompanyId);
      }

      const supplData: any = await APIs.getSuppliers({ id_usuario: userId, is_flete: true });
      setSuppliers(Array.isArray(supplData) ? supplData : (supplData?.data || []));
    } catch (e) {
      console.error('Error loading initial data', e);
    }
  };

  // Proveedores de flete de la empresa elegida (los del catálogo de Proveedores marcados como "de envíos")
  useEffect(() => {
    if (!modalActive || !selectedCompany) return;
    APIs.getSuppliers({ id_usuario: userState?.id || 1, is_flete: true, companyId: selectedCompany })
      .then((res: any) => setSuppliers(Array.isArray(res) ? res : res?.data || []))
      .catch(() => {});
  }, [modalActive, selectedCompany, userState?.id]);

  // Unidades de la empresa/sucursal elegidas (sin empresa el backend no devuelve ninguna, por eso antes el select quedaba vacío)
  useEffect(() => {
    if (!modalActive || !selectedCompany) {
      setUnits([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response: any = await APIs.getUnits({ companyId: selectedCompany, branchId: selectedBranch || undefined });
        if (!cancelled) setUnits(Array.isArray(response) ? response : (response?.data || []));
      } catch (e) {
        console.error('Error loading units', e);
      }
    })();
    return () => { cancelled = true; };
  }, [modalActive, selectedCompany, selectedBranch]);

  // Sucursales de una empresa (para el select); devuelve la lista
  const loadBranches = async (companyId: number): Promise<any[]> => {
    try {
      const userId = userState?.id || 1;
      const response = await APIs.getBranchOffices(companyId, userId);
      const branchesList = Array.isArray(response) ? response : (response?.data || []);
      setBranchOffices(branchesList);
      return branchesList;
    } catch (e) {
      console.error('Error loading branches', e);
      setBranchOffices([]);
      return [];
    }
  };

  // Deja el formulario en blanco (cada vez que se abre el modal)
  const resetForm = () => {
    setSelectedCompany(0);
    setSelectedBranch(0);
    setBranchOffices([]);
    setArrivalDate('');
    setQuote('');
    setBill('');
    setPurchaseType(0);
    setFreightProvider(0);
    setFreightCost(0);
    setSumFreight(false);
    setFreightComments('');
    setGeneralComments('');
    setItems([]);
    setRequisitions([]);
    setReqStartDate('');
    setReqEndDate('');
    setSearchState({ type: 1, field: '' });
    setSearchResults([]);
    setSearched(false);
  };

  const loadPurchaseOrder = async (id: number) => {
    setLoading(true);
    try {
      const response: any = await APIs.getPurchaseOrderById(id);
      const po = response?.data || response;
      if (!po) throw new Error('Order not found');

      setSelectedCompany(po.companyId);
      await loadBranches(po.companyId);
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

  // Cada vez que se abre el modal: formulario limpio y datos frescos (antes solo se cargaba una vez, al montar la página,
  // cuando el usuario de la sesión todavía podía no estar listo y los selects quedaban vacíos)
  useEffect(() => {
    if (!modalActive) return;
    resetForm();
    const id = localStorage.getItem('selected_po_id');
    if (id) {
      setIsEditMode(true);
      setPoId(Number(id));
      loadInitialData(false).then(() => loadPurchaseOrder(Number(id)));
    } else {
      setIsEditMode(false);
      setPoId(null);
      loadInitialData(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalActive, userState?.id]);

  const handleCompanyChange = async (companyId: number) => {
    setSelectedCompany(companyId);
    setSelectedBranch(0);
    setBranchOffices([]);
    if (!companyId) return;
    const branchesList = await loadBranches(companyId);
    // Con una sola sucursal se elige sola.
    if (branchesList.length === 1) setSelectedBranch(branchesList[0].id);
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

  const runSearch = async () => {
    const term = searchState.field.trim();
    if (!term) {
      setSearchResults([]);
      setSearched(false);
      return;
    }
    if (!selectedBranch) {
      setSearchResults([]);
      setSearched(true);
      return;
    }
    const isCodeSearch = searchState.type === 1;
    setSearching(true);
    try {
      // El artículo se busca con la empresa y la sucursal elegidas arriba
      const response: any = await APIs.getProducts(isCodeSearch ? term : '', !isCodeSearch ? term : '', undefined, {
        companyId: selectedCompany || undefined,
        branchId: selectedBranch || undefined,
      });
      setSearchResults(response?.data ?? []);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  };

  const closeResults = () => {
    setSearchResults([]);
    setSearched(false);
  };

  // Cierra el dropdown al hacer clic fuera del buscador
  useEffect(() => {
    if (!searchResults.length && !searched) return;
    const onDown = (event: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target as Node)) closeResults();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [searchResults.length, searched]);

  // Al cambiar de empresa o sucursal los resultados anteriores ya no aplican
  useEffect(() => {
    closeResults();
  }, [selectedCompany, selectedBranch]);

  // Elegir un artículo del dropdown lo agrega a la orden con cantidad 1; el precio y el resto se ajustan en la tabla
  const addProduct = (product: any) => {
    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        code: product.code ?? '',
        name: product.name ?? '',
        quantity: 1,
        unitId: product.productUnits?.[0]?.unit?.id ?? product.productUnits?.[0]?.unitId ?? 0,
        units: product.productUnits ?? [],
        storeId: product.stores?.[0]?.id ?? product.productStores?.[0]?.storeId ?? 0,
        price: Number(product.cost ?? 0),
        discount: 0,
        ivaOn: false,
        comments: '',
      },
    ]);
    setSearchState((prev) => ({ ...prev, field: '' }));
    closeResults();
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

  const closeModal = () => {
    localStorage.removeItem('selected_po_id');
    dispatch(modal(''));
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
        // Las unidades propias del artículo solo sirven para el select de la tabla; no se mandan al backend
        items: items.map(({ units: _units, ...item }) => item),
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
          <button className='close-btn' onClick={closeModal}>
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
            <h4>Datos de envío</h4>
            <div className='freight-grid'>
              <div className='input-group'>
                <label>Proveedor de envío</label>
                <select value={freightProvider} onChange={(e) => setFreightProvider(Number(e.target.value))}>
                  <option value={0}>Seleccione Proveedor</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name ?? s.nombre_comercial}</option>)}
                </select>
              </div>
              <div className='input-group'>
                <label>Costo de envío</label>
                <NumericInput value={freightCost} onValueChange={setFreightCost} />
              </div>
              <div className='input-group checkbox-group'>
                <label htmlFor='po-sum-freight'>Sumar el envío al total</label>
                <input id='po-sum-freight' type="checkbox" checked={sumFreight} onChange={(e) => setSumFreight(e.target.checked)} />
              </div>
              <div className='input-group full-width'>
                <label>Comentarios del envío</label>
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
                <div className='po-search-controls'>
                  <div className='input-group'>
                    <label>Buscar por</label>
                    <select
                      value={searchState.type}
                      onChange={(e) => setSearchState((prev) => ({ ...prev, type: Number(e.target.value) as 1 | 2 }))}
                    >
                      <option value={1}>Código</option>
                      <option value={2}>Nombre</option>
                    </select>
                  </div>
                  <div className='input-group po-search-wrap' ref={searchWrapRef}>
                    <label>Término de búsqueda</label>
                    <div className='po-search-row'>
                      <input
                        type='text'
                        placeholder='Escribe y presiona la lupa para buscar...'
                        value={searchState.field}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchState((prev) => ({ ...prev, field: val }));
                          if (!val.trim()) closeResults();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            runSearch();
                          } else if (e.key === 'Escape') {
                            closeResults();
                          }
                        }}
                      />
                      <button
                        type='button'
                        className='po-search-btn'
                        onClick={runSearch}
                        disabled={searching}
                        title='Buscar producto'
                        aria-label='Buscar producto'
                      >
                        <span className='material-symbols-rounded'>{searching ? 'progress_activity' : 'search'}</span>
                      </button>
                    </div>
                    {(searchResults.length > 0 || (searched && !searching)) && (
                      <div className='po-results'>
                        {searchResults.length > 0 && (
                          <div className='po-results-head'>{searchResults.length} {searchResults.length === 1 ? 'resultado' : 'resultados'}</div>
                        )}
                        {searchResults.length === 0 ? (
                          <div className='po-result-empty'>{selectedBranch ? 'No se encontraron productos en esta sucursal' : 'Selecciona primero la empresa y la sucursal'}</div>
                        ) : searchResults.map((product: any) => (
                          <button type='button' key={product.id} className='po-result-item' onClick={() => addProduct(product)}>
                            {product.images?.[0] && (
                              <img src={product.images[0]} alt='' className='po-result-img' onError={(e: any) => { e.target.style.display = 'none'; }} />
                            )}
                            <div className='po-result-info'>
                              <span className='po-result-name'>{product.name}</span>
                              <span className='po-result-code'>{product.code}</span>
                            </div>
                            <span className='po-result-add material-symbols-rounded' aria-hidden>add_circle</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
                      <td className="cell-name" data-label="Artículo">{item.name || item.code || 'N/A'}</td>
                      <td data-label="Cantidad">
                        <NumericInput
                          value={item.quantity}
                          onValueChange={(v) => updateItemQuantity(index, v)}
                          className="item-input"
                        />
                      </td>
                      <td data-label="Unidad">
                        <select
                          value={item.unitId}
                          onChange={(e) => updateItemUnit(index, Number(e.target.value))}
                          className="item-input"
                        >
                          <option value={0}>Seleccione</option>
                          {item.units && item.units.length > 0
                            ? item.units.map((u: any) => (
                                <option key={u.unit?.id ?? u.id} value={u.unit?.id ?? u.id}>{u.unit?.name || u.name}</option>
                              ))
                            : units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </td>
                      <td data-label="Precio">
                        <NumericInput
                          value={item.price}
                          onValueChange={(v) => updateItemPrice(index, v)}
                          className="item-input"
                        />
                      </td>
                      <td data-label="Descuento">
                        <NumericInput
                          value={item.discount}
                          onValueChange={(v) => {
                            const newItems = [...items];
                            newItems[index].discount = v;
                            setItems(newItems);
                          }}
                          className="item-input"
                        />
                      </td>
                      <td className="text-center" data-label="IVA">
                        <input
                          type="checkbox"
                          checked={item.ivaOn}
                          onChange={(e) => updateItemIva(index, e.target.checked)}
                        />
                      </td>
                      <td data-label="Comentarios">
                        <input
                          type="text"
                          value={item.comments}
                          onChange={(e) => updateItemComments(index, e.target.value)}
                          className="item-input"
                        />
                      </td>
                      <td data-label="Total">${(item.quantity * item.price - item.discount).toFixed(2)}</td>
                      <td className="cell-actions">
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
              <span>Envío:</span>
              <span className='value'>${sumFreight ? freightCost.toFixed(2) : '0.00'}</span>
            </div>
            <div className='total-row grand-total'>
              <span>Total:</span>
              <span className='value'>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className='modal-footer'>
          <button className='cancel-btn' onClick={closeModal}>Cancelar</button>
          <button className='save-btn' disabled={loading} onClick={handleSave}>
            {loading ? 'Guardando...' : isEditMode ? 'Actualizar Orden de Compra' : 'Crear Orden de Compra'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPurchaseOrder;
