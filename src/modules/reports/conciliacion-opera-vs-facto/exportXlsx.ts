import { downloadXlsx } from './xlsxWriter'
import { FACTO_HEADER, FACTO_MONEY, OPERA_HEADER, OPERA_MONEY, factoTable, operaTable } from './exportCsv'
import { folioGroups, operaTotals, type DuplicateGroup, type FactoResult, type OperaResult } from './reconcile'

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
