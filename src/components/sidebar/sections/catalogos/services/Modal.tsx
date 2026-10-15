import { createPortal } from 'react-dom'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import { setServices, updateServices } from '../../../../../redux/state/Services'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId } from '../../../../../constants/category'
import CategoriesStorePicker from '../categories/CategoriesStorePicker'
import BranchAvailabilityPicker from '../shared/BranchAvailabilityPicker'
import VariationsManager, { Variation } from '../VariationsManager'
import IOSSwitch from '../shared/IOSSwitch'
import ImagePickerModal from '../shared/ImagePickerModal'
import '../shared/IOSSwitch.css'
import '../shared/ImagePickerModal.css'
import './Modal.css'

const normalizeImages = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string' && item.trim())
  }
  if (typeof value === 'string' && value.trim()) {
    return [value]
  }
  return []
}

const Modal = () => {
  const dispatch = useDispatch()
  const modalState = useSelector((state: any) => state.modals)
  const servicesUpdate = useSelector((state: any) => state.services.servicesUpdate)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [code, setCode] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [availableCategories, setAvailableCategories] = useState<any[]>([])
  const [variations, setVariations] = useState<Variation[]>([])
  const [includesIVA, setIncludesIVA] = useState(false)
  const [isBreakdown, setIsBreakdown] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [imagePickerOpen, setImagePickerOpen] = useState(false)
  const [tab, setTab] = useState<'info' | 'company'>('info')
  const [companyId, setCompanyId] = useState<number | null>(() => {
    const id = Number(localStorage.getItem('categories-picker-company-id'))
    return !Number.isNaN(id) && id > 0 ? id : null
  })
  const [serviceBranchIds, setServiceBranchIds] = useState<number[] | null>(null)
  const [companyBranchIds, setCompanyBranchIds] = useState<number[]>([])
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())

  const token = localStorage.getItem('token-fixora')
  const isCreate = modalState === 'services-modal'

  const closeModal = () => {
    dispatch(modal(''))
    dispatch(updateServices('reset'))
    setImagePickerOpen(false)
  }

  useEffect(() => {
    if (modalState === 'services-modal') {
      setName('')
      setDescription('')
      setCode('')
      setCategoryId(null)
      setVariations([])
      setIncludesIVA(false)
      setIsBreakdown(false)
      setImages([])
      setImagePickerOpen(false)
      setTab('info')
      setServiceBranchIds(null)
      loadCategories()
    }
  }, [modalState])

  useEffect(() => {
    if (modalState === 'services-modal-update') {
      const u = servicesUpdate
      if (!u || typeof u !== 'object') return
      setName(String(u.name ?? ''))
      setDescription(String(u.description ?? ''))
      setCode(String(u.code ?? ''))
      setCategoryId(u.categoryId ?? u.category?.id ?? null)
      
      // Normalizar variaciones: soportar itemVariations o variations
      const vars = Array.isArray(u.itemVariations) 
        ? u.itemVariations 
        : Array.isArray(u.variations) 
        ? u.variations 
        : []
      setVariations(vars)
      
      setIncludesIVA(Boolean(u.includesIVA))
      setIsBreakdown(Boolean(u.isBreakdown))
      setImages(normalizeImages(u.images))
      setTab('info')
      if (u.companyId != null) setCompanyId(Number(u.companyId))
      const enabled = (u.branchItems ?? []).filter((b: any) => b.enabled).map((b: any) => Number(b.branchId))
      setServiceBranchIds(enabled.length > 0 ? enabled : null)
      loadCategories()
    }
  }, [modalState, servicesUpdate])

  // Solo categorías disponibles en TODAS las sucursales donde se ofrece el servicio
  const loadCategories = async () => {
    try {
      const effective = serviceBranchIds ?? companyBranchIds
      const res: any = await APIs.getCategoryOptions(undefined, token as string, undefined, effective)
      setAvailableCategories(Array.isArray(res) ? res : [])
    } catch (err) {
      console.error('Error loading categories:', err)
      setAvailableCategories([])
    }
  }

  useEffect(() => {
    if (modalState === 'services-modal' || modalState === 'services-modal-update') loadCategories()
  }, [serviceBranchIds, companyBranchIds])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!token) {
      alert('No hay token de autenticación')
      return
    }

    if (!name.trim()) {
      alert('El nombre es obligatorio')
      return
    }

    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim(),
      code: code.trim(),
      type: 'SERVICE',
      variations,
      includesIVA,
      isBreakdown,
      images,
      // El servicio es de la empresa; aquí se indica en qué sucursales se ofrece
      companyId: companyId ?? undefined,
      branchIds: serviceBranchIds ?? undefined,
    }
    if (categoryId != null) {
      body.categoryId = categoryId
    }

    try {
      if (isCreate) {
        await APIs.createItem(body, token)
        alert('Servicio creado')
      } else {
        await APIs.updateItem(servicesUpdate.id, body, token)
        alert('Servicio actualizado')
      }
      const result: any = await APIs.getItemList(token)
      const list = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : []
      const filtered = list.filter((item: any) => item.type === 'SERVICE')
      dispatch(setServices(filtered))
      closeModal()
    } catch (err: any) {
      alert('Error: ' + (err?.response?.data?.message ?? err?.message))
    }
  }

  if (modalState !== 'services-modal' && modalState !== 'services-modal-update') {
    return null
  }

  return (
    <>
      {createPortal(
      <div className={`services_modal__overlay ${modalState === 'services-modal' || modalState === 'services-modal-update' ? 'active' : ''}`}>
        <div className={`services_modal__popup ${modalState === 'services-modal' || modalState === 'services-modal-update' ? 'active' : ''}`}>
          <div className='services_modal__header'>
            <a
              href='#close'
              className='services_modal__close'
              onClick={(e) => {
                e.preventDefault()
                closeModal()
              }}
            >
              <span className='material-symbols-rounded'>close</span>
            </a>
            <p className='services_modal__title'>{isCreate ? 'Nuevo servicio' : 'Editar servicio'}</p>
          </div>
          <div className='services_modal-tabs' role='tablist'>
            <button type='button' role='tab' aria-selected={tab === 'info'} className={`services_modal-tab ${tab === 'info' ? 'services_modal-tab--active' : ''}`} onClick={() => setTab('info')}>
              Información
            </button>
            <button type='button' role='tab' aria-selected={tab === 'company'} className={`services_modal-tab ${tab === 'company' ? 'services_modal-tab--active' : ''}`} onClick={() => setTab('company')}>
              Empresa y sucursales
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className='services_modal__body'>
              <div className='services_modal__tabpane' hidden={tab !== 'info'}>
              <div className='services_modal__field'>
                <label className='label__general'>Nombre</label>
                <input
                  className='inputs__general'
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Nombre del servicio'
                />
              </div>
              <div className='services_modal__field'>
                <label className='label__general'>Descripción</label>
                <textarea
                  className='inputs__general'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Descripción del servicio'
                  rows={3}
                />
              </div>
              <div className='services_modal__field'>
                <label className='label__general'>Código</label>
                <input
                  className='inputs__general'
                  type='text'
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder='Código del servicio'
                />
              </div>
              <div className='services_modal__field'>
                <label className='label__general'>Categoría</label>
                <select
                  className='inputs__general'
                  value={categoryId ?? ''}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Sin categoría</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className='catalog-modal__images'>
                <label className='label__general'>Imágenes</label>
                <div className='catalog-modal__images-preview'>
                  {images.length > 0 ? (
                    images.slice(0, 6).map((src, index) => (
                      <img
                        key={`${index}-${src.slice(0, 20)}`}
                        src={src}
                        alt={`Vista ${index + 1}`}
                        className='catalog-modal__images-preview-thumb'
                      />
                    ))
                  ) : (
                    <span className='catalog-modal__images-empty'>Sin imágenes cargadas</span>
                  )}
                </div>
                <div className='catalog-modal__images-actions'>
                  <button type='button' className='btn__general-purple' onClick={() => setImagePickerOpen(true)}>
                    Subir / ver imágenes
                  </button>
                  {images.length > 0 ? (
                    <span className='catalog-modal__images-count'>{images.length} imagen{images.length === 1 ? '' : 'es'}</span>
                  ) : null}
                </div>
              </div>

              <div className='catalog-modal__switches'>
                <div className='catalog-modal__switch-row'>
                  <span>Incluye IVA</span>
                  <IOSSwitch checked={includesIVA} onChange={setIncludesIVA} ariaLabel='Incluye IVA' />
                </div>
                <div className='catalog-modal__switch-row'>
                  <span>Desglose de IVA</span>
                  <IOSSwitch checked={isBreakdown} onChange={setIsBreakdown} ariaLabel='Desglose de IVA' />
                </div>
              </div>

              <div className='services_modal__field'>
                <VariationsManager variations={variations} onChange={setVariations} />
              </div>
              </div>
              <div className='services_modal__tabpane' hidden={tab !== 'company'}>
                <div className='services_modal__field'>
                  <label className='label__general'>Empresa</label>
                  <CategoriesStorePicker
                    variant='modal'
                    companyOnly
                    branchId={branchId}
                    onBranchIdChange={setBranchId}
                    onCompanyIdChange={(id) => {
                      setCompanyId(id)
                      localStorage.setItem('categories-picker-company-id', String(id))
                    }}
                  />
                </div>
                <BranchAvailabilityPicker companyId={companyId} value={serviceBranchIds} onChange={setServiceBranchIds} onBranchesLoaded={setCompanyBranchIds} title='Disponible en sucursales' hint='La categoría solo muestra lo disponible en todas las sucursales marcadas.' />
              </div>
              <div className='services_modal__actions'>
                <button className='btn__general-primary' type='submit'>
                  {isCreate ? 'Crear servicio' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>,
        document.body
      )}

      <ImagePickerModal
        open={imagePickerOpen}
        title='Imágenes del servicio'
        images={images}
        onChange={setImages}
        onClose={() => setImagePickerOpen(false)}
      />
    </>
  )
}

export default Modal
