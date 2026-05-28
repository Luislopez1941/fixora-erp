import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import { setArticles, updateArticles } from '../../../../../redux/state/Articles'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId } from '../../../../../constants/category'
import CategoriesStorePicker from '../../categories/CategoriesStorePicker'
import { Variation } from '../VariationsManager'
import IOSSwitch from '../shared/IOSSwitch'
import ImagePickerModal from '../shared/ImagePickerModal'
import PriceRangesManager from './PriceRangesManager'
import VariationsModal from './VariationsModal'
import TempPriceRangesModal from './TempPriceRangesModal'
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
  const articlesUpdate = useSelector((state: any) => state.articles.articlesUpdate)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [code, setCode] = useState('')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [availableCategories, setAvailableCategories] = useState<any[]>([])
  const [variations, setVariations] = useState<Variation[]>([])
  const [includesIVA, setIncludesIVA] = useState(false)
  const [isBreakdown, setIsBreakdown] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [imagePickerOpen, setImagePickerOpen] = useState(false)
  const [priceRangesOpen, setPriceRangesOpen] = useState(false)
  const [currentItemId, setCurrentItemId] = useState<number | null>(null)
  const [tempPriceRanges, setTempPriceRanges] = useState<Array<{minQuantity: number, maxQuantity: number | null, price: number}>>([])
  const [variationsModalOpen, setVariationsModalOpen] = useState(false)

  const token = localStorage.getItem('token-eco')
  const isCreate = modalState === 'articles-modal'

  const closeModal = () => {
    dispatch(modal(''))
    dispatch(updateArticles('reset'))
    setImagePickerOpen(false)
  }

  useEffect(() => {
    if (modalState === 'articles-modal') {
      setName('')
      setDescription('')
      setCode('')
      setBranchId(readCategoryBranchId())
      setCategoryId(null)
      setVariations([])
      setIncludesIVA(false)
      setIsBreakdown(false)
      setImages([])
      setImagePickerOpen(false)
      setTempPriceRanges([])
      loadCategories(readCategoryBranchId())
    }
  }, [modalState])

  useEffect(() => {
    if (modalState === 'articles-modal-update') {
      const u = articlesUpdate
      if (!u || typeof u !== 'object') return
      setName(String(u.name ?? ''))
      setDescription(String(u.description ?? ''))
      setCode(String(u.code ?? ''))
      const parsedBranchId = Number(u.branchId ?? u.storeId ?? readCategoryBranchId())
      const currentBranchId = !Number.isNaN(parsedBranchId) ? parsedBranchId : readCategoryBranchId()
      setBranchId(currentBranchId)
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
      setCurrentItemId(u.id ?? null)
      loadCategories(currentBranchId)
    }
  }, [modalState, articlesUpdate])

  useEffect(() => {
    if (modalState !== 'articles-modal' && modalState !== 'articles-modal-update') return
    loadCategories(branchId)
  }, [branchId, modalState])

  const loadCategories = async (selectedBranchId: number) => {
    try {
      const res: any = await APIs.getCategoryOptions(selectedBranchId, token as string)
      setAvailableCategories(Array.isArray(res) ? res : [])
    } catch (err) {
      console.error('Error loading categories:', err)
      setAvailableCategories([])
    }
  }

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

    // Obtener companyId del localStorage
    const companyId = Number(localStorage.getItem('categories-picker-company-id'))
    
    if (!companyId || Number.isNaN(companyId)) {
      alert('No se ha seleccionado una empresa. Por favor selecciona una empresa primero.')
      return
    }

    // Agrupar variaciones por color para enviar formato optimizado
    const groupedVariations = variations.reduce((acc: any[], variation: any) => {
      const existing = acc.find(v => v.color === variation.color)
      if (existing) {
        // Agregar talla al grupo existente
        if (!existing.sizes.includes(variation.size)) {
          existing.sizes.push(variation.size)
        }
      } else {
        // Crear nuevo grupo de color
        acc.push({
          color: variation.color,
          colorHex: variation.colorHex,
          sizes: [variation.size],
          sku: variation.sku,
          images: variation.images
        })
      }
      return acc
    }, [])

    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim(),
      code: code.trim(),
      type: 'ARTICLE',
      variations: groupedVariations,
      includesIVA,
      isBreakdown,
      images,
      companyId,
      branchId: branchId && branchId > 0 ? branchId : undefined,
    }
    if (categoryId != null) {
      body.categoryId = categoryId
    }
    if (isCreate && tempPriceRanges.length > 0) {
      body.priceRanges = tempPriceRanges
    }

    try {
      if (isCreate) {
        await APIs.createItem(body, token)
        alert('Artículo creado')
      } else {
        await APIs.updateItem(articlesUpdate.id, body, token)
        alert('Artículo actualizado')
      }
      const result: any = await APIs.getItemList(token)
      const list = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : []
      const filtered = list.filter((item: any) => item.type === 'ARTICLE')
      dispatch(setArticles(filtered))
      closeModal()
    } catch (err: any) {
      alert('Error: ' + (err?.response?.data?.message ?? err?.message))
    }
  }

  if (modalState !== 'articles-modal' && modalState !== 'articles-modal-update') {
    return null
  }

  return (
    <>
      <div className={`overlay__articles__modal ${modalState === 'articles-modal' || modalState === 'articles-modal-update' ? 'active' : ''}`}>
        <div className={`popup__articles__modal ${modalState === 'articles-modal' || modalState === 'articles-modal-update' ? 'active' : ''}`}>
          <div className='header__modal'>
            <a
              href='#close'
              className='btn-cerrar-popup__articles__modal'
              onClick={(e) => {
                e.preventDefault()
                closeModal()
              }}
            >
              ×
            </a>
            <p className='title__modals'>{isCreate ? 'Nuevo artículo' : 'Editar artículo'}</p>
          </div>
          <form className='articles__modal' onSubmit={handleSubmit}>
            <div className='articles__modal_container'>
              <div className='articles__modal_field articles__modal_field--full article-modal__stores'>
                <div className='article-store-picker'>
                  <CategoriesStorePicker
                    variant='modal'
                    branchId={branchId}
                    onBranchIdChange={(id) => {
                      setBranchId(id)
                      localStorage.setItem('categories-store-id', String(id))
                    }}
                  />
                </div>
                <p className='article-modal__store-hint'>El artículo se guardará en la sucursal seleccionada.</p>
              </div>

              <div className='articles__modal_row articles__modal_row--main'>
                <div className='articles__modal_field'>
                  <label className='label__general'>Código</label>
                  <input
                    className='inputs__general'
                    type='text'
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder='Código del artículo'
                  />
                </div>
                <div className='articles__modal_field'>
                  <label className='label__general'>Nombre</label>
                  <input
                    className='inputs__general'
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='Nombre del artículo'
                  />
                </div>
                <div className='articles__modal_field'>
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
              </div>

              <div className='articles__modal_field articles__modal_field--full'>
                <label className='label__general'>Descripción</label>
                <textarea
                  className='inputs__general'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Descripción del artículo'
                  rows={3}
                />
              </div>

              <div className='articles__modal_field articles__modal_field--full catalog-modal__images'>
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
                  <button
                    type='button'
                    className='btn__general-purple article-modal__upload-btn'
                    onClick={() => setImagePickerOpen(true)}
                  >
                    <span className='material-symbols-rounded article-modal__upload-icon' aria-hidden>
                      add_photo_alternate
                    </span>
                    <span>{images.length > 0 ? 'Gestionar imágenes' : 'Subir imágenes'}</span>
                  </button>
                  {images.length > 0 ? (
                    <span className='catalog-modal__images-count'>{images.length} imagen{images.length === 1 ? '' : 'es'}</span>
                  ) : null}
                </div>
                <p className='article-modal__images-hint'>Formatos recomendados: JPG/PNG. Puedes cargar varias imágenes.</p>
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

              <div className='articles__modal_field articles__modal_field--full'>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type='button'
                    className='btn__general-purple article-modal__action-btn'
                    onClick={() => setVariationsModalOpen(true)}
                  >
                    <span className='material-symbols-rounded article-modal__action-icon' aria-hidden>
                      palette
                    </span>
                    <span>Variaciones {variations.length > 0 && `(${variations.length})`}</span>
                  </button>
                  <button
                    type='button'
                    className='btn__general-orange article-modal__action-btn'
                    onClick={() => setPriceRangesOpen(true)}
                  >
                    <span className='material-symbols-rounded article-modal__action-icon' aria-hidden>
                      toll
                    </span>
                    <span>Rangos de Precio {tempPriceRanges.length > 0 && `(${tempPriceRanges.length})`}</span>
                  </button>
                </div>
              </div>

              <div className='articles__modal_actions'>
                <button className='btn__general-purple' type='submit'>
                  {isCreate ? 'Crear artículo' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ImagePickerModal
        open={imagePickerOpen}
        title='Imágenes del artículo'
        images={images}
        onChange={setImages}
        onClose={() => setImagePickerOpen(false)}
      />

      {!isCreate && priceRangesOpen && currentItemId && (
        <PriceRangesManager
          itemId={currentItemId}
          onClose={() => setPriceRangesOpen(false)}
        />
      )}

      <VariationsModal 
        variations={variations} 
        onChange={setVariations}
        isOpen={variationsModalOpen}
        onClose={() => setVariationsModalOpen(false)}
      />

      {priceRangesOpen && isCreate && (
        <TempPriceRangesModal
          ranges={tempPriceRanges}
          onChange={setTempPriceRanges}
          onClose={() => setPriceRangesOpen(false)}
        />
      )}
    </>
  )
}

export default Modal
