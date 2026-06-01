import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DateRangePicker } from 'react-date-range'
import { format, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import '../categories/Categories.css'
import './Dashboard.css'
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
import { readCategoryBranchId } from '../../../../constants/category'
import CategoriesStorePicker from '../categories/CategoriesStorePicker'

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

const STOCK_COLORS = ['#3F7DC0', '#14b8a6', '#F2A541', '#4CAF50', '#ba1a1a', '#9575cd']

const MOCK_PROJECTS: { name: string; pct: number; accent: 'orange' | 'blue' }[] = [
  { name: 'Auditoría de inventario', pct: 75, accent: 'orange' },
  { name: 'Expansión de ventas', pct: 32, accent: 'blue' },
  { name: 'Migración de plataforma', pct: 92, accent: 'orange' },
  { name: 'Análisis de clientes UX', pct: 48, accent: 'blue' },
  { name: 'Cumplimiento de normas', pct: 15, accent: 'blue' },
]

const CHART_GRID = 'rgba(0, 0, 0, 0.06)'
const CHART_TICK = '#8b919c'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const raw = payload[0].value
    const isCount = payload[0].dataKey === 'ventas'
    return (
      <div className="dashboard-tooltip">
        <p className="dashboard-tooltip__label">
          {label}: {isCount ? raw : formatMoney(raw)}
        </p>
      </div>
    )
  }
  return null
}

const Dashboard: React.FC = () => {
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

  const formatPercent = (value: number | null) => {
    if (value == null || !Number.isFinite(value)) return ''
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(0)}%`
  }

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
        APIs.getSales({ companyId, branchId: branchFilter }),
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

  const salesChartData = useMemo(
    () =>
      historico.map((row) => ({
        name: row.label,
        ventas: row.totalVentas,
        ganancia: row.ganancia,
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

  const getNotificationSeverityClass = (severity: string) =>
    `dashboard-notify__item dashboard-notify__item--${severity ?? 'low'}`

  return (
    <div className="dashboard">
      <div className="dashboard__container">
        <header className="dashboard__hero">
          <div className="dashboard-date-range" ref={pickerRef}>
            <button
              type="button"
              className="dashboard-date-range__trigger"
              onClick={() => setPickerOpen(p => !p)}
            >
              <span className="material-symbols-rounded dashboard-date-range__icon">calendar_month</span>
              <div className="dashboard-date-range__display">
                <span className="dashboard-date-range__label">Período</span>
                <span className="dashboard-date-range__value">
                  {format(dateRange[0].startDate!, 'dd MMM yyyy', { locale: es })}
                  {' — '}
                  {format(dateRange[0].endDate!, 'dd MMM yyyy', { locale: es })}
                </span>
              </div>
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
                  rangeColors={['#3F7DC0']}
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
          <section className="dashboard__summary">
            <article className="dashboard-kpi dashboard-kpi--income">
              <div className="dashboard-kpi__top">
                <div className="dashboard-kpi__icon-wrap">
                  <span className="material-symbols-rounded">payments</span>
                </div>
                {percentChange != null && (
                  <small className={`dashboard-kpi__trend ${percentChange >= 0 ? 'dashboard-kpi__trend--up' : 'dashboard-kpi__trend--down'}`}>
                    <span className="material-symbols-rounded">
                      {percentChange >= 0 ? 'trending_up' : 'trending_down'}
                    </span>
                    {formatPercent(percentChange)}
                  </small>
                )}
              </div>
              <span className="dashboard-kpi__label">Ingresos del mes</span>
              <strong className="dashboard-kpi__value">{formatMoney(ingresos)}</strong>
              <div className="dashboard-kpi__spark">
                {areaData.length > 0 && (
                  <ResponsiveContainer width="100%" height={48}>
                    <AreaChart data={areaData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dashIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="rgb(63,125,192)" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="rgb(63,125,192)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="rgb(63,125,192)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#dashIncome)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>

            <article className="dashboard-kpi dashboard-kpi--sales">
              <div className="dashboard-kpi__top">
                <div className="dashboard-kpi__icon-wrap">
                  <span className="material-symbols-rounded">shopping_cart</span>
                </div>
              </div>
              <span className="dashboard-kpi__label">Ventas completadas</span>
              <strong className="dashboard-kpi__value">{totalVentas}</strong>
              <small className="dashboard-kpi__hint">Tickets del periodo</small>
            </article>

            <article className="dashboard-kpi dashboard-kpi--profit">
              <div className="dashboard-kpi__top">
                <div className="dashboard-kpi__icon-wrap">
                  <span className="material-symbols-rounded">trending_up</span>
                </div>
              </div>
              <span className="dashboard-kpi__label">Ganancia mensual</span>
              <strong className="dashboard-kpi__value">{formatMoney(gananciaMensual)}</strong>
              <small className="dashboard-kpi__hint">Venta neta sin IVA</small>
            </article>

            <article className="dashboard-kpi dashboard-kpi--stock">
              <div className="dashboard-kpi__top">
                <div className="dashboard-kpi__icon-wrap">
                  <span className="material-symbols-rounded">inventory_2</span>
                </div>
                {stockResumen.stockBajo === 0 && stockResumen.agotados === 0 && (
                  <span className="dashboard-kpi__badge">Healthy</span>
                )}
              </div>
              <span className="dashboard-kpi__label">Inventario</span>
              <strong className="dashboard-kpi__value">
                {stockResumen.totalUnidades.toLocaleString('es-MX')} u.
              </strong>
              <div className="dashboard-kpi__badges">
                {stockResumen.stockBajo > 0 && (
                  <span className="dashboard-badge dashboard-badge--low">
                    Bajo: {stockResumen.stockBajo}
                  </span>
                )}
                {stockResumen.agotados > 0 && (
                  <span className="dashboard-badge dashboard-badge--out">
                    Agotados: {stockResumen.agotados}
                  </span>
                )}
              </div>
            </article>

            <article className="dashboard-kpi dashboard-kpi--cancel">
              <div className="dashboard-kpi__top">
                <div className="dashboard-kpi__icon-wrap">
                  <span className="material-symbols-rounded">cancel</span>
                </div>
                {operaciones.cancelaciones.count > 0 && (
                  <small className="dashboard-kpi__trend dashboard-kpi__trend--down">
                    <span className="material-symbols-rounded">trending_down</span>
                    -{((operaciones.cancelaciones.count / (totalVentas || 1)) * 100).toFixed(1)}%
                  </small>
                )}
              </div>
              <span className="dashboard-kpi__label">Cancelaciones</span>
              <strong className="dashboard-kpi__value">
                {operaciones.cancelaciones.count} órdenes
              </strong>
              <small className="dashboard-kpi__hint">
                {formatMoney(operaciones.cancelaciones.monto)} del mes
              </small>
            </article>

            <article className="dashboard-kpi dashboard-kpi--refund">
              <div className="dashboard-kpi__top">
                <div className="dashboard-kpi__icon-wrap">
                  <span className="material-symbols-rounded">undo</span>
                </div>
                <span className="dashboard-kpi__badge">
                  {((operaciones.devoluciones.count / (totalVentas || 1)) * 100).toFixed(1)}% tasa
                </span>
              </div>
              <span className="dashboard-kpi__label">Devoluciones</span>
              <strong className="dashboard-kpi__value">
                {operaciones.devoluciones.count} items
              </strong>
              <small className="dashboard-kpi__hint">
                {formatMoney(operaciones.devoluciones.monto)} del mes
              </small>
            </article>
          </section>

          <section className="dashboard-panel dashboard-panel--notifications">
            <div className="dashboard-panel__head">
              <div>
                <span className="dashboard-panel__eyebrow">Alertas</span>
                <h3>Notificaciones importantes</h3>
              </div>
              <span className="dashboard-panel__meta">
                {unreadCount > 0 ? `${unreadCount} pendientes` : 'Sin alertas activas'}
              </span>
            </div>
            <div className="dashboard-notify">
              {notifications.length === 0 ? (
                <p className="dashboard-panel__empty">
                  No hay cancelaciones, devoluciones ni alertas de stock en este periodo.
                </p>
              ) : (
                notifications.map((item) => (
                  <article
                    key={item.id}
                    className={getNotificationSeverityClass(item.severity)}
                  >
                    <span className="material-symbols-rounded dashboard-notify__icon" aria-hidden>
                      {getNotificationIcon(item.type)}
                    </span>
                    <div className="dashboard-notify__body">
                      <strong>{item.title}</strong>
                      <p>{item.message}</p>
                      <small>{formatRelativeTime(item.createdAt)}</small>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="dashboard__charts">
            <article className="dashboard-panel dashboard-panel--wide">
              <div className="dashboard-panel__head">
                <div>
                  <span className="dashboard-panel__eyebrow">Histórico</span>
                  <h3>Ventas por mes</h3>
                </div>
                <span className="dashboard-panel__meta">
                  Últimos {historico.length || 6} meses
                </span>
              </div>
              <div className="dashboard-panel__chart">
                {salesChartData.length === 0 ? (
                  <p className="dashboard-panel__empty">Sin datos para mostrar</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={salesChartData}
                      margin={{ top: 12, right: 8, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: CHART_TICK, fontSize: 12 }}
                      />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="ventas" fill="#bf6903" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>

            <article className="dashboard-panel">
              <div className="dashboard-panel__head">
                <div>
                  <span className="dashboard-panel__eyebrow">Proyectos</span>
                  <h3>Proyectos activos</h3>
                </div>
                <button type="button" className="dashboard-panel__viewall">Ver todos</button>
              </div>
              <div className="dashboard-progress__list">
                {MOCK_PROJECTS.map((proj) => (
                  <div className="dashboard-progress__item" key={proj.name}>
                    <div className="dashboard-progress__item-head">
                      <span className="dashboard-progress__name">{proj.name}</span>
                      <span className="dashboard-progress__pct">{proj.pct}%</span>
                    </div>
                    <div className="dashboard-progress__track">
                      <div
                        className={`dashboard-progress__fill dashboard-progress__fill--${proj.accent}`}
                        style={{ width: `${proj.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {stockWarehouses.length > 0 && (
            <section className="dashboard-panel dashboard-panel--stock">
              <div className="dashboard-panel__head">
                <div>
                  <span className="dashboard-panel__eyebrow">Almacenes</span>
                  <h3>Distribución de stock</h3>
                </div>
                <span className="dashboard-panel__meta">
                  {totalStockUnits.toLocaleString('es-MX')} unidades totales
                </span>
              </div>
              <div className="dashboard-stock-donut">
                <div className="dashboard-stock-donut__chart">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={stockWarehouses}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stockWarehouses.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => `${value} u.`}
                        contentStyle={{
                          background: '#1f2228',
                          border: '1px solid rgba(88, 106, 233, 0.25)',
                          borderRadius: 8,
                          color: '#f5f6f7',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="dashboard-stock-donut__center">
                    <strong>{totalStockUnits.toLocaleString('es-MX')}</strong>
                    <span>unidades</span>
                  </div>
                </div>
                <div className="dashboard-stock-legend">
                  {stockWarehouses.map((entry, index) => {
                    const pct =
                      totalStockUnits > 0
                        ? ((entry.value / totalStockUnits) * 100).toFixed(0)
                        : '0'
                    return (
                      <div className="dashboard-stock-legend__item" key={`legend-${index}`}>
                        <span
                          className="dashboard-stock-legend__dot"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="dashboard-stock-legend__name">{entry.name}</span>
                        <span className="dashboard-stock-legend__value">
                          {entry.value.toLocaleString('es-MX')} u. · {pct}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

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
