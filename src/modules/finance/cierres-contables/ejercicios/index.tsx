import React, { useMemo } from 'react'
import Swal from 'sweetalert2'
import { useCan } from '../../../../core/permissions/useCan'
import { usePeriods } from '../../shared/periods'
import { AccPage, MONTHS, useAccountingCompany } from '../../shared/ui'

/** Ejercicios: cada año fiscal con sus 12 meses; permite cerrar o reabrir todo el ejercicio de una vez. */
const Ejercicios: React.FC = () => {
  const can = useCan()
  const canManage = can('accounting.manage')
  const { companies, companyId, setCompanyId } = useAccountingCompany()
  const { periods, loading, busy, change } = usePeriods(companyId)

  const years = useMemo(() => {
    const map = new Map<number, any[]>()
    for (const p of periods) map.set(p.year, [...(map.get(p.year) ?? []), p])
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0])
  }, [periods])

  const closeYear = async (year: number, list: any[]) => {
    const open = list.filter((p) => p.status === 'OPEN').sort((a, b) => a.month - b.month)
    const { isConfirmed } = await Swal.fire({
      title: `Cerrar el ejercicio ${year}`, text: `Se cerrarán ${open.length} periodos abiertos, de enero a diciembre. Si alguno tiene asientos en borrador, el cierre se detiene ahí.`,
      showCancelButton: true, confirmButtonText: 'Cerrar ejercicio', cancelButtonText: 'Cancelar',
    })
    if (isConfirmed) await change('close', open.map((p) => ({ year, month: p.month })))
  }

  const reopenYear = async (year: number, list: any[]) => {
    const closed = list.filter((p) => p.status === 'CLOSED').sort((a, b) => b.month - a.month)
    const { isConfirmed } = await Swal.fire({
      title: `Reabrir el ejercicio ${year}`, text: `Se reabrirán ${closed.length} periodos cerrados.`,
      showCancelButton: true, confirmButtonText: 'Reabrir ejercicio', cancelButtonText: 'Cancelar',
    })
    if (isConfirmed) await change('reopen', closed.map((p) => ({ year, month: p.month })))
  }

  return (
    <AccPage title='Ejercicios' subtitle='Años fiscales y el estado de cada uno de sus meses.' companies={companies} companyId={companyId} onCompany={setCompanyId}>
      {loading ? <div className='acc__loading'>Cargando ejercicios…</div> : years.length === 0 ? <div className='acc__empty'>Aún no hay ejercicios: aparecen cuando se registra el primer asiento.</div> : years.map(([year, list]) => {
        const open = list.filter((p) => p.status === 'OPEN').length
        const closed = list.length - open
        return (
          <div className='acc__year' key={year}>
            <div className='acc__year-head'>
              <h3>Ejercicio {year} <span className={`acc__badge ${open === 0 ? 'acc__badge--ok' : 'acc__badge--warn'}`}>{open === 0 ? 'Cerrado' : `${open} abiertos · ${closed} cerrados`}</span></h3>
              {canManage && (
                <div className='acc__filters'>
                  {open > 0 && <button type='button' className='acc__btn acc__btn--sm' disabled={busy} onClick={() => closeYear(year, list)}><span className='material-symbols-rounded'>lock</span>Cerrar ejercicio</button>}
                  {closed > 0 && <button type='button' className='acc__btn acc__btn--sm' disabled={busy} onClick={() => reopenYear(year, list)}><span className='material-symbols-rounded'>lock_open</span>Reabrir ejercicio</button>}
                </div>
              )}
            </div>
            <div className='acc__months'>
              {MONTHS.map((name, index) => {
                const period = list.find((p) => p.month === index + 1)
                return (
                  <div key={name} className={`acc__month ${period ? (period.status === 'OPEN' ? 'acc__month--open' : 'acc__month--closed') : 'acc__month--none'}`}>
                    <strong>{name.slice(0, 3)}</strong>{period ? (period.status === 'OPEN' ? 'Abierto' : 'Cerrado') : 'Sin movimientos'}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </AccPage>
  )
}

export default Ejercicios
