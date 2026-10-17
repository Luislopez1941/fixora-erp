import React, { useCallback, useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { AccPage, StatusBadge, dateText, errorText, money, monthStart, today, unwrap, useAccountingCompany } from '../../shared/ui'

/** Pólizas: lista de asientos del rango, con su detalle de líneas y la anulación por contra-asiento. */
const Polizas: React.FC = () => {
  const can = useCan()
  const canManage = can('accounting.manage')
  const { companies, companyId, setCompanyId } = useAccountingCompany()
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today())
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openId, setOpenId] = useState('')
  const [detail, setDetail] = useState<any | null>(null)

  const load = useCallback(async () => {
    if (!companyId) return setEntries([])
    setLoading(true)
    try {
      setEntries(unwrap(await APIs.getJournalEntries(companyId, { from, to })))
    } catch (error) {
      setEntries([])
      Swal.fire('No se pudieron cargar las pólizas', errorText(error, 'Intenta de nuevo.'), 'error')
    } finally {
      setLoading(false)
    }
  }, [companyId, from, to])

  useEffect(() => { load() }, [load])

  const toggle = async (id: string) => {
    if (openId === id) { setOpenId(''); setDetail(null); return }
    setOpenId(id)
    setDetail(null)
    try {
      const response: any = await APIs.getJournalEntry(id)
      setDetail(response?.data ?? response)
    } catch (error) {
      setOpenId('')
      Swal.fire('No se pudo abrir la póliza', errorText(error, 'Intenta de nuevo.'), 'error')
    }
  }

  const reverse = async (entry: any) => {
    const { value: reason } = await Swal.fire({
      title: `Anular póliza #${entry.entryNumber}`,
      input: 'text', inputLabel: 'Motivo de la anulación',
      text: 'Se registra un contra-asiento con los cargos y abonos invertidos; la póliza original queda como anulada.',
      showCancelButton: true, confirmButtonText: 'Anular', cancelButtonText: 'Cancelar',
      inputValidator: (value) => (value.trim() ? undefined : 'Escribe el motivo.'),
    })
    if (!reason) return
    try {
      await APIs.reverseJournalEntry(entry.id, { reason: reason.trim() })
      setOpenId('')
      load()
    } catch (error) {
      Swal.fire('No se pudo anular', errorText(error, 'Intenta de nuevo.'), 'error')
    }
  }

  return (
    <AccPage
      title='Pólizas'
      subtitle='Asientos contables registrados en el rango de fechas.'
      companies={companies} companyId={companyId} onCompany={setCompanyId}
      filters={
        <>
          <div className='acc__field'><label>Desde</label><input className='inputs__general' type='date' value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className='acc__field'><label>Hasta</label><input className='inputs__general' type='date' value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </>
      }
    >
      {loading ? <div className='acc__loading'>Cargando pólizas…</div> : entries.length === 0 ? <div className='acc__empty'>No hay pólizas en este rango.</div> : (
        <div className='acc__table-wrap'>
          <table className='acc__table'>
            <thead><tr><th>No.</th><th>Fecha</th><th>Concepto</th><th>Origen</th><th>Estado</th><th className='is-num'>Cargos</th><th className='is-num'>Abonos</th><th /></tr></thead>
            <tbody>
              {entries.map((e) => (
                <React.Fragment key={e.id}>
                  <tr style={{ cursor: 'pointer' }} onClick={() => toggle(e.id)}>
                    <td>{e.entryNumber}</td>
                    <td>{dateText(e.entryDate)}</td>
                    <td>{e.description}</td>
                    <td className='is-muted'>{e.sourceType ?? 'Manual'}</td>
                    <td><StatusBadge status={e.status} /></td>
                    <td className='is-num'>{money(e.totalDebit)}</td>
                    <td className='is-num'>{money(e.totalCredit)}</td>
                    <td>
                      <div className='acc__row-actions' onClick={(ev) => ev.stopPropagation()}>
                        {canManage && e.status === 'POSTED' && !e.reversalOfId && (
                          <button type='button' className='acc__btn acc__btn--sm acc__btn--danger' onClick={() => reverse(e)}><span className='material-symbols-rounded'>undo</span>Anular</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {openId === e.id && (
                    <tr>
                      <td colSpan={8} style={{ padding: 0 }}>
                        {!detail ? <div className='acc__loading'>Cargando…</div> : (
                          <table className='acc__table'>
                            <thead><tr><th>Cuenta</th><th>Descripción</th><th className='is-num'>Cargo</th><th className='is-num'>Abono</th></tr></thead>
                            <tbody>
                              {(detail.lines ?? []).map((l: any) => (
                                <tr key={l.id}>
                                  <td>{l.account?.code} · {l.account?.name}</td>
                                  <td className='is-muted'>{l.description ?? ''}</td>
                                  <td className='is-num'>{Number(l.debit) ? money(l.debit) : ''}</td>
                                  <td className='is-num'>{Number(l.credit) ? money(l.credit) : ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AccPage>
  )
}

export default Polizas
