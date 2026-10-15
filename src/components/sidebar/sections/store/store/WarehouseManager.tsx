import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import './WarehouseManager.css'
import APIs from '../../../../../services/APIs'
import Swal from 'sweetalert2'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'

interface WarehouseManagerProps {
  branchId: number
  setBranchId: (id: number) => void
  companyId: number | null
  setCompanyId: (id: number | null) => void
}

const WarehouseManager: React.FC<WarehouseManagerProps> = ({
  branchId,
  setBranchId,
  companyId,
  setCompanyId,
}) => {
  const userState = useSelector((state: any) => state.user)
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  const fetchWarehouses = useCallback(async () => {
    // Empresa del selector o, si no hay ninguna vinculada, la activa de la sesión
    const effectiveCompanyId =
      companyId ?? userState?.activeCompanyId ?? userState?.companyId ?? userState?.companyIds?.[0] ?? null
    if (!effectiveCompanyId) {
      setWarehouses([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response: any = await APIs.getWarehouses({
        companyId: effectiveCompanyId,
        branchId: branchId > 0 ? branchId : undefined,
      })
      const list = Array.isArray(response?.data) ? response.data : []
      setWarehouses(list)
    } catch (error) {
      console.error('Error al cargar almacenes:', error)
      setWarehouses([])
    } finally {
      setLoading(false)
    }
  }, [branchId, companyId, userState?.activeCompanyId])

  useEffect(() => {
    const handleRefresh = () => fetchWarehouses()
    window.addEventListener('warehouse-updated', handleRefresh)
    return () => window.removeEventListener('warehouse-updated', handleRefresh)
  }, [fetchWarehouses])

  useEffect(() => {
    fetchWarehouses()
  }, [fetchWarehouses])

  const filteredWarehouses = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) return warehouses
    return warehouses.filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.companyName?.toLowerCase().includes(q) ||
        item.branchName?.toLowerCase().includes(q),
    )
  }, [warehouses, debouncedSearch])

  const handleDelete = async (item: any) => {
    const result = await Swal.fire({
      title: '¿Eliminar almacén?',
      text: `Se eliminará "${item.name}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) return

    try {
      await APIs.deleteWarehouse(item.id)
      Swal.fire({
        icon: 'success',
        title: 'Almacén eliminado',
        text: 'El almacén se eliminó correctamente.',
      })
      fetchWarehouses()
    } catch (error) {
      console.error(error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el almacén. Inténtalo de nuevo.',
      })
    }
  }

  return (
    <div className='warehouses'>
      <div className='warehouses__container'>
        <div className='warehouses__header'>
          <div className='warehouses__header-left'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={setBranchId}
              onCompanyIdChange={setCompanyId}
            />
            <div className='warehouses__search'>
              <span className='warehouses__search-icon material-symbols-rounded' aria-hidden>search</span>
              <input
                className='inputs__general warehouses__search-input'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type='text'
                placeholder='Buscar almacén'
                aria-label='Buscar almacenes'
              />
            </div>
          </div>
          <button
            className='btn__general-primary'
            onClick={() => window.dispatchEvent(new CustomEvent('open-store-modal'))}
          >
            Nuevo almacén
          </button>
        </div>

        {/* La tabla siempre se ve; el skeleton va dentro */}
        <div className='warehouses__list'>
          <div className='warehouses__row warehouses__row--head'>
            <span>Almacén</span>
            <span>Empresa</span>
            <span>Sucursal</span>
            <span className='warehouses__col-actions'>Acciones</span>
          </div>

          {loading ? (
            <TableSkeleton rowClassName='warehouses__row' cols={[{ avatar: true }, { width: '60%' }, { width: '55%' }, { actions: 2 }]} />
          ) : filteredWarehouses.length > 0 ? (
            filteredWarehouses.map((item: any) => (
              <div className='warehouses__row' key={item.id}>
                <div className='warehouses__cell warehouses__cell--name' data-label='Almacén'>
                  <span className='warehouses__row-icon material-symbols-rounded'>warehouse</span>
                  <strong>{item.name}</strong>
                </div>
                <div className='warehouses__cell' data-label='Empresa'>{item.companyName ?? '—'}</div>
                <div className='warehouses__cell warehouses__cell--muted' data-label='Sucursal'>
                  {item.branchName ?? 'Sin sucursal'}
                </div>
                <div className='warehouses__cell warehouses__col-actions'>
                  <button
                    type='button'
                    className='warehouses__icon-btn'
                    title='Editar almacén'
                    aria-label='Editar almacén'
                    onClick={() => window.dispatchEvent(new CustomEvent('update-store-modal', { detail: item }))}
                  >
                    <span className='material-symbols-rounded'>edit</span>
                  </button>
                  <button
                    type='button'
                    className='warehouses__icon-btn warehouses__icon-btn--danger'
                    title='Eliminar almacén'
                    aria-label='Eliminar almacén'
                    onClick={() => handleDelete(item)}
                  >
                    <span className='material-symbols-rounded'>delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className='warehouses__state'>
              <p>{debouncedSearch.trim() ? 'No se encontraron almacenes con ese criterio' : 'No hay almacenes registrados'}</p>
              <span>Crea el primero con "Nuevo almacén"</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WarehouseManager
