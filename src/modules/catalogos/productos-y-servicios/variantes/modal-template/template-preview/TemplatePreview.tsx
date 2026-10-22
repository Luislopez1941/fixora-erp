import React from 'react'
import './TemplatePreview.css'

export interface PreviewPart {
  label: string
  /** Cuántos valores tiene; null = valores libres que se eligen en cada artículo */
  count: number | null
}

interface Props {
  parts: PreviewPart[]
  /** Datos del artículo que no se combinan (Marca, Material…): se listan aparte */
  fields?: string[]
  /** Total de variantes; null si aún no se puede calcular */
  total: number | null
  example?: string
  /** Nota corta a la derecha del ejemplo (p. ej. "precio por m²") */
  note?: string
  emptyText?: string
  /** Fórmula del precio en texto ("(Precio × Ancho × Alto) ÷ Piezas"): va en su propia línea para no confundirla con el conteo */
  price?: string
  /** Debajo de la fórmula: qué se escribe en cada artículo y un ejemplo con números */
  priceNote?: string
  /** bar = barra fija arriba (asistente del artículo); card = tarjeta del panel lateral */
  variant?: 'bar' | 'card'
}

/**
 * Barra fija arriba con la multiplicación en vivo: [Talla 4] × [Color 4] = 16 variantes, y un ejemplo debajo.
 * Con una sola característica no hay multiplicación: [Talla 4] … 4 variantes. Los datos del artículo van en su propia línea.
 * La usan el modal de plantilla y el asistente de variantes del artículo.
 */
const TemplatePreview: React.FC<Props> = ({ parts, fields = [], total, example, note, price, priceNote, variant = 'bar', emptyText = 'Agrega valores para ver las variantes' }) => {
  const ready = parts.length > 0 && total != null && total > 0
  return (
    <div className={`variants-counter variants-counter--${variant} ${ready ? '' : 'is-empty'}`} aria-live='polite'>
      {variant === 'card' ? <span className='variants-counter__title'>Resumen</span> : null}
      <div className='variants-counter__math'>
        {/* Esta fila solo cuenta cuántas variantes salen; el precio va en su línea */}
        {parts.length ? <span className='variants-counter__label'>{parts.length > 1 ? 'Cada combinación es una variante:' : 'Variantes que se crean:'}</span> : null}
        {parts.length ? (
          parts.map((p, i) => (
            <React.Fragment key={`${p.label}-${i}`}>
              {/* Sin ×: ese símbolo es solo de la fórmula del precio */}
              {i ? <span className='variants-counter__sep'>{i === parts.length - 1 ? 'y' : '·'}</span> : null}
              <span className='variants-counter__chip'>
                {p.label || `Característica ${i + 1}`} <b>{p.count ?? '…'}</b>
              </span>
            </React.Fragment>
          ))
        ) : fields.length || price ? (
          <span className='variants-counter__single'>
            <span className='material-symbols-rounded' aria-hidden>inventory_2</span>
            Un solo artículo, sin variantes
          </span>
        ) : (
          <span className='variants-counter__hint'>Agrega características (talla, color, marca…)</span>
        )}
        {ready ? (
          <>
            <span className='variants-counter__op' aria-hidden>→</span>
            {/* key = total: la animación se repite cada vez que cambia el número */}
            <span className='variants-counter__total' key={total}>
              {total.toLocaleString('es-MX')} <small>{total === 1 ? 'variante' : 'variantes'}</small>
            </span>
          </>
        ) : null}
      </div>
      {parts.length ? (
        <small className='variants-counter__example'>
          {ready ? (
            <>
              {example ? <>Ejemplo: <b>{example}</b></> : null}
              {note ? <>{example ? ' · ' : ''}{note}</> : null}
            </>
          ) : (
            emptyText
          )}
        </small>
      ) : null}
      {price ? (
        <small className='variants-counter__price'>
          <span className='material-symbols-rounded' aria-hidden>calculate</span>
          {parts.length ? 'Precio de cada variante' : 'Precio'} = <b>{price}</b>
          {priceNote ? <em>· {priceNote}</em> : null}
        </small>
      ) : null}
      {fields.length ? (
        <small className='variants-counter__fields'>
          <span className='material-symbols-rounded' aria-hidden>description</span>
          Datos del artículo: <b>{fields.join(', ')}</b> <em>(no se combinan)</em>
        </small>
      ) : null}
    </div>
  )
}

export default TemplatePreview
