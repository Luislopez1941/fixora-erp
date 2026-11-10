import React, { useCallback, useState } from 'react'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import PosModal from '../../shared/pos-modal/PosModal'
import { money } from '../../shared/restaurantTypes'
import { useMenuData } from '../shared/useMenuData'
import { Dish } from '../shared/menuTypes'
import '../shared/Menus.css'

interface Draft {
  itemId: number
  name: string
  basePrice: number | null
  price: string
}

/** Complementos que se sugieren con un platillo (guarnición, bebida, postre), con precio especial opcional. */
const Complementos: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.menus-complementos.view')
  const canManage = can('restaurants.manage') || can('restaurants.create')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [search, setSearch] = useState('')
  const fetchDishes = useCallback(() => APIs.getRestaurantDishes({ search: search || undefined }), [search])
  const { data: dishes, loading, error, busy, load, run } = useMenuData<Dish[]>(fetchDishes, canView, [])
  const [edit, setEdit] = useState<{ dish: Dish; addons: Draft[]; picking: boolean } | null>(null)

  const open = (dish: Dish) =>
    setEdit({ dish, picking: false, addons: dish.addons.map((a) => ({ itemId: a.itemId, name: a.name, basePrice: a.basePrice, price: a.price != null ? String(a.price) : '' })) })

  const save = () => {
    if (!edit) return
    run(
      () => APIs.setRestaurantDishAddons(edit.dish.id, edit.addons.map((a) => ({ itemId: a.itemId, price: a.price.trim() ? Number(a.price) : null }))),
      'Complementos guardados',
      () => setEdit(null),
    )
  }

  return (
    <RestaurantPage
      title='Complementos'
      subtitle='Lo que el mesero ofrece junto con cada platillo: una bebida, una guarnición, un postre. Se eligen de tus propios platillos.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading && !dishes.length}
      error={error}
      onRetry={load}
      toolbar={
        <label className='pos-field'>
          Buscar platillo
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Nombre del platillo' />
        </label>
      }
    >
      {!dishes.length ? (
        <p className='restaurant-empty'>{search ? 'Ningún platillo coincide.' : 'Primero agrega platillos en "Platillos"; después les asignas complementos aquí.'}</p>
      ) : (
        <div className='menus-list'>
          {dishes.map((d) => (
            <div key={d.id} className='menus-row'>
              <div className='menus-row__main'>
                <strong>{d.name}</strong>
                {d.addons.length ? (
                  <div className='menus-row__tags'>
                    {d.addons.map((a) => (
                      <span key={a.itemId} className='restaurant-badge' style={{ marginLeft: 0 }}>
                        {a.name}{a.price != null ? ` · ${money(a.price)}` : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <small>Sin complementos</small>
                )}
              </div>
              <span className='menus-row__num'>{d.addons.length} complemento(s)</span>
              {canManage ? (
                <div className='menus-row__actions'>
                  <button type='button' className='menus-icon' title='Editar complementos' aria-label={`Editar complementos de ${d.name}`} onClick={() => open(d)}>
                    <span className='material-symbols-rounded'>edit</span>
                  </button>
                </div>
              ) : <span />}
            </div>
          ))}
        </div>
      )}

      {edit ? (
        <PosModal
          title={`Complementos de ${edit.dish.name}`}
          onClose={() => setEdit(null)}
          actions={
            <>
              <button type='button' className='btn__general-gray' onClick={() => setEdit(null)}>Cancelar</button>
              <button type='button' className='btn__general-purple' onClick={save} disabled={busy}>Guardar</button>
            </>
          }
        >
          {edit.addons.map((a, i) => (
            <div key={a.itemId} className='menus-option'>
              <span>
                {a.name}
                <small> · normal {money(a.basePrice ?? 0)}</small>
              </span>
              <input
                className='menus-addopt-input'
                style={{ width: 96, height: 40, padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--panel-border)', background: 'var(--input-color)', color: 'var(--text-color)' }}
                inputMode='decimal'
                placeholder='Precio'
                aria-label={`Precio especial de ${a.name}`}
                value={a.price}
                onChange={(e) => setEdit({ ...edit, addons: edit.addons.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)) })}
              />
              <button type='button' className='menus-icon is-danger' aria-label={`Quitar ${a.name}`} onClick={() => setEdit({ ...edit, addons: edit.addons.filter((_, j) => j !== i) })}>
                <span className='material-symbols-rounded'>close</span>
              </button>
            </div>
          ))}
          {!edit.addons.length ? <p className='pos-note'>Sin complementos todavía.</p> : null}
          <p className='pos-note'>Deja el precio vacío para cobrar el precio normal del artículo.</p>
          {edit.picking ? (
            <div className='menus-search__results'>
              {dishes
                .filter((x) => x.id !== edit.dish.id && !edit.addons.some((a) => a.itemId === x.itemId))
                .map((x) => (
                  <button key={x.id} type='button' onClick={() => setEdit({ ...edit, picking: false, addons: [...edit.addons, { itemId: x.itemId, name: x.name, basePrice: x.price, price: '' }] })}>
                    <span>{x.name}</span>
                    <small>{money(x.price ?? 0)}</small>
                  </button>
                ))}
              {dishes.length < 2 ? <p className='pos-note'>Crea más platillos (bebidas, guarniciones, postres) para ofrecerlos como complemento.</p> : null}
            </div>
          ) : (
            <button type='button' className='btn__general-gray' onClick={() => setEdit({ ...edit, picking: true })}>
              <span className='material-symbols-rounded'>add</span> Agregar complemento
            </button>
          )}
        </PosModal>
      ) : null}
    </RestaurantPage>
  )
}

export default Complementos
