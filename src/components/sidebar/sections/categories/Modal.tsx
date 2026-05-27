import React, { useEffect, useState } from 'react'

import Swal from 'sweetalert2'
import { useDispatch, useSelector } from 'react-redux'
import { setCategories } from '../../../../redux/state/Categories'
import { modal as modalAction } from '../../../../redux/state/modals'
import APIs from '../../../../services/APIs'
import {
  CATEGORY_STATUS,
  categoryId,
  normalizeCategoryList,
  readCategoryBranchId,
} from '../../../../constants/category'

import CategoriesStorePicker from './CategoriesStorePicker'
import './Modal.css'

type SelectKey = 'parent' | null

const Modal = () => {
  const dispatch = useDispatch()
  const modalState = useSelector((state: any) => state.modals)
  const categoriesUpdate = useSelector((state: any) => state.categories)

  const closeModal = () => {
    dispatch(modalAction(''))
  }

  const [title, setTitle] = useState('')
  const [branchId, setBranchId] = useState(readCategoryBranchId)
  const [statusActive, setStatusActive] = useState(true)
  const [image, setImage] = useState<string>('')
  const [imagePreview, setImagePreview] = useState<string>('')
  const [parentId, setParentId] = useState<number | null>(null)
  const [availableCategories, setAvailableCategories] = useState<any[]>([])

  const [openSelect, setOpenSelect] = useState<SelectKey>(null)
  const [closeStoresSignal, setCloseStoresSignal] = useState(0)

  const token = localStorage.getItem('token-eco')

  const isCreate = modalState === 'categories-modal'

  const toggleSelect = (key: Exclude<SelectKey, null>) => {
    setOpenSelect((prev) => {
      const next = prev === key ? null : key
      return next
    })
  }

  useEffect(() => {
    if (openSelect !== null) {
      setCloseStoresSignal((n) => n + 1)
    }
  }, [openSelect])

  useEffect(() => {
    if (modalState === 'categories-modal' || modalState === 'categories-modal-update') {
      loadAvailableCategories()
    }
  }, [branchId])

  useEffect(() => {
    if (modalState === 'categories-modal') {
      setTitle('')
      setBranchId(readCategoryBranchId())
      setStatusActive(true)
      setImage('')
      setImagePreview('')
      setParentId(null)
      setOpenSelect(null)
      loadAvailableCategories()
    }
  }, [modalState])

  useEffect(() => {
    if (modalState !== 'categories-modal-update') return
    const u = categoriesUpdate
    if (!u || typeof u !== 'object') return

    setTitle(String(u.title ?? ''))
    setBranchId(Number(u.branchId ?? u.storeId ?? readCategoryBranchId()))
    setStatusActive(u.status !== CATEGORY_STATUS.INACTIVE && u.state !== false)
    setImage(u.image ?? '')
    setImagePreview(u.image ?? '')
    setParentId(u.parentId ?? null)
    setOpenSelect(null)
    loadAvailableCategories()
  }, [modalState, categoriesUpdate])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setImage(base64)
      setImagePreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const loadAvailableCategories = async () => {
    try {
      const bid = Number(branchId)
      const effective = !Number.isNaN(bid) && bid >= 1 ? bid : readCategoryBranchId()
      const res: any = await APIs.getCategoryList(effective, token as string)
      const categories = normalizeCategoryList(res)
      setAvailableCategories(flattenCategories(categories))
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const flattenCategories = (categories: any[], level = 0): any[] => {
    const result: any[] = []
    for (const cat of categories) {
      const id = categoryId(cat)
      if (id != null) {
        result.push({
          id,
          title: cat.title,
          level: cat.level ?? level,
          displayTitle: '  '.repeat(level) + (level > 0 ? '└─ ' : '') + cat.title,
        })
      }
      if (Array.isArray(cat.subcategories)) {
        result.push(...flattenCategories(cat.subcategories, level + 1))
      }
    }
    return result
  }

  const calculatedLevel = parentId == null 
    ? 1 
    : (availableCategories.find((c) => c.id === parentId)?.level ?? 0) + 1

  const refreshList = async () => {
    const bid = Number(branchId)
    const effective = !Number.isNaN(bid) && bid >= 1 ? bid : readCategoryBranchId()
    const res: any = await APIs.getCategoryList(effective, token as string)
    dispatch(setCategories(normalizeCategoryList(res)))
  }

  const handleDelete = async () => {
    const id = categoryId(categoriesUpdate)
    if (id == null) {
      Swal.fire({ title: 'Error', text: 'Categoría sin ID', icon: 'error' })
      return
    }

    const result = await Swal.fire({
      title: '¿Eliminar categoría?',
      text: `Se eliminará "${title}" y todas sus subcategorías. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) return

    try {
      await APIs.deleteCategory(id, token as string)
      Swal.fire({
        title: 'Eliminado',
        text: `Categoría "${title}" eliminada correctamente`,
        icon: 'success',
      })
      await refreshList()
      closeModal()
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: err?.response?.data?.message ?? err?.message ?? 'No se pudo eliminar la categoría',
        icon: 'error',
      })
    }
  }

  const hanleSendChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!token) {
      Swal.fire({ title: 'Sesión', text: 'No hay token de autenticación', icon: 'warning' })
      return
    }

    const bid = Number(branchId)
    if (!title.trim()) {
      Swal.fire({
        title: 'Validación',
        text: 'El título es obligatorio',
        icon: 'warning',
      })
      return
    }

    const status = statusActive ? CATEGORY_STATUS.ACTIVE : CATEGORY_STATUS.INACTIVE

    if (isCreate) {
      const body: Record<string, unknown> = {
        title: title.trim(),
        status,
        image,
      }
      if (!Number.isNaN(bid) && bid >= 1) {
        body.branchId = bid
      }
      if (parentId != null) {
        body.parentId = parentId
      }

      try {
        const result: any = await APIs.createCategory(body, token)
        Swal.fire({
          title: 'Éxito',
          text: result?.message ?? `Categoría "${title.trim()}" creada`,
          icon: 'success',
        })
        await refreshList()
        closeModal()
      } catch (err: any) {
        Swal.fire({
          title: 'Error',
          text: err?.response?.data?.message ?? err?.message ?? 'No se pudo crear la categoría',
          icon: 'error',
        })
      }
      return
    }

    const id = categoryId(categoriesUpdate)
    if (id == null) {
      Swal.fire({ title: 'Error', text: 'Categoría sin id', icon: 'error' })
      return
    }

    const patchBody: Record<string, unknown> = {
      title: title.trim(),
      status,
      image,
      branchId: bid,
    }
    if (categoriesUpdate.parentId !== undefined) {
      patchBody.parentId = categoriesUpdate.parentId
    }

    try {
      await APIs.patchCategory(id, patchBody, token)
      Swal.fire({ title: 'Éxito', text: 'Categoría actualizada', icon: 'success' })
      await refreshList()
      closeModal()
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: err?.response?.data?.message ?? err?.message ?? 'No se pudo actualizar',
        icon: 'error',
      })
    }
  }

  return (
    <div
      className={`overlay__categories__modal ${modalState === 'categories-modal' || modalState === 'categories-modal-update' ? 'active' : ''}`}
    >
      <div
        className={`popup__categories__modal ${modalState === 'categories-modal' || modalState === 'categories-modal-update' ? 'active' : ''}`}
      >
        <div className='header__modal'>
          <a
            href='#close'
            className='btn-cerrar-popup__categories__modal'
            onClick={(e) => {
              e.preventDefault()
              closeModal()
            }}
          >
            <svg className='svg__close' xmlns='http://www.w3.org/2000/svg' height='16' width='12' viewBox='0 0 384 512'>
              <path d='M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z' />
            </svg>
          </a>
          <p className='title__modals'>{isCreate ? 'Nueva categoría' : 'Editar categoría'}</p>
        </div>
        <form className='categories__modal' onSubmit={hanleSendChange}>
          <div className='categories__modal_container'>
            <div className='row__one row__one--title'>
              <div>
                <label className='label__general'>Título</label>
                <input
                  className='inputs__general'
                  type='text'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='Nombre de la categoría'
                />
              </div>
              <div>
                <label className='label__general'>Imagen</label>
                <input
                  className='inputs__general'
                  type='file'
                  accept='image/*'
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div style={{ marginTop: '10px' }}>
                    <img
                      src={imagePreview}
                      alt='Preview'
                      style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover' }}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className='label__general'>Nivel</label>
                <input
                  className='inputs__general'
                  type='text'
                  value={calculatedLevel}
                  readOnly
                  disabled
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', cursor: 'not-allowed' }}
                />
              </div>
            </div>
            <div className='row__one row__one--stores'>
              <CategoriesStorePicker
                variant='modal'
                branchId={branchId}
                closeStoresSignal={closeStoresSignal}
                onDropdownOpen={() => setOpenSelect(null)}
                onBranchIdChange={(id) => {
                  setBranchId(id)
                  localStorage.setItem('categories-store-id', String(id))
                }}
              />
            </div>
            <p className='categories__modal-store-hint'>
              La categoría queda ligada a la <strong>sucursal</strong> indicada en <code>branchId</code>:{' '}
              <strong>{branchId}</strong> (opcional).
            </p>
            
            {isCreate && (
              <div className='row__one row__one--parent'>
                <div className={`cat-modal-select ${openSelect === 'parent' ? 'cat-modal-select--open' : ''}`}>
                  <label className='cat-modal-select__label'>Categoría Padre (opcional)</label>
                  <div className='cat-modal-select__control'>
                    <button
                      type='button'
                      className={`cat-modal-select__trigger ${openSelect === 'parent' ? 'is-open' : ''}`}
                      onClick={() => toggleSelect('parent')}
                      aria-expanded={openSelect === 'parent'}
                      aria-haspopup='listbox'
                    >
                      <span className='cat-modal-select__value'>
                        {parentId == null
                          ? 'Sin categoría padre (raíz)'
                          : availableCategories.find((c) => c.id === parentId)?.displayTitle || `ID: ${parentId}`}
                      </span>
                      <svg className='cat-modal-select__chev' xmlns='http://www.w3.org/2000/svg' height='16' width='16' viewBox='0 0 512 512' aria-hidden>
                        <path
                          fill='currentColor'
                          d='M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z'
                        />
                      </svg>
                    </button>
                    <div className={`cat-modal-select__menu ${openSelect === 'parent' ? 'is-open' : ''}`} role='listbox'>
                      <ul className='cat-modal-select__list'>
                        <li>
                          <button
                            type='button'
                            className='cat-modal-select__option'
                            onClick={() => {
                              setParentId(null)
                              setOpenSelect(null)
                            }}
                          >
                            Sin categoría padre (raíz)
                          </button>
                        </li>
                        {availableCategories.map((cat) => (
                          <li key={cat.id}>
                            <button
                              type='button'
                              className='cat-modal-select__option'
                              onClick={() => {
                                setParentId(Number(cat.id))
                                setOpenSelect(null)
                              }}
                            >
                              {cat.displayTitle}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <p className='categories__modal-parent-hint'>
                  {parentId == null
                    ? 'Esta será una categoría raíz (nivel superior)'
                    : 'Esta categoría será hija de la categoría seleccionada'}
                </p>
              </div>
            )}
            
            <div className='row__one row__one--meta'>
              <div>
                <label className='label__general'>Estado</label>
                <label className='switch'>
                  <input
                    type='checkbox'
                    checked={statusActive}
                    onChange={(e) => setStatusActive(e.target.checked)}
                  />
                  <span className='slider' />
                </label>
                <p className='categories__modal-status-hint'>{statusActive ? 'Activo' : 'Inactivo'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {!isCreate && (
                <button 
                  className='btn__general-danger' 
                  type='button' 
                  onClick={handleDelete}
                  title='Eliminar categoría'
                >
                  <svg xmlns='http://www.w3.org/2000/svg' height='16' width='14' viewBox='0 0 448 512' style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                    <path fill='currentColor' d='M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z'/>
                  </svg>
                  Eliminar
                </button>
              )}
              <button className='btn__general-purple' type='submit'>
                {isCreate ? 'Crear categoría' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Modal
