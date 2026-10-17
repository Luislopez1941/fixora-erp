import React, { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { usePeriods } from '../../shared/periods'
import { AccPage, MONTHS, isoDate, money, useAccountingCompany } from '../../shared/ui'

/** Cierre mensual y anual: revisa que el mes cuadre y lo cierra; al terminar el año cierra el ejercicio completo. */
const CierreMensualYAnual: React.FC = () => {
  const can = useCan()
  const canManage = can('accounting.manage')
  const { companies, companyId, setCompanyId } = useAccountingCompany()
  const { periods, loading, busy, change } = usePeriods(companyId)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [balance, setBalance] = useState<any | null>(null)
  const [checking, setChecking] = useState(false)

  const period = periods.find((p) => p.year === year && p.month === month)
  const yearPeriods = useMemo(() => periods.filter((p) => p.year === year), [periods, year])
  const yearOpen = yearPeriods.filter((p) => p.status === 'OPEN')
  const years = useMemo(() => Array.from(new Set([now.getFullYear(), ...periods.map((p) => p.year)])).sort((a, b) => b - a), [periods]) // eslint-disable-line react-hooks/exhaustive-deps

  // Revisión previa: la balanza del mes debe cuadrar
  useEffect(() => {
    if (!companyId) return
    let alive = true
    setChecking(true)
    const last = new Date(year, month, 0).getDate()
    APIs.getTrialBalance(companyId, isoDate(new Date(year, month - 1, 1)), isoDate(new Date(year, month - 1, last)))
      .then((r: any) => alive && setBalance(r?.data && !r.accounts ? r.data : r))
      .catch(() => alive && setBalance(null))
      .finally(() => alive && setChecking(false))
    return () => { alive = false }
  }, [companyId, year, month, periods])

  const closeMonth = async () => {
    const { isConfirmed } = await Swal.fire({ title: `Cerrar ${MONTHS[month - 1]} ${year}`, text: 'Ya no se podrán registrar asientos en este mes.', showCancelButton: true, confirmButtonText: 'Cerrar mes', cancelButtonText: 'Cancelar' })
    if (isConfirmed) await change('close', [{ year, month }])
  }

  const closeYear = async () => {
    const { isConfirmed } = await Swal.fire({ title: `Cerrar el año ${year}`, text: `Se cerrarán ${yearOpen.length} periodos abiertos, de enero a diciembre.`, showCancelButton: true, confirmButtonText: 'Cerrar el año', cancelButtonText: 'Cancelar' })
    if (isConfirmed) await change('close', [...yearOpen].sort((a, b) => a.month - b.month).map((p) => ({ year, month: p.month })))
  }

  const checks = [
    { ok: !!period, label: period ? 'El periodo existe' : 'El mes aún no tiene asientos (no hay nada que cerrar)' },
    { ok: period?.status === 'OPEN', label: period ? (period.status === 'OPEN' ? 'El periodo está abierto' : 'El periodo ya está cerrado') : 'Periodo sin abrir' },
    { ok: !!balance?.balanced, label: checking ? 'Revisando la balanza…' : balance ? (balance.balanced ? `La balanza cuadra (${money(balance.totalDebit)})` : 'La balanza del mes no cuadra') : 'No se pudo revisar la balanza' },
  ]
  const canClose = canManage && period?.status === 'OPEN' && !!balance?.balanced

  return (
    <AccPage
      title='Cierre mensual y anual'
      subtitle='Revisa el mes, ciérralo y, al terminar el año, cierra el ejercicio completo.'
      companies={companies} companyId={companyId} onCompany={setCompanyId}
      filters={
        <>
          <div className='acc__field'>
            <label>Año</label>
            <select className='inputs__general' value={year} onChange={(e) => setYear(Number(e.target.value))}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select>
          </div>
          <div className='acc__field'>
            <label>Mes</label>
            <select className='inputs__general' value={month} onChange={(e) => setMonth(Number(e.target.value))}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
          </div>
        </>
      }
    >
      {loading ? <div className='acc__loading'>Cargando…</div> : (
        <>
          <div className='acc__panel'>
            <h2>Cierre de {MONTHS[month - 1]} {year}</h2>
            {checks.map((c) => (
              <div key={c.label} className={`acc__balance ${c.ok ? 'acc__balance--ok' : 'acc__balance--bad'}`}>
                <span className='material-symbols-rounded'>{c.ok ? 'check_circle' : 'error'}</span>{c.label}
              </div>
            ))}
            <p className='acc__hint'>Los asientos en borrador impiden el cierre: el sistema avisa si hay alguno.</p>
            <div className='acc__filters'>
              <button type='button' className='acc__btn acc__btn--primary' disabled={!canClose || busy} onClick={closeMonth}><span className='material-symbols-rounded'>lock</span>Cerrar mes</button>
              {period?.status === 'CLOSED' && canManage && (
                <button type='button' className='acc__btn' disabled={busy} onClick={() => change('reopen', [{ year, month }])}><span className='material-symbols-rounded'>lock_open</span>Reabrir mes</button>
              )}
            </div>
          </div>

          <div className='acc__panel'>
            <h2>Cierre anual {year}</h2>
            <p className='acc__hint'>{yearPeriods.length === 0 ? 'Este año no tiene periodos.' : yearOpen.length === 0 ? 'El ejercicio está completamente cerrado.' : `Quedan ${yearOpen.length} periodos abiertos: ${[...yearOpen].sort((a, b) => a.month - b.month).map((p) => MONTHS[p.month - 1].slice(0, 3)).join(', ')}.`}</p>
            <div className='acc__filters'>
              <button type='button' className='acc__btn' disabled={!canManage || busy || yearOpen.length === 0} onClick={closeYear}><span className='material-symbols-rounded'>event_available</span>Cerrar el año</button>
            </div>
          </div>
        </>
      )}
    </AccPage>
  )
}

export default CierreMensualYAnual
