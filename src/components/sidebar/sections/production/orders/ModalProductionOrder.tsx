import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Swal from 'sweetalert2'
import './ModalProductionOrder.css'
import { modal } from '../../../../../redux/state/modals'
import APIs from '../../../../../services/APIs'

const LS_COMPANY = 'categories-picker-company-id'

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem(LS_COMPANY))
  return !Number.isNaN(id) && id > 0 ? id : null
}

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'CANCELLED', label: 'Cancelada' },
]

interface ModalProductionOrderProps {
  order?: any | null
  branchId: number
  onSaved?: () => void
}

const ModalProductionOrder: React.FC<ModalProductionOrderProps> = ({
  order,
  branchId,
  onSaved,
}) => {
  const dispatch = useDispatch()
  const modalState = useSelector((state: any) => state.modals)
  const isOpen =
    modalState === 'production_order_create' ||
    modalState === 'production_order_update'
  const isUpdate = modalState === 'production_order_update'

  const [saving, setSaving] = useState(false)
  const [areas, setAreas] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [fields, setFields] = useState({
    areaId: '',
    quantityPlanned: '1',
    quantityProduced: '0',
    status: 'DRAFT',
    startDate: '',
    dueDate: '',
    notes: '',
  })

  const colors = useMemo(() => {
    const variations = selectedProduct?.variations ?? selectedProduct?.itemVariations ?? []
    return [...new Set(variations.map((v: any) => v.color).filter(Boolean))]
  }, [selectedProduct])

  const sizes = useMemo(() => {
    const variations = selectedProduct?.variations ?? selectedProduct?.itemVariations ?? []
    return variations
      .filter((v: any) => !selectedColor || v.color === selectedColor)
      .map((v: any) => v.size)
      .filter(Boolean)
  }, [selectedProduct, selectedColor])

  const usesSizes = (selectedProduct?.variations ?? selectedProduct?.itemVariations ?? []).length > 0

  const selectedVariation = useMemo(() => {
    const variations = selectedProduct?.variations ?? selectedProduct?.itemVariations ?? []
    if (!usesSizes) return null
    return variations.find(
      (v: any) => v.color === selectedColor && v.size === selectedSize,
    )
  }, [selectedProduct, selectedColor, selectedSize, usesSizes])

  useEffect(() => {
    if (!isOpen) return

    const loadAreas = async () => {
      const companyId = readCompanyId()
      if (!companyId) {
        setAreas([])
        return
      }

      try {
        const response: any = await APIs.getAreas({
          companyId,
          branchId: branchId > 0 ? branchId : undefined,
          production: true,
        })
        setAreas(Array.isArray(response?.data) ? response.data : [])
      } catch {
        setAreas([])
      }
    }

    loadAreas()
  }, [isOpen, branchId])

  useEffect(() => {
    if (!isOpen) {
      setSaving(false)
      setSearch('')
      setSearchResults([])
      setShowResults(false)
      setSelectedProduct(null)
      setSelectedColor('')
      setSelectedSize('')
      setFields({
        areaId: '',
        quantityPlanned: '1',
        quantityProduced: '0',
        status: 'DRAFT',
        startDate: '',
        dueDate: '',
        notes: '',
      })
      return
    }

    if (isUpdate && order) {
      setSelectedProduct(order.item ?? null)
      setSelectedColor(order.itemVariation?.color ?? '')
      setSelectedSize(order.itemVariation?.size ?? '')
      setFields({
        areaId: order.areaId ? String(order.areaId) : '',
        quantityPlanned: String(order.quantityPlanned ?? 1),
        quantityProduced: String(order.quantityProduced ?? 0),
        status: order.status ?? 'DRAFT',
        startDate: order.startDate?.slice(0, 10) ?? '',
        dueDate: order.dueDate?.slice(0, 10) ?? '',
        notes: order.notes ?? '',
      })
      setSearch(order.item?.name ?? '')
    }
  }, [isOpen, isUpdate, order])

  const closeModal = () => dispatch(modal(''))

  const searchProducts = async (term: string) => {
    setSearch(term)
    const companyId = readCompanyId()
    if (!companyId || term.trim().length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    try {
      const response: any = await APIs.getProducts('', term, undefined, {
        companyId,
        branchId: branchId > 0 ? branchId : undefined,
      })
      const list = Array.isArray(response?.data) ? response.data : []
      setSearchResults(list.slice(0, 8))
      setShowResults(true)
    } catch {
      setSearchResults([])
      setShowResults(false)
    }
  }

  const pickProduct = (product: any) => {
    setSelectedProduct(product)
    setSearch(product.name ?? '')
    setShowResults(false)
    setSelectedColor('')
    setSelectedSize('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const companyId = readCompanyId()
    if (!companyId) {
      Swal.fire({ icon: 'warning', title: 'Empresa requerida', text: 'Selecciona una empresa.' })
      return
    }

    if (!selectedProduct?.id) {
      Swal.fire({ icon: 'warning', title: 'Artículo requerido', text: 'Selecciona un artículo.' })
      return
    }

    if (usesSizes && !selectedVariation?.id) {
      Swal.fire({
        icon: 'warning',
        title: 'Talla requerida',
        text: 'Selecciona color y talla del artículo.',
      })
      return
    }

    if (!fields.areaId) {
      Swal.fire({
        icon: 'warning',
        title: 'Área requerida',
        text: 'Selecciona el área de producción destino.',
      })
      return
    }

    const quantityPlanned = Number(fields.quantityPlanned)
    const quantityProduced = Number(fields.quantityProduced)

    if (!Number.isFinite(quantityPlanned) || quantityPlanned <= 0) {
      Swal.fire({ icon: 'warning', title: 'Cantidad inválida', text: 'Ingresa una cantidad planeada válida.' })
      return
    }

    const payload = {
      companyId,
      branchId: branchId > 0 ? branchId : undefined,
      areaId: Number(fields.areaId),
      itemId: selectedProduct.id,
      itemVariationId: selectedVariation?.id,
      quantityPlanned,
      quantityProduced,
      status: fields.status,
      startDate: fields.startDate || undefined,
      dueDate: fields.dueDate || undefined,
      notes: fields.notes.trim() || undefined,
    }

    setSaving(true)
    try {
      if (isUpdate && order?.id) {
        await APIs.updateProductionOrder(order.id, payload)
      } else {
        await APIs.createProductionOrder(payload)
      }

      Swal.fire({
        icon: 'success',
        title: isUpdate ? 'Orden actualizada' : 'Orden creada',
        text: 'La orden de producción se guardó correctamente.',
      })
      closeModal()
      onSaved?.()
    } catch (error) {
      console.error(error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la orden de producción.',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='production-modal-overlay' onClick={closeModal}>
      <div className='production-modal' onClick={(e) => e.stopPropagation()}>
        <div className='production-modal__header'>
          <div>
            <span className='production-modal__eyebrow'>Producción</span>
            <h2>{isUpdate ? `Editar OP-${order?.folio ?? ''}` : 'Nueva orden de producción'}</h2>
          </div>
          <button type='button' className='production-modal__close' onClick={closeModal}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='production-modal__body'>
            <div className='production-modal__field production-modal__field--full'>
              <label>Artículo</label>
              <div className='production-modal__search-wrap'>
                <input
                  className='inputs__general'
                  value={search}
                  onChange={(e) => searchProducts(e.target.value)}
                  placeholder='Buscar artículo por nombre o código'
                />
                {showResults && searchResults.length > 0 && (
                  <div className='production-modal__search-results'>
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        type='button'
                        className='production-modal__search-item'
                        onClick={() => pickProduct(product)}
                      >
                        {product.code ? `${product.code} · ` : ''}
                        {product.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedProduct && (
                <div className='production-modal__selected'>
                  Seleccionado: {selectedProduct.code ? `${selectedProduct.code} · ` : ''}
                  {selectedProduct.name}
                </div>
              )}
            </div>

            {usesSizes && (
              <div className='production-modal__grid'>
                <div className='production-modal__field'>
                  <label>Color</label>
                  <select
                    className='inputs__general'
                    value={selectedColor}
                    onChange={(e) => {
                      setSelectedColor(e.target.value)
                      setSelectedSize('')
                    }}
                  >
                    <option value=''>Selecciona color</option>
                    {colors.map((color) => (
                      <option key={String(color)} value={String(color)}>
                        {String(color)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='production-modal__field'>
                  <label>Talla</label>
                  <select
                    className='inputs__general'
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    disabled={!selectedColor}
                  >
                    <option value=''>Selecciona talla</option>
                    {sizes.map((size: string) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className='production-modal__grid'>
              <div className='production-modal__field'>
                <label>Enviar a área</label>
                <select
                  className='inputs__general'
                  value={fields.areaId}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, areaId: e.target.value }))
                  }
                  required
                >
                  <option value=''>Selecciona área</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
                {areas.length === 0 && (
                  <small className='production-modal__hint'>
                    No hay áreas de producción. Créalas en Producción → Áreas.
                  </small>
                )}
              </div>
              <div className='production-modal__field'>
                <label>Estado</label>
                <select
                  className='inputs__general'
                  value={fields.status}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className='production-modal__field'>
                <label>Cantidad planeada</label>
                <input
                  className='inputs__general'
                  type='number'
                  min={1}
                  value={fields.quantityPlanned}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, quantityPlanned: e.target.value }))
                  }
                />
              </div>
              <div className='production-modal__field'>
                <label>Cantidad producida</label>
                <input
                  className='inputs__general'
                  type='number'
                  min={0}
                  value={fields.quantityProduced}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, quantityProduced: e.target.value }))
                  }
                />
              </div>
              <div className='production-modal__field'>
                <label>Fecha inicio</label>
                <input
                  className='inputs__general'
                  type='date'
                  value={fields.startDate}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>
              <div className='production-modal__field'>
                <label>Fecha entrega</label>
                <input
                  className='inputs__general'
                  type='date'
                  value={fields.dueDate}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                />
              </div>
              <div className='production-modal__field production-modal__field--full'>
                <label>Notas</label>
                <textarea
                  className='inputs__general'
                  rows={3}
                  value={fields.notes}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder='Instrucciones o comentarios de producción'
                />
              </div>
            </div>
          </div>

          <div className='production-modal__footer'>
            <button type='button' className='btn__general-purple' onClick={closeModal}>
              Cancelar
            </button>
            <button type='submit' className='btn__general-primary' disabled={saving}>
              {saving ? 'Guardando…' : isUpdate ? 'Actualizar' : 'Crear orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalProductionOrder
