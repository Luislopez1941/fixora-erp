import React, { useCallback, useEffect, useState } from 'react'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
import { readCategoryBranchId } from '../../../../../constants/category'
import APIs from '../../../../../services/APIs'
import './AuditLog.css'

// Etiqueta legible de cada acción registrada por el backend
const ACTIONS: Record<string, { label: string; tone: 'info' | 'warn' | 'danger' }> = {
  SALE_CANCELLED: { label: 'Venta cancelada', tone: 'danger' },
  SALE_PRICE_OVERRIDE: { label: 'Precio cambiado a mano', tone: 'warn' },
  STOCK_ENTRY_EDITED: { label: 'Entrada editada', tone: 'warn' },
  STOCK_ENTRY_DELETED: { label: 'Entrada eliminada', tone: 'danger' },
  STOCK_TRANSFER_CREATED: { label: 'Transferencia', tone: 'info' },
  CASH_SHIFT_CLOSED: { label: 'Cierre de turno', tone: 'info' },
  CASH_SHIFT_CLOSED_OUT_OF_TOLERANCE: { label: 'Cierre fuera de tolerancia', tone: 'danger' },
  CASH_CONFIG_CHANGED: { label: 'Configuración de caja', tone: 'warn' },
  POS_CONFIG_CHANGED: { label: 'Configuración de cobro', tone: 'warn' },
  ITEM_PRICE_CHANGED: { label: 'Precio de artículo', tone: 'warn' },
  ITEM_DEACTIVATED: { label: 'Artículo desactivado', tone: 'warn' },
  ITEM_ACTIVATED: { label: 'Artículo activado', tone: 'info' },
  CATEGORY_AVAILABILITY_CHANGED: { label: 'Disponibilidad de categoría', tone: 'info' },
  BRANCH_DELETED: { label: 'Sucursal eliminada', tone: 'danger' },
  BRANCH_DEACTIVATED: { label: 'Sucursal desactivada', tone: 'warn' },
}

const ENTITIES = ['Sale', 'StockEntry', 'StockTransfer', 'CashShift', 'CashConfig', 'Item', 'Category', 'Branch', 'CompanyPosConfig', 'BranchPosConfig']

const PAGE_SIZE = 50

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })

const AuditLog: React.FC = () => {
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [branchId, setBranchId] = useState<number>(() => readCategoryBranchId())
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<number | null>(null)

  const fetchLog = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    try {
      const res: any = await APIs.getAuditLog({
        companyId,
        branchId: branchId > 0 ? branchId : undefined,
        entity: entity || undefined,
        action: action || undefined,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setRows(Array.isArray(res?.data) ? res.data : [])
      setTotal(Number(res?.total ?? 0))
    } catch {
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [companyId, branchId, entity, action, from, to, page])

  useEffect(() => {
    fetchLog()
  }, [fetchLog])

  // Al cambiar un filtro se vuelve a la primera página
  useEffect(() => {
    setPage(1)
  }, [companyId, branchId, entity, action, from, to])

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className='audit-log'>
      <div className='audit-log__container'>
        <div className='audit-log__header'>
          <CategoriesStorePicker
            branchId={branchId}
            onBranchIdChange={(id) => {
              setBranchId(id)
              localStorage.setItem('categories-store-id', String(id))
            }}
            onCompanyIdChange={(id) => setCompanyId(id)}
          />
          <select className='inputs__general audit-log__filter' value={action} onChange={(e) => setAction(e.target.value)} aria-label='Filtrar por acción'>
            <option value=''>Todas las acciones</option>
            {Object.entries(ACTIONS).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>
          <select className='inputs__general audit-log__filter' value={entity} onChange={(e) => setEntity(e.target.value)} aria-label='Filtrar por módulo'>
            <option value=''>Todos los módulos</option>
            {ENTITIES.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <input className='inputs__general audit-log__filter' type='date' value={from} onChange={(e) => setFrom(e.target.value)} aria-label='Desde' />
          <input className='inputs__general audit-log__filter' type='date' value={to} onChange={(e) => setTo(e.target.value)} aria-label='Hasta' />
        </div>

        <div className='audit-log__list'>
          <div className='audit-log__row audit-log__row--head'>
            <span>Fecha</span>
            <span>Acción</span>
            <span>Detalle</span>
            <span>Usuario</span>
            <span>Sucursal</span>
          </div>

          {loading ? (
            <TableSkeleton rowClassName='audit-log__row' cols={[{ width: '70%' }, { pill: true, width: '120px' }, { width: '80%' }, { width: '60%' }, { width: '50%' }]} />
          ) : rows.length > 0 ? (
            rows.map((r) => {
              const meta = ACTIONS[r.action] ?? { label: r.action, tone: 'info' as const }
              const open = openId === r.id
              return (
                <React.Fragment key={r.id}>
                  <button type='button' className='audit-log__row audit-log__row--item' onClick={() => setOpenId(open ? null : r.id)} aria-expanded={open}>
                    <span className='audit-log__cell audit-log__cell--muted'>{formatDate(r.createdAt)}</span>
                    <span className='audit-log__cell'>
                      <span className={`audit-log__badge audit-log__badge--${meta.tone}`}>{meta.label}</span>
                    </span>
                    <span className='audit-log__cell'>{r.summary ?? `${r.entity} #${r.entityId ?? ''}`}</span>
                    <span className='audit-log__cell audit-log__cell--muted'>{r.userName ?? '—'}</span>
                    <span className='audit-log__cell audit-log__cell--muted'>{r.branchName ?? '—'}</span>
                  </button>
                  {open && (
                    <div className='audit-log__detail'>
                      <div>
                        <strong>Antes</strong>
                        <pre>{r.before ? JSON.stringify(r.before, null, 2) : '—'}</pre>
                      </div>
                      <div>
                        <strong>Después</strong>
                        <pre>{r.after ? JSON.stringify(r.after, null, 2) : '—'}</pre>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              )
            })
          ) : (
            <div className='audit-log__state'>
              <p>No hay registros con esos filtros</p>
              <span>Aquí aparecen cancelaciones, cambios de precio, cierres de caja, ediciones de inventario y otras operaciones sensibles.</span>
            </div>
          )}
        </div>

        {total > PAGE_SIZE && (
          <div className='audit-log__pager'>
            <button type='button' className='btn__general-secondary' disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
            <span>Página {page} de {pages} · {total} registros</span>
            <button type='button' className='btn__general-secondary' disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Siguiente</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditLog
