import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import APIs from '../../../services/APIs'
import { useCan } from '../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../constants/category'
import CategoriesStorePicker from '../../../components/sidebar/sections/catalogos/categories/CategoriesStorePicker'
import DateField from '../../../components/general/date-field/DateField'
import TableSkeleton from '../../../components/general/skeleton/TableSkeleton'
import Pagination from '../../../components/general/pagination/Pagination'
import '../../../components/general/skeleton/TableSkeleton.css'
import { cachedRequest } from '../../../services/requestCache'
import './SalesReport.css'

const PAGE_SIZE = 25
// Primario y secundario de la app primero (variables del tema), luego colores de apoyo
const COLORS = ['var(--primary-color, #072a57)', 'var(--secondary-color, #fc7400)', '#22a06b', '#06b6d4', '#a855f7', '#64748b', '#ef4444', '#ec4899']

type Status = 'COMPLETED' | 'CANCELLED' | 'ALL'

const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const money = (n: number) => Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })
const qty = (n: number) => Number(n || 0).toLocaleString('es-MX', { maximumFractionDigits: 2 })
const dateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

/** Atajos de rango (hora local). */
const RANGES: { key: string; label: string; get: () => [string, string] }[] = [
  { key: 'today', label: 'Hoy', get: () => [ymd(new Date()), ymd(new Date())] },
  {
    key: 'week',
    label: 'Esta semana',
    get: () => {
      const d = new Date()
      const monday = new Date(d)
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      return [ymd(monday), ymd(d)]
    },
  },
  { key: 'month', label: 'Este mes', get: () => { const d = new Date(); return [ymd(new Date(d.getFullYear(), d.getMonth(), 1)), ymd(d)] } },
  {
    key: 'prev',
    label: 'Mes anterior',
    get: () => {
      const d = new Date()
      return [ymd(new Date(d.getFullYear(), d.getMonth() - 1, 1)), ymd(new Date(d.getFullYear(), d.getMonth(), 0))]
    },
  },
  { key: 'year', label: 'Este año', get: () => { const d = new Date(); return [ymd(new Date(d.getFullYear(), 0, 1)), ymd(d)] } },
]

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem('categories-picker-company-id'))
  return !Number.isNaN(id) && id > 0 ? id : null
}

const errorText = (error: any, fallback: string) => {
  const message = error?.response?.data?.message
  return (Array.isArray(message) ? message.join(', ') : message) || fallback
}

const STATUS_LABEL: Record<string, string> = { COMPLETED: 'Completada', CANCELLED: 'Cancelada', DRAFT: 'Borrador' }

/** CSV con BOM para que Excel respete acentos. */
const downloadCsv = (fileName: string, header: string[], rows: (string | number)[][]) => {
  const esc = (v: string | number) => {
    const s = String(v ?? '')
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = '﻿' + [header, ...rows].map((r) => r.map(esc).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

/** Lista con barras proporcionales (top artículos, categorías, sucursales, vendedores). */
const BarList: React.FC<{ rows: { name: string; total: number; hint?: string }[]; empty: string }> = ({ rows, empty }) => {
  const max = Math.max(...rows.map((r) => r.total), 0)
  if (!rows.length) return <p className='sales-report__empty-small'>{empty}</p>
  return (
    <ul className='sales-report__barlist'>
      {rows.map((r, i) => (
        <li key={`${r.name}-${i}`}>
          <div className='sales-report__barlist-head'>
            <span className='sales-report__barlist-name' title={r.name}>{r.name}</span>
            <strong>{money(r.total)}</strong>
          </div>
          <div className='sales-report__barlist-track'>
            <span style={{ width: `${max > 0 ? Math.max(2, (r.total / max) * 100) : 0}%` }} />
          </div>
          {r.hint ? <small>{r.hint}</small> : null}
        </li>
      ))}
    </ul>
  )
}

/** Reporte de ventas: indicadores, gráficas y detalle con filtros por fecha, sucursal, vendedor, método de pago y estado. */
const SalesReport: React.FC = () => {
  const can = useCan()
  const allowed = can('reports.ventas.view')
  const userState = useSelector((state: any) => state.user)

  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [range, setRange] = useState<[string, string]>(() => RANGES[2].get())
  const [rangeKey, setRangeKey] = useState('month')
  const [status, setStatus] = useState<Status>('COMPLETED')
  const [userId, setUserId] = useState(0)
  const [paymentMethodId, setPaymentMethodId] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState<{ by: string; dir: 'asc' | 'desc' }>({ by: 'date', dir: 'desc' })
  const [page, setPage] = useState(1)

  const [summary, setSummary] = useState<any>(null)
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingList, setLoadingList] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  // Opciones de vendedor y método de pago: salen del resumen sin filtrarlo por ellos mismos
  const [sellers, setSellers] = useState<{ id: number; name: string }[]>([])
  const [methods, setMethods] = useState<{ id: number; name: string }[]>([])
  const summaryReq = useRef(0)
  const listReq = useRef(0)

  const resolvedCompanyId = companyId ?? readCompanyId() ?? userState?.activeCompanyId ?? userState?.companyId ?? userState?.companyIds?.[0] ?? null

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const baseParams = useMemo(
    () => ({
      companyId: resolvedCompanyId ?? undefined,
      branchId: branchId > 0 ? branchId : undefined,
      from: range[0],
      to: range[1],
      status,
      userId: userId || undefined,
      paymentMethodId: paymentMethodId || undefined,
    }),
    [resolvedCompanyId, branchId, range, status, userId, paymentMethodId],
  )

  useEffect(() => setPage(1), [baseParams, debouncedSearch, sort])

  const loadSummary = useCallback(async () => {
    if (!resolvedCompanyId || !allowed) return
    const id = ++summaryReq.current
    setLoadingSummary(true)
    setError('')
    try {
      const res: any = await APIs.getSalesReportSummary(baseParams)
      if (id !== summaryReq.current) return
      const data = res?.data ?? null
      setSummary(data)
      if (!userId) setSellers((data?.bySeller ?? []).map((s: any) => ({ id: s.id, name: s.name })))
      if (!paymentMethodId) setMethods((data?.byPaymentMethod ?? []).map((m: any) => ({ id: m.id, name: m.name })))
    } catch (e) {
      if (id !== summaryReq.current) return
      setSummary(null)
      setError(errorText(e, 'No se pudo cargar el reporte de ventas.'))
    } finally {
      if (id === summaryReq.current) setLoadingSummary(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseParams, allowed, resolvedCompanyId])

  const loadList = useCallback(async () => {
    if (!resolvedCompanyId || !allowed) return
    const id = ++listReq.current
    setLoadingList(true)
    try {
      const res: any = await APIs.getSalesReportList({ ...baseParams, search: debouncedSearch, page, pageSize: PAGE_SIZE, sort: sort.by, dir: sort.dir })
      if (id !== listReq.current) return
      setRows(res?.data ?? [])
      setTotal(res?.pagination?.total ?? 0)
    } catch (e) {
      if (id !== listReq.current) return
      setRows([])
      setTotal(0)
      setError(errorText(e, 'No se pudo cargar el detalle de ventas.'))
    } finally {
      if (id === listReq.current) setLoadingList(false)
    }
  }, [baseParams, debouncedSearch, page, sort, allowed, resolvedCompanyId])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])
  useEffect(() => {
    loadList()
  }, [loadList])

  const toggleSort = (by: string) =>
    setSort((prev) => (prev.by === by ? { by, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { by, dir: by === 'customer' || by === 'folio' ? 'asc' : 'desc' }))

  const exportCsv = async () => {
    if (!resolvedCompanyId) return
    setExporting(true)
    try {
      const res: any = await APIs.getSalesReportList({ ...baseParams, search: debouncedSearch, page: 1, pageSize: 5000, sort: sort.by, dir: sort.dir })
      const list: any[] = res?.data ?? []
      downloadCsv(
        `reporte-ventas_${range[0]}_${range[1]}.csv`,
        ['Folio', 'Fecha', 'Estado', 'Cliente', 'Vendedor', 'Sucursal', 'Unidades', 'Subtotal', 'Descuento', 'Impuestos', 'Total', 'Devuelto', 'Formas de pago'],
        list.map((r) => [
          `${r.serie ? `${r.serie}-` : ''}${r.folio ?? r.id}`,
          dateTime(r.date),
          STATUS_LABEL[r.status] ?? r.status,
          r.customer,
          r.seller ?? '',
          r.branch ?? '',
          r.units,
          r.subtotal,
          r.discount,
          r.tax,
          r.total,
          r.returned,
          r.paymentMethods ?? '',
        ]),
      )
    } catch (e) {
      setError(errorText(e, 'No se pudo exportar.'))
    } finally {
      setExporting(false)
    }
  }

  // PDF: mismos filtros y mismo límite que el CSV; pdfmake se carga solo al exportar
  const exportPdf = async () => {
    if (!resolvedCompanyId || !summary) return
    setExportingPdf(true)
    try {
      const [listRes, companiesRes]: any[] = await Promise.all([
        APIs.getSalesReportList({ ...baseParams, search: debouncedSearch, page: 1, pageSize: 5000, sort: sort.by, dir: sort.dir }),
        userState?.id
          ? cachedRequest(`companies-by-user:${userState.id}`, 30_000, () => APIs.getCompaniesByUser(userState.id)).catch(() => null)
          : Promise.resolve(null),
      ])
      const companies: any[] = Array.isArray(companiesRes?.data) ? companiesRes.data : []
      const filtersText = [
        status === 'COMPLETED' ? 'Completadas' : status === 'CANCELLED' ? 'Canceladas' : 'Completadas y canceladas',
        userId ? `Vendedor: ${sellers.find((x) => x.id === userId)?.name ?? userId}` : '',
        paymentMethodId ? `Forma de pago: ${methods.find((x) => x.id === paymentMethodId)?.name ?? paymentMethodId}` : '',
        debouncedSearch ? `Búsqueda: "${debouncedSearch}"` : '',
      ].filter(Boolean)
      const { downloadSalesPdf } = await import('./salesPdf')
      await downloadSalesPdf({
        companyName: companies.find((c) => c.id === resolvedCompanyId)?.name,
        branchName: branchId > 0 ? summary.byBranch?.find((b: any) => b.id === branchId)?.name : 'Todas las sucursales',
        from: range[0],
        to: range[1],
        filtersText,
        summary,
        rows: listRes?.data ?? [],
        totalRows: listRes?.pagination?.total ?? 0,
      })
    } catch (e) {
      setError(errorText(e, 'No se pudo generar el PDF.'))
    } finally {
      setExportingPdf(false)
    }
  }

  if (!allowed) {
    return (
      <div className='sales-report'>
        <div className='sales-report__state'>
          <span className='material-symbols-rounded' aria-hidden>lock</span>
          <p>No tienes permiso para ver el reporte de ventas.</p>
        </div>
      </div>
    )
  }

  const k = summary?.kpis
  const kpis = [
    { label: 'Ventas', value: money(k?.total), hint: `${qty(k?.tickets)} tickets` },
    { label: 'Ticket promedio', value: money(k?.averageTicket) },
    { label: 'Unidades vendidas', value: qty(k?.units) },
    { label: 'Descuentos', value: money(k?.discount) },
    { label: 'Impuestos', value: money(k?.tax) },
    { label: 'Devoluciones', value: money(k?.returnsTotal), hint: `${qty(k?.returns)} · neto ${money(k?.netTotal)}`, tone: 'warn' },
    { label: 'Canceladas', value: qty(k?.cancelled), hint: money(k?.cancelledTotal), tone: 'danger' },
  ]
  const periodData = (summary?.byPeriod ?? []).map((p: any) => ({
    ...p,
    label: summary?.range?.granularity === 'hour' ? p.period : String(p.period).slice(5).split('-').reverse().join('/'),
  }))
  const sortIcon = (by: string) => (sort.by === by ? (sort.dir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more')

  return (
    <div className='sales-report'>
      <div className='sales-report__container'>
        <div className='sales-report__header'>
          <div className='sales-report__title'>
            <h1>Reporte de ventas</h1>
            <p>
              Del {range[0].split('-').reverse().join('/')} al {range[1].split('-').reverse().join('/')}
            </p>
          </div>
          <div className='sales-report__header-actions'>
            <CategoriesStorePicker
              branchId={branchId}
              onCompanyIdChange={(id) => {
                setCompanyId(id)
                localStorage.setItem('categories-picker-company-id', String(id))
              }}
              onBranchIdChange={(id) => {
                setBranchId(id)
                localStorage.setItem('categories-store-id', String(id))
                localStorage.setItem('categories-picker-branch-id', String(id))
              }}
            />
            <button type='button' className='btn__general-purple sales-report__export' onClick={exportCsv} disabled={exporting || loadingList || total === 0}>
              <span className='material-symbols-rounded' aria-hidden>download</span>
              {exporting ? 'Exportando…' : 'Exportar Excel (CSV)'}
            </button>
            <button type='button' className='btn__general-orange sales-report__export' onClick={exportPdf} disabled={exportingPdf || loadingSummary || loadingList || !summary}>
              <span className={`material-symbols-rounded ${exportingPdf ? 'sales-report__spin' : ''}`} aria-hidden>{exportingPdf ? 'progress_activity' : 'picture_as_pdf'}</span>
              {exportingPdf ? 'Generando PDF…' : 'Exportar PDF'}
            </button>
          </div>
        </div>

        <div className='sales-report__filters'>
          <div className='sales-report__ranges' role='group' aria-label='Periodo'>
            {RANGES.map((r) => (
              <button
                key={r.key}
                type='button'
                className={`sales-report__chip ${rangeKey === r.key ? 'is-active' : ''}`}
                onClick={() => {
                  setRange(r.get())
                  setRangeKey(r.key)
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className='sales-report__dates'>
            <DateField value={range[0]} onChange={(v) => { if (v) { setRange([v, range[1] < v ? v : range[1]]); setRangeKey('') } }} placeholder='Desde' />
            <span aria-hidden>→</span>
            <DateField value={range[1]} min={range[0]} onChange={(v) => { if (v) { setRange([range[0], v]); setRangeKey('') } }} placeholder='Hasta' />
          </div>
          <select className='inputs__general sales-report__select' value={status} onChange={(e) => setStatus(e.target.value as Status)} aria-label='Estado'>
            <option value='COMPLETED'>Completadas</option>
            <option value='CANCELLED'>Canceladas</option>
            <option value='ALL'>Todas</option>
          </select>
          <select className='inputs__general sales-report__select' value={userId} onChange={(e) => setUserId(Number(e.target.value))} aria-label='Vendedor'>
            <option value={0}>Todos los vendedores</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select className='inputs__general sales-report__select' value={paymentMethodId} onChange={(e) => setPaymentMethodId(Number(e.target.value))} aria-label='Forma de pago'>
            <option value={0}>Todas las formas de pago</option>
            {methods.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {error ? (
          <div className='sales-report__error' role='alert'>
            <span className='material-symbols-rounded' aria-hidden>error</span>
            <span>{error}</span>
            <button type='button' onClick={() => { loadSummary(); loadList() }}>Reintentar</button>
          </div>
        ) : null}

        <div className='sales-report__kpis'>
          {kpis.map((kpi) => (
            <div key={kpi.label} className={`sales-report__kpi ${kpi.tone ? `sales-report__kpi--${kpi.tone}` : ''}`}>
              <small>{kpi.label}</small>
              {loadingSummary ? <span className='table-skeleton__shimmer sales-report__kpi-skel' /> : <strong>{kpi.value}</strong>}
              {!loadingSummary && kpi.hint ? <span className='sales-report__kpi-hint'>{kpi.hint}</span> : null}
            </div>
          ))}
        </div>

        <div className='sales-report__grid'>
          <section className='sales-report__card sales-report__card--wide'>
            <h2>{summary?.range?.granularity === 'hour' ? 'Ventas por hora' : 'Ventas por día'}</h2>
            {loadingSummary ? (
              <span className='table-skeleton__shimmer sales-report__chart-skel' />
            ) : periodData.length ? (
              <ResponsiveContainer width='100%' height={240}>
                <BarChart data={periodData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='var(--panel-border)' />
                  <XAxis dataKey='label' tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={70} tickFormatter={(v) => `$${Number(v).toLocaleString('es-MX', { notation: 'compact' })}`} />
                  <Tooltip formatter={(v: any, name: any) => (name === 'total' ? [money(v), 'Ventas'] : [v, 'Tickets'])} cursor={{ fill: 'color-mix(in srgb, var(--primary-color, #072a57) 8%, transparent)' }} />
                  <Bar dataKey='total' fill='var(--primary-color, #072a57)' radius={[6, 6, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className='sales-report__empty-small'>Sin ventas en el periodo.</p>
            )}
          </section>

          <section className='sales-report__card'>
            <h2>Formas de pago</h2>
            {loadingSummary ? (
              <span className='table-skeleton__shimmer sales-report__chart-skel' />
            ) : summary?.byPaymentMethod?.length ? (
              <div className='sales-report__pie'>
                <ResponsiveContainer width='100%' height={170}>
                  <PieChart>
                    <Pie data={summary.byPaymentMethod} dataKey='total' nameKey='name' innerRadius={48} outerRadius={75} paddingAngle={2}>
                      {summary.byPaymentMethod.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => money(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className='sales-report__legend'>
                  {summary.byPaymentMethod.map((m: any, i: number) => (
                    <li key={m.id}>
                      <span style={{ background: COLORS[i % COLORS.length] }} />
                      <em>{m.name}</em>
                      <strong>{money(m.total)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className='sales-report__empty-small'>Sin pagos en el periodo.</p>
            )}
          </section>

          <section className='sales-report__card'>
            <h2>Artículos más vendidos</h2>
            {loadingSummary ? <span className='table-skeleton__shimmer sales-report__chart-skel' /> : (
              <BarList empty='Sin artículos vendidos.' rows={(summary?.topItems ?? []).map((r: any) => ({ name: r.name, total: r.total, hint: `${qty(r.units)} u.${r.code ? ` · ${r.code}` : ''}` }))} />
            )}
          </section>

          <section className='sales-report__card'>
            <h2>Categorías</h2>
            {loadingSummary ? <span className='table-skeleton__shimmer sales-report__chart-skel' /> : (
              <BarList empty='Sin datos de categorías.' rows={(summary?.topCategories ?? []).map((r: any) => ({ name: r.name, total: r.total, hint: `${qty(r.units)} u.` }))} />
            )}
          </section>

          <section className='sales-report__card'>
            <h2>{branchId > 0 ? 'Vendedores' : 'Sucursales y vendedores'}</h2>
            {loadingSummary ? <span className='table-skeleton__shimmer sales-report__chart-skel' /> : (
              <>
                {branchId > 0 ? null : (
                  <BarList empty='Sin sucursales.' rows={(summary?.byBranch ?? []).map((r: any) => ({ name: r.name, total: r.total, hint: `${r.tickets} tickets` }))} />
                )}
                <BarList empty='Sin vendedores.' rows={(summary?.bySeller ?? []).map((r: any) => ({ name: r.name, total: r.total, hint: `${r.tickets} tickets` }))} />
              </>
            )}
          </section>
        </div>

        <section className='sales-report__card sales-report__table-card'>
          <div className='sales-report__table-head'>
            <h2>Detalle de ventas {total ? <small>({qty(total)})</small> : null}</h2>
            <div className='sales-report__search'>
              <span className='material-symbols-rounded' aria-hidden>search</span>
              <input className='inputs__general' type='text' value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Folio o cliente' aria-label='Buscar venta' />
            </div>
          </div>
          <div className='sales-report__list'>
            <div className='sales-report__row sales-report__row--head'>
              <button type='button' onClick={() => toggleSort('folio')}>Folio <span className='material-symbols-rounded'>{sortIcon('folio')}</span></button>
              <button type='button' onClick={() => toggleSort('date')}>Fecha <span className='material-symbols-rounded'>{sortIcon('date')}</span></button>
              <button type='button' onClick={() => toggleSort('customer')}>Cliente <span className='material-symbols-rounded'>{sortIcon('customer')}</span></button>
              <span>Vendedor</span>
              <span>Pago</span>
              <span className='is-num'>Unid.</span>
              <button type='button' className='is-num' onClick={() => toggleSort('total')}>Total <span className='material-symbols-rounded'>{sortIcon('total')}</span></button>
            </div>
            {loadingList ? (
              <TableSkeleton rowClassName='sales-report__row' cols={[{ pill: true, width: '80px' }, { width: '80%' }, { width: '70%' }, { width: '60%' }, { width: '60%' }, { width: '40%' }, { width: '60%' }]} />
            ) : rows.length ? (
              rows.map((r) => (
                <div className='sales-report__row' key={r.id}>
                  <div data-label='Folio'>
                    <span className='sales-report__folio'>{r.serie ? `${r.serie}-` : ''}{r.folio ?? r.id}</span>
                    {r.status !== 'COMPLETED' ? <span className='sales-report__badge'>{STATUS_LABEL[r.status] ?? r.status}</span> : null}
                  </div>
                  <div data-label='Fecha'>{dateTime(r.date)}</div>
                  <div data-label='Cliente' className='sales-report__ellipsis' title={r.customer}>{r.customer}</div>
                  <div data-label='Vendedor' className='sales-report__ellipsis'>{r.seller || '—'}</div>
                  <div data-label='Pago' className='sales-report__ellipsis'>{r.paymentMethods || '—'}</div>
                  <div data-label='Unid.' className='is-num'>{qty(r.units)}</div>
                  <div data-label='Total' className='is-num'>
                    <strong>{money(r.total)}</strong>
                    {r.returned > 0 ? <small className='sales-report__returned'>−{money(r.returned)} devuelto</small> : null}
                  </div>
                </div>
              ))
            ) : (
              <div className='sales-report__state'>
                <span className='material-symbols-rounded' aria-hidden>receipt_long</span>
                <p>{debouncedSearch ? 'Ninguna venta coincide con la búsqueda.' : 'No hay ventas en este periodo.'}</p>
              </div>
            )}
          </div>
          {total > PAGE_SIZE && <Pagination total={total} page={page} pageSize={PAGE_SIZE} onPage={setPage} noun='ventas' />}
        </section>
      </div>
    </div>
  )
}

export default SalesReport
