import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import APIs from '../../../../../services/APIs'
import { useCan } from '../../../../../core/permissions/useCan'
import { showToast } from '../../../../../utils/toast'
import { RESULT_LABEL, dateTime, errorText, money } from '../../../shared/cashFormat'
import { DEFAULT_DENOMINATIONS, Denomination, denomLabel, keyOf } from '../denominations'
import './CashCountForm.css'

interface Props {
  branchId: number
  /** Al guardar: id del arqueo nuevo (para abrir su detalle) */
  onSaved: (id: number) => void
}

/** Nuevo arqueo: elegir el turno abierto, contar por denominación y ver en vivo contado vs esperado. */
const CashCountForm: React.FC<Props> = ({ branchId, onSaved }) => {
  const can = useCan()
  const canCreate = can('cash-register.cortes-y-arqueos-arqueo.create')

  const [shifts, setShifts] = useState<any[]>([])
  const [shiftsLoading, setShiftsLoading] = useState(false)
  const [shiftId, setShiftId] = useState(0)
  const [expected, setExpected] = useState<any>(null)
  const [expectedLoading, setExpectedLoading] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')
  const [otherValues, setOtherValues] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadShifts = useCallback(async () => {
    if (!(branchId > 0)) {
      setShifts([])
      setShiftId(0)
      return
    }
    setShiftsLoading(true)
    try {
      const res: any = await APIs.getCashCountShifts(branchId)
      const list: any[] = res?.data ?? []
      setShifts(list)
      setShiftId((cur) => (list.some((s) => s.id === cur) ? cur : list.length === 1 ? list[0].id : 0))
    } catch (e) {
      setShifts([])
      setError(errorText(e, 'No se pudieron cargar los turnos abiertos.'))
    } finally {
      setShiftsLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    loadShifts()
  }, [loadShifts])

  const loadExpected = useCallback(async () => {
    if (!shiftId) {
      setExpected(null)
      return
    }
    setExpectedLoading(true)
    try {
      const res: any = await APIs.getCashCountExpected(shiftId)
      setExpected(res?.data ?? null)
    } catch (e) {
      setExpected(null)
      setError(errorText(e, 'No se pudo calcular lo esperado del turno.'))
    } finally {
      setExpectedLoading(false)
    }
  }, [shiftId])

  useEffect(() => {
    setCounts({})
    setNotes('')
    setOtherValues('')
    loadExpected()
  }, [loadExpected])

  const denominations: Denomination[] = expected?.denominations ?? DEFAULT_DENOMINATIONS
  const counted = useMemo(
    () => Math.round(denominations.reduce((acc, d) => acc + d.value * (counts[keyOf(d)] || 0), 0) * 100) / 100,
    [denominations, counts],
  )
  const difference = expected ? Math.round((counted - expected.expected) * 100) / 100 : 0
  const tolerance = expected?.tolerance ?? 0
  const liveResult = !expected ? 'BALANCED' : Math.abs(difference) <= tolerance ? 'BALANCED' : difference > 0 ? 'OVER' : 'SHORT'
  const needsNotes = !!expected && Math.abs(difference) >= 0.01

  const setQty = (d: Denomination, value: number) =>
    setCounts((prev) => ({ ...prev, [keyOf(d)]: Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)) }))

  const save = async () => {
    if (!expected || !shiftId) return
    if (needsNotes && !notes.trim()) {
      setError('Hay diferencia entre lo contado y lo esperado: escribe una observación.')
      return
    }
    const confirm = await Swal.fire({
      title: '¿Registrar el arqueo?',
      html: `Contado <b>${money(counted)}</b> contra esperado <b>${money(expected.expected)}</b>.<br/>Diferencia: <b>${money(difference)}</b> (${RESULT_LABEL[liveResult]}).<br/><small>Una vez guardado no se puede editar.</small>`,
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      cancelButtonText: 'Revisar',
      confirmButtonColor: '#072a57',
    })
    if (!confirm.isConfirmed) return
    setSaving(true)
    setError('')
    try {
      const res: any = await APIs.createCashCount({
        shiftId,
        lines: denominations.map((d) => ({ denomination: d.value, kind: d.kind, quantity: counts[keyOf(d)] || 0 })),
        notes: notes.trim() || undefined,
        otherValues: otherValues.trim() || undefined,
      })
      const saved = res?.data
      showToast({
        type: 'success',
        title: 'Arqueo registrado',
        text: saved ? `Turno #${saved.shiftId}${saved.registerName ? ` · ${saved.registerName}` : ''}` : undefined,
        details: saved
          ? [
              { label: 'Contado', value: money(saved.countedAmount) },
              { label: 'Diferencia', value: money(saved.difference), strong: true },
            ]
          : undefined,
      })
      setCounts({})
      setNotes('')
      setOtherValues('')
      loadShifts()
      loadExpected()
      if (saved?.id) onSaved(saved.id)
    } catch (e) {
      setError(errorText(e, 'No se pudo registrar el arqueo.'))
    } finally {
      setSaving(false)
    }
  }

  const errorBox = error ? (
    <div className='cash-ui__error' role='alert'>
      <span className='material-symbols-rounded' aria-hidden>error</span>
      <span>{error}</span>
      <button type='button' onClick={() => setError('')} aria-label='Cerrar'>
        <span className='material-symbols-rounded'>close</span>
      </button>
    </div>
  ) : null

  if (!(branchId > 0)) {
    return (
      <div className='cash-ui__state'>
        <span className='material-symbols-rounded' aria-hidden>store</span>
        <p>Elige una sucursal para ver sus turnos abiertos.</p>
      </div>
    )
  }
  if (shiftsLoading) return <span className='table-skeleton__shimmer cash-ui__skel' />
  if (shifts.length === 0) {
    return (
      <>
        {errorBox}
        <div className='cash-ui__state'>
          <span className='material-symbols-rounded' aria-hidden>lock_clock</span>
          <p>No hay turnos abiertos en esta sucursal.</p>
          <small>El arqueo se hace sobre un turno abierto. Abre uno en Caja › Turnos para poder arquear.</small>
        </div>
      </>
    )
  }

  const bills = denominations.filter((d) => d.kind === 'BILL')
  const coins = denominations.filter((d) => d.kind === 'COIN')
  const renderGroup = (title: string, list: Denomination[]) => (
    <div className='cash-count-form__group'>
      <h3>{title}</h3>
      {list.map((d) => {
        const qty = counts[keyOf(d)] || 0
        return (
          <div className='cash-count-form__denom' key={keyOf(d)}>
            <span className={`cash-count-form__chip cash-count-form__chip--${d.kind.toLowerCase()}`}>{denomLabel(d.value)}</span>
            <div className='cash-count-form__qty'>
              <button type='button' onClick={() => setQty(d, qty - 1)} disabled={qty <= 0 || !expected} aria-label={`Quitar una de ${denomLabel(d.value)}`}>
                <span className='material-symbols-rounded'>remove</span>
              </button>
              <input
                type='number'
                inputMode='numeric'
                min={0}
                step={1}
                value={qty === 0 ? '' : qty}
                placeholder='0'
                disabled={!expected}
                onChange={(e) => setQty(d, Number(e.target.value))}
                aria-label={`Cantidad de ${denomLabel(d.value)}`}
              />
              <button type='button' onClick={() => setQty(d, qty + 1)} disabled={!expected} aria-label={`Agregar una de ${denomLabel(d.value)}`}>
                <span className='material-symbols-rounded'>add</span>
              </button>
            </div>
            <strong className='cash-count-form__subtotal'>{money(d.value * qty)}</strong>
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      {errorBox}
      <div className='cash-count-form'>
        <div className='cash-count-form__main'>
          <section className='cash-ui__card'>
            <h2>Turno a arquear</h2>
            <div className='cash-count-form__shifts'>
              {shifts.map((s) => (
                <button key={s.id} type='button' className={`cash-count-form__shift ${s.id === shiftId ? 'is-active' : ''}`} onClick={() => setShiftId(s.id)}>
                  <strong>{s.registerName ?? 'Caja sin nombre'}</strong>
                  <span>{s.userName || 'Sin responsable'} · Turno #{s.id}</span>
                  <small>Abierto {dateTime(s.openedAt)}{s.counts ? ` · ${s.counts} arqueo(s)` : ''}</small>
                </button>
              ))}
            </div>
          </section>

          {shiftId ? (
            <section className='cash-ui__card'>
              <h2>Conteo por denominación</h2>
              <div className='cash-count-form__groups'>
                {renderGroup('Billetes', bills)}
                {renderGroup('Monedas', coins)}
              </div>
              <label className='cash-count-form__field'>
                <span>Otros valores (vales, vouchers, cheques…)</span>
                <input className='inputs__general' type='text' maxLength={500} value={otherValues} onChange={(e) => setOtherValues(e.target.value)} placeholder='Solo nota: no se suma al efectivo' disabled={!expected} />
              </label>
            </section>
          ) : (
            <div className='cash-ui__state'>
              <span className='material-symbols-rounded' aria-hidden>touch_app</span>
              <p>Elige el turno que vas a arquear.</p>
            </div>
          )}

          {/* Celular/tablet: barra compacta pegada abajo con lo contado y la diferencia mientras cuentas */}
          {shiftId && expected ? (
            <div className={`cash-count-form__mini cash-count-form__mini--${liveResult.toLowerCase()}`}>
              <div><small>Contado</small><strong>{money(counted)}</strong></div>
              <div><small>Esperado</small><strong>{money(expected.expected)}</strong></div>
              <div><small>{RESULT_LABEL[liveResult]}</small><strong>{money(difference)}</strong></div>
            </div>
          ) : null}
        </div>

        {shiftId ? (
          <aside className='cash-count-form__side'>
            <section className='cash-ui__card'>
              <h2>Resumen</h2>
              {expectedLoading || !expected ? (
                <span className='table-skeleton__shimmer cash-ui__skel cash-count-form__skel' />
              ) : (
                <>
                  <dl className='cash-count-form__expected'>
                    <div><dt>Fondo inicial</dt><dd>{money(expected.openingAmount)}</dd></div>
                    <div><dt>+ Ventas en efectivo</dt><dd>{money(expected.cashSales)}</dd></div>
                    <div><dt>+ Entradas</dt><dd>{money(expected.incomes)}</dd></div>
                    <div><dt>− Salidas</dt><dd>{money(expected.expenses)}</dd></div>
                    <div><dt>− Devoluciones en efectivo</dt><dd>{money(expected.cashRefunds)}</dd></div>
                    <div className='is-total'><dt>Esperado</dt><dd>{money(expected.expected)}</dd></div>
                  </dl>
                  <div className='cash-count-form__counted'>
                    <span>Contado</span>
                    <strong>{money(counted)}</strong>
                  </div>
                  <div className={`cash-count-form__result cash-count-form__result--${liveResult.toLowerCase()}`}>
                    <span className='material-symbols-rounded' aria-hidden>
                      {liveResult === 'BALANCED' ? 'check_circle' : liveResult === 'OVER' ? 'trending_up' : 'trending_down'}
                    </span>
                    <div>
                      <small>Diferencia · {RESULT_LABEL[liveResult]}</small>
                      <strong>{money(difference)}</strong>
                    </div>
                  </div>
                  {tolerance > 0 ? <p className='cash-count-form__hint'>Tolerancia de la sucursal: {money(tolerance)}</p> : null}
                  <label className='cash-count-form__field'>
                    <span>Observaciones{needsNotes ? ' *' : ''}</span>
                    <textarea
                      className={`inputs__general ${needsNotes && !notes.trim() ? 'is-required' : ''}`}
                      rows={3}
                      maxLength={500}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={needsNotes ? 'Explica la diferencia (obligatorio)' : 'Opcional'}
                    />
                  </label>
                  <button type='button' className='cash-count-form__save' onClick={save} disabled={saving || !canCreate || counted <= 0 || (needsNotes && !notes.trim())}>
                    {saving ? 'Guardando…' : 'Registrar arqueo'}
                  </button>
                  {!canCreate ? <p className='cash-count-form__hint'>Tu usuario puede ver arqueos, pero no registrarlos.</p> : null}
                  <p className='cash-count-form__hint'>El turno sigue abierto: el arqueo no lo cierra.</p>
                </>
              )}
            </section>
          </aside>
        ) : null}
      </div>
    </>
  )
}

export default CashCountForm
