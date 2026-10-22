import React, { useMemo, useState } from 'react'
import APIs from '../../../../../services/APIs'
import { showToast } from '../../../../../utils/toast'
import AxisEditor from './axis-editor/AxisEditor'
import TemplatePresets from './template-presets/TemplatePresets'
import TemplatePreview from './template-preview/TemplatePreview'
import AdvancedOptions from './advanced-options/AdvancedOptions'
import { TemplatePreset } from './templatePresets'
import { offerRecalc } from '../recalcPrices'
import {
  Characteristic,
  MAX_AXES,
  MAX_FIELDS,
  FormulaToken,
  TemplateCategory,
  VariantTemplate,
  charToField,
  defaultCombines,
  displayValue,
  errorText,
  fieldToChar,
  formulaError,
  formulaFromRule,
  formulaFieldAxes,
  isNumericAxis,
} from '../variantTypes'
import './ModalTemplate.css'

interface Props {
  companyId: number | null
  template?: VariantTemplate
  categories: TemplateCategory[]
  onClose: () => void
  onSaved: () => void
}

const emptyChar = (position: number, combines: boolean): Characteristic => ({ position, name: '', type: 'LIST', options: [], combines })

/**
 * Crear o editar una plantilla en una sola columna sencilla: (ejemplo para empezar) → nombre → "¿qué cambia entre variantes?"
 * → vista previa. Precio automático y categorías van en "Opciones avanzadas", cerradas por defecto.
 */
const ModalTemplate: React.FC<Props> = ({ companyId, template, categories, onClose, onSaved }) => {
  const editing = !!template
  const locked = editing && (template!.itemsCount ?? 0) > 0
  const [started, setStarted] = useState(editing)
  const [name, setName] = useState(template?.name ?? '')
  // Una sola lista en pantalla; al guardar se separa en ejes (crean variantes) y datos del artículo (no se combinan)
  const [chars, setChars] = useState<Characteristic[]>(() =>
    template
      ? [
          ...template.axes.map((a) => ({ ...a, options: [...a.options], combines: true, touched: true, saved: true })),
          ...(template.fields ?? []).map((f, i) => fieldToChar(f, template.axes.length + i + 1)),
        ]
      : [emptyChar(1, true)],
  )
  const axes = chars.filter((c) => c.combines)
  const fields = chars.filter((c) => !c.combines)
  const initialCats = useMemo(() => (template ? categories.filter((c) => c.variantTemplateId === template.id).map((c) => c.id) : []), [template, categories])
  const [cats, setCats] = useState<number[]>(initialCats)
  const [formula, setFormula] = useState<FormulaToken[]>(template?.priceFormula ?? [])
  const [saving, setSaving] = useState(false)
  // Para saber si al guardar cambió cómo se calcula el precio (fórmula o ajustes) y ofrecer recalcular los artículos
  const priceSignature = (f: FormulaToken[], list: { name: string; options: { value: string; adjust?: number; adjustType?: string }[] }[]) =>
    JSON.stringify([f, list.map((a) => [a.name, a.options.map((o) => [o.value, o.adjust ?? 0, o.adjustType ?? ''])])])
  const [initialPrice] = useState(() => priceSignature(template?.priceFormula ?? [], template?.axes ?? []))
  const [error, setError] = useState('')

  // Multiplicación en vivo: Talla (4) × Color (4) = 16, solo con las que crean variantes. Los datos del artículo van aparte
  const named = axes.filter((a) => a.name.trim() || a.options.length)
  const parts = named.map((a) => ({ label: a.name.trim(), count: a.options.length || (a.type === 'TEXT' || isNumericAxis(a) ? null : 0) }))
  const total = named.length && named.every((a) => a.options.length) ? named.reduce((n, a) => n * a.options.length, 1) : null
  const example = named.map((a) => displayValue(a, a.options[Math.min(1, a.options.length - 1)]?.value)).filter(Boolean).join(' / ')

  // La fórmula puede usar las características que crean variantes y los datos de Número / Medida (p. ej. Ancho y Alto solo para el precio)
  const formulaChars = useMemo(() => [...axes, ...formulaFieldAxes(fields)], [axes, fields])
  const setMode = (i: number, mode: 'variant' | 'data' | 'price') =>
    setChars((list) => list.map((x, j) => (j === i ? { ...x, combines: mode === 'variant', forPrice: mode === 'price', touched: true } : x)))
  // Al poner en la fórmula una Medida / Número que crea variantes, se pasa sola a "solo para calcular el precio" (con Deshacer)
  const [switched, setSwitched] = useState<string[]>([])
  const key = (v: string) => v.trim().toLowerCase()
  const changeFormula = (next: FormulaToken[]) => {
    const before = new Set(formula.filter((t) => t.t === 'axis').map((t) => key((t as { name: string }).name)))
    const added = new Set(next.filter((t) => t.t === 'axis' && !before.has(key(t.name))).map((t) => key((t as { name: string }).name)))
    const moved = chars.filter((c) => c.combines && !(locked && c.saved) && isNumericAxis(c) && added.has(key(c.name))).map((c) => c.name)
    if (moved.length) {
      setChars((list) => list.map((c) => (moved.includes(c.name) ? { ...c, combines: false, forPrice: true, touched: true } : c)))
      setSwitched((cur) => Array.from(new Set([...cur, ...moved])))
    }
    setFormula(next)
  }
  const undoSwitch = () => {
    setChars((list) => list.map((c) => (switched.includes(c.name) ? { ...c, combines: true, forPrice: false } : c)))
    setSwitched([])
  }
  const usesInFormula = (name: string) => formula.some((t) => t.t === 'axis' && t.name.trim().toLowerCase() === name.trim().toLowerCase())

  const pickPreset = (p: TemplatePreset) => {
    setName(p.key === 'blank' ? '' : p.name)
    setChars([
      ...p.axes.map((a) => ({ ...a, options: [...a.options], combines: true, touched: true })),
      ...(p.fields ?? []).map((f, i) => fieldToChar(f, p.axes.length + i + 1)),
    ])
    setFormula(p.formula ?? formulaFromRule(p.priceRule, p.axes) ?? [])
    setStarted(true)
  }

  const save = async () => {
    if (!name.trim()) return setError('Ponle un nombre a la plantilla.')
    const unnamed = chars.findIndex((a) => !a.name.trim())
    if (unnamed >= 0) return setError(`Escribe el nombre de la característica ${unnamed + 1} (p. ej. Talla o Marca).`)
    const empty = chars.find((a) => (a.type === 'LIST' || a.type === 'COLOR') && !a.options.length)
    if (empty) return setError(`Agrega al menos una opción a "${empty.name}".`)
    const ruleError = formulaError(formula, formulaChars)
    if (ruleError) return setError(`Fórmula del precio: ${ruleError}`)
    setSaving(true)
    setError('')
    try {
      const body = {
        companyId,
        name: name.trim(),
        priceFormula: formula.length ? formula : null,
        axes: axes.map(({ combines, touched, saved, ...a }, i) => ({ ...a, position: i + 1 })),
        fields: fields.map(charToField),
      }
      const res: any = editing ? await APIs.updateVariantTemplate(template!.id, body) : await APIs.createVariantTemplate(body)
      const id = res?.data?.id ?? template?.id
      const catsChanged = cats.length !== initialCats.length || cats.some((c) => !initialCats.includes(c))
      if (id && catsChanged) await APIs.setVariantTemplateCategories(id, cats)
      showToast({ type: 'success', title: editing ? 'Plantilla guardada' : 'Plantilla creada', text: body.name })
      // Cambió el cálculo del precio y hay artículos que la usan: ofrecer recalcularlos (solo los de precio según la plantilla)
      if (editing && (template!.itemsCount ?? 0) > 0 && priceSignature(formula, axes) !== initialPrice) {
        await offerRecalc(template!.id, body.name, 'Cambiaste cómo se calcula el precio.')
      }
      onSaved()
    } catch (e) {
      setError(errorText(e, 'No se pudo guardar la plantilla.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='cash-ui__overlay template-modal__overlay' role='dialog' aria-modal='true' onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='template-modal'>
        {/* Solo el título arriba; el resumen va en el panel lateral */}
        <div className='template-modal__top'>
          <div className='template-modal__head'>
            <h2>{editing ? `Editar plantilla` : 'Nueva plantilla'}</h2>
            <button type='button' onClick={onClose} aria-label='Cerrar'>
              <span className='material-symbols-rounded'>close</span>
            </button>
          </div>
        </div>
        <div className='template-modal__body'>
          {!started ? (
            <>
              {/* Volver a ver ejemplos no borra nada: se puede regresar a lo que ya se había armado */}
              {name.trim() || chars.some((c) => c.name.trim()) ? (
                <button type='button' className='template-modal__resume' onClick={() => setStarted(true)}>
                  <span className='material-symbols-rounded' aria-hidden>undo</span> Volver a mi plantilla{name.trim() ? ` "${name.trim()}"` : ''}
                </button>
              ) : null}
              <TemplatePresets onPick={pickPreset} />
            </>
          ) : (
            <div className='template-modal__layout'>
            <div className='template-modal__main'>
              <label className='template-modal__name'>
                <span>Nombre de la plantilla</span>
                <input className='inputs__general' value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder='Ej. Ropa, Calzado, Vidrio' autoFocus={!editing} />
              </label>

              <div className='template-modal__axes-head'>
                <h3>Características</h3>
                <span
                  className='material-symbols-rounded template-modal__info'
                  title='Las que crean variantes se combinan entre sí (talla × color). Los datos se escriben una vez por artículo (marca). Las de precio solo sirven para la fórmula (ancho, alto).'
                  aria-label='Ayuda'
                >
                  info
                </span>
              </div>

              {locked ? (
                <p className='template-modal__note'>
                  <span className='material-symbols-rounded' aria-hidden>info</span>
                  En uso por {template!.itemsCount} artículo(s): las que crean variantes no se pueden cambiar.
                </p>
              ) : null}

              <div className='template-modal__axes'>
                {chars.map((a, i) => {
                  const fixed = locked && !!a.saved
                  return (
                    <AxisEditor
                      key={i}
                      axis={a}
                      index={a.combines ? axes.indexOf(a) : fields.indexOf(a)}
                      combines={a.combines}
                      combinesLock={
                        fixed ? 'Hay artículos con variantes de esta plantilla' : locked && !a.combines ? 'Hay artículos que usan la plantilla: aquí solo puedes agregar datos' : !a.combines && axes.length >= MAX_AXES ? `Ya hay ${MAX_AXES} que crean variantes` : undefined
                      }
                      onCombines={(combines) => setMode(i, combines ? 'variant' : 'data')}
                      forPrice={!!a.forPrice}
                      onForPrice={() => setMode(i, 'price')}
                      inFormula={usesInFormula(a.name)}
                      locked={fixed}
                      canRemove={chars.length > 1 || !locked}
                      onChange={(next) =>
                        setChars((list) =>
                          list.map((x, j) => {
                            if (j !== i) return x
                            // Mientras no se elija a mano, "¿crea variantes?" sigue al tipo (texto libre = solo un dato)
                            const auto = !x.touched && next.type !== x.type
                            // Una Medida nueva con fórmula ya armada: por defecto es "solo para calcular el precio"
                            const measureForPrice = auto && next.type === 'MEASURE' && formula.length > 0
                            const combines = measureForPrice ? false : auto ? defaultCombines(next.type) && (x.combines || list.filter((c) => c.combines).length < MAX_AXES) : x.combines
                            // Si cambia el nombre, la fórmula sigue apuntando a la misma característica
                            if (next.name !== x.name && x.name.trim()) {
                              setFormula((f) => f.map((t) => (t.t === 'axis' && t.name.trim().toLowerCase() === x.name.trim().toLowerCase() ? { ...t, name: next.name } : t)))
                            }
                            // "Solo para el precio" es solo para Número y Medida
                            return { ...x, ...next, combines, forPrice: measureForPrice || (x.forPrice && isNumericAxis(next)) }
                          }),
                        )
                      }
                      onRemove={() => setChars((list) => list.filter((_, j) => j !== i))}
                    />
                  )
                })}
              </div>
              {chars.length < MAX_AXES + MAX_FIELDS ? (
                <button
                  type='button'
                  className='template-modal__add'
                  onClick={() => setChars((list) => [...list, emptyChar(list.length + 1, !locked && list.filter((c) => c.combines).length < MAX_AXES)])}
                >
                  <span className='material-symbols-rounded' aria-hidden>add</span> Agregar característica
                </button>
              ) : null}

            </div>

            {/* Panel lateral fijo: resumen, precio y categorías */}
            <aside className='template-modal__side'>
              <TemplatePreview
              variant='card'
              parts={parts}
              fields={fields.filter((f) => !f.forPrice).map((f) => f.name.trim()).filter(Boolean)}
              total={total}
              example={example}
              emptyText={named.some((a) => a.type === 'TEXT' || isNumericAxis(a)) && named.every((a) => a.options.length || a.type === 'TEXT' || isNumericAxis(a)) ? 'Los valores libres se eligen en cada artículo' : 'Agrega valores para ver las variantes'}
            />
              <AdvancedOptions
                axes={formulaChars}
                formula={formula}
                onFormula={changeFormula}
                formulaNotice={
                  switched.length ? (
                    <p className='template-modal__switched'>
                      <span className='material-symbols-rounded' aria-hidden>calculate</span>
                      {switched.join(' y ')} se {switched.length > 1 ? 'cambiaron' : 'cambió'} a "solo para calcular el precio" ({switched.length > 1 ? 'no crean' : 'no crea'} variantes).
                      <button type='button' onClick={undoSwitch}>Deshacer</button>
                    </p>
                  ) : null
                }
                categories={categories}
                selectedCats={cats}
                onCats={setCats}
                templateId={template?.id}
              />

              {error ? <p className='template-modal__error' role='alert'>{error}</p> : null}
            </aside>
            </div>
          )}

          <div className='template-modal__actions'>
            {started && !editing ? (
              <button type='button' className='template-modal__back' onClick={() => setStarted(false)}>
                <span className='material-symbols-rounded' aria-hidden>arrow_back</span> Ver ejemplos
              </button>
            ) : null}
            <button type='button' className='btn__general-secondary' onClick={onClose}>Cancelar</button>
            {started ? (
              <button type='button' className='btn__general-purple' onClick={save} disabled={saving}>{saving ? 'Guardando…' : editing ? 'Guardar' : 'Crear plantilla'}</button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalTemplate
