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

const MOCK_ACCOUNTS = [
  {
    id: 1,
    customerName: 'María López',
    taxId: 'LOPM850101ABC',
    phone: '5512345678',
    creditLimit: 15000,
    balance: 4200,
    status: 'ACTIVE',
  },
  {
    id: 2,
    customerName: 'Distribuidora Norte SA',
    taxId: 'DNO940215XY2',
    phone: '8187654321',
    creditLimit: 50000,
    balance: 12850,
    status: 'ACTIVE',
  },
  {
    id: 3,
    customerName: 'Juan Pérez',
    taxId: 'PEXJ900812DEF',
    phone: '5599887766',
    creditLimit: 8000,
    balance: 0,
    status: 'ACTIVE',
  },
  {
    id: 4,
    customerName: 'Tienda El Centro',
    taxId: 'TEC880301GH3',
    phone: '3331122334',
    creditLimit: 25000,
    balance: 25000,
    status: 'SUSPENDED',
  },
]

const statusLabel: Record<string, string> = {
  ACTIVE: 'Activa',
  SUSPENDED: 'Suspendida',
  CLOSED: 'Cerrada',
}

const CreditAccounts: React.FC = () => {
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return MOCK_ACCOUNTS
    return MOCK_ACCOUNTS.filter(
      (item) =>
        item.customerName.toLowerCase().includes(q) ||
        item.taxId?.toLowerCase().includes(q) ||
        item.phone?.includes(q),
    )
  }, [search])

  const totalCredit = MOCK_ACCOUNTS.reduce((sum, item) => sum + item.creditLimit, 0)
  const totalUsed = MOCK_ACCOUNTS.reduce((sum, item) => sum + item.balance, 0)

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
                placeholder='Buscar cliente o RFC'
                aria-label='Buscar cuenta de crédito'
              />
            </div>
            <button type='button' className='btn__general-primary'>
              Nueva cuenta de crédito
            </button>
          </div>
        </div>

        <p className='cobranza__subtitle'>
          Otorga crédito a clientes registrados. Cada cliente tiene una sola cuenta con límite y saldo.
        </p>

        <div className='cobranza__stats'>
          <div className='cobranza__stat-card'>
            <span>Cuentas activas</span>
            <strong>{MOCK_ACCOUNTS.filter((a) => a.status === 'ACTIVE').length}</strong>
          </div>
          <div className='cobranza__stat-card'>
            <span>Límite total</span>
            <strong>{formatMoney(totalCredit)}</strong>
          </div>
          <div className='cobranza__stat-card cobranza__stat-card--danger'>
            <span>Crédito utilizado</span>
            <strong>{formatMoney(totalUsed)}</strong>
          </div>
        </div>

        <div className='cobranza__table-wrap'>
          <div className='cobranza__table-head cobranza__table--accounts'>
            <span>Cliente</span>
            <span>RFC</span>
            <span>Teléfono</span>
            <span>Límite</span>
            <span>Saldo</span>
            <span>Disponible</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>

          {filtered.length > 0 ? (
            filtered.map((item) => {
              const available = Math.max(item.creditLimit - item.balance, 0)
              return (
                <div className='cobranza__table-row cobranza__table--accounts' key={item.id}>
                  <span>{item.customerName}</span>
                  <span>{item.taxId || '—'}</span>
                  <span>{item.phone || '—'}</span>
                  <span className='cobranza__money'>{formatMoney(item.creditLimit)}</span>
                  <span className={`cobranza__money ${item.balance > 0 ? 'cobranza__money--debt' : ''}`}>
                    {formatMoney(item.balance)}
                  </span>
                  <span className='cobranza__money cobranza__money--ok'>
                    {formatMoney(available)}
                  </span>
                  <span>
                    <span className={`cobranza__badge cobranza__badge--${item.status.toLowerCase()}`}>
                      {statusLabel[item.status] ?? item.status}
                    </span>
                  </span>
                  <div className='cobranza__actions'>
                    <button type='button' className='cobranza__action-btn'>
                      Editar
                    </button>
                    <button type='button' className='cobranza__action-btn cobranza__action-btn--primary'>
                      Abonar
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className='cobranza__empty'>No hay cuentas de crédito con ese criterio.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreditAccounts
