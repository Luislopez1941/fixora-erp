import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import {
  AxisOption,
  MAX_COMBINATIONS,
  VariantTemplate,
  adjustText,
  displayValue,
  formulaText,
  hasAdjusts,
  isNumericAxis,
  money,
  sameValue,
  toNumber,
  variantPrice,
  withFieldInputs,
} from '../../../../../../modules/catalogos/productos-y-servicios/variantes/variantTypes'
import { VariantRow, combinations, labelOf, optionOf, rowKey, skuSuffix } from './variantRows'
import { Attributes } from './item-fields/ItemFields'
import VariantRowItem from './variant-row/VariantRowItem'
import PriceAdjust from '../../../../../../modules/catalogos/productos-y-servicios/variantes/modal-template/price-adjust/PriceAdjust'
import TemplatePreview from '../../../../../../modules/catalogos/productos-y-servicios/variantes/modal-template/template-preview/TemplatePreview'
import './VariantMatrix.css'

interface Props {
  template: VariantTemplate
  rows: VariantRow[]
  onRows: (rows: VariantRow[]) => void
  /** Código del artículo: base para sugerir el SKU de cada variante */
  baseSku: string
  basePrice: string
  /** Ficha del artículo: la fórmula usa sus medidas "para el precio" */
  attributes: Attributes
  /** Precio según la plantilla: los precios se calculan y se recalculan en vivo (menos los cambiados a mano) */
  auto: boolean
}

type Adjust = Pick<AxisOption, 'adjust' | 'adjustType'>
type Combo = Record<number, string>
const valueKey = (v: string) => v.trim().toLocaleLowerCase('es-MX')
const comboKey = (c: Combo) => rowKey({ option1: c[1], option2: c[2], option3: c[3] } as VariantRow)

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

/**
 * Variantes dentro del modal del artículo: se marcan las opciones de cada característica y la tabla se arma sola
 * (conserva ids, códigos y precios cambiados a mano). El modal la monta con key = plantilla, así cada plantilla empieza limpia.
 */
const VariantMatrix: React.FC<Props> = ({ template, rows, onRows, baseSku, basePrice, attributes, auto }) => {
  const axes = template.axes
  const fields = template.fields ?? []
  const formula = template.priceFormula ?? null
  const rowsRef = useRef(rows)
  rowsRef.current = rows

  // Opciones marcadas por característica: al abrir, las que ya usan las variantes del artículo
  const [selected, setSelected] = useState<Record<number, string[]>>(() => {
    const next: Record<number, string[]> = {}
    for (const a of axes) {
      const used = Array.from(new Set(rows.map((r) => optionOf(r, a.position)).filter(Boolean) as string[]))
      next[a.position] = a.type === 'TEXT' || isNumericAxis(a) ? used : a.options.filter((o) => used.some((u) => sameValue(u, o.value))).map((o) => o.value)
    }
    return next
  })
  // Combinaciones que no se venden (quitadas de la tabla); al abrir, las que no existían entre las variantes guardadas
  const [excluded, setExcluded] = useState<Set<string>>(() => {
    if (!rows.length) return new Set()
    const have = new Set(rows.map(rowKey))
    return new Set(combinations(axes, selected).map(comboKey).filter((k) => !have.has(k)))
  })
  const [adjusts, setAdjusts] = useState<Record<number, Record<string, Adjust>>>(() =>
    Object.fromEntries(axes.map((a) => [a.position, Object.fromEntries(a.options.filter((o) => o.adjust).map((o) => [valueKey(o.value), { adjust: o.adjust, adjustType: o.adjustType }]))])),
  )
  const [openAdjust, setOpenAdjust] = useState<Record<number, boolean>>(() => Object.fromEntries(axes.map((a) => [a.position, hasAdjusts(a)])))
  const [textDraft, setTextDraft] = useState<Record<number, string>>({})
  const [valueError, setValueError] = useState('')

  /** Características con todos sus valores (de la plantilla + propios del artículo) y el ajuste de este artículo */
  const priceAxes = useMemo(
    () =>
      axes.map((a) => {
        const values = [...a.options.map((o) => o.value), ...(selected[a.position] ?? []).filter((v) => !a.options.some((o) => sameValue(o.value, v)))]
        return { ...a, options: values.map((value) => ({ value, hex: a.options.find((o) => sameValue(o.value, value))?.hex, ...(adjusts[a.position]?.[valueKey(value)] ?? {}) })) }
      }),
    [axes, selected, adjusts],
  )
  const base = basePrice.trim() === '' ? null : Number(basePrice)
  const priceOf = (values: Record<number, string | null | undefined>) => {
    if (!auto) return null
    try {
      const inputs = withFieldInputs(priceAxes, values, fields, attributes)
      return variantPrice(formula, inputs.axes, inputs.values, base)
    } catch {
      return null
    }
  }

  const combos = useMemo(() => combinations(axes, selected), [axes, selected])
  const tooMany = combos.length > MAX_COMBINATIONS
  const active = useMemo(() => combos.filter((c) => !excluded.has(comboKey(c))), [combos, excluded])

  // Lo que cambia el precio: si cambia, se recalculan en vivo las variantes que no se cambiaron a mano
  const priceKey = JSON.stringify([auto, basePrice, adjusts, formula, fields.map((f) => attributes[f.name] ?? null)])
  // Al abrir un artículo no se tocan sus precios guardados: solo se recalculan si algo del precio cambia después
  const openedKey = useRef(priceKey)

  // La tabla se arma sola con las opciones marcadas (sin botón "Generar")
  useEffect(() => {
    if (tooMany) return
    const current = rowsRef.current
    const byKey = new Map(current.map((r) => [rowKey(r), r]))
    let changed = current.length !== active.length
    const next = active.map((c, i) => {
      const found = byKey.get(comboKey(c))
      const computed = priceOf(c)
      if (found) {
        // Sin cálculo para esa variante (sin ajuste ni fórmula) queda vacía = usa el precio del artículo
        const live = computed != null ? String(computed) : ''
        if (auto && !found.manual && priceKey !== openedKey.current && found.price !== live) {
          changed = true
          return { ...found, price: live }
        }
        if (current[i] !== found) changed = true
        return found
      }
      changed = true
      const row: VariantRow = { option1: c[1] ?? null, option2: c[2] ?? null, option3: c[3] ?? null, sku: '', barcode: '', price: '', images: [] }
      const values = axes.map((a) => c[a.position]).filter(Boolean)
      return { ...row, label: labelOf(row), sku: baseSku.trim() ? `${baseSku.trim()}-${skuSuffix(values)}` : '', price: computed != null ? String(computed) : '' }
    })
    if (changed) onRows(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, priceKey, tooMany])

  const toggleValue = (position: number, value: string) =>
    setSelected((s) => {
      const cur = s[position] ?? []
      return { ...s, [position]: cur.some((v) => sameValue(v, value)) ? cur.filter((v) => !sameValue(v, value)) : [...cur, value] }
    })

  const addFreeValue = (position: number) => {
    const a = axes.find((x) => x.position === position)!
    let v = (textDraft[position] ?? '').trim()
    if (!v) return
    if (isNumericAxis(a)) {
      const n = toNumber(v)
      if (!Number.isFinite(n) || n <= 0) return setValueError(`"${v}" no es un número válido para ${a.name}.`)
      if ((a.minValue != null && n < a.minValue) || (a.maxValue != null && n > a.maxValue)) {
        return setValueError(`${a.name} debe estar${a.minValue != null ? ` desde ${a.minValue}` : ''}${a.maxValue != null ? ` hasta ${a.maxValue}` : ''}${a.unit ? ` ${a.unit}` : ''}.`)
      }
      if (a.integerOnly && !Number.isInteger(n)) return setValueError(`${a.name} solo acepta números enteros.`)
      v = String(Math.round(n * 10000) / 10000)
    }
    setValueError('')
    if (!(selected[position] ?? []).some((x) => sameValue(x, v))) toggleValue(position, v)
    setTextDraft((d) => ({ ...d, [position]: '' }))
  }

  // Edición de filas: funciones estables para que las filas memorizadas no se vuelvan a pintar
  const patch = useCallback((i: number, p: Partial<VariantRow>) => onRows(rowsRef.current.map((r, j) => (j === i ? { ...r, ...p } : r))), [onRows])
  const removeRow = useCallback((i: number) => {
    const r = rowsRef.current[i]
    if (r) setExcluded((s) => new Set(s).add(rowKey(r)))
  }, [])
  const pickImage = useCallback(
    async (i: number, file?: File) => {
      if (!file) return
      if (file.size > 3 * 1024 * 1024) {
        Swal.fire({ icon: 'warning', title: 'Imagen muy grande', text: 'Usa una imagen de máximo 3 MB.', confirmButtonColor: '#072a57' })
        return
      }
      const url = await fileToDataUrl(file)
      patch(i, { images: [url] })
    },
    [patch],
  )

  const manualCount = rows.filter((r) => r.manual).length
  const recalcManual = () =>
    onRows(
      rows.map((r) => {
        if (!r.manual) return r
        const p = priceOf({ 1: r.option1, 2: r.option2, 3: r.option3 })
        return { ...r, price: p != null ? String(p) : r.price, manual: false }
      }),
    )

  // "precio desde $X hasta $Y"
  const priceRange = useMemo(() => {
    const prices = rows.map((r) => (r.price.trim() === '' ? base : Number(r.price))).filter((n): n is number => n != null && Number.isFinite(n))
    if (!prices.length) return ''
    const lo = Math.min(...prices)
    const hi = Math.max(...prices)
    return lo === hi ? `precio ${money(lo)}` : `precio desde ${money(lo)} hasta ${money(hi)}`
  }, [rows, base])

  return (
    <div className='variant-matrix'>
      <div className='variant-matrix__summary'>
        <TemplatePreview
          parts={axes.map((a) => ({ label: a.name, count: (selected[a.position] ?? []).length }))}
          total={tooMany ? null : active.length || null}
          example={active[0] ? axes.map((a) => displayValue(a, active[0][a.position])).filter(Boolean).join(' / ') : undefined}
          note={priceRange || undefined}
          price={auto && formula?.length ? formulaText(formula) : undefined}
          emptyText={tooMany ? `Son más de ${MAX_COMBINATIONS}: elige menos opciones` : 'Marca las opciones que vendes'}
        />
      </div>

      <div className='variant-matrix__axes'>
        {axes.map((a) => (
          <div key={a.position} className='variant-matrix__axis'>
            <span className='variant-matrix__axis-name'>{a.name}</span>
            <div className='variant-matrix__chips'>
              {(a.type === 'TEXT'
                ? (selected[a.position] ?? []).map((value) => ({ value, hex: undefined as string | undefined }))
                : isNumericAxis(a)
                  ? [...a.options.map((o) => o.value), ...(selected[a.position] ?? []).filter((v) => !a.options.some((o) => sameValue(o.value, v)))]
                      .sort((x, y) => toNumber(x) - toNumber(y))
                      .map((value) => ({ value, hex: undefined as string | undefined }))
                  : a.options
              ).map((o) => {
                const on = (selected[a.position] ?? []).some((v) => sameValue(v, o.value))
                const adj = adjusts[a.position]?.[valueKey(o.value)]
                return (
                  <button key={o.value} type='button' className={`variant-matrix__chip ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => toggleValue(a.position, o.value)}>
                    {a.type === 'COLOR' ? <i style={{ background: o.hex }} aria-hidden /> : null}
                    {displayValue(a, o.value)}
                    {auto && adj ? <small className='variant-matrix__chip-adjust'>{adjustText(adj)}</small> : null}
                  </button>
                )
              })}
              {a.type === 'TEXT' || isNumericAxis(a) ? (
                <span className='variant-matrix__free'>
                  <input
                    className='variant-matrix__text'
                    value={textDraft[a.position] ?? ''}
                    inputMode={isNumericAxis(a) ? 'decimal' : undefined}
                    placeholder={isNumericAxis(a) ? (a.type === 'MEASURE' ? 'Otra medida' : 'Otro número') : 'Escribe y Enter'}
                    onChange={(e) => setTextDraft((d) => ({ ...d, [a.position]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addFreeValue(a.position)
                      }
                    }}
                    aria-label={`Agregar valor de ${a.name}`}
                  />
                  {a.type === 'MEASURE' && a.unit ? <em className='variant-matrix__unit'>{a.unit}</em> : null}
                  <button type='button' className='variant-matrix__add' onClick={() => addFreeValue(a.position)} aria-label={`Agregar ${a.name}`}>
                    <span className='material-symbols-rounded'>add</span>
                  </button>
                </span>
              ) : null}
            </div>
            {auto && (selected[a.position] ?? []).length ? (
              <div className='variant-matrix__adjust'>
                {openAdjust[a.position] ? (
                  <PriceAdjust
                    axis={a}
                    options={priceAxes.find((x) => x.position === a.position)!.options.filter((o) => (selected[a.position] ?? []).some((v) => sameValue(v, o.value)))}
                    basePrice={formula?.length ? null : base}
                    onChange={(opts) =>
                      setAdjusts((cur) => {
                        const next = { ...(cur[a.position] ?? {}) }
                        for (const o of opts) {
                          if (o.adjust) next[valueKey(o.value)] = { adjust: o.adjust, adjustType: o.adjustType }
                          else delete next[valueKey(o.value)]
                        }
                        return { ...cur, [a.position]: next }
                      })
                    }
                  />
                ) : (
                  <button type='button' className='variant-matrix__adjust-open' onClick={() => setOpenAdjust((o) => ({ ...o, [a.position]: true }))}>
                    <span className='material-symbols-rounded' aria-hidden>sell</span> Ajustar precio según {a.name.toLowerCase()}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        ))}
        {valueError ? <p className='variant-matrix__error'>{valueError}</p> : null}
      </div>

      {rows.length ? (
        <>
          {excluded.size || (auto && manualCount) ? (
            <div className='variant-matrix__tools'>
              {excluded.size ? (
                <span>
                  {excluded.size} {excluded.size === 1 ? 'combinación quitada' : 'combinaciones quitadas'}{' '}
                  <button type='button' onClick={() => setExcluded(new Set())}>Volver a mostrar</button>
                </span>
              ) : null}
              {auto && manualCount ? (
                <span>
                  {manualCount} con precio a mano <button type='button' onClick={recalcManual}>Recalcularlas también</button>
                </span>
              ) : null}
            </div>
          ) : null}
          <div className='variant-matrix__table' role='table' aria-label='Variantes'>
            <div className='variant-matrix__head' role='row'>
              <span>Imagen</span>
              <span>Variante</span>
              <span>SKU</span>
              <span>Código de barras</span>
              <span>Precio</span>
              <span />
            </div>
            {rows.map((r, i) => (
              <VariantRowItem key={rowKey(r) || i} row={r} index={i} axes={axes} basePrice={basePrice} onPatch={patch} onImage={pickImage} onRemove={removeRow} />
            ))}
          </div>
          <p className='variant-matrix__hint'>Precio vacío = el del artículo.</p>
        </>
      ) : tooMany ? null : (
        <p className='variant-matrix__hint'>Marca opciones arriba y las variantes aparecen aquí.</p>
      )}
    </div>
  )
}

export default VariantMatrix
