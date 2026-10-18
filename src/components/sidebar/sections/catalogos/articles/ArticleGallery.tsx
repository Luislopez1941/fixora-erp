import React, { useEffect, useState } from 'react'
import '../../../../general/skeleton/TableSkeleton.css'
import './ArticleGallery.css'

interface Props {
  images: string[]
  onChange: (images: string[]) => void
  /** Abre el selector de imágenes (subir / pegar URL) */
  onAdd: () => void
}

/** Imagen con brillo mientras descarga y fundido al terminar (igual que la silueta de carga del modal). */
const FadeImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    setLoaded(false)
    setFailed(false)
  }, [src])
  return (
    <span className={`article-gallery__frame ${className ?? ''} ${loaded ? 'is-loaded' : 'table-skeleton__shimmer'}`}>
      {failed ? (
        <span className='material-symbols-rounded article-gallery__broken' aria-label='No se pudo cargar la imagen'>broken_image</span>
      ) : (
        <img src={src} alt={alt} loading='lazy' onLoad={() => setLoaded(true)} onError={() => { setFailed(true); setLoaded(true) }} />
      )}
    </span>
  )
}

/**
 * Galería del artículo: imagen principal grande y miniaturas debajo. Clic en una miniatura la muestra en grande;
 * "Hacer principal" la mueve al primer lugar (la que se usa en listas y en el punto de venta).
 */
const ArticleGallery: React.FC<Props> = ({ images, onChange, onAdd }) => {
  const [selected, setSelected] = useState(0)
  useEffect(() => {
    if (selected > images.length - 1) setSelected(Math.max(0, images.length - 1))
  }, [images.length, selected])

  if (images.length === 0) {
    return (
      <div className='article-gallery'>
        <button type='button' className='article-gallery__empty' onClick={onAdd}>
          <span className='material-symbols-rounded' aria-hidden>add_photo_alternate</span>
          <strong>Agregar imagen</strong>
          <small>La primera será la principal</small>
        </button>
      </div>
    )
  }

  const current = images[selected] ?? images[0]
  const makeMain = () => {
    if (selected === 0) return
    const next = [...images]
    const [img] = next.splice(selected, 1)
    onChange([img, ...next])
    setSelected(0)
  }
  const remove = () => {
    onChange(images.filter((_, i) => i !== selected))
  }

  return (
    <div className='article-gallery'>
      <div className='article-gallery__main'>
        <FadeImage src={current} alt='Imagen del artículo' className='article-gallery__main-img' />
        {selected === 0 && <span className='article-gallery__badge'>Principal</span>}
        <div className='article-gallery__main-actions'>
          {selected !== 0 && (
            <button type='button' onClick={makeMain} title='Usar como imagen principal'>
              <span className='material-symbols-rounded' aria-hidden>star</span>
            </button>
          )}
          <button type='button' onClick={remove} title='Quitar imagen' className='is-danger'>
            <span className='material-symbols-rounded' aria-hidden>delete</span>
          </button>
        </div>
      </div>
      <div className='article-gallery__thumbs'>
        {images.map((src, i) => (
          <button
            type='button'
            key={`${i}-${src.slice(-24)}`}
            className={`article-gallery__thumb ${i === selected ? 'is-active' : ''}`}
            onClick={() => setSelected(i)}
            aria-label={`Ver imagen ${i + 1}`}
          >
            <FadeImage src={src} alt='' />
          </button>
        ))}
        <button type='button' className='article-gallery__thumb article-gallery__thumb--add' onClick={onAdd} aria-label='Agregar imagen'>
          <span className='material-symbols-rounded' aria-hidden>add</span>
        </button>
      </div>
    </div>
  )
}

export default ArticleGallery
