import React, { useMemo, useState } from 'react'
import './Debtors.css'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
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

// Antigüedad de la deuda por días de atraso
const bucketOf = (days: number) => (days <= 0 ? 'current' : days <= 30 ? 'd30' : days <= 60 ? 'd60' : 'd60plus')

const formatDate = (value?: string) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

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
  const sumBy = (bucket: string) =>
    filtered.filter((d) => bucketOf(d.daysOverdue) === bucket).reduce((sum, d) => sum + d.balance, 0)

  return (
    <div className='debtors'>
      <div className='debtors__container'>
        <div className='debtors__notice' role='note'>
          <span className='material-symbols-rounded'>info</span>
          <div>
            <strong>Vista de ejemplo</strong>
            <span>Los deudores y montos de esta pantalla son de muestra: el módulo de cobranza aún no está conectado a los datos reales.</span>
          </div>
        </div>

        <div className='debtors__header'>
          <div className='debtors__header-left'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={(id) => {
                setBranchId(id)
                localStorage.setItem('categories-store-id', String(id))
              }}
            />
            <div className='debtors__search'>
              <span className='debtors__search-icon material-symbols-rounded' aria-hidden>search</span>
              <input
                className='inputs__general debtors__search-input'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Buscar deudor o teléfono'
                aria-label='Buscar deudor'
              />
            </div>
          </div>
          <p className='debtors__hint'>Clientes con saldo pendiente por ventas a crédito</p>
        </div>

        {/* Total por cobrar y antigüedad de la deuda */}
        <div className='debtors__summary'>
          <div className='debtors__card debtors__card--total'>
            <span>Total por cobrar</span>
            <b>{formatMoney(totalDebt)}</b>
            <small>{filtered.length} deudor{filtered.length === 1 ? '' : 'es'}</small>
          </div>
          <div className='debtors__card debtors__card--current'>
            <span>Al corriente</span>
            <b>{formatMoney(sumBy('current'))}</b>
          </div>
          <div className='debtors__card debtors__card--d30'>
            <span>1 a 30 días</span>
            <b>{formatMoney(sumBy('d30'))}</b>
          </div>
          <div className='debtors__card debtors__card--d60'>
            <span>31 a 60 días</span>
            <b>{formatMoney(sumBy('d60'))}</b>
          </div>
          <div className='debtors__card debtors__card--d60plus'>
            <span>Más de 60 días</span>
            <b>{formatMoney(sumBy('d60plus'))}</b>
          </div>
        </div>

        <div className='debtors__list'>
          <div className='debtors__row debtors__row--head'>
            <span>Cliente</span>
            <span>Saldo adeudado</span>
            <span>% del límite</span>
            <span>Último abono</span>
            <span>Atraso</span>
            <span className='debtors__col-actions'>Acciones</span>
          </div>

          {filtered.length > 0 ? (
            filtered.map((item) => {
              const usage = item.creditLimit > 0 ? Math.min((item.balance / item.creditLimit) * 100, 100) : 0
              return (
                <div className='debtors__row' key={item.id}>
                  <div className='debtors__cell debtors__cell--client' data-label='Cliente'>
                    <strong>{item.customerName}</strong>
                    <span>{item.phone || '—'}</span>
                  </div>
                  <div className='debtors__cell debtors__cell--debt' data-label='Saldo adeudado'>
                    {formatMoney(item.balance)}
                  </div>
                  <div className='debtors__cell' data-label='% del límite'>
                    <div className='debtors__usage'>
                      <div className='debtors__bar'><span style={{ width: `${usage}%` }} /></div>
                      <small>{Math.round(usage)}%</small>
                    </div>
                  </div>
                  <div className='debtors__cell debtors__cell--muted' data-label='Último abono'>{formatDate(item.lastPaymentAt)}</div>
                  <div className='debtors__cell' data-label='Atraso'>
                    <span className={`debtors__badge debtors__badge--${bucketOf(item.daysOverdue)}`}>
                      {item.daysOverdue > 0 ? `${item.daysOverdue} días` : 'Al corriente'}
                    </span>
                  </div>
                  <div className='debtors__cell debtors__col-actions'>
                    <button type='button' className='debtors__icon-btn' title='Ver cuenta (disponible al conectar el módulo)' aria-label='Ver cuenta' disabled>
                      <span className='material-symbols-rounded'>visibility</span>
                    </button>
                    <button type='button' className='debtors__icon-btn' title='Registrar abono (disponible al conectar el módulo)' aria-label='Registrar abono' disabled>
                      <span className='material-symbols-rounded'>payments</span>
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className='debtors__state'>
              <p>No hay deudores registrados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Debtors
