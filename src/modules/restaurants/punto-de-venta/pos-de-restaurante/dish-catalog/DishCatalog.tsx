import React, { useCallback, useEffect, useMemo, useState } from 'react'
import APIs from '../../../../../services/APIs'
import { errorText, money } from '../../../shared/restaurantTypes'
import type { Dish } from '../../../menus/shared/menuTypes'
import './DishCatalog.css'

interface Category {
  id: number
  title: string
  parentId: number | null
}

interface Props {
  branchId: number
  /** Agrega el platillo (su artículo) a la cuenta abierta */
  onAdd: (dish: { id: number; name: string }) => void
}

const OTHER = -1

/**
 * Catálogo del POS de restaurante: solo platillos (Menús › Platillos), por familia y subcategoría, con su
 * disponibilidad en la sucursal. Los artículos y servicios de Ventas no aparecen aquí.
 */
const DishCatalog: React.FC<Props> = ({ branchId, onAdd }) => {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [family, setFamily] = useState<number | null>(null)
  const [sub, setSub] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const [d, c]: any[] = await Promise.all([APIs.getRestaurantDishes({ branchId }), APIs.getRestaurantCatalogCategories()])
      setDishes((d?.data ?? []).filter((x: Dish) => x.active))
      setCategories(c?.data ?? [])
      setError('')
    } catch (e) {
      setError(errorText(e, 'No se pudieron cargar los platillos.'))
    } finally {
      setLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    setLoading(true)
    load()
    // La disponibilidad (agotados) cambia durante el servicio
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [load])

  // Familia (raíz) y subcategoría (segundo nivel) de cada platillo
  const lineage = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]))
    return (categoryId: number | null) => {
      const path: Category[] = []
      let cur = categoryId ? byId.get(categoryId) : undefined
      for (let i = 0; cur && i < 10; i++) {
        path.unshift(cur)
        cur = cur.parentId ? byId.get(cur.parentId) : undefined
      }
      return { family: path[0]?.id ?? OTHER, sub: path[1]?.id ?? null }
    }
  }, [categories])

  const families = useMemo(() => {
    const ids = [...new Set(dishes.map((d) => lineage(d.categoryId).family))]
    return ids
      .map((id) => ({ id, title: id === OTHER ? 'Otros' : categories.find((c) => c.id === id)?.title ?? 'Otros' }))
      .sort((a, b) => (a.id === OTHER ? 1 : b.id === OTHER ? -1 : a.title.localeCompare(b.title)))
  }, [dishes, categories, lineage])

  const subs = useMemo(() => {
    if (family == null) return []
    const ids = [...new Set(dishes.map((d) => lineage(d.categoryId)).filter((l) => l.family === family && l.sub != null).map((l) => l.sub as number))]
    return ids.map((id) => ({ id, title: categories.find((c) => c.id === id)?.title ?? '' })).sort((a, b) => a.title.localeCompare(b.title))
  }, [family, dishes, categories, lineage])

  const q = search.trim().toLowerCase()
  const shown = dishes.filter((d) => {
    if (q) return d.name.toLowerCase().includes(q)
    const l = lineage(d.categoryId)
    return (family == null || l.family === family) && (sub == null || l.sub === sub)
  })

  return (
    <div className='dish-cat'>
      <div className='dish-cat__bar'>
        <label className='dish-cat__search'>
          <span className='material-symbols-rounded' aria-hidden>search</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Buscar platillo' aria-label='Buscar platillo' />
        </label>
      </div>

      {!q && families.length > 1 ? (
        <div className='dish-cat__chips' role='group' aria-label='Familia'>
          <button type='button' className={`pos-chip ${family == null ? 'is-active' : ''}`} aria-pressed={family == null} onClick={() => { setFamily(null); setSub(null) }}>
            Todo
          </button>
          {families.map((f) => (
            <button key={f.id} type='button' className={`pos-chip ${family === f.id ? 'is-active' : ''}`} aria-pressed={family === f.id} onClick={() => { setFamily(f.id); setSub(null) }}>
              {f.title}
            </button>
          ))}
        </div>
      ) : null}
      {!q && subs.length ? (
        <div className='dish-cat__chips is-sub' role='group' aria-label='Subcategoría'>
          <button type='button' className={`pos-chip ${sub == null ? 'is-active' : ''}`} aria-pressed={sub == null} onClick={() => setSub(null)}>
            Todas
          </button>
          {subs.map((s) => (
            <button key={s.id} type='button' className={`pos-chip ${sub === s.id ? 'is-active' : ''}`} aria-pressed={sub === s.id} onClick={() => setSub(s.id)}>
              {s.title}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <p className='pos-error'>{error}</p> : null}

      {loading && !dishes.length ? (
        <p className='pos-note'>Cargando platillos…</p>
      ) : !dishes.length ? (
        <p className='restaurant-empty'>Todavía no hay platillos. Créalos en Menús › Platillos y aparecerán aquí.</p>
      ) : !shown.length ? (
        <p className='restaurant-empty'>Ningún platillo coincide.</p>
      ) : (
        <div className='dish-cat__grid'>
          {shown.map((d) => {
            const off = d.availability ? !d.availability.available : false
            return (
              <button
                key={d.id}
                type='button'
                className={`dish-tile ${off ? 'is-off' : ''}`}
                disabled={off}
                onClick={() => onAdd({ id: d.itemId, name: d.name })}
                aria-label={`${d.name}, ${money(d.price ?? 0)}${off ? ', no disponible' : ''}`}
              >
                {d.image ? <img className='dish-tile__img' src={d.image} alt='' loading='lazy' /> : null}
                <span className='dish-tile__name'>{d.name}</span>
                <span className='dish-tile__foot'>
                  <span className='dish-tile__price'>{money(d.price ?? 0)}</span>
                  {off ? <span className='dish-tile__off'>{d.availability?.reason || 'Agotado'}</span> : <span className='material-symbols-rounded dish-tile__add' aria-hidden>add</span>}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DishCatalog
