import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import {
  PRICE_BASE_KEY,
  VariantTemplate,
  errorText,
  formulaText,
  hasAdjusts,
  money,
  variantPrice,
  withFieldInputs,
} from '../../../../../../modules/catalogos/productos-y-servicios/variantes/variantTypes'
import { TemplatesData, loadTemplates } from '../variant-matrix/templatesCache'
import { VariantRow, remapRows } from '../variant-matrix/variantRows'
import VariantMatrix from '../variant-matrix/VariantMatrix'
import ItemFields, { AttributeValue, Attributes } from '../variant-matrix/item-fields/ItemFields'
import PriceMode, { PriceModeValue } from '../variant-matrix/price-mode/PriceMode'
import '../../../../../general/skeleton/TableSkeleton.css'
import './VariantTemplateSection.css'

interface Props {
  companyId: number | null
  categoryId: number | null
  templateId: number | null
  onTemplate: (id: number | null) => void
  rows: VariantRow[]
  onRows: (rows: VariantRow[]) => void
  attributes: Attributes
  onAttributes: (update: (a: Attributes) => Attributes) => void
  /** null = artículo nuevo: según la plantilla si la plantilla calcula precios */
  priceMode: PriceModeValue | null
  onPriceMode: (mode: PriceModeValue) => void
  /** Precio del artículo (base de las variantes) */
  basePrice: string
  baseSku: string
  /** Sin variantes y precio según la plantilla: precio de venta calculado (o null si no aplica / faltan datos) */
  onSalePrice: (price: number | null) => void
}

const describe = (t: VariantTemplate) =>
  [
    ...t.axes.map((a) => a.name),
    ...(t.fields ?? []).map((f) => `${f.name} (${f.price ? 'precio' : 'dato'})`),
  ].join(' · ') || 'Sin características'

/**
 * Plantilla de variantes del artículo, dentro del mismo modal: el select (sugerido por la categoría) y debajo, en tarjetas,
 * sus datos, las medidas para el precio, las variantes (se arman solas) y si el precio lo pone la plantilla o es manual.
 */
const VariantTemplateSection: React.FC<Props> = ({
  companyId,
  categoryId,
  templateId,
  onTemplate,
  rows,
  onRows,
  attributes,
  onAttributes,
  priceMode,
  onPriceMode,
  basePrice,
  baseSku,
  onSalePrice,
}) => {
  const [data, setData] = useState<TemplatesData | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [suggested, setSuggested] = useState(false)
  // El usuario ya eligió a mano: la categoría deja de sugerir
  const picked = useRef(templateId != null || rows.length > 0)

  useEffect(() => {
    let alive = true
    setData(null)
    loadTemplates(companyId)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(errorText(e, 'No se pudieron cargar las plantillas.')))
    return () => {
      alive = false
    }
  }, [companyId])

  // Sugerencia de la categoría (solo si no hay plantilla elegida ni variantes)
  useEffect(() => {
    if (!data || picked.current || !categoryId) return
    const cat = data.categories.find((c) => c.id === categoryId)
    const sug = cat?.variantTemplateId && data.templates.find((t) => t.id === cat.variantTemplateId && t.active)
    if (sug && sug.id !== templateId) {
      onTemplate(sug.id)
      setSuggested(true)
    } else if (!sug && suggested) {
      onTemplate(null)
      setSuggested(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, categoryId])

  const template = data?.templates.find((t) => t.id === templateId) ?? null
  const options = useMemo(
    () => (data?.templates ?? []).filter((t) => (t.active || t.id === templateId) && (t.axes.length || t.fields?.length)),
    [data, templateId],
  )
  const shown = search.trim() ? options.filter((t) => t.name.toLowerCase().includes(search.trim().toLowerCase())) : options

  const choose = async (id: number | null) => {
    if (id === templateId) return
    picked.current = true
    const next = options.find((t) => t.id === id) ?? null
    if (rows.length) {
      const remapped = next && template ? remapRows(rows, template.axes, next.axes) : []
      const lost = rows.length - remapped.length
      const ok = await Swal.fire({
        title: '¿Cambiar de plantilla?',
        html: lost
          ? `Se conservan <b>${remapped.length}</b> variantes que coinciden y <b>${lost}</b> se quitarán al guardar (las que tengan ventas o existencias se desactivan, no se borran).`
          : `Las <b>${remapped.length}</b> variantes se pasan a la nueva plantilla.`,
        showCancelButton: true,
        confirmButtonText: 'Cambiar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#072a57',
      })
      if (!ok.isConfirmed) return
      onRows(remapped)
    }
    setSuggested(false)
    onTemplate(id)
  }

  const fields = template?.fields ?? []
  const dataFields = fields.filter((f) => !f.price)
  const priceFields = fields.filter((f) => f.price)
  const formula = template?.priceFormula ?? null
  const calculates = !!template && (!!formula?.length || template.axes.some(hasAdjusts))
  const mode: PriceModeValue = priceMode ?? 'TEMPLATE'
  const auto = calculates && mode === 'TEMPLATE'
  const simpleFormula = auto && !!template && !template.axes.length && !!formula?.length

  const setAttr = (name: string, value: AttributeValue | null) =>
    onAttributes((a) => {
      const next = { ...a }
      if (value == null) delete next[name]
      else next[name] = value
      return next
    })

  // Sin variantes y con fórmula: el precio que usa la fórmula (por m²…) queda en la ficha como "Precio base"
  useEffect(() => {
    if (simpleFormula && (attributes[PRICE_BASE_KEY] == null || attributes[PRICE_BASE_KEY] === '') && basePrice.trim() !== '') {
      setAttr(PRICE_BASE_KEY, Number(basePrice))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simpleFormula])
  const simple = useMemo(() => {
    if (!simpleFormula) return null
    const raw = attributes[PRICE_BASE_KEY]
    const b = Number(String(raw ?? '').replace(',', '.'))
    if (raw == null || String(raw).trim() === '' || !Number.isFinite(b)) return { error: 'Escribe el precio base.' }
    const inputs = withFieldInputs([], {}, fields, attributes)
    try {
      const result = variantPrice(formula, inputs.axes, inputs.values, b)
      if (result == null) return { error: `Escribe ${priceFields.map((f) => f.name.toLowerCase()).join(' y ') || 'las medidas'}.` }
      return { result, text: formulaText(formula, { base: b, adj: 0, axes: inputs.axes, values: inputs.values }) }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'No se pudo calcular.' }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simpleFormula, attributes, formula, template?.id])
  const salePrice = simple && 'result' in simple ? simple.result! : null
  useEffect(() => {
    onSalePrice(simpleFormula ? salePrice : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simpleFormula, salePrice])

  return (
    <section className='variant-section'>
      <div className='variant-section__pick'>
        <label className='variant-section__label' htmlFor='variant-template-select'>
          Plantilla
        </label>
        {!data && !error ? (
          <span className='table-skeleton__shimmer variant-section__skeleton' />
        ) : (
          <div className='variant-section__select'>
            {options.length > 8 ? (
              <input className='inputs__general' value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Buscar plantilla' aria-label='Buscar plantilla' />
            ) : null}
            <select id='variant-template-select' className='inputs__general' value={templateId ?? ''} onChange={(e) => choose(e.target.value ? Number(e.target.value) : null)}>
              <option value=''>Sin variantes</option>
              {shown.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
              {template && !shown.includes(template) ? <option value={template.id}>{template.name}</option> : null}
            </select>
          </div>
        )}
        <Link className='variant-section__manage' to='/auth/catalogos/productos-y-servicios/variantes' target='_blank' rel='noreferrer'>
          Administrar plantillas <span className='material-symbols-rounded' aria-hidden>open_in_new</span>
        </Link>
      </div>
      {error ? <p className='variant-section__error'>{error}</p> : null}
      {template ? (
        <p className='variant-section__summary'>
          {describe(template)}
          {suggested ? <em> · Sugerida por la categoría</em> : null}
        </p>
      ) : null}

      {template && dataFields.length ? (
        <div className='variant-section__card'>
          <h4>Datos del artículo</h4>
          <ItemFields fields={dataFields} values={attributes} onChange={setAttr} />
        </div>
      ) : null}

      {template && (priceFields.length || simpleFormula) ? (
        <div className='variant-section__card'>
          <h4>Medidas para el precio</h4>
          {priceFields.length ? <ItemFields fields={priceFields} values={attributes} onChange={setAttr} /> : null}
          {simpleFormula ? (
            <div className='variant-section__sale'>
              <label>
                <span>Precio base</span>
                <input
                  className='inputs__general'
                  value={attributes[PRICE_BASE_KEY] == null ? '' : String(attributes[PRICE_BASE_KEY])}
                  inputMode='decimal'
                  onChange={(e) => setAttr(PRICE_BASE_KEY, e.target.value.trim() === '' ? null : e.target.value)}
                  aria-label='Precio base'
                />
              </label>
              <p className={simple && 'error' in simple ? 'is-bad' : ''}>
                <span className='material-symbols-rounded' aria-hidden>calculate</span>
                {simple && 'result' in simple ? (
                  <>
                    {simple.text} = <b>{money(simple.result!)}</b>
                  </>
                ) : (
                  simple?.error
                )}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {template && template.axes.length ? (
        <div className='variant-section__card'>
          <h4>Variantes</h4>
          <VariantMatrix key={template.id} template={template} rows={rows} onRows={onRows} baseSku={baseSku} basePrice={basePrice} attributes={attributes} auto={auto} />
        </div>
      ) : null}

      {calculates ? (
        <div className='variant-section__card'>
          <PriceMode value={mode} onChange={onPriceMode} how={formula?.length ? formulaText(formula) : 'ajustes por valor'} />
        </div>
      ) : null}
    </section>
  )
}

export default VariantTemplateSection
