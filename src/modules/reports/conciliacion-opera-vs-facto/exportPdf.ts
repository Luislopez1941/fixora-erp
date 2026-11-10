import { downloadPdf, type PdfColumn } from './pdfWriter'
import { FACTO_STATUS } from './exportCsv'
import { folioGroups, operaTotals, serialToText, type DuplicateGroup, type FactoResult, type OperaResult, type Reconciliation } from './reconcile'

const stamp = () => new Date().toISOString().slice(0, 10)
const money = (v: number) => Number(v || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).replace(/\u00a0/g, ' ')
const compact = (v: number) => Number(v || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', notation: 'compact', maximumFractionDigits: 2 })
const int = (v: number) => Number(v || 0).toLocaleString('es-MX')
const sum = (list: number[]) => Math.round(list.reduce((a, b) => a + b, 0) * 100) / 100
const dash = (v: number) => (v ? money(v) : '-')

export const pdfOperaSinFactura = (opera: OperaResult[]) =>
  downloadPdf(`opera-sin-factura-${stamp()}`, {
    title: 'OPERA sin factura',
    subtitle: `${int(opera.length)} filas de OPERA con ingresos que no encontraron factura en Facto. Las que ya traen UUID en OPERA pueden ser facturas manuales.`,
    kpis: [
      { label: 'Filas sin factura', value: int(opera.length) },
      { label: 'Ingresos sin facturar', value: money(sum(opera.map((r) => r.opera.totalIngresos))) },
      { label: 'Con UUID en OPERA (posible factura manual)', value: int(opera.filter((r) => r.opera.uuid).length) },
    ],
    columns: [
      { header: 'Fila', weight: 4 }, { header: 'Fecha', weight: 8 }, { header: 'Confirmación', weight: 9 }, { header: 'Folio OPERA', weight: 8 },
      { header: 'Hab.', weight: 5 }, { header: 'Cajero', weight: 15 }, { header: 'Ingresos', weight: 10, align: 'right' }, { header: 'Pago', weight: 10, align: 'right' },
      { header: 'Pagado', weight: 10, align: 'right' }, { header: 'CXC', weight: 8, align: 'right' }, { header: 'UUID en OPERA', weight: 18 },
    ] as PdfColumn[],
    rows: opera.map((r) => [
      String(r.opera.excelRow), serialToText(r.opera.fecha), r.opera.confirmacion, r.opera.folioOpera, r.opera.habitacion, r.opera.cashier,
      dash(r.opera.totalIngresos), dash(r.opera.totalPago), dash(r.opera.totalPagado), dash(r.opera.cxc), r.opera.uuid || '-',
    ]),
    totalRow: ['', '', '', '', '', 'Total', money(sum(opera.map((r) => r.opera.totalIngresos))), money(sum(opera.map((r) => r.opera.totalPago))), money(sum(opera.map((r) => r.opera.totalPagado))), money(sum(opera.map((r) => r.opera.cxc))), ''],
    footerNote: 'Detalle completo en el Excel',
  })

export const pdfFacto = (title: string, file: string, description: string, facto: FactoResult[], opts: { showOpera?: boolean } = {}) => {
  const showOpera = opts.showOpera ?? true
  downloadPdf(`${file}-${stamp()}`, {
    title,
    subtitle: description,
    kpis: [
      { label: 'Facturas', value: int(facto.length) },
      { label: 'Monto en Facto', value: money(sum(facto.map((r) => r.factoAmount))) },
      ...(showOpera ? [{ label: 'Diferencia contra OPERA', value: money(sum(facto.filter((r) => r.opera.length).map((r) => r.diff))) }] : []),
    ],
    columns: [
      { header: 'Estatus', weight: 11 }, { header: 'Factura', weight: 9 }, { header: 'Fecha', weight: 8 }, { header: 'Centro de consumo', weight: 13 }, { header: 'Reserva', weight: 8 },
      { header: 'Huésped', weight: 15 }, { header: 'Folio OPERA', weight: 9 }, { header: 'Facto', weight: 10, align: 'right' },
      ...(showOpera ? [{ header: 'OPERA', weight: 10, align: 'right' as const }, { header: 'Diferencia', weight: 9, align: 'right' as const }] : []),
      { header: 'Observaciones', weight: 32 },
    ] as PdfColumn[],
    rows: facto.map((r) => [
      FACTO_STATUS[r.status].label, r.facto.serieFolio || `Fila ${r.facto.excelRow}`, serialToText(r.facto.fecha), r.facto.centro, r.facto.reserva, r.facto.huesped,
      r.opera.map((o) => o.folioOpera).join(' + ') || '-', money(r.factoAmount),
      ...(showOpera ? [r.opera.length ? money(r.operaTotal) : '-', r.opera.length ? money(r.diff) : '-'] : []),
      [...r.facto.checks, ...r.notes].join(' | '),
    ]),
    footerNote: 'Detalle completo en el Excel',
  })
}

export const pdfRepetidas = (dups: DuplicateGroup[]) =>
  downloadPdf(`confirmaciones-repetidas-${stamp()}`, {
    title: 'Confirmaciones repetidas en OPERA',
    subtitle: 'Una misma reserva con varias filas en OPERA. El total no repite un folio que viene como ingresos y como pago.',
    kpis: [
      { label: 'Confirmaciones repetidas', value: int(dups.length) },
      { label: 'Filas involucradas', value: int(dups.reduce((a, d) => a + d.rows.length, 0)) },
    ],
    columns: [
      { header: 'Confirmación', weight: 10 }, { header: 'Filas', weight: 5, align: 'right' }, { header: 'Folios', weight: 22 }, { header: 'Habitaciones', weight: 10 },
      { header: 'Ingresos', weight: 11, align: 'right' }, { header: 'Pago', weight: 11, align: 'right' }, { header: 'Total', weight: 11, align: 'right' }, { header: 'Facturas Facto', weight: 20 },
    ] as PdfColumn[],
    rows: dups.map((d) => {
      const t = operaTotals(d.rows)
      return [
        d.confirmacion, String(d.rows.length), folioGroups(d.rows).map((g) => g.folio).join(' + '), [...new Set(d.rows.map((o) => o.habitacion).filter(Boolean))].join(', '),
        dash(t.ingresos), dash(t.pago), money(d.total), d.facturas.join(', ') || '-',
      ]
    }),
    footerNote: 'Detalle completo en el Excel',
  })

/** Resumen general para entregar: cifras clave y el desglose por estatus. */
export const pdfResumen = (data: Reconciliation, tolerance: number) => {
  const by = (s: FactoResult['status']) => data.facto.filter((r) => r.status === s)
  const byO = (s: OperaResult['status']) => data.opera.filter((r) => r.status === s)
  const conc = by('conciliada')
  const withReserva = data.facto.filter((r) => ['conciliada', 'diferencia', 'ambigua', 'sin-opera'].includes(r.status))
  const pct = withReserva.length ? (conc.length / withReserva.length) * 100 : 0
  const operaWith = byO('conciliada').length + byO('diferencia').length
  const sinFactura = byO('sin-facto')
  const operaBase = operaWith + sinFactura.length
  const range = data.operaRange ? `Periodo de OPERA: ${serialToText(data.operaRange[0])} al ${serialToText(data.operaRange[1])}. ` : ''
  const amt = (list: FactoResult[]) => sum(list.map((r) => r.factoAmount))
  const row = (name: string, count: number, amount: number | null, note = ''): string[] => [name, int(count), amount == null ? '-' : money(amount), note]

  downloadPdf(`resumen-conciliacion-${stamp()}`, {
    title: 'Conciliación OPERA vs Facto - Resumen',
    subtitle: `${range}Tolerancia de monto: ${money(tolerance)}.`,
    kpis: [
      { label: 'Facturas con reserva conciliadas', value: `${pct.toLocaleString('es-MX', { maximumFractionDigits: 1 })}%` },
      { label: 'Monto conciliado', value: compact(amt(conc)) },
      { label: 'OPERA con factura', value: operaBase ? `${((operaWith / operaBase) * 100).toLocaleString('es-MX', { maximumFractionDigits: 1 })}%` : '-' },
      { label: 'OPERA sin facturar', value: compact(sum(sinFactura.map((r) => r.opera.totalIngresos))) },
      { label: 'Montos que no cuadran', value: int(by('diferencia').length) },
    ],
    columns: [
      { header: 'Concepto', weight: 30 }, { header: 'Registros', weight: 9, align: 'right' }, { header: 'Importe', weight: 14, align: 'right' }, { header: 'Qué significa', weight: 47 },
    ] as PdfColumn[],
    rows: [
      ['FACTO -> OPERA (facturas)', '', '', ''],
      row('Conciliadas', conc.length, amt(conc), 'La factura cruza con OPERA y el monto cuadra.'),
      row('Con diferencia de monto', by('diferencia').length, amt(by('diferencia')), 'Cruza con OPERA, pero el monto es distinto.'),
      row('Ambiguas', by('ambigua').length, amt(by('ambigua')), 'Varias filas posibles en OPERA; hay que elegir a mano.'),
      row('Sin OPERA', by('sin-opera').length, amt(by('sin-opera')), 'Tiene reserva, pero ninguna fila de OPERA la respalda.'),
      row('Sin reserva', by('sin-reserva').length, amt(by('sin-reserva')), 'Consumo directo (restaurante/bar), normalmente fuera de OPERA.'),
      row('Fuera de periodo', by('fuera-periodo').length, amt(by('fuera-periodo')), 'Fecha fuera del extracto de OPERA.'),
      row('Complementos de pago', by('pago').length, null, 'No se concilian contra OPERA.'),
      row('Canceladas', by('cancelada').length, null, 'No se concilian.'),
      row('Totales con error en la factura', data.facto.filter((r) => r.facto.checks.length).length, null, 'Subtotal + impuestos no da el total.'),
      ['OPERA -> FACTO (ingresos)', '', '', ''],
      row('Con factura', byO('conciliada').length, sum(byO('conciliada').map((r) => r.opera.totalIngresos)), 'La fila de OPERA ya tiene factura conciliada.'),
      row('Con factura, monto distinto', byO('diferencia').length, sum(byO('diferencia').map((r) => r.opera.totalIngresos)), 'Tiene factura pero el monto no cuadra.'),
      row('Sin factura', sinFactura.length, sum(sinFactura.map((r) => r.opera.totalIngresos)), 'Ingresos de OPERA que no encontraron factura en Facto.'),
      row('Solo pago', byO('solo-pago').length, null, 'Filas de pago sin ingresos.'),
      row('Confirmaciones repetidas', data.duplicates.length, null, 'Una reserva con varias filas en OPERA.'),
    ],
    footerNote: 'Las facturas manuales se revisan aparte',
  })
}
