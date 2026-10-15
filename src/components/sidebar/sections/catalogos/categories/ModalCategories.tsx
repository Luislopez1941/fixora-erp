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
import './ModalCategories.css'

interface ModalCategoriesProps {
  familias: any[]
  categories: any[]
  selectedCategory?: any
  onSaved?: () => void
}

const ModalCategories: React.FC<ModalCategoriesProps> = ({
  familias,
  categories,
  selectedCategory,
  onSaved,
}) => {
  const dispatch = useDispatch()
  const modalState = useSelector((store: AppStore) => store.modals as unknown as string)

  const LS_COMPANY = 'categories-picker-company-id'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  // Sucursales donde está disponible la categoría (null = todas). La categoría es de la empresa.
  // Pestaña visible del modal: datos de la familia o empresa y sucursales
  const [tab, setTab] = useState<'info' | 'company'>('info')
  const [availBranchIds, setAvailBranchIds] = useState<number[] | null>(null)
  const [branchId, setBranchId] = useState(readCategoryBranchId())
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

  const isOpen = modalState === 'categories-modal' || modalState === 'categories-modal-update'
  const isUpdate = modalState === 'categories-modal-update'

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
      setAvailBranchIds(null)
      setTab('info')
    }
  }, [isOpen])

  useEffect(() => {
    if (modalState === 'categories-modal') {
      setBranchId(readCategoryBranchId())
      if (familias.length === 1) {
        setParentId(String(familias[0].id))
      }
    }
  }, [modalState, familias])

  useEffect(() => {
    if (modalState !== 'categories-modal-update' || !selectedCategory) return

    setTitle(String(selectedCategory.title ?? ''))
    setDescription(String(selectedCategory.description ?? ''))
    setStatus(selectedCategory.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')

    const imageValue = String(selectedCategory.image ?? '')
    setImage(imageValue)
    setImagePreview(imageValue)
    setImageName('')

    const pid = selectedCategory.parentId ?? selectedCategory.parent?.id
    setParentId(pid != null ? String(pid) : '')

    const parsedBranchId = Number(
      selectedCategory.branchId ?? selectedCategory.storeId ?? readCategoryBranchId()
    )
    setBranchId(!Number.isNaN(parsedBranchId) ? parsedBranchId : readCategoryBranchId())
    const parsedCompanyId = Number(
      selectedCategory.companyId ?? selectedCategory.branch?.companyId ?? localStorage.getItem(LS_COMPANY)
    )
    setCompanyId(!Number.isNaN(parsedCompanyId) && parsedCompanyId > 0 ? parsedCompanyId : null)
    const currentId = categoryId(selectedCategory ?? {})
    if (currentId != null) {
      loadCategoryAvailability(currentId).then(setAvailBranchIds)
    }
  }, [modalState, selectedCategory])

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
      Swal.fire({ title: 'Archivo no válido', text: error, icon: 'warning', confirmButtonColor: '#586ae9' })
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
        confirmButtonColor: '#586ae9',
      })
      return
    }

    if (!title.trim()) {
      Swal.fire({
        title: 'Validación',
        text: 'El nombre de la categoría es obligatorio',
        icon: 'warning',
        confirmButtonColor: '#586ae9',
      })
      return
    }

    if (!parentId) {
      Swal.fire({
        title: 'Validación',
        text: 'Debes seleccionar una familia o categoría padre',
        icon: 'warning',
        confirmButtonColor: '#586ae9',
      })
      return
    }


    let level = 2
    const parentCat = categories.find(c => String(c.id) === parentId)
    if (parentCat) {
      level = (parentCat.level ?? 2) + 1
    }

    const categoryData: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || null,
      level,
      type: 'CATEGORY',
      parentId: Number(parentId),
      image: image || null,
      status,
    }
    // La categoría es de la EMPRESA; en qué sucursales se ofrece se indica aparte
    if (companyId) categoryData.companyId = companyId
    if (!isUpdate && availBranchIds) categoryData.branchIds = availBranchIds

    setIsSaving(true)
    try {
      let response: any

      if (isUpdate) {
        const id = categoryId(selectedCategory ?? {})
        if (id == null) {
          Swal.fire({
            title: 'Error',
            text: 'No se encontró el ID de la categoría a actualizar',
            icon: 'error',
            confirmButtonColor: '#586ae9',
          })
          return
        }
        // Si se quitan sucursales, primero se muestra qué artículos dejarían de ofrecerse
        if (!(await confirmCategoryImpact(id, availBranchIds))) {
          setIsSaving(false)
          return
        }
        response = await APIs.patchCategory(id, categoryData, token)
        await applyCategoryAvailability(id, availBranchIds)
      } else {
        response = await APIs.createCategory(categoryData, token)
      }

      let backendMessage = ''
      let effectiveResponse = response

      if (response && typeof response === 'object' && 'data' in response && !('status' in response)) {
        effectiveResponse = response.data
      }

      if (effectiveResponse && typeof effectiveResponse === 'object' && 'status' in effectiveResponse) {
        if (effectiveResponse.status !== 'success') {
          throw new Error(effectiveResponse.message ?? 'Error al guardar la categoría')
        }
        backendMessage = effectiveResponse.message ?? ''
      }

      setIsSaving(false)
      closeModal()

      Swal.fire({
        title: isUpdate ? '¡Actualizada!' : '¡Creada!',
        text: backendMessage || `La categoría "${title.trim()}" se ${isUpdate ? 'actualizó' : 'creó'} correctamente`,
        icon: 'success',
        confirmButtonColor: '#586ae9',
      }).then(() => {
        onSaved?.()
      })
    } catch (error: any) {
      console.error('Error en catch:', error)
      setIsSaving(false)
      const msg = error?.message ?? error?.response?.data?.message ?? 'No se pudo guardar la categoría'
      Swal.fire({
        title: 'Error',
        text: msg,
        icon: 'error',
        confirmButtonColor: '#586ae9',
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
      ? 'Actualizar Categoría'
      : 'Crear Categoría'

  // Portal al <body>: encima del sidebar y el header.
  return createPortal(
    <div className='modal-categories-overlay' onClick={closeModal}>
      <div className={`modal-categories-content ${isOpen ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className='modal-categories-header'>
          <h2>{isUpdate ? 'Editar Categoría' : 'Crear Nueva Categoría'}</h2>
          <button type='button' className='modal-categories-close' onClick={closeModal} disabled={isSaving}>
            ×
          </button>
        </div>

        <div className='modal-categories-tabs' role='tablist'>
          <button type='button' role='tab' aria-selected={tab === 'info'} className={`modal-categories-tab ${tab === 'info' ? 'modal-categories-tab--active' : ''}`} onClick={() => setTab('info')}>
            Información
          </button>
          <button type='button' role='tab' aria-selected={tab === 'company'} className={`modal-categories-tab ${tab === 'company' ? 'modal-categories-tab--active' : ''}`} onClick={() => setTab('company')}>
            Empresa y sucursales
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`modal-categories-body ${isSaving ? 'categories-modal__form--saving' : ''}`}
        >
          <div className='modal-categories-container'>
            <div className='modal-categories-tabpane' hidden={tab !== 'info'}>
            <div className='modal-categories-row'>
              <div className='modal-categories-field'>
                <label className='modal-categories-label'>
                  Nombre de la Categoría <span className='required'>*</span>
                </label>
                <input
                  type='text'
                  className='inputs__general'
                  placeholder='Ej: Ropa de Invierno, Accesorios'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              <div className='modal-categories-field'>
                <label className='modal-categories-label'>
                  Familia / Categoría Padre <span className='required'>*</span>
                </label>
                <select
                  className='inputs__general'
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  disabled={isSaving || familias.length === 0}
                  required
                >
                  <option value=''>Selecciona el padre</option>
                  <optgroup label='Familias'>
                    {familias.map((familia) => (
                      <option key={familia.id} value={String(familia.id)}>
                        {familia.title}
                      </option>
                    ))}
                  </optgroup>
                  {categories.length > 0 && (
                    <optgroup label='Categorías'>
                      {categories.map((cat) => (
                        <option key={cat.id} value={String(cat.id)}>
                          {cat.title}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {familias.length === 0 && (
                  <p className='form__error'>No hay familias disponibles. Crea una familia primero.</p>
                )}
              </div>

              <div className='modal-categories-field modal-categories-status-group'>
                <label className='modal-categories-label'>Estado</label>
                <IOSSwitch
                  checked={status === 'ACTIVE'}
                  onChange={(checked) => setStatus(checked ? 'ACTIVE' : 'INACTIVE')}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className='modal-categories-field modal-categories-field--full'>
              <label className='modal-categories-label'>Descripción</label>
              <textarea
                className='inputs__general'
                placeholder='Descripción de la categoría (opcional)'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                rows={3}
              />
            </div>

            <div className='modal-categories-field modal-categories-field--full'>
              <label className='modal-categories-label'>Imagen</label>
              {!imagePreview ? (
                <div
                  className={`image-upload-dropzone ${isDragging ? 'image-upload-dropzone--active' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <svg xmlns='http://www.w3.org/2000/svg' height='32' width='32' viewBox='0 -960 960 960' fill='currentColor'>
                    <path d='M440-320v-326L336-542l-56-56 200-200 200 200-56 56-104-104v326h-80ZM200-120q-33 0-56.5-23.5T120-200v-120h80v120h560v-120h80v120q0 33-23.5 56.5T760-120H200Z'/>
                  </svg>
                  <p className='image-upload-text'>Arrastra una imagen aquí o haz clic para seleccionar</p>
                  <p className='image-upload-hint'>JPG, PNG, GIF, WebP · Máx. 2MB</p>
                  <input
                    type='file'
                    className='image-upload-input'
                    accept='image/*'
                    onChange={handleImageChange}
                    disabled={isSaving}
                  />
                </div>
              ) : (
                <div className='image-upload-preview-wrap'>
                  <div className='image-upload-preview'>
                    <img src={imagePreview} alt={imageName || 'Preview'} />
                  </div>
                  <div className='image-upload-info'>
                    <span className='image-upload-filename'>{imageName || 'Imagen seleccionada'}</span>
                    <button
                      type='button'
                      className='image-upload-remove'
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
            <div className='modal-categories-tabpane' hidden={tab !== 'company'}>
            <div className='modal-categories-field modal-categories-field--full'>
              <div className='modal-categories-store-picker'>
                <div className='modal-categories-store-picker__row'>
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

        <div className='modal-categories-actions'>
          <button type='button' className='btn-cancel' onClick={closeModal} disabled={isSaving}>
            Cancelar
          </button>
          <button
            type='submit'
            className='btn-submit'
            disabled={isSaving || familias.length === 0}
            onClick={handleSubmit}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ModalCategories
