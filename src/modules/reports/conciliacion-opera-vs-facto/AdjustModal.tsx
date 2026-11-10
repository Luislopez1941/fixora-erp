import React, { useEffect, useMemo, useRef, useState } from 'react'
import { serialToText, type FactoResult, type OperaResult, type OperaRow } from './reconcile'
import {
  ADJ_REASONS, compareWithOpera, factoKey, factoRef, operaKey, operaRef,
  type AdjReason, type AdjustmentInput, type AdjustmentKind, type AppliedReconciliation,
} from './adjustments'
import { ADJUSTMENTS_SIMULATED } from './adjustmentsApi'
import { FACTO_STATUS, OPERA_STATUS } from './exportCsv'

const money = (n: number) => Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${money(Math.abs(n))}`

const Icon: React.FC<{ name: string }> = ({ name }) => <span className='material-symbols-rounded' aria-hidden>{name}</span>

export type AdjustTarget = { side: 'facto'; r: FactoResult } | { side: 'opera'; r: OperaResult }

interface Props {
  target: AdjustTarget
  data: AppliedReconciliation
  tolerance: number
  user: string
  onSave: (input: AdjustmentInput) => Promise<void>
  onClose: () => void
}

const near = (a: number, b: number, tol: number) => a > 0 && b > 0 && Math.abs(a - b) <= tol
const operaAmount = (o: OperaRow) => o.totalPago || o.totalPagado || o.totalIngresos

const AdjustModal: React.FC<Props> = ({ target, data, tolerance, user, onSave, onClose }) => {
  const isFacto = target.side === 'facto'
  const current = target.r.adjustment
  const [kind, setKind] = useState<AdjustmentKind>(current?.kind ?? 'vincular')
  const [reason, setReason] = useState<AdjReason>(current?.reason && current.reason !== 'vinculo-manual' ? current.reason : 'factura-manual')
  const [note, setNote] = useState(current?.note ?? '')
  // En un vínculo que no cuadra: motivo que explica la diferencia ('vinculo-manual' = se deja como diferencia)
  const [diffReason, setDiffReason] = useState<AdjReason>(current?.kind === 'vincular' ? current.reason : 'vinculo-manual')
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const firstRef = useRef<HTMLButtonElement>(null)

  // Factura → filas de OPERA elegidas (por llave de fila); OPERA → factura elegida
  const [picked, setPicked] = useState<Set<string>>(() => new Set(isFacto ? (target.r as FactoResult).opera.map((o) => o.key) : []))
  const [pickedFacto, setPickedFacto] = useState<string>(() => (!isFacto && (target.r as OperaResult).facto ? (target.r as OperaResult).facto!.key : ''))

  useEffect(() => {
    firstRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const q = query.trim().toLowerCase()

  // Sugerencias de OPERA para una factura: misma confirmación, misma habitación, mismo monto; libres primero
  const operaOptions = useMemo(() => {
    if (!isFacto) return []
    const r = target.r as FactoResult
    const f = r.facto
    const statusOf = new Map(data.opera.map((x) => [x.opera.key, x]))
    const scored = data.opera.map((x) => {
      const o = x.opera
      let score = 0
      if (f.reserva && o.confirmacion === f.reserva) score += 100
      if (f.habitacion && o.habitacion === f.habitacion) score += 20
      if ([o.totalPago, o.totalPagado, o.totalIngresos].some((a) => near(a, r.factoAmount, tolerance))) score += 50
      if (x.status === 'sin-facto' || x.status === 'solo-pago') score += 5
      if (picked.has(o.key)) score += 1000
      return { o, score, st: statusOf.get(o.key) }
    })
    const list = q
      ? scored.filter(({ o }) => [o.confirmacion, o.folioOpera, o.habitacion, o.cashier, String(o.totalIngresos), String(o.totalPago)].some((v) => v?.toLowerCase().includes(q)))
      : scored.filter((x) => x.score > 5)
    return list.sort((a, b) => b.score - a.score).slice(0, 40)
  }, [isFacto, target, data, tolerance, q, picked])

  // Sugerencias de facturas para una fila de OPERA
  const factoOptions = useMemo(() => {
    if (isFacto) return []
    const o = (target.r as OperaResult).opera
    const amount = operaAmount(o)
    const scored = data.facto
      .filter((x) => x.status !== 'pago' && x.status !== 'cancelada')
      .map((x) => {
        const f = x.facto
        let score = 0
        if (f.reserva && f.reserva === o.confirmacion) score += 100
        if (f.habitacion && f.habitacion === o.habitacion) score += 20
        if (near(x.factoAmount, amount, tolerance)) score += 50
        if (x.status === 'sin-opera' || x.status === 'ambigua' || x.status === 'diferencia') score += 5
        if (f.key === pickedFacto) score += 1000
        return { x, score }
      })
    const list = q
      ? scored.filter(({ x }) => [x.facto.serieFolio, x.facto.reserva, x.facto.huesped, x.facto.habitacion, x.facto.uuid, String(x.factoAmount)].some((v) => v?.toLowerCase().includes(q)))
      : scored.filter((s) => s.score > 5)
    return list.sort((a, b) => b.score - a.score).slice(0, 40)
  }, [isFacto, target, data, tolerance, q, pickedFacto])

  // Vista previa del vínculo
  const preview = useMemo(() => {
    if (kind !== 'vincular') return null
    if (isFacto) {
      const r = target.r as FactoResult
      const rows = data.opera.map((x) => x.opera).filter((o) => picked.has(o.key))
      return { facto: r.factoAmount, ...compareWithOpera(r.factoAmount, rows), count: rows.length }
    }
    const o = (target.r as OperaResult).opera
    const f = data.facto.find((x) => x.facto.key === pickedFacto)
    if (!f) return null
    const rows = [...f.opera.filter((x) => x.key !== o.key), o]
    return { facto: f.factoAmount, ...compareWithOpera(f.factoAmount, rows), count: rows.length }
  }, [kind, isFacto, target, data, picked, pickedFacto])

  const diffOutside = !!preview && Math.abs(preview.diff) > tolerance
  const linkReason: AdjReason = diffOutside ? diffReason : 'vinculo-manual'

  const noteRequired = (kind !== 'vincular' && reason === 'otro') || (kind === 'vincular' && diffOutside && diffReason === 'otro')
  const valid =
    (kind === 'vincular' ? (isFacto ? picked.size > 0 : !!pickedFacto) : !!reason) && (!noteRequired || note.trim().length > 0)

  const save = async () => {
    if (!valid || saving) return
    setSaving(true)
    setError('')
    try {
      let input: AdjustmentInput
      if (kind === 'vincular') {
        if (isFacto) {
          const r = target.r as FactoResult
          const rows = data.opera.map((x) => x.opera).filter((o) => picked.has(o.key))
          input = { side: 'facto', key: factoKey(r.facto), ref: factoRef(r.facto), kind, reason: linkReason, note: note.trim(), links: [...new Set(rows.map(operaKey))], user }
        } else {
          const o = (target.r as OperaResult).opera
          const f = data.facto.find((x) => x.facto.key === pickedFacto)!
          const rows = [...f.opera.filter((x) => x.key !== o.key), o]
          input = { side: 'facto', key: factoKey(f.facto), ref: factoRef(f.facto), kind, reason: linkReason, note: note.trim(), links: [...new Set(rows.map(operaKey))], user }
        }
      } else if (isFacto) {
        const f = (target.r as FactoResult).facto
        input = { side: 'facto', key: factoKey(f), ref: factoRef(f), kind, reason, note: note.trim(), links: [], user }
      } else {
        const o = (target.r as OperaResult).opera
        input = { side: 'opera', key: operaKey(o), ref: operaRef(o), kind, reason, note: note.trim(), links: [], user }
      }
      await onSave(input)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el ajuste.')
      setSaving(false)
    }
  }

  const title = isFacto ? `Ajustar factura ${factoRef((target.r as FactoResult).facto)}` : `Ajustar ${operaRef((target.r as OperaResult).opera)}`
  const summary = isFacto
    ? (() => {
        const r = target.r as FactoResult
        return `${FACTO_STATUS[r.status].label} · ${money(r.factoAmount)}${r.facto.reserva ? ` · reserva ${r.facto.reserva}` : ''}${r.facto.huesped ? ` · ${r.facto.huesped}` : ''}`
      })()
    : (() => {
        const r = target.r as OperaResult
        return `${OPERA_STATUS[r.status].label} · ingresos ${money(r.opera.totalIngresos)} · pago ${money(r.opera.totalPago)}${r.opera.habitacion ? ` · hab. ${r.opera.habitacion}` : ''}`
      })()

  const kinds: { key: AdjustmentKind; label: string; icon: string; hint: string }[] = [
    { key: 'vincular', label: isFacto ? 'Vincular con OPERA' : 'Vincular a una factura', icon: 'link', hint: isFacto ? 'Elige las filas de OPERA que corresponden a esta factura.' : 'Elige la factura de Facto que corresponde a esta fila.' },
    { key: 'aclarar', label: 'Aclarar', icon: 'task_alt', hint: 'Queda resuelta con un motivo, sin cambiar el cruce.' },
    { key: 'excluir', label: 'Excluir', icon: 'block', hint: 'No cuenta en la conciliación de este periodo.' },
  ]

  return (
    <div className='conciliacion__modal-backdrop' onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className='conciliacion__modal' role='dialog' aria-modal='true' aria-labelledby='adj-title'>
        <header className='conciliacion__modal-head'>
          <div>
            <h3 id='adj-title'>{title}</h3>
            <p>{summary}</p>
          </div>
          <button type='button' className='conciliacion__modal-close' onClick={onClose} aria-label='Cerrar'><Icon name='close' /></button>
        </header>

        <div className='conciliacion__modal-body'>
          <div className='conciliacion__segmented' role='radiogroup' aria-label='Tipo de ajuste'>
            {kinds.map((k, i) => (
              <button key={k.key} ref={i === 0 ? firstRef : undefined} type='button' role='radio' aria-checked={kind === k.key} className={kind === k.key ? 'is-active' : ''} onClick={() => { setKind(k.key); setError('') }}>
                <Icon name={k.icon} /> {k.label}
              </button>
            ))}
          </div>
          <p className='conciliacion__modal-hint'>{kinds.find((k) => k.key === kind)?.hint}</p>

          {kind === 'vincular' ? (
            <>
              <label className='conciliacion__modal-search'>
                <Icon name='search' />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={isFacto ? 'Buscar en OPERA: confirmación, folio, habitación, monto…' : 'Buscar factura: serie-folio, reserva, huésped, monto…'} aria-label='Buscar' />
              </label>

              <div className='conciliacion__pick-list' role='listbox' aria-multiselectable={isFacto}>
                {isFacto
                  ? operaOptions.map(({ o, st }) => {
                      const on = picked.has(o.key)
                      const s = st ? OPERA_STATUS[st.status] : null
                      return (
                        <label key={o.key} className={`conciliacion__pick ${on ? 'is-on' : ''}`}>
                          <input type='checkbox' checked={on} onChange={() => setPicked((prev) => { const n = new Set(prev); if (n.has(o.key)) n.delete(o.key); else n.add(o.key); return n })} />
                          <span className='conciliacion__pick-main'>
                            <strong className='is-mono'>{o.confirmacion} · folio {o.folioOpera}</strong>
                            <small>{[o.habitacion ? `hab. ${o.habitacion}` : '', serialToText(o.fecha), o.cashier].filter(Boolean).join(' · ')}</small>
                          </span>
                          <span className='conciliacion__pick-amounts'>
                            <span>Ingresos {money(o.totalIngresos)}</span>
                            <span>Pago {money(o.totalPago)}</span>
                          </span>
                          {s ? <span className={`conciliacion__pill conciliacion__pill--${s.tone}`}>{s.label}</span> : null}
                        </label>
                      )
                    })
                  : factoOptions.map(({ x }) => {
                      const on = pickedFacto === x.facto.key
                      const s = FACTO_STATUS[x.status]
                      return (
                        <label key={x.facto.key} className={`conciliacion__pick ${on ? 'is-on' : ''}`}>
                          <input type='radio' name='adj-facto' checked={on} onChange={() => setPickedFacto(x.facto.key)} />
                          <span className='conciliacion__pick-main'>
                            <strong>{factoRef(x.facto)}</strong>
                            <small>{[x.facto.reserva ? `reserva ${x.facto.reserva}` : '', x.facto.huesped, x.facto.habitacion ? `hab. ${x.facto.habitacion}` : '', serialToText(x.facto.fecha)].filter(Boolean).join(' · ')}</small>
                          </span>
                          <span className='conciliacion__pick-amounts'><span>{money(x.factoAmount)}</span></span>
                          <span className={`conciliacion__pill conciliacion__pill--${s.tone}`}>{s.label}</span>
                        </label>
                      )
                    })}
                {(isFacto ? operaOptions : factoOptions).length === 0 ? (
                  <p className='conciliacion__pick-empty'>{q ? 'Sin resultados.' : 'No hay sugerencias. Busca por confirmación, folio, habitación o monto.'}</p>
                ) : null}
              </div>

              {preview ? (
                <div className={`conciliacion__preview ${Math.abs(preview.diff) <= tolerance ? 'is-ok' : 'is-warn'}`}>
                  <span>Facto <strong>{money(preview.facto)}</strong></span>
                  <span>OPERA <strong>{money(preview.operaTotal)}</strong> <small>({preview.count} {preview.count === 1 ? 'fila' : 'filas'})</small></span>
                  <span>Diferencia <strong>{Math.abs(preview.diff) < 0.005 ? '$0.00' : signed(preview.diff)}</strong></span>
                </div>
              ) : null}

              {diffOutside ? (
                <label className='conciliacion__modal-field'>
                  <span>¿La diferencia tiene explicación?</span>
                  <select className='inputs__general' value={diffReason} onChange={(e) => setDiffReason(e.target.value as AdjReason)}>
                    <option value='vinculo-manual'>No: dejarla como "Con diferencia" para revisarla</option>
                    {ADJ_REASONS.filter((r) => r.key !== 'vinculo-manual').map((r) => <option key={r.key} value={r.key}>Sí: {r.label}</option>)}
                  </select>
                </label>
              ) : null}
            </>
          ) : (
            <label className='conciliacion__modal-field'>
              <span>Motivo</span>
              <select className='inputs__general' value={reason} onChange={(e) => setReason(e.target.value as AdjReason)}>
                {ADJ_REASONS.filter((r) => r.key !== 'vinculo-manual').map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </label>
          )}

          <label className='conciliacion__modal-field'>
            <span>Nota {noteRequired ? '(obligatoria)' : '(opcional)'}</span>
            <textarea className='inputs__general' rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder='Ej. Se facturó a mano el 12 oct, folio fiscal en la carpeta de octubre.' />
          </label>

          {error ? <div className='conciliacion__alert conciliacion__alert--danger' role='alert'><Icon name='error' />{error}</div> : null}
        </div>

        <footer className='conciliacion__modal-foot'>
          <small>{ADJUSTMENTS_SIMULATED ? 'Simulación: el ajuste se guarda solo en este navegador.' : `Se guardará a nombre de ${user}.`}</small>
          <div>
            <button type='button' className='conciliacion__btn conciliacion__btn--tint' onClick={onClose}>Cancelar</button>
            <button type='button' className='conciliacion__btn conciliacion__btn--primary' onClick={save} disabled={!valid || saving}>
              <Icon name={saving ? 'progress_activity' : 'check'} /> {saving ? 'Guardando…' : 'Guardar ajuste'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default AdjustModal
