import React, { useMemo, useState } from 'react'
import './CreditAccounts.css'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
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

  const activeCount = MOCK_ACCOUNTS.filter((a) => a.status === 'ACTIVE').length
  const totalCredit = MOCK_ACCOUNTS.reduce((sum, item) => sum + item.creditLimit, 0)
  const totalUsed = MOCK_ACCOUNTS.reduce((sum, item) => sum + item.balance, 0)
  const totalAvailable = Math.max(totalCredit - totalUsed, 0)

  return (
    <div className='credit-accounts'>
      <div className='credit-accounts__container'>
        <div className='credit-accounts__notice' role='note'>
          <span className='material-symbols-rounded'>info</span>
          <div>
            <strong>Vista de ejemplo</strong>
            <span>Los clientes y montos de esta pantalla son de muestra: el módulo de cobranza aún no está conectado a los datos reales.</span>
          </div>
        </div>

        <div className='credit-accounts__header'>
          <div className='credit-accounts__header-left'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={(id) => {
                setBranchId(id)
                localStorage.setItem('categories-store-id', String(id))
              }}
            />
            <div className='credit-accounts__search'>
              <span className='credit-accounts__search-icon material-symbols-rounded' aria-hidden>search</span>
              <input
                className='inputs__general credit-accounts__search-input'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Buscar cliente, RFC o teléfono'
                aria-label='Buscar cuenta de crédito'
              />
            </div>
          </div>
          <button type='button' className='btn__general-primary' disabled title='Disponible cuando se conecte el módulo de cobranza'>
            Nueva cuenta de crédito
          </button>
        </div>

        <div className='credit-accounts__summary'>
          <div className='credit-accounts__card'>
            <span>Cuentas activas</span>
            <b>{activeCount}</b>
          </div>
          <div className='credit-accounts__card'>
            <span>Límite total</span>
            <b>{formatMoney(totalCredit)}</b>
          </div>
          <div className='credit-accounts__card'>
            <span>Crédito utilizado</span>
            <b className='is-debt'>{formatMoney(totalUsed)}</b>
          </div>
          <div className='credit-accounts__card'>
            <span>Disponible</span>
            <b className='is-ok'>{formatMoney(totalAvailable)}</b>
          </div>
        </div>

        <div className='credit-accounts__list'>
          <div className='credit-accounts__row credit-accounts__row--head'>
            <span>Cliente</span>
            <span>Límite</span>
            <span>Uso del crédito</span>
            <span>Saldo</span>
            <span>Disponible</span>
            <span>Estado</span>
            <span className='credit-accounts__col-actions'>Acciones</span>
          </div>

          {filtered.length > 0 ? (
            filtered.map((item) => {
              const available = Math.max(item.creditLimit - item.balance, 0)
              const usage = item.creditLimit > 0 ? Math.min((item.balance / item.creditLimit) * 100, 100) : 0
              const level = usage >= 90 ? 'is-high' : usage >= 60 ? 'is-mid' : 'is-low'
              return (
                <div className='credit-accounts__row' key={item.id}>
                  <div className='credit-accounts__cell credit-accounts__cell--client' data-label='Cliente'>
                    <strong>{item.customerName}</strong>
                    <span>{[item.taxId, item.phone].filter(Boolean).join(' · ') || '—'}</span>
                  </div>
                  <div className='credit-accounts__cell' data-label='Límite'>{formatMoney(item.creditLimit)}</div>
                  <div className='credit-accounts__cell' data-label='Uso del crédito'>
                    <div className='credit-accounts__usage'>
                      <div className='credit-accounts__bar'>
                        <span className={level} style={{ width: `${usage}%` }} />
                      </div>
                      <small>{Math.round(usage)}%</small>
                    </div>
                  </div>
                  <div className={`credit-accounts__cell ${item.balance > 0 ? 'is-debt' : ''}`} data-label='Saldo'>
                    {formatMoney(item.balance)}
                  </div>
                  <div className='credit-accounts__cell is-ok' data-label='Disponible'>{formatMoney(available)}</div>
                  <div className='credit-accounts__cell' data-label='Estado'>
                    <span className={`credit-accounts__badge credit-accounts__badge--${item.status.toLowerCase()}`}>
                      {statusLabel[item.status] ?? item.status}
                    </span>
                  </div>
                  <div className='credit-accounts__cell credit-accounts__col-actions'>
                    <button type='button' className='credit-accounts__icon-btn' title='Editar (disponible al conectar el módulo)' aria-label='Editar cuenta' disabled>
                      <span className='material-symbols-rounded'>edit</span>
                    </button>
                    <button type='button' className='credit-accounts__icon-btn' title='Registrar abono (disponible al conectar el módulo)' aria-label='Registrar abono' disabled>
                      <span className='material-symbols-rounded'>payments</span>
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className='credit-accounts__state'>
              <p>No hay cuentas de crédito con ese criterio</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreditAccounts
