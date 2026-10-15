import React, { useEffect, useState } from 'react'
import './Services.css'
import Modal from './Modal'
import './Modal.css'
import { useDispatch } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import { useSelector } from 'react-redux'
import { setServices, updateServices } from '../../../../../redux/state/Services'
import APIs from '../../../../../services/APIs'
import Swal from 'sweetalert2'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'
import CategoriesStorePicker from '../categories/CategoriesStorePicker'
import { readCategoryBranchId } from '../../../../../constants/category'

const Services: React.FC = () => {
  const dispatch = useDispatch()
  const services = useSelector((state: any) => state.services.services)

  const setModal = (value: any) => {
    dispatch(modal(value))
  }

  const token = localStorage.getItem('token-fixora')

  const [search, setSearch] = useState<string>('')
  const [loading, setLoading] = useState(true)
  // Filtros principales: empresa y sucursal (0 = todo el catálogo de la empresa)
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())

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
        if (!cancelled) {
          dispatch(setServices([]))
          setLoading(false)
        }
        return
      }
      try {
        if (!companyId) {
          if (!cancelled) setLoading(false)
          return
        }
        setLoading(true)
        const result: any = await APIs.getItemList(token, { companyId, branchId: branchId > 0 ? branchId : undefined })
        const filtered = normalizeItemList(result).filter((item: any) => item.type === 'SERVICE')
        if (!cancelled) dispatch(setServices(filtered))
      } catch {
        if (!cancelled) dispatch(setServices([]))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dispatch, token, companyId, branchId])

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
      Swal.fire({ icon: 'warning', title: 'Servicio sin ID' })
      return
    }

    const confirmation = await Swal.fire({
      title: '¿Eliminar servicio?',
      text: `Se eliminará "${item.name}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!confirmation.isConfirmed) return

    try {
      await APIs.deleteItem(id, token as string)
      Swal.fire({ icon: 'success', title: 'Servicio eliminado' })
      const result: any = await APIs.getItemList(token as string)
      const filtered = normalizeItemList(result).filter((row: any) => row.type === 'SERVICE')
      dispatch(setServices(filtered))
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo eliminar',
        text: err?.response?.data?.message ?? err?.message,
      })
    }
  }

  return (
    <div className='services'>
      <div className='services__container'>
        <div className='services__header'>
          <CategoriesStorePicker
            branchId={branchId}
            onBranchIdChange={(id) => {
              setBranchId(id)
              localStorage.setItem('categories-store-id', String(id))
            }}
            onCompanyIdChange={(id) => setCompanyId(id)}
          />
          <div className='services__search'>
            <span className='services__search-icon material-symbols-rounded' aria-hidden>search</span>
            <input
              className='inputs__general services__search-input'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type='text'
              placeholder='Buscar servicio'
              aria-label='Buscar servicios'
            />
          </div>
          <button className='btn__general-primary' type='button' onClick={() => setModal('services-modal')}>
            Nuevo servicio
          </button>
        </div>

        {/* La tabla siempre se ve; el skeleton va dentro */}
        <div className='services__list'>
          <div className='services__row services__row--head'>
            <span>Servicio</span>
            <span>Descripción</span>
            <span>Código</span>
            <span>Categoría</span>
            <span className='services__col-actions'>Acciones</span>
          </div>

          {loading ? (
            <TableSkeleton rowClassName='services__row' cols={[{ width: '60%' }, { width: '75%' }, { pill: true, width: '70px' }, { width: '50%' }, { actions: 2 }]} />
          ) : filteredServices.length > 0 ? (
            filteredServices.map((item: any, index: number) => (
              <div className='services__row' key={item.id ?? index}>
                <div className='services__cell services__cell--name' data-label='Servicio'>
                  <strong>{item.name}</strong>
                </div>
                <div className='services__cell services__cell--muted' data-label='Descripción'>
                  {item.description || '—'}
                </div>
                <div className='services__cell' data-label='Código'>
                  {item.code ? <span className='services__tag'>{item.code}</span> : '—'}
                </div>
                <div className='services__cell' data-label='Categoría'>
                  {item.category?.title ?? item.category?.name ?? '—'}
                </div>
                <div className='services__cell services__col-actions'>
                  <button
                    className='services__icon-btn'
                    type='button'
                    title='Editar servicio'
                    aria-label='Editar servicio'
                    onClick={() => updateModalServices(item)}
                  >
                    <span className='material-symbols-rounded'>edit</span>
                  </button>
                  <button
                    className='services__icon-btn services__icon-btn--danger'
                    type='button'
                    title='Eliminar servicio'
                    aria-label='Eliminar servicio'
                    onClick={() => handleDelete(item)}
                  >
                    <span className='material-symbols-rounded'>delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className='services__state'>
              <p>{search.trim() ? 'No se encontraron servicios con ese criterio' : 'No hay servicios registrados'}</p>
            </div>
          )}
        </div>
      </div>
      <Modal />
    </div>
  )
}

export default Services
