/** Utilidades comunes de Cortes y arqueos (Arqueo, Diferencias, Historial de cortes): formato, fechas, resultados y CSV. */
export const money = (n: number | null | undefined) =>
  Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })

export const dateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

const pad = (n: number) => String(n).padStart(2, '0')
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const errorText = (error: any, fallback: string) => {
  // El cliente de API (configurationAPIs) rechaza con { message, code }; axios directo trae response.data.message
  const message = error?.response?.data?.message ?? error?.message
  return (Array.isArray(message) ? message.join(', ') : message) || fallback
}

export const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem('categories-picker-company-id'))
  return !Number.isNaN(id) && id > 0 ? id : null
}

/** Atajos de periodo (hora local). */
export const RANGES: { key: string; label: string; get: () => [string, string] }[] = [
  { key: 'today', label: 'Hoy', get: () => [ymd(new Date()), ymd(new Date())] },
  {
    key: 'week',
    label: 'Semana',
    get: () => {
      const d = new Date()
      const monday = new Date(d)
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      return [ymd(monday), ymd(d)]
    },
  },
  { key: 'month', label: 'Mes', get: () => { const d = new Date(); return [ymd(new Date(d.getFullYear(), d.getMonth(), 1)), ymd(d)] } },
  {
    key: 'prev',
    label: 'Mes anterior',
    get: () => {
      const d = new Date()
      return [ymd(new Date(d.getFullYear(), d.getMonth() - 1, 1)), ymd(new Date(d.getFullYear(), d.getMonth(), 0))]
    },
  },
]

export type CashResult = 'BALANCED' | 'OVER' | 'SHORT' | 'CANCELLED'

/** Cuadra si la diferencia está dentro de la tolerancia; si no, sobrante o faltante. */
export const resultOf = (c: { status?: string; difference: number | null; tolerance?: number | null }): CashResult => {
  if (c.status === 'CANCELLED') return 'CANCELLED'
  const diff = Number(c.difference ?? 0)
  const tol = Number(c.tolerance ?? 0)
  return Math.abs(diff) <= tol ? 'BALANCED' : diff > 0 ? 'OVER' : 'SHORT'
}

export const RESULT_LABEL: Record<CashResult, string> = { BALANCED: 'Cuadra', OVER: 'Sobrante', SHORT: 'Faltante', CANCELLED: 'Cancelado' }

/** CSV con BOM para que Excel respete acentos. */
export const downloadCsv = (fileName: string, header: string[], rows: (string | number | null | undefined)[][]) => {
  const esc = (v: unknown) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = '﻿' + [header, ...rows].map((r) => r.map(esc).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
