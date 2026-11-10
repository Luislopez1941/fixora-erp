import React, { useState } from 'react'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import PosModal from '../../shared/pos-modal/PosModal'
import { money } from '../../shared/restaurantTypes'
import { useMenuData } from '../shared/useMenuData'
import { ModifierGroup } from '../shared/menuTypes'
import '../shared/Menus.css'

const fetchGroups = () => APIs.getRestaurantModifierGroups()

interface Form {
  id?: number
  name: string
  required: boolean
  minSelect: number
  maxSelect: number
}

const EMPTY: Form = { name: '', required: false, minSelect: 0, maxSelect: 1 }

/** Opciones que el mesero elige al pedir un platillo (término de la carne, extras, sin cebolla…). */
const Modificadores: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.menus-modificadores.view')
  const canManage = can('restaurants.manage') || can('restaurants.create')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const { data: groups, loading, error, busy, load, run } = useMenuData<ModifierGroup[]>(fetchGroups, canView, [])
  const [form, setForm] = useState<Form | null>(null)
  const [draft, setDraft] = useState<Record<number, { name: string; price: string }>>({})

  const save = () => {
    if (!form) return
    const body = { name: form.name, required: form.required, minSelect: form.required ? Math.max(1, form.minSelect) : form.minSelect, maxSelect: form.maxSelect }
    run(() => (form.id ? APIs.updateRestaurantModifierGroup(form.id, body) : APIs.createRestaurantModifierGroup(body)), form.id ? 'Grupo actualizado' : 'Grupo creado', () => setForm(null))
  }

  const addOption = (g: ModifierGroup) => {
    const d = draft[g.id]
    if (!d?.name.trim()) return
    run(() => APIs.createRestaurantModifierOption(g.id, { name: d.name, priceDelta: Number(d.price) || 0 }), 'Opción agregada', () => setDraft({ ...draft, [g.id]: { name: '', price: '' } }))
  }

  const rule = (g: ModifierGroup) =>
    g.required ? (g.maxSelect > 1 ? `Obligatorio · elegir de ${g.minSelect} a ${g.maxSelect}` : 'Obligatorio · elegir una') : g.maxSelect > 1 ? `Opcional · hasta ${g.maxSelect}` : 'Opcional · hasta una'

  return (
    <RestaurantPage
      title='Modificadores'
      subtitle='Grupos de opciones que se ligan a los platillos. Cada opción puede tener un cargo extra.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading}
      error={error}
      onRetry={load}
      toolbar={
        canManage ? (
          <button type='button' className='btn__general-purple' onClick={() => setForm(EMPTY)} disabled={busy}>
            <span className='material-symbols-rounded'>add</span> Nuevo grupo
          </button>
        ) : null
      }
    >
      {!groups.length ? (
        <p className='restaurant-empty'>Todavía no hay grupos. Por ejemplo "Término de la carne" con Término medio, Tres cuartos y Bien cocida.</p>
      ) : (
        <div className='menus-groups'>
          {groups.map((g) => (
            <section key={g.id} className='menus-groupcard'>
              <header className='menus-groupcard__head'>
                <div>
                  <h2>
                    {g.name}
                    {!g.active ? <span className='restaurant-badge is-gray'>Oculto</span> : null}
                  </h2>
                  <small>{rule(g)} · en {g.dishCount} platillo(s)</small>
                </div>
                {canManage ? (
                  <div className='menus-row__actions'>
                    <button type='button' className='menus-icon' title='Editar' aria-label={`Editar ${g.name}`} onClick={() => setForm({ id: g.id, name: g.name, required: g.required, minSelect: g.minSelect, maxSelect: g.maxSelect })}>
                      <span className='material-symbols-rounded'>edit</span>
                    </button>
                    <button
                      type='button'
                      className='menus-icon is-danger'
                      title='Eliminar'
                      aria-label={`Eliminar ${g.name}`}
                      disabled={busy}
                      onClick={() => window.confirm(`¿Eliminar el grupo "${g.name}" y sus opciones? Se quita de los platillos que lo usan.`) && run(() => APIs.deleteRestaurantModifierGroup(g.id), 'Grupo eliminado')}
                    >
                      <span className='material-symbols-rounded'>delete</span>
                    </button>
                  </div>
                ) : null}
              </header>
              <div>
                {g.options.map((o) => (
                  <div key={o.id} className={`menus-option ${o.active ? '' : 'is-off'}`}>
                    <span>{o.name}</span>
                    <small>{o.priceDelta > 0 ? `+ ${money(o.priceDelta)}` : 'Sin costo'}</small>
                    {canManage ? (
                      <span className='menus-row__actions'>
                        <button type='button' className='menus-icon' title={o.active ? 'Desactivar' : 'Activar'} aria-label={o.active ? `Desactivar ${o.name}` : `Activar ${o.name}`} disabled={busy} onClick={() => run(() => APIs.updateRestaurantModifierOption(o.id, { active: !o.active }), o.active ? 'Opción desactivada' : 'Opción activada')}>
                          <span className='material-symbols-rounded'>{o.active ? 'toggle_on' : 'toggle_off'}</span>
                        </button>
                        <button type='button' className='menus-icon is-danger' title='Quitar' aria-label={`Quitar ${o.name}`} disabled={busy} onClick={() => run(() => APIs.deleteRestaurantModifierOption(o.id), 'Opción eliminada')}>
                          <span className='material-symbols-rounded'>close</span>
                        </button>
                      </span>
                    ) : null}
                  </div>
                ))}
                {!g.options.length ? <p className='pos-note'>Sin opciones todavía.</p> : null}
              </div>
              {canManage ? (
                <div className='menus-addopt'>
                  <input
                    placeholder='Nueva opción'
                    aria-label={`Nueva opción de ${g.name}`}
                    maxLength={80}
                    value={draft[g.id]?.name ?? ''}
                    onChange={(e) => setDraft({ ...draft, [g.id]: { name: e.target.value, price: draft[g.id]?.price ?? '' } })}
                    onKeyDown={(e) => e.key === 'Enter' && addOption(g)}
                  />
                  <input
                    placeholder='Extra $'
                    aria-label='Cargo extra'
                    inputMode='decimal'
                    value={draft[g.id]?.price ?? ''}
                    onChange={(e) => setDraft({ ...draft, [g.id]: { name: draft[g.id]?.name ?? '', price: e.target.value } })}
                    onKeyDown={(e) => e.key === 'Enter' && addOption(g)}
                  />
                  <button type='button' className='btn__general-purple' onClick={() => addOption(g)} disabled={busy || !draft[g.id]?.name?.trim()}>Agregar</button>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}

      {form ? (
        <PosModal
          title={form.id ? 'Editar grupo' : 'Nuevo grupo'}
          onClose={() => setForm(null)}
          actions={
            <>
              <button type='button' className='btn__general-gray' onClick={() => setForm(null)}>Cancelar</button>
              <button type='button' className='btn__general-purple' onClick={save} disabled={busy || !form.name.trim() || form.minSelect > form.maxSelect}>Guardar</button>
            </>
          }
        >
          <label className='pos-field'>
            Nombre del grupo
            <input value={form.name} maxLength={80} autoFocus onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder='Término de la carne' />
          </label>
          <div className='pos-chips'>
            <button type='button' className={`pos-chip ${form.required ? 'is-active' : ''}`} aria-pressed={form.required} onClick={() => setForm({ ...form, required: !form.required, minSelect: !form.required ? Math.max(1, form.minSelect) : form.minSelect })}>
              Obligatorio al pedir
            </button>
          </div>
          <div className='pos-row'>
            <label className='pos-field'>
              Elegir como mínimo
              <input type='number' min={form.required ? 1 : 0} value={form.minSelect} onChange={(e) => setForm({ ...form, minSelect: Math.max(0, Number(e.target.value) || 0) })} />
            </label>
            <label className='pos-field'>
              Elegir como máximo
              <input type='number' min={1} value={form.maxSelect} onChange={(e) => setForm({ ...form, maxSelect: Math.max(1, Number(e.target.value) || 1) })} />
            </label>
          </div>
          {form.minSelect > form.maxSelect ? <p className='pos-error'>El mínimo no puede ser mayor que el máximo.</p> : null}
        </PosModal>
      ) : null}
    </RestaurantPage>
  )
}

export default Modificadores
