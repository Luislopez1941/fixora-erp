import React, { useCallback, useState } from 'react'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import { showToast } from '../../../../utils/toast'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import PosModal from '../../shared/pos-modal/PosModal'
import { errorText, money } from '../../shared/restaurantTypes'
import KindSelect from '../../shared/KindSelect'
import CategoryCascade from '../shared/CategoryCascade'
import { useMenuData } from '../shared/useMenuData'
import { Dish, Menu, ModifierGroup, prepSummary, prepTime, splitList } from '../shared/menuTypes'
import '../shared/Menus.css'

const fetchMenus = () => APIs.getRestaurantMenus()
const fetchGroups = () => APIs.getRestaurantModifierGroups()

interface Form {
  /** null = platillo nuevo */
  dish: Dish | null
  name: string
  price: string
  categoryId: number | null
  kindId: number | null
  description: string
  prepMinutes: string
  batchSize: string
  allergens: string
  tags: string
  placements: Record<number, number | null> // menuId → categoryId (null = sin categoría); ausente = no está en el menú
  groupIds: number[]
}

/** Platillos de la carta: artículos del catálogo con descripción, alérgenos, menús y modificadores. */
const Platillos: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.menus-platillos.view')
  const canManage = can('restaurants.manage') || can('restaurants.create')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [search, setSearch] = useState('')
  const [menuFilter, setMenuFilter] = useState(0)
  const fetchDishes = useCallback(() => APIs.getRestaurantDishes({ search: search || undefined, menuId: menuFilter || undefined }), [search, menuFilter])
  const dishes = useMenuData<Dish[]>(fetchDishes, canView, [])
  const menus = useMenuData<Menu[]>(fetchMenus, canView, [])
  const groups = useMenuData<ModifierGroup[]>(fetchGroups, canView, [])
  const [form, setForm] = useState<Form | null>(null)
  const [saving, setSaving] = useState(false)
  const [timeOpen, setTimeOpen] = useState(false)
  const busy = dishes.busy || saving

  const blank = (): Form => ({ dish: null, name: '', price: '', categoryId: null, kindId: null, description: '', prepMinutes: '', batchSize: '', allergens: '', tags: '', placements: {}, groupIds: [] })

  const open = (dish: Dish) =>
    setForm({
      dish,
      name: dish.name,
      price: dish.price != null ? String(dish.price) : '',
      categoryId: dish.categoryId,
      kindId: dish.kindId,
      description: dish.description ?? '',
      prepMinutes: dish.prepMinutes != null ? String(dish.prepMinutes) : '',
      batchSize: dish.batchSize != null ? String(dish.batchSize) : '',
      allergens: dish.allergens.join(', '),
      tags: dish.tags.join(', '),
      placements: Object.fromEntries(dish.menus.map((m) => [m.menuId, m.categoryId])),
      groupIds: dish.modifierGroupIds,
    })

  const save = async () => {
    if (!form) return
    setSaving(true)
    try {
      const body = {
        name: form.name,
        price: Number(form.price),
        categoryId: form.categoryId,
        kindId: form.kindId,
        description: form.description,
        prepMinutes: form.prepMinutes.trim() ? Number(form.prepMinutes) : null,
        batchSize: form.prepMinutes.trim() && form.batchSize.trim() ? Number(form.batchSize) : null,
        allergens: splitList(form.allergens),
        tags: splitList(form.tags),
      }
      let id = form.dish?.id
      if (id) await APIs.updateRestaurantDish(id, body)
      else {
        const res: any = await APIs.createRestaurantDish(body)
        id = res?.data?.id
      }
      if (id) {
        await APIs.setRestaurantDishMenus(id, Object.entries(form.placements).map(([menuId, categoryId]) => ({ menuId: Number(menuId), categoryId })))
        await APIs.setRestaurantDishModifierGroups(id, form.groupIds)
      }
      showToast({ type: 'success', title: form.dish ? 'Platillo guardado' : 'Platillo creado' })
      setForm(null)
      await dishes.load()
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo guardar', text: errorText(e, 'Intenta de nuevo.') })
    } finally {
      setSaving(false)
    }
  }

  const priceOk = form ? form.price.trim() !== '' && Number(form.price) >= 0 && Number.isFinite(Number(form.price)) : false

  return (
    <RestaurantPage
      title='Platillos'
      subtitle='Lo que vendes en el restaurante. Captura el nombre y el precio (antes de IVA); el POS lo cobra directamente.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={dishes.loading && !dishes.data.length}
      error={dishes.error}
      onRetry={dishes.load}
      toolbar={
        <>
          <label className='pos-field'>
            Buscar
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Nombre del platillo' />
          </label>
          <label className='pos-field'>
            Menú
            <select value={menuFilter} onChange={(e) => setMenuFilter(Number(e.target.value))}>
              <option value={0}>Todos</option>
              {menus.data.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          {canManage ? (
            <button type='button' className='btn__general-purple' onClick={() => setForm(blank())} disabled={busy}>
              <span className='material-symbols-rounded'>add</span> Nuevo platillo
            </button>
          ) : null}
        </>
      }
    >
      {!dishes.data.length ? (
        <p className='restaurant-empty'>{search || menuFilter ? 'Ningún platillo coincide con el filtro.' : 'Todavía no hay platillos. Crea el primero, por ejemplo "Tacos al pastor".'}</p>
      ) : (
        <div className='menus-list'>
          {dishes.data.map((d) => (
            <div key={d.id} className={`menus-dish ${d.active ? '' : 'is-off'}`}>
              {d.image ? <img className='menus-dish__img' src={d.image} alt='' loading='lazy' /> : (
                <span className='menus-dish__img' aria-hidden><span className='material-symbols-rounded'>restaurant</span></span>
              )}
              <div className='menus-row__main'>
                <strong>
                  {d.name}
                  {!d.active ? <span className='restaurant-badge is-gray'>Fuera de carta</span> : null}
                </strong>
                <small>
                  {d.effectiveKind ? `${d.effectiveKind} · ` : ''}{d.category ? `${d.category} · ` : ''}
                  {d.prepMinutes ? `${prepSummary(d.prepMinutes, d.batchSize)} · ` : ''}
                  {d.menus.length ? d.menus.map((m) => (m.category ? `${m.menu} › ${m.category}` : m.menu)).join(' · ') : 'Sin menú'}
                </small>
                {d.allergens.length || d.tags.length ? (
                  <div className='menus-row__tags'>
                    {d.tags.map((t) => <span key={`t${t}`} className='restaurant-badge' style={{ marginLeft: 0 }}>{t}</span>)}
                    {d.allergens.map((a) => <span key={`a${a}`} className='restaurant-badge is-blue' style={{ marginLeft: 0 }}>{a}</span>)}
                  </div>
                ) : null}
              </div>
              <span className='menus-row__num'>{money(d.price ?? 0)}</span>
              {canManage ? (
                <div className='menus-row__actions'>
                  <button type='button' className='menus-icon' title='Editar' aria-label={`Editar ${d.name}`} onClick={() => open(d)}>
                    <span className='material-symbols-rounded'>edit</span>
                  </button>
                  <button
                    type='button'
                    className='menus-icon'
                    title={d.active ? 'Sacar de la carta' : 'Volver a la carta'}
                    aria-label={d.active ? `Sacar ${d.name} de la carta` : `Volver ${d.name} a la carta`}
                    disabled={busy}
                    onClick={() => dishes.run(() => APIs.updateRestaurantDish(d.id, { active: !d.active }), d.active ? 'Fuera de carta' : 'De vuelta en la carta')}
                  >
                    <span className='material-symbols-rounded'>{d.active ? 'visibility_off' : 'visibility'}</span>
                  </button>
                  <button
                    type='button'
                    className='menus-icon is-danger'
                    title='Quitar platillo'
                    aria-label={`Quitar ${d.name}`}
                    disabled={busy}
                    onClick={() => window.confirm(`¿Quitar "${d.name}" de los platillos? El artículo sigue en el catálogo.`) && dishes.run(() => APIs.deleteRestaurantDish(d.id), 'Platillo quitado')}
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
          title={form.dish ? form.dish.name : 'Nuevo platillo'}
          wide
          onClose={() => !timeOpen && setForm(null)}
          actions={
            <>
              <button type='button' className='btn__general-gray' onClick={() => setForm(null)}>Cancelar</button>
              <button type='button' className='btn__general-purple' onClick={save} disabled={busy || !form.name.trim() || !priceOk}>{form.dish ? 'Guardar' : 'Crear platillo'}</button>
            </>
          }
        >
          <div className='pos-row'>
            <label className='pos-field' style={{ gridColumn: 'span 2' }}>
              Nombre del platillo
              <input value={form.name} maxLength={255} autoFocus={!form.dish} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder='Tacos al pastor' />
            </label>
            <label className='pos-field'>
              Precio (antes de IVA)
              <input inputMode='decimal' value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder='0.00' />
            </label>
          </div>
          <div className='pos-field'>
            Clasificación en el catálogo
            <CategoryCascade value={form.categoryId} onChange={(categoryId) => setForm({ ...form, categoryId })} />
          </div>
          <div className='pos-field'>
            Tipo de consumo
            <KindSelect value={form.kindId} onChange={(kindId) => setForm({ ...form, kindId })} emptyLabel={form.dish?.effectiveKind && !form.dish.kindId ? `Igual que su familia: ${form.dish.effectiveKind}` : 'Igual que su familia'} />
          </div>
          <label className='pos-field'>
            Descripción para la carta
            <textarea value={form.description} maxLength={500} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder='Corte de res a la parrilla con puré de papa' />
          </label>
          <div className='pos-field'>
            Tiempo de preparación
            <button type='button' className='menus-timebtn' onClick={() => setTimeOpen(true)}>
              <span className='material-symbols-rounded' aria-hidden>timer</span>
              <span>{form.prepMinutes.trim() ? prepSummary(Number(form.prepMinutes), form.batchSize.trim() ? Number(form.batchSize) : null) : 'Sin configurar'}</span>
              <span className='material-symbols-rounded' aria-hidden>chevron_right</span>
            </button>
          </div>
          <label className='pos-field'>
            Etiquetas (separadas por coma)
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder='Vegano, Picante' />
          </label>
          <label className='pos-field'>
            Alérgenos (separados por coma)
            <input value={form.allergens} onChange={(e) => setForm({ ...form, allergens: e.target.value })} placeholder='Gluten, Lácteos, Nueces' />
          </label>

          <div className='pos-field'>
            En qué menús está
            {!menus.data.length ? <span className='pos-note'>Aún no hay menús. Créalos en "Menús".</span> : null}
            {menus.data.map((m) => {
              const on = m.id in form.placements
              return (
                <div key={m.id} className='menus-placement'>
                  <button
                    type='button'
                    className={`pos-chip ${on ? 'is-active' : ''}`}
                    aria-pressed={on}
                    onClick={() => {
                      const next = { ...form.placements }
                      if (on) delete next[m.id]
                      else next[m.id] = null
                      setForm({ ...form, placements: next })
                    }}
                  >
                    {m.name}
                  </button>
                  {on ? (
                    <select
                      aria-label={`Categoría en ${m.name}`}
                      value={form.placements[m.id] ?? ''}
                      onChange={(e) => setForm({ ...form, placements: { ...form.placements, [m.id]: e.target.value ? Number(e.target.value) : null } })}
                    >
                      <option value=''>Sin categoría</option>
                      {m.categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : <span />}
                </div>
              )
            })}
          </div>

          <div className='pos-field'>
            Modificadores
            {!groups.data.length ? <span className='pos-note'>Aún no hay grupos. Créalos en "Modificadores".</span> : null}
            <div className='pos-chips'>
              {groups.data.map((g) => {
                const on = form.groupIds.includes(g.id)
                return (
                  <button
                    key={g.id}
                    type='button'
                    className={`pos-chip ${on ? 'is-active' : ''}`}
                    aria-pressed={on}
                    onClick={() => setForm({ ...form, groupIds: on ? form.groupIds.filter((x) => x !== g.id) : [...form.groupIds, g.id] })}
                  >
                    {g.name}
                  </button>
                )
              })}
            </div>
          </div>
        </PosModal>
      ) : null}

      {form && timeOpen ? (
        <PosModal
          title='Tiempo de preparación'
          onClose={() => setTimeOpen(false)}
          actions={
            <>
              <button type='button' className='btn__general-gray' onClick={() => setForm({ ...form, prepMinutes: '', batchSize: '' })}>Quitar tiempo</button>
              <button type='button' className='btn__general-purple' onClick={() => setTimeOpen(false)}>Listo</button>
            </>
          }
        >
          <p className='pos-note'>Si tu cocina prepara por tandas (el sartén, la freidora), indica cuántas piezas caben y cuánto tarda cada tanda.</p>
          <div className='pos-row'>
            <label className='pos-field'>
              Minutos por tanda
              <input type='number' min={0} autoFocus value={form.prepMinutes} onChange={(e) => setForm({ ...form, prepMinutes: e.target.value })} placeholder='5' />
            </label>
            <label className='pos-field'>
              Piezas por tanda (opcional)
              <input type='number' min={1} value={form.batchSize} onChange={(e) => setForm({ ...form, batchSize: e.target.value })} placeholder='5' />
            </label>
          </div>
          {form.prepMinutes.trim() ? (
            <div className='menus-timetable' aria-label='Tiempo según la cantidad'>
              {(form.batchSize.trim()
                ? [1, Number(form.batchSize), Number(form.batchSize) + 1, Number(form.batchSize) * 2, Number(form.batchSize) * 3]
                : [1, 5, 10]
              )
                .filter((q, i, arr) => q > 0 && arr.indexOf(q) === i)
                .map((q) => (
                  <div key={q}>
                    <span>{q} {q === 1 ? 'pieza' : 'piezas'}</span>
                    <strong>{prepTime(Number(form.prepMinutes), form.batchSize.trim() ? Number(form.batchSize) : null, q)} min</strong>
                  </div>
                ))}
            </div>
          ) : (
            <p className='pos-note'>Ejemplo: empanadas, 5 min por tanda de 5 piezas. Una o cinco tardan 5 min; diez tardan 10 min.</p>
          )}
          {!form.batchSize.trim() && form.prepMinutes.trim() ? <p className='pos-note'>Sin piezas por tanda, el tiempo es el mismo sin importar la cantidad.</p> : null}
        </PosModal>
      ) : null}
    </RestaurantPage>
  )
}

export default Platillos
