import React, { useMemo, useState } from 'react'
import '../cobranza.css'
import CategoriesStorePicker from '../../categories/CategoriesStorePicker'
import { readCategoryBranchId } from '../../../../../constants/category'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value)

const MOCK_DEBTORS = [
  {
    id: 1,
    customerName: 'María López',
    phone: '5512345678',
    balance: 4200,
    creditLimit: 15000,
    lastPaymentAt: '2026-05-20',
    daysOverdue: 0,
  },
  {
    id: 2,
    customerName: 'Distribuidora Norte SA',
    phone: '8187654321',
    balance: 12850,
    creditLimit: 50000,
    lastPaymentAt: '2026-04-15',
    daysOverdue: 12,
  },
  {
    id: 4,
    customerName: 'Tienda El Centro',
    phone: '3331122334',
    balance: 25000,
    creditLimit: 25000,
    lastPaymentAt: '2026-03-01',
    daysOverdue: 45,
  },
]

const Debtors: React.FC = () => {
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = MOCK_DEBTORS.filter((item) => item.balance > 0)
    if (!q) return base
    return base.filter(
      (item) =>
        item.customerName.toLowerCase().includes(q) ||
        item.phone?.includes(q),
    )
  }, [search])

  const totalDebt = filtered.reduce((sum, item) => sum + item.balance, 0)

  return (
    <div className='cobranza'>
      <div className='cobranza__container'>
        <div className='cobranza__toolbar'>
          <div className='cobranza__toolbar-left'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={(id) => {
                setBranchId(id)
                localStorage.setItem('categories-store-id', String(id))
              }}
            />
          </div>
          <div className='cobranza__toolbar-right'>
            <div className='cobranza__search-field'>
              <input
                className='inputs__general'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Buscar deudor'
                aria-label='Buscar deudor'
              />
            </div>
          </div>
        </div>

        <p className='cobranza__subtitle'>
          Clientes con saldo pendiente por ventas a crédito. Desde aquí puedes dar seguimiento y registrar abonos.
        </p>

        <div className='cobranza__stats'>
          <div className='cobranza__stat-card cobranza__stat-card--danger'>
            <span>Total por cobrar</span>
            <strong>{formatMoney(totalDebt)}</strong>
          </div>
          <div className='cobranza__stat-card'>
            <span>Deudores</span>
            <strong>{filtered.length}</strong>
          </div>
          <div className='cobranza__stat-card'>
            <span>Con atraso</span>
            <strong>{filtered.filter((d) => d.daysOverdue > 0).length}</strong>
          </div>
        </div>

        <div className='cobranza__table-wrap'>
          <div className='cobranza__table-head cobranza__table--debtors'>
            <span>Cliente</span>
            <span>Teléfono</span>
            <span>Saldo adeudado</span>
            <span>Último abono</span>
            <span>Días atraso</span>
            <span>Acciones</span>
          </div>

          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div className='cobranza__table-row cobranza__table--debtors' key={item.id}>
                <span>{item.customerName}</span>
                <span>{item.phone || '—'}</span>
                <span className='cobranza__money cobranza__money--debt'>
                  {formatMoney(item.balance)}
                </span>
                <span>{item.lastPaymentAt || '—'}</span>
                <span>
                  {item.daysOverdue > 0 ? (
                    <span className='cobranza__badge cobranza__badge--charge'>
                      {item.daysOverdue} días
                    </span>
                  ) : (
                    'Al corriente'
                  )}
                </span>
                <div className='cobranza__actions'>
                  <button type='button' className='cobranza__action-btn'>
                    Ver cuenta
                  </button>
                  <button type='button' className='cobranza__action-btn cobranza__action-btn--primary'>
                    Registrar abono
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className='cobranza__empty'>No hay deudores registrados.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Debtors
