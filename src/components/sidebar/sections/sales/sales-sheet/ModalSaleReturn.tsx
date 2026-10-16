import React, { useEffect, useMemo, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import APIs from '../../../../../services/APIs'
import './ModalSaleReturn.css'

type Props = {
  sale: any | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

type Mode = 'return' | 'cancel'

const REASONS = [
  'Producto defectuoso o dañado',
  'No era lo que el cliente quería',
  'Producto equivocado',
  'Error de captura al cobrar',
  'El cliente ya no lo necesita',
  'Otro',
]

const money = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0)

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

const errorText = (error: any, fallback: string) => {
  const message = error?.response?.data?.message ?? error?.message
  return (Array.isArray(message) ? message.join(', ') : message) || fallback
}

/**
 * Cancelar la venta completa o devolver artículos (total o parcial). El dinero regresa por la forma de pago con la que se
 * cobró; el efectivo sale de la caja del turno abierto. Lo que se muestra del reembolso es un cálculo de ayuda: el servidor
 * hace el reparto definitivo.
 */
const ModalSaleReturn: React.FC<Props> = ({ sale, open, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any | null>(null)
  const [mode, setMode] = useState<Mode>('return')
  const [qty, setQty] = useState<Record<number, string>>({})
  const [disposition, setDisposition] = useState<Record<number, 'RESTOCK' | 'WASTE'>>({})
  const [reason, setReason] = useState(REASONS[0])
  const [notes, setNotes] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Una llave por intento evita duplicar el reembolso si la petición se repite
  const attemptKey = useRef('')

  useEffect(() => {
    if (!open || !sale) return
    let alive = true
    setLoading(true)
    setError('')
    setData(null)
    setQty({})
    setDisposition({})
    setReason(REASONS[0])
    setNotes('')
    setConfirming(false)
    attemptKey.current = `${sale.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    APIs.getSaleReturnsOverview(sale.id)
      .then((response: any) => {
        if (!alive) return
        const payload = response?.data ?? response
        setData(payload)
        setMode(payload?.rules?.canReturn ? 'return' : 'cancel')
      })
      .catch((e: any) => alive && setError(errorText(e, 'No se pudo cargar la venta.')))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [open, sale])

  const lines: any[] = data?.lines ?? []
  const rules = data?.rules

  const requested = useMemo(() => {
    if (mode === 'cancel') return lines.map((l) => ({ line: l, quantity: l.quantity }))
    return lines
      .map((l) => ({ line: l, quantity: Number(qty[l.id] || 0) }))
      .filter((r) => r.quantity > 0)
  }, [lines, qty, mode])

  const total = useMemo(
    () => round2(requested.reduce((acc, r) => acc + r.quantity * r.line.unitRefund, 0)),
    [requested],
  )
  // Cuando se devuelve todo lo que queda, el servidor ajusta los centavos al total exacto
  const closesSale = lines.length > 0 && lines.every((l) => (requested.find((r) => r.line.id === l.id)?.quantity ?? 0) >= l.returnable)
  const exactTotal = closesSale && data ? round2(data.sale.total - (data.returns ?? []).reduce((a: number, r: any) => a + r.total, 0)) : total

  // Reparto estimado: primero la deuda del cliente, el resto por la forma de pago original
  const split = useMemo(() => {
    const amount = mode === 'cancel' ? exactTotal : exactTotal
    const debt = Math.min(amount, Math.max(0, data?.creditRemaining ?? 0))
    const money_ = round2(amount - debt)
    const open_ = (data?.payments ?? []).filter((p: any) => p.refundable > 0)
    const capacity = open_.reduce((a: number, p: any) => a + p.refundable, 0)
    const parts = open_.map((p: any) => ({ ...p, amount: capacity > 0 ? round2((money_ * p.refundable) / capacity) : 0 }))
    return { debt, parts }
  }, [exactTotal, data, mode])

  const cashOut = split.parts.filter((p: any) => p.code === 'CASH').reduce((a: number, p: any) => a + p.amount, 0)
  const needsOverride = !!rules?.outsideWindow || (rules?.returnSupervisorAmount != null && exactTotal > rules.returnSupervisorAmount)
  const blockedByOverride = needsOverride && !rules?.canOverride

  const setLineQty = (line: any, value: string) => {
    const clean = value.replace(',', '.')
    if (clean !== '' && !/^\d*\.?\d{0,4}$/.test(clean)) return
    const n = Number(clean)
    if (Number.isFinite(n) && n > line.returnable) {
      setQty((prev) => ({ ...prev, [line.id]: String(line.returnable) }))
      return
    }
    setQty((prev) => ({ ...prev, [line.id]: clean }))
  }

  const canSubmit =
    !saving &&
    !!data &&
    !blockedByOverride &&
    (mode === 'cancel' ? !!rules?.canCancel : !!rules?.canReturn && requested.length > 0 && exactTotal > 0) &&
    (reason !== 'Otro' || notes.trim().length >= 3)

  const submit = async () => {
    if (!sale || !canSubmit) return
    if (!confirming) {
      setConfirming(true)
      return
    }
    setSaving(true)
    setError('')
    const finalReason = reason === 'Otro' ? notes.trim() : reason
    const finalNotes = reason === 'Otro' ? undefined : notes.trim() || undefined
    try {
      const response: any =
        mode === 'cancel'
          ? await APIs.cancelSale(sale.id, { reason: finalReason, notes: finalNotes, idempotencyKey: attemptKey.current })
          : await APIs.createSaleReturn(sale.id, {
              reason: finalReason,
              notes: finalNotes,
              idempotencyKey: attemptKey.current,
              lines: requested.map((r) => ({
                saleLineId: r.line.id,
                quantity: r.quantity,
                disposition: disposition[r.line.id] ?? 'RESTOCK',
              })),
            })
      const result = response?.data ?? response
      const cash = (result?.refundSummary ?? []).find((p: any) => p.code === 'CASH')
      await Swal.fire({
        icon: 'success',
        title: mode === 'cancel' ? 'Venta cancelada' : 'Devolución registrada',
        html: cash ? `Entrega <b>${money(cash.amount)}</b> en efectivo al cliente.` : response?.message ?? '',
        timer: 2600,
        showConfirmButton: false,
      })
      window.dispatchEvent(new Event('sales-changed'))
      onSaved()
      onClose()
    } catch (e: any) {
      setError(errorText(e, 'No se pudo completar la operación.'))
      setConfirming(false)
    } finally {
      setSaving(false)
    }
  }

  if (!open || !sale) return null

  const folioLabel = sale.folio ? `${sale.series?.name ?? 'VENT'}-${sale.folio}` : `#${sale.id}`

  return (
    <div className='sr-overlay' onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className='sr-popup' role='dialog' aria-modal='true' aria-label='Cancelar o devolver'>
        <header className='sr-header'>
          <div>
            <h3>Cancelar o devolver</h3>
            <p>
              {folioLabel} · {money(Number(sale.total))}
              {data ? ` · hace ${data.sale.daysSince} día${data.sale.daysSince === 1 ? '' : 's'}` : ''}
            </p>
          </div>
          <button type='button' className='sr-close' onClick={onClose} aria-label='Cerrar' disabled={saving}>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </header>

        <div className='sr-body'>
          {loading ? <p className='sr-muted'>Cargando…</p> : null}
          {error && !data ? <p className='sr-error'>{error}</p> : null}

          {data ? (
            <>
              <div className='sr-tabs' role='tablist'>
                <button
                  type='button'
                  role='tab'
                  aria-selected={mode === 'return'}
                  className={`sr-tab ${mode === 'return' ? 'is-active' : ''}`}
                  disabled={!rules.canReturn}
                  onClick={() => { setMode('return'); setConfirming(false) }}
                >
                  <span className='material-symbols-rounded'>assignment_return</span> Devolver artículos
                </button>
                <button
                  type='button'
                  role='tab'
                  aria-selected={mode === 'cancel'}
                  className={`sr-tab ${mode === 'cancel' ? 'is-active is-danger' : ''}`}
                  disabled={!rules.canCancel}
                  onClick={() => { setMode('cancel'); setConfirming(false) }}
                  title={rules.cancelBlockedReason ?? undefined}
                >
                  <span className='material-symbols-rounded'>block</span> Cancelar toda la venta
                </button>
              </div>

              {!rules.canCancel && rules.cancelBlockedReason ? (
                <p className='sr-hint'>No se puede cancelar: {rules.cancelBlockedReason}</p>
              ) : null}
              {data.sale.status !== 'COMPLETED' ? <p className='sr-error'>Esta venta ya no admite cambios.</p> : null}

              {mode === 'return' ? (
                <div className='sr-lines'>
                  <div className='sr-line sr-line--head'>
                    <span>Artículo</span>
                    <span className='sr-num'>Vendidas</span>
                    <span className='sr-num'>Devueltas</span>
                    <span>A devolver</span>
                    <span>Destino</span>
                    <span className='sr-num'>Importe</span>
                  </div>
                  {lines.map((line) => {
                    const value = qty[line.id] ?? ''
                    const amount = round2((Number(value) || 0) * line.unitRefund)
                    return (
                      <div className={`sr-line ${line.returnable <= 0 ? 'is-done' : ''}`} key={line.id}>
                        <span className='sr-name' data-label='Artículo'>
                          <strong>{line.name}</strong>
                          {line.code ? <small>{line.code}</small> : null}
                        </span>
                        <span className='sr-num' data-label='Vendidas'>{line.quantity}</span>
                        <span className='sr-num' data-label='Devueltas'>{line.returned || '—'}</span>
                        <span className='sr-qty' data-label='A devolver'>
                          <input
                            className='inputs__general'
                            inputMode='decimal'
                            placeholder='0'
                            disabled={line.returnable <= 0}
                            value={value}
                            onChange={(e) => setLineQty(line, e.target.value)}
                            aria-label={`Cantidad a devolver de ${line.name}`}
                          />
                          <button
                            type='button'
                            className='sr-all'
                            disabled={line.returnable <= 0}
                            onClick={() => setLineQty(line, String(line.returnable))}
                            title='Devolver todo lo que queda'
                          >
                            Todo
                          </button>
                        </span>
                        <span data-label='Destino'>
                          <select
                            className='inputs__general'
                            disabled={line.returnable <= 0 || !line.tracksInventory}
                            value={disposition[line.id] ?? 'RESTOCK'}
                            onChange={(e) => setDisposition((prev) => ({ ...prev, [line.id]: e.target.value as 'RESTOCK' | 'WASTE' }))}
                          >
                            <option value='RESTOCK'>Regresa al inventario</option>
                            <option value='WASTE'>Merma (no se revende)</option>
                          </select>
                        </span>
                        <span className='sr-num sr-strong' data-label='Importe'>{amount > 0 ? money(amount) : '—'}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className='sr-cancel-box'>
                  <span className='material-symbols-rounded'>warning</span>
                  <p>
                    Se anula la venta completa: las piezas regresan al inventario, se reembolsa todo el dinero y los pedidos de producción
                    pendientes se cancelan. Esta acción queda en la auditoría.
                  </p>
                </div>
              )}

              <div className='sr-fields'>
                <label>
                  <span>Motivo</span>
                  <select className='inputs__general' value={reason} onChange={(e) => setReason(e.target.value)}>
                    {REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{reason === 'Otro' ? 'Describe el motivo' : 'Comentarios (opcional)'}</span>
                  <input
                    className='inputs__general'
                    value={notes}
                    maxLength={200}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={reason === 'Otro' ? 'Obligatorio' : 'Ej. falla de costura'}
                  />
                </label>
              </div>

              {needsOverride ? (
                <p className={blockedByOverride ? 'sr-error' : 'sr-hint'}>
                  {rules.outsideWindow
                    ? `Pasaron ${data.sale.daysSince} días (el plazo es de ${rules.returnWindowDays}). `
                    : `Devoluciones mayores a ${money(rules.returnSupervisorAmount)} `}
                  {blockedByOverride ? 'Necesita la autorización de un supervisor.' : 'Se registrará con tu autorización especial.'}
                </p>
              ) : null}

              <div className='sr-summary'>
                <div className='sr-summary__total'>
                  <span>Total a devolver</span>
                  <strong>{money(exactTotal)}</strong>
                </div>
                {exactTotal > 0 ? (
                  <ul>
                    {split.parts.filter((p: any) => p.amount > 0).map((p: any) => (
                      <li key={p.paymentMethodId}>
                        <span>{p.name}</span>
                        <b>{money(p.amount)}</b>
                        {p.code === 'CASH' ? <small>sale de la caja de tu turno</small> : <small>por la misma forma de pago</small>}
                      </li>
                    ))}
                    {split.debt > 0 ? (
                      <li>
                        <span>Baja la deuda del cliente</span>
                        <b>{money(split.debt)}</b>
                        <small>cuenta por cobrar</small>
                      </li>
                    ) : null}
                  </ul>
                ) : (
                  <p className='sr-muted'>Indica las cantidades que regresa el cliente.</p>
                )}
                {cashOut > 0 ? <p className='sr-hint'>Entrega {money(cashOut)} en efectivo al cliente.</p> : null}
              </div>

              {data.returns?.length ? (
                <details className='sr-history'>
                  <summary>Movimientos anteriores ({data.returns.length})</summary>
                  <ul>
                    {data.returns.map((r: any) => (
                      <li key={r.id}>
                        <b>{r.serie ?? 'DEV'}-{r.folio}</b> · {r.kind === 'CANCELLATION' ? 'Cancelación' : 'Devolución'} · {money(r.total)} · {r.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </>
          ) : null}

          {error && data ? <p className='sr-error'>{error}</p> : null}
        </div>

        <footer className='sr-footer'>
          <button type='button' className='btn__general-secondary' onClick={onClose} disabled={saving}>
            Cerrar
          </button>
          <button
            type='button'
            className={mode === 'cancel' ? 'sr-danger' : 'btn__general-primary'}
            disabled={!canSubmit}
            onClick={submit}
          >
            {saving
              ? 'Guardando…'
              : confirming
                ? `Confirmar ${mode === 'cancel' ? 'cancelación' : 'devolución'} de ${money(exactTotal)}`
                : mode === 'cancel'
                  ? 'Cancelar venta'
                  : 'Registrar devolución'}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default ModalSaleReturn
