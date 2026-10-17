import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import { updateArticles } from '../../../../../redux/state/Articles'
import { PrivateRoutes } from '../../../../../models/routes'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId } from '../../../../../constants/category'
import BranchAvailabilityPicker from '../shared/BranchAvailabilityPicker'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
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
  // Sucursales donde se ofrece el artículo (null = todas). El artículo es UNO por empresa.
  const [tab, setTab] = useState<'info' | 'company'>('info')
  // Todas las sucursales de la empresa (las informa el selector) para calcular qué opciones sirven
  const [companyBranchIds, setCompanyBranchIds] = useState<number[]>([])
  const [enabledBranchIds, setEnabledBranchIds] = useState<number[] | null>(null)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [familyId, setFamilyId] = useState<number | null>(null)
  const [availableFamilies, setAvailableFamilies] = useState<any[]>([])
  const [unitId, setUnitId] = useState<number | null>(null)
  const [availableCategories, setAvailableCategories] = useState<any[]>([])
  const [availableUnits, setAvailableUnits] = useState<any[]>([])
  const [variations, setVariations] = useState<Variation[]>([])
  const [includesIVA, setIncludesIVA] = useState(false)
  const [discountPercent, setDiscountPercent] = useState('0')
  const [directPrice, setDirectPrice] = useState('')
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

  const token = localStorage.getItem('token-fixora')
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
        confirmButtonColor: '#586ae9',
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
      setDirectPrice('')
      setIsBreakdown(false)
      setTrackInventory(true)
      setProductionRouteAreaIds([])
      setRouteAreaPicker('')
      setImages([])
      setImagePickerOpen(false)
      setTempPriceRanges([])
      setCurrentItemId(null)
      setStockModalOpen(false)
      setEnabledBranchIds(null)
      setTab('info')
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

      const vars = Array.isArray(u.itemVariations)
        ? u.itemVariations
        : Array.isArray(u.variations)
        ? u.variations
        : []
      setVariations(vars)

      setIncludesIVA(Boolean(u.includesIVA))
      setDiscountPercent(String(Number(u.discountPercent ?? 0) || 0))
      setDirectPrice(String(u.price ?? ''))
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
      const enabled = (u.branchItems ?? []).filter((b: any) => b.enabled).map((b: any) => Number(b.branchId))
      setEnabledBranchIds(enabled.length > 0 ? enabled : null)
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

  const loadFamilies = useCallback(async (selectedCompanyId: number, selectedBranchIds: number[]) => {
    try {
      const currentToken = localStorage.getItem('token-fixora')
      if (!currentToken) throw new Error('No token found')

      const res: any = await APIs.filterFamilias(
        {
          companyId: selectedCompanyId,
          branchIds: selectedBranchIds,
        },
        currentToken,
      )

      // Robust data extraction: check res.data, res.data.data, or res
      let list: any[] = []
      if (Array.isArray(res)) {
        list = res
      } else if (res && Array.isArray(res.data)) {
        list = res.data
      } else if (res && res.data && Array.isArray(res.data.data)) {
        list = res.data.data
      } else if (res && res.data && Array.isArray(res.data.categories)) {
        list = res.data.categories
      }

      // Filter to keep only families that are specifically for ARTICLES or are "BOTH" (null)
      const filteredList = list.filter(
        (fam) => fam.allowedItemType === 'ARTICLE' || fam.allowedItemType === null,
      )

      setAvailableFamilies(filteredList)
      setFamilyId((current) =>
        current != null && filteredList.some((fam: any) => fam.id === current) ? current : null,
      )
    } catch (err) {
      console.error('Error loading families:', err)
      setAvailableFamilies([])
      setFamilyId(null)
    }
  }, [])

  const loadCategories = useCallback(async (selectedBranchIds: number[]) => {
    try {
      const currentToken = localStorage.getItem('token-fixora')
      if (!currentToken) throw new Error('No token found')

      const res: any = await APIs.getCategoryOptions(undefined, currentToken, undefined, selectedBranchIds)

      let list: any[] = []
      if (Array.isArray(res)) {
        list = res
      } else if (res && Array.isArray(res.data)) {
        list = res.data
      } else if (res && res.data && Array.isArray(res.data.data)) {
        list = res.data.data
      } else if (res && res.data && Array.isArray(res.data.categories)) {
        list = res.data.categories
      }

      setAvailableCategories(list)
      setCategoryId((current) =>
        current != null && list.some((cat: any) => cat.id === current) ? current : null,
      )
    } catch (err) {
      console.error('Error loading categories:', err)
      setAvailableCategories([])
      setCategoryId(null)
    }
  }, [])

  const loadUnits = useCallback(async (
    selectedCompanyId: number,
    selectedBranchIds: number[],
    autoSelectDefault = false,
  ) => {
    try {
      const currentToken = localStorage.getItem('token-fixora')
      if (!currentToken) throw new Error('No token found')

      const res: any = await APIs.getUnitOptions(
        {
          companyId: selectedCompanyId,
          branchIds: selectedBranchIds,
        },
        currentToken,
      )

      let list: any[] = []
      if (Array.isArray(res)) {
        list = res
      } else if (res && Array.isArray(res.data)) {
        list = res.data
      } else if (res && res.data && Array.isArray(res.data.data)) {
        list = res.data.data
      } else if (res && res.data && Array.isArray(res.data.units)) {
        list = res.data.units
      }

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
  }, [])

  useEffect(() => {
    if (modalState !== 'articles-modal' && modalState !== 'articles-modal-update') return

    if (!companyId) {
      setAvailableCategories([])
      setAvailableUnits([])
      return
    }

    // Solo se ofrecen familias, categorías y unidades disponibles en TODAS las sucursales elegidas
    const effective = enabledBranchIds ?? companyBranchIds
    loadCategories(effective)
    loadUnits(companyId, effective, modalState === 'articles-modal')
    loadProductionAreas(companyId, branchId)
    loadFamilies(companyId, effective)
  }, [companyId, branchId, enabledBranchIds, companyBranchIds, modalState, loadProductionAreas, loadFamilies, loadCategories, loadUnits])

  useEffect(() => {
    // Reset category when family changes to ensure consistency
    setCategoryId(null)
  }, [familyId])

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



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'Sesión',
        text: 'No hay token de autenticación',
        confirmButtonColor: '#586ae9',
      })
      return
    }

    if (!name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El nombre es obligatorio',
        confirmButtonColor: '#586ae9',
      })
      return
    }

    if (!companyId || Number.isNaN(companyId)) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'No se ha seleccionado una empresa. Por favor selecciona una empresa primero.',
        confirmButtonColor: '#586ae9',
      })
      return
    }

    const groupedVariations = variations.reduce((acc: any[], variation: any) => {
      const existing = acc.find(v => v.color === variation.color)
      if (existing) {
        if (!existing.sizes.includes(variation.size)) {
          existing.sizes.push(variation.size)
        }
      } else {
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
      // El artículo es de la empresa; aquí solo se indica en qué sucursales se ofrece
      branchIds: enabledBranchIds ?? undefined,
      familyId,
      categoryId,
      unitId,
      storeIds: warehouses.map((store) => store.id),
      price: directPrice ? Number(directPrice) : null,
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

      // La ruta de producción es del módulo de Producción: solo se toca cuando hay algo que guardar o
      // limpiar. Un artículo normal de inventario (sin ruta) no debe requerir ese módulo.
      const hadRoute = !isCreate && Array.isArray(articlesUpdate?.productionRoutes) && articlesUpdate.productionRoutes.length > 0
      if (itemId && !trackInventory && (productionRouteAreaIds.length > 0 || hadRoute)) {
        await APIs.setItemProductionRoute(itemId, productionRouteAreaIds, token)
      } else if (itemId && trackInventory && hadRoute) {
        await APIs.setItemProductionRoute(itemId, [], token)
      }

      // La lista de Artículos está paginada desde el servidor: se le avisa para que vuelva a pedir su página
      window.dispatchEvent(new Event('articles:changed'))

      setIsSaving(false)
      closeModal()

      Swal.fire({
        icon: 'success',
        title: isCreate ? '¡Creado!' : '¡Actualizado!',
        text: `El artículo "${name.trim()}" se ${isCreate ? 'creó' : 'actualizó'} correctamente.`,
        confirmButtonColor: '#586ae9',
      })
    } catch (err: any) {
      console.error('Error al guardar artículo:', err)
      setIsSaving(false)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.response?.data?.message ?? err?.message ?? 'No se pudo guardar el artículo',
        confirmButtonColor: '#586ae9',
      })
    }
  }

  if (modalState !== 'articles-modal' && modalState !== 'articles-modal-update') {
    return null
  }

  return (
    <>
      <div className={`articles-modal__overlay ${modalState === 'articles-modal' || modalState === 'articles-modal-update' ? 'active' : ''}`}>
        <div className={`articles-modal__content ${modalState === 'articles-modal' || modalState === 'articles-modal-update' ? 'active' : ''}`}>
          <div className='articles-modal__header'>
            <button
              className='articles-modal__close-btn'
              onClick={(e) => {
                e.preventDefault()
                closeModal()
              }}
            >
              <span className='material-symbols-rounded'>close</span>
            </button>
            <p className='articles-modal__title'>{isCreate ? 'Nuevo artículo' : 'Editar artículo'}</p>
          </div>
          <div className='articles-modal-tabs' role='tablist'>
            <button type='button' role='tab' aria-selected={tab === 'info'} className={`articles-modal-tab ${tab === 'info' ? 'articles-modal-tab--active' : ''}`} onClick={() => setTab('info')}>
              Información
            </button>
            <button type='button' role='tab' aria-selected={tab === 'company'} className={`articles-modal-tab ${tab === 'company' ? 'articles-modal-tab--active' : ''}`} onClick={() => setTab('company')}>
              Empresa y sucursales
            </button>
          </div>
          <form className='articles-modal__body' onSubmit={handleSubmit} id='articles-form'>
            <div className='articles-modal__container'>
              <div className='articles-modal__tabpane' hidden={tab !== 'company'}>
              <div className='articles-modal__field articles-modal__field--full article-modal__stores'>
                <div className='article-store-picker'>
                  <CategoriesStorePicker
                    variant='modal'
                    companyOnly
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
                  El artículo es de la empresa; abajo marcas en qué sucursales se ofrece.
                </p>
                <BranchAvailabilityPicker companyId={companyId} value={enabledBranchIds} onChange={setEnabledBranchIds} onBranchesLoaded={setCompanyBranchIds} title='Disponible en sucursales' hint='Familia, categoría y unidad solo muestran lo que está disponible en todas las sucursales marcadas.' />
              </div>
              </div>
              <div className='articles-modal__tabpane' hidden={tab !== 'info'}>

              <div className='articles-modal__row articles-modal__row--main'>
                <div className='articles-modal__field'>
                  <label className='articles-modal__label'>Código</label>
                  <input
                    className='inputs__general'
                    type='text'
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder='Código del artículo'
                  />
                </div>
                <div className='articles-modal__field'>
                  <label className='articles-modal__label'>Nombre</label>
                  <input
                    className='inputs__general'
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='Nombre del artículo'
                  />
                </div>
                <div className='articles-modal__field'>
                  <label className='articles-modal__label'>Familia</label>
                  <select
                    className='inputs__general'
                    value={familyId ?? ''}
                    onChange={(e) => setFamilyId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Sin familia</option>
                    {availableFamilies.map((fam) => (
                      <option key={fam.id} value={fam.id}>
                        {fam.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='articles-modal__field'>
                  <label className='articles-modal__label'>Categoría</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      className='inputs__general'
                      style={{ flex: 1 }}
                      value={categoryId ?? ''}
                      onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                      disabled={!familyId}
                    >
                      <option value="">
                        {!familyId ? 'Selecciona familia primero' : 'Sin categoría'}
                      </option>
                      {availableCategories
                        .filter((cat) => cat.parentId === familyId)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.title}
                          </option>
                        ))}
                    </select>
                    <button
                      type='button'
                      className='btn__general-purple'
                      style={{ padding: '0 10px', display: 'flex', alignItems: 'center' }}
                      onClick={() => {
                        // Logic to open category picker will be implemented
                        console.log('Open category picker')
                      }}
                    >
                      <span className='material-symbols-rounded' style={{ fontSize: '18px' }}>folder_open</span>
                    </button>
                  </div>
                </div>
                <div className='articles-modal__field'>
                  <label className='articles-modal__label'>Unidad</label>
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
                <div className='articles-modal__field'>
                  <label className='articles-modal__label'>Descuento (%)</label>
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
                <div className='articles-modal__field'>
                  <label className='articles-modal__label'>Imágenes</label>
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
              <div className='articles-modal__row'>
                <div className='articles-modal__field'>
                  <label className='articles-modal__label'>Precio</label>
                  <input
                    className='inputs__general'
                    type='number'
                    value={directPrice}
                    onChange={(e) => setDirectPrice(e.target.value)}
                    placeholder='0.00'
                    step='0.01'
                  />
                </div>
                <div className='articles-modal__field'>
                  <label className='articles-modal__label'>Uso de Rangos</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '40px' }}>
                    <IOSSwitch
                      checked={tempPriceRanges.length > 0}
                      onChange={(checked) => {
                        if (!checked) setTempPriceRanges([]);
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--modal-text-muted)' }}>
                      Usar rangos de precios en lugar de precio directo
                    </span>
                  </div>
                </div>
              </div>
              <div className='articles-modal__field articles-modal__field--full'>
                <label className='articles-modal__label'>Descripción</label>
                <textarea
                  className='inputs__general'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Descripción del artículo'
                  rows={3}
                />
              </div>
              <div className='catalog-modal__options-section'>
                <p className='catalog-modal__section-title'>Configuraciones Adicionales</p>
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
                </div>
                {!trackInventory ? (
                  <p className='article-modal__bajo-pedido-hint'>
                    Artículo bajo pedido: configura la ruta de producción abajo.
                  </p>
                ) : null}
              </div>
              {!trackInventory ? (
                <div className='articles-modal__field articles-modal__field--full article-modal__production-route'>
                  <div className='article-modal__route-head'>
                    <div>
                      <label className='articles-modal__label'>Ruta de producción (orden del proceso)</label>
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
              <div className='articles-modal__field articles-modal__field--full'>
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
              </div>
            </div>
          </form>
          <div className='articles-modal__actions'>
            <button
              className='btn__general-secondary'
              type='button'
              onClick={closeModal}
            >
              Cancelar
            </button>
            <button
              className='btn__general-purple'
              type='submit'
              form='articles-form'
              disabled={isSaving}
            >
              {isSaving
                ? isCreate ? 'Creando...' : 'Actualizando...'
                : isCreate ? 'Crear artículo' : 'Guardar cambios'}
            </button>
          </div>
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
