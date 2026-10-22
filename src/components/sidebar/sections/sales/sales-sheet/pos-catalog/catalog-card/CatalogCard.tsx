import React from 'react'
import './CatalogCard.css'

export interface CatalogItem {
  id: number
  code: string | null
  name: string
  type: 'ARTICLE' | 'SERVICE'
  image: string | null
  price: number
  discountPercent: number
  trackInventory: boolean
  stock: number
  stockStatus: 'disponible' | 'stock_bajo' | 'agotado' | 'sin_rastreo'
  variations: number
  measured: boolean
  components: number
}

interface Props {
  item: CatalogItem
  adding: boolean
  onAdd: (item: CatalogItem) => void
}

const money = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n)

/** Existencia de la tarjeta: piezas disponibles, agotado, bajo pedido o nada (servicio). */
const stockLabel = (item: CatalogItem): { text: string; tone: 'ok' | 'low' | 'out' | 'muted' } | null => {
  if (item.type === 'SERVICE') return null
  if (!item.trackInventory) return { text: 'Bajo pedido', tone: 'muted' }
  if (item.stock <= 0) return { text: 'Agotado', tone: 'out' }
  const n = Number.isInteger(item.stock) ? item.stock : item.stock.toFixed(2)
  return { text: `${n} disp.`, tone: item.stockStatus === 'stock_bajo' ? 'low' : 'ok' }
}

/** Tarjeta de un artículo del catálogo con su botón "Agregar a la ficha". */
const CatalogCard: React.FC<Props> = ({ item, adding, onAdd }) => {
  const stock = stockLabel(item)
  const net = item.discountPercent > 0 ? item.price * (1 - item.discountPercent / 100) : item.price
  return (
    <article className='catalog-card'>
      <div className='catalog-card__media'>
        <span className='catalog-card__frame'>
          {item.image ? (
            <img src={item.image} alt='' loading='lazy' decoding='async' />
          ) : (
            <span className='material-symbols-rounded catalog-card__placeholder' aria-hidden>
              {item.type === 'SERVICE' ? 'design_services' : 'inventory_2'}
            </span>
          )}
        </span>
        {item.discountPercent > 0 ? <span className='catalog-card__discount'>−{item.discountPercent}%</span> : null}
      </div>
      <div className='catalog-card__body'>
        <span className='catalog-card__code'>{item.code || 'Sin código'}</span>
        <h3 className='catalog-card__name' title={item.name}>{item.name}</h3>
        <div className='catalog-card__chips'>
          {item.type === 'SERVICE' ? <span className='catalog-card__chip is-service'>Servicio</span> : null}
          {item.variations > 0 ? <span className='catalog-card__chip'>{item.variations} variantes</span> : null}
          {item.measured ? <span className='catalog-card__chip'>Medida</span> : null}
          {item.components > 0 ? <span className='catalog-card__chip'>Con insumos</span> : null}
        </div>
        <div className='catalog-card__foot'>
          <span className='catalog-card__price'>
            {item.discountPercent > 0 ? <s>{money(item.price)}</s> : null}
            <strong>{money(net)}</strong>
          </span>
          {stock ? <span className={`catalog-card__stock is-${stock.tone}`}>{stock.text}</span> : null}
        </div>
        <button type='button' className='catalog-card__add' onClick={() => onAdd(item)} disabled={adding}>
          <span className='material-symbols-rounded' aria-hidden>{adding ? 'progress_activity' : 'add_shopping_cart'}</span>
          {adding ? 'Agregando…' : 'Agregar a la ficha'}
        </button>
      </div>
    </article>
  )
}

export default CatalogCard
