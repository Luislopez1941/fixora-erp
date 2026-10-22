import React from 'react'
import { STATUS_CLASS, STATUS_LABEL, StockStatus, qty } from '../inventoryStatus'
import './InventoryRow.css'

interface Props {
  item: any
  onOpen: (item: any) => void
}

/** Un artículo de la lista: fila en escritorio, tarjeta compacta en celular. El ojo abre la ficha completa. */
const InventoryRow: React.FC<Props> = ({ item, onOpen }) => {
  const status = (item.status ?? 'sin_rastreo') as StockStatus
  // Resumen precalculado al guardar el artículo ("4 tallas · 2 colores"); vacío en artículos simples
  const count = item.hasVariations ? (item.variations ?? []).length : 0
  const base = item.variationSummary || (count ? `${count} variación${count === 1 ? '' : 'es'}` : '')
  const sizesText = base
    ? `${base}${item.outOfStockCount > 0 ? ` · ${item.outOfStockCount} agotadas` : ''}${item.lowStockCount > 0 ? ` · ${item.lowStockCount} bajas` : ''}`
    : ''

  return (
    <div className='inventory-list__row inventory-row' role='button' tabIndex={0} onClick={() => onOpen(item)} onKeyDown={(e) => e.key === 'Enter' && onOpen(item)}>
      <div className='inventory-list__cell inventory-row__code' data-label='Código'>
        {item.code ? <span className='inventory-list__tag'>{item.code}</span> : '—'}
      </div>
      <div className='inventory-list__cell inventory-row__name'>
        {item.image ? (
          <img className='inventory-row__thumb' src={item.image} alt='' loading='lazy' />
        ) : (
          <span className='inventory-row__thumb inventory-row__thumb--empty material-symbols-rounded' aria-hidden>inventory_2</span>
        )}
        <span className='inventory-row__title'>
          <strong>{item.name}</strong>
          {item.category?.title ? <small>{item.category.title}</small> : null}
        </span>
      </div>
      <div className='inventory-list__cell inventory-row__stock'>
        <b>{item.trackInventory ? qty(item.totalStock) : '—'}</b>
        <small>{item.trackInventory ? 'en existencia' : 'sin rastreo'}</small>
      </div>
      <div className='inventory-list__cell inventory-row__status'>
        <span className={`inventory-list__status ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
      </div>
      <div className='inventory-list__cell inventory-list__cell--muted inventory-row__sizes'>{sizesText || <span className='inventory-row__dash'>—</span>}</div>
      {/* Solo celular: código, estado y variantes como chips bajo el nombre */}
      <div className='inventory-row__chips'>
        {item.code ? <span className='inventory-list__tag'>{item.code}</span> : null}
        <span className={`inventory-list__status ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
        {sizesText ? <span className='inventory-row__size-chip'>{sizesText}</span> : null}
      </div>
      <div className='inventory-row__actions'>
        <button
          type='button'
          className='inventory-row__eye'
          onClick={(e) => {
            e.stopPropagation()
            onOpen(item)
          }}
          aria-label={`Ver artículo ${item.name}`}
          title='Ver artículo'
        >
          <span className='material-symbols-rounded'>visibility</span>
        </button>
      </div>
    </div>
  )
}

// Las filas solo se vuelven a dibujar si cambia su artículo
export default React.memo(InventoryRow, (a, b) => a.item === b.item && a.onOpen === b.onOpen)
