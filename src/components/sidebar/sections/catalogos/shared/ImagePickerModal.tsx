import React, { useRef } from 'react'
import './ImagePickerModal.css'

type ImagePickerModalProps = {
  open: boolean
  title?: string
  images: string[]
  onChange: (images: string[]) => void
  onClose: () => void
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result ?? ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  open,
  title = 'Imágenes del artículo',
  images,
  onChange,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const uploaded: string[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      uploaded.push(await readFileAsDataUrl(file))
    }

    if (uploaded.length) {
      onChange([...images, ...uploaded])
    }

    e.target.value = ''
  }

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className='image-picker-overlay' onClick={onClose}>
      <div className='image-picker-modal' onClick={(e) => e.stopPropagation()}>
        <div className='image-picker-modal__header'>
          <p className='image-picker-modal__title'>{title}</p>
          <button type='button' className='image-picker-modal__close' onClick={onClose} aria-label='Cerrar'>
            ×
          </button>
        </div>

        <div className='image-picker-modal__toolbar'>
          <button
            type='button'
            className='btn__general-purple image-picker-modal__upload-btn'
            onClick={() => fileInputRef.current?.click()}
          >
            <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
              <path d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z' />
            </svg>
            Subir imagen
          </button>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            multiple
            className='image-picker-modal__file-input'
            onChange={handleUpload}
          />
          <span className='image-picker-modal__count'>{images.length} imagen{images.length === 1 ? '' : 'es'}</span>
        </div>

        <div className='image-picker-modal__body'>
          {images.length > 0 ? (
            <div className='image-picker-modal__grid'>
              {images.map((src, index) => (
                <div className='image-picker-modal__card' key={`${index}-${src.slice(0, 24)}`}>
                  <img src={src} alt={`Imagen ${index + 1}`} />
                  <button
                    type='button'
                    className='image-picker-modal__remove'
                    onClick={() => handleRemove(index)}
                    aria-label={`Eliminar imagen ${index + 1}`}
                  >
                    ×
                  </button>
                  {index === 0 ? <span className='image-picker-modal__badge'>Principal</span> : null}
                </div>
              ))}
            </div>
          ) : (
            <div className='image-picker-modal__empty'>
              <p>No hay imágenes cargadas</p>
              <p className='image-picker-modal__empty-hint'>Usa el botón &quot;Subir imagen&quot; para agregar fotos</p>
            </div>
          )}
        </div>

        <div className='image-picker-modal__footer'>
          <button type='button' className='btn__general-purple' onClick={onClose}>
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImagePickerModal
