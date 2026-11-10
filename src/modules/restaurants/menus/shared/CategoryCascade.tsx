import React, { useEffect, useMemo, useState } from 'react'
import APIs from '../../../../services/APIs'
import { errorText } from '../../shared/restaurantTypes'

interface Option {
  id: number
  title: string
  parentId: number | null
}

interface Props {
  /** Familia, categoría o subcategoría elegida (la más específica) */
  value: number | null
  onChange: (id: number | null) => void
}

const LEVEL_LABEL = ['Familia', 'Categoría', 'Subcategoría', 'Subcategoría 2', 'Subcategoría 3']

/** Elige familia → categoría → subcategoría del catálogo; cada nivel aparece al elegir el anterior. */
const CategoryCascade: React.FC<Props> = ({ value, onChange }) => {
  const [options, setOptions] = useState<Option[]>([])
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    setState('loading')
    APIs.getRestaurantCatalogCategories()
      .then((res: any) => {
        const rows = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
        if (!alive) return
        setOptions(rows)
        setState('ok')
      })
      .catch((e: unknown) => {
        if (!alive) return
        setError(errorText(e, 'No se pudieron cargar las familias.'))
        setState('error')
      })
    return () => {
      alive = false
    }
  }, [attempt])

  // Cadena de la raíz a la categoría elegida
  const chain = useMemo(() => {
    const byId = new Map(options.map((o) => [o.id, o]))
    const path: number[] = []
    let cur = value ? byId.get(value) : undefined
    while (cur) {
      path.unshift(cur.id)
      cur = cur.parentId ? byId.get(cur.parentId) : undefined
    }
    return path
  }, [options, value])

  const childrenOf = (parentId: number | null) => options.filter((o) => (o.parentId ?? null) === parentId)

  const levels: { parentId: number | null; selected: number | undefined }[] = [{ parentId: null, selected: chain[0] }]
  chain.forEach((id, i) => {
    if (childrenOf(id).length) levels.push({ parentId: id, selected: chain[i + 1] })
  })

  if (state === 'loading') return <span className='pos-note'>Cargando familias…</span>
  if (state === 'error') {
    return (
      <div className='pos-error' role='alert'>
        {error}{' '}
        <button type='button' className='btn__general-gray' onClick={() => setAttempt((n) => n + 1)}>Reintentar</button>
      </div>
    )
  }
  if (!options.length) {
    return (
      <span className='pos-note'>
        Todavía no hay familias. Se crean en Catálogos › Familias (por ejemplo "Comida" o "Bebidas") y aquí aparecerán con sus categorías.
      </span>
    )
  }

  return (
    <div className='menus-cascade'>
      {levels.map((lvl, i) => (
        <label key={`${lvl.parentId ?? 'root'}`} className='menus-cascade__level'>
          <span>{LEVEL_LABEL[i] ?? 'Subcategoría'}</span>
          <select value={lvl.selected ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : lvl.parentId)}>
            <option value=''>{i === 0 ? 'Sin familia' : 'Sin elegir'}</option>
            {childrenOf(lvl.parentId).map((o) => (
              <option key={o.id} value={o.id}>{o.title}</option>
            ))}
          </select>
        </label>
      ))}
    </div>
  )
}

export default CategoryCascade
