import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
// Mismo diseño que Requisiciones y Órdenes de compra (filtros compactos, tabla en filas, tarjetas en celular)
import '../../shopping/requisition/Requisition.css';
import TableSkeleton from '../../../../general/skeleton/TableSkeleton';
import { useDispatch, useSelector } from 'react-redux';
import { modal } from '../../../../../redux/state/modals';
import { useCan } from '../../../../../core/permissions/useCan';
import APIs from '../../../../../services/APIs';
import { format } from 'date-fns';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './Quotation.css';
import ModalQuotation from './modal-quotation/ModalQuotation';
import ModalQuotationDetail from './modal-quotation-detail/ModalQuotationDetail';
import { money, printQuotation, QUOTATION_STATUS, QUOTATIONS_CHANGED, quotationCustomer } from './printQuotation';

const STATUS_OPTIONS = [
  { id: 'ALL', label: 'Todas' },
  { id: 'ACTIVE', label: 'Activas' },
  { id: 'DRAFT', label: 'Borradores' },
  { id: 'SENT', label: 'Enviadas' },
  { id: 'ACCEPTED', label: 'Aceptadas' },
  { id: 'REJECTED', label: 'Rechazadas' },
  { id: 'EXPIRED', label: 'Vencidas' },
];

const Quotation: React.FC = () => {
  const dispatch = useDispatch();
  const userState = useSelector((state: any) => state.user);
  const can = useCan();
  const canManage = can('sales.quote.manage');
  const canCreate = can('sales.quote.create');

  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [companies, setCompanies] = useState<any[]>([]);
  const [branchOffices, setBranchOffices] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number>(0);
  const [selectedBranch, setSelectedBranch] = useState<number>(0);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 3)));
  const [endDate, setEndDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  // En el celular los selects se esconden detrás del botón "Filtros"
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters = [selectedCompany, selectedBranch].filter(Boolean).length;

  const dateRange = useMemo(
    () => ({ startDate, endDate, key: 'selection', color: '#586ae9' }),
    [startDate, endDate],
  );

  useEffect(() => {
    if (!showCalendar) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setShowCalendar(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const response: any = await APIs.getQuotations({
        companyId: selectedCompany,
        branchId: selectedBranch,
        status: statusFilter,
        page,
        folio: search.trim() || undefined,
        desde: format(startDate, 'yyyy-MM-dd'),
        hasta: format(endDate, 'yyyy-MM-dd'),
      });
      setQuotations(Array.isArray(response?.data) ? response.data : []);
      setTotalPages(response?.total_pages || 1);
    } catch (error) {
      console.error('Error al cargar cotizaciones:', error);
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, selectedBranch, statusFilter, page, search, startDate, endDate]);

  // Un filtro distinto regresa a la primera página
  useEffect(() => {
    setPage(1);
  }, [selectedCompany, selectedBranch, statusFilter, search, startDate, endDate]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  // Los modales avisan cuando crean, editan, cambian de estado o borran una cotización
  useEffect(() => {
    const refresh = () => fetchQuotations();
    window.addEventListener(QUOTATIONS_CHANGED, refresh);
    return () => window.removeEventListener(QUOTATIONS_CHANGED, refresh);
  }, [fetchQuotations]);

  useEffect(() => {
    (async () => {
      try {
        const userId = userState?.id || 1;
        const compData: any = await APIs.getCompaniesByUser(userId);
        setCompanies(Array.isArray(compData) ? compData : compData?.data || []);
      } catch (e) {
        console.error('Error loading companies', e);
      }
    })();
  }, [userState?.id]);

  const handleCompanyChange = async (companyId: number) => {
    setSelectedCompany(companyId);
    setSelectedBranch(0);
    setBranchOffices([]);
    if (!companyId) return;
    try {
      const response: any = await APIs.getBranchOffices(companyId, userState?.id || 1);
      setBranchOffices(Array.isArray(response) ? response : response?.data || []);
    } catch (e) {
      console.error('Error loading branches', e);
    }
  };

  const openDetail = (id: number) => {
    localStorage.setItem('selected_quotation_id', String(id));
    dispatch(modal('quotation_detail_modal'));
  };

  const openEdit = (id: number) => {
    localStorage.setItem('selected_quotation_id', String(id));
    dispatch(modal('quotation_modal'));
  };

  const openNew = () => {
    localStorage.removeItem('selected_quotation_id');
    dispatch(modal('quotation_modal'));
  };

  // Imprimir desde la fila: el listado no trae los conceptos, así que se pide el detalle completo
  const printRow = async (id: number) => {
    try {
      const response: any = await APIs.getQuotationById(id);
      printQuotation(response?.data ?? response);
    } catch (error) {
      Swal.fire('Error', 'No se pudo preparar la cotización para imprimir.', 'error');
    }
  };

  const handleDelete = async (item: any) => {
    const result = await Swal.fire({
      title: '¿Eliminar cotización?',
      text: `${item.serie?.name || 'COT'}-${item.folio} se eliminará y no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await APIs.deleteQuotation(item.id);
      Swal.fire({ icon: 'success', title: 'Cotización eliminada', timer: 1400, showConfirmButton: false });
      fetchQuotations();
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Swal.fire('Error', (Array.isArray(message) ? message.join(', ') : message) || 'No se pudo eliminar la cotización.', 'error');
    }
  };

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
              onChange={(e) => setSelectedBranch(Number(e.target.value))}
              disabled={!selectedCompany}
            >
              <option value={0}>Todas las sucursales</option>
              {branchOffices.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          {(canCreate || canManage) && (
            <button type='button' className='btn__general-primary' onClick={openNew}>
              Nueva cotización
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
                placeholder='Folio, cliente o título'
                aria-label='Buscar cotización'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                    onChange={(item) => {
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
          <div className='reqs__chips'>
            {STATUS_OPTIONS.map((status) => (
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
        </div>

        {/* La tabla siempre se ve; el skeleton va dentro */}
        <div className='reqs__list'>
          <div className='reqs__row reqs__row--head'>
            <span>Folio</span>
            <span>Cliente</span>
            <span>Estado</span>
            <span>Fecha</span>
            <span>Vigencia</span>
            <span>Total</span>
            <span>Creó</span>
            <span>Sucursal</span>
            <span className='reqs__col-actions'>Acciones</span>
          </div>

          {loading ? (
            <TableSkeleton
              rowClassName='reqs__row'
              cols={[{ avatar: true }, { width: '70%' }, { pill: true }, { width: '70%' }, { width: '70%' }, { width: '60%' }, { width: '65%' }, { width: '65%' }, { actions: 2 }]}
            />
          ) : quotations.length > 0 ? (
            quotations.map((item) => {
              const status = QUOTATION_STATUS[item.status] ?? { label: item.status, color: '#5b6472', bg: '#eef0f3' };
              const editable = item.status !== 'ACCEPTED';
              return (
                <div className='reqs__row' key={item.id}>
                  <div className='reqs__cell reqs__cell--name' data-label='Folio'>
                    <span className='reqs__row-icon material-symbols-rounded' aria-hidden>request_quote</span>
                    <div className='quote-name'>
                      <strong>{item.serie?.name || 'COT'}-{item.folio}</strong>
                      {item.title && <small>{item.title}</small>}
                    </div>
                  </div>
                  <div className='reqs__cell' data-label='Cliente'>{quotationCustomer(item)}</div>
                  <div className='reqs__cell' data-label='Estado'>
                    <span className='reqs__badge' style={{ backgroundColor: status.color + '20', color: status.color }}>
                      {status.label}
                    </span>
                  </div>
                  <div className='reqs__cell reqs__cell--muted' data-label='Fecha'>
                    {item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy') : '—'}
                  </div>
                  <div className='reqs__cell reqs__cell--muted' data-label='Vigencia'>
                    {item.validUntil ? format(new Date(item.validUntil), 'dd/MM/yyyy') : '—'}
                  </div>
                  <div className='reqs__cell' data-label='Total'><strong>{money(item.total)}</strong></div>
                  <div className='reqs__cell reqs__cell--muted' data-label='Creó'>
                    {item.user?.firstName ? `${item.user.firstName} ${item.user.firstLastName}` : '—'}
                  </div>
                  <div className='reqs__cell reqs__cell--muted' data-label='Sucursal'>{item.branch?.name || '—'}</div>
                  <div className='reqs__cell reqs__col-actions'>
                    <button type='button' className='reqs__icon-btn' title='Ver' aria-label='Ver cotización' onClick={() => openDetail(item.id)}>
                      <span className='material-symbols-rounded'>visibility</span>
                    </button>
                    <button type='button' className='reqs__icon-btn' title='Imprimir' aria-label='Imprimir cotización' onClick={() => printRow(item.id)}>
                      <span className='material-symbols-rounded'>print</span>
                    </button>
                    {canManage && editable && (
                      <button type='button' className='reqs__icon-btn' title='Editar' aria-label='Editar cotización' onClick={() => openEdit(item.id)}>
                        <span className='material-symbols-rounded'>edit</span>
                      </button>
                    )}
                    {canManage && editable && (
                      <button type='button' className='reqs__icon-btn reqs__icon-btn--danger' title='Eliminar' aria-label='Eliminar cotización' onClick={() => handleDelete(item)}>
                        <span className='material-symbols-rounded'>delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className='reqs__state'>
              <p>No hay cotizaciones disponibles</p>
              <span>Prueba con otros filtros o crea una con "Nueva cotización"</span>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className='quote-pager'>
            <button type='button' className='reqs__pill-btn' onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <span className='material-symbols-rounded' aria-hidden>chevron_left</span>
              Anterior
            </button>
            <span>Página {page} de {totalPages}</span>
            <button type='button' className='reqs__pill-btn' onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              Siguiente
              <span className='material-symbols-rounded' aria-hidden>chevron_right</span>
            </button>
          </div>
        )}
      </div>
      <ModalQuotation />
      <ModalQuotationDetail />
    </div>
  );
};

export default Quotation;
