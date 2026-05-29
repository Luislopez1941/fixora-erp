import React, { useEffect, useState } from 'react'
import APIs from '../../../../../services/APIs'
import './WebOrderFulfillmentModal.css'

const ORDER_STATUS_OPTIONS = [
  { value: 'RECEIVED', label: 'Recibido' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'IN_PRODUCTION', label: 'Trabajando pedido' },
  { value: 'READY_FOR_PICKUP', label: 'Pedido terminado' },
  { value: 'OUT_FOR_DELIVERY', label: 'En camino' },
  { value: 'DELIVERED', label: 'Entregado' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

type Props = {
  sale: any | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

const WebOrderFulfillmentModal: React.FC<Props> = ({
  sale,
  open,
  onClose,
  onSaved,
}) => {
  const [customerOrderStatus, setCustomerOrderStatus] = useState('RECEIVED')
  const [assignedDriverId, setAssignedDriverId] = useState('')
  const [drivers, setDrivers] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !sale) return

    setCustomerOrderStatus(sale.customerOrderStatus ?? 'RECEIVED')
    setAssignedDriverId(
      sale.assignedDriverId ? String(sale.assignedDriverId) : '',
    )
    setError('')

    const loadDrivers = async () => {
      try {
        const token = localStorage.getItem('token-eco') ?? ''
        const response: any = await APIs.getUsers({
          filtro: 'Todos',
          currentPage: 1,
          token,
        })
        const list = Array.isArray(response?.data) ? response.data : []
        setDrivers(list)
      } catch {
        setDrivers([])
      }
    }

    loadDrivers()
  }, [open, sale])

  if (!open || !sale) return null

  const isDelivery = sale.deliveryType === 'DELIVERY'
  const statusOptions = ORDER_STATUS_OPTIONS.filter((option) => {
    if (!isDelivery && option.value === 'OUT_FOR_DELIVERY') return false
    return true
  })

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      await APIs.updateSaleFulfillment(sale.id, {
        customerOrderStatus,
        assignedDriverId:
          assignedDriverId === '' ? null : Number(assignedDriverId),
      })
      onSaved()
      onClose()
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        'No se pudo actualizar la entrega.'
      setError(Array.isArray(message) ? message.join('. ') : message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='web-order-modal__backdrop' onClick={onClose}>
      <div
        className='web-order-modal'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='web-order-modal__header'>
          <h3>Pedido web {sale.trackingCode ?? `#${sale.id}`}</h3>
          <button type='button' className='web-order-modal__close' onClick={onClose}>
            ×
          </button>
        </div>

        <div className='web-order-modal__body'>
          <p>
            <strong>Cliente:</strong> {sale.webCustomerName ?? '—'}
          </p>
          <p>
            <strong>Email:</strong> {sale.webCustomerEmail ?? '—'}
          </p>
          <p>
            <strong>Teléfono:</strong> {sale.webCustomerPhone ?? '—'}
          </p>
          <p>
            <strong>Entrega:</strong>{' '}
            {isDelivery
              ? `Domicilio · ${sale.deliveryAddress ?? ''}, ${sale.deliveryColony ?? ''} CP ${sale.deliveryPostalCode ?? ''}`
              : 'Recoger en local'}
          </p>
          {isDelivery &&
          sale.deliveryLatitude != null &&
          sale.deliveryLongitude != null ? (
            <p>
              <a
                href={`https://maps.google.com/?q=${sale.deliveryLatitude},${sale.deliveryLongitude}`}
                target='_blank'
                rel='noopener noreferrer'
              >
                Abrir ubicación exacta en Google Maps →
              </a>
            </p>
          ) : null}

          <label className='web-order-modal__field'>
            <span>Estado del pedido</span>
            <select
              value={customerOrderStatus}
              onChange={(e) => setCustomerOrderStatus(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {isDelivery ? (
            <label className='web-order-modal__field'>
              <span>Repartidor</span>
              <select
                value={assignedDriverId}
                onChange={(e) => setAssignedDriverId(e.target.value)}
              >
                <option value=''>Sin asignar</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.firstName} {driver.firstLastName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {error ? <p className='web-order-modal__error'>{error}</p> : null}
        </div>

        <div className='web-order-modal__actions'>
          <button type='button' className='btn__general-secondary' onClick={onClose}>
            Cancelar
          </button>
          <button
            type='button'
            className='btn__general-primary'
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WebOrderFulfillmentModal
