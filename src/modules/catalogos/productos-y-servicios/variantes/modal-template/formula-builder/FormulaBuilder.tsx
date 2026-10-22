import React, { useMemo, useState } from 'react'
import { TemplateAxis, exampleValue, isNumericAxis, money } from '../../variantTypes'
import {
  FN_LABEL,
  FormulaAxis,
  FormulaError,
  FormulaFn,
  FormulaOp,
  FormulaToken,
  UNIT_TO_BASE,
  formulaError,
  formulaFromRule,
  formulaText,
  parseFormulaText,
  tokenLabel,
  variantPrice,
} from '../../priceFormula'
import './FormulaBuilder.css'

interface Props {
  /** Características que crean variantes (solo las de Número o Medida entran en la fórmula) */
  axes: TemplateAxis[]
  formula: FormulaToken[]
  onChange: (formula: FormulaToken[]) => void
}

const OPS: { v: FormulaOp; label: string }[] = [
  { v: '+', label: '+' },
  { v: '-', label: '−' },
  { v: '*', label: '×' },
  { v: '/', label: '÷' },
]
const FNS: FormulaFn[] = ['ROUND', 'MIN', 'MAX']
const FN_HELP: Record<FormulaFn, string> = {
  ROUND: 'Redondear(valor) o Redondear(valor, 2 decimales)',
  MIN: 'El menor: Mínimo(a, b)',
  MAX: 'El mayor: Máximo(a, b), p. ej. precio mínimo de venta',
}
const SYMBOL_KEYS: Record<string, FormulaToken> = {
  '+': { t: 'op', v: '+' },
  '-': { t: 'op', v: '-' },
  '*': { t: 'op', v: '*' },
  x: { t: 'op', v: '*' },
  '/': { t: 'op', v: '/' },
  '(': { t: '(' },
  ')': { t: ')' },
  ',': { t: ',' },
  '%': { t: '%' },
}
const norm = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Fórmula del precio armada con fichas: características (Ancho, Alto, Piezas), Precio, números, + − × ÷, ( ), %,
 * Redondear / Mínimo / Máximo y "Ajustes". Se arma tocando botones o escribiéndola; abajo, la prueba con valores de ejemplo.
 */
const FormulaBuilder: React.FC<Props> = ({ axes, formula, onChange }) => {
  const [open, setOpen] = useState(false)
  const [more, setMore] = useState(false)
  const [cursor, setCursor] = useState(formula.length)
  const [mode, setMode] = useState<'chips' | 'text'>('chips')
  const [text, setText] = useState('')
  const [textError, setTextError] = useState('')
  const [numDraft, setNumDraft] = useState('')
  const [exBase, setExBase] = useState('100')
  const [exAdj, setExAdj] = useState('0')
  const [exValues, setExValues] = useState<Record<string, string>>({})

  const at = Math.min(cursor, formula.length)
  const numeric = axes.filter(isNumericAxis)
  const error = formulaError(formula, axes as FormulaAxis[])

  const insert = (tokens: FormulaToken[]) => {
    onChange([...formula.slice(0, at), ...tokens, ...formula.slice(at)])
    setCursor(at + tokens.length)
  }
  const removeBefore = () => {
    if (!at) return
    onChange([...formula.slice(0, at - 1), ...formula.slice(at)])
    setCursor(at - 1)
  }
  const replace = (tokens: FormulaToken[]) => {
    onChange(tokens)
    setCursor(tokens.length)
  }
  const addNumber = () => {
    const n = Number(numDraft.trim().replace(',', '.'))
    if (numDraft.trim() === '' || !Number.isFinite(n)) return
    insert([{ t: 'num', v: n }])
    setNumDraft('')
  }

  // Atajos ("Empezar con"): solo los que encajan con las características de la plantilla
  const presets = useMemo(() => {
    const fa = axes as FormulaAxis[]
    const area = formulaFromRule('AREA', fa)
    const counts = numeric.filter((a) => a.type === 'NUMBER')
    const piece = counts.find((a) => a.integerOnly) ?? counts[0]
    const pieceTk: FormulaToken[] = piece ? [{ t: 'axis', name: piece.name }] : []
    const list: { key: string; label: string; tokens: FormulaToken[] | null }[] = [
      { key: 'area', label: 'Por m²', tokens: area },
      { key: 'length', label: 'Por metro', tokens: formulaFromRule('LENGTH', fa) },
      {
        key: 'split',
        label: 'Reparto',
        tokens: piece ? (area ? [{ t: '(' }, ...area, { t: ')' }, { t: 'op', v: '/' }, ...pieceTk] : [{ t: 'base' }, { t: 'op', v: '/' }, ...pieceTk]) : null,
      },
      { key: 'pack', label: 'Paquete', tokens: piece ? [{ t: 'base' }, { t: 'op', v: '*' }, ...pieceTk] : null },
      { key: 'percent', label: '+ %', tokens: [{ t: 'base' }, { t: 'op', v: '+' }, { t: 'num', v: 15 }, { t: '%' }] },
    ]
    return list.filter((p): p is { key: string; label: string; tokens: FormulaToken[] } => !!p.tokens)
  }, [axes, numeric])

  // Escribir a mano: autocompletar la palabra que se está escribiendo
  const fragment = /[\p{L}]+$/u.exec(text)?.[0] ?? ''
  const suggestions = fragment
    ? [...numeric.map((a) => a.name), 'Precio', 'Ajustes', ...FNS.map((f) => FN_LABEL[f])].filter((w) => norm(w).startsWith(norm(fragment)) && norm(w) !== norm(fragment)).slice(0, 6)
    : []
  const openText = () => {
    setText(formulaText(formula))
    setTextError('')
    setMode('text')
  }
  const applyText = () => {
    try {
      replace(parseFormulaText(text, axes.map((a) => a.name)))
      setTextError('')
      setMode('chips')
    } catch (e) {
      setTextError(e instanceof FormulaError ? e.message : 'No se pudo leer la fórmula.')
    }
  }

  // Prueba con valores de ejemplo
  const used = numeric.filter((a) => formula.some((t) => t.t === 'axis' && norm(t.name) === norm(a.name)))
  const withAdj = formula.some((t) => t.t === 'adj')
  const exampleOf = (a: TemplateAxis) => exValues[a.name] ?? exampleValue(a, numeric.indexOf(a))
  const example = useMemo(() => {
    if (!formula.length || error) return null
    const base = Number(exBase.replace(',', '.'))
    if (!Number.isFinite(base)) return { error: 'Escribe un precio de ejemplo.' }
    const values: Record<number, string> = Object.fromEntries(used.map((a) => [a.position, exampleOf(a)]))
    const adj = Number(exAdj.replace(',', '.')) || 0
    // "Ajustes" de ejemplo: una característica falsa con ese ajuste
    // Sin las opciones: la prueba muestra solo la fórmula (los ajustes por valor no entran salvo la ficha Ajustes)
    const exAxes: FormulaAxis[] = [...used.map((a) => ({ ...a, options: [] })), ...(withAdj ? [{ position: 99, name: '·ajuste', type: 'LIST', options: [{ value: 'x', adjust: adj }] }] : [])]
    if (withAdj) values[99] = 'x'
    try {
      const result = variantPrice(formula, exAxes, values, base)
      if (result == null) return { error: 'Escribe un número en cada valor de ejemplo.' }
      return { text: formulaText(formula, { base, adj, axes: used as FormulaAxis[], values }), result }
    } catch (e) {
      return { error: e instanceof FormulaError ? e.message : 'No se pudo calcular.' }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formula, error, exBase, exAdj, exValues, axes])
  const converts = used.filter((a) => a.unit && UNIT_TO_BASE[a.unit])

  const chipClass = (tk: FormulaToken) =>
    tk.t === 'axis' ? 'is-axis' : tk.t === 'base' || tk.t === 'adj' ? 'is-base' : tk.t === 'num' ? 'is-num' : tk.t === 'fn' ? 'is-fn' : 'is-op'

  // Cerrado: una línea con la fórmula y "Editar"
  if (!open) {
    return (
      <div className='formula formula--closed'>
        <p className={`formula__summary ${error ? 'is-bad' : ''}`}>
          {formula.length ? (
            <>
              <span className='material-symbols-rounded' aria-hidden>calculate</span>
              <span>
                Precio de cada variante = <b>{formulaText(formula)}</b>
              </span>
            </>
          ) : (
            <span>Sin fórmula: cada variante usa el precio del artículo.</span>
          )}
        </p>
        {error ? <p className='formula__error'>{error}</p> : null}
        <button type='button' className='formula__edit' onClick={() => setOpen(true)}>
          <span className='material-symbols-rounded' aria-hidden>edit</span> {formula.length ? 'Editar' : 'Crear fórmula'}
        </button>
      </div>
    )
  }

  return (
    <div className='formula'>
      {mode === 'chips' ? (
        <div className={`formula__box ${error ? 'is-bad' : ''}`}>
          <div
            className='formula__line'
            tabIndex={0}
            role='group'
            aria-label='Fórmula del precio'
            onClick={(e) => e.target === e.currentTarget && setCursor(formula.length)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace') {
                e.preventDefault()
                removeBefore()
              } else if (e.key === 'ArrowLeft') setCursor(Math.max(0, at - 1))
              else if (e.key === 'ArrowRight') setCursor(Math.min(formula.length, at + 1))
              else if (SYMBOL_KEYS[e.key]) {
                e.preventDefault()
                insert([SYMBOL_KEYS[e.key]])
              }
            }}
          >
            {at === 0 ? <i className='formula__caret' aria-hidden /> : null}
            {formula.map((tk, i) => (
              <React.Fragment key={i}>
                <button type='button' className={`formula__chip ${chipClass(tk)}`} onClick={() => setCursor(i + 1)} title='Toca para escribir después de esta ficha'>
                  {tokenLabel(tk)}
                </button>
                {at === i + 1 ? <i className='formula__caret' aria-hidden /> : null}
              </React.Fragment>
            ))}
            {!formula.length ? <span className='formula__empty'>Toca las fichas de abajo para armarla</span> : null}
          </div>
          <div className='formula__icons'>
            <button type='button' onClick={removeBefore} disabled={!at} title='Borrar la ficha anterior' aria-label='Borrar'>
              <span className='material-symbols-rounded'>backspace</span>
            </button>
            <button type='button' onClick={openText} title='Escribirla' aria-label='Escribirla'>
              <span className='material-symbols-rounded'>keyboard</span>
            </button>
            <button type='button' onClick={() => replace([])} disabled={!formula.length} title='Quitar fórmula' aria-label='Quitar fórmula'>
              <span className='material-symbols-rounded'>delete</span>
            </button>
          </div>
        </div>
      ) : (
        <div className='formula__text'>
          <input
            className='inputs__general'
            value={text}
            autoFocus
            placeholder='Ej. (Precio × Ancho × Alto) ÷ Piezas'
            onChange={(e) => {
              setText(e.target.value)
              setTextError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                applyText()
              }
            }}
            aria-label='Escribir la fórmula'
          />
          {suggestions.length ? (
            <div className='formula__suggest'>
              {suggestions.map((w) => (
                <button
                  key={w}
                  type='button'
                  onClick={() => setText(text.slice(0, text.length - fragment.length) + w + (Object.values(FN_LABEL).includes(w) ? '(' : ' '))}
                >
                  {w}
                </button>
              ))}
            </div>
          ) : null}
          {textError ? <p className='formula__error'>{textError}</p> : null}
          <div className='formula__text-actions'>
            <button type='button' className='btn__general-secondary' onClick={() => setMode('chips')}>Cancelar</button>
            <button type='button' className='btn__general-purple' onClick={applyText}>Usar</button>
          </div>
        </div>
      )}

      {error ? <p className='formula__error'>{error}</p> : null}

      {/* Resultado de ejemplo en una línea, con sus valores editables */}
      {formula.length && !error ? (
        <div className='formula__try'>
          {example && 'result' in example ? (
            <span className='formula__result'>
              = <b>{money(example.result!)}</b>
            </span>
          ) : example ? (
            <span className='formula__error'>{example.error}</span>
          ) : null}
          <span className='formula__try-label'>con</span>
          <label>
            Precio
            <input value={exBase} inputMode='decimal' onChange={(e) => setExBase(e.target.value)} aria-label='Precio de ejemplo' />
          </label>
          {used.map((a) => (
            <label key={a.position}>
              {a.name}
              <input value={exampleOf(a)} inputMode='decimal' onChange={(e) => setExValues((v) => ({ ...v, [a.name]: e.target.value }))} aria-label={`${a.name} de ejemplo`} />
              {a.unit ? <small>{a.unit}</small> : null}
            </label>
          ))}
          {withAdj ? (
            <label>
              Ajustes
              <input value={exAdj} inputMode='decimal' onChange={(e) => setExAdj(e.target.value)} aria-label='Ajustes de ejemplo' />
            </label>
          ) : null}
        </div>
      ) : null}

      {mode === 'chips' ? (
        <div className='formula__pad'>
          <div className='formula__row'>
            {OPS.map((o) => (
              <button key={o.v} type='button' className='formula__key is-op' onClick={() => insert([{ t: 'op', v: o.v }])}>
                {o.label}
              </button>
            ))}
            <button type='button' className='formula__key is-op' onClick={() => insert([{ t: '(' }])}>(</button>
            <button type='button' className='formula__key is-op' onClick={() => insert([{ t: ')' }])}>)</button>
            <button type='button' className='formula__key is-op' onClick={() => insert([{ t: '%' }])} title='15 % = 15 % del precio del artículo'>%</button>
            <button type='button' className={`formula__key is-more ${more ? 'is-on' : ''}`} onClick={() => setMore((m) => !m)} aria-expanded={more}>
              Más <span className='material-symbols-rounded' aria-hidden>{more ? 'expand_less' : 'expand_more'}</span>
            </button>
          </div>
          {more ? (
            <div className='formula__row'>
              {FNS.map((f) => (
                <button key={f} type='button' className='formula__key is-fn' title={FN_HELP[f]} onClick={() => insert([{ t: 'fn', v: f }, { t: '(' }])}>
                  {FN_LABEL[f]}( )
                </button>
              ))}
              <button type='button' className='formula__key is-op' onClick={() => insert([{ t: ',' }])} title='Separa valores dentro de Mínimo o Máximo'>,</button>
            </div>
          ) : null}
          <div className='formula__row'>
            {numeric.map((a) => (
              <button key={a.position} type='button' className='formula__key is-axis' onClick={() => insert([{ t: 'axis', name: a.name }])}>
                {a.name}
              </button>
            ))}
            <button type='button' className='formula__key is-base' onClick={() => insert([{ t: 'base' }])} title='El precio del artículo'>
              Precio
            </button>
            <button type='button' className='formula__key is-base is-soft' onClick={() => insert([{ t: 'adj' }])} title='Ajustes por valor (XL +$20). Si no la pones, se suman al final.'>
              Ajustes
            </button>
            <input
              className='formula__num'
              value={numDraft}
              inputMode='decimal'
              placeholder='Número…'
              onChange={(e) => setNumDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addNumber()
                }
              }}
              onBlur={addNumber}
              aria-label='Agregar un número fijo'
            />
          </div>
          {presets.length ? (
            <div className='formula__presets'>
              <span>Empezar con:</span>
              {presets.map((p) => (
                <button key={p.key} type='button' title={formulaText(p.tokens)} onClick={() => replace(p.tokens)}>
                  {p.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {converts.length ? <p className='formula__note'>Las medidas se calculan en {Array.from(new Set(converts.map((a) => UNIT_TO_BASE[a.unit!].unit))).join(', ')} (120 cm = 1.2 m).</p> : null}

      <button type='button' className='formula__done' onClick={() => setOpen(false)}>
        Listo
      </button>
    </div>
  )
}

export default FormulaBuilder
