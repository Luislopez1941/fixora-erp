import React, { useEffect, useMemo, useState } from 'react'
import APIs from '../../../../../services/APIs'
import PosModal from '../../../shared/pos-modal/PosModal'
import { errorText, money } from '../../../shared/restaurantTypes'

interface Customer {
  id: number
  firstName: string | null
  lastName: string | null
  businessName: string | null
  phone: string | null
  email: string | null
}

interface Props {
  companyId: number
  currentId: number | null
  busy: boolean
  onClose: () => void
  /** null = quitar el cliente de la cuenta */
  onPick: (customerId: number | null, label?: string) => void
}

export const customerName = (c: Pick<Customer, 'firstName' | 'lastName' | 'businessName'> | null | undefined) =>
  c ? c.businessName || [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Cliente' : ''

/** Cliente de la cuenta: buscar, ver su monedero, crear uno rápido (nombre y teléfono) o quitarlo. */
const ModalCustomer: React.FC<Props> = ({ companyId, currentId, busy, onClose, onPick }) => {
  const [list, setList] = useState<Customer[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ name: '', phone: '' })
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    APIs.getCustomers(companyId)
      .then((res: any) => alive && setList(Array.isArray(res) ? res : res?.data ?? []))
      .catch((e: unknown) => alive && setError(errorText(e, 'No se pudieron cargar los clientes.')))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [companyId])

  useEffect(() => {
    if (!currentId) return setBalance(null)
    APIs.getCustomerWallet(currentId)
      .then((res: any) => setBalance(Number(res?.data?.balance ?? 0)))
      .catch(() => setBalance(null))
  }, [currentId])

  const current = list.find((c) => c.id === currentId)
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    const rows = t ? list.filter((c) => `${customerName(c)} ${c.phone ?? ''} ${c.email ?? ''}`.toLowerCase().includes(t)) : list
    return rows.slice(0, 40)
  }, [list, q])

  const create = async () => {
    const [firstName, ...rest] = draft.name.trim().split(/\s+/)
    setError('')
    try {
      const res: any = await APIs.createCustomer({ companyId, customerType: 'FISICA', firstName, lastName: rest.join(' ') || undefined, phone: draft.phone.trim() || undefined })
      const id = res?.data?.id ?? res?.id
      if (!id) throw new Error(res?.message || 'No se pudo crear el cliente.')
      onPick(id, draft.name.trim())
    } catch (e) {
      setError(errorText(e, 'No se pudo crear el cliente.'))
    }
  }

  return (
    <PosModal title='Cliente de la cuenta' onClose={onClose}>
      {current ? (
        <div className='pos-pick'>
          <label className='is-checked'>
            <span className='material-symbols-rounded' aria-hidden>person</span>
            <span className='pos-pick__main'>
              <strong>{customerName(current)}</strong>
              <small>{current.phone ?? current.email ?? ''}</small>
            </span>
            <span className='pos-pick__end'>{balance != null ? `Monedero ${money(balance)}` : ''}</span>
          </label>
          <button type='button' className='btn__general-gray' disabled={busy} onClick={() => onPick(null)}>
            Quitar cliente
          </button>
        </div>
      ) : null}

      {creating ? (
        <>
          <div className='pos-row'>
            <label className='pos-field'>
              Nombre
              <input value={draft.name} autoFocus maxLength={100} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </label>
            <label className='pos-field'>
              Teléfono
              <input value={draft.phone} inputMode='tel' maxLength={30} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            </label>
          </div>
          <div className='cash-ui__modal-actions'>
            <button type='button' className='btn__general-gray' onClick={() => setCreating(false)}>Volver</button>
            <button type='button' className='btn__general-purple' disabled={busy || !draft.name.trim()} onClick={create}>Crear y asignar</button>
          </div>
        </>
      ) : (
        <>
          <label className='pos-field'>
            Buscar
            <input value={q} autoFocus onChange={(e) => setQ(e.target.value)} placeholder='Nombre, teléfono o correo' />
          </label>
          {loading ? <p className='pos-note'>Cargando clientes…</p> : null}
          <ul className='pos-pick'>
            {shown.map((c) => (
              <li key={c.id}>
                <button type='button' className={c.id === currentId ? 'is-checked' : ''} disabled={busy} onClick={() => onPick(c.id, customerName(c))}>
                  <span className='pos-pick__main'>
                    <strong>{customerName(c)}</strong>
                    <small>{c.phone ?? c.email ?? ''}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {!loading && !shown.length ? <p className='pos-note'>Ningún cliente coincide.</p> : null}
          <button type='button' className='btn__general-gray' onClick={() => { setCreating(true); setDraft({ name: q, phone: '' }) }}>
            <span className='material-symbols-rounded'>person_add</span> Cliente nuevo
          </button>
        </>
      )}
      {error ? <p className='pos-error'>{error}</p> : null}
    </PosModal>
  )
}

export default ModalCustomer
