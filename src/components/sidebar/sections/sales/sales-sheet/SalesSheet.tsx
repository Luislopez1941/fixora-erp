import { useCallback, useEffect, useMemo, useState } from 'react'
import './SalesSheet.css'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import ModalSheet from './modal-sale-sheet/ModalSheet'
import WebOrderFulfillmentModal from './WebOrderFulfillmentModal'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId } from '../../../../../constants/category'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'

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
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const userState = useSelector((state: any) => state.user)
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
    // Empresa del selector o, si no hay ninguna vinculada, la activa de la sesión
    const effectiveCompanyId =
      companyId ?? userState?.activeCompanyId ?? userState?.companyId ?? userState?.companyIds?.[0] ?? null
    if (!effectiveCompanyId) {
      setSales([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response: any = await APIs.getSales({
        companyId: effectiveCompanyId,
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
  }, [branchId, companyId, sourceFilter, userState?.activeCompanyId])

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

  const statusClass = (sale: any) =>
    sale.source === 'WEB' && sale.customerOrderStatus
      ? `is-web-${String(sale.customerOrderStatus).toLowerCase()}`
      : `is-${String(sale.status ?? 'DRAFT').toLowerCase()}`

  return (
    <div className='sales-sheet-list'>
      <div className='sales-sheet-list__container'>
        <div className='sales-sheet-list__header'>
          <div className='sales-sheet-list__header-left'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={persistBranchId}
              onCompanyIdChange={(id) => setCompanyId(id)}
            />
            <div className='sales-sheet-list__search'>
              <span className='sales-sheet-list__search-icon material-symbols-rounded' aria-hidden>search</span>
              <input
                className='inputs__general sales-sheet-list__search-input'
                placeholder='Buscar folio o artículo'
                aria-label='Buscar ventas'
                type='text'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className='sales-sheet-list__tabs' role='tablist'>
              {([['ALL', 'Todas'], ['POS', 'Punto de venta'], ['WEB', 'Pedidos web']] as ['ALL' | 'WEB' | 'POS', string][]).map(([key, label]) => (
                <button
                  key={key}
                  type='button'
                  role='tab'
                  aria-selected={sourceFilter === key}
                  className={`sales-sheet-list__tab ${sourceFilter === key ? 'sales-sheet-list__tab--active' : ''}`}
                  onClick={() => setSourceFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button type='button' className='btn__general-primary' onClick={() => handleModalChange('sales-sheet_modal')}>
            Ficha de cobro
          </button>
        </div>

        {/* La tabla siempre se ve; el skeleton va dentro */}
        <div className='sales-sheet-list__list'>
          <div className='sales-sheet-list__row sales-sheet-list__row--head'>
            <span>Folio</span>
            <span>Fecha</span>
            <span>Artículos</span>
            <span>Pago</span>
            <span className='sales-sheet-list__col-amount'>Subtotal</span>
            <span className='sales-sheet-list__col-amount'>Total</span>
            <span>Estado</span>
            <span className='sales-sheet-list__col-actions'>Acción</span>
          </div>

          {loading ? (
            <TableSkeleton rowClassName='sales-sheet-list__row' cols={[{ pill: true, width: '84px' }, { width: '70%' }, { width: '50%' }, { width: '60%' }, { width: '60%' }, { width: '60%' }, { pill: true, width: '80px' }, { actions: 1 }]} />
          ) : filteredSales.length === 0 ? (
            <div className='sales-sheet-list__state'>
              <p>{search.trim() ? 'No se encontraron ventas con ese criterio' : 'No hay ventas registradas'}</p>
              <span>Abre la "Ficha de cobro" para registrar una venta.</span>
            </div>
          ) : (
            filteredSales.map((sale) => {
              const when = new Date(sale.createdAt)
              const dateStr = Number.isNaN(when.getTime())
                ? sale.createdAt
                : when.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

              return (
                <div className='sales-sheet-list__row' key={sale.id}>
                  <div className='sales-sheet-list__cell' data-label='Folio'>
                    <span className='sales-sheet-list__tag'>{getFolioLabel(sale)}</span>
                  </div>
                  <div className='sales-sheet-list__cell sales-sheet-list__cell--muted' data-label='Fecha'>{dateStr}</div>
                  <div className='sales-sheet-list__cell' data-label='Artículos'>{(sale.lines ?? []).length} art.</div>
                  <div className='sales-sheet-list__cell sales-sheet-list__cell--muted' data-label='Pago' title={`Cajero: ${getCashierLabel(sale)}`}>
                    {getPaymentLabel(sale)}
                  </div>
                  <div className='sales-sheet-list__cell sales-sheet-list__col-amount' data-label='Subtotal'>{formatMoney(sale.subtotal)}</div>
                  <div className='sales-sheet-list__cell sales-sheet-list__col-amount sales-sheet-list__cell--strong' data-label='Total'>{formatMoney(sale.total)}</div>
                  <div className='sales-sheet-list__cell' data-label='Estado'>
                    <span className={`sales-sheet-list__status ${statusClass(sale)}`}>
                      {sale.source === 'WEB' && sale.customerOrderStatus
                        ? customerOrderStatusLabel[sale.customerOrderStatus] ?? sale.customerOrderStatus
                        : statusLabel[sale.status] ?? sale.status}
                    </span>
                  </div>
                  <div className='sales-sheet-list__cell sales-sheet-list__col-actions'>
                    {sale.source === 'WEB' ? (
                      <button
                        type='button'
                        className='sales-sheet-list__icon-btn'
                        onClick={() => setSelectedWebSale(sale)}
                        title='Gestionar entrega'
                        aria-label='Gestionar entrega'
                      >
                        <span className='material-symbols-rounded'>local_shipping</span>
                      </button>
                    ) : (
                      <span className='sales-sheet-list__none'>—</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
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
