import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { AccPage, StatusBadge, dateText, errorText, money, today, unwrap, useAccountingCompany } from '../../shared/ui'

const FILTERS = [
  { id: 'POSTED', label: 'Por anular' },
  { id: 'REVERSED', label: 'Anuladas' },
  { id: 'COUNTER', label: 'Contra-asientos' },
]

/** Reversiones: anula pólizas con un contra-asiento (cargos y abonos invertidos) y consulta las ya anuladas. */
const Reversiones: React.FC = () => {
  const can = useCan()
  const canManage = can('accounting.manage')
  const { companies, companyId, setCompanyId } = useAccountingCompany()
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`)
  const [to, setTo] = useState(today())
  const [filter, setFilter] = useState('POSTED')
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

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

  const rows = useMemo(() => entries.filter((e) => (filter === 'COUNTER' ? !!e.reversalOfId : filter === 'REVERSED' ? e.status === 'REVERSED' : e.status === 'POSTED' && !e.reversalOfId)), [entries, filter])

  const reverse = async (entry: any) => {
    const { value: reason } = await Swal.fire({
      title: `Anular póliza #${entry.entryNumber}`, input: 'text', inputLabel: 'Motivo de la anulación',
      text: 'Se registra un contra-asiento con los cargos y abonos invertidos.', showCancelButton: true, confirmButtonText: 'Anular', cancelButtonText: 'Cancelar',
      inputValidator: (value) => (value.trim() ? undefined : 'Escribe el motivo.'),
    })
    if (!reason) return
    try {
      await APIs.reverseJournalEntry(entry.id, { reason: reason.trim() })
      load()
    } catch (error) {
      Swal.fire('No se pudo anular', errorText(error, 'Intenta de nuevo.'), 'error')
    }
  }

  return (
    <AccPage
      title='Reversiones'
      subtitle='Una póliza contabilizada no se edita ni se borra: se anula con un contra-asiento.'
      companies={companies} companyId={companyId} onCompany={setCompanyId}
      filters={
        <>
          <div className='acc__field'><label>Desde</label><input className='inputs__general' type='date' value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className='acc__field'><label>Hasta</label><input className='inputs__general' type='date' value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div className='acc__field'>
            <label>Ver</label>
            <select className='inputs__general' value={filter} onChange={(e) => setFilter(e.target.value)}>
              {FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
        </>
      }
    >
      {loading ? <div className='acc__loading'>Cargando…</div> : rows.length === 0 ? <div className='acc__empty'>No hay pólizas en esta vista.</div> : (
        <div className='acc__table-wrap'>
          <table className='acc__table'>
            <thead><tr><th>No.</th><th>Fecha</th><th>Concepto</th><th>Estado</th><th className='is-num'>Importe</th><th /></tr></thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td>{e.entryNumber}</td><td>{dateText(e.entryDate)}</td><td>{e.description}</td>
                  <td>{e.reversalOfId ? <span className='acc__badge'>Contra-asiento</span> : <StatusBadge status={e.status} />}</td>
                  <td className='is-num'>{money(e.totalDebit)}</td>
                  <td>
                    {canManage && e.status === 'POSTED' && !e.reversalOfId && (
                      <div className='acc__row-actions'><button type='button' className='acc__btn acc__btn--sm acc__btn--danger' onClick={() => reverse(e)}><span className='material-symbols-rounded'>undo</span>Anular</button></div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AccPage>
  )
}

export default Reversiones
