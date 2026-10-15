import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import './PurchaseOrder.css';
import { useDispatch, useSelector } from 'react-redux';
import { modal } from '../../../../../redux/state/modals';
import ModalPurchaseOrder from './modal-purchaseorder/ModalPurchaseOrder';
import ModalPurchaseOrderDetail from './modal-purchaseorder-detail/ModalPurchaseOrderDetail';
import APIs from '../../../../../services/APIs';
import { format } from 'date-fns';
import { DateRange, DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface PurchaseOrder {
  id: number;
  serie: string;
  folio: string;
  status: string;
  fecha_creacion: string;
  usuario_crea: string;
  empresa: string;
  sucursal: string;
  proveedor: string;
}

interface PurchaseOrderProps {
  mode?: 'standard' | 'approval';
}

const PurchaseOrder: React.FC<PurchaseOrderProps> = ({ mode = 'standard' }) => {
  const dispatch = useDispatch();
  const userState = useSelector((state: any) => state.user);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [statusFilter, setStatusFilter] = useState(mode === 'approval' ? 'PENDING' : 0);
  const [folio, setFolio] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [companies, setCompanies] = useState<any[]>([]);
  const [branchOffices, setBranchOffices] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [types] = useState<any[]>([
    { id: 0, nombre: 'Directa' },
    { id: 1, nombre: 'Por Requisición' },
  ]);

  const [selectedCompany, setSelectedCompany] = useState<number>(0);
  const [selectedBranch, setSelectedBranch] = useState<number>(0);
  const [selectedSerie, setSelectedSerie] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<number>(0);
  const [startDate, setStartDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const dateRange = useMemo(() => ({
    startDate,
    endDate,
    key: 'selection',
    color: '#586ae9'
  }), [startDate, endDate]);

  useEffect(() => {
    if (!showCalendar) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        companyId: selectedCompany,
        branchId: selectedBranch,
        serieId: selectedSerie,
        status: statusFilter,
        page: page,
        tipo: selectedType,
        desde: format(startDate, 'yyyy-MM-dd'),
        hasta: format(endDate, 'yyyy-MM-dd'),
      };

      if (folio) {
        params.folio = folio;
      }

      const response: any = await APIs.getPurchaseOrders(params);
      if (response?.status === 'success' && Array.isArray(response.data)) {
        setPurchaseOrders(response.data);
        setTotalPages(response.total_pages || 1);
      } else {
        setPurchaseOrders(response?.data || []);
        setTotalPages(response?.total_pages || 1);
      }
    } catch (error) {
      console.error('Error al cargar órdenes de compra:', error);
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, selectedBranch, selectedSerie, statusFilter, page, folio, selectedType, startDate, endDate]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [selectedCompany, selectedBranch, selectedSerie, statusFilter, page, folio, selectedType, startDate, endDate, fetchPurchaseOrders]);

  const loadInitialData = async () => {
    try {
      const userId = userState?.id || 1;
      const compData = await APIs.getCompaniesByUser(userId);
      const companiesList = Array.isArray(compData) ? compData : (compData?.data || []);
      setCompanies(companiesList);

      const seriesData = await APIs.getSeriesXUser({ id: userId, tipo_ducumento: 1 });
      const seriesList = Array.isArray(seriesData) ? seriesData : (seriesData?.data || []);
      setSeries(seriesList);
    } catch (e) {
      console.error('Error loading initial data', e);
    }
  };

  const handleCompanyChange = async (companyId: number) => {
    setSelectedCompany(companyId);
    setSelectedBranch(0);
    try {
      const userId = userState?.id || 1;
      const response = await APIs.getBranchOffices(companyId, userId);
      const branches = Array.isArray(response) ? response : (response?.data || []);
      setBranchOffices(branches);
    } catch (e) {
      console.error('Error loading branches', e);
    }
  };

  const handleBranchChange = async (branchId: number) => {
    setSelectedBranch(branchId);
    try {
      // Purchase orders don't typically filter by area in the main list, but we keep it consistent if needed
    } catch (e) {
      console.error('Error loading areas', e);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return { label: 'Borrador', color: '#9CA3AF' };
      case 'PENDING': return { label: 'Pendiente', color: '#F59E0B' };
      case 'APPROVED': return { label: 'Aprobada', color: '#3B82F6' };
      case 'REJECTED': return { label: 'Rechazada', color: '#EF4444' };
      case 'PARTIAL': return { label: 'Parcial', color: '#8B5CF6' };
      case 'COMPLETED': return { label: 'Completada', color: '#10B981' };
      default: return { label: 'Desconocido', color: '#6B7280' };
    }
  };

  const getTypeLabel = (tipo: number) => {
    switch (tipo) {
      case 0: return 'Directa';
      case 1: return 'Por Requisición';
      default: return 'Desconocido';
    }
  };

  const openView = (id: number) => {
    localStorage.setItem('selected_po_id', String(id));
    dispatch(modal('purchase_order_detail_modal'));
  };

  const openEdit = (id: number) => {
    localStorage.setItem('selected_po_id', String(id));
    dispatch(modal('purchase_order_modal'));
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        const response: any = await APIs.deletePurchaseOrder(id);
        if (response?.status === 'success') {
          Swal.fire('Eliminado', 'La orden de compra ha sido eliminada.', 'success');
          fetchPurchaseOrders();
        } else {
          Swal.fire('Error', response?.message || 'No se pudo eliminar la orden', 'error');
        }
      } catch (error) {
        console.error('Error deleting purchase order:', error);
        Swal.fire('Error', 'Ocurrió un error al eliminar la orden', 'error');
      }
    }
  };

  return (
    <div className='req-page'>
      <div className='req-content'>
        <div className='req-filters-container'>
          <div className='req-filter-row'>
            <div className="req-select-container">
              <label>Empresa</label>
              <select
                value={selectedCompany}
                onChange={(e) => handleCompanyChange(Number(e.target.value))}
              >
                <option value={0}>Todas las Empresas</option>
                {companies.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="req-select-container">
              <label>Sucursal</label>
              <select
                value={selectedBranch}
                onChange={(e) => handleBranchChange(Number(e.target.value))}
                disabled={!selectedCompany}
              >
                <option value={0}>Todas las Sucursales</option>
                {branchOffices.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="req-select-container">
              <label>Tipo</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(Number(e.target.value))}
              >
                <option value={0}>Todos los Tipos</option>
                {types.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className='req-filter-row'>
            <div className="req-date-container">
              <label className="req-date-label">Rango de Fechas</label>
              <div className="date-picker-wrapper" ref={calendarRef}>
                <div
                  className="req-date-input"
                  onClick={() => setShowCalendar(!showCalendar)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  {format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
                  <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>calendar_month</span>
                </div>
                {showCalendar && (
                  <div className="calendar-popover" onClick={(e) => e.stopPropagation()}>
                    <DateRange
                      ranges={[dateRange]}
                      onChange={item => {
                        setStartDate(new Date(item.selection.startDate));
                        setEndDate(new Date(item.selection.endDate));
                      }}
                      showSelectionPreview={false}
                      moveRangeOnSelection={false}
                    >
                      <DateRangePicker
                        direction="horizontal"
                      />
                    </DateRange>
                  </div>
                )}
              </div>
            </div>
            <div className="req-select-container">
              <label>Serie</label>
              <select
                value={selectedSerie}
                onChange={(e) => setSelectedSerie(Number(e.target.value))}
              >
                <option value={0}>Todas las Series</option>
                {series.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
            <div className="req-folio-container">
              <label className="req-date-label">Folio</label>
              <input
                className="req-date-input"
                type="text"
                placeholder="Ingresa el folio"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
              />
            </div>
            <div className="req-status-container">
              {mode === 'standard' && (
                <div className="req-status-chips">
                  {[
                    { id: 'ALL', label: 'Todas' },
                    { id: 'ACTIVE', label: 'Activas' },
                    { id: 'DRAFT', label: 'Borradores' },
                    { id: 'PENDING', label: 'Pendientes' },
                    { id: 'APPROVED', label: 'Aprobadas' },
                    { id: 'REJECTED', label: 'Rechazadas' },
                    { id: 'PARTIAL', label: 'Parciales' },
                    { id: 'COMPLETED', label: 'Completadas' },
                  ].map(status => (
                    <button
                      key={status.id}
                      className={`req-status-chip ${statusFilter === status.id ? 'active' : ''}`}
                      onClick={() => setStatusFilter(status.id)}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="btn-search" onClick={fetchPurchaseOrders}>
              <span className="material-symbols-rounded">search</span>
            </button>
            {mode === 'standard' && (
              <button
                type='button'
                className='btn-new-req'
                onClick={() => dispatch(modal('purchase_order_modal'))}
              >
                Nueva OC
              </button>
            )}
          </div>
        </div>

        <div className='req-table-wrap'>
          <div className='req-table'>
            <div className='req-thead'>
              <div className='th'>Folio</div>
              <div className='th'>Tipo</div>
              <div className='th'>Stat</div>
              <div className='th'>Fecha</div>
              <div className='th'>Por</div>
              <div className='th'>Emp</div>
              <div className='th'>Suc</div>
              <div className='th'>Prov</div>
              <div className='th req-actions'>Acciones</div>
            </div>
            <div className='req-tbody'>
              {loading ? (
                <div className="req-loading">
                  <div className="spinner" />
                  <p>Cargando órdenes de compra...</p>
                </div>
              ) : purchaseOrders.length === 0 ? (
                <div className="req-empty">
                  <p>No hay órdenes de compra disponibles.</p>
                </div>
              ) : (
                purchaseOrders.map((item, index) => {
                  const status = getStatusLabel(item.status);
                  return (
                    <div className='req-row-wrap' key={item.id || index}>
                      <div className='req-row'>
                        <div className='td'>
                          <span className='req-folio'>{item.serie?.name || 'N/A'}-{item.folio}</span>
                        </div>
                        <div className='td'>
                          <p>{getTypeLabel(item.tipo)}</p>
                        </div>
                        <div className='td'>
                          <span className="req-status-badge" style={{ backgroundColor: status.color + '20', color: status.color }}>
                            {status.label}
                          </span>
                        </div>
                        <div className='td'>
                          <p>{item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy') : '—'}</p>
                        </div>
                        <div className='td'>
                          <p>{item.user?.firstName ? `${item.user.firstName} ${item.user.firstLastName}` : '—'}</p>
                        </div>
                        <div className='td'>
                          <p>{item.company?.name || '—'}</p>
                        </div>
                        <div className='td'>
                          <p>{item.branch?.name || '—'}</p>
                        </div>
                        <div className='td'>
                          <p>{item.supplierName || '—'}</p>
                        </div>
                        <div className='td req-actions'>
                          <button className="action-btn view" title="Ver" onClick={() => openView(item.id)}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>visibility</span>
                          </button>
                          <button className="action-btn edit" title="Editar" onClick={() => openEdit(item.id)}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>edit</span>
                          </button>
                          <button className="action-btn delete" title="Eliminar" onClick={() => handleDelete(item.id)}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        <ModalPurchaseOrder />
        <ModalPurchaseOrderDetail />
      </div>
    </div>
  );
};

export default PurchaseOrder;
