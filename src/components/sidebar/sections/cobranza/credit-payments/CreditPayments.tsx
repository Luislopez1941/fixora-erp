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

const CreditPayments: React.FC = () => {
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [search, setSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return MOCK_MOVEMENTS
    return MOCK_MOVEMENTS.filter(
      (item) =>
        item.customerName.toLowerCase().includes(q) ||
        item.reference?.toLowerCase().includes(q),
    )
  }, [search])

  const selectedCustomer = MOCK_CUSTOMERS.find(
    (item) => String(item.id) === selectedCustomerId,
  )

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
        </div>

        <div className='cobranza__panel'>
          <h3 className='cobranza__panel-title'>Registrar abono</h3>
          <div className='cobranza__form-grid'>
            <div className='cobranza__field'>
              <label htmlFor='credit-customer'>Cliente / deudor</label>
              <select
                id='credit-customer'
                className='traditional__selector'
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
            </div>
            <div className='cobranza__field'>
              <label htmlFor='credit-amount'>Monto del abono</label>
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
            </div>
            <div className='cobranza__field'>
              <label htmlFor='credit-reference'>Referencia</label>
              <input
                id='credit-reference'
                className='inputs__general'
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder='Folio, transferencia, etc.'
              />
            </div>
            <div className='cobranza__field'>
              <label>Saldo actual</label>
              <input
                className='inputs__general'
                value={
                  selectedCustomer
                    ? formatMoney(selectedCustomer.balance)
                    : '—'
                }
                readOnly
              />
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
            <button type='button' className='btn__general-primary'>
              Guardar abono
            </button>
          </div>
        </div>

        <div className='cobranza__toolbar'>
          <div className='cobranza__toolbar-right' style={{ marginLeft: 'auto' }}>
            <div className='cobranza__search-field'>
              <input
                className='inputs__general'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Buscar movimiento'
                aria-label='Buscar movimiento de crédito'
              />
            </div>
          </div>
        </div>

        <div className='cobranza__table-wrap'>
          <div className='cobranza__table-head cobranza__table--movements'>
            <span>Fecha</span>
            <span>Cliente</span>
            <span>Tipo</span>
            <span>Monto</span>
            <span>Saldo después</span>
            <span>Referencia</span>
            <span>Usuario</span>
          </div>

          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div className='cobranza__table-row cobranza__table--movements' key={item.id}>
                <span>{item.date}</span>
                <span>{item.customerName}</span>
                <span>
                  <span
                    className={`cobranza__badge cobranza__badge--${
                      item.type === 'PAYMENT' ? 'payment' : 'charge'
                    }`}
                  >
                    {typeLabel[item.type] ?? item.type}
                  </span>
                </span>
                <span className='cobranza__money'>{formatMoney(item.amount)}</span>
                <span className='cobranza__money'>{formatMoney(item.balanceAfter)}</span>
                <span>{item.reference || '—'}</span>
                <span>{item.userName}</span>
              </div>
            ))
          ) : (
            <div className='cobranza__empty'>No hay movimientos registrados.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreditPayments
