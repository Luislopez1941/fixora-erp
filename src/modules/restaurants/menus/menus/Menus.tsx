import React, { useState } from 'react'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import PosModal from '../../shared/pos-modal/PosModal'
import { useMenuData } from '../shared/useMenuData'
import { DAY_LABELS, DAY_NAMES, Menu, scheduleText } from '../shared/menuTypes'
import '../shared/Menus.css'

const fetchMenus = () => APIs.getRestaurantMenus()

interface Form {
  id?: number
  name: string
  description: string
  days: number[]
  allDay: boolean
  startTime: string
  endTime: string
}

const EMPTY: Form = { name: '', description: '', days: [], allDay: true, startTime: '08:00', endTime: '12:00' }

/** Menús de la carta: cada uno con sus días y horario (Desayunos, Comida corrida, Carta de noche…). */
const Menus: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.menus-menus.view')
  const canManage = can('restaurants.manage') || can('restaurants.create')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const { data: menus, loading, error, busy, load, run } = useMenuData<Menu[]>(fetchMenus, canView, [])
  const [form, setForm] = useState<Form | null>(null)

  const save = () => {
    if (!form) return
    const body = {
      name: form.name,
      description: form.description,
      days: form.days,
      startTime: form.allDay ? null : form.startTime,
      endTime: form.allDay ? null : form.endTime,
    }
    run(() => (form.id ? APIs.updateRestaurantMenu(form.id, body) : APIs.createRestaurantMenu(body)), form.id ? 'Menú actualizado' : 'Menú creado', () => setForm(null))
  }

  return (
    <RestaurantPage
      title='Menús'
      subtitle='Las cartas del restaurante y cuándo se ofrece cada una. Un platillo puede estar en varios menús.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading}
      error={error}
      onRetry={load}
      toolbar={
        canManage ? (
          <button type='button' className='btn__general-purple' onClick={() => setForm(EMPTY)} disabled={busy}>
            <span className='material-symbols-rounded'>add</span> Nuevo menú
          </button>
        ) : null
      }
    >
      {!menus.length ? (
        <p className='restaurant-empty'>Todavía no hay menús. Crea el primero, por ejemplo "Comida" o "Desayunos".</p>
      ) : (
        <div className='menus-list'>
          {menus.map((m) => (
            <div key={m.id} className={`menus-row ${m.active ? '' : 'is-off'}`}>
              <div className='menus-row__main'>
                <strong>
                  {m.name}
                  {!m.active ? <span className='restaurant-badge is-gray'>Oculto</span> : null}
                </strong>
                <small>{scheduleText(m)}</small>
                {m.description ? <small>{m.description}</small> : null}
                {m.categories.length ? (
                  <div className='menus-row__tags'>
                    {m.categories.map((c) => (
                      <span key={c.id} className='restaurant-badge is-gray' style={{ marginLeft: 0 }}>{c.name}</span>
                    ))}
                  </div>
                ) : null}
              </div>
              <span className='menus-row__num'>{m.dishCount} platillo(s)</span>
              {canManage ? (
                <div className='menus-row__actions'>
                  <button
                    type='button'
                    className='menus-icon'
                    title='Editar'
                    aria-label={`Editar ${m.name}`}
                    onClick={() => setForm({ id: m.id, name: m.name, description: m.description ?? '', days: m.days, allDay: !m.startTime, startTime: m.startTime ?? '08:00', endTime: m.endTime ?? '12:00' })}
                  >
                    <span className='material-symbols-rounded'>edit</span>
                  </button>
                  <button
                    type='button'
                    className='menus-icon'
                    title={m.active ? 'Ocultar' : 'Mostrar'}
                    aria-label={m.active ? `Ocultar ${m.name}` : `Mostrar ${m.name}`}
                    disabled={busy}
                    onClick={() => run(() => APIs.updateRestaurantMenu(m.id, { active: !m.active }), m.active ? 'Menú oculto' : 'Menú visible')}
                  >
                    <span className='material-symbols-rounded'>{m.active ? 'visibility_off' : 'visibility'}</span>
                  </button>
                  <button
                    type='button'
                    className='menus-icon is-danger'
                    title='Eliminar'
                    aria-label={`Eliminar ${m.name}`}
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(`¿Eliminar el menú "${m.name}"? Sus platillos no se borran, solo dejan de estar en este menú.`)) {
                        run(() => APIs.deleteRestaurantMenu(m.id), 'Menú eliminado')
                      }
                    }}
                  >
                    <span className='material-symbols-rounded'>delete</span>
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {form ? (
        <PosModal
          title={form.id ? 'Editar menú' : 'Nuevo menú'}
          onClose={() => setForm(null)}
          actions={
            <>
              <button type='button' className='btn__general-gray' onClick={() => setForm(null)}>Cancelar</button>
              <button type='button' className='btn__general-purple' onClick={save} disabled={busy || !form.name.trim()}>Guardar</button>
            </>
          }
        >
          <label className='pos-field'>
            Nombre
            <input value={form.name} maxLength={80} autoFocus onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder='Comida corrida' />
          </label>
          <label className='pos-field'>
            Descripción (opcional)
            <input value={form.description} maxLength={255} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div className='pos-field'>
            Días
            <div className='pos-chips'>
              {DAY_LABELS.map((label, i) => {
                const day = i + 1
                const on = form.days.includes(day)
                return (
                  <button
                    key={day}
                    type='button'
                    className={`pos-chip ${on ? 'is-active' : ''}`}
                    aria-pressed={on}
                    aria-label={DAY_NAMES[i]}
                    onClick={() => setForm({ ...form, days: on ? form.days.filter((d) => d !== day) : [...form.days, day].sort() })}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <span className='pos-note'>{form.days.length ? 'Solo esos días.' : 'Sin elegir ninguno se ofrece todos los días.'}</span>
          </div>
          <div className='pos-chips'>
            <button type='button' className={`pos-chip ${form.allDay ? 'is-active' : ''}`} aria-pressed={form.allDay} onClick={() => setForm({ ...form, allDay: true })}>Todo el día</button>
            <button type='button' className={`pos-chip ${!form.allDay ? 'is-active' : ''}`} aria-pressed={!form.allDay} onClick={() => setForm({ ...form, allDay: false })}>Con horario</button>
          </div>
          {!form.allDay ? (
            <div className='pos-row'>
              <label className='pos-field'>
                Desde
                <input type='time' value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </label>
              <label className='pos-field'>
                Hasta
                <input type='time' value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </label>
            </div>
          ) : null}
        </PosModal>
      ) : null}
    </RestaurantPage>
  )
}

export default Menus
