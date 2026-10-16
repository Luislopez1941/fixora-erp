import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import './Requisition.css';
import Swal from 'sweetalert2';
import { printRequisition } from './printRequisition';
import { useCan } from '../../../../../core/permissions/useCan';
import TableSkeleton from '../../../../general/skeleton/TableSkeleton';
import { useDispatch, useSelector } from 'react-redux';
import { modal } from '../../../../../redux/state/modals';
import ModalRequisition from './modal-requisition/ModalRequisition';
import ModalRequisitionDetail from './modal-detail/ModalRequisitionDetail';
import APIs from '../../../../../services/APIs';
import { format } from 'date-fns';
import { DateRange } from 'react-date-range';
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
  const can = useCan();
  const canApprove = can('shopping.requisition.approve');
  const canReject = can('shopping.requisition.reject');
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>(mode === 'approval' ? 'PENDING' : 'ALL');
  const [folio, setFolio] = useState('');
  const [page] = useState(1);
  const [, setTotalPages] = useState(1);

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
  // En el celular los selects se esconden detrás del botón "Filtros"
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters = [selectedCompany, selectedBranch, selectedArea, selectedType, selectedSerie].filter(Boolean).length;

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
        id_area_type: selectedArea,
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

  // Áreas generales (tipos del catálogo de áreas) de la empresa, y de la sucursal si ya se eligió
  const loadAreaTypes = async (companyId: number, branchId?: number) => {
    try {
      const response: any = await APIs.getAreaTypes(companyId, branchId);
      setAreas(Array.isArray(response) ? response : (response?.data || []));
    } catch (e) {
      console.error('Error loading area types', e);
      setAreas([]);
    }
  };

  const handleCompanyChange = async (companyId: number) => {
    setSelectedCompany(companyId);
    setSelectedBranch(0);
    setSelectedArea(0);
    setAreas([]);
    if (!companyId) {
      setBranchOffices([]);
      return;
    }
    try {
      const userId = userState?.id || 1;
      const response = await APIs.getBranchOffices(companyId, userId);
      const branches = Array.isArray(response) ? response : (response?.data || []);
      setBranchOffices(branches);
    } catch (e) {
      console.error('Error loading branches', e);
    }
    await loadAreaTypes(companyId);
  };

  const handleBranchChange = async (branchId: number) => {
    setSelectedBranch(branchId);
    setSelectedArea(0);
    if (selectedCompany) await loadAreaTypes(selectedCompany, branchId || undefined);
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

  // Aprobar o rechazar desde la fila (solo requisiciones pendientes y con el permiso correspondiente)
  const decide = async (item: any, newStatus: 'APPROVED' | 'REJECTED') => {
    const approving = newStatus === 'APPROVED';
    const folioText = `${item.serie?.name || 'REQ'}-${item.folio}`;
    const result = await Swal.fire({
      icon: approving ? 'question' : 'warning',
      title: approving ? 'Aprobar requisición' : 'Rechazar requisición',
      text: `${approving ? '¿Aprobar' : '¿Rechazar'} la requisición ${folioText}?`,
      showCancelButton: true,
      confirmButtonText: approving ? 'Aprobar' : 'Rechazar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await APIs.updateRequisitionStatus(item.id, newStatus);
      await fetchRequisitions();
      Swal.fire({ icon: 'success', title: approving ? 'Requisición aprobada' : 'Requisición rechazada', timer: 1400, showConfirmButton: false });
    } catch (error: any) {
      const message = error?.response?.data?.message || 'No se pudo actualizar la requisición.';
      Swal.fire('Error', Array.isArray(message) ? message.join(', ') : message, 'error');
    }
  };

  // Imprimir desde la fila: el listado no trae los artículos, así que se pide el detalle completo
  const printRow = async (id: number) => {
    try {
      const response: any = await APIs.getRequisitionById(id);
      printRequisition(response?.data ?? response);
    } catch (error) {
      Swal.fire('Error', 'No se pudo preparar la requisición para imprimir.', 'error');
    }
  };

  const openDetail = (id: number) => {
    localStorage.setItem('selected_req_id', String(id));
    dispatch(modal('requisition_detail_modal'));
  };

  const statusOptions = [
    { id: 'ALL', label: 'Todas' },
    { id: 'ACTIVE', label: 'Activas' },
    { id: 'DRAFT', label: 'Borradores' },
    { id: 'PENDING', label: 'Pendientes' },
    { id: 'APPROVED', label: 'Aprobadas' },
    { id: 'REJECTED', label: 'Rechazadas' },
    { id: 'PARTIAL', label: 'Parciales' },
    { id: 'COMPLETED', label: 'Completadas' },
  ];

  return (
    <div className={`reqs ${filtersOpen ? 'reqs--filters-open' : ''}`}>
      <div className='reqs__container'>
        <div className='reqs__header'>
          <div className='reqs__header-left'>
            <select
              className='inputs__general reqs__filter'
              aria-label='Empresa'
              value={selectedCompany}
              onChange={(e) => handleCompanyChange(Number(e.target.value))}
            >
              <option value={0}>Todas las empresas</option>
              {companies.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className='inputs__general reqs__filter'
              aria-label='Sucursal'
              value={selectedBranch}
              onChange={(e) => handleBranchChange(Number(e.target.value))}
              disabled={!selectedCompany}
            >
              <option value={0}>Todas las sucursales</option>
              {branchOffices.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select
              className='inputs__general reqs__filter'
              aria-label='Área solicitante'
              value={selectedArea}
              onChange={(e) => setSelectedArea(Number(e.target.value))}
              disabled={!selectedCompany}
            >
              <option value={0}>Todas las áreas</option>
              {areas.map((a: any) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
            <select
              className='inputs__general reqs__filter'
              aria-label='Tipo'
              value={selectedType}
              onChange={(e) => setSelectedType(Number(e.target.value))}
            >
              <option value={0}>Todos los tipos</option>
              {types.map((t: any) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
            <select
              className='inputs__general reqs__filter'
              aria-label='Serie'
              value={selectedSerie}
              onChange={(e) => setSelectedSerie(Number(e.target.value))}
            >
              <option value={0}>Todas las series</option>
              {series.map((s: any) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
          {mode === 'standard' && (
            <button
              type='button'
              className='btn__general-primary'
              onClick={() => dispatch(modal('requisition_modal'))}
            >
              Nueva requisición
            </button>
          )}
        </div>

        <div className='reqs__toolbar'>
          <div className='reqs__toolbar-left'>
            <div className='reqs__search'>
              <span className='reqs__search-icon material-symbols-rounded' aria-hidden>search</span>
              <input
                className='inputs__general reqs__search-input'
                type='text'
                placeholder='Buscar por folio'
                aria-label='Buscar por folio'
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
              />
            </div>

            <div className='reqs__date' ref={calendarRef}>
              <button type='button' className='reqs__pill-btn' onClick={() => setShowCalendar(!showCalendar)}>
                <span className='material-symbols-rounded' aria-hidden>calendar_month</span>
                {format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
              </button>
              {showCalendar && (
                <div className='reqs__calendar' onClick={(e) => e.stopPropagation()}>
                  <DateRange
                    ranges={[dateRange]}
                    onChange={item => {
                      setStartDate(new Date(item.selection.startDate!));
                      setEndDate(new Date(item.selection.endDate!));
                    }}
                    moveRangeOnFirstSelection={false}
                  />
                </div>
              )}
            </div>

            <button
              type='button'
              className={`reqs__pill-btn reqs__filters-toggle ${activeFilters ? 'reqs__pill-btn--active' : ''}`}
              onClick={() => setFiltersOpen(!filtersOpen)}
              aria-expanded={filtersOpen}
            >
              <span className='material-symbols-rounded' aria-hidden>tune</span>
              Filtros
              {activeFilters > 0 && <span className='reqs__count'>{activeFilters}</span>}
            </button>
          </div>
          {mode === 'standard' && (
            <div className='reqs__chips'>
              {statusOptions.map(status => (
                <button
                  key={status.id}
                  type='button'
                  className={`reqs__chip ${statusFilter === status.id ? 'reqs__chip--active' : ''}`}
                  onClick={() => setStatusFilter(status.id)}
                >
                  {status.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* La tabla siempre se ve; el skeleton va dentro */}
        <div className='reqs__list'>
          <div className='reqs__row reqs__row--head'>
            <span>Folio</span>
            <span>Tipo</span>
            <span>Estado</span>
            <span>Fecha</span>
            <span>Creó</span>
            <span>Empresa</span>
            <span>Sucursal</span>
            <span>Área</span>
            <span className='reqs__col-actions'>Acciones</span>
          </div>

          {loading ? (
            <TableSkeleton
              rowClassName='reqs__row'
              cols={[{ avatar: true }, { width: '60%' }, { pill: true }, { width: '70%' }, { width: '70%' }, { width: '65%' }, { width: '65%' }, { width: '60%' }, { actions: 2 }]}
            />
          ) : requisitions.length > 0 ? (
            requisitions.map((item, index) => {
              const status = getStatusLabel(item.status);
              return (
                <div className='reqs__row' key={item.id || index}>
                  <div className='reqs__cell reqs__cell--name' data-label='Folio'>
                    <span className='reqs__row-icon material-symbols-rounded' aria-hidden>description</span>
                    <strong>{item.serie?.name || 'N/A'}-{item.folio}</strong>
                  </div>
                  <div className='reqs__cell' data-label='Tipo'>{getTypeLabel(item.tipo)}</div>
                  <div className='reqs__cell' data-label='Estado'>
                    <span className='reqs__badge' style={{ backgroundColor: status.color + '20', color: status.color }}>
                      {status.label}
                    </span>
                  </div>
                  <div className='reqs__cell reqs__cell--muted' data-label='Fecha'>
                    {item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy') : '—'}
                  </div>
                  <div className='reqs__cell reqs__cell--muted' data-label='Creó'>
                    {item.user?.firstName ? `${item.user.firstName} ${item.user.firstLastName}` : '—'}
                  </div>
                  <div className='reqs__cell' data-label='Empresa'>{item.company?.name || '—'}</div>
                  <div className='reqs__cell reqs__cell--muted' data-label='Sucursal'>{item.branch?.name || '—'}</div>
                  <div className='reqs__cell reqs__cell--muted' data-label='Área'>{item.areaType?.label ? `${item.areaType.label}${item.area?.name && item.area.name !== item.areaType.label ? ` › ${item.area.name}` : ''}` : (item.area?.name || '—')}</div>
                  <div className='reqs__cell reqs__col-actions'>
                    {item.status === 'PENDING' && canApprove && (
                      <button
                        type='button'
                        className='reqs__icon-btn reqs__icon-btn--approve'
                        title='Aprobar'
                        aria-label='Aprobar requisición'
                        onClick={() => decide(item, 'APPROVED')}
                      >
                        <span className='material-symbols-rounded'>check_circle</span>
                      </button>
                    )}
                    {item.status === 'PENDING' && canReject && (
                      <button
                        type='button'
                        className='reqs__icon-btn reqs__icon-btn--reject'
                        title='Rechazar'
                        aria-label='Rechazar requisición'
                        onClick={() => decide(item, 'REJECTED')}
                      >
                        <span className='material-symbols-rounded'>cancel</span>
                      </button>
                    )}
                    <button
                      type='button'
                      className='reqs__icon-btn'
                      title='Imprimir'
                      aria-label='Imprimir requisición'
                      onClick={() => printRow(item.id)}
                    >
                      <span className='material-symbols-rounded'>print</span>
                    </button>
                    <button
                      type='button'
                      className='reqs__icon-btn'
                      title='Gestionar'
                      aria-label='Gestionar requisición'
                      onClick={() => openDetail(item.id)}
                    >
                      <span className='material-symbols-rounded'>visibility</span>
                    </button>
                    <button
                      type='button'
                      className='reqs__icon-btn reqs__icon-btn--danger'
                      title='Eliminar'
                      aria-label='Eliminar requisición'
                    >
                      <span className='material-symbols-rounded'>delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className='reqs__state'>
              <p>No hay requisiciones disponibles</p>
              <span>Prueba con otros filtros o crea una con "Nueva requisición"</span>
            </div>
          )}
        </div>
      </div>
      <ModalRequisition />
      <ModalRequisitionDetail />
    </div>
  );
};

export default Requisition;
