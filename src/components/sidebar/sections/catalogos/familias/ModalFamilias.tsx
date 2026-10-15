import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Swal from 'sweetalert2'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import { AppStore } from '../../../../../redux/store'
import { categoryId, readCategoryBranchId } from '../../../../../constants/category'
import BranchAvailabilityPicker from '../shared/BranchAvailabilityPicker'
import { loadCategoryAvailability, applyCategoryAvailability, confirmCategoryImpact } from '../shared/categoryAvailability'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
import APIs from '../../../../../services/APIs'
import IOSSwitch from '../shared/IOSSwitch'
import './ModalFamilias.css'

interface ModalFamiliasProps {
  selectedFamilia?: any
  onSaved?: () => void
}

const ModalFamilias: React.FC<ModalFamiliasProps> = ({ selectedFamilia, onSaved }) => {
  const dispatch = useDispatch()
  const modalState = useSelector((store: AppStore) => store.modals as unknown as string)

  const LS_COMPANY = 'categories-picker-company-id'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  // Sucursales donde está disponible la categoría (null = todas). La categoría es de la empresa.
  // Pestaña visible del modal: datos de la familia o empresa y sucursales
  const [tab, setTab] = useState<'info' | 'company'>('info')
  const [availBranchIds, setAvailBranchIds] = useState<number[] | null>(null)
  const [branchId, setBranchId] = useState(readCategoryBranchId)
  const [companyId, setCompanyId] = useState<number | null>(() => {
    const saved = localStorage.getItem(LS_COMPANY)
    return saved ? Number(saved) : null
  })
  const [allowedItemType, setAllowedItemType] = useState<string>('both')
  const [image, setImage] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [imageName, setImageName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState('ACTIVE')
  const [isSaving, setIsSaving] = useState(false)

  const isOpen = modalState === 'familias-modal' || modalState === 'familias-modal-update'
  const isUpdate = modalState === 'familias-modal-update'

  useEffect(() => {
    if (!isOpen) {
      setTitle('')
      setDescription('')
      setBranchId(readCategoryBranchId())
      const savedCo = localStorage.getItem(LS_COMPANY)
      setCompanyId(savedCo ? Number(savedCo) : null)
      setAllowedItemType('both')
      setImage('')
      setImagePreview('')
      setStatus('ACTIVE')
      setIsSaving(false)
      setAvailBranchIds(null)
      setTab('info')
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
    const parsedCompanyId = Number(
      selectedFamilia.companyId ?? selectedFamilia.branch?.companyId ?? localStorage.getItem(LS_COMPANY)
    )
    setCompanyId(!Number.isNaN(parsedCompanyId) && parsedCompanyId > 0 ? parsedCompanyId : null)
    const currentId = categoryId(selectedFamilia ?? {})
    if (currentId != null) {
      loadCategoryAvailability(currentId).then(setAvailBranchIds)
    }
  }, [modalState, selectedFamilia])

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
      Swal.fire({ title: 'Archivo no válido', text: error, icon: 'warning', confirmButtonColor: '#072a57' })
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
    const token = localStorage.getItem('token-fixora')
    if (!token) {
      Swal.fire({
        title: 'Sesión',
        text: 'No hay token de autenticación',
        icon: 'warning',
        confirmButtonColor: '#072a57',
      })
      return
    }

    if (!title.trim()) {
      Swal.fire({
        title: 'Validación',
        text: 'El nombre de la familia es obligatorio',
        icon: 'warning',
        confirmButtonColor: '#072a57',
      })
      return
    }

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
    // La categoría es de la EMPRESA; en qué sucursales se ofrece se indica aparte
    if (companyId) familiaData.companyId = companyId
    if (!isUpdate && availBranchIds) familiaData.branchIds = availBranchIds

    setIsSaving(true)
    try {
      let response: any

      if (isUpdate) {
        const id = categoryId(selectedFamilia ?? {})
        if (id == null) {
          Swal.fire({
            title: 'Error',
            text: 'No se encontró el ID de la familia a actualizar',
            icon: 'error',
            confirmButtonColor: '#072a57',
          })
          return
        }
        // Si se quitan sucursales, primero se muestra qué artículos dejarían de ofrecerse
        if (!(await confirmCategoryImpact(id, availBranchIds))) {
          setIsSaving(false)
          return
        }
        response = await APIs.patchCategory(id, familiaData, token)
        await applyCategoryAvailability(id, availBranchIds)
      } else {
        response = await APIs.createCategory(familiaData, token)
      }

      let backendMessage = ''
      let effectiveResponse = response

      if (response && typeof response === 'object' && 'data' in response && !('status' in response)) {
        effectiveResponse = response.data
      }

      if (effectiveResponse && typeof effectiveResponse === 'object' && 'status' in effectiveResponse) {
        if (effectiveResponse.status !== 'success') {
          throw new Error(effectiveResponse.message ?? 'Error al guardar la familia')
        }
        backendMessage = effectiveResponse.message ?? ''
      }

      setIsSaving(false)
      closeModal()

      Swal.fire({
        title: isUpdate ? '¡Actualizada!' : '¡Creada!',
        text: backendMessage || `La familia "${title.trim()}" se ${isUpdate ? 'actualizó' : 'creó'} correctamente`,
        icon: 'success',
        confirmButtonColor: '#072a57',
      }).then(() => {
        onSaved?.()
      })
    } catch (error: any) {
      console.error('Error en catch:', error)
      setIsSaving(false)
      const msg = error?.message ?? error?.response?.data?.message ?? 'No se pudo guardar la familia'
      Swal.fire({
        title: 'Error',
        text: msg,
        icon: 'error',
        confirmButtonColor: '#072a57',
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
      ? 'Actualizar Familia'
      : 'Crear Familia'

  // Portal al <body>: encima del sidebar y el header.
  return createPortal(
    <div className='modal-familias-overlay' onClick={closeModal}>
      <div className={`modal-familias-content ${isOpen ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className='modal-familias-header'>
          <h2>{isUpdate ? 'Editar Familia' : 'Crear Nueva Familia'}</h2>
          <button type='button' className='modal-familias-close' onClick={closeModal} disabled={isSaving}>
            ×
          </button>
        </div>

        <div className='modal-familias-tabs' role='tablist'>
          <button type='button' role='tab' aria-selected={tab === 'info'} className={`modal-familias-tab ${tab === 'info' ? 'modal-familias-tab--active' : ''}`} onClick={() => setTab('info')}>
            Información
          </button>
          <button type='button' role='tab' aria-selected={tab === 'company'} className={`modal-familias-tab ${tab === 'company' ? 'modal-familias-tab--active' : ''}`} onClick={() => setTab('company')}>
            Empresa y sucursales
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className='modal-familias-body'
          id='familias-form'
        >
          <div className='modal-familias-container'>
            <div className='modal-familias-tabpane' hidden={tab !== 'info'}>
            <div className='modal-familias-row'>
              <div className='modal-familias-field'>
                <label className='modal-familias-label'>
                  Nombre de la Familia <span className='modal-familias-required'>*</span>
                </label>
                <input
                  type='text'
                  className='modal-familias-input'
                  placeholder='Ej: Ropa, Calzado, Servicios'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              <div className='modal-familias-field'>
                <label className='modal-familias-label'>Tipo de Items Permitidos</label>
                <select
                  className='modal-familias-input'
                  value={allowedItemType}
                  onChange={(e) => setAllowedItemType(e.target.value)}
                  disabled={isSaving}
                >
                  <option value='both'>Ambos (Artículos y Servicios)</option>
                  <option value='ARTICLE'>Solo Artículos</option>
                  <option value='SERVICE'>Solo Servicios</option>
                </select>
              </div>

              <div className='modal-familias-field modal-familias-status-group'>
                <label className='modal-familias-label'>Estado</label>
                <IOSSwitch
                  checked={status === 'ACTIVE'}
                  onChange={(checked) => setStatus(checked ? 'ACTIVE' : 'INACTIVE')}
                  disabled={isSaving}
                  ariaLabel='Estado de la familia'
                />
              </div>
            </div>

            <div className='modal-familias-field modal-familias-field--full'>
              <label className='modal-familias-label'>Descripción</label>
              <textarea
                className='modal-familias-input'
                placeholder='Descripción de la familia (opcional)'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                rows={3}
              />
            </div>

          <div className='modal-familias-field modal-familias-field--full'>
            <label className='modal-familias-label'>Imagen</label>
            {!imagePreview ? (
              <div
                className={`modal-familias-image-dropzone ${isDragging ? 'modal-familias-image-dropzone--active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <svg xmlns='http://www.w3.org/2000/svg' height='32' width='32' viewBox='0 -960 960 960' fill='currentColor'>
                  <path d='M440-320v-326L336-542l-56-56 200-200 200 200-56 56-104-104v326h-80ZM200-120q-33 0-56.5-23.5T120-200v-120h80v120h560v-120h80v120q0 33-23.5 56.5T760-120H200Z'/>
                </svg>
                <p className='modal-familias-image-text'>Arrastra una imagen aquí o haz clic para seleccionar</p>
                <p className='modal-familias-image-hint'>JPG, PNG, GIF, WebP · Máx. 2MB</p>
                <input
                  type='file'
                  className='modal-familias-image-input'
                  accept='image/*'
                  onChange={handleImageChange}
                  disabled={isSaving}
                />
              </div>
            ) : (
              <div className='modal-familias-image-preview-wrap'>
                <div className='modal-familias-image-preview'>
                  <img src={imagePreview} alt={imageName || 'Preview'} />
                </div>
                <div className='modal-familias-image-info'>
                  <span className='modal-familias-image-filename'>{imageName || 'Imagen seleccionada'}</span>
                  <button
                    type='button'
                    className='modal-familias-image-remove'
                    onClick={handleRemoveImage}
                    disabled={isSaving}
                    title='Eliminar imagen'
                  >
                    <svg xmlns='http://www.w3.org/2000/svg' height='16' width='16' viewBox='0 -960 960 960' fill='currentColor'>
                      <path d='m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224-224 224Z'/>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>

            </div>
            <div className='modal-familias-tabpane' hidden={tab !== 'company'}>
            <div className='modal-familias-field modal-familias-field--full'>
              <div className='modal-familias-store-picker'>
                <div className='modal-familias-store-picker__row'>
                  <CategoriesStorePicker
                    variant='modal'
                    companyOnly
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
              <BranchAvailabilityPicker companyId={companyId} value={availBranchIds} onChange={setAvailBranchIds} title='Disponible en sucursales' />
            </div>
            </div>
          </div>
        </form>

        <div className='modal-familias-actions'>
          <button
            type='button'
            className='modal-familias-btn-cancel'
            onClick={closeModal}
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            type='submit'
            className='modal-familias-btn-submit'
            form='familias-form'
            disabled={isSaving}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ModalFamilias
