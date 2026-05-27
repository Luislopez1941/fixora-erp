import React, { useEffect, useState } from 'react'
import './Services.css'
import Modal from './Modal'
import './Modal.css'
import { useDispatch } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import { useSelector } from 'react-redux'
import { setServices, updateServices } from '../../../../../redux/state/Services'
import APIs from '../../../../../services/APIs'

const Services: React.FC = () => {
  const dispatch = useDispatch()
  const services = useSelector((state: any) => state.services.services)

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
        if (!cancelled) dispatch(setServices([]))
        return
      }
      try {
        const result: any = await APIs.getItemList(token)
        const filtered = normalizeItemList(result).filter((item: any) => item.type === 'SERVICE')
        if (!cancelled) dispatch(setServices(filtered))
      } catch {
        if (!cancelled) dispatch(setServices([]))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dispatch, token])

  const filteredServices = (services ?? []).filter((item: any) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const title = String(item.title ?? item.name ?? '').toLowerCase()
    const desc = String(item.description ?? '').toLowerCase()
    return title.includes(q) || desc.includes(q)
  })

  const updateModalServices = (item: any) => {
    dispatch(updateServices(item))
    setModal('services-modal-update')
  }

  const handleDelete = async (item: any) => {
    const id = item.id
    if (id == null) {
      alert('Servicio sin ID')
      return
    }

    if (!confirm(`¿Eliminar servicio "${item.name}"?`)) return

    try {
      await APIs.deleteItem(id, token as string)
      alert('Servicio eliminado')
      const result: any = await APIs.getItemList(token as string)
      const filtered = normalizeItemList(result).filter((item: any) => item.type === 'SERVICE')
      dispatch(setServices(filtered))
    } catch (err: any) {
      alert('Error al eliminar: ' + (err?.response?.data?.message ?? err?.message))
    }
  }

  return (
    <div className='services'>
      <div className='services__container'>
        <div className='row__one'>
          <div className='services-toolbar'>
            <div className='services-toolbar__search services__search-inline'>
              <div className='services__search-field'>
                <div className='services__search-field__input-wrap'>
                  <input
                    className='inputs__general'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    type='text'
                    placeholder='Buscar servicios...'
                  />
                </div>
              </div>
            </div>
          </div>
          <div className='services__row-actions'>
            <button className='btn__general-purple' type='button' onClick={() => setModal('services-modal')}>
              Nuevo servicio
            </button>
          </div>
        </div>
        <div className='table__services'>
          <div>
            {services ? (
              <div className='table__numbers'>
                <p className='text'>Total (vista)</p>
                <div className='quantities_tables'>{filteredServices.length}</div>
              </div>
            ) : (
              <p className='text'>No hay servicios</p>
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
          {filteredServices.length > 0 ? (
            <div className='table__body'>
              {filteredServices.map((item: any, index: number) => (
                <div className='tbody__container' key={item.id ?? index}>
                  <div className='tbody'>
                    <div className='td'>
                      <p>{item.name}</p>
                    </div>
                    <div className='td'>{item.description || '—'}</div>
                    <div className='td'>{item.code || '—'}</div>
                    <div className='td'>{item.category?.title ?? item.category?.name ?? '—'}</div>
                    <div className='td'>
                      <button className='btn__general-purple' type='button' onClick={() => updateModalServices(item)}>
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
            <p className='text'>No hay servicios que mostrar</p>
          )}
        </div>
      </div>
      <Modal />
    </div>
  )
}

export default Services
