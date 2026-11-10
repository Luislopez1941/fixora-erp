import React, { useMemo, useState } from 'react'
import PosModal from '../../../shared/pos-modal/PosModal'
import { Floor, Tab, TabSummary, TYPE_LABEL, money } from '../../../shared/restaurantTypes'

interface Props {
  floor: Floor
  tab: Tab
  busy: boolean
  onClose: () => void
  onMerge: (sourceTabIds: number[]) => void
}

/** Unir otras cuentas a ésta: sus platillos pasan aquí y aquéllas se cierran. Primero las de la misma mesa. */
const ModalMerge: React.FC<Props> = ({ floor, tab, busy, onClose, onMerge }) => {
  const [picked, setPicked] = useState<number[]>([])
  const options = useMemo(() => {
    const rows: { tab: TabSummary; where: string }[] = []
    for (const room of floor.rooms) for (const t of room.tables) for (const x of t.tabs) if (x.id !== tab.id) rows.push({ tab: x, where: `${t.name} · ${room.name}` })
    for (const x of floor.otherTabs) if (x.id !== tab.id) rows.push({ tab: x, where: TYPE_LABEL[x.type] })
    return rows.sort((a, b) => Number(b.tab.tableId === tab.tableId) - Number(a.tab.tableId === tab.tableId))
  }, [floor, tab])
  const toggle = (id: number) => setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))

  return (
    <PosModal
      title={`Unir a la cuenta #${tab.folio}`}
      onClose={onClose}
      actions={
        <>
          <button type='button' className='btn__general-secondary' onClick={onClose}>Cancelar</button>
          <button type='button' className='btn__general-purple' disabled={busy || !picked.length} onClick={() => onMerge(picked)}>
            Unir {picked.length || ''}
          </button>
        </>
      }
    >
      {!options.length ? (
        <p className='pos-note'>No hay otras cuentas abiertas.</p>
      ) : (
        <ul className='pos-pick'>
          {options.map(({ tab: t, where }) => (
            <li key={t.id}>
              <label className={picked.includes(t.id) ? 'is-checked' : ''}>
                <input type='checkbox' checked={picked.includes(t.id)} onChange={() => toggle(t.id)} />
                <span className='pos-pick__main'>
                  <strong>{t.label || `Cuenta #${t.folio}`}</strong>
                  <small>{where} · #{t.folio} · {t.guests} comensal(es)</small>
                </span>
                <span className='pos-pick__end'>{money(t.subtotal)}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </PosModal>
  )
}

export default ModalMerge
