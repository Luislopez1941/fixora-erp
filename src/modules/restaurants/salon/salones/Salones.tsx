import React, { useCallback, useEffect, useState } from 'react'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import { showToast } from '../../../../utils/toast'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import { DiningRoom, Floor, RestaurantTable, errorText } from '../../shared/restaurantTypes'
import ModalRoom from './modal-room/ModalRoom'
import ModalTable from './modal-table/ModalTable'
import './Salones.css'

type ModalState =
  | { kind: 'room'; room?: DiningRoom }
  | { kind: 'table'; roomId: number; table?: RestaurantTable }
  | { kind: 'bulk'; roomId: number }
  | null

const SHAPE_ICON: Record<string, string> = { square: 'crop_square', round: 'circle', bar: 'horizontal_rule' }

/** Salones y mesas de la sucursal: lo que aparece en el plano del POS. */
const Salones: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.salon-salones.view') || can('restaurants.salon-mesas.view')
  const canManage = can('restaurants.manage') || can('restaurants.create')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [floor, setFloor] = useState<Floor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)

  const load = useCallback(async () => {
    if (!(branchId > 0) || !canView) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res: any = await APIs.getRestaurantFloor(branchId, true)
      setFloor(res?.data ?? null)
      setError('')
    } catch (e) {
      setFloor(null)
      setError(errorText(e, 'No se pudieron cargar los salones.'))
    } finally {
      setLoading(false)
    }
  }, [branchId, canView])

  useEffect(() => {
    load()
  }, [load])

  const run = async (fn: () => Promise<any>, ok: string) => {
    setBusy(true)
    try {
      await fn()
      showToast({ type: 'success', title: ok })
      setModal(null)
      await load()
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo guardar', text: errorText(e, 'Intenta de nuevo.') })
    } finally {
      setBusy(false)
    }
  }

  const rooms = floor?.rooms ?? []
  const activeRooms = rooms.filter((r) => r.active)

  return (
    <RestaurantPage
      title='Salones y mesas'
      subtitle='Los salones y mesas que el POS muestra en el plano. Desactivar no borra nada: deja de aparecer.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading}
      error={error}
      onRetry={load}
      toolbar={
        canManage ? (
          <button type='button' className='btn__general-purple' onClick={() => setModal({ kind: 'room' })} disabled={busy}>
            <span className='material-symbols-rounded'>add</span> Nuevo salón
          </button>
        ) : null
      }
    >
      {!rooms.length ? (
        <p className='restaurant-empty'>
          Todavía no hay salones. Crea el primero (por ejemplo "Salón principal") y agrégale sus mesas.
        </p>
      ) : (
        <div className='salones'>
          {rooms.map((room) => (
            <section key={room.id} className={`salon-card ${room.active ? '' : 'is-off'}`}>
              <header className='salon-card__head'>
                <div>
                  <h2>
                    {room.name}
                    {!room.active ? <span className='restaurant-badge is-gray'>Desactivado</span> : null}
                  </h2>
                  <small>
                    {room.tables.filter((t) => t.active).length} mesas · {room.tables.filter((t) => t.active).reduce((acc, t) => acc + t.seats, 0)} lugares
                  </small>
                </div>
                {canManage ? (
                  <div className='salon-card__actions'>
                    <button type='button' onClick={() => setModal({ kind: 'room', room })} disabled={busy} title='Cambiar nombre'>
                      <span className='material-symbols-rounded'>edit</span>
                    </button>
                    <button
                      type='button'
                      onClick={() => run(() => APIs.updateDiningRoom(room.id, { active: !room.active }), room.active ? 'Salón desactivado' : 'Salón activado')}
                      disabled={busy}
                      title={room.active ? 'Desactivar' : 'Activar'}
                    >
                      <span className='material-symbols-rounded'>{room.active ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                ) : null}
              </header>

              <div className='salon-card__tables'>
                {room.tables.map((t) => (
                  <button
                    key={t.id}
                    type='button'
                    className={`salon-table shape-${t.shape} ${t.active ? '' : 'is-off'}`}
                    onClick={() => canManage && setModal({ kind: 'table', roomId: room.id, table: t })}
                    disabled={!canManage}
                    title={t.active ? 'Editar mesa' : 'Mesa desactivada: tócala para activarla'}
                  >
                    <span className='material-symbols-rounded' aria-hidden>{SHAPE_ICON[t.shape] ?? 'crop_square'}</span>
                    <strong>{t.name}</strong>
                    <small>{t.seats} lugares</small>
                  </button>
                ))}
                {canManage && room.active ? (
                  <>
                    <button type='button' className='salon-table is-add' onClick={() => setModal({ kind: 'table', roomId: room.id })} disabled={busy}>
                      <span className='material-symbols-rounded'>add</span>
                      <strong>Mesa</strong>
                    </button>
                    <button type='button' className='salon-table is-add' onClick={() => setModal({ kind: 'bulk', roomId: room.id })} disabled={busy}>
                      <span className='material-symbols-rounded'>library_add</span>
                      <strong>Varias</strong>
                    </button>
                  </>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      )}

      {modal?.kind === 'room' ? (
        <ModalRoom
          initial={modal.room?.name}
          busy={busy}
          onClose={() => setModal(null)}
          onSave={(name) =>
            modal.room
              ? run(() => APIs.updateDiningRoom(modal.room!.id, { name }), 'Salón actualizado')
              : run(() => APIs.createDiningRoom({ branchId, name }), 'Salón creado')
          }
        />
      ) : null}
      {modal?.kind === 'table' || modal?.kind === 'bulk' ? (
        <ModalTable
          mode={modal.kind === 'bulk' ? { kind: 'bulk', roomId: modal.roomId } : { kind: 'one', roomId: modal.roomId, table: modal.table }}
          rooms={activeRooms}
          busy={busy}
          onClose={() => setModal(null)}
          onToggleActive={
            modal.kind === 'table' && modal.table
              ? () => run(() => APIs.updateRestaurantTable(modal.table!.id, { active: !modal.table!.active }), modal.table!.active ? 'Mesa desactivada' : 'Mesa activada')
              : undefined
          }
          onSave={(d) => {
            if (modal.kind === 'bulk') {
              return run(() => APIs.createRestaurantTablesBulk({ diningRoomId: modal.roomId, count: d.count, prefix: d.prefix, seats: d.seats }), `${d.count} mesas creadas`)
            }
            if (modal.table) {
              return run(() => APIs.updateRestaurantTable(modal.table!.id, { name: d.name, seats: d.seats, shape: d.shape, diningRoomId: d.diningRoomId }), 'Mesa actualizada')
            }
            return run(() => APIs.createRestaurantTable({ diningRoomId: modal.roomId, name: d.name, seats: d.seats, shape: d.shape }), 'Mesa creada')
          }}
        />
      ) : null}
    </RestaurantPage>
  )
}

export default Salones
