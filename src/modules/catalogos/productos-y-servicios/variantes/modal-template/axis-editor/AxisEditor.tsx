import React, { useState } from 'react'
import { AxisType, MEASURE_UNITS, TemplateAxis, adjustText, displayValue, hasAdjusts, isNumericAxis, sameValue, toNumber } from '../../variantTypes'
import PriceAdjust from '../price-adjust/PriceAdjust'
import './AxisEditor.css'

interface Props {
  axis: TemplateAxis
  index: number
  /** Sí: cada valor es una variante (se combina con las demás). No: solo es un dato del artículo */
  combines: boolean
  /** Motivo por el que no se puede cambiar "¿crea variantes?" (si no se puede) */
  combinesLock?: string
  onCombines: (combines: boolean) => void
  /** Número / Medida "solo para calcular el precio" (no crea variantes; se escribe en cada artículo) */
  forPrice?: boolean
  onForPrice?: () => void
  /** La fórmula del precio usa esta característica */
  inFormula?: boolean
  /** Plantilla en uso: no se cambia el tipo ni se quita */
  locked: boolean
  canRemove: boolean
  onChange: (axis: TemplateAxis) => void
  onRemove: () => void
}

const DEFAULT_HEX = '#9ca3af'

/** Los 5 tipos explicados con un ejemplo, en vez de un select con jerga. */
const TYPES: { type: AxisType; icon: string; label: string; example: string }[] = [
  { type: 'LIST', icon: 'list', label: 'Opciones', example: 'S, M, L' },
  { type: 'COLOR', icon: 'palette', label: 'Colores', example: 'Rojo, Azul' },
  { type: 'MEASURE', icon: 'straighten', label: 'Medida', example: '1.5 m, 500 ml' },
  { type: 'NUMBER', icon: 'pin', label: 'Número', example: '6, 12, 24' },
  { type: 'TEXT', icon: 'edit_note', label: 'Texto', example: 'Modelo X1' },
]

/** Nombres frecuentes: al tocarlos se llena el nombre y el tipo adecuado. */
const SUGGESTIONS: { name: string; type: AxisType; unit?: string }[] = [
  { name: 'Talla', type: 'LIST' },
  { name: 'Color', type: 'COLOR' },
  { name: 'Sabor', type: 'LIST' },
  { name: 'Tamaño', type: 'LIST' },
  { name: 'Largo', type: 'MEASURE', unit: 'm' },
  { name: 'Contenido', type: 'MEASURE', unit: 'ml' },
  { name: 'Peso', type: 'MEASURE', unit: 'kg' },
  { name: 'Piezas', type: 'NUMBER' },
  { name: 'Marca', type: 'TEXT' },
  { name: 'Material', type: 'TEXT' },
  { name: 'Modelo', type: 'TEXT' },
]

/** Una característica que cambia entre variantes (p. ej. Talla): nombre, cómo se capturan sus valores y los valores. */
const AxisEditor: React.FC<Props> = ({ axis, index, combines, combinesLock, onCombines, forPrice = false, onForPrice, inFormula, locked, canRemove, onChange, onRemove }) => {
  const [draft, setDraft] = useState('')
  const [valueError, setValueError] = useState('')
  const numeric = isNumericAxis(axis)
  const [showRange, setShowRange] = useState(axis.minValue != null || axis.maxValue != null)
  // Cerrado por defecto: solo se abre en la característica que lo necesita (o si ya tiene ajustes)
  const [showAdjust, setShowAdjust] = useState(hasAdjusts(axis))
  // Opciones secundarias (ajuste de precio, rango, solo enteros) escondidas en "Más opciones"
  const [more, setMore] = useState(hasAdjusts(axis) || axis.minValue != null || axis.maxValue != null)
  const mode: 'variant' | 'data' | 'price' = combines ? 'variant' : forPrice ? 'price' : 'data'
  const MODES = [
    { key: 'variant' as const, icon: 'call_split', label: 'Crea variantes', help: 'Cada valor es una variante con su stock, precio y SKU.' },
    { key: 'data' as const, icon: 'description', label: 'Solo un dato', help: 'Se escribe una vez en la ficha del artículo.' },
    ...(numeric && onForPrice ? [{ key: 'price' as const, icon: 'calculate', label: 'Para el precio', help: 'Se escribe al crear el artículo y lo usa la fórmula.' }] : []),
  ]
  const pickMode = (m: 'variant' | 'data' | 'price') => (m === 'variant' ? onCombines(true) : m === 'data' ? onCombines(false) : onForPrice?.())
  const modeDisabled = (m: 'variant' | 'data' | 'price') => !!combinesLock && (m === 'variant' ? !combines : combines)
  const hasMore = (combines && axis.options.length > 0) || (numeric && combines) || (axis.type === 'NUMBER' && combines)

  /** El eje con otro tipo (al pasar a número / medida solo se quedan los valores que son números). */
  const withType = (base: TemplateAxis, type: AxisType, unit?: string): TemplateAxis => {
    if (type === base.type) return type === 'MEASURE' && unit ? { ...base, unit } : base
    const toNumeric = type === 'NUMBER' || type === 'MEASURE'
    return {
      ...base,
      type,
      unit: type === 'MEASURE' ? unit ?? base.unit ?? 'm' : null,
      minValue: toNumeric ? base.minValue ?? null : null,
      maxValue: toNumeric ? base.maxValue ?? null : null,
      integerOnly: false,
      options: base.options
        .filter((o) => !toNumeric || Number.isFinite(toNumber(o.value)))
        .map((o) => (type === 'COLOR' ? { value: o.value, hex: o.hex ?? DEFAULT_HEX } : { value: o.value })),
    }
  }
  const setType = (type: AxisType) => {
    if (!locked) onChange(withType(axis, type))
  }

  // Varios valores a la vez separados por coma (en número / medida se separan con punto y coma: "2,5" es un número)
  const addValues = (text: string) => {
    const sep = numeric ? ';' : ','
    const values = text.split(sep).map((v) => v.trim().replace(/\s+/g, ' ')).filter(Boolean)
    if (!values.length) return
    const next = [...axis.options]
    for (const raw of values) {
      let value = raw
      if (numeric) {
        const n = toNumber(raw)
        if (!Number.isFinite(n)) return setValueError(`"${raw}" no es un número.`)
        if ((axis.minValue != null && n < axis.minValue) || (axis.maxValue != null && n > axis.maxValue)) return setValueError(`"${raw}" está fuera del rango.`)
        if (axis.integerOnly && !Number.isInteger(n)) return setValueError(`"${raw}" no es un número entero.`)
        value = String(Math.round(n * 10000) / 10000)
      }
      if (!next.some((o) => sameValue(o.value, value))) next.push(axis.type === 'COLOR' ? { value, hex: DEFAULT_HEX } : { value })
    }
    if (numeric) next.sort((a, b) => toNumber(a.value) - toNumber(b.value))
    setValueError('')
    onChange({ ...axis, options: next })
    setDraft('')
  }
  const bound = (v: string) => (v.trim() === '' ? null : toNumber(v))

  return (
    <div className={`axis-card is-${mode}`}>
      <div className='axis-card__head'>
        <span className='axis-card__num' aria-hidden>
          {combines ? index + 1 : <span className='material-symbols-rounded'>{forPrice ? 'calculate' : 'description'}</span>}
        </span>
        <input
          className='inputs__general axis-card__name'
          value={axis.name}
          maxLength={40}
          placeholder={combines ? 'Ej. Talla' : forPrice ? 'Ej. Ancho' : 'Ej. Marca'}
          onChange={(e) => onChange({ ...axis, name: e.target.value })}
          aria-label={`Nombre de la característica ${index + 1}`}
        />
        {canRemove ? (
          <button type='button' className='axis-card__remove' onClick={onRemove} disabled={locked} aria-label='Quitar característica' title={locked ? 'Hay artículos que la usan' : 'Quitar'}>
            <span className='material-symbols-rounded'>close</span>
          </button>
        ) : null}
      </div>

      {!axis.name.trim() ? (
        <div className='axis-card__suggest'>
          {SUGGESTIONS.map((s) => (
            <button key={s.name} type='button' onClick={() => onChange(locked ? { ...axis, name: s.name } : withType({ ...axis, name: s.name }, s.type, s.unit))}>
              {s.name}
            </button>
          ))}
        </div>
      ) : null}

      {/* Para qué sirve: control segmentado de 2 o 3 opciones; la explicación solo de la elegida */}
      <div className='axis-card__row'>
        <div className='axis-card__seg' role='radiogroup' aria-label='¿Para qué sirve?' title={combinesLock}>
          {MODES.map((m) => (
            <button
              key={m.key}
              type='button'
              role='radio'
              aria-checked={mode === m.key}
              className={mode === m.key ? 'is-active' : ''}
              disabled={modeDisabled(m.key)}
              onClick={() => pickMode(m.key)}
              title={m.help}
            >
              <span className='material-symbols-rounded' aria-hidden>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <small className='axis-card__help'>{combinesLock ? `${combinesLock}.` : MODES.find((m) => m.key === mode)?.help}</small>
      {combines && inFormula && numeric && onForPrice && !combinesLock ? (
        <p className='axis-card__warn'>
          <span className='material-symbols-rounded' aria-hidden>info</span>
          Está en la fórmula y también crea variantes.
          <button type='button' onClick={onForPrice}>Usar solo para el precio</button>
        </p>
      ) : null}

      {/* Tipo de valor: fichas compactas con icono; el ejemplo va en el tooltip */}
      <div className='axis-card__row'>
        <div className='axis-card__types' role='radiogroup' aria-label='Tipo de valor'>
          {TYPES.map((t) => (
            <button
              key={t.type}
              type='button'
              role='radio'
              aria-checked={axis.type === t.type}
              className={axis.type === t.type ? 'is-active' : ''}
              disabled={locked && axis.type !== t.type}
              onClick={() => setType(t.type)}
              title={`Ej. ${t.example}`}
            >
              <span className='material-symbols-rounded' aria-hidden>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        {axis.type === 'MEASURE' ? (
          <label className='axis-card__unit'>
            <span>Unidad</span>
            <select value={axis.unit ?? ''} disabled={locked} onChange={(e) => onChange({ ...axis, unit: e.target.value })}>
              {MEASURE_UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {combines || axis.type === 'LIST' || axis.type === 'COLOR' ? (
        <div className='axis-card__values'>
          {axis.options.map((o, i) => (
            <span key={o.value} className='axis-card__chip'>
              {axis.type === 'COLOR' ? (
                <label className='axis-card__swatch' style={{ background: o.hex ?? DEFAULT_HEX }} title='Cambiar color'>
                  <input
                    type='color'
                    value={o.hex ?? DEFAULT_HEX}
                    onChange={(e) => onChange({ ...axis, options: axis.options.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)) })}
                    aria-label={`Color de ${o.value}`}
                  />
                </label>
              ) : null}
              {displayValue(axis, o.value)}
              {combines && o.adjust ? <em className='axis-card__adjust'>{adjustText(o)}</em> : null}
              <button type='button' onClick={() => onChange({ ...axis, options: axis.options.filter((_, j) => j !== i) })} aria-label={`Quitar ${o.value}`}>
                <span className='material-symbols-rounded'>close</span>
              </button>
            </span>
          ))}
          <input
            className='axis-card__add'
            value={draft}
            inputMode={numeric ? 'decimal' : undefined}
            placeholder={axis.type === 'TEXT' ? 'Valores de ejemplo (opcional)' : numeric ? `Agrega un valor${axis.unit ? ` en ${axis.unit}` : ''} y Enter` : 'Escribe y Enter'}
            onChange={(e) => {
              setValueError('')
              const sep = numeric ? ';' : ','
              if (e.target.value.includes(sep)) addValues(e.target.value)
              else setDraft(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addValues(draft)
              }
            }}
            onBlur={() => addValues(draft)}
            aria-label='Agregar valor'
          />
        </div>
      ) : null}
      {valueError ? <small className='axis-card__error'>{valueError}</small> : null}

      {hasMore ? (
        <div className='axis-card__more'>
          <button type='button' className='axis-card__more-toggle' aria-expanded={more} onClick={() => setMore((m) => !m)}>
            <span className='material-symbols-rounded' aria-hidden>{more ? 'expand_less' : 'tune'}</span> {more ? 'Menos opciones' : 'Más opciones'}
          </button>
          {more ? (
            <div className='axis-card__more-body'>
              {axis.type === 'NUMBER' && combines ? (
                <label className='axis-card__check'>
                  <input
                    type='checkbox'
                    checked={!!axis.integerOnly}
                    disabled={locked}
                    onChange={(e) =>
                      onChange({
                        ...axis,
                        integerOnly: e.target.checked,
                        // Al pedir enteros se quitan los valores con decimales
                        options: e.target.checked ? axis.options.filter((o) => Number.isInteger(toNumber(o.value))) : axis.options,
                      })
                    }
                  />
                  Solo números enteros
                </label>
              ) : null}
              {numeric && combines ? (
                showRange ? (
                  <div className='axis-card__range-fields'>
                    <label>
                      <span>Desde</span>
                      <input className='inputs__general' type='number' step='any' value={axis.minValue ?? ''} placeholder='Sin mínimo' onChange={(e) => onChange({ ...axis, minValue: bound(e.target.value) })} />
                    </label>
                    <label>
                      <span>Hasta</span>
                      <input className='inputs__general' type='number' step='any' value={axis.maxValue ?? ''} placeholder='Sin máximo' onChange={(e) => onChange({ ...axis, maxValue: bound(e.target.value) })} />
                    </label>
                  </div>
                ) : (
                  <button type='button' className='axis-card__link' onClick={() => setShowRange(true)}>+ Limitar a un rango</button>
                )
              ) : null}
              {combines && axis.options.length ? (
                showAdjust ? (
                  <PriceAdjust axis={axis} options={axis.options} onChange={(options) => onChange({ ...axis, options })} />
                ) : (
                  <button type='button' className='axis-card__link' onClick={() => setShowAdjust(true)}>
                    + Ajustar el precio según {axis.name.trim().toLowerCase() || 'el valor'}
                  </button>
                )
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default AxisEditor
