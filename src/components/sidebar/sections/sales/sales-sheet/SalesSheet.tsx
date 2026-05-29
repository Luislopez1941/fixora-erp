import React, { useCallback, useEffect, useMemo, useState } from 'react'
import './SalesSheet.css'
import { useDispatch } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import ModalSheet from './modal-sale-sheet/ModalSheet'
import WebOrderFulfillmentModal from './WebOrderFulfillmentModal'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId } from '../../../../../constants/category'
import CategoriesStorePicker from '../../categories/CategoriesStorePicker'

const LS_COMPANY = 'categories-picker-company-id'

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem(LS_COMPANY))
  return !Number.isNaN(id) && id > 0 ? id : null
}

const formatMoney = (value: number | string, symbol = '$') => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return `${symbol}0.00`
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(parsed)
}

const formatDateTime = (value?: string) => {
  if (!value) return { date: '—', time: '' }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return { date: value, time: '' }

  return {
    date: parsed.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
    time: parsed.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

const statusLabel: Record<string, string> = {
  DRAFT: 'Borrador',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}

const customerOrderStatusLabel: Record<string, string> = {
  RECEIVED: 'Recibido',
  CONFIRMED: 'Confirmado',
  IN_PRODUCTION: 'Trabajando pedido',
  READY_FOR_PICKUP: 'Pedido terminado',
  OUT_FOR_DELIVERY: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

const SalesSheet: React.FC = () => {
  const dispatch = useDispatch()
  const [sales, setSales] = useState<any[]>([])
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'WEB' | 'POS'>('ALL')
  const [selectedWebSale, setSelectedWebSale] = useState<any | null>(null)

  const handleModalChange = (value: string) => {
    dispatch(modal(value))
  }

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
  }, [])

  const fetchSales = useCallback(async () => {
    const companyId = readCompanyId()
    if (!companyId) {
      setSales([])
      return
    }

    setLoading(true)
    try {
      const response: any = await APIs.getSales({
        companyId,
        branchId: branchId > 0 ? branchId : undefined,
        source: sourceFilter === 'ALL' ? undefined : sourceFilter,
      })
      const list = Array.isArray(response?.data) ? response.data : []
      setSales(list)
    } catch (error) {
      console.error('Error al cargar ventas:', error)
      setSales([])
    } finally {
      setLoading(false)
    }
  }, [branchId, sourceFilter])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sales

    return sales.filter((sale) => {
      const folio = `${sale.series?.name ?? 'VENT'}-${sale.folio ?? sale.id}`.toLowerCase()
      const linesText = (sale.lines ?? [])
        .map((line: any) => `${line.name ?? ''} ${line.code ?? ''}`)
        .join(' ')
        .toLowerCase()

      return folio.includes(q) || linesText.includes(q)
    })
  }, [sales, search])

  const getFolioLabel = (sale: any) => {
    if (sale.source === 'WEB' && sale.trackingCode) {
      return sale.trackingCode
    }
    const serie = sale.series?.name ?? 'VENT'
    const folio = sale.folio ?? sale.id
    return `${serie}-${folio}`
  }

  const getDeliveryLabel = (sale: any) => {
    if (sale.source !== 'WEB') return '—'
    if (sale.deliveryType === 'DELIVERY') {
      return `Domicilio · ${sale.deliveryColony ?? 'Cancún'}`
    }
    return 'Recoger en local'
  }

  const getPaymentLabel = (sale: any) => {
    const payments = sale.payments ?? []
    if (!payments.length) return '—'
    return payments
      .map((p: any) => p.paymentMethod?.name ?? 'Pago')
      .filter(Boolean)
      .join(', ')
  }

  const getCashierLabel = (sale: any) => {
    const user = sale.createdBy
    if (!user) return '—'
    return `${user.firstName ?? ''} ${user.firstLastName ?? ''}`.trim() || '—'
  }

  return (
    <div className='sale__sheet'>
      <div className='sale__sheet_container'>
        <div className='sale__sheet-toolbar'>
          <div className='sale__sheet-toolbar-left'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={persistBranchId}
              onCompanyIdChange={() => fetchSales()}
            />
          </div>
          <div className='sale__sheet-toolbar-right'>
            <select
              className='inputs__generic sale__sheet-filter'
              value={sourceFilter}
              onChange={(e) =>
                setSourceFilter(e.target.value as 'ALL' | 'WEB' | 'POS')
              }
            >
              <option value='ALL'>Todas</option>
              <option value='WEB'>Pedidos web</option>
              <option value='POS'>Punto de venta</option>
            </select>
            <div className='sale__sheet-search'>
              <div className='inputs__general_icons'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  aria-hidden
                >
                  <path d='M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0' />
                  <path d='M21 21l-6 -6' />
                </svg>
                <input
                  className='inputs__generic'
                  placeholder='Buscar folio o artículo'
                  type='text'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <button
              type='button'
              className='btn__general-primary'
              onClick={() => handleModalChange('sales-sheet_modal')}
            >
              Nueva ficha
            </button>
          </div>
        </div>

        <div className='table__sales-sheet'>
          <div>
            {loading ? (
              <p className='text sale__sheet-loading'>Cargando ventas...</p>
            ) : (
              <div className='table__numbers'>
                <p className='text'>Total de ventas</p>
                <div className='quantities_tables'>{filteredSales.length}</div>
              </div>
            )}
          </div>

          <div className='table__head'>
            <div className='thead sales-sheet-list__row'>
              <div className='th'>
                <p>Folio</p>
              </div>
              <div className='th movil'>
                <p>Fecha</p>
              </div>
              <div className='th movil sales-sheet-list__col--articles'>
                <p>Artículos</p>
              </div>
              <div className='th movil sales-sheet-list__col--money'>
                <p>Subtotal</p>
              </div>
              <div className='th sales-sheet-list__col--money'>
                <p>Total</p>
              </div>
              <div className='th movil'>
                <p>Pago</p>
              </div>
              <div className='th movil'>
                <p>Cajero</p>
              </div>
              <div className='th movil'>
                <p>Entrega</p>
              </div>
              <div className='th sales-sheet-list__col--status'>
                <p>Estado</p>
              </div>
              <div className='th movil'>
                <p>Acción</p>
              </div>
            </div>
          </div>

          {!loading && filteredSales.length > 0 ? (
            <div className='table__body'>
              {filteredSales.map((sale) => {
                const when = formatDateTime(sale.createdAt)
                const lines = sale.lines ?? []

                return (
                  <div className='tbody__container sales-sheet-list__item' key={sale.id}>
                    <div className='tbody sales-sheet-list__row'>
                      <div className='td sales-sheet-list__folio'>
                        <span className='sale__folio-badge'>{getFolioLabel(sale)}</span>
                      </div>
                      <div className='td movil sales-sheet-list__date'>
                        <span className='sale__date-main'>{when.date}</span>
                        {when.time ? (
                          <span className='sale__date-sub'>{when.time}</span>
                        ) : null}
                      </div>
                      <div className='td movil sales-sheet-list__articles'>
                        <span className='sale__items-count'>
                          {lines.length}{' '}
                          {lines.length === 1 ? 'artículo' : 'artículos'}
                        </span>
                        {lines.length > 0 ? (
                          <div className='sale__lines-preview'>
                            {lines.map((line: any) => (
                              <span className='sale__line-chip' key={line.id}>
                                {line.quantity}× {line.name}
                                {line.code ? ` · ${line.code}` : ''}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className='td movil sale__money sales-sheet-list__col--money'>
                        {formatMoney(sale.subtotal)}
                      </div>
                      <div className='td sale__money sale__money--total sales-sheet-list__col--money'>
                        {formatMoney(sale.total)}
                      </div>
                      <div className='td movil sales-sheet-list__payment'>
                        {getPaymentLabel(sale)}
                      </div>
                      <div className='td movil sales-sheet-list__cashier'>
                        {getCashierLabel(sale)}
                      </div>
                      <div className='td movil sales-sheet-list__delivery'>
                        {getDeliveryLabel(sale)}
                      </div>
                      <div className='td sales-sheet-list__col--status'>
                        <span
                          className={`sale__status sale__status--${(sale.status ?? 'DRAFT').toLowerCase()}`}
                        >
                          {sale.source === 'WEB' && sale.customerOrderStatus
                            ? customerOrderStatusLabel[sale.customerOrderStatus] ??
                              sale.customerOrderStatus
                            : statusLabel[sale.status] ?? sale.status}
                        </span>
                      </div>
                      <div className='td movil sales-sheet-list__action'>
                        {sale.source === 'WEB' ? (
                          <button
                            type='button'
                            className='btn__general-purple'
                            onClick={() => setSelectedWebSale(sale)}
                          >
                            Entrega
                          </button>
                        ) : (
                          '—'
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : !loading ? (
            <p className='text sale__sheet-empty'>
              {readCompanyId()
                ? 'No hay ventas registradas. Usa "Nueva ficha" para cobrar.'
                : 'Selecciona una empresa para ver las ventas.'}
            </p>
          ) : null}
        </div>

        <ModalSheet onSaved={fetchSales} />
        <WebOrderFulfillmentModal
          sale={selectedWebSale}
          open={Boolean(selectedWebSale)}
          onClose={() => setSelectedWebSale(null)}
          onSaved={fetchSales}
        />
      </div>
    </div>
  )
}

export default SalesSheet
