import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DateRangePicker } from 'react-date-range'
import { format, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import '../catalogos/categories/Categories.css'
import './Dashboard.css'
import { useNavigate } from 'react-router-dom'
import { EXPIRATIONS_PATH, useExpirationAlerts } from '../../../../modules/store/lotes-y-series/caducidades/useExpirationAlerts'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import APIs from '../../../../services/APIs'
import { PrivateRoutes } from '../../../../models/routes'
import { readCategoryBranchId } from '../../../../constants/category'
import CategoriesStorePicker from '../catalogos/categories/CategoriesStorePicker'

const LS_COMPANY = 'categories-picker-company-id'

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem(LS_COMPANY))
  return !Number.isNaN(id) && id > 0 ? id : null
}

const formatMoney = (value: number | string) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return '$0.00'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(parsed)
}

const formatRelativeTime = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Hace un momento'
  if (diffMin < 60) return `Hace ${diffMin} minuto${diffMin === 1 ? '' : 's'}`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours === 1 ? '' : 's'}`
  const diffDays = Math.floor(diffHours / 24)
  return `Hace ${diffDays} día${diffDays === 1 ? '' : 's'}`
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}


const statusLabel: Record<string, string> = {
  DRAFT: 'Borrador',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}

const STOCK_COLORS = [
  'var(--chart-blue)',
  'var(--chart-orange)',
  'var(--chart-blue-light)',
  '#7C8798',
  '#A9B7C8',
  '#16A34A',
]

const CHART_GRID = 'var(--border-subtle)'
const CHART_TICK = 'var(--text-secondary)'

/** % de cambio entre los dos últimos valores de una serie (null si no hay con qué comparar). */
const trendOf = (values: number[]): number | null => {
  if (values.length < 2) return null
  const prev = values[values.length - 2]
  const curr = values[values.length - 1]
  if (prev <= 0) return curr > 0 ? 100 : 0
  return ((curr - prev) / prev) * 100
}

const formatTrend = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`

const formatAxis = (value: number) => (Math.abs(value) >= 1000 ? `${Math.round(value / 1000)}k` : String(value))

const TrendPill = ({ value }: { value: number | null }) => {
  if (value == null || !Number.isFinite(value)) return null
  const up = value >= 0
  return (
    <span className={`dx-pill ${up ? 'dx-pill--up' : 'dx-pill--down'}`}>
      <span className="material-symbols-rounded" aria-hidden>{up ? 'arrow_upward' : 'arrow_downward'}</span>
      {formatTrend(value)}
    </span>
  )
}

const Spark = ({ data, color, id }: { data: { value: number }[]; color: string; id: string }) => (
  <div className="dx-kpi__spark" aria-hidden>
    {data.length > 1 && (
      <ResponsiveContainer width="100%" height={44}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.28} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    )}
  </div>
)

const CompareTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="dashboard-tooltip">
      <p className="dashboard-tooltip__label">{label}</p>
      {payload.map((row: any) => (
        <p className="dashboard-tooltip__row" key={row.dataKey}>
          {row.dataKey === 'actual' ? 'Este mes' : 'Mes anterior'}: {formatMoney(row.value)}
        </p>
      ))}
    </div>
  )
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const expiryAlerts = useExpirationAlerts()
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ingresos, setIngresos] = useState(0)
  const [totalVentas, setTotalVentas] = useState(0)
  const [gananciaMensual, setGananciaMensual] = useState(0)
  const [historico, setHistorico] = useState<
    { label: string; ganancia: number; ingresos: number; totalVentas: number }[]
  >([])
  const [stockWarehouses, setStockWarehouses] = useState<
    { name: string; value: number; color: string }[]
  >([])
  const [stockResumen, setStockResumen] = useState({
    totalAlmacenes: 0,
    totalUnidades: 0,
    stockBajo: 0,
    agotados: 0,
  })
  const [operaciones, setOperaciones] = useState({
    cancelaciones: { count: 0, monto: 0 },
    devoluciones: { count: 0, monto: 0 },
  })
  const [notifications, setNotifications] = useState<any[]>([])
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [lastOrders, setLastOrders] = useState<any[]>([])

  const [dateRange, setDateRange] = useState([{
    startDate: startOfMonth(new Date()),
    endDate: new Date(),
    key: 'selection',
  }])
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const dateLabel = useMemo(() => {
    const start = dateRange[0].startDate!
    const end = dateRange[0].endDate!
    const same = format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')
    if (same) {
      const isToday = format(end, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      return `${isToday ? 'Hoy, ' : ''}${format(end, "d 'de' MMMM 'de' yyyy", { locale: es })}`
    }
    return `${format(start, 'd MMM', { locale: es })} — ${format(end, "d MMM yyyy", { locale: es })}`
  }, [dateRange])

  const dateFrom = format(dateRange[0].startDate!, 'yyyy-MM-dd')
  const dateTo   = format(dateRange[0].endDate!,   'yyyy-MM-dd')

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    if (pickerOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [pickerOpen])

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
  }, [])

  const percentChange = useMemo(() => {
    if (historico.length < 2) return null
    const prev = historico[historico.length - 2]?.ingresos ?? 0
    const curr = historico[historico.length - 1]?.ingresos ?? 0
    if (prev <= 0) return curr > 0 ? 100 : 0
    return ((curr - prev) / prev) * 100
  }, [historico])

  const fetchDashboard = useCallback(async () => {
    const companyId = readCompanyId()
    if (!companyId) {
      setError('Selecciona una empresa en el catálogo para ver el dashboard.')
      setIngresos(0)
      setTotalVentas(0)
      setGananciaMensual(0)
      setHistorico([])
      setStockWarehouses([])
      setOperaciones({
        cancelaciones: { count: 0, monto: 0 },
        devoluciones: { count: 0, monto: 0 },
      })
      setNotifications([])
      setRecentSales([])
      setLastOrders([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const branchFilter = branchId > 0 ? branchId : undefined

      const [summaryRes, gananciaRes, salesRes]: any[] = await Promise.all([
        APIs.getDashboard({ companyId, branchId: branchFilter }),
        APIs.getDashboardGanancia({ companyId, branchId: branchFilter }),
        // Solo se muestran las últimas 10: no se descargan todas las ventas
        APIs.getSales({ companyId, branchId: branchFilter, limit: 10 }),
      ])

      const summary = summaryRes?.data ?? {}
      setIngresos(Number(summary.ingresos) || 0)
      setTotalVentas(Number(summary.totalVentas) || 0)
      setGananciaMensual(Number(summary.gananciaMensual) || 0)

      const hist = Array.isArray(gananciaRes?.data?.historico)
        ? gananciaRes.data.historico
        : []
      setHistorico(
        hist.map((row: any) => ({
          label: row.label ?? `${row.month}/${row.year}`,
          ganancia: Number(row.ganancia) || 0,
          ingresos: Number(row.ingresos) || 0,
          totalVentas: Number(row.totalVentas) || 0,
        })),
      )

      const stock = summary.stock ?? {}
      const almacenes = Array.isArray(stock.almacenes) ? stock.almacenes : []
      setStockResumen({
        totalAlmacenes: Number(stock.resumen?.totalAlmacenes) || almacenes.length,
        totalUnidades: Number(stock.resumen?.totalUnidades) || 0,
        stockBajo: Number(stock.resumen?.stockBajo) || 0,
        agotados: Number(stock.resumen?.agotados) || 0,
      })

      setOperaciones({
        cancelaciones: {
          count: Number(summary.operaciones?.cancelaciones?.count) || 0,
          monto: Number(summary.operaciones?.cancelaciones?.monto) || 0,
        },
        devoluciones: {
          count: Number(summary.operaciones?.devoluciones?.count) || 0,
          monto: Number(summary.operaciones?.devoluciones?.monto) || 0,
        },
      })

      setNotifications(Array.isArray(summary.notifications) ? summary.notifications : [])

      setStockWarehouses(
        almacenes.map((row: any, index: number) => ({
          name: row.storeName ?? `Almacén ${row.storeId}`,
          value: Number(row.totalUnidades) || 0,
          color: STOCK_COLORS[index % STOCK_COLORS.length],
        })),
      )

      const sales = Array.isArray(salesRes?.data) ? salesRes.data : []

      setRecentSales(
        sales.slice(0, 6).map((sale: any) => {
          const customer = sale.customer
          const name = customer
            ? `${customer.firstName ?? ''} ${customer.lastLastName ?? ''}`.trim() ||
              customer.businessName ||
              'Cliente'
            : sale.createdBy
              ? `${sale.createdBy.firstName ?? ''} ${sale.createdBy.firstLastName ?? ''}`.trim()
              : 'Venta mostrador'

          const isCancelled = sale.status === 'CANCELLED'
          const isRefund = false

          return {
            id: sale.id,
            name,
            time: formatRelativeTime(sale.completedAt ?? sale.updatedAt ?? sale.createdAt),
            amount: Number(sale.total) || 0,
            status: statusLabel[sale.status] ?? sale.status,
            isNegative: isCancelled || isRefund,
          }
        }),
      )

      setLastOrders(
        sales.slice(0, 10).map((sale: any) => {
          const customer = sale.customer
          const name = customer
            ? `${customer.firstName ?? ''} ${customer.lastLastName ?? ''}`.trim() ||
              customer.businessName ||
              'Cliente'
            : 'Mostrador'

          return {
            id: sale.id,
            name,
            amount: Number(sale.total) || 0,
            status: statusLabel[sale.status] ?? sale.status,
            date: formatDate(sale.completedAt ?? sale.updatedAt ?? sale.createdAt),
            folio: `${sale.series?.name ?? 'VENT'}-${sale.folio ?? sale.id}`,
          }
        }),
      )
    } catch (err) {
      console.error('Error al cargar dashboard:', err)
      setError('No se pudo cargar el dashboard. Verifica que el backend esté activo.')
    } finally {
      setLoading(false)
    }
  }, [branchId, dateFrom, dateTo])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const areaData = useMemo(
    () =>
      historico.map((row) => ({
        name: row.label,
        value: row.ingresos,
      })),
    [historico],
  )

  const gananciaTrend = useMemo(() => trendOf(historico.map((row) => row.ganancia)), [historico])
  const ventasTrend = useMemo(() => trendOf(historico.map((row) => row.totalVentas)), [historico])
  const gananciaSpark = useMemo(() => historico.map((row) => ({ value: row.ganancia })), [historico])
  const ventasSpark = useMemo(() => historico.map((row) => ({ value: row.totalVentas })), [historico])

  // Ingresos de cada mes contra los del mes anterior (el último mes, el actual, va resaltado)
  const compareData = useMemo(
    () =>
      historico.map((row, index) => ({
        name: row.label,
        actual: row.ingresos,
        anterior: index > 0 ? historico[index - 1].ingresos : undefined,
      })),
    [historico],
  )

  const totalStockUnits = stockWarehouses.reduce((acc, row) => acc + row.value, 0)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SALE_CANCELLED':
      case 'PRODUCTION_CANCELLED':
        return 'cancel'
      case 'REFUND':
        return 'undo'
      case 'STOCK_OUT':
        return 'inventory_2'
      case 'STOCK_LOW':
        return 'warning'
      case 'PRODUCTION_OVERDUE':
        return 'schedule'
      case 'PRODUCTION_URGENT':
        return 'priority_high'
      default:
        return 'notifications'
    }
  }

  const unreadCount = notifications.length

  /** Las alertas de stock llevan al inventario; el resto no tiene pantalla propia. */
  const notificationPath = (type: string) =>
    type === 'STOCK_LOW' || type === 'STOCK_OUT' ? `/${PrivateRoutes.PRIVATE}/store/inventory` : null

  const notificationTone = (type: string, severity?: string) => {
    if (type === 'SALE_CANCELLED' || type === 'PRODUCTION_CANCELLED' || type === 'STOCK_OUT' || severity === 'high') return 'danger'
    if (type === 'STOCK_LOW' || type === 'PRODUCTION_OVERDUE' || type === 'PRODUCTION_URGENT' || severity === 'medium') return 'warning'
    return 'info'
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Completada':
        return 'dashboard-status dashboard-status--ok'
      case 'Borrador':
        return 'dashboard-status dashboard-status--draft'
      case 'Cancelada':
        return 'dashboard-status dashboard-status--cancel'
      default:
        return 'dashboard-status'
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard__container">
        <header className="dashboard__hero dx-topbar">
          {expiryAlerts && (expiryAlerts.expired.lots > 0 || expiryAlerts.critical.lots > 0) && (
            <button type="button" className="dashboard-expiry-alert" onClick={() => navigate(EXPIRATIONS_PATH)}>
              <span className="material-symbols-rounded" aria-hidden>deployed_code</span>
              <span className="dashboard-expiry-alert__text">
                {expiryAlerts.expired.lots > 0 && (
                  <strong>{expiryAlerts.expired.lots} lote(s) vencido(s) con existencia — dalos de baja para no venderlos.</strong>
                )}
                {expiryAlerts.critical.lots > 0 && <span>{expiryAlerts.critical.lots} lote(s) vencen en los próximos 7 días.</span>}
              </span>
              <span className="dashboard-expiry-alert__cta">Ver caducidades<span className="material-symbols-rounded" aria-hidden>chevron_right</span></span>
            </button>
          )}
          <div className="dashboard-date-range" ref={pickerRef}>
            <button
              type="button"
              className="dashboard-date-range__trigger"
              aria-label="Seleccionar período"
              onClick={() => setPickerOpen(p => !p)}
            >
              <span className="material-symbols-rounded dashboard-date-range__icon">calendar_month</span>
              <span className="dashboard-date-range__value">{dateLabel}</span>
              <span className="material-symbols-rounded dashboard-date-range__caret">
                {pickerOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {pickerOpen && (
              <div className="dashboard-date-range__popup">
                <DateRangePicker
                  ranges={dateRange}
                  onChange={(item: any) => setDateRange([item.selection])}
                  locale={es}
                  maxDate={new Date()}
                  rangeColors={['#072a57']}
                  showMonthAndYearPickers
                  months={isMobile ? 1 : 2}
                  direction={isMobile ? 'vertical' : 'horizontal'}
                  moveRangeOnFirstSelection={false}
                  showDateDisplay={false}
                />
                <div className="dashboard-date-range__popup-footer">
                  <button
                    type="button"
                    className="dashboard-date-range__apply"
                    onClick={() => { setPickerOpen(false); fetchDashboard() }}
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="dashboard__hero-actions">
            <div className="dashboard__hero-divider" aria-hidden />
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={persistBranchId}
              onCompanyIdChange={() => fetchDashboard()}
            />
          </div>
        </header>

        {error && <p className="dashboard__error">{error}</p>}

        <div className={`dashboard__content ${loading ? 'dashboard__content--loading' : ''}`}>
          <section className="dx-kpis" aria-label="Indicadores principales">
            <article className="dx-card dx-kpi">
              <div className="dx-kpi__head">
                <span className="dx-icon dx-icon--blue"><span className="material-symbols-rounded">payments</span></span>
                <span className="dx-kpi__label">Ingresos del mes</span>
              </div>
              <strong className="dx-kpi__value">{formatMoney(ingresos)}</strong>
              <div className="dx-kpi__foot">
                <TrendPill value={percentChange} />
                <Spark data={areaData} color="var(--chart-blue-light)" id="dxIngresos" />
              </div>
            </article>

            <article className="dx-card dx-kpi">
              <div className="dx-kpi__head">
                <span className="dx-icon dx-icon--orange"><span className="material-symbols-rounded">trending_up</span></span>
                <span className="dx-kpi__label">Ganancia mensual</span>
              </div>
              <strong className="dx-kpi__value">{formatMoney(gananciaMensual)}</strong>
              <div className="dx-kpi__foot">
                <TrendPill value={gananciaTrend} />
                <Spark data={gananciaSpark} color="var(--chart-orange)" id="dxGanancia" />
              </div>
            </article>

            <article className="dx-card dx-kpi">
              <div className="dx-kpi__head">
                <span className="dx-icon dx-icon--blue"><span className="material-symbols-rounded">shopping_cart</span></span>
                <span className="dx-kpi__label">Ventas completadas</span>
              </div>
              <strong className="dx-kpi__value">{totalVentas.toLocaleString('es-MX')}</strong>
              <div className="dx-kpi__foot">
                <TrendPill value={ventasTrend} />
                <Spark data={ventasSpark} color="var(--chart-blue-light)" id="dxVentas" />
              </div>
              <small className="dx-kpi__hint">
                {operaciones.cancelaciones.count} cancelaciones · {operaciones.devoluciones.count} devoluciones
              </small>
            </article>

            <article className="dx-card dx-kpi">
              <div className="dx-kpi__head">
                <span className="dx-icon dx-icon--orange"><span className="material-symbols-rounded">inventory_2</span></span>
                <span className="dx-kpi__label">Inventario (unidades)</span>
              </div>
              <strong className="dx-kpi__value">{stockResumen.totalUnidades.toLocaleString('es-MX')} u.</strong>
              <div className="dx-kpi__foot">
                {stockResumen.stockBajo + stockResumen.agotados > 0 ? (
                  <span className="dx-pill dx-pill--down">
                    <span className="material-symbols-rounded" aria-hidden>warning</span>
                    {stockResumen.stockBajo + stockResumen.agotados} por atender
                  </span>
                ) : (
                  <span className="dx-pill dx-pill--up">
                    <span className="material-symbols-rounded" aria-hidden>check</span>
                    Saludable
                  </span>
                )}
              </div>
              <small className="dx-kpi__hint">
                {stockResumen.totalAlmacenes} {stockResumen.totalAlmacenes === 1 ? 'almacén' : 'almacenes'}
              </small>
            </article>
          </section>

          <section className="dx-grid">
            <article className="dx-card dx-card--chart">
              <header className="dx-card__head">
                <h3><span className="material-symbols-rounded" aria-hidden>bar_chart</span>Ventas vs. último mes</h3>
                <span className="dx-chip">Últimos {historico.length || 6} meses</span>
              </header>
              <div className="dx-legend">
                <span><i className="dx-legend__dot dx-legend__dot--blue" />Este mes</span>
                <span><i className="dx-legend__dot dx-legend__dot--gray" />Mes anterior</span>
              </div>
              {compareData.length === 0 ? (
                <p className="dashboard-panel__empty">Sin datos para mostrar</p>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={compareData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={4} barCategoryGap="22%">
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke={CHART_GRID} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: CHART_TICK, fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} width={44} tick={{ fill: CHART_TICK, fontSize: 12 }} tickFormatter={formatAxis} />
                    <Tooltip content={<CompareTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="anterior" fill="var(--chart-gray)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="actual" fill="var(--chart-blue)" radius={[4, 4, 0, 0]} maxBarSize={22}>
                      {compareData.map((_, index) => (
                        <Cell key={index} fill={index === compareData.length - 1 ? 'var(--chart-orange)' : 'var(--chart-blue)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </article>

            <article className="dx-card">
              <header className="dx-card__head">
                <h3><span className="material-symbols-rounded" aria-hidden>deployed_code</span>Estado del inventario</h3>
              </header>
              {stockWarehouses.length === 0 ? (
                <p className="dashboard-panel__empty">Sin existencias registradas</p>
              ) : (
                <>
                  <div className="dx-donut">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={stockWarehouses} cx="50%" cy="50%" innerRadius={52} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                          {stockWarehouses.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toLocaleString('es-MX')} u.`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="dx-donut__center">
                      <strong>{totalStockUnits.toLocaleString('es-MX')}</strong>
                      <span>unidades</span>
                    </div>
                  </div>
                  <ul className="dx-stock-list">
                    {stockWarehouses.map((entry, index) => {
                      const pct = totalStockUnits > 0 ? ((entry.value / totalStockUnits) * 100).toFixed(0) : '0'
                      return (
                        <li key={`legend-${index}`}>
                          <i className="dx-legend__dot" style={{ backgroundColor: entry.color }} />
                          <span className="dx-stock-list__name">{entry.name}</span>
                          <strong>{entry.value.toLocaleString('es-MX')} u.</strong>
                          <small>{pct}%</small>
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}
              {(stockResumen.stockBajo > 0 || stockResumen.agotados > 0) && (
                <div className="dx-stock-flags">
                  {stockResumen.stockBajo > 0 && <span className="dx-flag dx-flag--warning">Bajo stock: {stockResumen.stockBajo}</span>}
                  {stockResumen.agotados > 0 && <span className="dx-flag dx-flag--danger">Agotados: {stockResumen.agotados}</span>}
                </div>
              )}
            </article>

            <article className="dx-card">
              <header className="dx-card__head">
                <h3><span className="material-symbols-rounded" aria-hidden>notifications</span>Alertas recientes</h3>
                {unreadCount > 0 && <span className="dx-count">{unreadCount}</span>}
              </header>
              {notifications.length === 0 ? (
                <p className="dashboard-panel__empty">No hay cancelaciones, devoluciones ni alertas de stock en este periodo.</p>
              ) : (
                <ul className="dx-alerts">
                  {notifications.map((item) => {
                    const path = notificationPath(item.type)
                    const tone = notificationTone(item.type, item.severity)
                    const body = (
                      <>
                        <span className={`dx-alert__icon dx-alert__icon--${tone}`}>
                          <span className="material-symbols-rounded" aria-hidden>{tone === 'info' ? 'info' : getNotificationIcon(item.type)}</span>
                        </span>
                        <span className="dx-alert__text">
                          <strong>{item.title}</strong>
                          <small>{item.message ? `${item.message} · ` : ''}{formatRelativeTime(item.createdAt)}</small>
                        </span>
                        {path && <span className="material-symbols-rounded dx-alert__chev" aria-hidden>chevron_right</span>}
                      </>
                    )
                    return (
                      <li key={item.id}>
                        {path ? (
                          <button type="button" className="dx-alert" onClick={() => navigate(path)}>{body}</button>
                        ) : (
                          <div className="dx-alert">{body}</div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </article>
          </section>

          <section className="dashboard__bottom">
            <article className="dashboard-panel dashboard-panel--recent">
              <div className="dashboard-panel__head">
                <div>
                  <span className="dashboard-panel__eyebrow">Actividad</span>
                  <h3>Ventas recientes</h3>
                </div>
              </div>
              <div className="dashboard-recent">
                {recentSales.length === 0 ? (
                  <p className="dashboard-panel__empty">No hay ventas recientes</p>
                ) : (
                  recentSales.map((sale) => (
                    <div className="dashboard-recent__row" key={sale.id}>
                      <div className="dashboard-recent__user">
                        <div className="dashboard-recent__avatar">
                          {sale.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="dashboard-recent__name">{sale.name}</div>
                          <div className="dashboard-recent__time">{sale.time}</div>
                        </div>
                      </div>
                      <div className="dashboard-recent__right">
                        <div className={`dashboard-recent__amount ${sale.isNegative ? 'dashboard-recent__amount--negative' : ''}`}>
                          {sale.isNegative ? '− ' : '+ '}{formatMoney(sale.amount)}
                        </div>
                        <div className="dashboard-recent__sale-status">{sale.status}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="dashboard-panel dashboard-panel--orders">
              <div className="dashboard-panel__head">
                <div>
                  <span className="dashboard-panel__eyebrow">Detalle</span>
                  <h3>Últimas ventas</h3>
                </div>
              </div>
              {lastOrders.length === 0 ? (
                <p className="dashboard-panel__empty">No hay ventas que mostrar</p>
              ) : (
                <div className="dashboard-orders">
                  <div className="dashboard-orders__head">
                    <span>Folio</span>
                    <span>Cliente</span>
                    <span>Monto</span>
                    <span>Estado</span>
                    <span>Fecha</span>
                  </div>
                  <div className="dashboard-orders__body">
                    {lastOrders.map((item) => (
                      <div className="dashboard-orders__row" key={item.id}>
                        <span className="dashboard-orders__folio">{item.folio}</span>
                        <span className="dashboard-orders__client">{item.name}</span>
                        <span className="dashboard-orders__amount">{formatMoney(item.amount)}</span>
                        <span>
                          <span className={getStatusClass(item.status)}>{item.status}</span>
                        </span>
                        <span className="dashboard-orders__date">{item.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
