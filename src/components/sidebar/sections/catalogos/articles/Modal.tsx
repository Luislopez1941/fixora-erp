import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import { setArticles, updateArticles } from '../../../../../redux/state/Articles'
import { PrivateRoutes } from '../../../../../models/routes'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId } from '../../../../../constants/category'
import CategoriesStorePicker from '../../categories/CategoriesStorePicker'
import Swal from 'sweetalert2'
import { Variation } from '../VariationsManager'
import IOSSwitch from '../shared/IOSSwitch'
import ImagePickerModal from '../shared/ImagePickerModal'
import PriceRangesManager from './PriceRangesManager'
import VariationsModal from './VariationsModal'
import WarehousesModal, { ArticleWarehouse } from './WarehousesModal'
import StockModal from './StockModal'
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

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem('categories-picker-company-id'))
  return !Number.isNaN(id) && id > 0 ? id : null
}

const PRODUCTION_AREAS_PATH = `/${PrivateRoutes.PRIVATE}/${PrivateRoutes.PRODUCTION}/${PrivateRoutes.PRODUCTION_AREAS}`
const CATALOG_AREAS_PATH = `/${PrivateRoutes.PRIVATE}/${PrivateRoutes.CATALOGOS}/${PrivateRoutes.CATALOGOS_AREAS_TYPES}`

const Modal = () => {
  const dispatch = useDispatch()
  const modalState = useSelector((state: any) => state.modals)
  const articlesUpdate = useSelector((state: any) => state.articles.articlesUpdate)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [code, setCode] = useState('')
  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [unitId, setUnitId] = useState<number | null>(null)
  const [availableCategories, setAvailableCategories] = useState<any[]>([])
  const [availableUnits, setAvailableUnits] = useState<any[]>([])
  const [variations, setVariations] = useState<Variation[]>([])
  const [includesIVA, setIncludesIVA] = useState(false)
  const [discountPercent, setDiscountPercent] = useState('0')
  const [isBreakdown, setIsBreakdown] = useState(false)
  const [trackInventory, setTrackInventory] = useState(true)
  const [productionAreas, setProductionAreas] = useState<any[]>([])
  const [productionRouteAreaIds, setProductionRouteAreaIds] = useState<number[]>([])
  const [routeAreaPicker, setRouteAreaPicker] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [imagePickerOpen, setImagePickerOpen] = useState(false)
  const [priceRangesOpen, setPriceRangesOpen] = useState(false)
  const [currentItemId, setCurrentItemId] = useState<number | null>(null)
  const [tempPriceRanges, setTempPriceRanges] = useState<Array<{minQuantity: number, maxQuantity: number | null, price: number}>>([])
  const [variationsModalOpen, setVariationsModalOpen] = useState(false)
  const [warehousesModalOpen, setWarehousesModalOpen] = useState(false)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [warehouses, setWarehouses] = useState<ArticleWarehouse[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const token = localStorage.getItem('token-eco')
  const isCreate = modalState === 'articles-modal'

  const closeModal = () => {
    if (isSaving) return
    dispatch(modal(''))
    dispatch(updateArticles('reset'))
    setImagePickerOpen(false)
    setStockModalOpen(false)
  }

  const openStockModal = () => {
    if (isCreate || !currentItemId) {
      Swal.fire({
        icon: 'info',
        title: 'Guarda primero',
        text: 'Guarda el artículo primero para consultar existencias.',
        confirmButtonColor: '#5869e9',
      })
      return
    }
    setStockModalOpen(true)
  }

  useEffect(() => {
    if (modalState === 'articles-modal') {
      setName('')
      setDescription('')
      setCode('')
      setCompanyId(readCompanyId())
      setBranchId(readCategoryBranchId())
      setCategoryId(null)
      setUnitId(null)
      setWarehouses([])
      setVariations([])
      setIncludesIVA(false)
      setDiscountPercent('0')
      setIsBreakdown(false)
      setTrackInventory(true)
      setProductionRouteAreaIds([])
      setRouteAreaPicker('')
      setImages([])
      setImagePickerOpen(false)
      setTempPriceRanges([])
      setCurrentItemId(null)
      setStockModalOpen(false)
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
      const linkedUnit =
        u.unitId ??
        u.productUnits?.find((pu: any) => pu.predetermined)?.unitId ??
        u.productUnits?.[0]?.unitId ??
        u.productUnits?.[0]?.unit?.id ??
        null
      setUnitId(linkedUnit != null ? Number(linkedUnit) : null)
      const linkedStores = (u.stores ?? u.productStores ?? [])
        .map((entry: any) => {
          const store = entry.store ?? entry
          return {
            id: Number(store.id ?? entry.storeId ?? entry.id),
            name: store.name ?? entry.name ?? '',
            branchName: store.branchName ?? entry.branchName ?? null,
            companyName: store.companyName ?? entry.companyName ?? null,
          }
        })
        .filter((store: ArticleWarehouse) => !Number.isNaN(store.id) && store.id > 0)
      setWarehouses(linkedStores)
      
      // Normalizar variaciones: soportar itemVariations o variations
      const vars = Array.isArray(u.itemVariations) 
        ? u.itemVariations 
        : Array.isArray(u.variations) 
        ? u.variations 
        : []
      setVariations(vars)
      
      setIncludesIVA(Boolean(u.includesIVA))
      setDiscountPercent(String(Number(u.discountPercent ?? 0) || 0))
      setIsBreakdown(Boolean(u.isBreakdown))
      setTrackInventory(u.trackInventory !== false)
      const routeIds = [...(u.productionRoutes ?? [])]
        .sort((a: any, b: any) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0))
        .map((route: any) => Number(route.areaId))
        .filter((id: number) => !Number.isNaN(id) && id > 0)
      setProductionRouteAreaIds(routeIds)
      setImages(normalizeImages(u.images))
      setCurrentItemId(u.id ?? null)
      setCompanyId(u.companyId != null ? Number(u.companyId) : readCompanyId())
    }
  }, [modalState, articlesUpdate])

  const loadProductionAreas = useCallback(async (selectedCompanyId: number, selectedBranchId: number) => {
    try {
      const response: any = await APIs.getAreas({
        companyId: selectedCompanyId,
        branchId: selectedBranchId > 0 ? selectedBranchId : undefined,
        production: true,
      })
      setProductionAreas(Array.isArray(response?.data) ? response.data : [])
    } catch {
      setProductionAreas([])
    }
  }, [])

  useEffect(() => {
    if (modalState !== 'articles-modal' && modalState !== 'articles-modal-update') return

    if (!companyId) {
      setAvailableCategories([])
      setAvailableUnits([])
      return
    }

    loadCategories(branchId)
    loadUnits(companyId, branchId, modalState === 'articles-modal')
    loadProductionAreas(companyId, branchId)
  }, [companyId, branchId, modalState, loadProductionAreas])

  useEffect(() => {
    if (modalState !== 'articles-modal' && modalState !== 'articles-modal-update') return
    if (!companyId) return

    const refreshAreasOnFocus = () => {
      if (document.visibilityState !== 'visible') return
      loadProductionAreas(companyId, branchId)
    }

    window.addEventListener('focus', refreshAreasOnFocus)
    document.addEventListener('visibilitychange', refreshAreasOnFocus)
    return () => {
      window.removeEventListener('focus', refreshAreasOnFocus)
      document.removeEventListener('visibilitychange', refreshAreasOnFocus)
    }
  }, [companyId, branchId, modalState, loadProductionAreas])

  const addRouteArea = () => {
    const areaId = Number(routeAreaPicker)
    if (!areaId || productionRouteAreaIds.includes(areaId)) return
    setProductionRouteAreaIds((prev) => [...prev, areaId])
    setRouteAreaPicker('')
  }

  const removeRouteArea = (areaId: number) => {
    setProductionRouteAreaIds((prev) => prev.filter((id) => id !== areaId))
  }

  const loadCategories = async (selectedBranchId: number) => {
    try {
      const res: any = await APIs.getCategoryOptions(selectedBranchId, token as string)
      const list = Array.isArray(res) ? res : []
      setAvailableCategories(list)
      setCategoryId((current) =>
        current != null && list.some((cat: any) => cat.id === current) ? current : null,
      )
    } catch (err) {
      console.error('Error loading categories:', err)
      setAvailableCategories([])
      setCategoryId(null)
    }
  }

  const loadUnits = async (
    selectedCompanyId: number,
    selectedBranchId: number,
    autoSelectDefault = false,
  ) => {
    try {
      const res: any = await APIs.getUnitOptions(
        {
          companyId: selectedCompanyId,
          branchId: selectedBranchId > 0 ? selectedBranchId : undefined,
        },
        token as string,
      )
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
      setAvailableUnits(list)

      setUnitId((current) => {
        if (current != null && list.some((unit: any) => unit.id === current)) {
          return current
        }
        if (autoSelectDefault && list.length > 0) {
          const defaultUnit = list.find((unit: any) => unit.predetermined) ?? list[0]
          return defaultUnit?.id != null ? Number(defaultUnit.id) : null
        }
        return null
      })
    } catch (err) {
      console.error('Error loading units:', err)
      setAvailableUnits([])
      setUnitId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'Sesión',
        text: 'No hay token de autenticación',
        confirmButtonColor: '#5869e9',
      })
      return
    }

    if (!name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El nombre es obligatorio',
        confirmButtonColor: '#5869e9',
      })
      return
    }

    // Obtener companyId del estado / picker
    if (!companyId || Number.isNaN(companyId)) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'No se ha seleccionado una empresa. Por favor selecciona una empresa primero.',
        confirmButtonColor: '#5869e9',
      })
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
      discountPercent: Math.min(100, Math.max(0, Number(discountPercent) || 0)),
      trackInventory,
      images,
      companyId,
      branchId: branchId > 0 ? branchId : null,
      categoryId,
      unitId,
      storeIds: warehouses.map((store) => store.id),
    }
    if (isCreate && tempPriceRanges.length > 0) {
      body.priceRanges = tempPriceRanges
    }

    setIsSaving(true)
    try {
      let itemId = currentItemId
      if (isCreate) {
        const created: any = await APIs.createItem(body, token)
        itemId = created?.data?.id ?? created?.id ?? null
      } else {
        await APIs.updateItem(articlesUpdate.id, body, token)
        itemId = articlesUpdate.id
      }

      if (itemId && !trackInventory) {
        await APIs.setItemProductionRoute(itemId, productionRouteAreaIds, token)
      } else if (itemId && trackInventory) {
        await APIs.setItemProductionRoute(itemId, [], token)
      }

      const result: any = await APIs.getItemList(token, {
        companyId: companyId ?? undefined,
        branchId: branchId > 0 ? branchId : undefined,
      })
      const list = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : []
      const filtered = list.filter((item: any) => item.type === 'ARTICLE')
      dispatch(setArticles(filtered))

      // Quitar estado de carga inmediatamente
      setIsSaving(false)

      // Cerrar modal antes de Swal para evitar z-index conflict
      closeModal()

      Swal.fire({
        icon: 'success',
        title: isCreate ? '¡Creado!' : '¡Actualizado!',
        text: `El artículo "${name.trim()}" se ${isCreate ? 'creó' : 'actualizó'} correctamente.`,
        confirmButtonColor: '#5869e9',
      })
    } catch (err: any) {
      console.error('Error al guardar artículo:', err)
      setIsSaving(false)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.response?.data?.message ?? err?.message ?? 'No se pudo guardar el artículo',
        confirmButtonColor: '#5869e9',
      })
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
                    onCompanyIdChange={setCompanyId}
                    onBranchIdChange={(id) => {
                      setBranchId(id)
                      localStorage.setItem('categories-picker-branch-id', String(id))
                      localStorage.setItem('categories-store-id', String(id))
                    }}
                  />
                </div>
                <p className='article-modal__store-hint'>
                  Empresa y sucursal filtran las categorías y unidades disponibles para este artículo.
                </p>
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
                <div className='articles__modal_field'>
                  <label className='label__general'>Unidad</label>
                  <select
                    className='inputs__general'
                    value={unitId ?? ''}
                    onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : null)}
                    disabled={!companyId || availableUnits.length === 0}
                  >
                    <option value="">
                      {!companyId
                        ? 'Selecciona empresa primero'
                        : availableUnits.length === 0
                          ? 'Sin unidades para esta empresa/sucursal'
                          : 'Selecciona unidad'}
                    </option>
                    {availableUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} ({unit.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div className='articles__modal_field'>
                  <label className='label__general'>Descuento (%)</label>
                  <input
                    className='inputs__general'
                    type='number'
                    min={0}
                    max={100}
                    step={0.01}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    placeholder='0'
                  />
                </div>
                <div className='articles__modal_field'>
                  <label className='label__general'>Imágenes</label>
                  <button
                    type='button'
                    className='btn__general-purple article-modal__images-trigger'
                    onClick={() => setImagePickerOpen(true)}
                  >
                    <span className='material-symbols-rounded' aria-hidden>
                      add_photo_alternate
                    </span>
                    <span>{images.length > 0 ? `Imágenes (${images.length})` : 'Imágenes'}</span>
                  </button>
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

              <div className='catalog-modal__switches'>
                <div className='catalog-modal__switch-row'>
                  <span>Incluye IVA</span>
                  <IOSSwitch checked={includesIVA} onChange={setIncludesIVA} ariaLabel='Incluye IVA' />
                </div>
                <div className='catalog-modal__switch-row'>
                  <span>Desglose de IVA</span>
                  <IOSSwitch checked={isBreakdown} onChange={setIsBreakdown} ariaLabel='Desglose de IVA' />
                </div>
                <div className='catalog-modal__switch-row'>
                  <span>Rastrear inventario</span>
                  <IOSSwitch checked={trackInventory} onChange={setTrackInventory} ariaLabel='Rastrear inventario' />
                </div>
                {!trackInventory ? (
                  <p className='article-modal__bajo-pedido-hint'>
                    Artículo bajo pedido: configura la ruta de producción abajo.
                  </p>
                ) : null}
              </div>

              {!trackInventory ? (
                <div className='articles__modal_field articles__modal_field--full article-modal__production-route'>
                  <div className='article-modal__route-head'>
                    <div>
                      <label className='label__general'>Ruta de producción (orden del proceso)</label>
                      <p className='article-modal__route-hint'>
                        Cada paso es un área. Al completar en cola, la OP pasa sola a la siguiente.
                      </p>
                    </div>
                    <div className='article-modal__route-head-actions'>
                      <Link
                        to={PRODUCTION_AREAS_PATH}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='btn__general-orange article-modal__route-config-btn'
                      >
                        Configurar áreas
                      </Link>
                      <Link
                        to={CATALOG_AREAS_PATH}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='btn__general-purple article-modal__route-config-btn'
                        onClick={() =>
                          sessionStorage.setItem('areas-modal-preset-type', 'PRODUCTION')
                        }
                      >
                        Tipos y áreas
                      </Link>
                    </div>
                  </div>
                  {productionAreas.length === 0 ? (
                    <p className='article-modal__route-warning'>
                      No hay áreas de producción. Usa <strong>Configurar áreas</strong> para
                      crearlas (Corte, Confección, Empaque, etc.).
                    </p>
                  ) : null}
                  <div className='article-modal__route-picker'>
                    <select
                      className='inputs__general'
                      value={routeAreaPicker}
                      onChange={(e) => setRouteAreaPicker(e.target.value)}
                    >
                      <option value=''>Agregar área…</option>
                      {productionAreas.map((area) => (
                        <option key={area.id} value={String(area.id)}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                    <button type='button' className='btn__general-purple' onClick={addRouteArea}>
                      Agregar
                    </button>
                  </div>
                  {productionRouteAreaIds.length > 0 ? (
                    <ol className='article-modal__route-list'>
                      {productionRouteAreaIds.map((areaId, index) => {
                        const area = productionAreas.find((item) => item.id === areaId)
                        return (
                          <li key={`${areaId}-${index}`}>
                            <span>{index + 1}. {area?.name ?? `Área ${areaId}`}</span>
                            <button type='button' onClick={() => removeRouteArea(areaId)}>
                              Quitar
                            </button>
                          </li>
                        )
                      })}
                    </ol>
                  ) : (
                    <p className='article-modal__route-empty'>
                      Define el flujo: Corte → Confección → Empaque. Al vender, la OP inicia en la primera área.
                    </p>
                  )}
                </div>
              ) : null}

              <div className='articles__modal_field articles__modal_field--full'>
                <div className='article-modal__actions-grid'>
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
                  <button
                    type='button'
                    className='btn__general-primary article-modal__action-btn'
                    onClick={() => setWarehousesModalOpen(true)}
                  >
                    <span className='material-symbols-rounded article-modal__action-icon' aria-hidden>
                      warehouse
                    </span>
                    <span>Almacén {warehouses.length > 0 && `(${warehouses.length})`}</span>
                  </button>
                  <button
                    type='button'
                    className='btn__general-green article-modal__action-btn'
                    onClick={openStockModal}
                  >
                    <span className='material-symbols-rounded article-modal__action-icon' aria-hidden>
                      inventory_2
                    </span>
                    <span>Stock</span>
                  </button>
                </div>
              </div>

              <div className='articles__modal_actions'>
                <button className='btn__general-purple' type='submit' disabled={isSaving}>
                  {isSaving
                    ? isCreate ? 'Creando...' : 'Actualizando...'
                    : isCreate ? 'Crear artículo' : 'Guardar cambios'}
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

      <WarehousesModal
        isOpen={warehousesModalOpen}
        onClose={() => setWarehousesModalOpen(false)}
        warehouses={warehouses}
        onChange={setWarehouses}
        companyId={companyId}
        branchId={branchId}
      />

      <StockModal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        itemId={currentItemId}
        itemName={name}
        itemCode={code}
      />
    </>
  )
}

export default Modal
