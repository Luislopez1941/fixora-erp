import React, { useEffect, useMemo, useState } from 'react'
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

  const [searchResults, setSearchResults] = useState<any[]>([])
  const [saleLines, setSaleLines] = useState<SaleLine[]>([])
  const [showCodeResults, setShowCodeResults] = useState(false)
  const [discount, setDiscount] = useState('0')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productionAreas, setProductionAreas] = useState<any[]>([])
  const [defaultAreaId, setDefaultAreaId] = useState<string>('')
  const [saleDueDate, setSaleDueDate] = useState('')
  const [saleUrgency, setSaleUrgency] = useState('NORMAL')

  const [fields, setFields] = useState({
    codigo: '',
    name: '',
  })

  const handleModalChange = (value: string) => {
    dispatch(modal(value))
  }

  useEffect(() => {
    if (!isOpen) return

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

    loadAreas()
  }, [isOpen])

  const searchProducts = async (code: string, name: string) => {
    const companyId = readCompanyId()
    if (!companyId) {
      setSearchResults([])
      return
    }

    try {
      const response: any = await APIs.getProducts(code, name, undefined, {
        companyId,
        branchId: readBranchId(),
      })
      setSearchResults(response?.data ?? [])
    } catch (error) {
      console.error('Error al obtener los productos:', error)
      setSearchResults([])
    }
  }

  const handleSearchCodeChange = async (code: string) => {
    setFields((prev) => ({ ...prev, codigo: code }))
    setShowCodeResults(code.trim().length > 0)
    await searchProducts(code, '')
  }

  const handleSearchNameChange = async (name: string) => {
    setFields((prev) => {
      void searchProducts(prev.codigo, name)
      return { ...prev, name }
    })
  }

  const addProduct = (product: any) => {
    const usesSizes = product.usesSizes === true
    const trackInventory = product.trackInventory !== false
    const variations = getProductVariations(product)
    const stores = getProductStores(product)
    const storeId = stores[0]?.storeId ?? stores[0]?.id ?? 0
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
    setSearchResults([])
    setShowCodeResults(false)
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
  const tableLayoutClass = `${getTableLayoutClass()} sales-sheet-table--production`.trim()

  const resetSaleForm = () => {
    setSaleLines([])
    setDiscount('0')
    setDefaultAreaId('')
    setSaleDueDate('')
    setSaleUrgency('NORMAL')
    setFields({ codigo: '', name: '' })
    setSearchResults([])
    setShowCodeResults(false)
  }

  const handleCobrar = async () => {
    const companyId = readCompanyId()
    const branchId = readBranchId()
    const userId = Number(userState?.id ?? userState?._id)

    if (!companyId) {
      Swal.fire({
        icon: 'warning',
        title: 'Empresa requerida',
        text: 'Selecciona una empresa antes de cobrar.',
      })
      return
    }

    if (!branchId) {
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

      const payload = {
        companyId,
        branchId,
        userId,
        storeId: consolidatedLines[0]?.storeId || undefined,
        discount: submitTotals.discountValue,
        urgency: saleUrgency,
        dueDate: saleDueDate || undefined,
        lines: consolidatedLines.map((line) => ({
          itemId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          storeId: line.storeId,
          itemVariationId: line.itemVariationId ?? undefined,
          priceRangeId: line.priceRangeId ?? undefined,
          code: line.code,
          name: line.name,
          areaId: line.areaId ?? undefined,
        })),
        payments: [
          {
            amount: submitTotals.total,
          },
        ],
      }

      const response: any = await APIs.createSale(payload)

      Swal.fire({
        icon: 'success',
        title: 'Venta registrada',
        text: response?.message ?? 'La venta se guardó correctamente.',
        confirmButtonColor: '#586ae9',
      })

      resetSaleForm()
      handleModalChange('')
      onSaved?.()
    } catch (error: any) {
      console.error('Error al cobrar:', error)
      Swal.fire({
        icon: 'error',
        title: 'No se pudo cobrar',
        text:
          error?.response?.data?.message ??
          'Ocurrió un error al registrar la venta.',
        confirmButtonColor: '#d33',
      })
    } finally {
      setIsSubmitting(false)
    }
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

  const renderVariationCells = (line: SaleLine) => {
    if (!line.usesSizes) {
      return (
        <>
          <div className='sales-sheet-table__cell sales-sheet-table__cell--muted'>
            <span>—</span>
          </div>
          <div className='sales-sheet-table__cell sales-sheet-table__cell--muted'>
            <span>—</span>
          </div>
        </>
      )
    }

    const colors = getVariationColors(line.variations)
    const sizes = line.selectedColor
      ? getSizesForColor(line.variations, line.selectedColor)
      : []

    return (
      <>
        <div className='sales-sheet-table__cell'>
          <select
            className='traditional__selector sales-sheet-variation-select'
            value={line.selectedColor ?? ''}
            onChange={(e) => handleColorChange(line.key, e.target.value)}
          >
            <option value=''>Color</option>
            {colors.map((c) => (
              <option key={c.color} value={c.color}>
                {c.color}
              </option>
            ))}
          </select>
        </div>
        <div className='sales-sheet-table__cell sales-sheet-table__cell--size'>
          <select
            className='traditional__selector sales-sheet-variation-select'
            value={line.selectedSize ?? ''}
            onChange={(e) => handleSizeChange(line.key, e.target.value)}
            disabled={!line.selectedColor}
          >
            <option value=''>Talla</option>
            {sizes.map((v: any) => {
              const sizeStock = getVariationStockForLine(
                line,
                line.selectedColor,
                v.size,
              )
              return (
                <option key={v.id} value={v.size}>
                  {sizeStock != null ? `${v.size} (${sizeStock})` : v.size}
                </option>
              )
            })}
          </select>
        </div>
      </>
    )
  }

  const renderRangeCell = (line: SaleLine) => {
    if (!line.priceRanges.length) {
      return (
        <div className='sales-sheet-table__cell sales-sheet-table__cell--muted'>
          <span>—</span>
        </div>
      )
    }

    return (
      <div className='sales-sheet-table__cell sales-sheet-table__cell--range'>
        <select
          className='traditional__selector sales-sheet-variation-select'
          value={line.priceRangeId ?? ''}
          onChange={(e) => handleRangeChange(line.key, Number(e.target.value))}
        >
          <option value=''>Rango</option>
          {line.priceRanges.map((range: any) => (
            <option key={range.id} value={range.id}>
              {formatRangeLabel(range)} · {formatMoney(Number(range.price))}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className={`overlay__sales-sheet_modal ${isOpen ? 'active' : ''}`}>
      <div className={`popup__sales-sheet_modal ${isOpen ? 'active' : ''}`}>
        <div className='sales-sheet-modal'>
          <button
            type='button'
            className='sales-sheet-modal__close'
            onClick={() => handleModalChange('')}
            aria-label='Cerrar'
          >
            ×
          </button>

          <div className='sales-sheet-modal__body'>
            <section className='sales-sheet-toolbar'>
              <div className='sales-sheet-toolbar__search-group'>
                <label className='sales-sheet-label'>Buscar artículo</label>
                <div className='sales-sheet-search-row'>
                  <div className='sales-sheet-search-field'>
                    <div className='inputs__general_icons sales-sheet-search-input'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='20'
                        height='20'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        aria-hidden
                      >
                        <path d='M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0' />
                        <path d='M21 21l-6 -6' />
                      </svg>
                      <input
                        className='inputs__generic'
                        placeholder='Código'
                        value={fields.codigo}
                        type='text'
                        onChange={(e) => handleSearchCodeChange(e.target.value)}
                      />
                    </div>

                    {showCodeResults ? (
                      <div className='sales-sheet-search-results'>
                        {searchResults.length > 0 ? (
                          searchResults.map((product: any) => (
                            <button
                              type='button'
                              key={product.id}
                              className='sales-sheet-search-result'
                              onClick={() => addProduct(product)}
                            >
                              <div className='sales-sheet-search-result__info'>
                                <strong>{product.name}</strong>
                                <span>{product.code}</span>
                                {product.usesSizes ? (
                                  <span className='sales-sheet-search-result__tag'>
                                    Usa tallas
                                  </span>
                                ) : null}
                              </div>
                              {getProductImage(product) ? (
                                <img
                                  src={getProductImage(product) ?? ''}
                                  alt=''
                                  className='sales-sheet-search-result__img'
                                />
                              ) : (
                                <div className='sales-sheet-search-result__img sales-sheet-search-result__img--empty'>
                                  —
                                </div>
                              )}
                            </button>
                          ))
                        ) : (
                          <p className='sales-sheet-search-empty'>Sin resultados</p>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className='sales-sheet-search-field'>
                    <div className='inputs__general_icons sales-sheet-search-input'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='20'
                        height='20'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        aria-hidden
                      >
                        <path d='M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0' />
                        <path d='M21 21l-6 -6' />
                      </svg>
                      <input
                        className='inputs__generic'
                        placeholder='Nombre'
                        type='text'
                        value={fields.name}
                        onChange={(e) => handleSearchNameChange(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className='sales-sheet-toolbar__actions'>
                <button type='button' className='sales-sheet-btn sales-sheet-btn--warning'>
                  Recargas
                </button>
                <button type='button' className='sales-sheet-btn sales-sheet-btn--purple'>
                  Servicios
                </button>
              </div>
            </section>

            <div className='sales-sheet-sale-meta'>
              <div className='sales-sheet-sale-meta__field'>
                <label htmlFor='sales-sheet-due-date'>Fecha de entrega</label>
                <input
                  id='sales-sheet-due-date'
                  className='inputs__general'
                  type='date'
                  value={saleDueDate}
                  onChange={(e) => setSaleDueDate(e.target.value)}
                />
              </div>
              <div className='sales-sheet-sale-meta__field'>
                <label htmlFor='sales-sheet-urgency'>Urgencia</label>
                <select
                  id='sales-sheet-urgency'
                  className='inputs__general'
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
                <small className='sales-sheet-urgency-hint'>
                  Cargo extra: {getUrgencySurchargeLabel(saleUrgency)}
                  {totals.urgencySurcharge > 0
                    ? ` · ${formatMoney(totals.urgencySurcharge)}`
                    : ''}
                </small>
              </div>
            </div>

            <section className='sales-sheet-table-section'>
              <div className='sales-sheet-table-meta'>
                <div className='sales-sheet-table-meta-left'>
                  <p>Productos en la ficha</p>
                  <span className='sales-sheet-table-count'>{saleLines.length}</span>
                </div>
                {productionAreas.length > 0 ? (
                  <div className='sales-sheet-default-area'>
                    <label htmlFor='sales-sheet-default-area'>Área predeterminada</label>
                    <select
                      id='sales-sheet-default-area'
                      className='traditional__selector sales-sheet-area-select'
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
                ) : null}
              </div>
              {hasProductionLines && productionAreas.length === 0 ? (
                <p className='sales-sheet-production-warning'>
                  Hay artículos bajo pedido pero no hay áreas de producción. Créalas en
                  Producción → Áreas.
                </p>
              ) : null}

              <div className='sales-sheet-table-wrap'>
                <div className={`sales-sheet-table__head ${tableLayoutClass}`}>
                  <span>Código</span>
                  <span>Artículo</span>
                  {hasSizedLines ? (
                    <>
                      <span>Color</span>
                      <span>Talla</span>
                    </>
                  ) : null}
                  {hasRangeLines ? <span>Rango</span> : null}
                  <span>Área producción</span>
                  <span className='sales-sheet-table__head-col sales-sheet-table__head-col--center'>
                    Cantidad
                  </span>
                  <span className='sales-sheet-table__head-col sales-sheet-table__head-col--end'>
                    Precio
                  </span>
                  <span className='sales-sheet-table__head-col sales-sheet-table__head-col--end'>
                    Subtotal
                  </span>
                  <span aria-hidden />
                </div>

                {saleLines.length > 0 ? (
                  <div className='sales-sheet-table__body'>
                    {saleLines.map((line) => (
                      <div
                        className={`sales-sheet-table__row ${tableLayoutClass}`}
                        key={line.key}
                      >
                        <div className='sales-sheet-table__cell sales-sheet-table__cell--code'>
                          {line.image ? (
                            <img
                              src={line.image}
                              alt=''
                              className='sales-sheet-line-thumb'
                            />
                          ) : null}
                          <span className='sales-sheet-line-code'>{line.code || '—'}</span>
                        </div>
                        <div className='sales-sheet-table__cell sales-sheet-table__cell--article'>
                          <strong>{line.name}</strong>
                        </div>
                        {hasSizedLines ? renderVariationCells(line) : null}
                        {hasRangeLines ? renderRangeCell(line) : null}
                        {renderAreaCell(line)}
                        <div className='sales-sheet-table__cell sales-sheet-table__cell--qty'>
                          <input
                            className='inputs__general sales-sheet-qty-input'
                            type='number'
                            min={0}
                            max={
                              line.usesSizes &&
                              line.selectedColor &&
                              line.selectedSize
                                ? getVariationStockForLine(
                                    line,
                                    line.selectedColor,
                                    line.selectedSize,
                                  ) ?? undefined
                                : undefined
                            }
                            value={line.quantity === 0 ? '' : line.quantity}
                            onChange={(e) => updateQuantity(line.key, e.target.value)}
                          />
                        </div>
                        <div className='sales-sheet-table__cell sales-sheet-table__cell--price'>
                          {line.discountPercent > 0 ? (
                            <span className='sales-sheet-price-with-discount'>
                              <small>{formatMoney(line.listUnitPrice)}</small>
                              <strong>{formatMoney(line.unitPrice)}</strong>
                              <span>-{line.discountPercent}%</span>
                            </span>
                          ) : (
                            formatMoney(line.unitPrice)
                          )}
                        </div>
                        <div className='sales-sheet-table__cell sales-sheet-table__cell--subtotal'>
                          {formatMoney(line.unitPrice * line.quantity)}
                        </div>
                        <div className='sales-sheet-table__cell sales-sheet-table__cell--actions'>
                          <button
                            type='button'
                            className='sales-sheet-delete-btn'
                            onClick={() => removeLine(line.key)}
                            title='Quitar'
                          >
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              width='18'
                              height='18'
                              viewBox='0 0 24 24'
                              fill='currentColor'
                              aria-hidden
                            >
                              <path d='M20 6a1 1 0 0 1 .117 1.993l-.117 .007h-.081l-.919 11a3 3 0 0 1 -2.824 2.995l-.176 .005h-8c-1.598 0 -2.904 -1.249 -2.992 -2.75l-.005 -.167l-.923 -11.083h-.08a1 1 0 0 1 -.117 -1.993l.117 -.007h16z' />
                              <path d='M14 2a2 2 0 0 1 2 2a1 1 0 0 1 -1.993 .117l-.007 -.117h-4l-.007 .117a1 1 0 0 1 -1.993 -.117a2 2 0 0 1 1.85 -1.995l.15 -.005h4z' />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='sales-sheet-table__empty'>
                    Busca y agrega artículos para iniciar la venta.
                  </div>
                )}
              </div>
            </section>
          </div>

          <footer className='sales-sheet-modal__footer'>
            <div className='sales-sheet-totals'>
              <div className='sales-sheet-total-card'>
                <span>Subtotal</span>
                <strong>{formatMoney(totals.subtotal)}</strong>
              </div>
              <div className='sales-sheet-total-card sales-sheet-total-card--discount'>
                <span>Descuento</span>
                <input
                  className='sales-sheet-discount-input'
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  type='number'
                  min={0}
                />
              </div>
              {totals.urgencySurcharge > 0 ? (
                <div className='sales-sheet-total-card sales-sheet-total-card--urgency'>
                  <span>
                    Urgencia ({Math.round(totals.urgencyPercent * 100)}%)
                  </span>
                  <strong>{formatMoney(totals.urgencySurcharge)}</strong>
                </div>
              ) : null}
              <div className='sales-sheet-total-card sales-sheet-total-card--iva'>
                <span>IVA</span>
                <strong>{formatMoney(totals.iva)}</strong>
              </div>
              <div className='sales-sheet-total-card sales-sheet-total-card--total'>
                <span>Total</span>
                <strong>{formatMoney(totals.total)}</strong>
              </div>
            </div>

            <div className='sales-sheet-footer-actions'>
              <button type='button' className='btn__general-primary' disabled={isSubmitting}>
                Cobrar y facturar
              </button>
              <button type='button' className='sales-sheet-btn sales-sheet-btn--ghost' disabled={isSubmitting}>
                Agregar a deudores
              </button>
              <button
                type='button'
                className='btn__general-primary'
                onClick={handleCobrar}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Cobrando...' : 'Cobrar'}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default ModalSheet
