import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import '../../categories/Categories.css'
import '../production.css'
import CategoriesStorePicker from '../../categories/CategoriesStorePicker'
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

const getSaleLabel = (order: any) => {
  if (!order.sale) return '—'
  const serie = order.sale.series?.name ?? 'VENT'
  const folio = order.sale.folio ?? order.sale.id
  return `${serie}-${folio}`
}

const getRouteLabel = getRouteProgressLabel

const ProductionQueue: React.FC = () => {
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [areaFilter, setAreaFilter] = useState<string>('ALL')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL')
  const [busyId, setBusyId] = useState<number | null>(null)

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
        status: 'IN_PROGRESS',
        areaId:
          areaFilter !== 'ALL' ? Number(areaFilter) : undefined,
        urgency: urgencyFilter !== 'ALL' ? urgencyFilter : undefined,
      })
      setOrders(Array.isArray(response?.data) ? response.data : [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [branchId, areaFilter, urgencyFilter])

  useEffect(() => {
    fetchAreas()
  }, [fetchAreas])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const queueSummary = useMemo(() => {
    const urgent = orders.filter((o) => o.urgency === 'URGENT' || o.urgency === 'HIGH').length
    const overdue = orders.filter((o) => {
      if (!o.dueDate) return false
      return new Date(o.dueDate).getTime() < Date.now()
    }).length
    return { total: orders.length, urgent, overdue }
  }, [orders])

  const handleAdvance = async (order: any) => {
    setBusyId(order.id)
    try {
      const response: any = await APIs.advanceProductionOrderArea(order.id)
      Swal.fire({
        icon: 'success',
        title: 'Área actualizada',
        text: response?.message ?? 'La orden avanzó en el proceso.',
        timer: 1800,
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

  return (
    <div className='production'>
      <div className='production__container'>
        <header className='production__header'>
          <span className='production__eyebrow'>Producción</span>
          <h1 className='production__title'>Cola de trabajo por área</h1>
          <p className='production__subtitle'>
            Vista operativa para cada área: prioridad, entrega y avance al siguiente paso del
            proceso.
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
            <div className='production__area-filter'>
              <label htmlFor='queue-area-filter'>Área</label>
              <select
                id='queue-area-filter'
                className='inputs__general production__area-select'
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
              >
                <option value='ALL'>Todas las áreas</option>
                {areas.map((area) => (
                  <option key={area.id} value={String(area.id)}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='production__area-filter'>
              <label htmlFor='queue-urgency-filter'>Urgencia</label>
              <select
                id='queue-urgency-filter'
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
          </div>
        </div>

        <section className='production__summary'>
          <div className='production__summary-card'>
            <span>En cola</span>
            <strong>{queueSummary.total}</strong>
          </div>
          <div className='production__summary-card production__summary-card--progress'>
            <span>Alta / Urgente</span>
            <strong>{queueSummary.urgent}</strong>
          </div>
          <div className='production__summary-card production__summary-card--draft'>
            <span>Vencidas</span>
            <strong>{queueSummary.overdue}</strong>
          </div>
        </section>

        <section className='production__table-wrap'>
          <div className='production__table-head production-queue__head'>
            <span>OP</span>
            <span>Artículo</span>
            <span>Venta</span>
            <span>Área</span>
            <span>Ruta</span>
            <span>Entrega</span>
            <span>Urgencia</span>
            <span>Acciones</span>
          </div>
          <div className='production__table-body'>
            {loading ? (
              <div className='production__loading'>
                <span className='production__spinner' />
                Cargando cola…
              </div>
            ) : orders.length === 0 ? (
              <p className='production__empty'>No hay órdenes en progreso para esta vista</p>
            ) : (
              orders.map((order) => {
                const isOverdue =
                  order.dueDate && new Date(order.dueDate).getTime() < Date.now()

                return (
                  <div className='production__table-row production-queue__row' key={order.id}>
                    <div className='production__folio'>
                      <strong>OP-{order.folio}</strong>
                      <small>{order.quantityPlanned} u.</small>
                    </div>
                    <div className='production__product'>
                      <span className='production__product-name'>{order.item?.name ?? '—'}</span>
                      <span className='production__product-meta'>
                        {order.itemVariation
                          ? `${order.itemVariation.color} · ${order.itemVariation.size}`
                          : order.item?.code ?? ''}
                      </span>
                    </div>
                    <span className='production-queue__sale'>{getSaleLabel(order)}</span>
                    <span>{order.area?.name ?? '—'}</span>
                    <span className='production-queue__route'>{getRouteLabel(order)}</span>
                    <span className={isOverdue ? 'production-queue__due production-queue__due--late' : 'production-queue__due'}>
                      {formatDate(order.dueDate)}
                    </span>
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
                    <div className='production__actions'>
                      <button
                        type='button'
                        className='production__action-btn production__action-btn--edit'
                        disabled={busyId === order.id}
                        onClick={() => handleAdvance(order)}
                      >
                        {getAdvanceButtonLabel(order)}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default ProductionQueue
