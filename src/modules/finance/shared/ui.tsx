import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import APIs from '../../../services/APIs'
import './Accounting.css'

export const unwrap = (response: any): any[] => (Array.isArray(response) ? response : response?.data ?? [])

export const errorText = (error: any, fallback: string) => {
  const message = error?.response?.data?.message
  return (Array.isArray(message) ? message.join(', ') : message) || fallback
}

/** Importe con separador de miles y 2 decimales (los importes llegan como texto decimal). */
export const money = (value: string | number | null | undefined) =>
  Number(value ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Texto decimal → entero en diezmilésimos, para sumar y comparar sin errores de punto flotante. */
export const toUnits = (value: string | number | null | undefined) => Math.round(Number(value || 0) * 10000)

export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const monthStart = () => { const d = new Date(); return isoDate(new Date(d.getFullYear(), d.getMonth(), 1)) }
export const today = () => isoDate(new Date())
export const dateText = (value?: string | null) => (value ? String(value).slice(0, 10).split('-').reverse().join('/') : '')

export const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export const ACCOUNT_TYPES: Record<string, string> = {
  ASSET: 'Activo', LIABILITY: 'Pasivo', EQUITY: 'Capital', INCOME: 'Ingresos', COST: 'Costos', EXPENSE: 'Gastos',
}
export const ENTRY_STATUS: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: 'Borrador', tone: 'warn' },
  POSTED: { label: 'Contabilizada', tone: 'ok' },
  REVERSED: { label: 'Anulada', tone: 'bad' },
}

/** Empresa de trabajo: la activa de la sesión, o la única que tenga. */
export const useAccountingCompany = () => {
  const user = useSelector((state: any) => state.user)
  const [companies, setCompanies] = useState<any[]>([])
  const [companyId, setCompanyId] = useState(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const response: any = await APIs.getCompaniesByUser(user?.id || 1)
        const list = unwrap(response)
        if (!alive) return
        setCompanies(list)
        const initial = list.length === 1 ? list[0].id : user?.activeCompanyId && list.some((c: any) => c.id === user.activeCompanyId) ? user.activeCompanyId : list[0]?.id ?? 0
        setCompanyId(initial)
      } catch (error) {
        console.error('Error al cargar empresas', error)
      }
    })()
    return () => { alive = false }
  }, [user?.id, user?.activeCompanyId])

  return { companies, companyId, setCompanyId }
}

interface PageProps {
  title: string
  subtitle: string
  companies: any[]
  companyId: number
  onCompany: (id: number) => void
  filters?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}

/** Marco común de todas las pantallas: título, selector de empresa, filtros y acciones. */
export const AccPage: React.FC<PageProps> = ({ title, subtitle, companies, companyId, onCompany, filters, actions, children }) => (
  <div className='acc'>
    <div className='acc__container'>
      <div className='acc__header'>
        <div className='acc__title'>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className='acc__filters'>
          {companies.length > 1 && (
            <div className='acc__field'>
              <label>Empresa</label>
              <select className='inputs__general' value={companyId} onChange={(e) => onCompany(Number(e.target.value))}>
                {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          {filters}
          {actions}
        </div>
      </div>
      {companyId ? children : <div className='acc__empty'>Elige una empresa para continuar.</div>}
    </div>
  </div>
)

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const meta = ENTRY_STATUS[status] ?? { label: status, tone: '' }
  return <span className={`acc__badge ${meta.tone ? `acc__badge--${meta.tone}` : ''}`}>{meta.label}</span>
}

/** Carga las cuentas de la empresa (catálogo completo). */
export const useAccounts = (companyId: number) => {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const reload = React.useCallback(async () => {
    if (!companyId) return setAccounts([])
    setLoading(true)
    try {
      setAccounts(unwrap(await APIs.getAccounts(companyId)))
    } catch (error) {
      console.error('Error al cargar cuentas', error)
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }, [companyId])
  useEffect(() => { reload() }, [reload])
  return { accounts, loading, reload }
}

/** Pólizas del rango con sus líneas (para libro diario y mayor). Pide el detalle por tandas para no saturar la conexión. */
export const useEntriesWithLines = (companyId: number, from: string, to: string) => {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!companyId) { setEntries([]); return }
    let alive = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const list = unwrap(await APIs.getJournalEntries(companyId, { from, to })).filter((e: any) => e.status !== 'DRAFT')
        const detailed: any[] = []
        for (let i = 0; i < list.length; i += 5) {
          const batch = await Promise.all(list.slice(i, i + 5).map(async (e: any) => {
            const detail: any = await APIs.getJournalEntry(e.id)
            return detail?.data ?? detail
          }))
          detailed.push(...batch)
          if (!alive) return
        }
        if (alive) setEntries(detailed.sort((a, b) => String(a.entryDate).localeCompare(String(b.entryDate)) || Number(a.entryNumber) - Number(b.entryNumber)))
      } catch (e) {
        if (alive) { setEntries([]); setError(errorText(e, 'No se pudieron cargar las pólizas.')) }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [companyId, from, to, tick])

  return { entries, loading, error, reload: () => setTick((t) => t + 1) }
}
