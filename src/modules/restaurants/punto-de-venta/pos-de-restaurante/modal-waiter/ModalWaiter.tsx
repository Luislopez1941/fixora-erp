import React, { useEffect, useState } from 'react'
import APIs from '../../../../../services/APIs'
import PosModal from '../../../shared/pos-modal/PosModal'
import { errorText } from '../../../shared/restaurantTypes'

interface User {
  id: number
  firstName?: string | null
  firstLastName?: string | null
  email?: string | null
  role?: { name?: string } | null
}

interface Props {
  companyId: number
  branchId: number
  current: string | null
  busy: boolean
  onClose: () => void
  onPick: (userId: number) => void
}

const name = (u: User) => `${u.firstName ?? ''} ${u.firstLastName ?? ''}`.trim() || u.email || `Usuario ${u.id}`

/** Pasar la cuenta a otro mesero (cambio de turno, reasignación de zona). */
const ModalWaiter: React.FC<Props> = ({ companyId, branchId, current, busy, onClose, onPick }) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    APIs.getUsers({ companyId, branchId })
      .then((res: any) => {
        const rows = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : res?.data?.data ?? []
        setUsers(rows)
      })
      .catch((e: unknown) => setError(errorText(e, 'No se pudieron cargar los usuarios.')))
      .finally(() => setLoading(false))
  }, [companyId, branchId])

  return (
    <PosModal title='Cambiar mesero' onClose={onClose}>
      <p className='pos-note'>Ahora la atiende: {current ?? 'sin mesero'}.</p>
      {loading ? <p className='pos-note'>Cargando usuarios…</p> : null}
      <ul className='pos-pick'>
        {users.map((u) => (
          <li key={u.id}>
            <button type='button' className={name(u) === current ? 'is-checked' : ''} disabled={busy} onClick={() => onPick(u.id)}>
              <span className='material-symbols-rounded' aria-hidden>badge</span>
              <span className='pos-pick__main'>
                <strong>{name(u)}</strong>
                {u.role?.name ? <small>{u.role.name}</small> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {error ? <p className='pos-error'>{error}</p> : null}
    </PosModal>
  )
}

export default ModalWaiter
