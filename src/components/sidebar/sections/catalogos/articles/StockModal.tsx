import React, { useEffect, useMemo, useState } from 'react'
import APIs from '../../../../../services/APIs'
import './StockModal.css'

type StockStatus = 'disponible' | 'stock_bajo' | 'agotado' | 'sin_rastreo'

const STATUS_LABEL: Record<StockStatus, string> = {
  disponible: 'En stock',
  stock_bajo: 'Stock bajo',
  agotado: 'Desabasto',
  sin_rastreo: 'Sin rastreo',
}

const STATUS_CLASS: Record<StockStatus, string> = {
  disponible: 'article-stock-status--ok',
  stock_bajo: 'article-stock-status--low',
  agotado: 'article-stock-status--out',
  sin_rastreo: 'article-stock-status--none',
}

interface StockModalProps {
  isOpen: boolean
  onClose: () => void
  itemId: number | null
  itemName?: string
  itemCode?: string
}

const StockModal: React.FC<StockModalProps> = ({
  isOpen,
  onClose,
  itemId,
  itemName,
  itemCode,
}) => {
  const [loading, setLoading] = useState(false)
  const [stockData, setStockData] = useState<any>(null)
  const [error, setError] = useState('')
  const [expandedStoreId, setExpandedStoreId] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen || !itemId) {
      setStockData(null)
      setError('')
      setExpandedStoreId(null)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const response: any = await APIs.getItemStockByStores(itemId)
        if (!cancelled) {
          const data = response?.data ?? null
          setStockData(data)
          const firstStoreId = data?.stores?.[0]?.storeId ?? null
          setExpandedStoreId(firstStoreId)
        }
      } catch (err) {
        console.error('Error loading stock:', err)
        if (!cancelled) {
          setStockData(null)
          setError('No se pudo cargar las existencias del artículo.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isOpen, itemId])

  const stores = stockData?.stores ?? []

  const summary = useMemo(() => {
    let outCount = 0
    let lowCount = 0
    let variationCount = 0

    for (const store of stores) {
      for (const variation of store.variations ?? []) {
        variationCount += 1
        const status = (variation.status ?? 'agotado') as StockStatus
        if (status === 'agotado') outCount += 1
        if (status === 'stock_bajo') lowCount += 1
      }
    }

    return {
      storeCount: stores.length,
      outCount,
      lowCount,
      variationCount,
    }
  }, [stores])

  if (!isOpen) return null

  const displayName = stockData?.name ?? itemName ?? 'Artículo'
  const displayCode = stockData?.code ?? itemCode ?? ''

  return (
    <div className='article-stock-modal-overlay' onClick={onClose}>
      <div
        className='article-stock-modal-content'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='article-stock-modal-header'>
          <div className='article-stock-modal-header__info'>
            <span className='article-stock-modal-eyebrow'>Ficha de existencias</span>
            <h2>{displayName}</h2>
            {displayCode ? (
              <p className='article-stock-modal-subtitle'>Código {displayCode}</p>
            ) : null}
          </div>
          <button type='button' className='article-stock-modal-close' onClick={onClose}>
            ×
          </button>
        </div>

        <div className='article-stock-modal-body'>
          {loading ? (
            <div className='article-stock-modal-state'>
              <span className='article-stock-modal-spinner' />
              <p>Cargando existencias...</p>
            </div>
          ) : error ? (
            <div className='article-stock-modal-state'>
              <p>{error}</p>
            </div>
          ) : !stockData?.trackInventory ? (
            <div className='article-stock-modal-state'>
              <p>Este artículo no tiene rastreo de inventario activado.</p>
            </div>
          ) : stores.length === 0 ? (
            <div className='article-stock-modal-state'>
              <p>No hay existencias registradas en ningún almacén.</p>
            </div>
          ) : (
            <>
              <div className='article-stock-modal-summary'>
                <div className='article-stock-modal-summary-card'>
                  <span>Total general</span>
                  <strong>{stockData.totalStock ?? 0}</strong>
                  <small>pzas</small>
                </div>
                <div className='article-stock-modal-summary-card'>
                  <span>Almacenes</span>
                  <strong>{summary.storeCount}</strong>
                </div>
                <div className='article-stock-modal-summary-card article-stock-modal-summary-card--low'>
                  <span>Stock bajo</span>
                  <strong>{summary.lowCount}</strong>
                </div>
                <div className='article-stock-modal-summary-card article-stock-modal-summary-card--out'>
                  <span>Agotadas</span>
                  <strong>{summary.outCount}</strong>
                </div>
              </div>

              <div className='article-stock-modal-stores'>
                {stores.map((store: any) => {
                  const status = (store.status ?? 'disponible') as StockStatus
                  const isExpanded = expandedStoreId === store.storeId
                  const hasSizes =
                    store.usesSizes && (store.variations?.length ?? 0) > 0

                  return (
                    <section
                      className={`article-stock-store ${isExpanded ? 'article-stock-store--open' : ''}`}
                      key={store.storeId}
                    >
                      <button
                        type='button'
                        className='article-stock-store__head'
                        onClick={() =>
                          setExpandedStoreId((prev) =>
                            prev === store.storeId ? null : store.storeId
                          )
                        }
                      >
                        <div className='article-stock-store__meta'>
                          <strong>{store.storeName}</strong>
                          {(store.branchName || store.companyName) && (
                            <span>
                              {[store.branchName, store.companyName]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          )}
                        </div>
                        <div className='article-stock-store__metrics'>
                          <span className='article-stock-store__qty'>
                            {store.totalStock} pzs
                          </span>
                          <span className={`article-stock-status ${STATUS_CLASS[status]}`}>
                            {STATUS_LABEL[status]}
                          </span>
                          {hasSizes ? (
                            <span className='article-stock-store__toggle'>
                              {isExpanded ? 'Ocultar tallas' : 'Ver tallas'}
                            </span>
                          ) : null}
                        </div>
                      </button>

                      {isExpanded && hasSizes ? (
                        <div className='article-stock-store__panel'>
                          <p className='article-stock-store__panel-title'>
                            Existencias por color y talla
                          </p>
                          <div className='article-stock-size-grid'>
                            {(store.generalStock ?? 0) > 0 ? (
                              <div className='article-stock-size-card article-stock-size-card--general'>
                                <div className='article-stock-size-card__top'>
                                  <span>Sin talla</span>
                                </div>
                                <div className='article-stock-size-card__size'>General</div>
                                <div className='article-stock-size-card__qty'>
                                  {store.generalStock} pzs
                                </div>
                              </div>
                            ) : null}
                            {(store.variations ?? []).map((variation: any) => {
                              const vStatus = (variation.status ?? 'agotado') as StockStatus
                              return (
                                <div
                                  className={`article-stock-size-card ${STATUS_CLASS[vStatus]}`}
                                  key={variation.id}
                                >
                                  <div className='article-stock-size-card__top'>
                                    {variation.colorHex ? (
                                      <span
                                        className='article-stock-size-card__swatch'
                                        style={{ backgroundColor: variation.colorHex }}
                                      />
                                    ) : null}
                                    <span>{variation.color}</span>
                                  </div>
                                  <div className='article-stock-size-card__size'>
                                    {variation.size}
                                  </div>
                                  <div className='article-stock-size-card__qty'>
                                    {variation.stock} pzs
                                  </div>
                                  <span
                                    className={`article-stock-status article-stock-status--compact ${STATUS_CLASS[vStatus]}`}
                                  >
                                    {STATUS_LABEL[vStatus]}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : null}

                      {isExpanded && !hasSizes ? (
                        <div className='article-stock-store__panel article-stock-store__panel--simple'>
                          <p>Existencia general en este almacén.</p>
                        </div>
                      ) : null}
                    </section>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className='article-stock-modal-footer'>
          <button type='button' className='btn__general-purple' onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default StockModal
