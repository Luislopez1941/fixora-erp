import React, { useCallback, useEffect, useState } from 'react'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import { showToast } from '../../../../utils/toast'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import PosModal from '../../shared/pos-modal/PosModal'
import { dateTime, errorText, money } from '../../shared/restaurantTypes'
import '../../cocina/shared/kitchen.css'

interface WalletRow {
  customerId: number
  name: string
  phone: string | null
  balance: number
  updatedAt: string
}

interface Movement {
  id: number
  type: string
  amount: number
  balanceAfter: number
  note: string | null
  createdAt: string
}

const TYPE: Record<string, string> = { EARN: 'Acumuló', REDEEM: 'Pagó con monedero', ADJUST: 'Ajuste', REFUND: 'Devolución' }

/** Monedero de los clientes: el % que acumulan al pagar, sus saldos, movimientos y ajustes manuales. */
const Cashback: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.clientes-y-lealtad-cashback.view')
  const canManage = can('restaurants.manage') || can('restaurants.update')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [config, setConfig] = useState({ enabled: true, earnPercent: 5 })
  const [percent, setPercent] = useState('5')
  const [rows, setRows] = useState<WalletRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<{ row: WalletRow; movements: Movement[]; amount: string; note: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!canView) return setLoading(false)
    try {
      const [c, w]: any[] = await Promise.all([APIs.getWalletConfig(), APIs.getWallets(search.trim() || undefined)])
      const cfg = { enabled: c?.data?.enabled ?? true, earnPercent: Number(c?.data?.earnPercent ?? 5) }
      setConfig(cfg)
      setPercent(String(cfg.earnPercent))
      setRows(w?.data ?? [])
      setError('')
    } catch (e) {
      setError(errorText(e, 'No se pudo cargar el monedero.'))
    } finally {
      setLoading(false)
    }
  }, [canView, search])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const saveConfig = async (next: Partial<typeof config>) => {
    setBusy(true)
    try {
      const res: any = await APIs.setWalletConfig(next)
      setConfig({ enabled: res?.data?.enabled, earnPercent: Number(res?.data?.earnPercent) })
      showToast({ type: 'success', title: 'Monedero actualizado' })
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo guardar', text: errorText(e, 'Intenta de nuevo.') })
    } finally {
      setBusy(false)
    }
  }

  const open = async (row: WalletRow) => {
    try {
      const res: any = await APIs.getCustomerWallet(row.customerId)
      setDetail({ row, movements: res?.data?.movements ?? [], amount: '', note: '' })
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo abrir', text: errorText(e, 'Intenta de nuevo.') })
    }
  }

  const adjust = async () => {
    if (!detail) return
    setBusy(true)
    try {
      const res: any = await APIs.adjustCustomerWallet(detail.row.customerId, Number(detail.amount), detail.note)
      const balance = Number(res?.data?.balance ?? detail.row.balance)
      setDetail({ ...detail, row: { ...detail.row, balance }, movements: res?.data?.movements ?? detail.movements, amount: '', note: '' })
      showToast({ type: 'success', title: 'Saldo ajustado' })
      load()
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo ajustar', text: errorText(e, 'Intenta de nuevo.') })
    } finally {
      setBusy(false)
    }
  }

  const total = rows.reduce((a, r) => a + r.balance, 0)

  return (
    <RestaurantPage
      title='Cashback'
      subtitle='Monedero de los clientes'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading && !rows.length}
      error={error}
      onRetry={load}
      compact
      toolbar={
        <>
          <label className='pos-field'>
            Buscar cliente
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Nombre o teléfono' />
          </label>
          <div className='pos-field'>
            Acumula
            <div className='pos-chips' style={{ alignItems: 'center' }}>
              <button
                type='button'
                className={`pos-chip ${config.enabled ? 'is-active' : ''}`}
                aria-pressed={config.enabled}
                disabled={!canManage || busy}
                onClick={() => saveConfig({ enabled: !config.enabled })}
              >
                {config.enabled ? 'Activo' : 'Pausado'}
              </button>
              <input
                aria-label='Porcentaje que acumula'
                type='number'
                min={0}
                max={50}
                step={0.5}
                style={{ width: 72 }}
                value={percent}
                disabled={!canManage || busy}
                onChange={(e) => setPercent(e.target.value)}
                onBlur={() => Number(percent) !== config.earnPercent && saveConfig({ earnPercent: Number(percent) || 0 })}
              />
              <span className='pos-note'>% de lo pagado</span>
            </div>
          </div>
        </>
      }
    >
      <p className='kv-summary'>
        <strong>{rows.length}</strong> clientes con monedero · saldo total <strong>{money(total)}</strong>
      </p>
      {!rows.length ? (
        <p className='restaurant-empty'>
          Aún no hay saldos. En el POS asigna un cliente a la cuenta (botón «Cliente») y al cobrar acumula el {config.earnPercent} % de lo que paga.
        </p>
      ) : (
        <div className='kv-scroll'>
          <table className='kv-table'>
            <thead>
              <tr>
                <th>Cliente</th>
                <th className='kv-hide-sm'>Último movimiento</th>
                <th className='num'>Saldo</th>
                <th aria-label='Acciones' />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.customerId}>
                  <td>
                    <strong>{r.name}</strong>
                    {r.phone ? <small>{r.phone}</small> : null}
                  </td>
                  <td className='kv-hide-sm'>{dateTime(r.updatedAt)}</td>
                  <td className='num'><strong>{money(r.balance)}</strong></td>
                  <td>
                    <div className='kv-row-actions'>
                      <button type='button' className='btn__general-gray' onClick={() => open(r)}>Ver</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail ? (
        <PosModal title={detail.row.name} onClose={() => setDetail(null)} wide>
          <p className='kv-summary'>
            Saldo <strong>{money(detail.row.balance)}</strong>
          </p>
          {canManage ? (
            <div className='pos-row' style={{ alignItems: 'end' }}>
              <label className='pos-field'>
                Ajuste (+ suma, − resta)
                <input type='number' step={0.01} value={detail.amount} onChange={(e) => setDetail({ ...detail, amount: e.target.value })} placeholder='Ej. 50 o -20' />
              </label>
              <label className='pos-field'>
                Motivo
                <input value={detail.note} maxLength={255} onChange={(e) => setDetail({ ...detail, note: e.target.value })} placeholder='Cortesía por cumpleaños' />
              </label>
              <button type='button' className='btn__general-purple' disabled={busy || !Number(detail.amount) || !detail.note.trim()} onClick={adjust}>
                Aplicar
              </button>
            </div>
          ) : null}
          <table className='kv-table'>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Movimiento</th>
                <th className='num'>Monto</th>
                <th className='num'>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {detail.movements.map((m) => (
                <tr key={m.id}>
                  <td>{dateTime(m.createdAt)}</td>
                  <td>
                    {TYPE[m.type] ?? m.type}
                    {m.note ? <small>{m.note}</small> : null}
                  </td>
                  <td className={`num ${m.amount < 0 ? 'kv-late' : 'kv-ok'}`}>{m.amount < 0 ? '−' : '+'}{money(Math.abs(m.amount))}</td>
                  <td className='num'>{money(m.balanceAfter)}</td>
                </tr>
              ))}
              {!detail.movements.length ? (
                <tr><td colSpan={4}>Sin movimientos.</td></tr>
              ) : null}
            </tbody>
          </table>
        </PosModal>
      ) : null}
    </RestaurantPage>
  )
}

export default Cashback
