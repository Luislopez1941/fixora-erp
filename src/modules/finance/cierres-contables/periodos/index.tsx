import React from 'react'
import Swal from 'sweetalert2'
import { useCan } from '../../../../core/permissions/useCan'
import { usePeriods } from '../../shared/periods'
import { AccPage, MONTHS, dateText, useAccountingCompany } from '../../shared/ui'

/** Periodos: cada mes contable con su estado. Un periodo cerrado no recibe asientos hasta reabrirlo. */
const Periodos: React.FC = () => {
  const can = useCan()
  const canManage = can('accounting.manage')
  const { companies, companyId, setCompanyId } = useAccountingCompany()
  const { periods, loading, busy, change } = usePeriods(companyId)

  const toggle = async (p: any) => {
    const closing = p.status === 'OPEN'
    const { isConfirmed } = await Swal.fire({
      title: `${closing ? 'Cerrar' : 'Reabrir'} ${MONTHS[p.month - 1]} ${p.year}`,
      text: closing ? 'Ya no se podrán registrar asientos en este mes. Podrás reabrirlo si hace falta.' : 'El mes volverá a recibir asientos.',
      showCancelButton: true, confirmButtonText: closing ? 'Cerrar periodo' : 'Reabrir periodo', cancelButtonText: 'Cancelar',
    })
    if (isConfirmed) await change(closing ? 'close' : 'reopen', [{ year: p.year, month: p.month }])
  }

  return (
    <AccPage title='Periodos contables' subtitle='Los periodos se crean solos al registrar el primer asiento de cada mes.' companies={companies} companyId={companyId} onCompany={setCompanyId}>
      {loading ? <div className='acc__loading'>Cargando periodos…</div> : periods.length === 0 ? <div className='acc__empty'>Aún no hay periodos: aparecen cuando se registra el primer asiento.</div> : (
        <div className='acc__table-wrap'>
          <table className='acc__table'>
            <thead><tr><th>Periodo</th><th>Del</th><th>Al</th><th>Estado</th><th>Cerrado el</th><th /></tr></thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.id}>
                  <td><strong>{MONTHS[p.month - 1]} {p.year}</strong></td>
                  <td>{dateText(p.startsOn)}</td><td>{dateText(p.endsOn)}</td>
                  <td><span className={`acc__badge ${p.status === 'OPEN' ? 'acc__badge--warn' : 'acc__badge--ok'}`}>{p.status === 'OPEN' ? 'Abierto' : 'Cerrado'}</span></td>
                  <td className='is-muted'>{dateText(p.closedAt)}</td>
                  <td>
                    {canManage && (
                      <div className='acc__row-actions'>
                        <button type='button' className='acc__btn acc__btn--sm' disabled={busy} onClick={() => toggle(p)}>
                          <span className='material-symbols-rounded'>{p.status === 'OPEN' ? 'lock' : 'lock_open'}</span>{p.status === 'OPEN' ? 'Cerrar' : 'Reabrir'}
                        </button>
                      </div>
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

export default Periodos
