import React, { useEffect, useMemo, useRef, useState } from 'react'
import APIs from '../../../../../services/APIs'
import PosModal from '../../../shared/pos-modal/PosModal'
import { Tab, errorText, money, tabTitle } from '../../../shared/restaurantTypes'
import './ModalCharge.css'

interface Props {
  tab: Tab
  companyId: number
  branchId: number
  busy: boolean
  onClose: () => void
  onCharge: (data: { payments: { paymentMethodId?: number; amount: number; reference?: string }[]; discount: number; tip: number; tipMethodId?: number }) => void
}

interface Method {
  id: number
  name: string
  code: string
}

interface Row {
  key: number
  methodId: number | null
  amount: number
  reference: string
  /** Mientras no lo toquen, el monto sigue al total por cobrar */
  auto: boolean
}

interface Totals {
  subtotal: number
  discount: number
  tax: number
  total: number
}

const TIP_PERCENTS = [0, 10, 15, 20]
const round2 = (n: number) => Math.round(n * 100) / 100
const BILLS = [100, 200, 500, 1000]

/**
 * Cobro de la cuenta: total exacto del servidor (con descuento e IVA), propina aparte, uno o varios pagos y cambio.
 * El cambio solo sale del efectivo; con tarjeta o transferencia el monto es exacto.
 */
const ModalCharge: React.FC<Props> = ({ tab, companyId, branchId, busy, onClose, onCharge }) => {
  const [methods, setMethods] = useState<Method[]>([])
  const [allowDiscount, setAllowDiscount] = useState(true)
  const [discount, setDiscount] = useState(0)
  const [totals, setTotals] = useState<Totals | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tipPercent, setTipPercent] = useState<number | null>(0)
  const [tipCustom, setTipCustom] = useState(0)
  const [tipMethodId, setTipMethodId] = useState<number | null>(null)
  const [rows, setRows] = useState<Row[]>([{ key: 1, methodId: null, amount: 0, reference: '', auto: true }])
  const nextKey = useRef(2)
  // Monedero del cliente de la cuenta: saldo, % que acumula y su forma de pago
  const [wallet, setWallet] = useState<{ balance: number; enabled: boolean; earnPercent: number; methodId: number } | null>(null)

  useEffect(() => {
    if (!tab.customerId) return setWallet(null)
    let cancelled = false
    Promise.all([APIs.getCustomerWallet(tab.customerId), APIs.getWalletPaymentMethod()])
      .then(([w, m]: any[]) => {
        if (cancelled) return
        setWallet({ balance: Number(w?.data?.balance ?? 0), enabled: w?.data?.config?.enabled ?? true, earnPercent: Number(w?.data?.config?.earnPercent ?? 0), methodId: Number(m?.data?.id) })
      })
      .catch(() => !cancelled && setWallet(null))
    return () => {
      cancelled = true
    }
  }, [tab.customerId])

  // Formas de pago y si la sucursal deja aplicar descuento
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [cfg, res]: any[] = await Promise.all([
          APIs.getPosConfig(companyId, branchId).catch(() => null),
          APIs.getPaymentMethods(companyId, branchId),
        ])
        if (cancelled) return
        if (cfg?.data?.allowManualDiscount === false) setAllowDiscount(false)
        const list: Method[] = (Array.isArray(res?.data) ? res.data : []).filter((m: any) => m.active !== false)
        setMethods(list)
        const cash = list.find((m) => m.code === 'CASH') ?? list[0]
        setRows((r) => r.map((x, i) => (i === 0 && x.methodId == null ? { ...x, methodId: cash?.id ?? null } : x)))
      } catch {
        /* sin formas de pago: el servidor cobra en efectivo */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [companyId, branchId])

  // Total exacto (lo calcula Ventas); se recalcula al cambiar el descuento
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res: any = await APIs.previewRestaurantTab(tab.id, discount || undefined)
        if (!cancelled) {
          setTotals(res?.data ?? null)
          setError('')
        }
      } catch (e) {
        if (!cancelled) setError(errorText(e, 'No se pudo calcular el total.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [tab.id, discount])

  const total = totals?.total ?? 0
  const tip = round2(tipPercent == null ? tipCustom : (total * tipPercent) / 100)
  const due = round2(total + tip)
  const paid = round2(rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0))
  const methodOf = (r: Row) => methods.find((m) => m.id === r.methodId)
  const isWallet = (r: Row) => !!wallet && r.methodId === wallet.methodId
  const isCash = (r: Row) => !isWallet(r) && (!r.methodId || methodOf(r)?.code === 'CASH')
  const cashPaid = round2(rows.filter(isCash).reduce((acc, r) => acc + (Number(r.amount) || 0), 0))
  const missing = round2(Math.max(0, due - paid))
  const change = round2(Math.max(0, paid - due))
  const changeOk = change <= cashPaid
  const walletPaid = round2(rows.filter(isWallet).reduce((acc, r) => acc + (Number(r.amount) || 0), 0))
  const walletOk = !wallet || walletPaid <= wallet.balance + 0.001
  const walletEarn = wallet?.enabled ? round2(((total - walletPaid) * wallet.earnPercent) / 100) : 0
  const useWallet = () => {
    if (!wallet || wallet.balance <= 0 || rows.some(isWallet)) return
    const amount = round2(Math.min(wallet.balance, total))
    // Lo que falta después del monedero se cobra con la primera forma de pago; las demás quedan en cero
    const rest = round2(Math.max(0, due - amount))
    setRows((list) => [{ key: nextKey.current++, methodId: wallet.methodId, amount, reference: '', auto: false }, ...list.map((r, i) => ({ ...r, auto: true, amount: i === 0 ? rest : 0 }))])
  }

  // Los montos automáticos siguen a lo que falta por cobrar
  useEffect(() => {
    setRows((list) => {
      const fixed = round2(list.filter((r) => !r.auto).reduce((acc, r) => acc + (Number(r.amount) || 0), 0))
      const autos = list.filter((r) => r.auto)
      if (!autos.length) return list
      const rest = round2(Math.max(0, due - fixed))
      const last = autos[autos.length - 1]
      return list.map((r) => (r.auto ? { ...r, amount: r === last ? rest : 0 } : r))
    })
  }, [due])

  const update = (key: number, patch: Partial<Row>) => setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  const addRow = () => {
    const other = methods.find((m) => m.code !== 'CASH' && !rows.some((r) => r.methodId === m.id)) ?? methods[0]
    setRows((list) => [...list.map((r) => ({ ...r, auto: false })), { key: nextKey.current++, methodId: other?.id ?? null, amount: missing, reference: '', auto: true }])
  }
  const removeRow = (key: number) => setRows((list) => (list.length > 1 ? list.filter((r) => r.key !== key) : list))

  const usedMethods = useMemo(() => {
    const ids = [...new Set(rows.map((r) => r.methodId))]
    return ids.map((id) => methods.find((m) => m.id === id)).filter(Boolean) as Method[]
  }, [rows, methods])
  const effectiveTipMethod = tip > 0 ? (tipMethodId && usedMethods.some((m) => m.id === tipMethodId) ? tipMethodId : usedMethods[0]?.id ?? null) : null

  const canCharge = !!totals && !loading && !error && missing === 0 && changeOk && walletOk && !busy

  const submit = () => {
    if (!canCharge) return
    onCharge({
      payments: rows.filter((r) => Number(r.amount) > 0).map((r) => ({ paymentMethodId: r.methodId ?? undefined, amount: round2(Number(r.amount)), reference: r.reference.trim() || undefined })),
      discount: round2(discount),
      tip,
      tipMethodId: effectiveTipMethod ?? undefined,
    })
  }

  return (
    <PosModal
      title={`Cobrar · ${tabTitle(tab)}`}
      onClose={onClose}
      wide
      actions={
        <>
          <button type='button' className='btn__general-secondary' onClick={onClose}>Volver</button>
          <button type='button' className='btn__general-purple charge__submit' disabled={!canCharge} onClick={submit}>
            {busy ? 'Cobrando…' : `Cobrar ${money(due)}`}
          </button>
        </>
      }
    >
      {error ? <p className='pos-error'>{error}</p> : null}

      <div className='charge__summary' aria-live='polite'>
        <div><span>Subtotal</span><strong>{totals ? money(totals.subtotal) : '…'}</strong></div>
        {totals?.discount ? <div><span>Descuento</span><strong>-{money(totals.discount)}</strong></div> : null}
        <div><span>IVA</span><strong>{totals ? money(totals.tax) : '…'}</strong></div>
        <div className='is-total'><span>Total</span><strong>{totals ? money(totals.total) : '…'}</strong></div>
      </div>

      <div className='pos-row'>
        {allowDiscount ? (
          <label className='pos-field'>
            Descuento (antes de IVA)
            <input
              id='restaurant-charge-discount'
              type='number'
              inputMode='decimal'
              min={0}
              step={0.01}
              value={discount || ''}
              placeholder='0.00'
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
        ) : null}
        <div className='pos-field'>
          Propina (aparte del total)
          <div className='pos-chips'>
            {TIP_PERCENTS.map((p) => (
              <button key={p} type='button' className={`pos-chip ${tipPercent === p ? 'is-active' : ''}`} onClick={() => setTipPercent(p)}>
                {p ? `${p}%` : 'Sin propina'}
              </button>
            ))}
            <button type='button' className={`pos-chip ${tipPercent == null ? 'is-active' : ''}`} onClick={() => setTipPercent(null)}>
              Otra
            </button>
          </div>
          {tipPercent == null ? (
            <input
              id='restaurant-charge-tip'
              type='number'
              inputMode='decimal'
              min={0}
              step={0.01}
              value={tipCustom || ''}
              placeholder='Monto de la propina'
              onChange={(e) => setTipCustom(Math.max(0, Number(e.target.value) || 0))}
            />
          ) : null}
        </div>
      </div>

      <div className='pos-field'>
        Pagos
        <div className='charge__rows'>
          {rows.map((r) => (
            <div key={r.key} className='charge__row'>
              <select
                aria-label='Forma de pago'
                value={r.methodId ?? ''}
                onChange={(e) => update(r.key, { methodId: Number(e.target.value) || null })}
              >
                {!methods.length ? <option value=''>Efectivo</option> : null}
                {isWallet(r) ? <option value={r.methodId ?? ''}>Monedero</option> : null}
                {methods.filter((m) => m.code !== 'WALLET').map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <input
                type='number'
                inputMode='decimal'
                min={0}
                step={0.01}
                aria-label='Monto'
                value={r.amount || ''}
                onChange={(e) => update(r.key, { amount: Math.max(0, Number(e.target.value) || 0), auto: false })}
              />
              {isWallet(r) ? (
                <span className='pos-note'>Saldo disponible {money(wallet?.balance ?? 0)}</span>
              ) : !isCash(r) ? (
                <input aria-label='Referencia' placeholder='Referencia / autorización' value={r.reference} maxLength={100} onChange={(e) => update(r.key, { reference: e.target.value })} />
              ) : (
                <div className='charge__bills'>
                  {BILLS.filter((b) => b >= due / 4).slice(0, 3).map((b) => (
                    <button key={b} type='button' className='pos-chip' onClick={() => update(r.key, { amount: b, auto: false })}>
                      ${b}
                    </button>
                  ))}
                  <button type='button' className='pos-chip' onClick={() => update(r.key, { amount: round2(Number(r.amount) + missing), auto: false })} disabled={!missing}>
                    Exacto
                  </button>
                </div>
              )}
              {rows.length > 1 ? (
                <button type='button' className='charge__remove' aria-label='Quitar pago' onClick={() => removeRow(r.key)}>
                  <span className='material-symbols-rounded'>close</span>
                </button>
              ) : null}
            </div>
          ))}
        </div>
        <div className='charge__extra'>
          <button type='button' className='btn__general-secondary charge__add' onClick={addRow} disabled={!methods.length}>
            <span className='material-symbols-rounded'>add</span> Agregar otra forma de pago
          </button>
          {wallet && wallet.balance > 0 && !rows.some(isWallet) ? (
            <button type='button' className='btn__general-secondary charge__add' onClick={useWallet}>
              <span className='material-symbols-rounded'>account_balance_wallet</span> Usar monedero · {money(wallet.balance)}
            </button>
          ) : null}
        </div>
        {!walletOk ? <p className='pos-error'>El cliente solo tiene {money(wallet?.balance ?? 0)} en su monedero.</p> : null}
        {tab.customerId && walletEarn > 0 ? <p className='pos-note'>Con este pago acumula {money(walletEarn)} en su monedero ({wallet?.earnPercent} %).</p> : null}
        {!tab.customerId ? <p className='pos-note'>Asigna un cliente a la cuenta (botón «Cliente») para que acumule o use su monedero.</p> : null}
      </div>

      {tip > 0 && usedMethods.length > 1 ? (
        <label className='pos-field'>
          La propina la dejó en
          <select value={effectiveTipMethod ?? ''} onChange={(e) => setTipMethodId(Number(e.target.value) || null)}>
            {usedMethods.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </label>
      ) : null}

      <div className='charge__balance' aria-live='polite'>
        <div><span>A cobrar{tip ? ' (con propina)' : ''}</span><strong>{money(due)}</strong></div>
        <div><span>Recibido</span><strong>{money(paid)}</strong></div>
        {missing > 0 ? (
          <div className='is-missing'><span>Falta</span><strong>{money(missing)}</strong></div>
        ) : (
          <div className={changeOk ? 'is-change' : 'is-missing'}><span>{changeOk ? 'Cambio' : 'El cambio solo sale del efectivo'}</span><strong>{money(change)}</strong></div>
        )}
      </div>
    </PosModal>
  )
}

export default ModalCharge
