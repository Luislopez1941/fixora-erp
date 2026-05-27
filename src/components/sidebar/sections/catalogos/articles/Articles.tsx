import React, { useEffect, useState } from 'react'
import './Articles.css'
import Modal from './Modal'
import './Modal.css'
import { useDispatch } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import { useSelector } from 'react-redux'
import { setArticles, updateArticles } from '../../../../../redux/state/Articles'
import APIs from '../../../../../services/APIs'

const Articles: React.FC = () => {
  const dispatch = useDispatch()
  const articles = useSelector((state: any) => state.articles.articles)

  const setModal = (value: any) => {
    dispatch(modal(value))
  }

  const token = localStorage.getItem('token-eco')

  const [search, setSearch] = useState<string>('')

  const normalizeItemList = (res: unknown): any[] => {
    if (Array.isArray(res)) return res
    if (res && typeof res === 'object' && Array.isArray((res as { data?: unknown }).data)) {
      return (res as { data: any[] }).data
    }
    return []
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!token) {
        if (!cancelled) dispatch(setArticles([]))
        return
      }
      try {
        const result: any = await APIs.getItemList(token)
        const filtered = normalizeItemList(result).filter((item: any) => item.type === 'ARTICLE')
        if (!cancelled) dispatch(setArticles(filtered))
      } catch {
        if (!cancelled) dispatch(setArticles([]))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dispatch, token])

  const filteredArticles = (articles ?? []).filter((item: any) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const title = String(item.title ?? item.name ?? '').toLowerCase()
    const desc = String(item.description ?? '').toLowerCase()
    return title.includes(q) || desc.includes(q)
  })

  const updateModalArticles = (item: any) => {
    dispatch(updateArticles(item))
    setModal('articles-modal-update')
  }

  const handleDelete = async (item: any) => {
    const id = item.id
    if (id == null) {
      alert('Artículo sin ID')
      return
    }

    if (!confirm(`¿Eliminar artículo "${item.name}"?`)) return

    try {
      await APIs.deleteItem(id, token as string)
      alert('Artículo eliminado')
      const result: any = await APIs.getItemList(token as string)
      const filtered = normalizeItemList(result).filter((item: any) => item.type === 'ARTICLE')
      dispatch(setArticles(filtered))
    } catch (err: any) {
      alert('Error al eliminar: ' + (err?.response?.data?.message ?? err?.message))
    }
  }

  return (
    <div className='articles'>
      <div className='articles__container'>
        <div className='row__one'>
          <div className='articles-toolbar'>
            <div className='articles-toolbar__search articles__search-inline'>
              <div className='articles__search-field'>
                <div className='articles__search-field__input-wrap'>
                  <input
                    className='inputs__general'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    type='text'
                    placeholder='Buscar artículos...'
                  />
                </div>
              </div>
            </div>
          </div>
          <div className='articles__row-actions'>
            <button className='btn__general-purple' type='button' onClick={() => setModal('articles-modal')}>
              Nuevo artículo
            </button>
          </div>
        </div>
        <div className='table__articles'>
          <div>
            {articles ? (
              <div className='table__numbers'>
                <p className='text'>Total (vista)</p>
                <div className='quantities_tables'>{filteredArticles.length}</div>
              </div>
            ) : (
              <p className='text'>No hay artículos</p>
            )}
          </div>
          <div className='table__head'>
            <div className='thead'>
              <div className='th'>
                <p>Nombre</p>
              </div>
              <div className='th'>
                <p>Descripción</p>
              </div>
              <div className='th'>
                <p>Código</p>
              </div>
              <div className='th'>
                <p>Categoría</p>
              </div>
              <div className='th'>
                <p>Acciones</p>
              </div>
            </div>
          </div>
          {filteredArticles.length > 0 ? (
            <div className='table__body'>
              {filteredArticles.map((item: any, index: number) => (
                <div className='tbody__container' key={item.id ?? index}>
                  <div className='tbody'>
                    <div className='td'>
                      <p>{item.name}</p>
                    </div>
                    <div className='td'>{item.description || '—'}</div>
                    <div className='td'>{item.code || '—'}</div>
                    <div className='td'>{item.category?.title ?? item.category?.name ?? '—'}</div>
                    <div className='td'>
                      <button className='btn__general-purple' type='button' onClick={() => updateModalArticles(item)}>
                        Editar
                      </button>
                      <button
                        className='btn__general-danger'
                        type='button'
                        onClick={() => handleDelete(item)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text'>No hay artículos que mostrar</p>
          )}
        </div>
      </div>
      <Modal />
    </div>
  )
}

export default Articles
