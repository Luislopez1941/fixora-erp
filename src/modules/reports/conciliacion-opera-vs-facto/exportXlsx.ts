import { downloadXlsx } from './xlsxWriter'
import { FACTO_HEADER, FACTO_MONEY, OPERA_HEADER, OPERA_MONEY, factoTable, operaTable } from './exportCsv'
import { folioGroups, operaTotals, type DuplicateGroup, type FactoResult, type OperaResult, type Reconciliation } from './reconcile'
import { ADJ_KIND_LABEL, reasonLabel, type Adjustment } from './adjustments'

const stamp = () => new Date().toISOString().slice(0, 10)

export const xlsxOperaSinFactura = (opera: OperaResult[]) =>
  downloadXlsx(`opera-sin-factura-${stamp()}`, [{ name: 'OPERA sin factura', header: OPERA_HEADER, rows: operaTable(opera), money: OPERA_MONEY }])

export const xlsxFacto = (name: string, file: string, facto: FactoResult[]) =>
  downloadXlsx(`${file}-${stamp()}`, [{ name, header: FACTO_HEADER, rows: factoTable(facto), money: FACTO_MONEY }])

export const xlsxRepetidas = (dups: DuplicateGroup[]) =>
  downloadXlsx(`confirmaciones-repetidas-${stamp()}`, [
    {
      name: 'Confirmaciones repetidas',
      header: ['Confirmación', 'Filas en OPERA', 'Folios distintos', 'Habitaciones', 'Total ingresos', 'Total pago', 'Total CXC', 'Total (sin repetir folios)', 'Facturas Facto'],
      rows: dups.map((d) => {
        const t = operaTotals(d.rows)
        return [
          d.confirmacion, d.rows.length, folioGroups(d.rows).map((g) => g.folio).join(' + '),
          [...new Set(d.rows.map((o) => o.habitacion).filter(Boolean))].join(', '), t.ingresos, t.pago, t.cxc, d.total, d.facturas.join(', '),
        ]
      }),
      money: [4, 5, 6, 7],
    },
  ])

/** Un solo libro con todo: lo que cuadra, lo ajustado a mano, lo pendiente y la bitácora de ajustes, una hoja por caso. */
export const xlsxReporteCompleto = (data: Reconciliation, adjustments: Adjustment[] = []) => {
  const f = (...st: FactoResult['status'][]) => data.facto.filter((r) => st.includes(r.status))
  const sheet = (name: string, list: FactoResult[]) => ({ name, header: FACTO_HEADER, rows: factoTable(list), money: FACTO_MONEY })
  const opera = (...st: OperaResult['status'][]) => data.opera.filter((r) => st.includes(r.status))
  downloadXlsx(`conciliacion-opera-vs-facto-${stamp()}`, [
    sheet('Cuadran', f('conciliada')),
    sheet('Ajustadas', f('ajustada')),
    sheet('Pendientes', f('diferencia', 'ambigua', 'sin-opera')),
    { name: 'OPERA sin factura', header: OPERA_HEADER, rows: operaTable(opera('sin-facto')), money: OPERA_MONEY },
    { name: 'OPERA ajustada', header: OPERA_HEADER, rows: operaTable(opera('ajustada', 'excluida')), money: OPERA_MONEY },
    sheet('Excluidas', f('excluida')),
    sheet('Sin reserva', f('sin-reserva')),
    sheet('Complementos de pago', f('pago')),
    {
      name: 'Bitácora de ajustes',
      header: ['Fecha', 'Registro', 'Lado', 'Ajuste', 'Motivo', 'Nota', 'Usuario', 'Filas de OPERA vinculadas'],
      rows: [...adjustments].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((a) => [
        new Date(a.createdAt).toLocaleString('es-MX'), a.ref, a.side === 'facto' ? 'Facto' : 'OPERA', ADJ_KIND_LABEL[a.kind], reasonLabel(a.reason), a.note, a.user, a.links.length || '',
      ]),
    },
    { name: 'OPERA completo', header: OPERA_HEADER, rows: operaTable(data.opera), money: OPERA_MONEY },
  ])
}
