/** Utilidades de Almacén › Existencias: formato de cantidades, estados, CSV y exportación de todas las páginas. */
export const qty = (n: number | null | undefined) => Number(n ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 4 })

export const money = (n: number | null | undefined) =>
  Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })

export const dateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

/** AAAA-MM-DD → "18 oct 2026" (sin desfase de zona horaria). */
export const dateShort = (ymd?: string | null) =>
  ymd ? new Date(`${ymd.slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

const pad = (n: number) => String(n).padStart(2, '0')
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Días desde hoy hasta una fecha AAAA-MM-DD (negativo = ya pasó). */
export const daysUntil = (day?: string | null) => {
  if (!day) return null
  const today = new Date(`${ymd(new Date())}T12:00:00`).getTime()
  return Math.round((new Date(`${day.slice(0, 10)}T12:00:00`).getTime() - today) / 86400000)
}

export const errorText = (error: any, fallback: string) => {
  const message = error?.response?.data?.message ?? error?.message
  return (Array.isArray(message) ? message.join(', ') : message) || fallback
}

export const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem('categories-picker-company-id'))
  return !Number.isNaN(id) && id > 0 ? id : null
}

export type StockStatus = 'disponible' | 'stock_bajo' | 'agotado' | 'sin_rastreo' | 'sobre_maximo' | 'faltante'

export const STATUS: Record<string, { label: string; tone: 'ok' | 'warn' | 'bad' | 'muted' | 'info' }> = {
  disponible: { label: 'Disponible', tone: 'ok' },
  stock_bajo: { label: 'Stock bajo', tone: 'warn' },
  agotado: { label: 'Agotado', tone: 'bad' },
  faltante: { label: 'Faltante', tone: 'bad' },
  sobre_maximo: { label: 'Sobre máximo', tone: 'info' },
  sin_rastreo: { label: 'Sin rastreo', tone: 'muted' },
}

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

/** Para exportar: pide todas las páginas del reporte con los mismos filtros (máx. 5,000 renglones). */
export async function fetchAllRows<T = any>(fetchPage: (page: number) => Promise<any>, max = 5000): Promise<{ rows: T[]; data: any }> {
  const first: any = await fetchPage(1)
  const data = first?.data ?? {}
  const rows: T[] = [...(data.rows ?? [])]
  const pages = Math.min(data.pagination?.pages ?? 1, Math.ceil(max / 100))
  for (let p = 2; p <= pages; p++) {
    const res: any = await fetchPage(p)
    rows.push(...(res?.data?.rows ?? []))
  }
  return { rows, data }
}
