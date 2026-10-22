import React, { useEffect, useRef, useState } from 'react'
import APIs from '../../../../../../services/APIs'
import { money } from '../../../../../../modules/catalogos/productos-y-servicios/variantes/variantTypes'
import './ItemComponents.css'

/** Un insumo del artículo o servicio: lo que se descuenta del almacén al venderlo */
export interface ComponentRow {
  componentId: number
  componentVariationId: number | null
  quantity: string
  customerCanProvide: boolean
  name: string
  code?: string | null
  unit?: string | null
  unitCost: number | null
  variationLabel?: string | null
  /** Variantes del insumo (solo al agregarlo desde el buscador) */
  variations?: { id: number; label: string }[]
}

export const componentsFromItem = (list: any[] | undefined): ComponentRow[] =>
  (list ?? []).map((c) => ({
    componentId: Number(c.componentId),
    componentVariationId: c.componentVariationId ?? null,
    quantity: String(c.quantity ?? 1),
    customerCanProvide: c.customerCanProvide === true,
    name: c.name,
    code: c.code,
    unit: c.unit,
    unitCost: c.unitCost ?? null,
    variationLabel: c.variationLabel ?? null,
  }))

export const componentsToPayload = (rows: ComponentRow[]) =>
  rows.map((r) => ({
    componentId: r.componentId,
    componentVariationId: r.componentVariationId,
    quantity: Number(String(r.quantity).replace(',', '.')),
    customerCanProvide: r.customerCanProvide,
  }))

interface Props {
  companyId: number | null
  /** Id del artículo que se edita (no puede ser insumo de sí mismo) */
  itemId: number | null
  rows: ComponentRow[]
  onRows: (rows: ComponentRow[]) => void
  /** Ajuste de precio cuando el cliente trae su material (p. ej. "-40") */
  adjust: string
  onAdjust: (value: string) => void
  /** Precio de venta, para mostrar cuánto queda después de los insumos */
  price: number | null
}

const num = (v: string) => Number(String(v).replace(',', '.'))

/**
 * Tarjeta "Insumos": la materia prima que se descuenta del almacén al vender este servicio o artículo fabricado (p. ej.
 * "Vaso sublimado" → 1 vaso blanco de 11 oz). Su costo va DENTRO del precio: el ticket muestra una sola línea.
 */
const ItemComponents: React.FC<Props> = ({ companyId, itemId, rows, onRows, adjust, onAdjust, price }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    const ctrl = new AbortController()
    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res: any = await APIs.searchItemComponents(term, companyId, ctrl.signal)
        setResults((res?.data ?? []).filter((r: any) => r.id !== itemId))
        setOpen(true)
      } catch {
        if (!ctrl.signal.aborted) setResults([])
      } finally {
        if (!ctrl.signal.aborted) setSearching(false)
      }
    }, 250)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [query, companyId, itemId])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const add = (r: any) => {
    const variationId = r.variations?.length ? r.variations[0].id : null
    if (rows.some((x) => x.componentId === r.id && x.componentVariationId === variationId)) return
    onRows([
      ...rows,
      {
        componentId: r.id,
        componentVariationId: variationId,
        quantity: '1',
        customerCanProvide: false,
        name: r.name,
        code: r.code,
        unit: r.unit,
        unitCost: r.unitCost ?? null,
        variationLabel: r.variations?.[0]?.label ?? null,
        variations: r.variations?.length ? r.variations : undefined,
      },
    ])
    setQuery('')
    setResults([])
    setOpen(false)
  }
  const patch = (i: number, p: Partial<ComponentRow>) => onRows(rows.map((r, j) => (j === i ? { ...r, ...p } : r)))
  const remove = (i: number) => onRows(rows.filter((_, j) => j !== i))

  const lineCost = (r: ComponentRow) => (r.unitCost != null && num(r.quantity) > 0 ? r.unitCost * num(r.quantity) : null)
  const total = rows.reduce((acc, r) => acc + (lineCost(r) ?? 0), 0)
  const missingCost = rows.some((r) => r.unitCost == null)
  const clientCan = rows.some((r) => r.customerCanProvide)
  const clientSaves = rows.filter((r) => r.customerCanProvide).reduce((acc, r) => acc + (lineCost(r) ?? 0), 0)
  const adjustNum = adjust.trim() === '' ? 0 : num(adjust)
  const clientPrice = price != null && Number.isFinite(adjustNum) ? Math.max(0, price + adjustNum) : null

  return (
    <div className='item-components'>
      <div className='item-components__head'>
        <h4>Insumos</h4>
        <p>Lo que sale del almacén al vender. Su costo va dentro del precio: el ticket muestra una sola línea.</p>
      </div>

      <div className='item-components__search' ref={boxRef}>
        <span className='material-symbols-rounded' aria-hidden>search</span>
        <input
          className='inputs__general'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder='Buscar materia prima por nombre o código'
          aria-label='Buscar insumo'
        />
        {open && query.trim().length >= 2 ? (
          <ul className='item-components__results' role='listbox'>
            {searching && !results.length ? <li className='item-components__hint'>Buscando…</li> : null}
            {!searching && !results.length ? <li className='item-components__hint'>Sin artículos con inventario que coincidan</li> : null}
            {results.map((r) => (
              <li key={r.id}>
                <button type='button' onClick={() => add(r)}>
                  <strong>{r.name}</strong>
                  <span>
                    {r.code ? `${r.code} · ` : ''}
                    {r.unitCost != null ? `costo ${money(r.unitCost)}${r.unit ? ` / ${r.unit}` : ''}` : 'sin costo registrado'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {rows.length ? (
        <div className='item-components__list'>
          {rows.map((r, i) => (
            <div className='item-components__row' key={`${r.componentId}-${r.componentVariationId ?? 0}`}>
              <div className='item-components__name'>
                <strong>{r.name}</strong>
                {r.variations?.length ? (
                  <select
                    className='inputs__general'
                    value={r.componentVariationId ?? ''}
                    onChange={(e) => {
                      const v = r.variations!.find((x) => x.id === Number(e.target.value))
                      patch(i, { componentVariationId: v?.id ?? null, variationLabel: v?.label ?? null })
                    }}
                    aria-label={`Variante de ${r.name}`}
                  >
                    {r.variations.map((v) => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                ) : (
                  <small>{[r.code, r.variationLabel].filter(Boolean).join(' · ') || ' '}</small>
                )}
              </div>
              <label className='item-components__qty'>
                <input
                  className='inputs__general'
                  inputMode='decimal'
                  value={r.quantity}
                  onChange={(e) => patch(i, { quantity: e.target.value })}
                  aria-label={`Cantidad de ${r.name}`}
                />
                <em>{r.unit ?? 'pz'}</em>
              </label>
              <div className='item-components__cost'>
                {lineCost(r) != null ? (
                  <>
                    <strong>{money(lineCost(r)!)}</strong>
                    <small>{money(r.unitCost!)} c/u</small>
                  </>
                ) : (
                  <small className='is-missing'>{r.unitCost == null ? 'Sin costo' : '—'}</small>
                )}
              </div>
              <label className='item-components__client' title='Si el cliente trae este material, no se descuenta del almacén'>
                <input type='checkbox' checked={r.customerCanProvide} onChange={(e) => patch(i, { customerCanProvide: e.target.checked })} />
                <span>El cliente lo puede traer</span>
              </label>
              <button type='button' className='item-components__remove' onClick={() => remove(i)} aria-label={`Quitar ${r.name}`}>
                <span className='material-symbols-rounded'>close</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className='item-components__empty'>Sin insumos: al vender no se descuenta nada del almacén.</p>
      )}

      {rows.length ? (
        <div className='item-components__total'>
          <span>
            Costo de insumos <strong>{money(total)}</strong>
            {missingCost ? <em> (hay insumos sin costo registrado)</em> : null}
          </span>
          {price != null && price > 0 ? (
            <span>
              Precio {money(price)} · queda <strong className={price - total < 0 ? 'is-bad' : ''}>{money(price - total)}</strong>
            </span>
          ) : null}
        </div>
      ) : null}

      {clientCan ? (
        <div className='item-components__adjust'>
          <label>
            <span>Si el cliente trae su material, ajustar el precio</span>
            <input
              className='inputs__general'
              inputMode='decimal'
              value={adjust}
              onChange={(e) => onAdjust(e.target.value)}
              placeholder={clientSaves ? `-${Math.round(clientSaves)}` : '-40'}
              aria-label='Ajuste de precio si el cliente trae su material'
            />
          </label>
          <p>
            {clientPrice != null && adjust.trim() !== '' ? (
              <>Se cobra <strong>{money(clientPrice)}</strong> y no se descuenta {rows.filter((r) => r.customerCanProvide).map((r) => r.name).join(', ')}.</>
            ) : (
              <>Escribe cuánto cambia el precio (negativo para descontar). En el punto de venta aparece el interruptor "El cliente trae su material".</>
            )}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default ItemComponents
