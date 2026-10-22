import React from 'react'
import { TemplateAxis, displayValue, sameValue } from '../../../../../../../modules/catalogos/productos-y-servicios/variantes/variantTypes'
import { VariantRow, labelOf, optionOf } from '../variantRows'
import './VariantRowItem.css'

interface Props {
  row: VariantRow
  index: number
  axes: TemplateAxis[]
  basePrice: string
  onPatch: (index: number, patch: Partial<VariantRow>) => void
  onImage: (index: number, file?: File) => void
  onRemove: (index: number) => void
}

/** Una fila de la tabla de variantes (memorizada: escribir en una fila no vuelve a pintar las demás). */
const VariantRowItem: React.FC<Props> = ({ row: r, index: i, axes, basePrice, onPatch, onImage, onRemove }) => (
  <div className='variant-row' role='row'>
    <label className='variant-row__img' title='Imagen de la variante'>
      {r.images[0] ? <img src={r.images[0]} alt='' /> : <span className='material-symbols-rounded' aria-hidden>add_photo_alternate</span>}
      <input type='file' accept='image/*' onChange={(e) => onImage(i, e.target.files?.[0])} aria-label={`Imagen de ${labelOf(r)}`} />
    </label>
    <span className='variant-row__label'>
      {axes.map((a) => {
        const v = optionOf(r, a.position)
        const hex = a.type === 'COLOR' ? a.options.find((o) => sameValue(o.value, v))?.hex : undefined
        return v ? (
          <em key={a.position}>
            {hex ? <i style={{ background: hex }} aria-hidden /> : null}
            {displayValue(a, v)}
          </em>
        ) : null
      })}
    </span>
    <input className='inputs__general' value={r.sku} placeholder='SKU' onChange={(e) => onPatch(i, { sku: e.target.value })} aria-label={`SKU de ${labelOf(r)}`} />
    <input className='inputs__general' value={r.barcode} inputMode='numeric' placeholder='Código de barras' onChange={(e) => onPatch(i, { barcode: e.target.value })} aria-label={`Código de barras de ${labelOf(r)}`} />
    <span className={`variant-row__price ${r.manual ? 'is-manual' : ''}`}>
      <input
        className='inputs__general'
        value={r.price}
        type='number'
        min={0}
        step='0.01'
        placeholder={basePrice ? `$${basePrice}` : 'Precio'}
        onChange={(e) => onPatch(i, { price: e.target.value, manual: true })}
        aria-label={`Precio de ${labelOf(r)}`}
      />
      {r.manual ? (
        <em title='Cambiado a mano: no se recalcula solo'>
          <span className='material-symbols-rounded' aria-hidden>pan_tool</span> a mano
        </em>
      ) : null}
    </span>
    <button type='button' className='variant-row__remove' onClick={() => onRemove(i)} aria-label={`Quitar ${labelOf(r)}`} title='No vender esta combinación'>
      <span className='material-symbols-rounded'>delete</span>
    </button>
  </div>
)

export default React.memo(VariantRowItem)
