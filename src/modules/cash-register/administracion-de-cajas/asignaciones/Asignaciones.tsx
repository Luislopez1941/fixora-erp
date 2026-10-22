import React, { useCallback, useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import CategoriesStorePicker from '../../../../components/sidebar/sections/catalogos/categories/CategoriesStorePicker'
import { showToast } from '../../../../utils/toast'
import { errorText } from '../../shared/cashFormat'
import ModalAssignment from './modal-assignment/ModalAssignment'
import AssignmentHistory from './assignment-history/AssignmentHistory'
import '../../../../components/general/skeleton/TableSkeleton.css'
import '../../shared/CashShared.css'
import './Asignaciones.css'

const ymdToText = (v?: string | null) => (v ? v.split('-').reverse().join('/') : '')

/** Asignaciones: qué cajeros pueden usar qué caja de la sucursal, con caja predeterminada y vigencia. */
const Asignaciones: React.FC = () => {
  const can = useCan()
  const canView = can('cash-register.administracion-de-cajas-asignaciones.view')
  const canManage = can('cash-register.administracion-de-cajas-asignaciones.manage')

  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [data, setData] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState<{ register: any; assignment?: any } | null>(null)

  const load = useCallback(async () => {
    if (!(branchId > 0) || !canView) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [res, hist]: any[] = await Promise.all([APIs.getCashAssignments(branchId), APIs.getCashAssignmentHistory(branchId)])
      setData(res?.data ?? null)
      setHistory(hist?.data ?? [])
    } catch (e) {
      setData(null)
      setError(errorText(e, 'No se pudieron cargar las asignaciones.'))
    } finally {
      setLoading(false)
    }
  }, [branchId, canView])

  useEffect(() => {
    load()
  }, [load])

  const remove = async (a: any, registerName: string) => {
    const ok = await Swal.fire({
      title: '¿Quitar la asignación?',
      html: `<b>${a.userName}</b> ya no podrá usar la caja <b>${registerName}</b>.`,
      showCancelButton: true,
      confirmButtonText: 'Quitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d64545',
    })
    if (!ok.isConfirmed) return
    try {
      await APIs.deleteCashAssignment(a.id)
      showToast({ type: 'info', title: 'Asignación quitada', text: `${a.userName} · ${registerName}` })
      load()
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo quitar', text: errorText(e, 'Intenta de nuevo.') })
    }
  }

  if (!canView) {
    return (
      <div className='cash-ui'>
        <div className='cash-ui__state'>
          <span className='material-symbols-rounded' aria-hidden>lock</span>
          <p>No tienes permiso para ver las asignaciones de caja.</p>
        </div>
      </div>
    )
  }

  const registers: any[] = data?.registers ?? []
  const assignedUsers = new Set(registers.flatMap((r) => r.assignments.map((a: any) => a.userId)))

  return (
    <div className='cash-ui'>
      <div className='cash-ui__container'>
        <div className='cash-ui__header'>
          <div className='cash-ui__title'>
            <h1>Asignaciones de caja</h1>
            <p>Qué cajeros pueden usar cada caja de la sucursal y cuál es su caja predeterminada.</p>
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
            <p>Elige una sucursal para ver sus cajas.</p>
          </div>
        ) : loading ? (
          <span className='table-skeleton__shimmer cash-ui__skel' />
        ) : (
          <>
            <div className='cash-ui__kpis'>
              <div><small>Cajas</small><strong>{registers.length}</strong><span>{registers.filter((r) => r.active).length} activas</span></div>
              <div className='is-ok'><small>Cajeros asignados</small><strong>{assignedUsers.size}</strong><span>de {data?.users?.length ?? 0} usuarios de la sucursal</span></div>
              <div className='is-warn'><small>Cajas sin cajero</small><strong>{registers.filter((r) => r.active && !r.assignments.some((a: any) => a.current)).length}</strong></div>
            </div>

            <div className='asignaciones__layout'>
              <div className='asignaciones__registers'>
                {registers.length ? (
                  registers.map((r) => (
                    <section className={`cash-ui__card asignaciones__register ${r.active ? '' : 'is-inactive'}`} key={r.id}>
                      <header className='asignaciones__register-head'>
                        <div>
                          <h2>{r.name}</h2>
                          <small>{r.active ? 'Activa' : 'Inactiva'} · {r.assignments.length} cajero(s)</small>
                        </div>
                        {canManage && r.active ? (
                          <button type='button' className='asignaciones__add' onClick={() => setEditor({ register: r })}>
                            <span className='material-symbols-rounded'>person_add</span> Asignar
                          </button>
                        ) : null}
                      </header>

                      {r.assignments.length ? (
                        <ul className='asignaciones__chips'>
                          {r.assignments.map((a: any) => (
                            <li key={a.id} className={`asignaciones__chip ${a.current ? '' : 'is-off'}`}>
                              <span className='asignaciones__chip-name'>
                                {a.isDefault ? <span className='material-symbols-rounded' title='Caja predeterminada'>star</span> : null}
                                {a.userName}
                              </span>
                              <small>
                                {!a.active ? 'Inactiva' : a.current ? (a.validTo ? `Hasta ${ymdToText(a.validTo)}` : 'Vigente') : a.validFrom ? `Desde ${ymdToText(a.validFrom)}` : 'Vencida'}
                                {a.hasOpenShift ? ' · Turno abierto' : ''}
                              </small>
                              {canManage ? (
                                <span className='asignaciones__chip-actions'>
                                  <button type='button' onClick={() => setEditor({ register: r, assignment: a })} aria-label={`Editar asignación de ${a.userName}`}>
                                    <span className='material-symbols-rounded'>edit</span>
                                  </button>
                                  <button type='button' onClick={() => remove(a, r.name)} disabled={a.hasOpenShift} title={a.hasOpenShift ? 'Tiene turno abierto en esta caja' : 'Quitar'} aria-label={`Quitar a ${a.userName}`}>
                                    <span className='material-symbols-rounded'>close</span>
                                  </button>
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className='asignaciones__empty'>Sin cajeros asignados.</p>
                      )}

                      {r.schedules?.length ? (
                        <div className='asignaciones__schedules'>
                          <small>Horarios programados de esta caja</small>
                          {r.schedules.map((s: any) => (
                            <p key={s.id}>
                              <b>{s.name}</b> {s.startTime}–{s.endTime}
                              {(s.assignments ?? []).length ? ` · ${(s.assignments as any[]).map((x) => `${x.name}${x.role === 'PRIMARY' ? ' (titular)' : ''}`).join(', ')}` : ' · sin titular'}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </section>
                  ))
                ) : (
                  <div className='cash-ui__state'>
                    <span className='material-symbols-rounded' aria-hidden>point_of_sale</span>
                    <p>Esta sucursal no tiene cajas registradas.</p>
                    <small>Créalas en Administración de cajas › Cajas registradas.</small>
                  </div>
                )}
              </div>

              <aside className='cash-ui__card asignaciones__history'>
                <h2>Cambios recientes</h2>
                <AssignmentHistory rows={history} />
              </aside>
            </div>
          </>
        )}
      </div>

      {editor ? (
        <ModalAssignment register={editor.register} assignment={editor.assignment} users={data?.users ?? []} onClose={() => setEditor(null)} onSaved={load} />
      ) : null}
    </div>
  )
}

export default Asignaciones
