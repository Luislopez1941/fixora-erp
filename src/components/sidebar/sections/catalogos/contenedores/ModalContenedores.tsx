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

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [branchId, setBranchId] = useState(readCategoryBranchId)
  const [parentId, setParentId] = useState('')
  const [image, setImage] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [isSaving, setIsSaving] = useState(false)

  const isOpen = modalState === 'contenedores-modal' || modalState === 'contenedores-modal-update'
  const isUpdate = modalState === 'contenedores-modal-update'

  useEffect(() => {
    if (!isOpen) {
      setTitle('')
      setDescription('')
      setBranchId(readCategoryBranchId())
      setParentId('')
      setImage('')
      setImagePreview('')
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

    const pid = selectedContenedor.parentId ?? selectedContenedor.parent?.id
    setParentId(pid != null ? String(pid) : '')

    const parsedBranchId = Number(
      selectedContenedor.branchId ?? selectedContenedor.storeId ?? readCategoryBranchId()
    )
    setBranchId(!Number.isNaN(parsedBranchId) ? parsedBranchId : readCategoryBranchId())
  }, [modalState, selectedContenedor])

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
        await APIs.patchCategory(id, contenedorData, token)
        await Swal.fire({
          title: '¡Actualizado!',
          text: `El contenedor "${title.trim()}" se guardó correctamente`,
          icon: 'success',
          confirmButtonColor: '#5869e9',
        })
      } else {
        await APIs.createCategory(contenedorData, token)
        await Swal.fire({
          title: '¡Creado!',
          text: `El contenedor "${title.trim()}" se creó correctamente`,
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
        text: error?.response?.data?.message ?? error?.message ?? 'No se pudo guardar el contenedor',
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
