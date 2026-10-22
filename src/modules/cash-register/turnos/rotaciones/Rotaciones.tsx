import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import CategoriesStorePicker from '../../../../components/sidebar/sections/catalogos/categories/CategoriesStorePicker'
import { showToast } from '../../../../utils/toast'
import { RANGES, errorText, ymd } from '../../shared/cashFormat'
import { DAYS_SHORT, WEEK_ORDER, fmtRange } from '../../shared/scheduleUtils'
import ModalRotation from './modal-rotation/ModalRotation'
import RotationCalendar from './rotation-calendar/RotationCalendar'
import RotationCoverage from './rotation-coverage/RotationCoverage'
import '../../../../components/general/skeleton/TableSkeleton.css'
import '../../shared/CashShared.css'
import './Rotaciones.css'

type Tab = 'rotations' | 'calendar' | 'coverage'
const CALENDAR_DAYS = 14
const WEEK_LETTER = (i: number) => String.fromCharCode(65 + i)
const mondayOf = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}
const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T12:00:00`)
  d.setDate(d.getDate() + n)
  return ymd(d)
}
const fmtDay = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

/** Rotaciones de turno: patrones de N semanas que se repiten, con integrantes desfasados; calendario de quién trabaja y cobertura real. */
const Rotaciones: React.FC = () => {
  const can = useCan()
  const canView = can('cash-register.turnos-rotaciones.view')
  const canManage = can('cash-register.turnos-rotaciones.manage')

  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [tab, setTab] = useState<Tab>('rotations')
  const [data, setData] = useState<{ rotations: any[]; schedules: any[]; users: any[] }>({ rotations: [], schedules: [], users: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState<{ rotation?: any } | null>(null)

  const [calFrom, setCalFrom] = useState(() => ymd(mondayOf(new Date())))
  const [calendar, setCalendar] = useState<{ days: string[]; rows: any[] } | null>(null)
  const [coverageRange, setCoverageRange] = useState<{ key: string; range: [string, string] }>(() => ({ key: 'week', range: RANGES.find((r) => r.key === 'week')!.get() }))
  const [coverage, setCoverage] = useState<any>(null)
  const [subLoading, setSubLoading] = useState(false)
  const today = ymd(new Date())

  const load = useCallback(async () => {
    if (!(branchId > 0) || !canView) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res: any = await APIs.getCashRotations(branchId)
      setData(res?.data ?? { rotations: [], schedules: [], users: [] })
    } catch (e) {
      setData({ rotations: [], schedules: [], users: [] })
      setError(errorText(e, 'No se pudieron cargar las rotaciones.'))
    } finally {
      setLoading(false)
    }
  }, [branchId, canView])

  useEffect(() => {
    load()
  }, [load])

  // Calendario y cobertura se piden solo al abrir su pestaña
  const loadTab = useCallback(async () => {
    if (!(branchId > 0) || !canView || tab === 'rotations') return
    setSubLoading(true)
    setError('')
    try {
      if (tab === 'calendar') {
        const res: any = await APIs.getCashRotationCalendar(branchId, calFrom, addDays(calFrom, CALENDAR_DAYS - 1))
        setCalendar(res?.data ?? null)
      } else {
        const res: any = await APIs.getCashRotationCoverage(branchId, coverageRange.range[0], coverageRange.range[1])
        setCoverage(res)
      }
    } catch (e) {
      setError(errorText(e, tab === 'calendar' ? 'No se pudo cargar el calendario.' : 'No se pudo cargar la cobertura.'))
    } finally {
      setSubLoading(false)
    }
  }, [branchId, canView, tab, calFrom, coverageRange])

  useEffect(() => {
    loadTab()
  }, [loadTab])

  const scheduleById = useMemo(() => new Map(data.schedules.map((s: any) => [s.id, s])), [data.schedules])

  const toggleActive = async (r: any) => {
    try {
      await APIs.updateCashRotation(r.id, { ...r, active: !r.active })
      showToast({ type: 'info', title: r.active ? 'Rotación desactivada' : 'Rotación activada', text: r.name })
      load()
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo cambiar', text: errorText(e, 'Intenta de nuevo.') })
    }
  }

  const remove = async (r: any) => {
    const ok = await Swal.fire({
      title: '¿Eliminar la rotación?',
      html: `<b>${r.name}</b> y su patrón se eliminan. Los horarios y los turnos ya trabajados no se tocan.`,
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d64545',
    })
    if (!ok.isConfirmed) return
    try {
      await APIs.deleteCashRotation(r.id)
      showToast({ type: 'info', title: 'Rotación eliminada', text: r.name })
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
          <p>No tienes permiso para ver las rotaciones.</p>
        </div>
      </div>
    )
  }

  const calTo = addDays(calFrom, CALENDAR_DAYS - 1)

  return (
    <div className='cash-ui'>
      <div className='cash-ui__container'>
        <div className='cash-ui__header'>
          <div className='cash-ui__title'>
            <h1>Rotaciones</h1>
            <p>Patrones de turnos que se repiten cada N semanas (p. ej. semana A mañana, semana B tarde) y quién los cubre.</p>
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
          <div className='rotaciones__tabs' role='tablist'>
            {([
              ['rotations', 'sync', 'Rotaciones'],
              ['calendar', 'calendar_month', 'Calendario'],
              ['coverage', 'fact_check', 'Cobertura real'],
            ] as [Tab, string, string][]).map(([key, icon, text]) => (
              <button key={key} type='button' role='tab' aria-selected={tab === key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>
                <span className='material-symbols-rounded'>{icon}</span> {text}
              </button>
            ))}
          </div>

          {tab === 'calendar' ? (
            <div className='rotaciones__nav'>
              <button type='button' onClick={() => setCalFrom(addDays(calFrom, -7))} aria-label='Semana anterior'>
                <span className='material-symbols-rounded'>chevron_left</span>
              </button>
              <span>{fmtDay(calFrom)} – {fmtDay(calTo)}</span>
              <button type='button' onClick={() => setCalFrom(addDays(calFrom, 7))} aria-label='Semana siguiente'>
                <span className='material-symbols-rounded'>chevron_right</span>
              </button>
              <button type='button' className='cash-ui__chip' onClick={() => setCalFrom(ymd(mondayOf(new Date())))}>Hoy</button>
            </div>
          ) : null}

          {tab === 'coverage' ? (
            <div className='cash-ui__ranges'>
              {RANGES.filter((r) => r.key !== 'year').map((r) => (
                <button key={r.key} type='button' className={`cash-ui__chip ${coverageRange.key === r.key ? 'is-active' : ''}`} onClick={() => setCoverageRange({ key: r.key, range: r.get() })}>
                  {r.label}
                </button>
              ))}
            </div>
          ) : null}

          {tab === 'rotations' && canManage && branchId > 0 ? (
            <div className='cash-ui__actions'>
              <button type='button' className='btn__general-purple' onClick={() => setEditor({})}>
                <span className='material-symbols-rounded'>add</span> Nueva rotación
              </button>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className='cash-ui__error' role='alert'>
            <span className='material-symbols-rounded' aria-hidden>error</span>
            <span>{error}</span>
            <button type='button' onClick={tab === 'rotations' ? load : loadTab} aria-label='Reintentar'>
              <span className='material-symbols-rounded'>refresh</span>
            </button>
          </div>
        ) : null}

        {!(branchId > 0) ? (
          <div className='cash-ui__state'>
            <span className='material-symbols-rounded' aria-hidden>store</span>
            <p>Elige una sucursal para ver sus rotaciones.</p>
          </div>
        ) : tab === 'calendar' ? (
          subLoading || !calendar ? (
            <span className='table-skeleton__shimmer cash-ui__skel' />
          ) : (
            <RotationCalendar days={calendar.days} rows={calendar.rows} today={today} />
          )
        ) : tab === 'coverage' ? (
          subLoading || !coverage ? <span className='table-skeleton__shimmer cash-ui__skel' /> : <RotationCoverage data={coverage} />
        ) : loading ? (
          <span className='table-skeleton__shimmer cash-ui__skel' />
        ) : !data.rotations.length ? (
          <div className='cash-ui__state'>
            <span className='material-symbols-rounded' aria-hidden>sync</span>
            <p>No hay rotaciones en esta sucursal.</p>
            {canManage ? <small>{data.schedules.some((s: any) => s.active) ? 'Crea la primera con "Nueva rotación".' : 'Primero crea horarios en Turnos › Horarios.'}</small> : null}
          </div>
        ) : (
          <div className='rotaciones__list'>
            {data.rotations.map((r: any) => (
              <article className={`cash-ui__card rotaciones__item ${r.active ? '' : 'is-inactive'}`} key={r.id}>
                <div className='rotaciones__item-head'>
                  <div>
                    <strong>{r.name}</strong>
                    <small>Ciclo de {r.cycleWeeks} semana{r.cycleWeeks > 1 ? 's' : ''} · desde el {fmtDay(r.startDate)}</small>
                  </div>
                  <div className='rotaciones__item-side'>
                    <em className={`cash-ui__badge ${r.active ? 'cash-ui__badge--balanced' : 'cash-ui__badge--cancelled'}`}>{r.active ? 'Activa' : 'Inactiva'}</em>
                    {canManage ? (
                      <div className='rotaciones__actions'>
                        <button type='button' onClick={() => setEditor({ rotation: r })} aria-label={`Editar ${r.name}`} title='Editar'>
                          <span className='material-symbols-rounded'>edit</span>
                        </button>
                        <button type='button' onClick={() => toggleActive(r)} aria-label={r.active ? 'Desactivar' : 'Activar'} title={r.active ? 'Desactivar' : 'Activar'}>
                          <span className='material-symbols-rounded'>{r.active ? 'pause_circle' : 'play_circle'}</span>
                        </button>
                        <button type='button' className='is-danger' onClick={() => remove(r)} aria-label={`Eliminar ${r.name}`} title='Eliminar'>
                          <span className='material-symbols-rounded'>delete</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className='rotaciones__pattern'>
                  <div className='rotaciones__pattern-row rotaciones__pattern-row--head'>
                    <span />
                    {WEEK_ORDER.map((d) => <span key={d}>{DAYS_SHORT[d]}</span>)}
                  </div>
                  {Array.from({ length: r.cycleWeeks }, (_, w) => (
                    <div className='rotaciones__pattern-row' key={w}>
                      <span className='rotaciones__week'>{WEEK_LETTER(w)}</span>
                      {WEEK_ORDER.map((d) => {
                        const slot = (r.slots ?? []).find((s: any) => s.weekIndex === w && s.dayOfWeek === d)
                        const sc: any = slot?.scheduleId ? scheduleById.get(slot.scheduleId) : null
                        return sc ? (
                          <span key={d} className='rotaciones__slot' style={{ ['--rc-color' as any]: sc.color || 'var(--primary-color)' }} title={`${sc.name} · ${fmtRange(sc.startTime, sc.endTime)}`}>
                            {sc.name}
                          </span>
                        ) : (
                          <span key={d} className='rotaciones__slot is-rest'>—</span>
                        )
                      })}
                    </div>
                  ))}
                </div>

                <div className='rotaciones__members'>
                  {(r.members ?? []).length ? (
                    r.members.map((m: any) => (
                      <span key={m.userId} className='rotaciones__member'>
                        {m.name} <b>Sem. {WEEK_LETTER(m.offsetWeeks)}</b>
                      </span>
                    ))
                  ) : (
                    <small>Sin integrantes</small>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {editor ? (
        <ModalRotation branchId={branchId} rotation={editor.rotation} schedules={data.schedules} users={data.users} onClose={() => setEditor(null)} onSaved={load} />
      ) : null}
    </div>
  )
}

export default Rotaciones
