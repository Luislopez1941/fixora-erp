import React, { useMemo, useState } from 'react'
import './CreditPayments.css'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
import { readCategoryBranchId } from '../../../../../constants/category'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value)

const MOCK_CUSTOMERS = [
  { id: 1, name: 'María López', balance: 4200 },
  { id: 2, name: 'Distribuidora Norte SA', balance: 12850 },
  { id: 4, name: 'Tienda El Centro', balance: 25000 },
]

const MOCK_MOVEMENTS = [
  {
    id: 1,
    date: '2026-05-28 11:20',
    customerName: 'María López',
    type: 'PAYMENT',
    amount: 1500,
    balanceAfter: 4200,
    reference: 'EF-00128',
    userName: 'Cajero 1',
  },
  {
    id: 2,
    date: '2026-05-27 16:45',
    customerName: 'Distribuidora Norte SA',
    type: 'CHARGE',
    amount: 3200,
    balanceAfter: 12850,
    reference: 'Venta #1042',
    userName: 'Cajero 2',
  },
  {
    id: 3,
    date: '2026-05-26 10:10',
    customerName: 'Tienda El Centro',
    type: 'PAYMENT',
    amount: 5000,
    balanceAfter: 25000,
    reference: 'TRF-88991',
    userName: 'Admin',
  },
]

const typeLabel: Record<string, string> = {
  CHARGE: 'Cargo',
  PAYMENT: 'Abono',
  ADJUSTMENT: 'Ajuste',
  REFUND: 'Devolución',
}

type Filter = 'ALL' | 'PAYMENT' | 'CHARGE'

const CreditPayments: React.FC = () => {
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('ALL')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return MOCK_MOVEMENTS.filter((item) => {
      if (filter !== 'ALL' && item.type !== filter) return false
      if (!q) return true
      return item.customerName.toLowerCase().includes(q) || item.reference?.toLowerCase().includes(q)
    })
  }, [search, filter])

  const selectedCustomer = MOCK_CUSTOMERS.find((item) => String(item.id) === selectedCustomerId)

  // Validación inline del formulario de abono
  const amountNumber = Number(amount)
  const customerError = !selectedCustomer ? 'Selecciona al cliente' : ''
  const amountError =
    amount === '' ? 'El monto es requerido'
      : !Number.isFinite(amountNumber) || amountNumber <= 0 ? 'Debe ser un monto mayor a 0'
        : selectedCustomer && amountNumber > selectedCustomer.balance ? 'El abono no puede ser mayor al saldo adeudado' : ''
  const newBalance = selectedCustomer && !amountError && amount !== '' ? selectedCustomer.balance - amountNumber : null

  return (
    <div className='credit-payments'>
      <div className='credit-payments__container'>
        <div className='credit-payments__notice' role='note'>
          <span className='material-symbols-rounded'>info</span>
          <div>
            <strong>Vista de ejemplo</strong>
            <span>Los clientes, saldos y movimientos son de muestra: el módulo de cuentas por cobrar aún no está conectado a los datos reales, por eso los abonos todavía no se pueden guardar.</span>
          </div>
        </div>

        <div className='credit-payments__header'>
          <CategoriesStorePicker
            branchId={branchId}
            onBranchIdChange={(id) => {
              setBranchId(id)
              localStorage.setItem('categories-store-id', String(id))
            }}
          />
        </div>

        <section className='credit-payments__panel'>
          <h3 className='credit-payments__panel-title'>
            <span className='material-symbols-rounded'>payments</span>
            Registrar abono
          </h3>
          <div className='credit-payments__form'>
            <div>
              <label className='label__general' htmlFor='credit-customer'>Cliente / deudor</label>
              <select
                id='credit-customer'
                className='inputs__general'
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value=''>Selecciona cliente</option>
                {MOCK_CUSTOMERS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — Saldo {formatMoney(item.balance)}
                  </option>
                ))}
              </select>
              {selectedCustomerId === '' && amount !== '' && <small className='credit-payments__error'>{customerError}</small>}
            </div>
            <div>
              <label className='label__general' htmlFor='credit-amount'>Monto del abono</label>
              <input
                id='credit-amount'
                className='inputs__general'
                type='number'
                min={0}
                step='0.01'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder='0.00'
              />
              {amount !== '' && amountError && <small className='credit-payments__error'>{amountError}</small>}
            </div>
            <div>
              <label className='label__general' htmlFor='credit-reference'>Referencia</label>
              <input
                id='credit-reference'
                className='inputs__general'
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder='Folio, transferencia, etc.'
              />
            </div>
            <div className='credit-payments__balance'>
              <span>Saldo actual</span>
              <b>{selectedCustomer ? formatMoney(selectedCustomer.balance) : '—'}</b>
              <small>{newBalance != null ? `Quedaría en ${formatMoney(newBalance)}` : 'Elige cliente y monto'}</small>
            </div>
          </div>
          <div className='credit-payments__actions'>
            <button type='button' className='btn__general-primary' disabled title='Disponible cuando se conecte el módulo de cuentas por cobrar'>
              Guardar abono
            </button>
          </div>
        </section>

        <div className='credit-payments__toolbar'>
          <div className='credit-payments__tabs' role='tablist'>
            {([['ALL', 'Todos'], ['PAYMENT', 'Abonos'], ['CHARGE', 'Cargos']] as [Filter, string][]).map(([key, label]) => (
              <button
                key={key}
                type='button'
                role='tab'
                aria-selected={filter === key}
                className={`credit-payments__tab ${filter === key ? 'credit-payments__tab--active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className='credit-payments__search'>
            <span className='credit-payments__search-icon material-symbols-rounded' aria-hidden>search</span>
            <input
              className='inputs__general credit-payments__search-input'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Buscar cliente o referencia'
              aria-label='Buscar movimiento de crédito'
            />
          </div>
        </div>

        <div className='credit-payments__list'>
          <div className='credit-payments__row credit-payments__row--head'>
            <span>Fecha</span>
            <span>Cliente</span>
            <span>Tipo</span>
            <span className='credit-payments__col-amount'>Monto</span>
            <span className='credit-payments__col-amount'>Saldo después</span>
            <span>Referencia</span>
            <span>Usuario</span>
          </div>

          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div className='credit-payments__row' key={item.id}>
                <div className='credit-payments__cell credit-payments__cell--muted' data-label='Fecha'>{item.date}</div>
                <div className='credit-payments__cell credit-payments__cell--strong' data-label='Cliente'>{item.customerName}</div>
                <div className='credit-payments__cell' data-label='Tipo'>
                  <span className={`credit-payments__badge credit-payments__badge--${item.type === 'PAYMENT' ? 'payment' : 'charge'}`}>
                    {typeLabel[item.type] ?? item.type}
                  </span>
                </div>
                <div className={`credit-payments__cell credit-payments__col-amount ${item.type === 'PAYMENT' ? 'is-in' : 'is-out'}`} data-label='Monto'>
                  {item.type === 'PAYMENT' ? '−' : '+'}{formatMoney(item.amount)}
                </div>
                <div className='credit-payments__cell credit-payments__col-amount' data-label='Saldo después'>{formatMoney(item.balanceAfter)}</div>
                <div className='credit-payments__cell credit-payments__cell--muted' data-label='Referencia'>{item.reference || '—'}</div>
                <div className='credit-payments__cell' data-label='Usuario'>{item.userName}</div>
              </div>
            ))
          ) : (
            <div className='credit-payments__state'>
              <p>No hay movimientos con ese criterio</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreditPayments
