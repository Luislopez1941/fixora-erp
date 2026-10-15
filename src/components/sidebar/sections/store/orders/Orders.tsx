import React, { useEffect, useState, useCallback } from 'react'
import './Orders.css'
import ModalTickets from './modal-orders/ModalOrders'
import { useDispatch } from 'react-redux';
import { modal } from '../../../../../redux/state/modals'
import APIs from '../../../../../services/APIs';
import { useSelector } from 'react-redux';
import Flatpickr from "react-flatpickr";
import 'flatpickr/dist/flatpickr.min.css';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'

const Orders: React.FC = () => {
  const userState = useSelector((store: any) => store.user);
  const dispatch = useDispatch();

  const handleModalChange = (value: string) => {
    dispatch(modal(value));
  };

  const [dates, setDates] = useState<{ startDate?: string; endDate?: string }>({})
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [branchId, setBranchId] = useState(() => {
    const id = Number(localStorage.getItem('categories-picker-branch-id'))
    return !Number.isNaN(id) && id > 0 ? id : 0
  })
  const [companyId, setCompanyId] = useState<number | null>(() => {
    const id = Number(localStorage.getItem('categories-picker-company-id'))
    return !Number.isNaN(id) && id > 0 ? id : null
  })

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
    localStorage.setItem('categories-picker-branch-id', String(id))
  }, [])

  const fetchTickets = useCallback(async () => {
    if (!companyId) {
      setTickets([])
      return
    }

    setLoading(true)
    try {
      const data = {
        companyId,
        branchId: branchId > 0 ? branchId : undefined,
      }
      const response: any = await APIs.getTickets(data)
      setTickets(Array.isArray(response?.data) ? response.data : [])
    } catch (error) {
      console.error('Error al cargar pedidos:', error)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [branchId, companyId])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  return (
    <div className='store-orders-page'>
      <div className='store-orders-content'>
        <div className='store-orders-top-bar'>
          <div className='store-orders-toolbar-left'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={persistBranchId}
              onCompanyIdChange={(id) => setCompanyId(id)}
            />
            <div className="store-orders-date-container">
              <div className="store-orders-date-field">
                <label>Desde</label>
                <Flatpickr
                  className="store-orders-date-input"
                  options={{ locale: Spanish, dateFormat: "Y-m-d" }}
                  value={dates.startDate}
                  onChange={(e) => setDates(prev => ({ ...prev, startDate: e[0]?.toISOString().split("T")[0] }))}
                />
              </div>
              <div className="store-orders-date-field">
                <label>Hasta</label>
                <Flatpickr
                  className="store-orders-date-input"
                  options={{ locale: Spanish, dateFormat: "Y-m-d" }}
                  value={dates.endDate}
                  onChange={(e) => setDates(prev => ({ ...prev, endDate: e[0]?.toISOString().split("T")[0] }))}
                />
              </div>
            </div>
          </div>
          <div className="store-orders-action-container">
            <button className='btn-new-order' onClick={() => handleModalChange('tickets_modal')}>
              <span className="material-symbols-rounded">add</span>
              Nuevo pedido
            </button>
          </div>
        </div>

        <div className='store-orders-table-wrap'>
          <div className='store-orders-table'>
            <div className='store-orders-thead'>
              <div className='th'>Serie / Folio</div>
              <div className='th'>Fecha</div>
              <div className='th'>Usuario</div>
              <div className='th'>Empresa</div>
              <div className='th'>Sucursal</div>
              <div className='th'>Acciones</div>
            </div>
            <div className='store-orders-tbody'>
              {loading ? (
                <div className="store-orders-loading">
                  <div className="spinner" />
                  <p>Cargando pedidos...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="store-orders-empty">
                  <p>No hay pedidos registrados</p>
                </div>
              ) : (
                tickets.map((item: any, index: number) => (
                  <div className='store-orders-row-wrap' key={index}>
                    <div className='store-orders-row'>
                      <div className='td'>
                        <p className='store-orders-folio'>{item.serie}-{item.folio}</p>
                      </div>
                      <div className='td'>
                        <p>{item.createdAt}</p>
                      </div>
                      <div className='td'>
                        <p>{item.user}</p>
                      </div>
                      <div className='td'>
                        <p>{item.companyName}</p>
                      </div>
                      <div className='td'>
                        <p>{item.branchName}</p>
                      </div>
                      <div className='td store-orders-actions'>
                        <div className='action-btn edit' title="Editar">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" /><path d="M16 5l3 3" /></svg>
                        </div>
                        <div className='action-btn delete' title="Eliminar">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20 6a1 1 0 0 1 .117 1.993l-.117 .007h-.081l-.919 11a3 3 0 0 1 -2.824 2.995l-.176 .005h-8c-1.598 0 -2.904 -1.249 -2.992 -2.75l-.005 -.167l-.923 -11.083h-.08a1 1 0 0 1 -.117 -1.993l.117 -.007h16z" /><path d="M14 2a2 2 0 0 1 2 2a1 1 0 0 1 -1.993 .117l-.007 -.117h-4l-.007 .117a1 1 0 0 1 -1.993 -.117a2 2 0 0 1 1.85 -1.995l.15 -.005h4z" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <ModalTickets companies={[]} branch={[]} />
      </div>
    </div>
  )
}

export default Orders
