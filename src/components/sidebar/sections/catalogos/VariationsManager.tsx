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
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [sku, setSku] = useState('')
  const [variationImages, setVariationImages] = useState<string[]>([])

  const activeColorHex = useCustomColor ? customHex : selectedColor?.hex
  const activeColorName = useCustomColor ? 'Personalizado' : selectedColor?.name

  const handleSelectPaletteColor = (color: PaletteColor) => {
    setUseCustomColor(false)
    setSelectedColor(color)
  }

  const handleCustomColorChange = (hex: string) => {
    setCustomHex(hex)
    setUseCustomColor(true)
    setSelectedColor(null)
  }

  const handleToggleSize = (sizeName: string) => {
    if (selectedSizes.includes(sizeName)) {
      setSelectedSizes(selectedSizes.filter(s => s !== sizeName))
    } else {
      setSelectedSizes([...selectedSizes, sizeName])
    }
  }

  const handleAddVariation = () => {
    if (!activeColorName || !activeColorHex) {
      alert('Selecciona un color de la paleta')
      return
    }
    if (selectedSizes.length === 0) {
      alert('Selecciona al menos una talla')
      return
    }

    // Crear una variación por cada talla seleccionada
    // Las imágenes se guardan en todas las tallas del mismo color
    const newVariations: Variation[] = selectedSizes.map(size => ({
      color: activeColorName,
      colorHex: activeColorHex,
      size: size,
      sku: sku.trim() ? `${sku.trim()}-${size}` : '',
      images: variationImages.length > 0 ? variationImages : undefined,
    }))

    onChange([...variations, ...newVariations])
    setSelectedColor(null)
    setUseCustomColor(false)
    setCustomHex('#586ae9')
    setSelectedSizes([])
    setSku('')
    setVariationImages([])
  }
  
  const handleImageSelect = (files: File[]) => {
    const validFiles = files.filter((f) => f.type.startsWith('image/'))
    if (!validFiles.length) return

    const readPromises = validFiles.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(String(reader.result ?? ''))
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
    )

    Promise.all(readPromises).then((base64Images) => {
      setVariationImages((prev) => [...prev, ...base64Images])
    })
  }

  const handleRemoveVariationImage = (index: number) => {
    setVariationImages(variationImages.filter((_, i) => i !== index))
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
        <span className='variations-manager__label'>
          Paleta de tallas {selectedSizes.length > 0 && `(${selectedSizes.length} seleccionada${selectedSizes.length === 1 ? '' : 's'})`}
        </span>
        <div className='variations-manager__size-palette'>
          {sizePalette.map((size) => (
            <button
              key={size.id}
              type='button'
              className={`variations-manager__size-chip ${selectedSizes.includes(size.name) ? 'is-selected' : ''}`}
              onClick={() => handleToggleSize(size.name)}
            >
              {size.name}
            </button>
          ))}
        </div>
        {selectedSizes.length > 0 && (
          <div className='variations-manager__selected-sizes'>
            <span style={{ fontSize: '13px', color: '#aaa' }}>Seleccionadas: </span>
            {selectedSizes.map((size, idx) => (
              <span key={idx} style={{ fontSize: '13px', color: '#fff', marginRight: '8px' }}>
                {size}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className='variations-manager__extras'>
        <div className='variations-manager__extra-field variations-manager__extra-field--sku'>
          <label className='variations-manager__label'>SKU (opcional)</label>
          <input
            className='inputs__general'
            type='text'
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder='Ej: CAM-001-R-M'
          />
        </div>
        <div className='variations-manager__extra-field variations-manager__extra-field--images'>
          <label className='variations-manager__label'>Imágenes del color (opcional)</label>
          <label className='variations-manager__upload-btn'>
            <span className='material-symbols-rounded variations-manager__upload-icon' aria-hidden>
              add_photo_alternate
            </span>
            <span>
              {variationImages.length > 0
                ? `Agregar más (${variationImages.length} subida${variationImages.length === 1 ? '' : 's'})`
                : 'Subir imágenes'}
            </span>
            <input
              type='file'
              accept='image/*'
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                handleImageSelect(files)
                e.target.value = ''
              }}
              className='variations-manager__upload-input'
            />
          </label>
          {variationImages.length > 0 && (
            <div className='variations-manager__images-grid'>
              {variationImages.map((img, idx) => (
                <div key={idx} className='variations-manager__image-item'>
                  <img src={img} alt={`Variación ${idx}`} className='variations-manager__image-thumb' />
                  <button
                    type='button'
                    onClick={() => handleRemoveVariationImage(idx)}
                    className='variations-manager__image-remove'
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
          {selectedSizes.length > 1 
            ? `Agregar ${selectedSizes.length} variaciones` 
            : 'Agregar variación'}
        </button>
      </div>

      {variations.length > 0 && (() => {
        // Orden de tallas estándar
        const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
        
        // Función para ordenar tallas
        const sortSizes = (sizes: string[]) => {
          return sizes.sort((a, b) => {
            const indexA = sizeOrder.indexOf(a);
            const indexB = sizeOrder.indexOf(b);
            // Si ambas están en el orden estándar, usar ese orden
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            // Si solo una está en el orden estándar, ponerla primero
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            // Si ninguna está, ordenar alfabéticamente
            return a.localeCompare(b);
          });
        };

        // Agrupar variaciones por color
        const groupedByColor = variations.reduce((acc, variation, index) => {
          const key = variation.color; // Solo usar el color como key
          if (!acc[key]) {
            acc[key] = {
              color: variation.color,
              colorHex: variation.colorHex,
              sizes: [],
              images: variation.images, // Tomar imágenes de la primera variación
              indices: []
            };
          }
          acc[key].sizes.push(variation.size);
          acc[key].indices.push(index);
          // Si esta variación tiene imágenes y el grupo no las tiene, usarlas
          if (!acc[key].images && variation.images) {
            acc[key].images = variation.images;
          }
          return acc;
        }, {} as Record<string, { color: string; colorHex?: string; sizes: string[]; images?: string[]; indices: number[] }>);

        // Ordenar las tallas en cada grupo
        Object.values(groupedByColor).forEach(group => {
          group.sizes = sortSizes(group.sizes);
        });

        return (
          <div className='variations-manager__list'>
            <table className='variations-manager__table'>
              <thead>
                <tr>
                  <th>Color</th>
                  <th>Tallas</th>
                  <th>Imágenes</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(groupedByColor).map((group, groupIndex) => (
                  <tr key={groupIndex}>
                    <td>
                      <div className='variations-manager__color-cell'>
                        <span
                          className='variations-manager__color-cell-dot'
                          style={{ backgroundColor: group.colorHex ?? COLOR_HEX[group.color] ?? '#586ae9' }}
                        />
                        <span>{group.color}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {group.sizes.map((size, idx) => (
                          <span 
                            key={idx}
                            style={{
                              background: '#2a2d35',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '13px',
                              color: '#fff'
                            }}
                          >
                            {size}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {group.images && group.images.length > 0 ? (
                        <div className='variations-manager__table-images'>
                          {group.images.slice(0, 5).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`${group.color} ${idx + 1}`}
                              className='variations-manager__table-image-thumb'
                            />
                          ))}
                          {group.images.length > 5 && (
                            <span className='variations-manager__table-images-more'>+{group.images.length - 5}</span>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <button
                        type='button'
                        onClick={() => {
                          // Eliminar todas las variaciones de este color
                          const newVariations = variations.filter((_, i) => !group.indices.includes(i));
                          onChange(newVariations);
                        }}
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
        );
      })()}
    </div>
  )
}

export default VariationsManager
