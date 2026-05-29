import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import { AppStore } from '../../../../../redux/store'
import { categoryId, readCategoryBranchId } from '../../../../../constants/category'
import CategoriesStorePicker from '../../categories/CategoriesStorePicker'
import APIs from '../../../../../services/APIs'
import './Contenedores.css'

interface ModalContenedoresProps {
  familias: any[]
  selectedContenedor?: any
  onSaved?: () => void
}

const ModalContenedores: React.FC<ModalContenedoresProps> = ({
  familias,
  selectedContenedor,
  onSaved,
}) => {
  const dispatch = useDispatch()
  const modalState = useSelector((store: AppStore) => store.modals as unknown as string)

  const LS_COMPANY = 'categories-picker-company-id'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [branchId, setBranchId] = useState(readCategoryBranchId)
  const [companyId, setCompanyId] = useState<number | null>(() => {
    const saved = localStorage.getItem(LS_COMPANY)
    return saved ? Number(saved) : null
  })
  const [parentId, setParentId] = useState('')
  const [image, setImage] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [imageName, setImageName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState('ACTIVE')
  const [isSaving, setIsSaving] = useState(false)

  const isOpen = modalState === 'contenedores-modal' || modalState === 'contenedores-modal-update'
  const isUpdate = modalState === 'contenedores-modal-update'

  useEffect(() => {
    if (!isOpen) {
      setTitle('')
      setDescription('')
      setBranchId(readCategoryBranchId())
      const savedCo = localStorage.getItem(LS_COMPANY)
      setCompanyId(savedCo ? Number(savedCo) : null)
      setParentId('')
      setImage('')
      setImagePreview('')
      setImageName('')
      setStatus('ACTIVE')
      setIsSaving(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (modalState === 'contenedores-modal') {
      setBranchId(readCategoryBranchId())
      if (familias.length === 1) {
        setParentId(String(familias[0].id))
      }
    }
  }, [modalState, familias])

  useEffect(() => {
    if (modalState !== 'contenedores-modal-update' || !selectedContenedor) return

    setTitle(String(selectedContenedor.title ?? ''))
    setDescription(String(selectedContenedor.description ?? ''))
    setStatus(selectedContenedor.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')

    const imageValue = String(selectedContenedor.image ?? '')
    setImage(imageValue)
    setImagePreview(imageValue)
    setImageName('')

    const pid = selectedContenedor.parentId ?? selectedContenedor.parent?.id
    setParentId(pid != null ? String(pid) : '')

    const parsedBranchId = Number(
      selectedContenedor.branchId ?? selectedContenedor.storeId ?? readCategoryBranchId()
    )
    setBranchId(!Number.isNaN(parsedBranchId) ? parsedBranchId : readCategoryBranchId())
    const parsedCompanyId = Number(
      selectedContenedor.branch?.companyId ?? localStorage.getItem(LS_COMPANY)
    )
    setCompanyId(!Number.isNaN(parsedCompanyId) && parsedCompanyId > 0 ? parsedCompanyId : null)
  }, [modalState, selectedContenedor])

  const closeModal = () => {
    if (isSaving) return
    dispatch(modal(''))
  }

  const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Solo se permiten imágenes (JPG, PNG, GIF, WebP).'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'La imagen no debe superar los 2MB.'
    }
    return null
  }

  const processFile = (file: File) => {
    const error = validateFile(file)
    if (error) {
      Swal.fire({ title: 'Archivo no válido', text: error, icon: 'warning', confirmButtonColor: '#5869e9' })
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setImage(base64)
      setImagePreview(base64)
      setImageName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSaving) return
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
    e.target.value = ''
  }

  const handleRemoveImage = () => {
    setImage('')
    setImagePreview('')
    setImageName('')
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (isSaving) return
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    processFile(file)
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
        text: 'El nombre del contenedor es obligatorio',
        icon: 'warning',
        confirmButtonColor: '#5869e9',
      })
      return
    }

    if (!parentId) {
      Swal.fire({
        title: 'Validación',
        text: 'Debes seleccionar una familia padre',
        icon: 'warning',
        confirmButtonColor: '#5869e9',
      })
      return
    }

    const bid = Number(branchId)
    const contenedorData: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || null,
      level: 2,
      type: 'CONTENEDOR',
      parentId: Number(parentId),
      image: image || null,
      status,
    }
    if (!Number.isNaN(bid) && bid >= 1) {
      contenedorData.branchId = bid
    }

    setIsSaving(true)
    try {
      let response: any

      if (isUpdate) {
        const id = categoryId(selectedContenedor ?? {})
        if (id == null) {
          Swal.fire({
            title: 'Error',
            text: 'No se encontró el ID del contenedor a actualizar',
            icon: 'error',
            confirmButtonColor: '#5869e9',
          })
          return
        }
        response = await APIs.patchCategory(id, contenedorData, token)
      } else {
        response = await APIs.createCategory(contenedorData, token)
      }

      // Manejar respuesta envuelta { status, message, data }
      let backendMessage = ''
      let effectiveResponse = response

      if (response && typeof response === 'object' && 'data' in response && !('status' in response)) {
        effectiveResponse = response.data
      }

      if (effectiveResponse && typeof effectiveResponse === 'object' && 'status' in effectiveResponse) {
        if (effectiveResponse.status !== 'success') {
          throw new Error(effectiveResponse.message ?? 'Error al guardar el contenedor')
        }
        backendMessage = effectiveResponse.message ?? ''
      }

      // Quitar estado de carga INMEDIATAMENTE
      setIsSaving(false)

      // Cerrar modal primero para evitar que tape el Swal
      closeModal()

      // Mostrar Swal DESPUÉS de cerrar el modal
      Swal.fire({
        title: isUpdate ? '¡Actualizado!' : '¡Creado!',
        text: backendMessage || `El contenedor "${title.trim()}" se ${isUpdate ? 'actualizó' : 'creó'} correctamente`,
        icon: 'success',
        confirmButtonColor: '#5869e9',
      }).then(() => {
        onSaved?.()
      })
    } catch (error: any) {
      console.error('Error en catch:', error)

      // Quitar estado de carga inmediatamente también en error
      setIsSaving(false)

      const msg = error?.message ?? error?.response?.data?.message ?? 'No se pudo guardar el contenedor'
      Swal.fire({
        title: 'Error',
        text: msg,
        icon: 'error',
        confirmButtonColor: '#5869e9',
      }).catch(() => {
        alert('Error: ' + msg)
      })
    }
  }

  if (!isOpen) return null

  const submitLabel = isSaving
    ? isUpdate
      ? 'Actualizando...'
      : 'Creando...'
    : isUpdate
      ? 'Actualizar Contenedor'
      : 'Crear Contenedor'

  return (
    <div className='modal__overlay' onClick={closeModal}>
      <div className='modal__container' onClick={(e) => e.stopPropagation()}>
        <div className='modal__header'>
          <h2>{isUpdate ? 'Editar Contenedor' : 'Crear Nuevo Contenedor'}</h2>
          <button type='button' className='modal__close' onClick={closeModal} disabled={isSaving}>
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`modal__form ${isSaving ? 'contenedores-modal__form--saving' : ''}`}
        >
          <div className={`form__group contenedores-modal__stores ${isSaving ? 'contenedores-modal__field--locked' : ''}`}>
            <div className='contenedores-store-picker'>
              <div className='contenedores-store-picker__row'>
                <CategoriesStorePicker
                  variant='modal'
                  branchId={branchId}
                  onBranchIdChange={(id) => {
                    setBranchId(id)
                    localStorage.setItem('categories-store-id', String(id))
                  }}
                  onCompanyIdChange={(id) => {
                    setCompanyId(id)
                    localStorage.setItem(LS_COMPANY, String(id))
                  }}
                />
              </div>
            </div>
          </div>

          <div className='contenedores-modal__row'>
            <div className='form__group'>
              <label className='form__label'>
                Nombre del Contenedor <span className='required'>*</span>
              </label>
              <input
                type='text'
                className='inputs__general'
                placeholder='Ej: Hombre, Mujer, Niño'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            <div className='form__group'>
              <label className='form__label'>
                Familia <span className='required'>*</span>
              </label>
              <select
                className='inputs__general'
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                disabled={isSaving || familias.length === 0}
                required
              >
                <option value=''>Selecciona una familia</option>
                {familias.map((familia) => (
                  <option key={familia.id} value={String(familia.id)}>
                    {familia.title}
                  </option>
                ))}
              </select>
              {familias.length === 0 && (
                <p className='form__error'>No hay familias disponibles. Crea una familia primero.</p>
              )}
            </div>

            <div className='form__group contenedores-modal__status-group'>
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
              placeholder='Descripción del contenedor (opcional)'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              rows={3}
            />
          </div>

          <div className='form__group'>
            <label className='form__label'>Imagen</label>
            {!imagePreview ? (
              <div
                className={`image-upload__dropzone ${isDragging ? 'image-upload__dropzone--active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <svg xmlns='http://www.w3.org/2000/svg' height='32' width='32' viewBox='0 -960 960 960' fill='currentColor'>
                  <path d='M440-320v-326L336-542l-56-56 200-200 200 200-56 56-104-104v326h-80ZM200-120q-33 0-56.5-23.5T120-200v-120h80v120h560v-120h80v120q0 33-23.5 56.5T760-120H200Z'/>
                </svg>
                <p className='image-upload__text'>Arrastra una imagen aquí o haz clic para seleccionar</p>
                <p className='image-upload__hint'>JPG, PNG, GIF, WebP · Máx. 2MB</p>
                <input
                  type='file'
                  className='image-upload__input'
                  accept='image/*'
                  onChange={handleImageChange}
                  disabled={isSaving}
                />
              </div>
            ) : (
              <div className='image-upload__preview-wrap'>
                <div className='image-upload__preview'>
                  <img src={imagePreview} alt={imageName || 'Preview'} />
                </div>
                <div className='image-upload__info'>
                  <span className='image-upload__filename'>{imageName || 'Imagen seleccionada'}</span>
                  <button
                    type='button'
                    className='image-upload__remove'
                    onClick={handleRemoveImage}
                    disabled={isSaving}
                    title='Eliminar imagen'
                  >
                    <svg xmlns='http://www.w3.org/2000/svg' height='16' width='16' viewBox='0 -960 960 960' fill='currentColor'>
                      <path d='m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z'/>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className='modal__actions'>
            <button type='button' className='btn__general-danger' onClick={closeModal} disabled={isSaving}>
              Cancelar
            </button>
            <button
              type='submit'
              className='btn__general-purple contenedores-modal__btn-submit'
              disabled={isSaving || familias.length === 0}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalContenedores
