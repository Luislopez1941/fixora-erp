import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import Swal from 'sweetalert2'
import '../../categories/Categories.css'
import '../production.css'
import CategoriesStorePicker from '../../categories/CategoriesStorePicker'
import ModalProductionOrder from './ModalProductionOrder'
import { modal } from '../../../../../redux/state/modals'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId } from '../../../../../constants/category'
import {
  getAdvanceButtonLabel,
  getRouteProgressLabel,
} from '../productionRouteUtils'

const LS_COMPANY = 'categories-picker-company-id'

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem(LS_COMPANY))
  return !Number.isNaN(id) && id > 0 ? id : null
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}

const STATUS_CLASS: Record<string, string> = {
  DRAFT: 'production__status--draft',
  IN_PROGRESS: 'production__status--progress',
  COMPLETED: 'production__status--done',
  CANCELLED: 'production__status--cancel',
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

const getProgress = (planned: number, produced: number) => {
  if (planned <= 0) return 0
  return Math.min(100, Math.round((produced / planned) * 100))
}

const URGENCY_LABEL: Record<string, string> = {
  LOW: 'Baja',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

const URGENCY_CLASS: Record<string, string> = {
  LOW: 'production__urgency--low',
  NORMAL: 'production__urgency--normal',
  HIGH: 'production__urgency--high',
  URGENT: 'production__urgency--urgent',
}

const getSaleLabel = (order: any) => {
  if (!order.sale) return '—'
  const serie = order.sale.series?.name ?? 'VENT'
  const folio = order.sale.folio ?? order.sale.id
  return `${serie}-${folio}`
}

const getRouteLabel = getRouteProgressLabel

const ProductionOrders: React.FC = () => {
  const dispatch = useDispatch()
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [areaFilter, setAreaFilter] = useState<string>('ALL')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL')
  const [areas, setAreas] = useState<any[]>([])
  const [assigningAreaId, setAssigningAreaId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
  }, [])

  const fetchAreas = useCallback(async () => {
    const companyId = readCompanyId()
    if (!companyId) {
      setAreas([])
      return
    }

    try {
      const response: any = await APIs.getAreas({
        companyId,
        branchId: branchId > 0 ? branchId : undefined,
        production: true,
      })
      setAreas(Array.isArray(response?.data) ? response.data : [])
    } catch {
      setAreas([])
    }
  }, [branchId])

  const fetchOrders = useCallback(async () => {
    const companyId = readCompanyId()
    if (!companyId) {
      setOrders([])
      return
    }

    setLoading(true)
    try {
      const response: any = await APIs.getProductionOrders({
        companyId,
        branchId: branchId > 0 ? branchId : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        areaId:
          areaFilter !== 'ALL' && areaFilter !== '0' ? Number(areaFilter) : undefined,
        urgency: urgencyFilter !== 'ALL' ? urgencyFilter : undefined,
      })
      setOrders(Array.isArray(response?.data) ? response.data : [])
    } catch (error) {
      console.error('Error al cargar órdenes de producción:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [branchId, statusFilter, areaFilter, urgencyFilter])

  useEffect(() => {
    fetchAreas()
  }, [fetchAreas])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredOrders = useMemo(() => {
    let list = orders

    if (areaFilter === '0') {
      list = list.filter((order) => !order.areaId)
    }

    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((order) => {
      const product = `${order.item?.code ?? ''} ${order.item?.name ?? ''}`.toLowerCase()
      const area = order.area?.name?.toLowerCase() ?? ''
      const folio = String(order.folio ?? '')
      return product.includes(q) || area.includes(q) || folio.includes(q)
    })
  }, [orders, search, areaFilter])

  const summary = useMemo(() => {
    const total = orders.length
    const inProgress = orders.filter((o) => o.status === 'IN_PROGRESS').length
    const completed = orders.filter((o) => o.status === 'COMPLETED').length
    const draft = orders.filter((o) => o.status === 'DRAFT').length
    return { total, inProgress, completed, draft }
  }, [orders])

  const openCreate = () => {
    setSelectedOrder(null)
    dispatch(modal('production_order_create'))
  }

  const openEdit = (order: any) => {
    setSelectedOrder(order)
    dispatch(modal('production_order_update'))
  }

  const handleAreaChange = async (order: any, nextAreaId: string) => {
    const areaId = nextAreaId ? Number(nextAreaId) : null
    if (areaId === order.areaId || (areaId == null && !order.areaId)) return

    setAssigningAreaId(order.id)
    try {
      await APIs.assignProductionOrderArea(order.id, areaId)
      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id
            ? {
                ...item,
                areaId,
                area: areaId
                  ? areas.find((a) => a.id === areaId) ?? item.area
                  : null,
              }
            : item,
        ),
      )
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message ?? 'No se pudo cambiar el área.',
      })
    } finally {
      setAssigningAreaId(null)
    }
  }

  const handleAdvance = async (order: any) => {
    setBusyId(order.id)
    try {
      const response: any = await APIs.advanceProductionOrderArea(order.id)
      Swal.fire({
        icon: 'success',
        title: 'Proceso actualizado',
        text: response?.message ?? 'La orden avanzó correctamente.',
        timer: 1600,
        showConfirmButton: false,
      })
      fetchOrders()
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message ?? 'No se pudo avanzar la orden.',
      })
    } finally {
      setBusyId(null)
    }
  }

  const handleUrgencyChange = async (order: any, urgency: string) => {
    if (urgency === order.urgency) return
    setBusyId(order.id)
    try {
      await APIs.updateProductionOrderUrgency(order.id, urgency)
      setOrders((prev) =>
        prev.map((item) => (item.id === order.id ? { ...item, urgency } : item)),
      )
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message ?? 'No se pudo cambiar la urgencia.',
      })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (order: any) => {
    const result = await Swal.fire({
      title: '¿Eliminar orden?',
      text: `Se eliminará la orden OP-${order.folio}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) return

    try {
      await APIs.deleteProductionOrder(order.id)
      Swal.fire({
        icon: 'success',
        title: 'Orden eliminada',
        text: 'La orden de producción se eliminó correctamente.',
      })
      fetchOrders()
    } catch (error) {
      console.error(error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la orden.',
      })
    }
  }

  return (
    <div className='production'>
      <div className='production__container'>
        <header className='production__header'>
          <span className='production__eyebrow'>Módulo</span>
          <h1 className='production__title'>Órdenes de producción</h1>
          <p className='production__subtitle'>
            Planifica y da seguimiento a la fabricación por artículo, área y sucursal.
          </p>
        </header>

        <div className='production__toolbar'>
          <div className='production__toolbar-left'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={persistBranchId}
              onCompanyIdChange={() => {
                fetchAreas()
                fetchOrders()
              }}
            />
            <div className='production__search-field'>
              <input
                className='inputs__general'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Buscar folio, artículo o área'
                aria-label='Buscar órdenes de producción'
              />
              <div className='production__search-icon' aria-hidden>
                <svg xmlns='http://www.w3.org/2000/svg' height='20' viewBox='0 -960 960 960' width='20' fill='#f5f6f7'>
                  <path d='M380-320q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l224 224q11 11 11 28t-11 28q-11 11-28 11t-28-11L532-372q-30 24-69 38t-83 14Zm0-80q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z' />
                </svg>
              </div>
            </div>
          </div>
          <div className='production__toolbar-right'>
            <button type='button' className='btn__general-purple' onClick={openCreate}>
              Nueva orden
            </button>
          </div>
        </div>

        <section className='production__summary'>
          <div className='production__summary-card'>
            <span>Total órdenes</span>
            <strong>{summary.total}</strong>
          </div>
          <div className='production__summary-card production__summary-card--draft'>
            <span>Borradores</span>
            <strong>{summary.draft}</strong>
          </div>
          <div className='production__summary-card production__summary-card--progress'>
            <span>En progreso</span>
            <strong>{summary.inProgress}</strong>
          </div>
          <div className='production__summary-card production__summary-card--done'>
            <span>Completadas</span>
            <strong>{summary.completed}</strong>
          </div>
        </section>

        <div className='production__panel-head'>
          <div className='production__filters'>
            {[
              { id: 'ALL', label: 'Todas' },
              { id: 'DRAFT', label: 'Borrador' },
              { id: 'IN_PROGRESS', label: 'En progreso' },
              { id: 'COMPLETED', label: 'Completadas' },
              { id: 'CANCELLED', label: 'Canceladas' },
            ].map((item) => (
              <button
                key={item.id}
                type='button'
                className={`production__filter-btn ${statusFilter === item.id ? 'is-active' : ''}`}
                onClick={() => setStatusFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className='production__area-filter'>
            <label htmlFor='production-area-filter'>Área</label>
            <select
              id='production-area-filter'
              className='inputs__general production__area-select'
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              <option value='ALL'>Todas las áreas</option>
              <option value='0'>Sin área asignada</option>
              {areas.map((area) => (
                <option key={area.id} value={String(area.id)}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>
          <div className='production__area-filter'>
            <label htmlFor='production-urgency-filter'>Urgencia</label>
            <select
              id='production-urgency-filter'
              className='inputs__general production__area-select'
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
            >
              <option value='ALL'>Todas</option>
              <option value='URGENT'>Urgente</option>
              <option value='HIGH'>Alta</option>
              <option value='NORMAL'>Normal</option>
              <option value='LOW'>Baja</option>
            </select>
          </div>
          <div className='production__count'>
            <span>Total (vista)</span>
            <span className='production__count-badge'>{filteredOrders.length}</span>
          </div>
        </div>

        <section className='production__table-wrap'>
          <div className='production__table-head production-orders__head'>
            <span>Folio</span>
            <span>Artículo</span>
            <span>Venta</span>
            <span>Área</span>
            <span>Ruta</span>
            <span>Avance</span>
            <span>Entrega</span>
            <span>Urgencia</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          <div className='production__table-body'>
            {loading ? (
              <div className='production__loading'>
                <span className='production__spinner' />
                Cargando órdenes...
              </div>
            ) : filteredOrders.length === 0 ? (
              <p className='production__empty'>No hay órdenes de producción</p>
            ) : (
              filteredOrders.map((order) => {
                const variation = order.itemVariation
                const planned = Number(order.quantityPlanned) || 0
                const produced = Number(order.quantityProduced) || 0
                const progress = getProgress(planned, produced)

                return (
                  <div className='production__table-row production-orders__row' key={order.id}>
                    <div className='production__folio'>
                      <strong>OP-{order.folio}</strong>
                      <small>{formatDate(order.startDate ?? order.createdAt)}</small>
                    </div>

                    <div className='production__product'>
                      <span className='production__product-name'>
                        {order.item?.name ?? '—'}
                      </span>
                      <span className='production__product-meta'>
                        {order.item?.code ? `${order.item.code} · ` : ''}
                        {variation
                          ? `${variation.color} · Talla ${variation.size}`
                          : 'Sin variación'}
                      </span>
                    </div>

                    <span className='production-queue__sale'>{getSaleLabel(order)}</span>

                    <div className='production__area-cell'>
                      <select
                        className={`inputs__general production__area-select ${
                          !order.areaId ? 'production__area-select--empty' : ''
                        }`}
                        value={order.areaId ? String(order.areaId) : ''}
                        disabled={assigningAreaId === order.id}
                        onChange={(e) => handleAreaChange(order, e.target.value)}
                        aria-label={`Enviar OP-${order.folio} a área`}
                      >
                        <option value=''>Sin área</option>
                        {areas.map((area) => (
                          <option key={area.id} value={String(area.id)}>
                            {area.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <span className='production-queue__route'>{getRouteLabel(order)}</span>

                    <div className='production__progress'>
                      <div className='production__progress-text'>
                        <span>
                          {produced} / {planned} u.
                        </span>
                        <span>{progress}%</span>
                      </div>
                      <div className='production__progress-bar'>
                        <div
                          className='production__progress-fill'
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <span className='production__date'>{formatDate(order.dueDate)}</span>

                    <select
                      className={`inputs__general production__area-select production__urgency-select ${URGENCY_CLASS[order.urgency] ?? ''}`}
                      value={order.urgency ?? 'NORMAL'}
                      disabled={busyId === order.id}
                      onChange={(e) => handleUrgencyChange(order, e.target.value)}
                    >
                      {Object.entries(URGENCY_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>

                    <span>
                      <span
                        className={`production__status ${STATUS_CLASS[order.status] ?? ''}`}
                      >
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </span>

                    <div className='production__actions'>
                      {order.status === 'IN_PROGRESS' ? (
                        <button
                          type='button'
                          className='production__action-btn production__action-btn--advance'
                          disabled={busyId === order.id}
                          onClick={() => handleAdvance(order)}
                        >
                          {getAdvanceButtonLabel(order)}
                        </button>
                      ) : null}
                      <button
                        type='button'
                        className='production__action-btn production__action-btn--edit'
                        onClick={() => openEdit(order)}
                      >
                        Editar
                      </button>
                      <button
                        type='button'
                        className='production__action-btn production__action-btn--delete'
                        onClick={() => handleDelete(order)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>

      <ModalProductionOrder
        order={selectedOrder}
        branchId={branchId}
        onSaved={fetchOrders}
      />
    </div>
  )
}

export default ProductionOrders
