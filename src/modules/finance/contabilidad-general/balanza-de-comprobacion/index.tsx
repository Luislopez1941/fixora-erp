import React, { useCallback, useEffect, useState } from 'react'
import APIs from '../../../../services/APIs'
import { ACCOUNT_TYPES, AccPage, errorText, money, monthStart, today, useAccountingCompany } from '../../shared/ui'

/** Balanza de comprobación: cargos, abonos y saldo por cuenta en el rango (solo pólizas contabilizadas). */
const BalanzaDeComprobacion: React.FC = () => {
  const { companies, companyId, setCompanyId } = useAccountingCompany()
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today())
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!companyId) return setData(null)
    setLoading(true)
    setError('')
    try {
      const response: any = await APIs.getTrialBalance(companyId, from, to)
      setData(response?.data && !response.accounts ? response.data : response)
    } catch (e) {
      setData(null)
      setError(errorText(e, 'No se pudo calcular la balanza.'))
    } finally {
      setLoading(false)
    }
  }, [companyId, from, to])

  useEffect(() => { load() }, [load])

  return (
    <AccPage
      title='Balanza de comprobación'
      subtitle='Cargos, abonos y saldo por cuenta. Debe cuadrar: total de cargos igual al total de abonos.'
      companies={companies} companyId={companyId} onCompany={setCompanyId}
      filters={
        <>
          <div className='acc__field'><label>Desde</label><input className='inputs__general' type='date' value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className='acc__field'><label>Hasta</label><input className='inputs__general' type='date' value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </>
      }
    >
      {error && <div className='acc__empty'>{error}</div>}
      {loading ? <div className='acc__loading'>Calculando…</div> : data && (
        data.accounts?.length ? (
          <>
            <div className={`acc__balance ${data.balanced ? 'acc__balance--ok' : 'acc__balance--bad'}`}>
              <span className='material-symbols-rounded'>{data.balanced ? 'check_circle' : 'error'}</span>
              {data.balanced ? 'La balanza cuadra' : 'La balanza NO cuadra: revisa las pólizas del rango'}
            </div>
            <div className='acc__table-wrap'>
              <table className='acc__table'>
                <thead><tr><th>Cuenta</th><th>Nombre</th><th>Tipo</th><th className='is-num'>Cargos</th><th className='is-num'>Abonos</th><th className='is-num'>Saldo</th></tr></thead>
                <tbody>
                  {data.accounts.map((a: any) => (
                    <tr key={a.code}>
                      <td>{a.code}</td><td>{a.name}</td><td className='is-muted'>{ACCOUNT_TYPES[a.type] ?? a.type}</td>
                      <td className='is-num'>{money(a.debit)}</td><td className='is-num'>{money(a.credit)}</td><td className='is-num'>{money(a.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr><td colSpan={3}>Totales</td><td className='is-num'>{money(data.totalDebit)}</td><td className='is-num'>{money(data.totalCredit)}</td><td /></tr></tfoot>
              </table>
            </div>
          </>
        ) : <div className='acc__empty'>No hay movimientos contabilizados en este rango.</div>
      )}
    </AccPage>
  )
}

export default BalanzaDeComprobacion
