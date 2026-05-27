import React, { useMemo, useState } from 'react'
import baseColors from '../store/products/modal/json/baseColors.json'
import sizes from '../store/products/modal/json/sizes.json'
import './VariationsManager.css'

const COLOR_HEX: Record<string, string> = {
  Blanco: '#ffffff',
  Negro: '#1a1a1a',
  Rojo: '#e53935',
  Azul: '#1e88e5',
  Verde: '#43a047',
  Amarillo: '#fdd835',
  Naranja: '#fb8c00',
  Rosa: '#ec407a',
  Morado: '#8e24aa',
  Gris: '#9e9e9e',
}

export interface Variation {
  id?: number
  color: string
  colorHex?: string
  size: string
  sku: string
  price: string
  images?: string[]
}

interface VariationsManagerProps {
  variations: Variation[]
  onChange: (variations: Variation[]) => void
}

type PaletteColor = {
  id: number
  name: string
  hex: string
}

const VariationsManager: React.FC<VariationsManagerProps> = ({ variations, onChange }) => {
  const colorPalette = useMemo<PaletteColor[]>(
    () =>
      (baseColors as { id: number; name: string }[]).map((c) => ({
        id: c.id,
        name: c.name,
        hex: COLOR_HEX[c.name] ?? '#586ae9',
      })),
    [],
  )

  const sizePalette = sizes as { id: number; name: string }[]

  const [selectedColor, setSelectedColor] = useState<PaletteColor | null>(null)
  const [customHex, setCustomHex] = useState('#586ae9')
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [sku, setSku] = useState('')
  const [price, setPrice] = useState('')
  const [variationImages, setVariationImages] = useState<string[]>([])

  const activeColorHex = useCustomColor ? customHex : selectedColor?.hex
  const activeColorName = useCustomColor ? 'Personalizado' : selectedColor?.name

  const resolveColorHex = (variation: Variation) =>
    variation.colorHex ?? COLOR_HEX[variation.color] ?? '#586ae9'

  const handleSelectPaletteColor = (color: PaletteColor) => {
    setUseCustomColor(false)
    setSelectedColor(color)
  }

  const handleCustomColorChange = (hex: string) => {
    setCustomHex(hex)
    setUseCustomColor(true)
    setSelectedColor(null)
  }

  const handleAddVariation = () => {
    if (!activeColorName || !activeColorHex) {
      alert('Selecciona un color de la paleta')
      return
    }
    if (!selectedSize) {
      alert('Selecciona una talla de la paleta')
      return
    }

    const newVariation: Variation = {
      color: activeColorName,
      colorHex: activeColorHex,
      size: selectedSize,
      sku: sku.trim(),
      price: price.trim(),
      images: variationImages.length > 0 ? variationImages : undefined,
    }

    onChange([...variations, newVariation])
    setSelectedColor(null)
    setUseCustomColor(false)
    setCustomHex('#586ae9')
    setSelectedSize(null)
    setSku('')
    setPrice('')
    setVariationImages([])
  }
  
  const handleImageSelect = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setVariationImages([...variationImages, base64])
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveVariationImage = (index: number) => {
    setVariationImages(variationImages.filter((_, i) => i !== index))
  }

  const handleRemoveVariation = (index: number) => {
    onChange(variations.filter((_, i) => i !== index))
  }

  return (
    <div className='variations-manager'>
      <h3 className='variations-manager__title'>Variaciones (colores y tallas)</h3>

      <div className='variations-manager__section'>
        <span className='variations-manager__label'>Paleta de colores</span>
        <div className='variations-manager__color-palette'>
          {colorPalette.map((color) => (
            <button
              key={color.id}
              type='button'
              className={`variations-manager__color-swatch ${
                !useCustomColor && selectedColor?.id === color.id ? 'is-selected' : ''
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
              aria-label={`Color ${color.name}`}
              onClick={() => handleSelectPaletteColor(color)}
            />
          ))}
          <div
            className={`variations-manager__color-swatch variations-manager__color-swatch--custom ${
              useCustomColor ? 'is-selected' : ''
            }`}
            style={{ backgroundColor: useCustomColor ? customHex : undefined }}
            title='Color personalizado'
          >
            {!useCustomColor && (
              <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 -960 960 960' fill='#e8eaed'>
                <path d='M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 32.5-156t88-127Q256-817 330-848.5T488-880q80 0 151 27.5t124.5 76q53.5 48.5 85 115T880-518q0 115-70 176.5T640-280h-74q-9 0-12.5 5t-3.5 11q0 12 15 34.5t15 51.5q0 50-27.5 74T480-80ZM260-440q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm120-160q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm200 0q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm120 160q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Z' />
              </svg>
            )}
            <input
              type='color'
              className='variations-manager__color-input-hidden'
              value={customHex}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              aria-label='Seleccionar color personalizado'
            />
          </div>
        </div>
        {activeColorHex && activeColorName ? (
          <div className='variations-manager__selected-color'>
            <span
              className='variations-manager__selected-color-preview'
              style={{ backgroundColor: activeColorHex }}
            />
            <span>
              {activeColorName}
              {useCustomColor ? ` (${customHex})` : ''}
            </span>
          </div>
        ) : null}
      </div>

      <div className='variations-manager__section'>
        <span className='variations-manager__label'>Paleta de tallas</span>
        <div className='variations-manager__size-palette'>
          {sizePalette.map((size) => (
            <button
              key={size.id}
              type='button'
              className={`variations-manager__size-chip ${selectedSize === size.name ? 'is-selected' : ''}`}
              onClick={() => setSelectedSize(size.name)}
            >
              {size.name}
            </button>
          ))}
        </div>
      </div>

      <div className='variations-manager__extras'>
        <div>
          <label className='variations-manager__label'>SKU (opcional)</label>
          <input
            className='inputs__general'
            type='text'
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder='Ej: CAM-001-R-M'
          />
        </div>
        <div>
          <label className='variations-manager__label'>Precio (opcional)</label>
          <input
            className='inputs__general'
            type='number'
            step='0.01'
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder='0.00'
          />
        </div>
        <div>
          <label className='variations-manager__label'>Imágenes del color (opcional)</label>
          <input
            type='file'
            accept='image/*'
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              files.forEach(handleImageSelect)
              e.target.value = ''
            }}
            className='inputs__general'
          />
          {variationImages.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              {variationImages.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', width: '60px', height: '60px' }}>
                  <img src={img} alt={`Variación ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                  <button
                    type='button'
                    onClick={() => handleRemoveVariationImage(idx)}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#e53935',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      lineHeight: '1'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type='button'
          onClick={handleAddVariation}
          className='btn__general-purple variations-manager__add-btn'
        >
          Agregar
        </button>
      </div>

      {variations.length > 0 && (
        <div className='variations-manager__list'>
          <table className='variations-manager__table'>
            <thead>
              <tr>
                <th>Color</th>
                <th>Talla</th>
                <th>SKU</th>
                <th>Precio</th>
                <th>Imágenes</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {variations.map((variation, index) => (
                <tr key={index}>
                  <td>
                    <div className='variations-manager__color-cell'>
                      <span
                        className='variations-manager__color-cell-dot'
                        style={{ backgroundColor: resolveColorHex(variation) }}
                      />
                      <span>{variation.color}</span>
                    </div>
                  </td>
                  <td>{variation.size}</td>
                  <td>{variation.sku || '—'}</td>
                  <td>{variation.price ? `$${variation.price}` : '—'}</td>
                  <td>
                    {variation.images && variation.images.length > 0 ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {variation.images.slice(0, 3).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`${variation.color} ${idx + 1}`}
                            style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        ))}
                        {variation.images.length > 3 && (
                          <span style={{ fontSize: '12px', alignSelf: 'center' }}>+{variation.images.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <button
                      type='button'
                      onClick={() => handleRemoveVariation(index)}
                      className='btn__general-danger'
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default VariationsManager
