import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { modal } from '../../../../../../redux/state/modals';
import APIs from '../../../../../../services/APIs';
import { money, QUOTATIONS_CHANGED, quotationTotals } from '../printQuotation';
import './ModalQuotation.css';

interface QuotationItem {
  productId?: number;
  code: string;
  name: string;
  quantity: number;
  unitId: number;
  price: number;
  discount: number;
  ivaOn: boolean;
  comments: string;
  // Unidades propias del artículo (cuando viene de la búsqueda); si no, se usa la lista general de la empresa
  units?: any[];
}

// Campo numérico que deja borrar todo el contenido mientras se escribe (un <input type="number"> ligado directo a Number()
// regresa siempre a "0" al vaciarlo). El texto se guarda aparte y al estado sale el número; vacío cuenta como 0.
const NumericInput: React.FC<{ value: number; onValueChange: (value: number) => void; className?: string }> = ({
  value,
  onValueChange,
  className,
}) => {
  const [text, setText] = useState(value === 0 ? '' : String(value));

  useEffect(() => {
    if (Number(text || 0) !== Number(value)) setText(value === 0 ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type='number'
      inputMode='decimal'
      min={0}
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

const emptyItem = (): QuotationItem => ({ code: '', name: '', quantity: 1, unitId: 0, price: 0, discount: 0, ivaOn: false, comments: '' });

const ModalQuotation: React.FC = () => {
  const dispatch = useDispatch();
  const userState = useSelector((state: any) => state.user);
  const activeModal = useSelector((state: any) => state.modals);
  const modalActive = activeModal === 'quotation_modal';

  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [quotationId, setQuotationId] = useState<number | null>(null);

  const [companies, setCompanies] = useState<any[]>([]);
  const [branchOffices, setBranchOffices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  const [selectedCompany, setSelectedCompany] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState(0);
  const [customerId, setCustomerId] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [title, setTitle] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [comments, setComments] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);

  // Búsqueda de artículos (igual que en Requisiciones y Órdenes de compra): con la lupa, resultados en un dropdown
  const [searchState, setSearchState] = useState({ type: 1 as 1 | 2, field: '' }); // 1: código, 2: nombre
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const closeModal = () => {
    localStorage.removeItem('selected_quotation_id');
    dispatch(modal(''));
  };

  const resetForm = () => {
    setSelectedCompany(0);
    setSelectedBranch(0);
    setBranchOffices([]);
    setCustomers([]);
    setCustomerId(0);
    setCustomerName('');
    setTitle('');
    setValidUntil('');
    setPaymentTerms('');
    setDeliveryTime('');
    setComments('');
    setItems([]);
    setSearchState({ type: 1, field: '' });
    setSearchResults([]);
    setSearched(false);
  };

  const loadBranches = async (companyId: number): Promise<any[]> => {
    try {
      const response: any = await APIs.getBranchOffices(companyId, userState?.id || 1);
      const list = Array.isArray(response) ? response : response?.data || [];
      setBranchOffices(list);
      return list;
    } catch (e) {
      console.error('Error loading branches', e);
      setBranchOffices([]);
      return [];
    }
  };

  const handleCompanyChange = async (companyId: number) => {
    setSelectedCompany(companyId);
    setSelectedBranch(0);
    setBranchOffices([]);
    setCustomerId(0);
    if (!companyId) return;
    const list = await loadBranches(companyId);
    // Con una sola sucursal se elige sola.
    if (list.length === 1) setSelectedBranch(list[0].id);
  };

  const loadQuotation = async (id: number) => {
    setLoadingData(true);
    try {
      const response: any = await APIs.getQuotationById(id);
      const q = response?.data || response;
      if (!q) throw new Error('not found');
      setSelectedCompany(q.companyId);
      await loadBranches(q.companyId);
      setSelectedBranch(q.branchId);
      setCustomerId(q.customerId || 0);
      setCustomerName(q.customerName || '');
      setTitle(q.title || '');
      setValidUntil(q.validUntil ? new Date(q.validUntil).toISOString().split('T')[0] : '');
      setPaymentTerms(q.paymentTerms || '');
      setDeliveryTime(q.deliveryTime || '');
      setComments(q.comments || '');
      setItems(
        (q.items ?? []).map((item: any) => ({
          productId: item.productId || undefined,
          code: item.code || '',
          name: item.name || '',
          quantity: Number(item.quantity),
          unitId: item.unitId || 0,
          price: Number(item.price),
          discount: Number(item.discount),
          ivaOn: !!item.ivaOn,
          comments: item.comments || '',
        })),
      );
    } catch (e) {
      console.error('Error loading quotation', e);
      Swal.fire('Error', 'No se pudo cargar la cotización', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  // Cada vez que se abre el modal: formulario limpio y datos frescos (empresas); si hay una cotización seleccionada, se edita
  useEffect(() => {
    if (!modalActive) return;
    resetForm();
    const id = localStorage.getItem('selected_quotation_id');
    (async () => {
      try {
        const compData: any = await APIs.getCompaniesByUser(userState?.id || 1);
        const list = Array.isArray(compData) ? compData : compData?.data || [];
        setCompanies(list);
        if (id) {
          setIsEditMode(true);
          setQuotationId(Number(id));
          await loadQuotation(Number(id));
        } else {
          setIsEditMode(false);
          setQuotationId(null);
          const onlyCompanyId =
            list.length === 1 ? list[0].id : list.length === 0 ? userState?.activeCompanyId ?? userState?.companyId ?? 0 : 0;
          if (onlyCompanyId) await handleCompanyChange(onlyCompanyId);
        }
      } catch (e) {
        console.error('Error loading initial data', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalActive, userState?.id]);

  // Clientes y unidades de la empresa / sucursal elegidas
  useEffect(() => {
    if (!modalActive || !selectedCompany) {
      setCustomers([]);
      setUnits([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [custResponse, unitsResponse]: any[] = await Promise.all([
          APIs.getCustomers(selectedCompany, selectedBranch || undefined),
          APIs.getUnits({ companyId: selectedCompany, branchId: selectedBranch || undefined }),
        ]);
        if (cancelled) return;
        const custList = Array.isArray(custResponse) ? custResponse : custResponse?.data || [];
        setCustomers(custList.filter((c: any) => c.active !== false));
        setUnits(Array.isArray(unitsResponse) ? unitsResponse : unitsResponse?.data || []);
      } catch (e) {
        console.error('Error loading customers/units', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [modalActive, selectedCompany, selectedBranch]);

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

  // Elegir un artículo del dropdown lo agrega con cantidad 1 y su precio de venta; lo demás se ajusta en la tabla
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
        price: Number(product.price ?? 0),
        discount: 0,
        ivaOn: false,
        comments: '',
      },
    ]);
    setSearchState((prev) => ({ ...prev, field: '' }));
    closeResults();
  };

  // Concepto libre: servicio o artículo que no está en el catálogo (se escribe su descripción en la tabla)
  const addFreeItem = () => setItems((prev) => [...prev, emptyItem()]);

  const updateItem = (index: number, patch: Partial<QuotationItem>) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const totals = quotationTotals(items);

  const handleSave = async () => {
    if (!selectedCompany || !selectedBranch) {
      Swal.fire('Atención', 'Selecciona la empresa y la sucursal.', 'warning');
      return;
    }
    if (items.length === 0) {
      Swal.fire('Atención', 'Agrega al menos un concepto a la cotización.', 'warning');
      return;
    }
    if (items.some((item) => !item.name.trim())) {
      Swal.fire('Atención', 'Todos los conceptos necesitan una descripción.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        companyId: selectedCompany,
        branchId: selectedBranch,
        title,
        customerId: customerId || undefined,
        customerName: customerId ? undefined : customerName,
        validUntil: validUntil || undefined,
        paymentTerms,
        deliveryTime,
        comments,
        // Las unidades propias del artículo solo sirven para el select de la tabla; no se mandan al backend
        items: items.map(({ units: _units, unitId, productId, ...item }) => ({
          ...item,
          productId: productId || undefined,
          unitId: unitId || undefined,
        })),
      };
      const response: any =
        isEditMode && quotationId ? await APIs.updateQuotation(quotationId, payload) : await APIs.createQuotation(payload);

      if (response?.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: isEditMode ? 'Cotización actualizada' : 'Cotización creada',
          timer: 1500,
          showConfirmButton: false,
        });
        window.dispatchEvent(new Event(QUOTATIONS_CHANGED));
        closeModal();
      } else {
        Swal.fire('Error', response?.message || 'No se pudo guardar la cotización', 'error');
      }
    } catch (e: any) {
      const message = e?.response?.data?.message;
      Swal.fire('Error', (Array.isArray(message) ? message.join(', ') : message) || 'Ocurrió un error al guardar la cotización', 'error');
    } finally {
      setSaving(false);
    }
  };

  const customerLabel = (c: any) => c.businessName || [c.firstName, c.lastName].filter(Boolean).join(' ') || `Cliente ${c.id}`;

  return (
    <div className={`qt-overlay ${modalActive ? 'active' : ''}`}>
      <div className={`qt-popup ${modalActive ? 'active' : ''}`}>
        <div className='qt-header'>
          <h3>{isEditMode ? 'Editar cotización' : 'Nueva cotización'}</h3>
          <button className='qt-close' onClick={closeModal} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>

        <div className='qt-body'>
          {loadingData && <div className='qt-loading'>Cargando cotización...</div>}

          <div className='qt-grid'>
            {companies.length > 1 && (
              <div className='qt-field'>
                <label>Empresa</label>
                <select value={selectedCompany} onChange={(e) => handleCompanyChange(Number(e.target.value))} disabled={isEditMode}>
                  <option value={0}>Selecciona la empresa</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            {branchOffices.length > 1 && (
              <div className='qt-field'>
                <label>Sucursal</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(Number(e.target.value))}
                  disabled={!selectedCompany || isEditMode}
                >
                  <option value={0}>Selecciona la sucursal</option>
                  {branchOffices.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className='qt-field qt-field--wide'>
              <label>Título</label>
              <input type='text' value={title} onChange={(e) => setTitle(e.target.value)} placeholder='Ej: Cotización de uniformes' />
            </div>
            <div className='qt-field'>
              <label>Vigencia</label>
              <input type='date' value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          </div>

          <div className='qt-grid'>
            <div className='qt-field'>
              <label>Cliente</label>
              <select value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))} disabled={!selectedCompany}>
                <option value={0}>Prospecto (escribir nombre)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{customerLabel(c)}</option>
                ))}
              </select>
            </div>
            {customerId === 0 && (
              <div className='qt-field'>
                <label>Nombre del cliente</label>
                <input type='text' value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder='Nombre o razón social' />
              </div>
            )}
            <div className='qt-field'>
              <label>Condiciones de pago</label>
              <input type='text' value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder='Ej: 50 % anticipo' />
            </div>
            <div className='qt-field'>
              <label>Tiempo de entrega</label>
              <input type='text' value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} placeholder='Ej: 5 días hábiles' />
            </div>
          </div>

          <div className='qt-field'>
            <label>Comentarios</label>
            <textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder='Notas que verá el cliente' />
          </div>

          <div className='qt-section-title'>Conceptos</div>

          <div className='qt-search-controls'>
            <div className='qt-field'>
              <label>Buscar por</label>
              <select
                value={searchState.type}
                onChange={(e) => setSearchState((prev) => ({ ...prev, type: Number(e.target.value) as 1 | 2 }))}
              >
                <option value={1}>Código</option>
                <option value={2}>Nombre</option>
              </select>
            </div>
            <div className='qt-field qt-search-wrap' ref={searchWrapRef}>
              <label>Término de búsqueda</label>
              <div className='qt-search-row'>
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
                <button type='button' className='qt-search-btn' onClick={runSearch} disabled={searching} title='Buscar producto' aria-label='Buscar producto'>
                  <span className='material-symbols-rounded'>{searching ? 'progress_activity' : 'search'}</span>
                </button>
                <button type='button' className='qt-free-btn' onClick={addFreeItem} title='Agregar un concepto que no está en el catálogo'>
                  <span className='material-symbols-rounded' aria-hidden>add</span>
                  Concepto libre
                </button>
              </div>
              {(searchResults.length > 0 || (searched && !searching)) && (
                <div className='qt-results'>
                  {searchResults.length > 0 && (
                    <div className='qt-results-head'>{searchResults.length} {searchResults.length === 1 ? 'resultado' : 'resultados'}</div>
                  )}
                  {searchResults.length === 0 ? (
                    <div className='qt-result-empty'>
                      {selectedBranch ? 'No se encontraron productos en esta sucursal' : 'Selecciona primero la empresa y la sucursal'}
                    </div>
                  ) : (
                    searchResults.map((product: any) => (
                      <button type='button' key={product.id} className='qt-result-item' onClick={() => addProduct(product)}>
                        {product.images?.[0] && (
                          <img src={product.images[0]} alt='' className='qt-result-img' onError={(e: any) => { e.target.style.display = 'none'; }} />
                        )}
                        <div className='qt-result-info'>
                          <span className='qt-result-name'>{product.name}</span>
                          <span className='qt-result-code'>{product.code}</span>
                        </div>
                        <span className='qt-result-price'>{money(Number(product.price ?? 0))}</span>
                        <span className='qt-result-add material-symbols-rounded' aria-hidden>add_circle</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className='qt-table-wrap'>
            <table className='qt-table'>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Cant.</th>
                  <th>Unidad</th>
                  <th>Precio</th>
                  <th>Desc.</th>
                  <th>IVA</th>
                  <th>Importe</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className='qt-empty'>Busca un artículo o agrega un concepto libre.</td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index}>
                      <td data-label='Descripción' className='qt-cell-name'>
                        {item.productId ? (
                          <>
                            <strong>{item.name}</strong>
                            {item.code && <small>{item.code}</small>}
                          </>
                        ) : (
                          <input
                            type='text'
                            className='qt-input'
                            value={item.name}
                            placeholder='Descripción del concepto'
                            onChange={(e) => updateItem(index, { name: e.target.value })}
                          />
                        )}
                      </td>
                      <td data-label='Cantidad'>
                        <NumericInput className='qt-input' value={item.quantity} onValueChange={(v) => updateItem(index, { quantity: v })} />
                      </td>
                      <td data-label='Unidad'>
                        <select className='qt-input' value={item.unitId} onChange={(e) => updateItem(index, { unitId: Number(e.target.value) })}>
                          <option value={0}>Sin unidad</option>
                          {item.units && item.units.length > 0
                            ? item.units.map((u: any) => (
                                <option key={u.unit?.id ?? u.id} value={u.unit?.id ?? u.id}>{u.unit?.name || u.name}</option>
                              ))
                            : units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </td>
                      <td data-label='Precio'>
                        <NumericInput className='qt-input' value={item.price} onValueChange={(v) => updateItem(index, { price: v })} />
                      </td>
                      <td data-label='Descuento'>
                        <NumericInput className='qt-input' value={item.discount} onValueChange={(v) => updateItem(index, { discount: v })} />
                      </td>
                      <td data-label='IVA' className='qt-cell-center'>
                        <input type='checkbox' checked={item.ivaOn} onChange={(e) => updateItem(index, { ivaOn: e.target.checked })} />
                      </td>
                      <td data-label='Importe' className='qt-cell-total'>
                        {money(item.quantity * item.price - item.discount)}
                      </td>
                      <td className='qt-cell-actions'>
                        <button type='button' className='qt-remove' onClick={() => removeItem(index)} title='Quitar concepto' aria-label='Quitar concepto'>
                          <span className='material-symbols-rounded'>delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

        <div className='qt-footer'>
          <div className='qt-totals'>
            <div><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
            {totals.discount > 0 && <div><span>Descuento</span><span>-{money(totals.discount)}</span></div>}
            <div><span>IVA</span><span>{money(totals.iva)}</span></div>
            <div className='qt-totals__grand'><span>Total</span><span>{money(totals.total)}</span></div>
          </div>
          <div className='qt-footer-actions'>
            <button type='button' className='qt-btn qt-btn--ghost' onClick={closeModal}>Cancelar</button>
            <button type='button' className='qt-btn qt-btn--primary' disabled={saving} onClick={handleSave}>
              {saving ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear cotización'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalQuotation;
