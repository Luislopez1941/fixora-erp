import React, { useState } from 'react'
import { AccPage, dateText, money, monthStart, today, useAccountingCompany, useEntriesWithLines } from '../../shared/ui'

/** Libro diario: todas las pólizas contabilizadas del rango en orden cronológico, con sus líneas. */
const LibroDiario: React.FC = () => {
  const { companies, companyId, setCompanyId } = useAccountingCompany()
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today())
  const { entries, loading, error } = useEntriesWithLines(companyId, from, to)

  const totalDebit = entries.reduce((acc, e) => acc + Number(e.totalDebit || 0), 0)
  const totalCredit = entries.reduce((acc, e) => acc + Number(e.totalCredit || 0), 0)

  return (
    <AccPage
      title='Libro diario'
      subtitle='Movimientos contabilizados en orden cronológico.'
      companies={companies} companyId={companyId} onCompany={setCompanyId}
      filters={
        <>
          <div className='acc__field'><label>Desde</label><input className='inputs__general' type='date' value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className='acc__field'><label>Hasta</label><input className='inputs__general' type='date' value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </>
      }
    >
      {error && <div className='acc__empty'>{error}</div>}
      {loading ? <div className='acc__loading'>Cargando libro diario…</div> : entries.length === 0 ? <div className='acc__empty'>No hay movimientos en este rango.</div> : (
        <div className='acc__table-wrap'>
          <table className='acc__table'>
            <thead><tr><th>Fecha</th><th>Póliza</th><th>Cuenta</th><th>Concepto</th><th className='is-num'>Cargo</th><th className='is-num'>Abono</th></tr></thead>
            <tbody>
              {entries.map((e) =>
                (e.lines ?? []).map((l: any, index: number) => (
                  <tr key={l.id} style={index === 0 ? { borderTop: '2px solid var(--panel-border)' } : undefined}>
                    <td>{index === 0 ? dateText(e.entryDate) : ''}</td>
                    <td>{index === 0 ? `#${e.entryNumber}` : ''}</td>
                    <td>{l.account?.code} · {l.account?.name}</td>
                    <td className='is-muted'>{l.description || (index === 0 ? e.description : '')}</td>
                    <td className='is-num'>{Number(l.debit) ? money(l.debit) : ''}</td>
                    <td className='is-num'>{Number(l.credit) ? money(l.credit) : ''}</td>
                  </tr>
                )),
              )}
            </tbody>
            <tfoot><tr><td colSpan={4}>Totales ({entries.length} pólizas)</td><td className='is-num'>{money(totalDebit)}</td><td className='is-num'>{money(totalCredit)}</td></tr></tfoot>
          </table>
        </div>
      )}
    </AccPage>
  )
}

export default LibroDiario
