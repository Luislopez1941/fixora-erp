import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { displayValue, sameValue } from '../../../../../../../modules/catalogos/productos-y-servicios/variantes/variantTypes'
import './VariantPicker.css'

interface Props {
  /** Artículo como lo devuelve el detalle para venta: variantTemplate.axes y variations con option1..3, label, price, stock */
  product: any
  /** Variante que ya tiene la línea (al cambiarla) */
  currentId?: number | null
  onPick: (variation: any) => void
  onClose: () => void
}

const money = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n)
const optionOf = (v: any, position: number) => v?.[`option${position}`] as string | null | undefined

/**
 * Elegir la variante al vender: una fila de fichas por característica (primero talla, luego color…, en el orden de la
 * plantilla), con precio y existencia de la que queda elegida. Con pocas variantes también se ven todas para un toque.
 */
const VariantPicker: React.FC<Props> = ({ product, currentId, onPick, onClose }) => {
  const variations: any[] = product?.variations ?? []
  // Características: las de la plantilla; si no viene, las posiciones que usan las variantes
  const axes = useMemo(() => {
    const tplAxes: any[] = product?.variantTemplate?.axes ?? []
    if (tplAxes.length) return tplAxes
    return [1, 2, 3].filter((p) => variations.some((v) => optionOf(v, p))).map((p) => ({ position: p, name: `Opción ${p}`, type: 'LIST', options: [] }))
  }, [product, variations])

  const current = variations.find((v) => v.id === currentId)
  const [picked, setPicked] = useState<Record<number, string>>(() =>
    current ? Object.fromEntries(axes.map((a: any) => [a.position, optionOf(current, a.position) ?? ''])) : {},
  )

  // Valores de cada característica en el orden de la plantilla (y los propios del artículo al final)
  const valuesOf = (a: any) => {
    const used = Array.from(new Set(variations.map((v) => optionOf(v, a.position)).filter(Boolean) as string[]))
    const ordered = (a.options ?? []).map((o: any) => o.value).filter((x: string) => used.some((u) => sameValue(u, x)))
    return [...ordered, ...used.filter((u) => !ordered.some((x: string) => sameValue(x, u)))]
  }
  // Una opción se puede elegir si existe alguna variante con ella y con lo ya elegido en las otras características
  const available = (a: any, value: string) =>
    variations.some(
      (v) =>
        sameValue(optionOf(v, a.position), value) &&
        axes.every((b: any) => b.position === a.position || !picked[b.position] || sameValue(optionOf(v, b.position), picked[b.position])),
    )
  const match = axes.every((a: any) => picked[a.position])
    ? variations.find((v) => axes.every((a: any) => sameValue(optionOf(v, a.position), picked[a.position])))
    : undefined

  const priceOf = (v: any) => Number(v?.price ?? product?.price ?? 0)
  const stockOf = (v: any) => (product?.trackInventory === false ? null : v?.stock ?? null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && match) onPick(match)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [match, onClose, onPick])

  const choose = (a: any, value: string) =>
    setPicked((p) => {
      const next = { ...p, [a.position]: sameValue(p[a.position], value) ? '' : value }
      // Si lo elegido en otra característica ya no combina, se suelta
      for (const b of axes) {
        if (b.position === a.position || !next[b.position]) continue
        const ok = variations.some((v) => axes.every((c: any) => !next[c.position] || sameValue(optionOf(v, c.position), next[c.position])))
        if (!ok) next[b.position] = ''
      }
      return next
    })

  return createPortal(
    <div className='variant-picker' role='dialog' aria-modal='true' aria-label={`Variante de ${product?.name ?? ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='variant-picker__panel'>
        <header className='variant-picker__head'>
          <div>
            <h3>{product?.name}</h3>
            <small>Elige la variante</small>
          </div>
          <button type='button' className='variant-picker__close' onClick={onClose} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </header>

        <div className='variant-picker__body'>
          {axes.map((a: any) => (
            <div key={a.position} className='variant-picker__axis'>
              <span className='variant-picker__axis-name'>{a.name}</span>
              <div className='variant-picker__chips'>
                {valuesOf(a).map((value) => {
                  const on = sameValue(picked[a.position], value)
                  const ok = available(a, value)
                  const hex = a.type === 'COLOR' ? (a.options ?? []).find((o: any) => sameValue(o.value, value))?.hex : undefined
                  return (
                    <button key={value} type='button' className={`variant-picker__chip ${on ? 'is-on' : ''}`} aria-pressed={on} disabled={!ok && !on} onClick={() => choose(a, value)}>
                      {hex ? <i style={{ background: hex }} aria-hidden /> : null}
                      {displayValue(a, value)}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {variations.length <= 24 ? (
            <div className='variant-picker__all'>
              <span className='variant-picker__axis-name'>Todas</span>
              <div className='variant-picker__grid'>
                {variations.map((v) => {
                  const stock = stockOf(v)
                  return (
                    <button key={v.id} type='button' className={`variant-picker__card ${match?.id === v.id ? 'is-on' : ''}`} onClick={() => onPick(v)}>
                      <strong>{v.label || [v.size, v.color].filter(Boolean).join(' / ')}</strong>
                      <span>{money(priceOf(v))}</span>
                      {stock != null ? <small className={stock <= 0 ? 'is-out' : ''}>{stock <= 0 ? 'Agotado' : `${stock} disp.`}</small> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>

        <footer className='variant-picker__foot'>
          {match ? (
            <span className='variant-picker__pick'>
              <strong>{match.label || [match.size, match.color].filter(Boolean).join(' / ')}</strong>
              <span>{money(priceOf(match))}</span>
              {stockOf(match) != null ? <small>{stockOf(match)! <= 0 ? 'Agotado' : `${stockOf(match)} disponibles`}</small> : null}
            </span>
          ) : (
            <span className='variant-picker__pick is-empty'>Elige {axes.map((a: any) => a.name.toLowerCase()).join(' y ')}</span>
          )}
          <button type='button' className='variant-picker__add' disabled={!match} onClick={() => match && onPick(match)}>
            Agregar
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}

export default VariantPicker
