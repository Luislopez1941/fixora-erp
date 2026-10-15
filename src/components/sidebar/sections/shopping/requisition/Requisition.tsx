import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import './Requisition.css';
import { useDispatch, useSelector } from 'react-redux';
import { modal } from '../../../../../redux/state/modals';
import ModalRequisition from './modal-requisition/ModalRequisition';
import ModalRequisitionDetail from './modal-detail/ModalRequisitionDetail';
import APIs from '../../../../../services/APIs';
import { format } from 'date-fns';
import { DateRange, DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface Requisition {
  id: number;
  serie: string;
  folio: string;
  anio: string;
  tipo: number;
  status: number;
  fecha_creacion: string;
  usuario_crea: string;
  empresa: string;
  sucursal: string;
  area: string;
}

interface RequisitionProps {
  mode?: 'standard' | 'approval';
}


const Requisition: React.FC<RequisitionProps> = ({ mode = 'standard' }) => {
  const dispatch = useDispatch();
  const userState = useSelector((state: any) => state.user);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [statusFilter, setStatusFilter] = useState(mode === 'approval' ? 'PENDING' : 0);
  const [folio, setFolio] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [companies, setCompanies] = useState<any[]>([]);
  const [branchOffices, setBranchOffices] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [types] = useState<any[]>([
    { id: 0, nombre: 'Manual' },
    { id: 1, nombre: 'Dif' },
    { id: 2, nombre: 'Automatica' },
    { id: 3, nombre: 'Automatica BP' },
  ]);

  const [selectedCompany, setSelectedCompany] = useState<number>(0);
  const [selectedBranch, setSelectedBranch] = useState<number>(0);
  const [selectedArea, setSelectedArea] = useState<number>(0);
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

  const fetchRequisitions = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        companyId: selectedCompany,
        branchId: selectedBranch,
        id_area: selectedArea,
        id_serie: selectedSerie,
        status: statusFilter,
        page: page,
        tipo: selectedType,
        desde: format(startDate, 'yyyy-MM-dd'),
        hasta: format(endDate, 'yyyy-MM-dd'),
      };

      if (folio) {
        params.folio = folio;
      }

      const response: any = await APIs.getRequisitions(params);
      if (response?.status === 'success' && Array.isArray(response.data)) {
        setRequisitions(response.data);
        setTotalPages(response.total_pages || 1);
      } else {
        setRequisitions(response?.data || []);
        setTotalPages(response?.total_pages || 1);
      }
    } catch (error) {
      console.error('Error al cargar requisiciones:', error);
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, selectedBranch, selectedArea, selectedSerie, statusFilter, page, folio, selectedType, startDate, endDate]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Solo cargar la primera vez al montar el componente
    fetchRequisitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchRequisitions();
  }, [selectedCompany, selectedBranch, selectedArea, selectedSerie, statusFilter, page, folio, selectedType, startDate, endDate, fetchRequisitions]);

  const loadInitialData = async () => {
    try {
      const userId = userState?.id || 1;
      const compData = await APIs.getCompaniesByUser(userId);
      const companiesList = Array.isArray(compData) ? compData : (compData?.data || []);
      setCompanies(companiesList);

      const seriesData = await APIs.getSeriesXUser({ id: userId, tipo_ducumento: 0 });
      const seriesList = Array.isArray(seriesData) ? seriesData : (seriesData?.data || []);
      setSeries(seriesList);
    } catch (e) {
      console.error('Error loading initial data', e);
    }
  };

  const handleCompanyChange = async (companyId: number) => {
    setSelectedCompany(companyId);
    setSelectedBranch(0);
    setSelectedArea(0);
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
    setSelectedArea(0);
    try {
      const response = await APIs.getAreas({ branchId });
      const areasData = Array.isArray(response) ? response : (response?.data || []);
      setAreas(areasData);
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
      case 0: return 'Manual';
      case 1: return 'Dif';
      case 2: return 'Automatica';
      case 3: return 'Automatica BP';
      default: return 'Desconocido';
    }
  };

  const openDetail = (id: number) => {
    localStorage.setItem('selected_req_id', String(id));
    dispatch(modal('requisition_detail_modal'));
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
              <label>Area</label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(Number(e.target.value))}
                disabled={!selectedBranch}
              >
                <option value={0}>Todas las Areas</option>
                {areas.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
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
            <button className="btn-search" onClick={fetchRequisitions}>
              <span className="material-symbols-rounded">search</span>
            </button>
            {mode === 'standard' && (
              <button
                type='button'
                className='btn-new-req'
                onClick={() => dispatch(modal('requisition_modal'))}
              >
                Nueva Requisición
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
              <div className='th'>Area</div>
              <div className='th req-actions'>Acciones</div>
            </div>
            <div className='req-tbody'>
              {loading ? (
                <div className="req-loading">
                  <div className="spinner" />
                  <p>Cargando requisiciones...</p>
                </div>
              ) : requisitions.length === 0 ? (
                <div className="req-empty">
                  <p>No hay requisiciones disponibles.</p>
                </div>
              ) : (
                requisitions.map((item, index) => {
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
                          <p>{item.area?.name || '—'}</p>
                        </div>
                        <div className='td req-actions'>
                          <button className="action-btn edit" title="Gestionar" onClick={() => openDetail(item.id)}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>visibility</span>
                          </button>
                          <button className="action-btn delete" title="Eliminar">
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
        <ModalRequisition />
        <ModalRequisitionDetail />
      </div>
    </div>
  );
};

export default Requisition;
