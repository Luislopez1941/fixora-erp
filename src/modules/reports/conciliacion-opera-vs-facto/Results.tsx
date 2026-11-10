import React, { useMemo, useRef, useState } from 'react'
import { serialToText, type FactoResult, type OperaResult, type Reconciliation } from './reconcile'
import { FACTO_STATUS, OPERA_STATUS } from './exportCsv'
import FactoDetail from './FactoDetail'
import { xlsxFacto, xlsxOperaSinFactura, xlsxRepetidas } from './exportXlsx'
import { pdfFacto, pdfOperaSinFactura, pdfRepetidas } from './exportPdf'

const PAGE = 100

const money = (n: number) => Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })
const compact = (n: number) => Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', notation: 'compact', maximumFractionDigits: 2 })
const int = (n: number) => Number(n || 0).toLocaleString('es-MX')
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${money(Math.abs(n))}`

type Tab = 'facto' | 'opera' | 'repetidas'

/** Lo que hay que revisar va primero; dentro de cada grupo, lo de mayor monto. */
const PRIORITY: Record<FactoResult['status'], number> = {
  ambigua: 0, 'sin-opera': 1, diferencia: 2, conciliada: 3, 'sin-reserva': 4, 'fuera-periodo': 5, pago: 6, cancelada: 7,
}
const byPriority = (a: FactoResult, b: FactoResult) =>
  PRIORITY[a.status] - PRIORITY[b.status] ||
  (a.status === 'diferencia' ? Math.abs(b.diff) - Math.abs(a.diff) : a.status === 'sin-opera' ? b.factoAmount - a.factoAmount : 0)

const Pill: React.FC<{ tone: string; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`conciliacion__pill conciliacion__pill--${tone}`}>{children}</span>
)

const Icon: React.FC<{ name: string; className?: string }> = ({ name, className }) => (
  <span className={`material-symbols-rounded ${className ?? ''}`} aria-hidden>{name}</span>
)

/** Anillo con la proporción de cada estatus; el porcentaje conciliado va al centro. */
const Donut: React.FC<{ segments: { value: number; tone: string }[]; center: string; caption: string; size?: number; centerTone?: string }> = ({ segments, center, caption, size = 150, centerTone = 'ok' }) => {
  const R = 54
  const C = 2 * Math.PI * R
  const total = segments.reduce((a, x) => a + x.value, 0)
  let offset = 0
  return (
    <div className='conciliacion__donut' role='img' aria-label={`${center} ${caption}`} style={{ '--size': `${size}px` } as React.CSSProperties}>
      <svg viewBox='0 0 140 140'>
        <circle className='conciliacion__donut-track' cx='70' cy='70' r={R} />
        {total
          ? segments.filter((x) => x.value > 0).map((x) => {
              const len = (x.value / total) * C
              const visible = Math.max(len - (segments.filter((y) => y.value > 0).length > 1 ? 2 : 0), 1)
              const el = (
                <circle key={x.tone} className={`conciliacion__donut-seg conciliacion__donut-seg--${x.tone}`} cx='70' cy='70' r={R}
                  strokeDasharray={`${visible} ${C - visible}`} strokeDashoffset={-offset} transform='rotate(-90 70 70)' />
              )
              offset += len
              return el
            })
          : null}
      </svg>
      <div className={`conciliacion__donut-center conciliacion__donut-center--${centerTone}`}>
        <strong>{center}</strong>
        <small>{caption}</small>
      </div>
    </div>
  )
}

interface Props {
  data: Reconciliation
  tolerance: number
}

const Results: React.FC<Props> = ({ data, tolerance }) => {
  const [tab, setTab] = useState<Tab>('facto')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [open, setOpen] = useState<string | null>(null)
  const tableRef = useRef<HTMLElement>(null)

  const stats = useMemo(() => {
    const by = (s: FactoResult['status']) => data.facto.filter((r) => r.status === s)
    const sum = (list: FactoResult[], pick: (r: FactoResult) => number) => list.reduce((a, r) => a + pick(r), 0)
    const conciliada = by('conciliada'), diferencia = by('diferencia'), ambigua = by('ambigua'), sinOpera = by('sin-opera')
    const base = conciliada.length + diferencia.length + ambigua.length + sinOpera.length
    const operaBy = (s: OperaResult['status']) => data.opera.filter((r) => r.status === s)
    const sinFacto = operaBy('sin-facto')
    return {
      conciliada, diferencia, ambigua, sinOpera, base,
      sinReserva: by('sin-reserva').length,
      pago: by('pago').length,
      cancelada: by('cancelada').length,
      fueraPeriodo: by('fuera-periodo').length,
      checks: data.facto.filter((r) => r.facto.checks.length).length,
      conciliadaAmount: sum(conciliada, (r) => r.factoAmount),
      diferenciaNet: sum(diferencia, (r) => r.diff),
      sinOperaAmount: sum(sinOpera, (r) => r.factoAmount),
      sinFacto: sinFacto.length,
      sinFactoAmount: sinFacto.reduce((a, r) => a + r.opera.totalIngresos, 0),
      soloPago: operaBy('solo-pago').length,
      conciliadaOpera: operaBy('conciliada').length,
      diferenciaOpera: operaBy('diferencia').length,
      repetidasOpera: data.opera.filter((r) => r.repeated > 1).length,
    }
  }, [data])

  const q = search.trim().toLowerCase()

  const factoRows = useMemo(
    () =>
      [...data.facto].sort(byPriority).filter((r) => {
        if (filter === 'checks') { if (!r.facto.checks.length) return false }
        else if (filter !== 'all' && r.status !== filter) return false
        if (!q) return true
        const f = r.facto
        return [f.idUnico, f.uuid, f.serieFolio, f.reserva, f.huesped, f.habitacion, f.centro, r.confirmacion, ...r.opera.map((o) => o.confirmacion), ...r.opera.map((o) => o.folioOpera)]
          .some((v) => v?.toLowerCase().includes(q))
      }),
    [data, filter, q],
  )

  const operaRows = useMemo(
    () =>
      data.opera.filter((r) => {
        if (filter === 'repetida') { if (r.repeated < 2) return false }
        else if (filter !== 'all' && r.status !== filter) return false
        if (!q) return true
        const o = r.opera
        return [o.confirmacion, o.concat, o.uuid, o.folioOpera, o.habitacion, o.cashier].some((v) => v?.toLowerCase().includes(q))
      }),
    [data, filter, q],
  )

  const dupRows = useMemo(() => data.duplicates.filter((d) => !q || d.confirmacion.toLowerCase().includes(q)), [data, q])

  const goTo = (nextTab: Tab, nextFilter = 'all') => {
    setTab(nextTab)
    setFilter(nextFilter)
    setLimit(PAGE)
    setOpen(null)
    requestAnimationFrame(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const factoFilters: [string, string, number][] = [
    ['all', 'Todas', data.facto.length],
    ['conciliada', 'Conciliadas', stats.conciliada.length],
    ['diferencia', 'Con diferencia', stats.diferencia.length],
    ['ambigua', 'Ambiguas', stats.ambigua.length],
    ['sin-opera', 'Sin OPERA', stats.sinOpera.length],
    ['sin-reserva', 'Sin reserva', stats.sinReserva],
    ['fuera-periodo', 'Fuera de periodo', stats.fueraPeriodo],
    ['pago', 'Complementos de pago', stats.pago],
    ['cancelada', 'Canceladas', stats.cancelada],
    ['checks', 'Total con error', stats.checks],
  ]
  const operaFilters: [string, string, number][] = [
    ['all', 'Todas', data.opera.length],
    ['conciliada', 'Conciliadas', stats.conciliadaOpera],
    ['diferencia', 'Con diferencia', stats.diferenciaOpera],
    ['sin-facto', 'Sin factura', stats.sinFacto],
    ['solo-pago', 'Solo pago', stats.soloPago],
    ['repetida', 'Confirmación repetida', stats.repetidasOpera],
  ]
  const chips = (tab === 'facto' ? factoFilters : operaFilters).filter(([key, , n]) => n > 0 || key === 'all' || key === filter)

  const shown = tab === 'facto' ? factoRows.length : operaRows.length
  const pct = stats.base ? (stats.conciliada.length / stats.base) * 100 : 0
  const operaMatched = stats.conciliadaOpera + stats.diferenciaOpera
  const operaBase = operaMatched + stats.sinFacto
  const operaPct = operaBase ? (operaMatched / operaBase) * 100 : 0

  const sinFactoRows = data.opera.filter((r) => r.status === 'sin-facto')
  const sinFactoConUuid = sinFactoRows.filter((r) => r.opera.uuid).length
  const factoBy = (pred: (r: FactoResult) => boolean) => data.facto.filter(pred)
  const review: { label: string; hint: string; count: number; icon: string; tone: string; onClick: () => void; download: () => void; pdf: () => void }[] = [
    {
      label: 'OPERA sin factura', icon: 'receipt_long', tone: 'danger', count: stats.sinFacto,
      hint: stats.sinFacto ? `${compact(stats.sinFactoAmount)} en ingresos${sinFactoConUuid ? ` · ${int(sinFactoConUuid)} ya traen UUID en OPERA (posible factura manual)` : ''}` : 'Todo lo de OPERA tiene factura',
      onClick: () => goTo('opera', 'sin-facto'), download: () => xlsxOperaSinFactura(sinFactoRows), pdf: () => pdfOperaSinFactura(sinFactoRows),
    },
    {
      label: 'Montos que no cuadran', icon: 'rule', tone: 'warn', count: stats.diferencia.length,
      hint: 'Factura cruzada con OPERA, pero con otro monto',
      onClick: () => goTo('facto', 'diferencia'), download: () => xlsxFacto('Montos que no cuadran', 'montos-que-no-cuadran', factoBy((r) => r.status === 'diferencia')),
      pdf: () => pdfFacto('Montos que no cuadran', 'montos-que-no-cuadran', 'Facturas que cruzan con OPERA, pero con un monto distinto.', factoBy((r) => r.status === 'diferencia')),
    },
    {
      label: 'Facturas sin OPERA', icon: 'search_off', tone: 'danger', count: stats.sinOpera.length,
      hint: 'Con reserva, pero sin fila en OPERA (ej. facturas manuales)',
      onClick: () => goTo('facto', 'sin-opera'), download: () => xlsxFacto('Facturas sin OPERA', 'facturas-sin-opera', factoBy((r) => r.status === 'sin-opera')),
      pdf: () => pdfFacto('Facturas sin OPERA', 'facturas-sin-opera', 'Facturas con reserva que no tienen fila en OPERA (por ejemplo, facturas manuales).', factoBy((r) => r.status === 'sin-opera'), { showOpera: false }),
    },
    {
      label: 'Totales con error en Facto', icon: 'warning', tone: 'warn', count: stats.checks,
      hint: 'Subtotal + impuestos no da el total',
      onClick: () => goTo('facto', 'checks'), download: () => xlsxFacto('Totales con error', 'totales-con-error-facto', factoBy((r) => r.facto.checks.length > 0)),
      pdf: () => pdfFacto('Totales con error en Facto', 'totales-con-error-facto', 'Facturas donde subtotal + impuestos no da el total.', factoBy((r) => r.facto.checks.length > 0)),
    },
    {
      label: 'Confirmaciones repetidas', icon: 'content_copy', tone: 'info', count: data.duplicates.length,
      hint: 'Varias filas de OPERA por reserva',
      onClick: () => goTo('repetidas'), download: () => xlsxRepetidas(data.duplicates), pdf: () => pdfRepetidas(data.duplicates),
    },
    {
      label: 'Facturas sin reserva', icon: 'storefront', tone: 'violet', count: stats.sinReserva,
      hint: 'Consumo directo, normalmente fuera de OPERA',
      onClick: () => goTo('facto', 'sin-reserva'), download: () => xlsxFacto('Facturas sin reserva', 'facturas-sin-reserva', factoBy((r) => r.status === 'sin-reserva')),
      pdf: () => pdfFacto('Facturas sin reserva', 'facturas-sin-reserva', 'Consumos directos (restaurante o bar), normalmente fuera de OPERA.', factoBy((r) => r.status === 'sin-reserva'), { showOpera: false }),
    },
    {
      label: 'Complementos de pago', icon: 'payments', tone: 'slate', count: stats.pago,
      hint: 'No se concilian contra OPERA',
      onClick: () => goTo('facto', 'pago'), download: () => xlsxFacto('Complementos de pago', 'complementos-de-pago', factoBy((r) => r.status === 'pago')),
      pdf: () => pdfFacto('Complementos de pago', 'complementos-de-pago', 'Facturas tipo Pago (REP): no se concilian contra OPERA.', factoBy((r) => r.status === 'pago'), { showOpera: false }),
    },
  ]

  return (
    <>
      <div className='conciliacion__overview'>
        <section className='conciliacion__card conciliacion__summary' aria-label='Resumen de la conciliación'>
          <div className='conciliacion__summary-top'>
            <div className='conciliacion__summary-group'>
              <Donut
                segments={[
                  { value: stats.conciliada.length, tone: 'ok' },
                  { value: stats.diferencia.length, tone: 'warn' },
                  { value: stats.ambigua.length, tone: 'info' },
                  { value: stats.sinOpera.length, tone: 'danger' },
                ]}
                center={`${pct.toLocaleString('es-MX', { maximumFractionDigits: 1 })}%`}
                caption='conciliado'
              />
              <div className='conciliacion__summary-text'>
                <div className='conciliacion__eyebrow'>Facto → OPERA</div>
                <p><strong>{int(stats.conciliada.length)}</strong> de {int(stats.base)} facturas con reserva ya cruzan con OPERA</p>
                <span className='conciliacion__summary-amount'>{compact(stats.conciliadaAmount)} conciliados</span>
              </div>
            </div>

            <div className='conciliacion__summary-group conciliacion__summary-group--right'>
              <Donut
                size={112}
                segments={[
                  { value: operaMatched, tone: 'ok' },
                  { value: stats.sinFacto, tone: 'danger' },
                ]}
                center={`${operaPct.toLocaleString('es-MX', { maximumFractionDigits: 0 })}%`}
                caption='con factura'
                centerTone={operaPct >= 90 ? 'ok' : operaPct >= 70 ? 'warn' : 'danger'}
              />
              <div className='conciliacion__summary-text'>
                <div className='conciliacion__eyebrow'>OPERA → Facto</div>
                <p><strong>{int(operaMatched)}</strong> de {int(operaBase)} filas con ingresos ya tienen factura</p>
                <span className='conciliacion__summary-amount conciliacion__summary-amount--danger'>{compact(stats.sinFactoAmount)} sin facturar</span>
              </div>
            </div>
          </div>

          <div className='conciliacion__stats'>
            {[
              { key: 'conciliada', tone: 'ok', label: 'Conciliadas', n: stats.conciliada.length, sub: compact(stats.conciliadaAmount) },
              { key: 'diferencia', tone: 'warn', label: 'Con diferencia', n: stats.diferencia.length, sub: `Neto ${signed(stats.diferenciaNet)}` },
              { key: 'ambigua', tone: 'info', label: 'Ambiguas', n: stats.ambigua.length, sub: 'Elegir a mano' },
              { key: 'sin-opera', tone: 'danger', label: 'Sin OPERA', n: stats.sinOpera.length, sub: compact(stats.sinOperaAmount) },
            ].map((s) => (
              <button key={s.key} type='button' className={`conciliacion__stat conciliacion__stat--${s.tone}`} disabled={!s.n} onClick={() => goTo('facto', s.key)}>
                <span className='conciliacion__stat-label'><i className={`conciliacion__dot conciliacion__dot--${s.tone}`} />{s.label}</span>
                <strong>{int(s.n)}</strong>
                <small>{s.n ? s.sub : '—'}</small>
              </button>
            ))}
          </div>
        </section>

        <section className='conciliacion__card conciliacion__review' aria-label='Para revisar'>
          <div className='conciliacion__eyebrow'>Para revisar</div>
          <ul>
            {review.map((r) => (
              <li key={r.label} className={`conciliacion__tile-item conciliacion__tile--${r.tone}`}>
                <button type='button' className={`conciliacion__tile conciliacion__tile--${r.tone}`} disabled={!r.count} onClick={r.onClick}>
                  <span className='conciliacion__tile-icon'><Icon name={r.icon} /></span>
                  <span className='conciliacion__review-label'>{r.label}</span>
                  <strong>{int(r.count)}</strong>
                  <small>{r.hint}</small>
                </button>
                <div className='conciliacion__tile-actions'>
                  <button type='button' className='conciliacion__tile-download' disabled={!r.count} onClick={r.download} title={`Descargar ${r.label} en Excel`} aria-label={`Descargar ${r.label} en Excel`}>
                    <Icon name='table_view' /> Excel
                  </button>
                  <button type='button' className='conciliacion__tile-download conciliacion__tile-download--pdf' disabled={!r.count} onClick={r.pdf} title={`Descargar ${r.label} en PDF`} aria-label={`Descargar ${r.label} en PDF`}>
                    <Icon name='picture_as_pdf' /> PDF
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className='conciliacion__card conciliacion__table-card' ref={tableRef}>
        <div className='conciliacion__tabs' role='tablist'>
          {([
            ['facto', 'Facto → OPERA', data.facto.length],
            ['opera', 'OPERA → Facto', data.opera.length],
            ['repetidas', 'Confirmaciones repetidas', data.duplicates.length],
          ] as [Tab, string, number][]).map(([key, label, n]) => (
            <button key={key} type='button' role='tab' aria-selected={tab === key} className={tab === key ? 'is-active' : ''} onClick={() => goTo(key)}>
              {label} <span className='conciliacion__count'>{int(n)}</span>
            </button>
          ))}
          <label className='conciliacion__search'>
            <Icon name='search' />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setLimit(PAGE) }} placeholder='Confirmación, folio, huésped, UUID…' aria-label='Buscar' />
            {search ? <button type='button' onClick={() => setSearch('')} aria-label='Limpiar búsqueda'><Icon name='close' /></button> : null}
          </label>
        </div>

        {tab !== 'repetidas' ? (
          <div className='conciliacion__chips' role='group' aria-label='Filtrar'>
            {chips.map(([key, label, n]) => (
              <button key={key} type='button' className={`conciliacion__chip ${filter === key ? 'is-active' : ''}`} onClick={() => { setFilter(key); setLimit(PAGE); setOpen(null) }}>
                {label} <span>{int(n)}</span>
              </button>
            ))}
          </div>
        ) : null}

        {tab === 'facto' ? (
          <div className='conciliacion__table-wrap'>
            <table className='conciliacion__table'>
              <thead>
                <tr>
                  <th>Estatus</th><th>Factura</th><th>Reserva</th><th>Folio OPERA</th>
                  <th className='is-num'>Facto</th><th className='is-num'>OPERA</th><th className='is-num'>Diferencia</th><th>Método</th>
                </tr>
              </thead>
              <tbody>
                {factoRows.slice(0, limit).map((r) => {
                  const st = FACTO_STATUS[r.status]
                  const f = r.facto
                  const expanded = open === f.key
                  const hasDiff = r.opera.length > 0
                  const bad = hasDiff && Math.abs(r.diff) > tolerance
                  return (
                    <React.Fragment key={f.key}>
                      <tr
                        className={`is-clickable ${expanded ? 'is-open' : ''}`}
                        tabIndex={0}
                        aria-expanded={expanded}
                        onClick={() => setOpen(expanded ? null : f.key)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(expanded ? null : f.key) } }}
                      >
                        <td>
                          <Pill tone={st.tone}>{st.label}</Pill>
                          {f.checks.length ? <Pill tone='danger'>Total con error</Pill> : null}
                        </td>
                        <td><strong>{f.serieFolio || `Fila ${f.excelRow}`}</strong><small>{f.centro}{f.fecha ? ` · ${serialToText(f.fecha)}` : ''}</small></td>
                        <td>
                          <span className='is-mono'>{r.confirmacion || f.reserva || '—'}</span>
                          <small>{[f.huesped, f.habitacion ? `hab. ${f.habitacion}` : ''].filter(Boolean).join(' · ')}</small>
                        </td>
                        <td className='is-mono'>{r.opera.map((o) => o.folioOpera).join(' + ') || (r.candidates.length ? <span className='is-muted'>{r.candidates.length} candidatos</span> : '')}</td>
                        <td className='is-num'>
                          {money(r.factoAmount)}
                          {f.totalPagado && f.total !== f.totalPagado ? <small>CFDI {money(f.total)}</small> : null}
                        </td>
                        <td className='is-num'>{hasDiff ? money(r.operaTotal) : <span className='is-muted'>—</span>}</td>
                        <td className={`is-num ${bad ? 'is-bad' : 'is-muted'}`}>{hasDiff ? (Math.abs(r.diff) < 0.005 ? '—' : signed(r.diff)) : '—'}</td>
                        <td><small className='conciliacion__method'>{r.method || '—'}</small></td>
                      </tr>
                      {expanded ? (
                        <tr className='conciliacion__detail'>
                          <td colSpan={8}>
                            <FactoDetail r={r} tolerance={tolerance} />
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
            {!factoRows.length ? <p className='conciliacion__empty'>No hay facturas con este filtro.</p> : null}
          </div>
        ) : null}

        {tab === 'opera' ? (
          <div className='conciliacion__table-wrap'>
            <table className='conciliacion__table'>
              <thead>
                <tr>
                  <th>Estatus</th><th>Confirmación</th><th>Folio OPERA</th><th>Fecha</th>
                  <th className='is-num'>Ingresos</th><th className='is-num'>Pago</th><th>Factura Facto</th><th>Info</th>
                </tr>
              </thead>
              <tbody>
                {operaRows.slice(0, limit).map((r) => {
                  const st = OPERA_STATUS[r.status]
                  const o = r.opera
                  return (
                    <tr key={o.key}>
                      <td><Pill tone={st.tone}>{st.label}</Pill>{r.repeated > 1 ? <Pill tone='info'>×{r.repeated}</Pill> : null}</td>
                      <td><span className='is-mono'>{o.confirmacion}</span><small>{o.habitacion ? `hab. ${o.habitacion}` : ''}{o.cashier ? ` · ${o.cashier}` : ''}</small></td>
                      <td className='is-mono'>{o.folioOpera}</td>
                      <td><small className='conciliacion__plain'>{serialToText(o.fecha)}</small></td>
                      <td className='is-num'>{money(o.totalIngresos)}</td>
                      <td className='is-num'>{money(o.totalPago)}</td>
                      <td>{r.facto ? <><strong>{r.facto.serieFolio || r.facto.idUnico}</strong><small>{money(r.facto.total)}</small></> : <span className='is-muted'>—</span>}</td>
                      <td><small className='conciliacion__plain'>{o.info}</small></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!operaRows.length ? <p className='conciliacion__empty'>No hay filas de OPERA con este filtro.</p> : null}
          </div>
        ) : null}

        {tab === 'repetidas' ? (
          <div className='conciliacion__dups'>
            {dupRows.slice(0, limit).map((d) => (
              <div key={d.confirmacion} className='conciliacion__dup'>
                <div className='conciliacion__dup-head'>
                  <strong className='is-mono'>{d.confirmacion}</strong>
                  <span>{d.rows.length} filas · {money(d.total)}</span>
                  <span>{d.facturas.length ? `Factura(s): ${d.facturas.join(', ')}` : 'Sin factura en Facto'}</span>
                </div>
                <ul>
                  {d.rows.map((o) => {
                    const r = data.opera.find((x) => x.opera.key === o.key)
                    const st = r ? OPERA_STATUS[r.status] : OPERA_STATUS['sin-facto']
                    return (
                      <li key={o.key}>
                        <Pill tone={st.tone}>{st.label}</Pill>
                        folio {o.folioOpera} · hab. {o.habitacion} · ingresos {money(o.totalIngresos)} · pago {money(o.totalPago)} · {o.info}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
            {!dupRows.length ? <p className='conciliacion__empty'>No hay confirmaciones repetidas en OPERA.</p> : null}
          </div>
        ) : null}

        {tab === 'repetidas' ? (dupRows.length > limit ? (
          <div className='conciliacion__foot'>
            <span>Mostrando {int(Math.min(limit, dupRows.length))} de {int(dupRows.length)}</span>
            <button type='button' className='conciliacion__pill-btn' onClick={() => setLimit((l) => l + PAGE)}>Mostrar más</button>
          </div>
        ) : null) : (
          <div className='conciliacion__foot'>
            <span>Mostrando {int(Math.min(limit, shown))} de {int(shown)}</span>
            {shown > limit ? <button type='button' className='conciliacion__pill-btn' onClick={() => setLimit((l) => l + PAGE)}>Mostrar {int(Math.min(PAGE, shown - limit))} más</button> : null}
          </div>
        )}
      </section>
    </>
  )
}

export default Results
