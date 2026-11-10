import React from 'react'
import { ITEM_STATUS_LABEL, IVA_RATE, Tab, TabItem, TYPE_ICON, elapsed, liveItems, money, qty, tabTitle } from '../../../shared/restaurantTypes'
import './TabPanel.css'

interface Props {
  tab: Tab
  busy: boolean
  onBack: () => void
  onQty: (item: TabItem, delta: number) => void
  onEditItem: (item: TabItem) => void
  onRemoveItem: (item: TabItem) => void
  onSend: () => void
  onPreBill: () => void
  onCharge: () => void
  onSplit: () => void
  onMerge: () => void
  onMove: () => void
  onEditTab: () => void
  onCancelTab: () => void
  onCustomer: () => void
  onMore: () => void
  /** Nombre del cliente asignado (para mostrarlo en el botón) */
  customerLabel?: string | null
}

/**
 * La cuenta abierta: partidas (lo pendiente arriba, resaltado), acciones de la cuenta y el total estimado. El total
 * exacto (precio del servidor e IVA) se confirma en la pantalla de cobro.
 */
const TabPanel: React.FC<Props> = (p) => {
  const { tab, busy } = p
  const items = liveItems(tab)
  const pending = items.filter((i) => i.status === 'PENDING')
  const sent = items.filter((i) => i.status !== 'PENDING')
  const cancelled = tab.items.filter((i) => i.status === 'CANCELLED')
  const estimated = Math.round(tab.subtotal * (1 + IVA_RATE) * 100) / 100

  const row = (i: TabItem) => (
    <li key={i.id} className={`tab-item is-${i.status.toLowerCase()}`}>
      <div className='tab-item__qty'>
        {i.status === 'PENDING' ? (
          <>
            <button type='button' aria-label='Uno menos' onClick={() => p.onQty(i, -1)} disabled={busy}>
              <span className='material-symbols-rounded'>remove</span>
            </button>
            <span>{qty(i.quantity)}</span>
            <button type='button' aria-label='Uno más' onClick={() => p.onQty(i, 1)} disabled={busy}>
              <span className='material-symbols-rounded'>add</span>
            </button>
          </>
        ) : (
          <span className='tab-item__qty-fixed'>{qty(i.quantity)}</span>
        )}
      </div>
      <button type='button' className='tab-item__body' onClick={() => p.onEditItem(i)} disabled={busy}>
        <span className='tab-item__name'>{i.name}</span>
        {i.modifiers?.length || i.notes || i.seat ? (
          <span className='tab-item__extra'>
            {[...(i.modifiers ?? []), i.notes, i.seat ? `Comensal ${i.seat}` : null].filter(Boolean).join(' · ')}
          </span>
        ) : null}
        {i.status !== 'PENDING' ? (
          <span className='tab-item__status'>
            {ITEM_STATUS_LABEL[i.status]}
            {i.kitchenTicketNo ? ` · comanda ${i.kitchenTicketNo}` : ''}
            {i.sentAt ? ` · ${elapsed(i.sentAt)}` : ''}
          </span>
        ) : null}
      </button>
      <span className='tab-item__amount'>{money(Number(i.quantity) * Number(i.unitPrice))}</span>
      <button
        type='button'
        className='tab-item__remove'
        aria-label={i.status === 'PENDING' ? `Quitar ${i.name}` : `Cancelar ${i.name}`}
        title={i.status === 'PENDING' ? 'Quitar' : 'Cancelar (pide motivo)'}
        onClick={() => p.onRemoveItem(i)}
        disabled={busy}
      >
        <span className='material-symbols-rounded'>{i.status === 'PENDING' ? 'delete' : 'block'}</span>
      </button>
    </li>
  )

  return (
    <section className='tab-panel' aria-label={`Cuenta ${tab.folio}`}>
      <header className='tab-panel__head'>
        <button type='button' className='tab-panel__back' onClick={p.onBack} aria-label='Volver a las mesas'>
          <span className='material-symbols-rounded'>arrow_back</span>
        </button>
        <button type='button' className='tab-panel__title' onClick={p.onEditTab} disabled={busy} title='Cambiar nombre o comensales'>
          <span className='material-symbols-rounded' aria-hidden>{TYPE_ICON[tab.type]}</span>
          <span>
            <strong>{tabTitle(tab)}</strong>
            <small>
              Cuenta #{tab.folio} · {tab.guests} comensal{tab.guests === 1 ? '' : 'es'} · {tab.waiterName ?? 'Sin mesero'} · {elapsed(tab.openedAt)}
            </small>
          </span>
        </button>
        {tab.status === 'BILL_REQUESTED' ? <span className='tab-panel__flag'>Pidió la cuenta</span> : null}
      </header>

      <div className='tab-panel__tools'>
        <button type='button' onClick={p.onMove} disabled={busy}>
          <span className='material-symbols-rounded'>move_down</span> Mover
        </button>
        <button type='button' onClick={p.onSplit} disabled={busy || items.length < 1}>
          <span className='material-symbols-rounded'>call_split</span> Dividir
        </button>
        <button type='button' onClick={p.onMerge} disabled={busy}>
          <span className='material-symbols-rounded'>merge</span> Unir
        </button>
        <button type='button' onClick={p.onCustomer} disabled={busy} className={tab.customerId ? 'is-on' : ''} title='Cliente y monedero'>
          <span className='material-symbols-rounded'>{tab.customerId ? 'person_check' : 'person_add'}</span> {p.customerLabel || 'Cliente'}
        </button>
        <button type='button' onClick={p.onMore} disabled={busy}>
          <span className='material-symbols-rounded'>more_horiz</span> Más
        </button>
        <button type='button' onClick={p.onCancelTab} disabled={busy} className='is-danger'>
          <span className='material-symbols-rounded'>close</span> Cancelar
        </button>
      </div>

      <div className='tab-panel__items'>
        {!items.length ? (
          <p className='tab-panel__empty'>Toca un platillo del catálogo para agregarlo.</p>
        ) : (
          <>
            {pending.length ? (
              <>
                <h4 className='tab-panel__group is-pending'>Sin enviar a cocina ({pending.length})</h4>
                <ul>{pending.map(row)}</ul>
              </>
            ) : null}
            {sent.length ? (
              <>
                <h4 className='tab-panel__group'>En la mesa</h4>
                <ul>{sent.map(row)}</ul>
              </>
            ) : null}
          </>
        )}
        {cancelled.length ? (
          <details className='tab-panel__cancelled'>
            <summary>{cancelled.length} cancelado(s)</summary>
            <ul>
              {cancelled.map((i) => (
                <li key={i.id}>
                  {qty(i.quantity)} × {i.name} — {i.cancelReason}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>

      <footer className='tab-panel__foot'>
        <div className='tab-panel__totals'>
          <span>Subtotal {money(tab.subtotal)}</span>
          <strong>Total aprox. {money(estimated)}</strong>
        </div>
        <div className='tab-panel__actions'>
          <button type='button' className='btn__general-secondary' onClick={p.onSend} disabled={busy || !pending.length}>
            <span className='material-symbols-rounded'>skillet</span> Enviar a cocina{pending.length ? ` (${pending.length})` : ''}
          </button>
          <button type='button' className='btn__general-secondary' onClick={p.onPreBill} disabled={busy || !items.length}>
            <span className='material-symbols-rounded'>receipt</span> Pre-cuenta
          </button>
          <button type='button' className='btn__general-purple tab-panel__charge' onClick={p.onCharge} disabled={busy || !items.length}>
            <span className='material-symbols-rounded'>payments</span> Cobrar
          </button>
        </div>
      </footer>
    </section>
  )
}

export default TabPanel
