import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import APIs from '../../../../../services/APIs'
import './BranchAvailabilityPicker.css'

type Props = {
  companyId: number | null
  /** IDs de sucursales habilitadas. null = todas (valor por omisión). */
  value: number[] | null
  onChange: (ids: number[] | null) => void
  title?: string
  hint?: string
  /** Avisa con los ids de todas las sucursales de la empresa cuando terminan de cargar */
  onBranchesLoaded?: (ids: number[], branches: { id: number; name: string }[]) => void
}

/**
 * "Disponible en" — el artículo/categoría se registra UNA vez en la empresa y aquí se elige en qué
 * sucursales se ofrece. Si la empresa solo tiene una sucursal no hay nada que elegir y no se muestra.
 */
const BranchAvailabilityPicker: React.FC<Props> = ({ companyId, value, onChange, title = 'Disponible en sucursales', hint, onBranchesLoaded }) => {
  const userState = useSelector((s: any) => s.user)
  const userId = Number(userState?.id ?? userState?._id)
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!userId || !companyId) {
      setBranches([])
      setLoaded(true)
      return
    }
    let cancelled = false
    setLoaded(false)
    ;(async () => {
      try {
        const res: any = await APIs.getBranch({ userId, companyId }, undefined, localStorage.getItem('token-fixora') || undefined)
        const list = (Array.isArray(res?.data) ? res.data : []).map((b: any) => ({ id: b.id, name: b.name }))
        if (!cancelled) {
          setBranches(list)
          onBranchesLoaded?.(list.map((b: any) => b.id), list)
        }
      } catch {
        if (!cancelled) setBranches([])
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, companyId])

  if (!loaded || !companyId) return null

  if (branches.length === 0) {
    return (
      <div className='branch-availability'>
        <span className='branch-availability__title'>{title}</span>
        <small className='branch-availability__hint'>Esta empresa aún no tiene sucursales registradas.</small>
      </div>
    )
  }

  // Con una sola sucursal no hay nada que elegir: se muestra marcada y bloqueada
  if (branches.length === 1) {
    return (
      <div className='branch-availability'>
        <div className='branch-availability__head'>
          <div className='branch-availability__heading'>
            <span className='branch-availability__title'>{title}</span>
          </div>
        </div>
        <div className='branch-availability__grid'>
          <div className='branch-availability__card branch-availability__card--on branch-availability__card--locked' aria-checked='true' role='checkbox'>
            <span className='branch-availability__icon material-symbols-rounded'>storefront</span>
            <span className='branch-availability__name'>{branches[0].name}</span>
            <span className='branch-availability__check material-symbols-rounded'>check_circle</span>
          </div>
        </div>
        <small className='branch-availability__hint'>Tu empresa tiene una sola sucursal. Cuando agregues más podrás elegir en cuáles.</small>
      </div>
    )
  }

  const selected = value ?? branches.map((b) => b.id)
  const allSelected = selected.length === branches.length

  const toggle = (id: number) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
    if (next.length === 0) return // al menos una sucursal
    onChange(next.length === branches.length ? null : next)
  }

  return (
    <div className='branch-availability'>
      <div className='branch-availability__head'>
        <div className='branch-availability__heading'>
          <span className='branch-availability__title'>{title}</span>
          <span className='branch-availability__count'>
            {allSelected ? 'Todas las sucursales' : `${selected.length} de ${branches.length} sucursales`}
          </span>
        </div>
        {!allSelected && (
          <button type='button' className='branch-availability__all' onClick={() => onChange(null)}>
            Seleccionar todas
          </button>
        )}
      </div>

      <div className='branch-availability__grid'>
        {branches.map((b) => {
          const on = selected.includes(b.id)
          return (
            <button
              key={b.id}
              type='button'
              role='checkbox'
              aria-checked={on}
              className={`branch-availability__card ${on ? 'branch-availability__card--on' : ''}`}
              onClick={() => toggle(b.id)}
            >
              <span className='branch-availability__icon material-symbols-rounded'>storefront</span>
              <span className='branch-availability__name'>{b.name}</span>
              <span className='branch-availability__check material-symbols-rounded'>{on ? 'check_circle' : 'circle'}</span>
            </button>
          )
        })}
      </div>

      {hint && <small className='branch-availability__hint'>{hint}</small>}
    </div>
  )
}

export default BranchAvailabilityPicker
