import React, { useCallback, useEffect, useState } from 'react'
import APIs from '../../../services/APIs'
import { showToast } from '../../../utils/toast'
import PosModal from './pos-modal/PosModal'
import { errorText } from './restaurantTypes'

export interface Kind {
  id: number
  name: string
  active: boolean
}

interface Props {
  value: number | null
  onChange: (id: number | null) => void
  /** Texto de la opción vacía ("Sin tipo", "Igual que su familia: Bebidas") */
  emptyLabel?: string
  disabled?: boolean
  /** Clase del <select> para que combine con el formulario donde se use */
  className?: string
}

/** Lista de tipos de consumo (Alimentos, Bebidas…) con un acceso para crear, renombrar o quitar los de la empresa. */
const KindSelect: React.FC<Props> = ({ value, onChange, emptyLabel = 'Sin tipo', disabled, className }) => {
  const [kinds, setKinds] = useState<Kind[]>([])
  const [manage, setManage] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const res: any = await APIs.getRestaurantKinds()
      setKinds(res?.data ?? [])
    } catch {
      setKinds([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const run = async (fn: () => Promise<any>, ok: string) => {
    setBusy(true)
    try {
      await fn()
      showToast({ type: 'success', title: ok })
      await load()
      return true
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo guardar', text: errorText(e, 'Intenta de nuevo.') })
      return false
    } finally {
      setBusy(false)
    }
  }

  const add = async () => {
    if (!name.trim()) return
    if (await run(() => APIs.createRestaurantKind({ name }), 'Tipo creado')) setName('')
  }

  return (
    <>
      <div className='kind-select'>
        <select className={className} value={value ?? ''} disabled={disabled} aria-label='Tipo' onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
          <option value=''>{emptyLabel}</option>
          {kinds.filter((k) => k.active || k.id === value).map((k) => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>
        <button type='button' className='kind-select__manage' onClick={() => setManage(true)} disabled={disabled} aria-label='Administrar tipos' title='Administrar tipos'>
          <span className='material-symbols-rounded'>tune</span>
        </button>
      </div>

      {manage ? (
        <PosModal title='Tipos de consumo' onClose={() => setManage(false)} actions={<button type='button' className='btn__general-purple' onClick={() => setManage(false)}>Listo</button>}>
          <p className='pos-note'>Define cómo clasificas lo que vendes: Alimentos, Bebidas, Postres… Se asignan a las familias y a los platillos.</p>
          <div className='menus-list'>
            {kinds.map((k) => (
              <div key={k.id} className='menus-option' style={{ padding: '8px 12px' }}>
                <span>{k.name}</span>
                <button
                  type='button'
                  className='menus-icon'
                  aria-label={`Renombrar ${k.name}`}
                  disabled={busy}
                  onClick={() => {
                    const next = window.prompt('Nuevo nombre', k.name)
                    if (next && next.trim() && next.trim() !== k.name) run(() => APIs.updateRestaurantKind(k.id, { name: next }), 'Tipo actualizado')
                  }}
                >
                  <span className='material-symbols-rounded'>edit</span>
                </button>
                <button
                  type='button'
                  className='menus-icon is-danger'
                  aria-label={`Quitar ${k.name}`}
                  disabled={busy}
                  onClick={async () => {
                    if (window.confirm(`¿Quitar el tipo "${k.name}"? Las familias y platillos que lo usan quedan sin tipo.`)) {
                      if (await run(() => APIs.deleteRestaurantKind(k.id), 'Tipo quitado') && value === k.id) onChange(null)
                    }
                  }}
                >
                  <span className='material-symbols-rounded'>delete</span>
                </button>
              </div>
            ))}
          </div>
          <div className='menus-addopt' style={{ gridTemplateColumns: 'minmax(0, 1fr) auto' }}>
            <input value={name} maxLength={60} placeholder='Nuevo tipo (Postres, Cafetería…)' aria-label='Nuevo tipo' onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
            <button type='button' className='btn__general-purple' onClick={add} disabled={busy || !name.trim()}>Agregar</button>
          </div>
        </PosModal>
      ) : null}
    </>
  )
}

export default KindSelect
