import React, { useEffect, useMemo, useState } from 'react'
import APIs from '../../../../../services/APIs'
import './WarehousesModal.css'

export interface ArticleWarehouse {
  id: number
  name: string
  branchName?: string | null
  companyName?: string | null
}

interface WarehousesModalProps {
  isOpen: boolean
  onClose: () => void
  warehouses: ArticleWarehouse[]
  onChange: (warehouses: ArticleWarehouse[]) => void
  companyId: number | null
  branchId: number
}

const WarehousesModal: React.FC<WarehousesModalProps> = ({
  isOpen,
  onClose,
  warehouses,
  onChange,
  companyId,
  branchId,
}) => {
  const [available, setAvailable] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<number | ''>('')

  useEffect(() => {
    if (!isOpen || !companyId) {
      setAvailable([])
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const response: any = await APIs.getWarehouses({
          companyId,
          branchId: branchId > 0 ? branchId : undefined,
        })
        const list = Array.isArray(response?.data) ? response.data : []
        if (!cancelled) setAvailable(list)
      } catch (error) {
        console.error('Error loading warehouses:', error)
        if (!cancelled) setAvailable([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isOpen, companyId, branchId])

  const remainingOptions = useMemo(
    () => available.filter((item) => !warehouses.some((wh) => wh.id === item.id)),
    [available, warehouses],
  )

  const handleAdd = () => {
    if (!selectedId) return
    const found = available.find((item) => item.id === Number(selectedId))
    if (!found) return

    onChange([
      ...warehouses,
      {
        id: found.id,
        name: found.name,
        branchName: found.branchName ?? null,
        companyName: found.companyName ?? null,
      },
    ])
    setSelectedId('')
  }

  const handleRemove = (id: number) => {
    onChange(warehouses.filter((item) => item.id !== id))
  }

  if (!isOpen) return null

  return (
    <div className='article-warehouses-modal-overlay'>
      <div className='article-warehouses-modal-content'>
        <div className='article-warehouses-modal-header'>
          <h2>Almacenes del artículo</h2>
          <button type='button' className='article-warehouses-modal-close' onClick={onClose}>
            ×
          </button>
        </div>

        <div className='article-warehouses-modal-body'>
          <p className='article-warehouses-modal-hint'>
            Selecciona en qué almacenes estará disponible este artículo para entradas de inventario.
          </p>

          {!companyId ? (
            <p className='article-warehouses-modal-empty'>Selecciona una empresa en el formulario principal.</p>
          ) : (
            <>
              <div className='article-warehouses-modal-add'>
                <select
                  className='inputs__general'
                  value={selectedId}
                  onChange={(e) =>
                    setSelectedId(e.target.value ? Number(e.target.value) : '')
                  }
                  disabled={loading || remainingOptions.length === 0}
                >
                  <option value=''>
                    {loading
                      ? 'Cargando almacenes...'
                      : remainingOptions.length === 0
                        ? 'No hay más almacenes disponibles'
                        : 'Selecciona almacén'}
                  </option>
                  {remainingOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.branchName ? ` · ${item.branchName}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type='button'
                  className='btn__general-primary'
                  onClick={handleAdd}
                  disabled={!selectedId}
                >
                  Agregar
                </button>
              </div>

              {warehouses.length > 0 ? (
                <div className='article-warehouses-modal-list'>
                  {warehouses.map((item) => (
                    <div className='article-warehouses-modal-item' key={item.id}>
                      <div>
                        <p className='article-warehouses-modal-item__name'>{item.name}</p>
                        <p className='article-warehouses-modal-item__meta'>
                          {[item.branchName, item.companyName].filter(Boolean).join(' · ') || 'Almacén general'}
                        </p>
                      </div>
                      <button
                        type='button'
                        className='article-warehouses-modal-item__remove'
                        onClick={() => handleRemove(item.id)}
                        aria-label={`Quitar ${item.name}`}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='article-warehouses-modal-empty'>
                  Aún no has asignado almacenes a este artículo.
                </p>
              )}
            </>
          )}
        </div>

        <div className='article-warehouses-modal-footer'>
          <button type='button' className='btn__general-purple' onClick={onClose}>
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}

export default WarehousesModal
