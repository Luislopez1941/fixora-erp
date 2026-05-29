import React, { useCallback, useEffect, useState } from 'react'
import ModalTickets from './modal-tickets/ModalTickets'
import { useDispatch } from 'react-redux';
import { modal } from '../../../../../redux/state/modals'
import APIs from '../../../../../services/APIs';
import { readCategoryBranchId } from '../../../../../constants/category';
import CategoriesStorePicker from '../../categories/CategoriesStorePicker';
import '../../categories/Categories.css';
import Swal from 'sweetalert2';
import './Tickets.css'
import Flatpickr from "react-flatpickr";
import 'flatpickr/dist/flatpickr.min.css';
import { Spanish } from 'flatpickr/dist/l10n/es.js';

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
  const [dates, setDates] = useState<any>({})
  const [tickets, setTickets] = useState<any[]>([])
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [loading, setLoading] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)

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
    if (!dates?.startDate && !dates?.endDate) return true;
    const created = item.createdAt?.slice(0, 10);
    if (dates?.startDate && created < dates.startDate) return false;
    if (dates?.endDate && created > dates.endDate) return false;
    return true;
  });

  return (
    <div className='tickets'>
      <div className='tickets__container'>
        <div className='row__one tickets__filters'>
          <div className='tickets__store-picker'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={persistBranchId}
              onCompanyIdChange={() => fetchTickets()}
            />
          </div>
          <div>
            <label className="label__general">Desde</label>
            <div className="input-date">
              <Flatpickr
                className="date"
                options={{ locale: Spanish, dateFormat: "Y-m-d" }}
                value={dates?.startDate}
                onChange={(e) => setDates((prev: any) => ({ ...prev, startDate: e[0]?.toISOString().split("T")[0] || "" }))}
              />
            </div>
          </div>
          <div>
            <label className="label__general">Hasta</label>
            <div className="input-date">
              <Flatpickr
                className="date"
                options={{ locale: Spanish, dateFormat: "Y-m-d" }}
                value={dates?.endDate}
                onChange={(e) => setDates((prev: any) => ({ ...prev, endDate: e[0]?.toISOString().split("T")[0] || "" }))}
              />
            </div>
          </div>
        </div>
        <div className='row__two'>
          <div>
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
        </div>
        <div className='table__tickets' >
          <div>
            <div className='table__numbers'>
              <p className='text'>Total de entradas</p>
              <div className='quantities_tables'>{filteredTickets.length}</div>
            </div>
          </div>
          <div className='table__head'>
            <div className='thead'>
              <div className='th '>
                <p className=''>Serie / Folio</p>
              </div>
              <div className='th movil'>
                <p className=''>Fecha</p>
              </div>
              <div className='th movil'>
                <p className=''>Usuario</p>
              </div>
              <div className='th movil'>
                <p className=''>Empresa</p>
              </div>
              <div className='th movil'>
                <p className=''>Sucursal</p>
              </div>
              <div className='th'>
              </div>
              <div className='th'>
              </div>
            </div>
          </div>
          {loading ? (
            <p className='text'>Cargando entradas...</p>
          ) : filteredTickets.length > 0 ? (
            <div className='table__body'>
              {filteredTickets.map((item: any) => (
                <div className='tbody__container' key={item.id}>
                  <div className='tbody-desk'>
                    <div className='td'>
                      <p className='code-folio-identifier'>{item.serie}-{item.folio}</p>
                    </div>
                    <div className='td'>
                      <p className='date-identifier'>{formatDate(item.createdAt)}</p>
                    </div>
                    <div className='td'>
                      <p className='user-identifier'>{item.user}</p>
                    </div>
                    <div className='td movil'>
                      {item.companyName}
                    </div>
                    <div className='td movil'>
                      {item.branchName}
                    </div>
                    <div className='td edit' onClick={() => handleEdit(item)} role='button' tabIndex={0}>
                      <div className='edit-icon'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-edit"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" /><path d="M16 5l3 3" /></svg>
                      </div>
                    </div>
                    <div className='td delete' onClick={() => handleDelete(item)} role='button' tabIndex={0}>
                      <div className='delete-icon'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className=" icon icon-tabler icons-tabler-filled icon-tabler-trash"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20 6a1 1 0 0 1 .117 1.993l-.117 .007h-.081l-.919 11a3 3 0 0 1 -2.824 2.995l-.176 .005h-8c-1.598 0 -2.904 -1.249 -2.992 -2.75l-.005 -.167l-.923 -11.083h-.08a1 1 0 0 1 -.117 -1.993l.117 -.007h16z" /><path d="M14 2a2 2 0 0 1 2 2a1 1 0 0 1 -1.993 .117l-.007 -.117h-4l-.007 .117a1 1 0 0 1 -1.993 -.117a2 2 0 0 1 1.85 -1.995l.15 -.005h4z" /></svg>
                      </div>
                    </div>
                  </div>
                  <div className='tbody-response'>
                    <div className='td'>
                      <p className='code-folio-identifier'>{item.serie}-{item.folio}</p>
                    </div>
                    <div className='td'>
                      <p className='date-identifier'>{formatDate(item.createdAt)}</p>
                    </div>
                    <div className='td'>
                      <p className='user-identifier'>{item.user}</p>
                    </div>
                    <div className='td movil'>
                      {item.companyName}
                    </div>
                    <div className='td movil'>
                      {item.branchName}
                    </div>
                    <div className='td edit' onClick={() => handleEdit(item)} role='button' tabIndex={0}>
                      <div className='edit-icon'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-edit"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" /><path d="M16 5l3 3" /></svg>
                      </div>
                    </div>
                    <div className='td delete' onClick={() => handleDelete(item)} role='button' tabIndex={0}>
                      <div className='delete-icon'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className=" icon icon-tabler icons-tabler-filled icon-tabler-trash"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20 6a1 1 0 0 1 .117 1.993l-.117 .007h-.081l-.919 11a3 3 0 0 1 -2.824 2.995l-.176 .005h-8c-1.598 0 -2.904 -1.249 -2.992 -2.75l-.005 -.167l-.923 -11.083h-.08a1 1 0 0 1 -.117 -1.993l.117 -.007h16z" /><path d="M14 2a2 2 0 0 1 2 2a1 1 0 0 1 -1.993 .117l-.007 -.117h-4l-.007 .117a1 1 0 0 1 -1.993 -.117a2 2 0 0 1 1.85 -1.995l.15 -.005h4z" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text'>No hay entradas que mostrar</p>
          )}
        </div>
        <ModalTickets onSaved={fetchTickets} selectedTicket={selectedTicket} />
      </div>
    </div>
  )
}

export default Tickets
