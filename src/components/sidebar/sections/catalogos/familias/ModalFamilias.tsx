import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import { AppStore } from '../../../../../redux/store'
import { categoryId, readCategoryBranchId } from '../../../../../constants/category'
import CategoriesStorePicker from '../../categories/CategoriesStorePicker'
import APIs from '../../../../../services/APIs'

interface ModalFamiliasProps {
  selectedFamilia?: any
  onSaved?: () => void
}

const ModalFamilias: React.FC<ModalFamiliasProps> = ({ selectedFamilia, onSaved }) => {
  const dispatch = useDispatch()
  const modalState = useSelector((store: AppStore) => store.modals as unknown as string)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [branchId, setBranchId] = useState(readCategoryBranchId)
  const [allowedItemType, setAllowedItemType] = useState<string>('both')
  const [image, setImage] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [isSaving, setIsSaving] = useState(false)

  const isOpen = modalState === 'familias-modal' || modalState === 'familias-modal-update'
  const isUpdate = modalState === 'familias-modal-update'

  useEffect(() => {
    if (!isOpen) {
      setTitle('')
      setDescription('')
      setBranchId(readCategoryBranchId())
      setAllowedItemType('both')
      setImage('')
      setImagePreview('')
      setStatus('ACTIVE')
      setIsSaving(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (modalState === 'familias-modal') {
      setBranchId(readCategoryBranchId())
    }
  }, [modalState])

  useEffect(() => {
    if (modalState !== 'familias-modal-update' || !selectedFamilia) return

    setTitle(String(selectedFamilia.title ?? ''))
    setDescription(String(selectedFamilia.description ?? ''))
    
    // Si allowedItemType es null o undefined, significa "ambos"
    const itemType = selectedFamilia.allowedItemType
    setAllowedItemType(itemType === null || itemType === undefined ? 'both' : String(itemType))
    
    setStatus(selectedFamilia.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')

    const imageValue = String(selectedFamilia.image ?? '')
    setImage(imageValue)
    setImagePreview(imageValue)

    const parsedBranchId = Number(
      selectedFamilia.branchId ?? selectedFamilia.storeId ?? readCategoryBranchId()
    )
    setBranchId(!Number.isNaN(parsedBranchId) ? parsedBranchId : readCategoryBranchId())
  }, [modalState, selectedFamilia])

  const closeModal = () => {
    if (isSaving) return
    dispatch(modal(''))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSaving) return
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setImage(base64)
      setImagePreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token-eco')
    if (!token) {
      Swal.fire({
        title: 'Sesión',
        text: 'No hay token de autenticación',
        icon: 'warning',
        confirmButtonColor: '#5869e9',
      })
      return
    }

    if (!title.trim()) {
      Swal.fire({
        title: 'Validación',
        text: 'El nombre de la familia es obligatorio',
        icon: 'warning',
        confirmButtonColor: '#5869e9',
      })
      return
    }

    const bid = Number(branchId)
    const familiaData: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || null,
      level: 1,
      type: 'FAMILIA',
      allowedItemType: allowedItemType === 'both' ? null : allowedItemType,
      image: image || null,
      status,
      parentId: null,
    }
    if (!Number.isNaN(bid) && bid >= 1) {
      familiaData.branchId = bid
    }

    setIsSaving(true)
    try {
      if (isUpdate) {
        const id = categoryId(selectedFamilia ?? {})
        if (id == null) {
          Swal.fire({
            title: 'Error',
            text: 'No se encontró el ID de la familia a actualizar',
            icon: 'error',
            confirmButtonColor: '#5869e9',
          })
          return
        }
        await APIs.patchCategory(id, familiaData, token)
        await Swal.fire({
          title: '¡Actualizada!',
          text: `La familia "${title.trim()}" se guardó correctamente`,
          icon: 'success',
          confirmButtonColor: '#5869e9',
        })
      } else {
        await APIs.createCategory(familiaData, token)
        await Swal.fire({
          title: '¡Creada!',
          text: `La familia "${title.trim()}" se creó correctamente`,
          icon: 'success',
          confirmButtonColor: '#5869e9',
        })
      }

      closeModal()
      onSaved?.()
    } catch (error: any) {
      console.error('Error:', error)
      Swal.fire({
        title: 'Error',
        text: error?.response?.data?.message ?? error?.message ?? 'No se pudo guardar la familia',
        icon: 'error',
        confirmButtonColor: '#5869e9',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const submitLabel = isSaving
    ? isUpdate
      ? 'Actualizando...'
      : 'Creando...'
    : isUpdate
      ? 'Actualizar Familia'
      : 'Crear Familia'

  return (
    <div className='modal__overlay' onClick={closeModal}>
      <div className='modal__container' onClick={(e) => e.stopPropagation()}>
        <div className='modal__header'>
          <h2>{isUpdate ? 'Editar Familia' : 'Crear Nueva Familia'}</h2>
          <button type='button' className='modal__close' onClick={closeModal} disabled={isSaving}>
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`modal__form ${isSaving ? 'familias-modal__form--saving' : ''}`}
        >
          <div className={`form__group familias-modal__stores ${isSaving ? 'familias-modal__field--locked' : ''}`}>
            <div className='familias-store-picker'>
              <div className='familias-store-picker__row'>
                <CategoriesStorePicker
                  variant='modal'
                  branchId={branchId}
                  onBranchIdChange={(id) => {
                    setBranchId(id)
                    localStorage.setItem('categories-store-id', String(id))
                  }}
                />
              </div>
            </div>
          </div>

          <div className='familias-modal__row'>
            <div className='form__group'>
              <label className='form__label'>
                Nombre de la Familia <span className='required'>*</span>
              </label>
              <input
                type='text'
                className='inputs__general'
                placeholder='Ej: Ropa, Calzado, Servicios'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            <div className='form__group'>
              <label className='form__label'>Tipo de Items Permitidos</label>
              <select
                className='inputs__general'
                value={allowedItemType}
                onChange={(e) => setAllowedItemType(e.target.value)}
                disabled={isSaving}
              >
                <option value='both'>Ambos (Artículos y Servicios)</option>
                <option value='ARTICLE'>Solo Artículos</option>
                <option value='SERVICE'>Solo Servicios</option>
              </select>
            </div>

            <div className='form__group familias-modal__status-group'>
              <label className='form__label'>Estado</label>
              <label className='switch'>
                <input
                  type='checkbox'
                  checked={status === 'ACTIVE'}
                  onChange={(e) => setStatus(e.target.checked ? 'ACTIVE' : 'INACTIVE')}
                  disabled={isSaving}
                />
                <span className='slider' />
              </label>
            </div>
          </div>

          <div className='form__group'>
            <label className='form__label'>Descripción</label>
            <textarea
              className='inputs__general'
              placeholder='Descripción de la familia (opcional)'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              rows={3}
            />
          </div>

          <div className='form__group'>
            <label className='form__label'>Imagen</label>
            <input
              type='file'
              className='inputs__general'
              accept='image/*'
              onChange={handleImageChange}
              disabled={isSaving}
            />
            {imagePreview && (
              <div className='image__preview'>
                <img src={imagePreview} alt='Preview' />
              </div>
            )}
          </div>

          <div className='modal__actions'>
            <button type='button' className='btn__general-danger' onClick={closeModal} disabled={isSaving}>
              Cancelar
            </button>
            <button type='submit' className='btn__general-purple familias-modal__btn-submit' disabled={isSaving}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalFamilias
