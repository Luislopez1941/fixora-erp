import React, { useState } from 'react'
import { FormulaToken, TemplateAxis, TemplateCategory } from '../../variantTypes'
import FormulaBuilder from '../formula-builder/FormulaBuilder'
import './AdvancedOptions.css'

interface Props {
  axes: TemplateAxis[]
  formula: FormulaToken[]
  onFormula: (f: FormulaToken[]) => void
  /** Aviso bajo la fórmula (p. ej. "Ancho se cambió a solo para calcular el precio · Deshacer") */
  formulaNotice?: React.ReactNode
  categories: TemplateCategory[]
  selectedCats: number[]
  onCats: (ids: number[]) => void
  templateId?: number
}

/**
 * Panel lateral de la plantilla: fórmula del precio (cerrada en una línea con "Editar") y categorías que la sugieren
 * (cerradas con un resumen). Sin textos largos.
 */
const AdvancedOptions: React.FC<Props> = ({ axes, formula, onFormula, formulaNotice, categories, selectedCats, onCats, templateId }) => {
  const [catsOpen, setCatsOpen] = useState(false)
  const [catSearch, setCatSearch] = useState('')
  const filtered = categories.filter((c) => !catSearch.trim() || c.title.toLowerCase().includes(catSearch.trim().toLowerCase()))
  const chosen = categories.filter((c) => selectedCats.includes(c.id)).map((c) => c.title)

  return (
    <section className='advanced'>
      <div className='advanced__block'>
        <h4>
          <span className='material-symbols-rounded' aria-hidden>calculate</span> Precio
        </h4>
        <FormulaBuilder axes={axes} formula={formula} onChange={onFormula} />
        {formulaNotice}
      </div>

      <div className='advanced__block'>
        <button type='button' className='advanced__toggle' aria-expanded={catsOpen} onClick={() => setCatsOpen((o) => !o)}>
          <h4>
            <span className='material-symbols-rounded' aria-hidden>category</span> Categorías
          </h4>
          <small>{chosen.length ? chosen.slice(0, 2).join(', ') + (chosen.length > 2 ? ` +${chosen.length - 2}` : '') : 'Ninguna'}</small>
          <span className='material-symbols-rounded advanced__chev' aria-hidden>{catsOpen ? 'expand_less' : 'expand_more'}</span>
        </button>
        {catsOpen ? (
          <>
            <small className='advanced__note'>Se sugiere al crear artículos de estas categorías.</small>
            {categories.length > 8 ? (
              <input className='inputs__general advanced__search' value={catSearch} onChange={(e) => setCatSearch(e.target.value)} placeholder='Buscar categoría' aria-label='Buscar categoría' />
            ) : null}
            <div className='advanced__cats'>
              {filtered.slice(0, 80).map((c) => {
                const on = selectedCats.includes(c.id)
                const other = c.variantTemplateId && c.variantTemplateId !== templateId
                return (
                  <button key={c.id} type='button' aria-pressed={on} className={on ? 'is-on' : ''} onClick={() => onCats(on ? selectedCats.filter((x) => x !== c.id) : [...selectedCats, c.id])}>
                    {on ? <span className='material-symbols-rounded' aria-hidden>check</span> : null}
                    {c.title}
                    {other && !on ? <small>· tiene otra</small> : null}
                  </button>
                )
              })}
              {!filtered.length ? <small className='advanced__note'>No hay categorías.</small> : null}
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}

export default AdvancedOptions
