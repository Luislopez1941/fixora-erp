import { serialToText, type FactoResult, type OperaResult } from './reconcile'
import { saveBlob } from './download'

export const FACTO_STATUS: Record<FactoResult['status'], { label: string; tone: string }> = {
  conciliada: { label: 'Conciliada', tone: 'ok' },
  diferencia: { label: 'Diferencia de monto', tone: 'warn' },
  ambigua: { label: 'Ambigua', tone: 'info' },
  'sin-opera': { label: 'Sin OPERA', tone: 'danger' },
  'sin-reserva': { label: 'Sin reserva', tone: 'muted' },
  'fuera-periodo': { label: 'Fuera de periodo', tone: 'muted' },
  pago: { label: 'Complemento de pago', tone: 'muted' },
  cancelada: { label: 'Cancelada', tone: 'muted' },
}

export const OPERA_STATUS: Record<OperaResult['status'], { label: string; tone: string }> = {
  conciliada: { label: 'Conciliada', tone: 'ok' },
  diferencia: { label: 'Diferencia de monto', tone: 'warn' },
  'sin-facto': { label: 'Sin factura', tone: 'danger' },
  'solo-pago': { label: 'Solo pago', tone: 'muted' },
}

/** CSV con BOM para que Excel respete acentos. */
export const downloadCsv = (fileName: string, header: string[], rows: (string | number)[][]) => {
  const esc = (v: string | number) => {
    let s = String(v ?? '')
    // Un texto que empieza con = + - @ (o tab/retorno) Excel lo ejecuta como fórmula al abrir el CSV:
    // un nombre de huésped o razón social así podría inyectar fórmulas. Se antepone ' para que quede como texto.
    if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s) && !/^(-?\d+(\.\d+)?|-+)$/.test(s)) s = `'${s}`
    return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = '﻿' + [header, ...rows].map((r) => r.map(esc).join(',')).join('\n')
  saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), fileName)
}

export const FACTO_HEADER = ['Fila Facto', 'Estatus conciliación', 'Método', 'Serie-Folio', 'Centro de consumo', 'Fecha', 'ID ÚNICO', 'UUID', 'Reserva', 'Confirmación OPERA', 'Folios OPERA', 'Total Facto', 'Total pagado Facto', 'Monto comparado Facto', 'Total OPERA', 'Diferencia', 'Validación de la factura', 'Observaciones']
/** Columnas con importes (base 0) de FACTO_HEADER. */
export const FACTO_MONEY = [11, 12, 13, 14, 15]

export const factoTable = (facto: FactoResult[]) =>
  facto.map((r) => [
    r.facto.excelRow, FACTO_STATUS[r.status].label, r.method, r.facto.serieFolio, r.facto.centro, serialToText(r.facto.fecha), r.facto.idUnico, r.facto.uuid,
    r.facto.reserva, r.confirmacion, r.opera.map((o) => o.folioOpera).join(' + '), r.facto.total, r.facto.totalPagado, r.factoAmount, r.opera.length ? r.operaTotal : '', r.opera.length ? r.diff : '',
    r.facto.checks.join(' | '),
    [...r.notes, ...(r.candidates.length ? [`Candidatos: ${r.candidates.map((o) => `${o.folioOpera} (${o.totalIngresos || o.totalPago})`).join(', ')}`] : [])].join(' | '),
  ])

export const OPERA_HEADER = ['Fila OPERA', 'Estatus conciliación', 'Confirmación', 'Veces en OPERA', 'Habitación', 'Folio OPERA', 'CONCAT', 'UUID en OPERA', 'Estatus factura en OPERA', 'Cajero', 'Fecha', 'Total ingresos', 'Total pago', 'Total pagado', 'CXC', 'Factura Facto', 'Total Facto']
export const OPERA_MONEY = [11, 12, 13, 14, 16]

export const operaTable = (opera: OperaResult[]) =>
  opera.map((r) => [
    r.opera.excelRow, OPERA_STATUS[r.status].label, r.opera.confirmacion, r.repeated, r.opera.habitacion, r.opera.folioOpera, r.opera.concat, r.opera.uuid, r.opera.estatusFactura, r.opera.cashier,
    serialToText(r.opera.fecha), r.opera.totalIngresos, r.opera.totalPago, r.opera.totalPagado, r.opera.cxc, r.facto ? r.facto.serieFolio || r.facto.idUnico : '', r.facto ? r.facto.total : '',
  ])

export const exportFacto = (facto: FactoResult[]) => downloadCsv('conciliacion-facto.csv', FACTO_HEADER, factoTable(facto))

export const exportOpera = (opera: OperaResult[]) => downloadCsv('conciliacion-opera.csv', OPERA_HEADER, operaTable(opera))
