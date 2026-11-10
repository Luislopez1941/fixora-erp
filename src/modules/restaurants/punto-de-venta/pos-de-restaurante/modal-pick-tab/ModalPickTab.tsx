import React from 'react'
import PosModal from '../../../shared/pos-modal/PosModal'
import { RestaurantTable, TabSummary, elapsed, money } from '../../../shared/restaurantTypes'

interface Props {
  table: RestaurantTable
  onClose: () => void
  onPick: (tab: TabSummary) => void
  onNew: () => void
}

/** Mesa con varias cuentas (se dividió): elegir cuál abrir o abrir otra. */
const ModalPickTab: React.FC<Props> = ({ table, onClose, onPick, onNew }) => (
  <PosModal
    title={`${table.name} · ${table.tabs.length} cuentas`}
    onClose={onClose}
    actions={
      <button type='button' className='btn__general-secondary' onClick={onNew}>
        <span className='material-symbols-rounded'>add</span> Otra cuenta en esta mesa
      </button>
    }
  >
    <ul className='pos-pick'>
      {table.tabs.map((t) => (
        <li key={t.id}>
          <button type='button' onClick={() => onPick(t)}>
            <span className='pos-pick__main'>
              <strong>{t.label || `Cuenta #${t.folio}`}</strong>
              <small>#{t.folio} · {t.guests} comensal(es) · {elapsed(t.openedAt)}{t.status === 'BILL_REQUESTED' ? ' · pidió la cuenta' : ''}</small>
            </span>
            <span className='pos-pick__end'>{money(t.subtotal)}</span>
          </button>
        </li>
      ))}
    </ul>
  </PosModal>
)

export default ModalPickTab
