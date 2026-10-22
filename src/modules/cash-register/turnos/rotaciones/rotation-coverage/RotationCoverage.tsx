import React from 'react'
import './RotationCoverage.css'

/** Cobertura real: turnos programados vs. turnos que sí se abrieron, y quién los cubrió (titular, suplente u otro). */
const RotationCoverage: React.FC<{ data: any }> = ({ data }) => {
  const s = data?.summary ?? {}
  const byUser: any[] = data?.byUser ?? []
  return (
    <div className='rotation-coverage'>
      <div className='cash-ui__kpis'>
        <div className={s.coveragePct >= 90 ? 'is-ok' : s.coveragePct >= 70 ? 'is-over' : 'is-short'}>
          <small>Cobertura</small>
          <strong>{s.coveragePct ?? 0}%</strong>
          <span>{s.coveredSlots ?? 0} de {s.expectedSlots ?? 0} turnos programados</span>
        </div>
        <div><small>Turnos abiertos</small><strong>{s.shifts ?? 0}</strong></div>
        <div className={s.substitutions ? 'is-over' : ''}><small>Cubiertos por otro</small><strong>{s.substitutions ?? 0}</strong><span>suplente u otro cajero</span></div>
        <div><small>Sin horario</small><strong>{s.unscheduled ?? 0}</strong><span>turnos fuera de horario</span></div>
      </div>

      <section className='cash-ui__card'>
        <h2>Por cajero</h2>
        {byUser.length ? (
          <div className='cash-ui__list'>
            <div className='cash-ui__row cash-ui__row--head rotation-coverage__row'>
              <span>Cajero</span>
              <span className='is-num'>Como titular</span>
              <span className='is-num'>Como suplente</span>
              <span className='is-num'>Otro</span>
              <span className='is-num'>Total</span>
            </div>
            {byUser.map((u) => (
              <div className='cash-ui__row rotation-coverage__row' key={u.userId}>
                <span data-label='Cajero'><strong>{u.name}</strong></span>
                <span className='is-num' data-label='Titular'>{u.primary}</span>
                <span className='is-num' data-label='Suplente'>{u.backup}</span>
                <span className='is-num' data-label='Otro'>{u.other}</span>
                <span className='is-num' data-label='Total'><strong>{u.total}</strong></span>
              </div>
            ))}
          </div>
        ) : (
          <p className='rotation-coverage__empty'>No se abrieron turnos en este rango.</p>
        )}
      </section>
    </div>
  )
}

export default RotationCoverage
