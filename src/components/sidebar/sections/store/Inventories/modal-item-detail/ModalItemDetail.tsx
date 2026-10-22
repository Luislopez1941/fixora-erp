import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import APIs from '../../../../../../services/APIs'
import { MOVEMENT_LABEL } from '../../../../../../modules/store/existencias/existencias-por-almacen/movementLabels'
import { STATUS_CLASS, STATUS_LABEL, StockStatus, qty } from '../inventoryStatus'
import '../../../../../general/skeleton/TableSkeleton.css'
import './ModalItemDetail.css'

interface Props {
  /** Fila de la lista: se muestra de inmediato (nombre, código, existencia) mientras llega la ficha completa */
  item: any
  branchId?: number
  canEdit: boolean
  onEdit: (item: any) => void
  onClose: () => void
}

const money = (n: number | null | undefined) =>
  n == null ? '—' : Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })
const dateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
const dateShort = (ymd?: string | null) =>
  ymd ? new Date(`${ymd}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
const daysUntil = (ymd?: string | null) => {
  if (!ymd) return null
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  return Math.round((new Date(`${ymd}T12:00:00`).getTime() - today.getTime()) / 86400000)
}

/** Ficha de solo lectura de un artículo: imágenes, datos, existencias por almacén, variantes, lotes y últimos movimientos. */
const ModalItemDetail: React.FC<Props> = ({ item, branchId, canEdit, onEdit, onClose }) => {
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState('')
  const [imageIndex, setImageIndex] = useState(0)

  const load = useCallback(() => {
    let alive = true
    setError('')
    setData(null)
    APIs.getInventoryItemDetail(item.itemId, branchId)
      .then((res: any) => alive && setData(res?.data ?? null))
      .catch((e: any) => alive && setError(e?.message || 'No se pudo cargar el artículo.'))
    return () => {
      alive = false
    }
  }, [item.itemId, branchId])

  useEffect(() => load(), [load])

  // Escape cierra; el fondo no se desplaza mientras está abierto
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const info = data?.item
  const images: string[] = (info?.images ?? []).filter(Boolean)
  const status = ((data?.status ?? item.status) || 'sin_rastreo') as StockStatus
  const total = data?.totalStock ?? item.totalStock
  const groups: { branch: string; stores: any[]; total: number }[] = []
  for (const s of data?.stores ?? []) {
    let g = groups.find((x) => x.branch === s.branchName)
    if (!g) groups.push((g = { branch: s.branchName, stores: [], total: 0 }))
    g.stores.push(s)
    g.total += s.qty
  }
  const unit = (data?.units ?? []).find((u: any) => u.predetermined) ?? data?.units?.[0]

  return createPortal(
    <div className='item-detail' role='dialog' aria-modal='true' aria-label={`Artículo ${item.name}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='item-detail__panel'>
        <header className='item-detail__head'>
          <div className='item-detail__head-text'>
            {item.code ? <span className='inventory-list__tag'>{item.code}</span> : null}
            <h2>{item.name}</h2>
          </div>
          <button type='button' className='item-detail__close' onClick={onClose} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </header>

        <div className='item-detail__body'>
          <section className='item-detail__hero'>
            <div className='item-detail__gallery'>
              {data ? (
                images.length ? (
                  <>
                    <img className='item-detail__image' src={images[Math.min(imageIndex, images.length - 1)]} alt={item.name} />
                    {images.length > 1 ? (
                      <div className='item-detail__thumbs'>
                        {images.map((src, i) => (
                          <button key={src + i} type='button' className={i === imageIndex ? 'is-active' : ''} onClick={() => setImageIndex(i)} aria-label={`Imagen ${i + 1}`}>
                            <img src={src} alt='' loading='lazy' />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className='item-detail__image item-detail__image--empty'>
                    <span className='material-symbols-rounded' aria-hidden>image</span>
                    <small>Sin imagen</small>
                  </div>
                )
              ) : (
                <span className='table-skeleton__shimmer item-detail__image' />
              )}
            </div>

            <div className='item-detail__stock'>
              <small>Existencia total</small>
              <strong>{item.trackInventory === false ? '—' : qty(total)}</strong>
              <span className={`inventory-list__status ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
              {info ? <small>Mínimo {qty(info.minStockAlert)}{info.maxStock != null ? ` · Máximo ${qty(info.maxStock)}` : ''}</small> : null}
            </div>
          </section>

          {error ? (
            <div className='item-detail__error' role='alert'>
              <span>{error}</span>
              <button type='button' className='btn__general-secondary' onClick={load}>Reintentar</button>
            </div>
          ) : null}

          {!data && !error ? (
            <div className='item-detail__skeleton'>
              {Array.from({ length: 6 }, (_, i) => <span key={i} className='table-skeleton__shimmer' />)}
            </div>
          ) : null}

          {info ? (
            <>
              <dl className='item-detail__facts'>
                <div><dt>Familia</dt><dd>{info.family || '—'}</dd></div>
                <div><dt>Categoría</dt><dd>{info.category || '—'}</dd></div>
                <div><dt>Precio</dt><dd>{money(info.price)}{info.includesIVA ? ' · IVA incluido' : ''}</dd></div>
                <div><dt>Descuento</dt><dd>{info.discountPercent ? `${qty(info.discountPercent)} %` : 'Sin descuento'}</dd></div>
                <div><dt>Unidad</dt><dd>{unit ? `${unit.name} (${unit.symbol})` : '—'}{(data.units ?? []).length > 1 ? ` · ${data.units.length - 1} más` : ''}</dd></div>
                <div><dt>Código de barras</dt><dd>{info.barcode || '—'}</dd></div>
                <div><dt>Inventario</dt><dd>{info.trackInventory ? 'Se rastrea' : 'No se rastrea'}{info.tracksExpiry ? ' · controla caducidad' : ''}</dd></div>
                <div><dt>Estatus</dt><dd>{info.active ? 'Activo' : 'Inactivo'}</dd></div>
              </dl>
              {info.description ? <p className='item-detail__description'>{info.description}</p> : null}

              {(data.units ?? []).length > 1 ? (
                <section className='item-detail__section'>
                  <h3>Unidades</h3>
                  <div className='item-detail__chips'>
                    {data.units.map((u: any) => (
                      <span key={u.symbol + u.factor} className='item-detail__chip'>{u.name} = {qty(u.factor)} {unit?.symbol ?? ''}</span>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className='item-detail__section'>
                <h3>Existencia por almacén</h3>
                {groups.length ? (
                  <div className='item-detail__stores'>
                    {groups.map((g) => (
                      <div key={g.branch} className='item-detail__branch'>
                        <header>
                          <span className='material-symbols-rounded' aria-hidden>storefront</span>
                          <strong>{g.branch}</strong>
                          <b>{qty(g.total)}</b>
                        </header>
                        {g.stores.map((s) => (
                          <div key={s.storeId} className={`item-detail__store ${s.qty <= 0 ? 'is-zero' : ''}`}>
                            <span>{s.storeName}</span>
                            <b>{qty(s.qty)}</b>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='item-detail__empty'>Sin almacenes activos.</p>
                )}
              </section>

              {(data.variations ?? []).length ? (
                <section className='item-detail__section'>
                  <h3>
                    Variantes{info.variantTemplate ? ` · ${info.variantTemplate.name}` : ''}
                    {info.variantTemplate?.axes?.length ? <small> ({info.variantTemplate.axes.map((a: any) => a.name).join(' + ')})</small> : null}
                  </h3>
                  <div className='item-detail__variations'>
                    {data.variations.map((v: any) => {
                      const colorAxis = info.variantTemplate?.axes?.find((a: any) => a.type === 'COLOR')
                      // Las medidas llevan su unidad ("120 cm")
                      const axes = info.variantTemplate?.axes ?? []
                      const parts: string[] = [v.option1, v.option2, v.option3]
                        .map((value: string | null, i: number) => {
                          const axis = axes.find((a: any) => a.position === i + 1)
                          return value ? (axis?.type === 'MEASURE' && axis.unit ? `${value} ${axis.unit}` : value) : null
                        })
                        .filter(Boolean) as string[]
                      return (
                        <div key={v.id} className={`item-detail__variation ${STATUS_CLASS[(v.status ?? 'agotado') as StockStatus]}`}>
                          <span>
                            {colorAxis || v.colorHex ? <i style={{ background: v.colorHex || '#586ae9' }} aria-hidden /> : null}
                            {parts.length > 1 ? parts.slice(1).join(' / ') : v.color || ''}
                          </span>
                          <strong>{parts[0] ?? v.label ?? v.size}</strong>
                          <b>{qty(v.stock)} pzs</b>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ) : null}

              {(data.lots ?? []).length ? (
                <section className='item-detail__section'>
                  <h3>Lotes vigentes</h3>
                  <div className='item-detail__list'>
                    {data.lots.map((l: any, i: number) => {
                      const d = daysUntil(l.expiryDate)
                      return (
                        <div key={`${l.lotCode}-${i}`} className='item-detail__list-row'>
                          <span>
                            <strong>{l.lotCode}</strong>
                            <small>{l.storeName}</small>
                          </span>
                          <small className={d == null ? '' : d < 0 ? 'is-bad' : d <= 30 ? 'is-warn' : ''}>
                            {l.expiryDate ? `${d != null && d < 0 ? 'Venció' : 'Caduca'} ${dateShort(l.expiryDate)}` : 'Sin caducidad'}
                          </small>
                          <b>{qty(l.remaining)}</b>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ) : null}

              <section className='item-detail__section'>
                <h3>Últimos movimientos</h3>
                {(data.moves ?? []).length ? (
                  <div className='item-detail__list'>
                    {data.moves.map((m: any, i: number) => (
                      <div key={i} className='item-detail__list-row item-detail__move'>
                        <em className={m.delta >= 0 ? 'is-in' : 'is-out'}>{m.delta >= 0 ? '+' : ''}{qty(m.delta)}</em>
                        <span>
                          <strong>{MOVEMENT_LABEL[m.type] ?? m.type}</strong>
                          <small>{[dateTime(m.at), m.storeName, m.userName, m.reason].filter(Boolean).join(' · ')}</small>
                        </span>
                        <b title='Saldo después del movimiento'>{qty(m.balance)}</b>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='item-detail__empty'>Sin movimientos registrados.</p>
                )}
              </section>
            </>
          ) : null}
        </div>

        <footer className='item-detail__foot'>
          <button type='button' className='btn__general-secondary' onClick={onClose}>Cerrar</button>
          {canEdit ? (
            <button type='button' className='btn__general-purple' onClick={() => onEdit(item)}>
              <span className='material-symbols-rounded' aria-hidden>edit</span> Editar artículo
            </button>
          ) : null}
        </footer>
      </div>
    </div>,
    document.body,
  )
}

export default ModalItemDetail
