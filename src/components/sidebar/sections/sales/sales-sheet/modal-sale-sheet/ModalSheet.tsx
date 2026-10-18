import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './ModalSheet.css'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../../redux/state/modals'
import APIs from '../../../../../../services/APIs'
import Swal from 'sweetalert2'
import {
  calculateSaleTotals,
  getUrgencySurchargeLabel,
  URGENCY_OPTIONS,
} from '../../../../../../constants/urgencyPricing'

const LS_COMPANY = 'categories-picker-company-id'

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem(LS_COMPANY))
  return !Number.isNaN(id) && id > 0 ? id : null
}

const readBranchId = (): number | undefined => {
  const id = Number(localStorage.getItem('categories-store-id'))
  return !Number.isNaN(id) && id > 0 ? id : undefined
}

const getProductImage = (product: any): string | null => {
  const fromImages = product?.images?.find?.((url: string) => url?.trim?.())
  if (fromImages) return fromImages

  const photoUrl = product?.photos?.[0]?.url
  if (photoUrl) {
    return photoUrl.startsWith('http') ? photoUrl : `http://localhost:3000${photoUrl}`
  }

  const variationImage = product?.variations?.[0]?.images?.[0]
  if (variationImage) return variationImage

  return null
}

const formatRangeLabel = (range: any): string => {
  if (range.maxQuantity == null) return `${range.minQuantity}+ pzas`
  return `${range.minQuantity} - ${range.maxQuantity} pzas`
}

const getApplicablePriceRange = (ranges: any[], quantity: number) => {
  if (!ranges?.length || quantity <= 0) return null
  return (
    ranges.find((range) => {
      const meetsMin = quantity >= range.minQuantity
      const meetsMax =
        range.maxQuantity == null || quantity <= range.maxQuantity
      return meetsMin && meetsMax
    }) ?? null
  )
}

const getProductUnitPrice = (product: any, quantity = 1): number => {
  const range = getApplicablePriceRange(product?.priceRanges ?? [], quantity)
  if (range?.price != null) {
    const parsed = Number(range.price)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }

  const variationPrice = product?.variations?.[0]?.price
  if (variationPrice != null) {
    const parsed = Number(variationPrice)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }

  return Number(product?.precio ?? product?.price ?? 0) || 0
}

const getItemDiscountPercent = (product: any): number => {
  const parsed = Number(product?.discountPercent ?? 0)
  if (!Number.isFinite(parsed) || parsed <= 0) return 0
  return Math.min(100, parsed)
}

const applyDiscountPercent = (listPrice: number, discountPercent: number): number => {
  const discount = Math.min(100, Math.max(0, discountPercent))
  return listPrice * (1 - discount / 100)
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value)

const getFirstRouteAreaId = (product: any): number | null => {
  const routes = [...(product?.productionRoutes ?? [])].sort(
    (a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0),
  )
  return routes[0]?.areaId ?? null
}

type SaleLine = {
  key: string
  productId: number
  code: string
  name: string
  quantity: number
  listUnitPrice: number
  unitPrice: number
  discountPercent: number
  image: string | null
  usesSizes: boolean
  variations: any[]
  stockByStore: any[]
  totalStock?: number
  storeId: number
  selectedColor: string
  selectedSize: string
  itemVariationId: number | null
  priceRanges: any[]
  priceRangeId: number | null
  rangeLabel: string
  trackInventory: boolean
  areaId: number | null
}

const applyPriceRangeToLine = (
  line: SaleLine,
  priceRangeId?: number | null,
): SaleLine => {
  if (!line.priceRanges?.length) return line

  const selectedRange =
    priceRangeId != null
      ? line.priceRanges.find((range) => range.id === priceRangeId)
      : getApplicablePriceRange(line.priceRanges, line.quantity)

  if (!selectedRange) {
    return {
      ...line,
      priceRangeId: null,
      rangeLabel: '',
    }
  }

  const listPrice = Number(selectedRange.price) || 0

  return {
    ...line,
    priceRangeId: selectedRange.id,
    listUnitPrice: listPrice,
    unitPrice: applyDiscountPercent(listPrice, line.discountPercent ?? 0),
    rangeLabel: formatRangeLabel(selectedRange),
  }
}

const getProductVariations = (product: any) =>
  product?.usesSizes ? (product.variations ?? product.itemVariations ?? []) : []

const getProductStores = (product: any) => {
  if (Array.isArray(product?.stores) && product.stores.length > 0) {
    return product.stores
  }
  return (product?.productStores ?? []).map((ps: any) => ({
    id: ps.store?.id ?? ps.storeId,
    storeId: ps.storeId ?? ps.store?.id,
  }))
}

const getVariationColors = (variations: any[]) => {
  const seen = new Map<string, { color: string; colorHex?: string }>()
  for (const v of variations ?? []) {
    if (!seen.has(v.color)) {
      seen.set(v.color, { color: v.color, colorHex: v.colorHex })
    }
  }
  return Array.from(seen.values())
}

const getSizesForColor = (variations: any[], color: string) =>
  (variations ?? []).filter((v) => v.color === color)

const resolveVariation = (
  variations: any[],
  color: string | null,
  size: string | null,
) => {
  if (!color || !size) return null
  return variations.find((v) => v.color === color && v.size === size) ?? null
}

const getStoreStockRow = (line: SaleLine, storeId: number) =>
  (line.stockByStore ?? []).find((row) => Number(row.storeId) === Number(storeId))

const getVariationStockForLine = (
  line: SaleLine,
  color?: string | null,
  size?: string | null,
) => {
  if (!line.usesSizes) {
    const storeRow = getStoreStockRow(line, line.storeId)
    return storeRow?.totalStock ?? line.totalStock ?? null
  }

  const storeRow = getStoreStockRow(line, line.storeId)
  const pool = storeRow?.variations ?? line.variations ?? []

  if (color && size) {
    const match = pool.find((v: any) => v.color === color && v.size === size)
    if (match?.stock != null) return match.stock
    const variation = resolveVariation(line.variations, color, size)
    return variation?.stock ?? 0
  }

  return null
}

const canMergeSaleLines = (a: SaleLine, b: SaleLine) => {
  if (a.productId !== b.productId || a.storeId !== b.storeId) return false
  if ((a.areaId ?? null) !== (b.areaId ?? null)) return false

  if (a.usesSizes) {
    if (!a.itemVariationId || !b.itemVariationId) return false
    return a.itemVariationId === b.itemVariationId
  }

  return true
}

const clampLineQuantity = (line: SaleLine, quantity: number) => {
  if (line.usesSizes && line.selectedColor && line.selectedSize) {
    const stock = getVariationStockForLine(
      line,
      line.selectedColor,
      line.selectedSize,
    )
    if (stock != null && quantity > stock) return stock
  }

  return quantity
}

const mergeSaleLines = (lines: SaleLine[]) => {
  const merged: SaleLine[] = []

  for (const line of lines) {
    const matchIndex = merged.findIndex((existing) =>
      canMergeSaleLines(existing, line),
    )

    if (matchIndex >= 0) {
      const current = merged[matchIndex]
      const nextQuantity = clampLineQuantity(
        current,
        current.quantity + line.quantity,
      )
      merged[matchIndex] = applyPriceRangeToLine({
        ...current,
        quantity: nextQuantity,
      })
      continue
    }

    merged.push(line)
  }

  return merged
}

const ModalSheet: React.FC<{ onSaved?: () => void }> = ({ onSaved }) => {
  const dispatch = useDispatch()
  const modalState = useSelector((state: any) => state.modals)
  const userState = useSelector((state: any) => state.user)
  const isOpen = modalState === 'sales-sheet_modal'
  const isOwner = userState?.roleLevel === 0

  const [searchResults, setSearchResults] = useState<any[]>([])
  const [saleLines, setSaleLines] = useState<SaleLine[]>([])
  // Campo de búsqueda activo ('code' | 'name') y control de peticiones (sin respuestas fuera de orden)
  const [activeField, setActiveField] = useState<'code' | 'name' | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const searchSeq = useRef(0)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [discount, setDiscount] = useState('0')
  // Configuración de cobro de la empresa/sucursal y formas de pago activas
  const [posConfig, setPosConfig] = useState({ allowManualDiscount: true, askPaymentMethod: true })
  // Llave del intento de cobro: si la petición se repite (red lenta, doble clic) el servidor no duplica la venta
  const chargeKeyRef = useRef<string | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // ¿Puede vender? (turno abierto a su nombre en la sucursal elegida)
  const [sellStatus, setSellStatus] = useState<{ canSell: boolean; reason: string | null; shift: any; why?: string; expired?: boolean; debug?: any } | null>(null)
  const codeInputRef = useRef<HTMLInputElement>(null)
  const [productionAreas, setProductionAreas] = useState<any[]>([])
  const [defaultAreaId, setDefaultAreaId] = useState<string>('')
  const [saleDueDate, setSaleDueDate] = useState('')
  const [saleUrgency, setSaleUrgency] = useState('NORMAL')

  // Company and Branch States
  const [companies, setCompanies] = useState<any[]>([])
  const [branchOffices, setBranchOffices] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<number>(0)
  const [selectedBranch, setSelectedBranch] = useState<number>(0)

  const [fields, setFields] = useState({
    codigo: '',
    name: '',
  })

  const handleModalChange = (value: string) => {
    dispatch(modal(value))
  }

  // Cierre desde la X, Cerrar ficha o Esc: si ya hay artículos capturados pide
  // confirmación para no perder la ficha por un clic accidental.
  const requestClose = async () => {
    if (isSubmitting) return
    if (saleLines.length > 0) {
      const confirmation = await Swal.fire({
        icon: 'warning',
        title: '¿Descartar la ficha?',
        text: 'Hay artículos capturados que se perderán.',
        showCancelButton: true,
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Seguir editando',
        confirmButtonColor: '#d33',
      })
      if (!confirmation.isConfirmed) return
    }
    handleModalChange('')
  }

  // El cursor siempre queda en el código para capturar artículos sin tocar el mouse
  useEffect(() => {
    if (isOpen) setTimeout(() => codeInputRef.current?.focus(), 50)
  }, [isOpen, saleLines.length === 0])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !Swal.isVisible()) requestClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, saleLines.length, isSubmitting])

  useEffect(() => {
    if (!isOpen) return

    const loadInitialData = async () => {
      try {
        const userId = userState?.id || 1;
        const compData = await APIs.getCompaniesByUser(userId);
        const companiesList = Array.isArray(compData) ? compData : (compData?.data || []);
        setCompanies(companiesList);

        if (companiesList.length > 0) {
          const firstCompanyId = companiesList[0].id;
          setSelectedCompany(firstCompanyId);
          const branchData = await APIs.getBranchOffices(firstCompanyId, userId);
          const branches = Array.isArray(branchData) ? branchData : (branchData?.data || []);
          setBranchOffices(branches);
          if (branches.length > 0) {
            setSelectedBranch(branches[0].id);
          }
        }
      } catch (e) {
        console.error('Error loading company data', e);
      }
    }

    const loadAreas = async () => {
      const companyId = readCompanyId()
      if (!companyId) {
        setProductionAreas([])
        return
      }

      try {
        const response: any = await APIs.getAreas({
          companyId,
          branchId: readBranchId(),
          production: true,
        })
        const list = Array.isArray(response?.data) ? response.data : []
        setProductionAreas(list)
        if (list.length === 1) {
          setDefaultAreaId(String(list[0].id))
        }
      } catch {
        setProductionAreas([])
      }
    }

    loadInitialData();
    loadAreas()
  }, [isOpen])

  const handleCompanyChange = async (companyId: number) => {
    setSelectedCompany(companyId);
    setSelectedBranch(0);
    try {
      const userId = userState?.id || 1;
      const response = await APIs.getBranchOffices(companyId, userId);
      const branches = Array.isArray(response) ? response : (response?.data || []);
      setBranchOffices(branches);
      if (branches.length > 0) {
        setSelectedBranch(branches[0].id);
      }
    } catch (e) {
      console.error('Error loading branches', e);
    }
  };

  // Búsqueda estilo "marketplace": casi instantánea.
  //  · Por código desde 1 carácter (lector de barras); por nombre desde 2 letras, con 120 ms entre teclas.
  //  · Una sola petición ligera por búsqueda; la anterior se CANCELA al teclear (nunca llegan respuestas fuera de orden).
  //  · Caché de 20 s: repetir o borrar una letra responde al instante sin red. Si la lista anterior estaba completa
  //    (no truncada), al escribir más letras se filtra localmente al momento y no se pide nada.
  //  · El artículo completo (variaciones, rangos, existencias) se pide solo al elegirlo, y se precarga al pasar el mouse.
  const SEARCH_MIN = { code: 1, name: 2 } as const
  const SEARCH_TTL = 20_000
  const searchCache = useRef(new Map<string, { at: number; data: any[]; truncated: boolean }>())
  const detailCache = useRef(new Map<string, Promise<any>>())
  const searchAbort = useRef<AbortController | null>(null)
  const [pickingId, setPickingId] = useState<number | null>(null)

  const searchFilters = () => ({
    companyId: selectedCompany || readCompanyId() || undefined,
    branchId: selectedBranch > 0 ? selectedBranch : readBranchId(),
  })
  const searchKey = (field: 'code' | 'name', term: string) =>
    `${searchFilters().companyId ?? 0}|${searchFilters().branchId ?? 0}|${field}|${term.toLowerCase()}`
  const normalizeText = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  const prefetchProduct = (id: number) => {
    const { branchId } = searchFilters()
    const key = `${branchId ?? 0}|${id}`
    let promise = detailCache.current.get(key)
    if (!promise) {
      promise = APIs.getProductForSale(id, { branchId }).catch((error) => {
        detailCache.current.delete(key)
        throw error
      })
      detailCache.current.set(key, promise)
      // Los saldos cambian: la precarga solo vale unos segundos
      setTimeout(() => detailCache.current.delete(key), SEARCH_TTL)
    }
    return promise
  }

  const selectResult = async (product: any) => {
    if (pickingId != null) return
    setPickingId(product.id)
    try {
      const response: any = await prefetchProduct(product.id)
      addProduct(response?.data ?? product)
    } catch (error) {
      console.error('Error al cargar el artículo:', error)
      setSearchError((error as any)?.response?.data?.message || 'No se pudo cargar el artículo')
    } finally {
      setPickingId(null)
    }
  }

  const clearSearch = () => {
    searchAbort.current?.abort()
    searchSeq.current += 1
    setSearchResults([])
    setSearching(false)
  }

  const runSearch = (field: 'code' | 'name', value: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    const trimmed = value.trim()
    if (trimmed.length < SEARCH_MIN[field]) {
      clearSearch()
      return
    }
    setSearchError('')

    const key = searchKey(field, trimmed)
    const cached = searchCache.current.get(key)
    if (cached && Date.now() - cached.at < SEARCH_TTL) {
      searchAbort.current?.abort()
      searchSeq.current += 1
      setSearchResults(cached.data)
      setSearching(false)
      return
    }

    // Refinamiento local por nombre: si "cam" devolvió todo (no truncado), "camis" sale de esa misma lista
    if (field === 'name') {
      const words = normalizeText(trimmed).split(/\s+/).filter(Boolean)
      const prefix = key.slice(0, key.lastIndexOf('|') + 1)
      let best: { at: number; data: any[]; truncated: boolean } | null = null
      searchCache.current.forEach((entry, k) => {
        if (!k.startsWith(prefix) || entry.truncated || Date.now() - entry.at >= SEARCH_TTL) return
        const base = normalizeText(k.slice(prefix.length))
        if (base && normalizeText(trimmed).includes(base) && (!best || entry.data.length < best.data.length)) best = entry
      })
      if (best) {
        const filtered = (best as { data: any[] }).data.filter((p) => words.every((w) => normalizeText(p.name ?? '').includes(w)))
        searchAbort.current?.abort()
        searchSeq.current += 1
        searchCache.current.set(key, { at: Date.now(), data: filtered, truncated: false })
        setSearchResults(filtered)
        setSearching(false)
        return
      }
    }

    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      searchAbort.current?.abort()
      const controller = new AbortController()
      searchAbort.current = controller
      const seq = ++searchSeq.current
      try {
        const response: any = await APIs.searchProducts(field, trimmed, searchFilters(), controller.signal)
        if (seq !== searchSeq.current) return
        const data: any[] = response?.data ?? []
        searchCache.current.set(key, { at: Date.now(), data, truncated: response?.truncated === true })
        setSearchResults(data)
        // Se precargan los primeros resultados: al hacer clic ya están listos
        data.slice(0, field === 'code' ? 1 : 3).forEach((p) => prefetchProduct(p.id).catch(() => {}))
      } catch (error) {
        if (controller.signal.aborted || seq !== searchSeq.current) return
        console.error('Error al obtener los productos:', error)
        setSearchResults([])
        setSearchError((error as any)?.response?.data?.message || (error as any)?.message || 'No se pudo buscar')
      } finally {
        if (seq === searchSeq.current) setSearching(false)
      }
    }, field === 'code' ? 80 : 120)
  }

  const handleSearchCodeChange = (code: string) => {
    setFields((prev) => ({ ...prev, codigo: code }))
    setActiveField('code')
    runSearch('code', code)
  }

  const handleSearchNameChange = (name: string) => {
    setFields((prev) => ({ ...prev, name }))
    setActiveField('name')
    runSearch('name', name)
  }

  const addProduct = (product: any) => {
    const usesSizes = product.usesSizes === true
    const trackInventory = product.trackInventory !== false
    const variations = getProductVariations(product)
    const stores = getProductStores(product)
    // El descuento sale del almacén de ESTA sucursal (un producto puede tener almacenes en varias)
    const branchStore = stores.find((st: any) => Number(st.branchId) === Number(selectedBranch)) ?? stores[0]
    const storeId = branchStore?.storeId ?? branchStore?.id ?? 0
    const priceRanges = [...(product.priceRanges ?? [])].sort(
      (a: any, b: any) => a.minQuantity - b.minQuantity,
    )

    const colors = getVariationColors(variations)
    const initialColor = colors.length === 1 ? colors[0].color : ''
    const sizes = initialColor ? getSizesForColor(variations, initialColor) : []
    const initialSize = sizes.length === 1 ? sizes[0].size : ''
    const selectedVariation = resolveVariation(
      variations,
      initialColor || null,
      initialSize || null,
    )

    const discountPercent = getItemDiscountPercent(product)
    const listUnitPrice = getProductUnitPrice(product, 1)

    let line: SaleLine = {
      key: `${product.id}-${Date.now()}`,
      productId: product.id,
      code: product.code ?? '',
      name: product.name ?? '',
      quantity: 1,
      listUnitPrice,
      unitPrice: applyDiscountPercent(listUnitPrice, discountPercent),
      discountPercent,
      image: getProductImage(product),
      usesSizes,
      variations,
      stockByStore: product.stockByStore ?? [],
      totalStock: product.totalStock,
      storeId,
      selectedColor: initialColor,
      selectedSize: initialSize,
      itemVariationId: selectedVariation?.id ?? null,
      priceRanges,
      priceRangeId: null,
      rangeLabel: '',
      trackInventory,
      areaId:
        getFirstRouteAreaId(product) ??
        (!trackInventory && defaultAreaId ? Number(defaultAreaId) : null),
    }

    line = applyPriceRangeToLine(line)

    setSaleLines((prev) => mergeSaleLines([...prev, line]))
    setFields({ codigo: '', name: '' })
    clearSearch()
    setActiveField(null)
    setTimeout(() => codeInputRef.current?.focus(), 0)
  }

  const applyVariationSelection = (line: SaleLine, color: string, size: string): SaleLine => {
    const variation = resolveVariation(line.variations, color || null, size || null)
    return {
      ...line,
      selectedColor: color,
      selectedSize: size,
      itemVariationId: variation?.id ?? null,
    }
  }

  const handleColorChange = (key: string, color: string) => {
    setSaleLines((prev) =>
      mergeSaleLines(
        prev.map((line) => {
          if (line.key !== key) return line
          const sizes = color ? getSizesForColor(line.variations, color) : []
          const size = sizes.length === 1 ? sizes[0].size : ''
          return applyVariationSelection(line, color, size)
        }),
      ),
    )
  }

  const handleSizeChange = (key: string, size: string) => {
    setSaleLines((prev) =>
      mergeSaleLines(
        prev.map((line) =>
          line.key === key
            ? applyVariationSelection(line, line.selectedColor ?? '', size)
            : line,
        ),
      ),
    )
  }

  const updateQuantity = (key: string, rawValue: string) => {
    const parsed = rawValue.trim() === '' ? 0 : Number(rawValue)
    let quantity = Number.isFinite(parsed) ? Math.max(0, parsed) : 0

    setSaleLines((prev) =>
      prev.map((line) => {
        if (line.key !== key) return line

        if (line.usesSizes && line.selectedColor && line.selectedSize) {
          const stock = getVariationStockForLine(
            line,
            line.selectedColor,
            line.selectedSize,
          )
          if (stock != null && quantity > stock) {
            quantity = stock
          }
        }

        return applyPriceRangeToLine({ ...line, quantity })
      }),
    )
  }

  const handleRangeChange = (key: string, priceRangeId: number) => {
    setSaleLines((prev) =>
      prev.map((line) =>
        line.key === key
          ? applyPriceRangeToLine(line, priceRangeId)
          : line,
      ),
    )
  }

  const handleAreaChange = (key: string, areaId: string) => {
    setSaleLines((prev) =>
      mergeSaleLines(
        prev.map((line) =>
          line.key === key
            ? {
                ...line,
                areaId: areaId ? Number(areaId) : null,
              }
            : line,
        ),
      ),
    )
  }

  const applyDefaultAreaToAll = (areaId: string) => {
    setDefaultAreaId(areaId)
    if (!areaId) return

    setSaleLines((prev) =>
      mergeSaleLines(
        prev.map((line) =>
          line.trackInventory === false || !line.areaId
            ? { ...line, areaId: Number(areaId) }
            : line,
        ),
      ),
    )
  }

  const updateItemPrice = (key: string, price: number) => {
    setSaleLines((prev) =>
      prev.map((line) =>
        line.key === key
          ? applyPriceRangeToLine({ ...line, unitPrice: price })
          : line,
      ),
    )
  }

  const removeLine = (key: string) => {
    setSaleLines((prev) => prev.filter((line) => line.key !== key))
  }

  const consolidatedSaleLines = useMemo(
    () => mergeSaleLines(saleLines),
    [saleLines],
  )

  const totals = useMemo(
    () => calculateSaleTotals(
      consolidatedSaleLines.reduce(
        (acc, line) => acc + line.unitPrice * line.quantity,
        0,
      ),
      Number(discount) || 0,
      saleUrgency,
    ),
    [consolidatedSaleLines, discount, saleUrgency],
  )

  const hasSizedLines = saleLines.some((line) => line.usesSizes)
  const hasRangeLines = saleLines.some((line) => line.priceRanges.length > 0)

  const getTableLayoutClass = () => {
    if (hasSizedLines && hasRangeLines) return 'sales-sheet-table--full'
    if (hasSizedLines) return 'sales-sheet-table--sized'
    if (hasRangeLines) return 'sales-sheet-table--ranged'
    return ''
  }

  const hasProductionLines = saleLines.some((line) => !line.trackInventory)

  // Entrega y urgencia solo aplican a lo que se produce bajo pedido
  useEffect(() => {
    if (!hasProductionLines) {
      setSaleUrgency('NORMAL')
      setSaleDueDate('')
    }
  }, [hasProductionLines])
  const tableLayoutClass = `${getTableLayoutClass()} sales-sheet-table--production`.trim()

  useEffect(() => {
    if (!isOpen || !selectedCompany) return
    let cancelled = false
    ;(async () => {
      try {
        const cfg: any = await APIs.getPosConfig(selectedCompany, selectedBranch || 0)
        if (!cancelled && cfg?.data) {
          setPosConfig({
            allowManualDiscount: cfg.data.allowManualDiscount ?? true,
            askPaymentMethod: cfg.data.askPaymentMethod ?? true,
          })
          if (cfg.data.allowManualDiscount === false) setDiscount('0')
        }
      } catch {
        /* sin configuración: se usan los valores por omisión */
      }
      try {
        const res: any = await APIs.getPaymentMethods(selectedCompany, selectedBranch || undefined)
        const list = (Array.isArray(res?.data) ? res.data : []).filter((m: any) => m.active !== false)
        if (cancelled) return
        setPaymentMethods(list)
        setPaymentMethodId((prev) => {
          if (prev && list.some((m: any) => String(m.id) === prev)) return prev
          const cash = list.find((m: any) => m.code === 'CASH') ?? list[0]
          return cash ? String(cash.id) : ''
        })
      } catch {
        if (!cancelled) setPaymentMethods([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, selectedCompany, selectedBranch])

  const resetSaleForm = () => {
    setSaleLines([])
    setDiscount('0')
    setDefaultAreaId('')
    setSaleDueDate('')
    setSaleUrgency('NORMAL')
    setFields({ codigo: '', name: '' })
    // Tras cobrar cambian las existencias: nada de lo guardado en caché vale
    searchCache.current.clear()
    detailCache.current.clear()
    clearSearch()
    setActiveField(null)
  }

  useEffect(() => {
    if (!isOpen || !selectedBranch) { setSellStatus(null); return }
    let cancelled = false
    APIs.getCashSellStatus(selectedBranch)
      .then((res: any) => { if (!cancelled) setSellStatus(res?.data ?? null) })
      .catch(() => { if (!cancelled) setSellStatus(null) })
    return () => { cancelled = true }
  }, [isOpen, selectedBranch])

  const handleCobrar = async () => {
    const companyId = selectedCompany;
    const branchId = selectedBranch;
    const userId = Number(userState?.id ?? userState?._id)

    if (!companyId || companyId === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Empresa requerida',
        text: 'Selecciona una empresa antes de cobrar.',
      })
      return
    }

    if (!branchId || branchId === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sucursal requerida',
        text: 'Selecciona una sucursal antes de cobrar.',
      })
      return
    }

    if (!userId) {
      Swal.fire({
        icon: 'warning',
        title: 'Usuario requerido',
        text: 'Inicia sesión nuevamente para registrar la venta.',
      })
      return
    }

    if (saleLines.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin artículos',
        text: 'Agrega al menos un artículo a la ficha.',
      })
      return
    }

    const invalidSizedLine = saleLines.find(
      (line) =>
        line.usesSizes &&
        (!line.itemVariationId || !line.selectedColor || !line.selectedSize),
    )

    if (invalidSizedLine) {
      Swal.fire({
        icon: 'warning',
        title: 'Variación incompleta',
        text: `Selecciona color y talla para "${invalidSizedLine.name}".`,
      })
      return
    }

    const invalidQtyLine = saleLines.find(
      (line) => !Number.isFinite(line.quantity) || line.quantity <= 0,
    )

    if (invalidQtyLine) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad inválida',
        text: `Revisa la cantidad de "${invalidQtyLine.name}".`,
      })
      return
    }

    const missingAreaLine = saleLines.find(
      (line) => !line.trackInventory && !line.areaId,
    )

    if (missingAreaLine) {
      Swal.fire({
        icon: 'warning',
        title: 'Área de producción requerida',
        text: `"${missingAreaLine.name}" se fabrica bajo pedido. Selecciona el área destino.`,
      })
      return
    }

    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      const consolidatedLines = mergeSaleLines(saleLines)
      const submitTotals = calculateSaleTotals(
        consolidatedLines.reduce(
          (acc, line) => acc + line.unitPrice * line.quantity,
          0,
        ),
        Number(discount) || 0,
        saleUrgency,
      )

      if (!chargeKeyRef.current) {
        chargeKeyRef.current = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      }

      const payload = {
        companyId,
        branchId,
        idempotencyKey: chargeKeyRef.current,
        storeId: consolidatedLines[0]?.storeId || undefined,
        discount: submitTotals.discountValue,
        urgency: saleUrgency,
        dueDate: saleDueDate || undefined,
        lines: consolidatedLines.map((line) => ({
          itemId: line.productId,
          quantity: line.quantity,
          unitPrice: Number.isFinite(Number(line.unitPrice)) ? Number(line.unitPrice) : undefined,
          // Sin almacén asignado en la sucursal se omite: el servidor usa el almacén del artículo o el de la sucursal
          storeId: Number(line.storeId) > 0 ? Number(line.storeId) : undefined,
          itemVariationId: line.itemVariationId ?? undefined,
          priceRangeId: line.priceRangeId ?? undefined,
          code: line.code,
          name: line.name,
          areaId: line.areaId ?? undefined,
        })),
        payments: [
          {
            amount: submitTotals.total,
            // Sin elegir forma de pago, el servidor cobra en efectivo
            paymentMethodId:
              posConfig.askPaymentMethod && paymentMethodId ? Number(paymentMethodId) : undefined,
          },
        ],
      }

      const response: any = await APIs.createSale(payload)
      const data = response?.data ?? response;

      // La ficha de cobro se usa todo el día: tras cobrar se limpia y queda abierta para el
      // siguiente cliente, con un aviso breve que no estorba.
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Venta registrada',
        text: data?.message ?? 'La venta se guardó correctamente.',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      })

      chargeKeyRef.current = null
      resetSaleForm()
      onSaved?.()
    } catch (error: any) {
      console.error('Error al cobrar:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Ocurrió un error al registrar la venta.';

      Swal.fire({
        icon: 'error',
        title: 'No se pudo cobrar',
        text: errorMessage,
        confirmButtonColor: '#d33',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSearchResults = (field: 'code' | 'name') => {
    const value = field === 'code' ? fields.codigo : fields.name
    const trimmed = value.trim()
    if (trimmed.length === 0) return null
    // El mouse no le quita el foco al campo al elegir un resultado
    return (
      <div className='modal-sale-results' onMouseDown={(e) => e.preventDefault()}>
        {trimmed.length < SEARCH_MIN[field] ? (
          <p className='sales-sheet-search-empty'>Escribe al menos {SEARCH_MIN[field]} letras para buscar</p>
        ) : searchError ? (
          <p className='sales-sheet-search-empty'>No se pudo buscar: {searchError}</p>
        ) : searching && searchResults.length === 0 ? (
          <p className='sales-sheet-search-empty'>Buscando…</p>
        ) : searchResults.length > 0 ? (
          searchResults.map((product: any) => {
            const stock = Number(product.totalStock ?? 0)
            const tracks = product.trackInventory !== false
            return (
              <button type='button' key={product.id} className='modal-sale-result-item'
                onClick={() => selectResult(product)}
                onMouseEnter={() => prefetchProduct(product.id).catch(() => {})}
                onPointerDown={() => prefetchProduct(product.id).catch(() => {})}
                onTouchStart={() => prefetchProduct(product.id).catch(() => {})}
                disabled={pickingId === product.id}
              >
                {getProductImage(product) ? (
                  <img src={getProductImage(product) ?? ''} alt='' className='modal-sale-result-img' />
                ) : (
                  <span className='modal-sale-result-img modal-sale-result-img--empty material-symbols-rounded'>inventory_2</span>
                )}
                <span className='modal-sale-result-info'>
                  <span className='modal-sale-result-name'>{product.name}</span>
                  <span className='modal-sale-result-code'>{product.code || 'Sin código'}</span>
                </span>
                <span className='modal-sale-result-side'>
                  <span className='modal-sale-result-price'>{formatMoney(getProductUnitPrice(product, 1))}</span>
                  {tracks ? (
                    <span className={`modal-sale-result-stock ${stock <= 0 ? 'modal-sale-result-stock--out' : ''}`}>
                      {stock <= 0 ? 'Sin existencias' : `${stock} disp.`}
                    </span>
                  ) : (
                    <span className='modal-sale-result-stock'>Bajo pedido</span>
                  )}
                </span>
              </button>
            )
          })
        ) : (
          <p className='sales-sheet-search-empty'>Sin resultados</p>
        )}
      </div>
    )
  }

  const renderAreaCell = (line: SaleLine) => {
    const requiresArea = !line.trackInventory

    return (
      <div className='sales-sheet-table__cell sales-sheet-table__cell--area'>
        <select
          className={`traditional__selector sales-sheet-area-select ${
            requiresArea && !line.areaId ? 'sales-sheet-area-select--required' : ''
          }`}
          value={line.areaId ? String(line.areaId) : ''}
          onChange={(e) => handleAreaChange(line.key, e.target.value)}
          aria-label={`Área de producción para ${line.name}`}
        >
          <option value=''>
            {requiresArea ? 'Selecciona área *' : 'Sin producción'}
          </option>
          {productionAreas.map((area) => (
            <option key={area.id} value={String(area.id)}>
              {area.name}
            </option>
          ))}
        </select>
        {requiresArea ? (
          <small className='sales-sheet-area-hint'>Bajo pedido</small>
        ) : null}
      </div>
    )
  }



  // Portal al <body>: encima del sidebar y el header.
  return createPortal(
    <div className={`overlay__sales-sheet_modal ${isOpen ? 'active' : ''}`}>
      <div className="modal-sale-sheet">
        <div className="modal-sale-sheet-header">
          <h2 className="modal-sale-sheet-title">Ficha de cobro</h2>
          <button
            type='button'
            className='modal-sale-sheet-close'
            onClick={requestClose}
            aria-label='Cerrar'
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="modal-sale-sheet-body modal-sale-pos">
          <div className="modal-sale-pos__main">
          {(companies.length > 1 || branchOffices.length > 1) && (
          <section className="modal-sale-section">
            <div className="modal-sale-section-title">Ubicación de la Venta</div>
            <div className="modal-sale-meta-grid">
              {companies.length > 1 && (
              <div className="modal-sale-meta-field">
                <label>Empresa</label>
                <select
                  className='modal-sale-select'
                  value={selectedCompany}
                  onChange={(e) => handleCompanyChange(Number(e.target.value))}
                >
                  <option value={0}>Seleccione Empresa</option>
                  {companies.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              )}
              {branchOffices.length > 1 && (
              <div className="modal-sale-meta-field">
                <label>Sucursal</label>
                <select
                  className='modal-sale-select'
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(Number(e.target.value))}
                  disabled={!selectedCompany}
                >
                  <option value={0}>Seleccione Sucursal</option>
                  {branchOffices.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              )}
            </div>
          </section>
          )}

          <section className="modal-sale-section">
            <div className="modal-sale-section-title">Búsqueda de Artículos</div>
            <div className="modal-sale-search-grid">
              <div className="modal-sale-search-field">
                <label>Código</label>
                <div className="modal-sale-input-wrap">
                  <span className="material-symbols-rounded search-icon">search</span>
                  <input
                    className='modal-sale-input'
                    ref={codeInputRef}
                    placeholder='Escribe o escanea el código...'
                    value={fields.codigo}
                    type='text'
                    onChange={(e) => handleSearchCodeChange(e.target.value)}
                    onKeyDown={async (e) => {
                      // Enter agrega el artículo (lector de código de barras: manda Enter antes de que termine la espera)
                      if (e.key !== 'Enter' || !fields.codigo.trim()) return
                      e.preventDefault()
                      if (searchTimer.current) clearTimeout(searchTimer.current)
                      const term = fields.codigo.trim()
                      try {
                        // Usa la lista ya pintada/en caché si es de este texto; si no, una búsqueda inmediata
                        const cached = searchCache.current.get(searchKey('code', term))
                        let list: any[] = cached && Date.now() - cached.at < SEARCH_TTL ? cached.data : []
                        if (list.length === 0) {
                          searchAbort.current?.abort()
                          const response: any = await APIs.searchProducts('code', term, searchFilters())
                          list = response?.data ?? []
                        }
                        // Prioriza la coincidencia exacta de código o código de barras
                        const pick = list.find((p) => p.exact || p.code === term || p.barcode === term) ?? list[0]
                        if (pick) await selectResult(pick)
                      } catch {
                        /* sin resultado: se queda el texto para corregirlo */
                      }
                    }}
                    onFocus={() => setActiveField('code')}
                    onBlur={() => setTimeout(() => setActiveField((f) => (f === 'code' ? null : f)), 150)}
                  />
                </div>
                {activeField === 'code' && renderSearchResults('code')}
              </div>

              <div className="modal-sale-search-field">
                <label>Nombre</label>
                <div className="modal-sale-input-wrap">
                  <span className="material-symbols-rounded search-icon">search</span>
                  <input
                    className='modal-sale-input'
                    placeholder='Escribe el nombre (mínimo 3 letras)...'
                    type='text'
                    value={fields.name}
                    onChange={(e) => handleSearchNameChange(e.target.value)}
                    onFocus={() => setActiveField('name')}
                    onBlur={() => setTimeout(() => setActiveField((f) => (f === 'name' ? null : f)), 150)}
                  />
                </div>
                {activeField === 'name' && renderSearchResults('name')}
              </div>
            </div>
          </section>

          <section className="modal-sale-section">
            <div className="modal-sale-section-title">
              Artículos en la Ficha ({saleLines.length})
              {productionAreas.length > 0 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginLeft: '20px', verticalAlign: 'middle' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal', textTransform: 'none' }}>Área Predeterminada:</span>
                  <select
                    className='modal-sale-select'
                    style={{ height: '30px', fontSize: '0.8rem', padding: '0 8px' }}
                    value={defaultAreaId}
                    onChange={(e) => applyDefaultAreaToAll(e.target.value)}
                  >
                    <option value=''>—</option>
                    {productionAreas.map((area) => (
                      <option key={area.id} value={String(area.id)}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="modal-sale-table-wrap">
              <div className={`modal-sale-thead ${tableLayoutClass}`}>
                <div>Código</div>
                <div>Artículo</div>
                {hasSizedLines && (
                  <>
                    <div>Color</div>
                    <div>Talla</div>
                  </>
                )}
                {hasRangeLines && <div>Rango</div>}
                <div>Área Prod.</div>
                <div style={{ textAlign: 'center' }}>Cant.</div>
                <div style={{ textAlign: 'right' }}>Precio</div>
                <div style={{ textAlign: 'right' }}>Subtotal</div>
                <div style={{ width: '50px' }}></div>
              </div>

              <div className="modal-sale-tbody">
                {saleLines.length > 0 ? (
                  saleLines.map((line) => (
                    <div
                      className={`modal-sale-row ${tableLayoutClass}`}
                      key={line.key}
                    >
                      <div className='modal-sale-cell'>
                        {line.image && <img src={line.image} alt='' className='modal-sale-item-thumb' />}
                        <span className='modal-sale-price-tag'>{line.code || '—'}</span>
                      </div>
                      <div className='modal-sale-cell'>
                        <strong>{line.name}</strong>
                      </div>
                      {hasSizedLines && (
                        <>
                          <div className='modal-sale-cell'>
                            <select
                              className='modal-sale-row-select'
                              value={line.selectedColor ?? ''}
                              onChange={(e) => handleColorChange(line.key, e.target.value)}
                            >
                              <option value=''>Color</option>
                              {getVariationColors(line.variations).map((c) => (
                                <option key={c.color} value={c.color}>{c.color}</option>
                              ))}
                            </select>
                          </div>
                          <div className='modal-sale-cell'>
                            <select
                              className='modal-sale-row-select'
                              value={line.selectedSize ?? ''}
                              onChange={(e) => handleSizeChange(line.key, e.target.value)}
                              disabled={!line.selectedColor}
                            >
                              <option value=''>Talla</option>
                              {line.selectedColor
                                ? getSizesForColor(line.variations, line.selectedColor).map((v: any) => {
                                    const stock = getVariationStockForLine(line, line.selectedColor, v.size)
                                    return (
                                      <option key={v.id} value={v.size}>
                                        {stock != null ? `${v.size} (${stock})` : v.size}
                                      </option>
                                    )
                                })
                                : []}
                            </select>
                          </div>
                        </>
                      )}
                      {hasRangeLines && (
                        <div className='modal-sale-cell'>
                          <select
                            className='modal-sale-row-select'
                            value={line.priceRangeId ?? ''}
                            onChange={(e) => handleRangeChange(line.key, Number(e.target.value))}
                          >
                            <option value=''>Rango</option>
                            {line.priceRanges.map((range: any) => (
                              <option key={range.id} value={range.id}>
                                {formatRangeLabel(range)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className='modal-sale-cell'>
                        {renderAreaCell(line)}
                      </div>
                      <div className='modal-sale-cell'>
                        <input
                          className='modal-sale-row-input'
                          type='number'
                          min={0}
                          value={line.quantity === 0 ? '' : line.quantity}
                          onChange={(e) => updateQuantity(line.key, e.target.value)}
                        />
                      </div>
                      <div className='modal-sale-cell' style={{ justifyContent: 'flex-end' }}>
                        {isOwner ? (
                          <input
                            className='modal-sale-row-input'
                            type='number'
                            min={0}
                            value={line.unitPrice}
                            onChange={(e) => updateItemPrice(line.key, Number(e.target.value))}
                            style={{ textAlign: 'right', width: '80px' }}
                          />
                        ) : (
                          <span className="modal-sale-price-tag">{formatMoney(line.unitPrice)}</span>
                        )}
                      </div>
                      <div className='modal-sale-cell' style={{ justifyContent: 'flex-end' }}>
                        <strong>{formatMoney(line.unitPrice * line.quantity)}</strong>
                      </div>
                      <div className='modal-sale-cell' style={{ justifyContent: 'center' }}>
                        <button
                          type='button'
                          className='modal-sale-remove-btn'
                          onClick={() => removeLine(line.key)}
                        >
                          <span className="material-symbols-rounded">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='sales-sheet-table__empty' style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Busca y agrega artículos para iniciar la venta.
                  </div>
                )}
              </div>
            </div>
          </section>

          </div>
          <aside className="modal-sale-pos__side">
          {hasProductionLines && (
          <section className="modal-sale-section">
            <div className="modal-sale-section-title">Datos de la venta</div>
            <div className="modal-sale-meta-grid">
              <div className="modal-sale-meta-field">
                <label htmlFor='sales-sheet-due-date'>Fecha de entrega</label>
                <input
                  id='sales-sheet-due-date'
                  className='modal-sale-select'
                  type='date'
                  value={saleDueDate}
                  onChange={(e) => setSaleDueDate(e.target.value)}
                />
              </div>
              <div className="modal-sale-meta-field">
                <label htmlFor='sales-sheet-urgency'>Urgencia</label>
                <select
                  id='sales-sheet-urgency'
                  className='modal-sale-select'
                  value={saleUrgency}
                  onChange={(e) => setSaleUrgency(e.target.value)}
                >
                  {URGENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                      {option.percent > 0
                        ? ` (+${Math.round(option.percent * 100)}%)`
                        : ''}
                    </option>
                  ))}
                </select>
                <small className='sales-sheet-urgency-hint' style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Cargo extra: {getUrgencySurchargeLabel(saleUrgency)}
                  {totals.urgencySurcharge > 0
                    ? ` · ${formatMoney(totals.urgencySurcharge)}`
                    : ''}
                </small>
              </div>
            </div>
          </section>
          )}

          {posConfig.askPaymentMethod && paymentMethods.length > 0 && (
            <section className="modal-sale-section">
              <div className="modal-sale-section-title">Forma de pago</div>
              <div className="modal-sale-pay-options" role="radiogroup" aria-label="Forma de pago">
                {paymentMethods.map((m: any) => (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={String(m.id) === paymentMethodId}
                    className={`modal-sale-pay-option ${String(m.id) === paymentMethodId ? 'modal-sale-pay-option--active' : ''}`}
                    onClick={() => setPaymentMethodId(String(m.id))}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          <footer className="modal-sale-footer">
            <div className="modal-sale-totals">
              <div className="modal-sale-total-row">
                <span className="modal-sale-total-label">Subtotal</span>
                <span className="modal-sale-total-value">{formatMoney(totals.subtotal)}</span>
              </div>
              {posConfig.allowManualDiscount && (
              <div className="modal-sale-total-row">
                <span className="modal-sale-total-label">Descuento</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    className='modal-sale-row-input'
                    style={{ width: '60px', textAlign: 'center' }}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    type='number'
                    min={0}
                  />
                  <span className="modal-sale-total-value">%</span>
                </div>
              </div>
              )}
              {totals.urgencySurcharge > 0 && (
                <div className="modal-sale-total-row">
                  <span className="modal-sale-total-label">Urgencia ({Math.round(totals.urgencyPercent * 100)}%)</span>
                  <span className="modal-sale-total-value">{formatMoney(totals.urgencySurcharge)}</span>
                </div>
              )}
              <div className="modal-sale-total-row">
                <span className="modal-sale-total-label">IVA</span>
                <span className="modal-sale-total-value">{formatMoney(totals.iva)}</span>
              </div>
              <div className="modal-sale-total-main">
                <span className="label">Total</span>
                <span className="value">{formatMoney(totals.total)}</span>
              </div>
            </div>

            {sellStatus?.canSell && sellStatus.expired && (
              <div role='status' className='modal-sale-noshift modal-sale-noshift--soft'>
                <span className='material-symbols-rounded'>info</span>
                <span>
                  {sellStatus.why === 'EXEMPT_ROLE'
                    ? 'Tu turno ya terminó, pero tu rol (dueño o administrador) puede seguir vendiendo. Actívalo en Configuración de Caja con "Aplicar también a dueños y administradores".'
                    : 'Tu turno ya terminó, pero el bloqueo de ventas al terminar el turno está desactivado en Configuración de Caja.'}
                </span>
              </div>
            )}
            {sellStatus && !sellStatus.canSell && (
              <div role='alert' className='modal-sale-noshift'>
                <span className='material-symbols-rounded'>lock_clock</span>
                <span>{sellStatus.reason}</span>
              </div>
            )}
            <div className="modal-sale-footer-actions">
              <button
                type='button'
                className='btn-cancel'
                onClick={requestClose}
              >
                Cerrar ficha
              </button>
              <button
                type='button'
                className='btn-save'
                onClick={handleCobrar}
                disabled={isSubmitting || (!!sellStatus && !sellStatus.canSell)}
                title={sellStatus && !sellStatus.canSell ? (sellStatus.reason ?? undefined) : undefined}
              >
                {isSubmitting ? 'Cobrando...' : `Cobrar ${formatMoney(totals.total)}`}
              </button>
            </div>
          </footer>
          </aside>
        </div>

        {sellStatus && (
          <div className={`modal-sale-statusbar ${sellStatus.canSell ? '' : 'is-blocked'}`} title={sellStatus.debug ? `Usuario ${sellStatus.debug.userId} · nivel de rol ${sellStatus.debug.roleLevel} · sucursal ${sellStatus.debug.branchId} · tolerancia ${sellStatus.debug.graceMin} min` : undefined}>
            <span className='modal-sale-statusbar__item'>
              <span className='material-symbols-rounded'>receipt_long</span>
              <span className='k'>Turno</span>
              <strong>{sellStatus.shift ? `#${sellStatus.shift.id}` : 'Sin turno'}</strong>
            </span>
            <span className='modal-sale-statusbar__item'>
              <span className='material-symbols-rounded'>point_of_sale</span>
              <span className='k'>Caja</span>
              <strong>{sellStatus.shift?.register ?? 'Sin caja'}</strong>
            </span>
            <span className='modal-sale-statusbar__item'>
              <span className='material-symbols-rounded'>schedule</span>
              <span className='k'>Horario programado</span>
              <strong>
                {sellStatus.shift?.schedule
                  ? `${sellStatus.shift.schedule}${sellStatus.shift.inferred ? ' (por la hora de apertura)' : ''}`
                  : sellStatus.shift?.outsideSchedule
                    ? 'Fuera de horario'
                    : 'Sin horario programado'}
              </strong>
            </span>
            {sellStatus.shift && (
              <span className={`modal-sale-statusbar__chip ${sellStatus.expired || !sellStatus.canSell ? 'late' : 'ok'}`}>
                {!sellStatus.canSell
                  ? sellStatus.why === 'OUTSIDE_SCHEDULE' ? 'No puede vender' : sellStatus.why === 'SHIFT_EXPIRED' ? 'Turno vencido' : 'Sin turno'
                  : sellStatus.expired ? 'Turno vencido' : 'En horario'}
              </span>
            )}
            {sellStatus.why === 'EXEMPT_ROLE' && <span className='modal-sale-statusbar__chip info'>Rol sin restricción de turno</span>}
            {sellStatus.why === 'NOT_REQUIRED' && <span className='modal-sale-statusbar__chip info'>Turno no obligatorio</span>}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default ModalSheet
