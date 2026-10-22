import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import CategoriesStorePicker from '../../../../components/sidebar/sections/catalogos/categories/CategoriesStorePicker'
import { showToast } from '../../../../utils/toast'
import { errorText } from '../../shared/cashFormat'
import { SCHEDULE_COLORS, crossesMidnight, daysText, fmtRange } from '../../shared/scheduleUtils'
import ModalSchedule from './modal-schedule/ModalSchedule'
import ScheduleWeek from './schedule-week/ScheduleWeek'
import '../../../../components/general/skeleton/TableSkeleton.css'
import '../../shared/CashShared.css'
import './Horarios.css'

/** Horarios de turno de la sucursal (los mismos que usa "Horario programado" en la ficha de cobro): lista y vista semanal. */
const Horarios: React.FC = () => {
  const can = useCan()
  const canView = can('cash-register.turnos-horarios.view')
  const canManage = can('cash-register.turnos-horarios.manage')

  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [schedules, setSchedules] = useState<any[]>([])
  const [registers, setRegisters] = useState<any[]>([])
  const [registerFilter, setRegisterFilter] = useState<number>(-1)
  const [view, setView] = useState<'list' | 'week'>('list')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState<{ schedule?: any; mode: 'create' | 'edit' | 'duplicate' } | null>(null)

  const load = useCallback(async () => {
    if (!(branchId > 0) || !canView) {
      setSchedules([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [s, r]: any[] = await Promise.all([APIs.getCashSchedules(branchId), APIs.getCashRegisters(branchId)])
      setSchedules(s?.data ?? [])
      setRegisters(Array.isArray(r) ? r : r?.data ?? [])
    } catch (e) {
      setSchedules([])
      setError(errorText(e, 'No se pudieron cargar los horarios.'))
    } finally {
      setLoading(false)
    }
  }, [branchId, canView])

  useEffect(() => {
    load()
  }, [load])

  const visible = useMemo(
    () => schedules.filter((s) => registerFilter === -1 || (registerFilter === 0 ? !s.registerId : s.registerId === registerFilter)),
    [schedules, registerFilter],
  )

  const toggleActive = async (s: any) => {
    try {
      await APIs.updateCashSchedule(s.id, { active: !s.active })
      showToast({ type: 'info', title: s.active ? 'Horario desactivado' : 'Horario activado', text: s.name })
      load()
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo cambiar', text: errorText(e, 'Intenta de nuevo.') })
    }
  }

  const remove = async (s: any) => {
    const ok = await Swal.fire({
      title: '¿Eliminar el horario?',
      html: `<b>${s.name}</b> dejará de aplicar. Los turnos ya trabajados conservan su historial.`,
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d64545',
    })
    if (!ok.isConfirmed) return
    try {
      await APIs.deleteCashSchedule(s.id)
      showToast({ type: 'info', title: 'Horario eliminado', text: s.name })
      load()
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo eliminar', text: errorText(e, 'Intenta de nuevo.') })
    }
  }

  if (!canView) {
    return (
      <div className='cash-ui'>
        <div className='cash-ui__state'>
          <span className='material-symbols-rounded' aria-hidden>lock</span>
          <p>No tienes permiso para ver los horarios.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='cash-ui'>
      <div className='cash-ui__container'>
        <div className='cash-ui__header'>
          <div className='cash-ui__title'>
            <h1>Horarios de turno</h1>
            <p>Entrada, salida y días de cada turno. Son los que aparecen como "Horario programado" al cobrar.</p>
          </div>
          <CategoriesStorePicker
            branchId={branchId}
            onBranchIdChange={(id) => {
              setBranchId(id)
              localStorage.setItem('categories-store-id', String(id))
              localStorage.setItem('categories-picker-branch-id', String(id))
            }}
          />
        </div>

        <div className='cash-ui__filters'>
          <div className='horarios__toggle' role='tablist'>
            <button type='button' role='tab' aria-selected={view === 'list'} className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')}>
              <span className='material-symbols-rounded'>list</span> Lista
            </button>
            <button type='button' role='tab' aria-selected={view === 'week'} className={view === 'week' ? 'is-active' : ''} onClick={() => setView('week')}>
              <span className='material-symbols-rounded'>calendar_view_week</span> Semana
            </button>
          </div>
          <select className='inputs__general cash-ui__select' value={registerFilter} onChange={(e) => setRegisterFilter(Number(e.target.value))} aria-label='Caja'>
            <option value={-1}>Todas las cajas</option>
            <option value={0}>Sin caja específica</option>
            {registers.map((r: any) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          {canManage && branchId > 0 ? (
            <div className='cash-ui__actions'>
              <button type='button' className='btn__general-purple' onClick={() => setEditor({ mode: 'create' })}>
                <span className='material-symbols-rounded'>add</span> Nuevo horario
              </button>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className='cash-ui__error' role='alert'>
            <span className='material-symbols-rounded' aria-hidden>error</span>
            <span>{error}</span>
            <button type='button' onClick={load} aria-label='Reintentar'>
              <span className='material-symbols-rounded'>refresh</span>
            </button>
          </div>
        ) : null}

        {!(branchId > 0) ? (
          <div className='cash-ui__state'>
            <span className='material-symbols-rounded' aria-hidden>store</span>
            <p>Elige una sucursal para ver sus horarios.</p>
          </div>
        ) : loading ? (
          <span className='table-skeleton__shimmer cash-ui__skel' />
        ) : !visible.length ? (
          <div className='cash-ui__state'>
            <span className='material-symbols-rounded' aria-hidden>schedule</span>
            <p>No hay horarios {registerFilter === -1 ? 'en esta sucursal' : 'con este filtro'}.</p>
            {canManage ? <small>Crea el primero con "Nuevo horario".</small> : null}
          </div>
        ) : view === 'week' ? (
          <section className='cash-ui__card'>
            <h2>Semana</h2>
            <ScheduleWeek schedules={visible} onOpen={canManage ? (s) => setEditor({ schedule: s, mode: 'edit' }) : undefined} />
          </section>
        ) : (
          <div className='horarios__list'>
            {visible.map((s, i) => {
              const primary = (s.assignments ?? []).find((a: any) => a.role === 'PRIMARY')
              return (
                <article className={`cash-ui__card horarios__item ${s.active ? '' : 'is-inactive'}`} key={s.id} style={{ borderLeftColor: s.color || SCHEDULE_COLORS[i % SCHEDULE_COLORS.length] }}>
                  <div className='horarios__item-main'>
                    <strong>{s.name}</strong>
                    <span className='horarios__time'>
                      {fmtRange(s.startTime, s.endTime)}
                      {crossesMidnight(s) ? <em className='cash-ui__badge cash-ui__badge--info'>Cruza medianoche</em> : null}
                    </span>
                    <small>{daysText(s.days ?? [])} · {s.register?.name ?? 'Toda la sucursal'}</small>
                    <small>
                      Titular: {primary ? `${primary.user?.firstName ?? ''} ${primary.user?.firstLastName ?? ''}`.trim() : 'sin asignar'}
                      {s.entryToleranceMinutes != null || s.exitToleranceMinutes != null
                        ? ` · Tolerancia ${s.entryToleranceMinutes ?? 0}/${s.exitToleranceMinutes ?? 0} min`
                        : ''}
                    </small>
                  </div>
                  <div className='horarios__item-side'>
                    <em className={`cash-ui__badge ${s.active ? 'cash-ui__badge--balanced' : 'cash-ui__badge--cancelled'}`}>{s.active ? 'Activo' : 'Inactivo'}</em>
                    {canManage ? (
                      <div className='horarios__actions'>
                        <button type='button' onClick={() => setEditor({ schedule: s, mode: 'edit' })} aria-label={`Editar ${s.name}`} title='Editar'>
                          <span className='material-symbols-rounded'>edit</span>
                        </button>
                        <button type='button' onClick={() => setEditor({ schedule: s, mode: 'duplicate' })} aria-label={`Duplicar ${s.name}`} title='Duplicar'>
                          <span className='material-symbols-rounded'>content_copy</span>
                        </button>
                        <button type='button' onClick={() => toggleActive(s)} aria-label={s.active ? 'Desactivar' : 'Activar'} title={s.active ? 'Desactivar' : 'Activar'}>
                          <span className='material-symbols-rounded'>{s.active ? 'pause' : 'play_arrow'}</span>
                        </button>
                        <button type='button' className='is-danger' onClick={() => remove(s)} aria-label={`Eliminar ${s.name}`} title='Eliminar'>
                          <span className='material-symbols-rounded'>delete</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        )}
        <p className='horarios__note'>
          El titular y los suplentes de cada horario se asignan en Turnos › Programación.
        </p>
      </div>

      {editor ? (
        <ModalSchedule branchId={branchId} registers={registers} schedule={editor.schedule} mode={editor.mode} onClose={() => setEditor(null)} onSaved={load} />
      ) : null}
    </div>
  )
}

export default Horarios
