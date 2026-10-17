import React, { useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import APIs from '../../../services/APIs'
import { errorText, money, toUnits, today, useAccounts } from './ui'
import './Accounting.css'

interface Line { accountId: string; debit: string; credit: string; description: string }
const emptyLine = (): Line => ({ accountId: '', debit: '', credit: '', description: '' })

interface Props {
  companyId: number
  /** Texto con el que arranca el concepto (ej. "Asiento de apertura") */
  presetDescription?: string
  /** Fecha con la que arranca (AAAA-MM-DD) */
  presetDate?: string
  /** Tipo de origen que se guarda con el asiento (OPENING, ADJUSTMENT…); queda en el libro para rastrearlo */
  sourceType?: string
  canPost: boolean
  onSaved?: () => void
}

/** Captura de un asiento de partida doble: líneas con cargo o abono, cuadre en vivo y contabilización. */
const EntryForm: React.FC<Props> = ({ companyId, presetDescription = '', presetDate, sourceType, canPost, onSaved }) => {
  const { accounts } = useAccounts(companyId)
  const detailAccounts = useMemo(() => accounts.filter((a) => a.isDetail && a.active), [accounts])
  const [date, setDate] = useState(presetDate || today())
  const [description, setDescription] = useState(presetDescription)
  const [lines, setLines] = useState<Line[]>([emptyLine(), emptyLine()])
  const [saving, setSaving] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())

  const totalDebit = lines.reduce((acc, l) => acc + toUnits(l.debit), 0)
  const totalCredit = lines.reduce((acc, l) => acc + toUnits(l.credit), 0)
  const balanced = totalDebit > 0 && totalDebit === totalCredit
  const difference = (totalDebit - totalCredit) / 10000

  const setLine = (index: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))

  // Una línea es cargo O abono: al capturar uno se limpia el otro
  const setAmount = (index: number, side: 'debit' | 'credit', value: string) =>
    setLine(index, side === 'debit' ? { debit: value, credit: value ? '' : lines[index].credit } : { credit: value, debit: value ? '' : lines[index].debit })

  const reset = () => {
    setDescription(presetDescription)
    setLines([emptyLine(), emptyLine()])
    setIdempotencyKey(crypto.randomUUID())
  }

  const submit = async () => {
    const used = lines.filter((l) => l.accountId || toUnits(l.debit) || toUnits(l.credit))
    if (!description.trim()) return Swal.fire('Falta el concepto', 'Escribe de qué trata el asiento.', 'warning')
    if (used.length < 2) return Swal.fire('Faltan líneas', 'Un asiento necesita al menos dos líneas.', 'warning')
    if (used.some((l) => !l.accountId || (!toUnits(l.debit) && !toUnits(l.credit)))) {
      return Swal.fire('Línea incompleta', 'Cada línea necesita una cuenta y un cargo o un abono.', 'warning')
    }
    if (!balanced) return Swal.fire('Asiento descuadrado', 'Los cargos deben ser iguales a los abonos.', 'warning')

    setSaving(true)
    try {
      await APIs.postJournalEntry({
        companyId,
        entryDate: date,
        description: description.trim(),
        ...(sourceType ? { sourceType } : {}),
        idempotencyKey,
        lines: used.map((l) => ({
          accountId: l.accountId,
          ...(toUnits(l.debit) ? { debit: String(l.debit) } : {}),
          ...(toUnits(l.credit) ? { credit: String(l.credit) } : {}),
          ...(l.description.trim() ? { description: l.description.trim() } : {}),
        })),
      })
      await Swal.fire({ icon: 'success', title: 'Asiento contabilizado', timer: 1400, showConfirmButton: false })
      reset()
      onSaved?.()
    } catch (error) {
      Swal.fire('No se pudo contabilizar', errorText(error, 'Revisa el asiento e intenta de nuevo.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='acc__panel'>
      <div className='acc__grid'>
        <div className='acc__field'>
          <label>Fecha</label>
          <input className='inputs__general' type='date' value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className='acc__field acc__field--grow' style={{ gridColumn: 'span 2' }}>
          <label>Concepto</label>
          <input className='inputs__general' value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} placeholder='Ej. Pago de renta de octubre' />
        </div>
      </div>

      <div className='acc__table-wrap'>
        <table className='acc__table acc__lines'>
          <thead>
            <tr><th>Cuenta</th><th>Descripción de la línea</th><th className='is-num'>Cargo</th><th className='is-num'>Abono</th><th /></tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={index}>
                <td style={{ minWidth: 240 }}>
                  <select className='inputs__general' value={line.accountId} onChange={(e) => setLine(index, { accountId: e.target.value })}>
                    <option value=''>Selecciona una cuenta…</option>
                    {detailAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
                  </select>
                </td>
                <td><input className='inputs__general' value={line.description} maxLength={200} onChange={(e) => setLine(index, { description: e.target.value })} /></td>
                <td style={{ width: 150 }}><input className='inputs__general is-num' inputMode='decimal' value={line.debit} onChange={(e) => setAmount(index, 'debit', e.target.value.replace(/[^\d.]/g, ''))} placeholder='0.00' /></td>
                <td style={{ width: 150 }}><input className='inputs__general is-num' inputMode='decimal' value={line.credit} onChange={(e) => setAmount(index, 'credit', e.target.value.replace(/[^\d.]/g, ''))} placeholder='0.00' /></td>
                <td style={{ width: 44 }}>
                  {lines.length > 2 && (
                    <button type='button' className='acc__btn acc__btn--sm' aria-label='Quitar línea' onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}>
                      <span className='material-symbols-rounded'>close</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>Totales</td>
              <td className='is-num'>{money(totalDebit / 10000)}</td>
              <td className='is-num'>{money(totalCredit / 10000)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className='acc__filters' style={{ justifyContent: 'space-between' }}>
        <button type='button' className='acc__btn' onClick={() => setLines((prev) => [...prev, emptyLine()])}>
          <span className='material-symbols-rounded'>add</span>Agregar línea
        </button>
        <div className={`acc__balance ${balanced ? 'acc__balance--ok' : 'acc__balance--bad'}`}>
          <span className='material-symbols-rounded'>{balanced ? 'check_circle' : 'error'}</span>
          {balanced ? 'Asiento cuadrado' : totalDebit === 0 && totalCredit === 0 ? 'Captura cargos y abonos' : `Diferencia: ${money(Math.abs(difference))}`}
        </div>
        <button type='button' className='acc__btn acc__btn--primary' disabled={!canPost || saving || !balanced} onClick={submit} title={canPost ? undefined : 'No tienes permiso para registrar asientos'}>
          <span className='material-symbols-rounded'>task_alt</span>{saving ? 'Contabilizando…' : 'Contabilizar'}
        </button>
      </div>
    </div>
  )
}

export default EntryForm
