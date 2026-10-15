import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ModalTickets from './modal-tickets/ModalTickets'
import { useDispatch } from 'react-redux';
import { modal } from '../../../../../redux/state/modals'
import APIs from '../../../../../services/APIs';
import { readCategoryBranchId } from '../../../../../constants/category';
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker';
import '../../catalogos/categories/Categories.css';
import Swal from 'sweetalert2';
import './Tickets.css'
import { DateRangePicker } from 'react-date-range'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'

const LS_COMPANY = 'categories-picker-company-id';

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem(LS_COMPANY));
  return !Number.isNaN(id) && id > 0 ? id : null;
};

const formatDate = (value: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const Tickets: React.FC = () => {
  const dispatch = useDispatch();
  const [tickets, setTickets] = useState<any[]>([])
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [loading, setLoading] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)

  // El rango que el usuario está armando en el calendario — siempre tiene
  // fechas válidas (react-date-range las necesita), pero no filtra nada
  // hasta que se le da "Aplicar" (ver appliedRange).
  const [dateRange, setDateRange] = useState([{
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  }])
  const [appliedRange, setAppliedRange] = useState<{ startDate: string; endDate: string } | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  // El popup se renderiza vía portal a <body> (ver abajo) — fixed + calculado
  // en JS, para que siempre quede completamente visible sin importar dónde
  // esté el botón ni qué contenedores con overflow haya alrededor.
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      const insideTrigger = pickerRef.current?.contains(target)
      const insidePopup = popupRef.current?.contains(target)
      if (!insideTrigger && !insidePopup) {
        setPickerOpen(false)
      }
    }
    if (pickerOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [pickerOpen])

  useLayoutEffect(() => {
    if (!pickerOpen || !pickerRef.current) return

    const compute = () => {
      if (!pickerRef.current) return
      const triggerRect = pickerRef.current.getBoundingClientRect()
      const popupWidth = popupRef.current?.offsetWidth || 330
      const popupHeight = popupRef.current?.offsetHeight || 420
      const margin = 8

      // Verticalmente: abajo del botón salvo que no quepa — entonces arriba.
      let top = triggerRect.bottom + margin
      if (top + popupHeight > window.innerHeight - margin) {
        const openUpTop = triggerRect.top - popupHeight - margin
        top = openUpTop >= margin ? openUpTop : Math.max(margin, window.innerHeight - popupHeight - margin)
      }

      // Horizontalmente: alineado a la derecha del botón, pero sin salirse
      // de la pantalla por ningún lado.
      let left = triggerRect.right - popupWidth
      if (left < margin) left = margin
      if (left + popupWidth > window.innerWidth - margin) left = window.innerWidth - popupWidth - margin

      setPopupPos({ top, left })
    }

    compute()
    const raf = requestAnimationFrame(compute)
    window.addEventListener('resize', compute)
    window.addEventListener('scroll', compute, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', compute)
      window.removeEventListener('scroll', compute, true)
    }
  }, [pickerOpen])

  const applyDateRange = () => {
    setAppliedRange({
      startDate: format(dateRange[0].startDate!, 'yyyy-MM-dd'),
      endDate: format(dateRange[0].endDate!, 'yyyy-MM-dd'),
    })
    setPickerOpen(false)
  }

  const clearDateRange = () => {
    setAppliedRange(null)
    setPickerOpen(false)
  }

  const handleModalChange = (value: any) => {
    dispatch(modal(value));
  };

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id);
    localStorage.setItem('categories-store-id', String(id));
  }, []);

  const fetchTickets = useCallback(async () => {
    const companyId = readCompanyId();
    if (!companyId) {
      setTickets([]);
      return;
    }

    setLoading(true);
    try {
      const response: any = await APIs.getTickets({
        companyId,
        branchId: branchId > 0 ? branchId : undefined,
      });
      const list = Array.isArray(response?.data) ? response.data : [];
      setTickets(list);
    } catch (error) {
      console.error('Error al cargar entradas:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleEdit = (ticket: any) => {
    setSelectedTicket(ticket);
    dispatch(modal('tickets_modal_update'));
  };

  const handleDelete = async (ticket: any) => {
    const result = await Swal.fire({
      title: '¿Eliminar entrada?',
      text: `Se eliminará la entrada ${ticket.serie}-${ticket.folio}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    try {
      const response: any = await APIs.deleteTicket(ticket.id);
      Swal.fire({
        icon: 'success',
        title: 'Entrada eliminada',
        text: response.message ?? 'La entrada se eliminó correctamente.',
      });
      fetchTickets();
    } catch (error) {
      console.error('Error al eliminar entrada:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la entrada. Inténtalo de nuevo.',
      });
    }
  };

  const filteredTickets = tickets.filter((item) => {
    if (!appliedRange) return true;
    const created = item.createdAt?.slice(0, 10);
    if (created < appliedRange.startDate) return false;
    if (created > appliedRange.endDate) return false;
    return true;
  });

  return (
    <div className='tickets'>
      <div className='tickets__container'>
        <div className='tickets__filters'>
          <div className='tickets__filters-left'>
          <div className='tickets__store-picker'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={persistBranchId}
              onCompanyIdChange={() => fetchTickets()}
            />
          </div>
          <div className='tickets-date-range' ref={pickerRef}>
            <button
              type='button'
              className='tickets-date-range__trigger'
              onClick={() => setPickerOpen((p) => !p)}
            >
              <span className='material-symbols-rounded tickets-date-range__icon'>calendar_month</span>
              <div className='tickets-date-range__display'>
                <span className='tickets-date-range__label'>Fecha</span>
                <span className='tickets-date-range__value'>
                  {appliedRange
                    ? `${format(new Date(appliedRange.startDate), 'dd MMM yyyy', { locale: es })} — ${format(new Date(appliedRange.endDate), 'dd MMM yyyy', { locale: es })}`
                    : 'Todas las fechas'}
                </span>
              </div>
              <span className='material-symbols-rounded tickets-date-range__caret'>
                {pickerOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {pickerOpen && createPortal(
              <div
                className='tickets-date-range__popup'
                ref={popupRef}
                style={popupPos ? { top: popupPos.top, left: popupPos.left } : { visibility: 'hidden' }}
              >
                <DateRangePicker
                  ranges={dateRange}
                  onChange={(item: any) => setDateRange([item.selection])}
                  locale={es}
                  maxDate={new Date()}
                  rangeColors={['#072a57']}
                  showMonthAndYearPickers
                  months={1}
                  direction='vertical'
                  moveRangeOnFirstSelection={false}
                  showDateDisplay={false}
                />
                <div className='tickets-date-range__popup-footer'>
                  {appliedRange && (
                    <button type='button' className='tickets-date-range__clear' onClick={clearDateRange}>
                      Limpiar
                    </button>
                  )}
                  <button type='button' className='tickets-date-range__apply' onClick={applyDateRange}>
                    Aplicar
                  </button>
                </div>
              </div>,
              document.body
            )}
          </div>
          </div>
          <button
            className='btn__general-primary'
            onClick={() => {
              setSelectedTicket(null);
              handleModalChange('tickets_modal');
            }}
          >
            Nueva entrada
          </button>
        </div>

        <div className='tickets__count-bar'>
          <span>Total de entradas</span>
          <span className='tickets__count-num'>{filteredTickets.length}</span>
        </div>

        <div className='tickets__table'>
          <div className='tickets__thead'>
            <div className='tickets__th'>Serie / Folio</div>
            <div className='tickets__th'>Fecha</div>
            <div className='tickets__th'>Usuario</div>
            <div className='tickets__th'>Empresa</div>
            <div className='tickets__th'>Sucursal</div>
            <div className='tickets__th tickets__th--actions'>Acciones</div>
          </div>

          {loading ? (
            <div className='tickets__loading'>Cargando entradas…</div>
          ) : filteredTickets.length > 0 ? (
            <div className='tickets__tbody'>
              {filteredTickets.map((item: any) => (
                <div className='tickets__row' key={item.id}>
                  <div className='tickets__td'>
                    <span className='tickets__folio'>{item.serie}-{item.folio}</span>
                  </div>
                  <div className='tickets__td'>{formatDate(item.createdAt)}</div>
                  <div className='tickets__td'>{item.user}</div>
                  <div className='tickets__td'>{item.companyName}</div>
                  <div className='tickets__td'>{item.branchName}</div>
                  <div className='tickets__td tickets__td--actions'>
                    <div className='edit-icon' title='Editar entrada' aria-label='Editar entrada' onClick={() => handleEdit(item)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" /><path d="M16 5l3 3" /></svg>
                    </div>
                    <div className='delete-icon' title='Eliminar entrada' aria-label='Eliminar entrada' onClick={() => handleDelete(item)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20 6a1 1 0 0 1 .117 1.993l-.117 .007h-.081l-.919 11a3 3 0 0 1 -2.824 2.995l-.176 .005h-8c-1.598 0 -2.904 -1.249 -2.992 -2.75l-.005 -.167l-.923 -11.083h-.08a1 1 0 0 1 -.117 -1.993l.117 -.007h16z" /><path d="M14 2a2 2 0 0 1 2 2a1 1 0 0 1 -1.993 .117l-.007 -.117h-4l-.007 .117a1 1 0 0 1 -1.993 -.117a2 2 0 0 1 1.85 -1.995l.15 -.005h4z" /></svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='tickets__empty'>No hay entradas que mostrar</div>
          )}
        </div>
        <ModalTickets onSaved={fetchTickets} selectedTicket={selectedTicket} />
      </div>
    </div>
  )
}

export default Tickets
