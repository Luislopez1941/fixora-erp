import React, { useCallback, useEffect, useState } from 'react'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import PosModal from '../../shared/pos-modal/PosModal'
import { useMenuData } from '../shared/useMenuData'
import { Menu, MenuCategory } from '../shared/menuTypes'
import '../shared/Menus.css'

const fetchMenus = () => APIs.getRestaurantMenus()

/** Secciones de cada menú (Entradas, Platos fuertes, Bebidas…). */
const Categorias: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.menus-categorias.view')
  const canManage = can('restaurants.manage') || can('restaurants.create')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [menuId, setMenuId] = useState(0)
  const menusData = useMenuData<Menu[]>(fetchMenus, canView, [])
  const menus = menusData.data

  useEffect(() => {
    if (!menuId && menus.length) setMenuId(menus[0].id)
  }, [menus, menuId])

  const fetchCategories = useCallback(() => APIs.getRestaurantMenuCategories(menuId || undefined), [menuId])
  const cats = useMenuData<MenuCategory[]>(fetchCategories, canView && menuId > 0, [])
  const [modal, setModal] = useState<{ id?: number; name: string } | null>(null)
  const busy = cats.busy

  const save = () => {
    if (!modal) return
    cats.run(
      () => (modal.id ? APIs.updateRestaurantMenuCategory(modal.id, { name: modal.name }) : APIs.createRestaurantMenuCategory({ menuId, name: modal.name })),
      modal.id ? 'Categoría actualizada' : 'Categoría creada',
      () => setModal(null),
    )
  }

  const move = (c: MenuCategory, dir: -1 | 1) => {
    const list = cats.data
    const i = list.findIndex((x) => x.id === c.id)
    const other = list[i + dir]
    if (!other) return
    cats.run(async () => {
      await APIs.updateRestaurantMenuCategory(c.id, { position: other.position })
      await APIs.updateRestaurantMenuCategory(other.id, { position: c.position })
    }, 'Orden actualizado')
  }

  return (
    <RestaurantPage
      title='Categorías del menú'
      subtitle='Cómo se agrupan los platillos dentro de cada menú. El orden de esta lista es el orden en la carta.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={menusData.loading || (menuId > 0 && cats.loading)}
      error={menusData.error || cats.error}
      onRetry={() => {
        menusData.load()
        cats.load()
      }}
      toolbar={
        menus.length ? (
          <>
            <label className='pos-field'>
              Menú
              <select value={menuId} onChange={(e) => setMenuId(Number(e.target.value))}>
                {menus.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
            {canManage ? (
              <button type='button' className='btn__general-purple' onClick={() => setModal({ name: '' })} disabled={busy}>
                <span className='material-symbols-rounded'>add</span> Nueva categoría
              </button>
            ) : null}
          </>
        ) : null
      }
    >
      {!menus.length ? (
        <p className='restaurant-empty'>Primero crea un menú en "Menús"; después le agregas sus categorías aquí.</p>
      ) : !cats.data.length ? (
        <p className='restaurant-empty'>Este menú aún no tiene categorías. Agrega la primera, por ejemplo "Entradas".</p>
      ) : (
        <div className='menus-list'>
          {cats.data.map((c, i) => (
            <div key={c.id} className={`menus-row ${c.active ? '' : 'is-off'}`}>
              <div className='menus-row__main'>
                <strong>
                  {c.name}
                  {!c.active ? <span className='restaurant-badge is-gray'>Oculta</span> : null}
                </strong>
              </div>
              <span className='menus-row__num'>{c._count?.entries ?? 0} platillo(s)</span>
              {canManage ? (
                <div className='menus-row__actions'>
                  <button type='button' className='menus-icon' title='Subir' aria-label={`Subir ${c.name}`} disabled={busy || i === 0} onClick={() => move(c, -1)}>
                    <span className='material-symbols-rounded'>arrow_upward</span>
                  </button>
                  <button type='button' className='menus-icon' title='Bajar' aria-label={`Bajar ${c.name}`} disabled={busy || i === cats.data.length - 1} onClick={() => move(c, 1)}>
                    <span className='material-symbols-rounded'>arrow_downward</span>
                  </button>
                  <button type='button' className='menus-icon' title='Cambiar nombre' aria-label={`Cambiar nombre de ${c.name}`} onClick={() => setModal({ id: c.id, name: c.name })}>
                    <span className='material-symbols-rounded'>edit</span>
                  </button>
                  <button
                    type='button'
                    className='menus-icon'
                    title={c.active ? 'Ocultar' : 'Mostrar'}
                    aria-label={c.active ? `Ocultar ${c.name}` : `Mostrar ${c.name}`}
                    disabled={busy}
                    onClick={() => cats.run(() => APIs.updateRestaurantMenuCategory(c.id, { active: !c.active }), c.active ? 'Categoría oculta' : 'Categoría visible')}
                  >
                    <span className='material-symbols-rounded'>{c.active ? 'visibility_off' : 'visibility'}</span>
                  </button>
                  <button
                    type='button'
                    className='menus-icon is-danger'
                    title='Eliminar'
                    aria-label={`Eliminar ${c.name}`}
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(`¿Eliminar la categoría "${c.name}"? Sus platillos quedan en el menú, sin categoría.`)) {
                        cats.run(() => APIs.deleteRestaurantMenuCategory(c.id), 'Categoría eliminada')
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

      {modal ? (
        <PosModal
          title={modal.id ? 'Cambiar nombre' : 'Nueva categoría'}
          onClose={() => setModal(null)}
          actions={
            <>
              <button type='button' className='btn__general-gray' onClick={() => setModal(null)}>Cancelar</button>
              <button type='button' className='btn__general-purple' onClick={save} disabled={busy || !modal.name.trim()}>Guardar</button>
            </>
          }
        >
          <label className='pos-field'>
            Nombre
            <input value={modal.name} maxLength={80} autoFocus onChange={(e) => setModal({ ...modal, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && modal.name.trim() && save()} />
          </label>
        </PosModal>
      ) : null}
    </RestaurantPage>
  )
}

export default Categorias
