import React, { useMemo, useState } from 'react'
import { ACCOUNT_TYPES, AccPage, dateText, money, monthStart, today, toUnits, useAccountingCompany, useAccounts, useEntriesWithLines } from '../../shared/ui'

/** Mayor: movimientos de una cuenta en el rango, con saldo corrido (según su naturaleza deudora o acreedora). */
const Mayor: React.FC = () => {
  const { companies, companyId, setCompanyId } = useAccountingCompany()
  const { accounts } = useAccounts(companyId)
  const [accountId, setAccountId] = useState('')
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today())
  const { entries, loading, error } = useEntriesWithLines(companyId, from, to)

  const account = accounts.find((a) => a.id === accountId)
  const movements = useMemo(() => {
    if (!account) return []
    const rows: any[] = []
    for (const e of entries) {
      for (const l of e.lines ?? []) {
        if (l.accountId === account.id) rows.push({ id: l.id, date: e.entryDate, number: e.entryNumber, concept: l.description || e.description, debit: toUnits(l.debit), credit: toUnits(l.credit) })
      }
    }
    let running = 0
    return rows.map((r) => {
      running += account.nature === 'DEBIT' ? r.debit - r.credit : r.credit - r.debit
      return { ...r, balance: running }
    })
  }, [entries, account])

  const totalDebit = movements.reduce((acc, r) => acc + r.debit, 0)
  const totalCredit = movements.reduce((acc, r) => acc + r.credit, 0)
  const u = (units: number) => money(units / 10000)

  return (
    <AccPage
      title='Mayor'
      subtitle='Movimientos y saldo corrido de una cuenta.'
      companies={companies} companyId={companyId} onCompany={setCompanyId}
      filters={
        <>
          <div className='acc__field acc__field--grow'>
            <label>Cuenta</label>
            <select className='inputs__general' value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value=''>Selecciona una cuenta…</option>
              {accounts.filter((a) => a.isDetail).map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
            </select>
          </div>
          <div className='acc__field'><label>Desde</label><input className='inputs__general' type='date' value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className='acc__field'><label>Hasta</label><input className='inputs__general' type='date' value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </>
      }
    >
      {!account ? <div className='acc__empty'>Elige una cuenta para ver su mayor.</div> : (
        <>
          <div className='acc__cards'>
            <div className='acc__card'><small>Cuenta</small><strong>{account.code}</strong><span className='acc__hint'>{account.name} · {ACCOUNT_TYPES[account.type]}</span></div>
            <div className='acc__card'><small>Cargos</small><strong>{u(totalDebit)}</strong></div>
            <div className='acc__card'><small>Abonos</small><strong>{u(totalCredit)}</strong></div>
            <div className='acc__card'><small>Saldo del periodo</small><strong>{u(movements.length ? movements[movements.length - 1].balance : 0)}</strong></div>
          </div>
          {error && <div className='acc__empty'>{error}</div>}
          {loading ? <div className='acc__loading'>Cargando movimientos…</div> : movements.length === 0 ? <div className='acc__empty'>Esta cuenta no tiene movimientos en el rango.</div> : (
            <div className='acc__table-wrap'>
              <table className='acc__table'>
                <thead><tr><th>Fecha</th><th>Póliza</th><th>Concepto</th><th className='is-num'>Cargo</th><th className='is-num'>Abono</th><th className='is-num'>Saldo</th></tr></thead>
                <tbody>
                  {movements.map((r) => (
                    <tr key={r.id}>
                      <td>{dateText(r.date)}</td><td>#{r.number}</td><td className='is-muted'>{r.concept}</td>
                      <td className='is-num'>{r.debit ? u(r.debit) : ''}</td><td className='is-num'>{r.credit ? u(r.credit) : ''}</td><td className='is-num'>{u(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AccPage>
  )
}

export default Mayor
