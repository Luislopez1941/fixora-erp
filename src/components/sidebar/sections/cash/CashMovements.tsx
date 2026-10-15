import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import APIs from '../../../../services/APIs';
import TableSkeleton from '../../../general/skeleton/TableSkeleton';
import CategoriesStorePicker from '../catalogos/categories/CategoriesStorePicker';
import './CashMovements.css';

type Filter = 'ALL' | 'INCOME' | 'EXPENSE';

const money = (value: any) =>
  Number(value ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const dateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : '—');
const fullName = (user?: any) => [user?.firstName, user?.firstLastName].filter(Boolean).join(' ') || '—';

const CashMovements = () => {
  const navigate = useNavigate();
  const userState = useSelector((state: any) => state.user);
  // Los movimientos pertenecen al turno de una sucursal: la sucursal se elige arriba
  const [branchId, setBranchId] = useState<number>(userState?.activeBranchId ?? userState?.branchId ?? 1);

  const [shift, setShift] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('ALL');

  // Modal de nuevo movimiento
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'INCOME', amount: '', concept: '' });
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCashData = useCallback(async () => {
    // "Sin sucursal" (id 0) del selector no tiene caja
    if (!branchId) {
      setShift(null);
      setMovements([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res: any = await APIs.getCurrentCashShift(branchId);
      if (res?.status === 'success' && res.data) {
        setShift(res.data);
        setMovements(Array.isArray(res.data.movements) ? res.data.movements : []);
      } else {
        setShift(null);
        setMovements([]);
      }
    } catch (err: any) {
      setShift(null);
      setMovements([]);
      Swal.fire({ icon: 'error', title: 'No se pudieron cargar los movimientos', text: err?.message });
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadCashData();
  }, [loadCashData]);

  const totals = useMemo(() => {
    const incomes = movements.filter((m) => m.type === 'INCOME').reduce((acc, m) => acc + Number(m.amount), 0);
    const expenses = movements.filter((m) => m.type === 'EXPENSE').reduce((acc, m) => acc + Number(m.amount), 0);
    return { incomes, expenses, net: incomes - expenses };
  }, [movements]);

  const visible = useMemo(
    () => [...movements].filter((m) => filter === 'ALL' || m.type === filter).reverse(),
    [movements, filter],
  );

  // ── Alta ──
  const amountNumber = Number(form.amount);
  const amountError =
    form.amount === '' ? 'El monto es requerido'
      : !Number.isFinite(amountNumber) || amountNumber <= 0 ? 'Debe ser un monto mayor a 0' : '';
  const conceptError = !form.concept.trim()
    ? 'El concepto es requerido'
    : form.concept.trim().length > 80 ? 'Máximo 80 caracteres' : '';

  const openModal = (type: 'INCOME' | 'EXPENSE' = 'INCOME') => {
    setForm({ type, amount: '', concept: '' });
    setTouched(false);
    setShowModal(true);
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!shift || amountError || conceptError) return;

    try {
      setIsSubmitting(true);
      const response: any = await APIs.addCashMovement({
        shiftId: shift.id,
        userId: userState?.id ?? userState?._id,
        type: form.type,
        amount: amountNumber,
        concept: form.concept.trim(),
      });
      if (response?.status === 'success') {
        setShowModal(false);
        await loadCashData();
      } else {
        Swal.fire({ icon: 'warning', title: 'No se pudo registrar el movimiento', text: response?.message });
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error al registrar el movimiento', text: err?.response?.data?.message || err?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasShift = !!shift;

  return (
    <div className='cash-movements'>
      <div className='cash-movements__container'>
        <div className='cash-movements__header'>
          <div className='cash-movements__header-left'>
            <CategoriesStorePicker branchId={branchId} onBranchIdChange={setBranchId} />
            <div className='cash-movements__tabs' role='tablist'>
              {([['ALL', 'Todos'], ['INCOME', 'Ingresos'], ['EXPENSE', 'Egresos']] as [Filter, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type='button'
                  role='tab'
                  aria-selected={filter === key}
                  className={`cash-movements__tab ${filter === key ? 'cash-movements__tab--active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            {hasShift && (
              <span className='cash-movements__shift'>
                <span className='material-symbols-rounded'>point_of_sale</span>
                Turno #{shift.id} · {fullName(shift.user)}
              </span>
            )}
          </div>
          <div className='cash-movements__header-actions'>
            <button type='button' className='btn__general-secondary' onClick={loadCashData} disabled={loading}>
              Actualizar
            </button>
            <button type='button' className='btn__general-secondary' onClick={() => openModal('EXPENSE')} disabled={!hasShift}>
              Registrar egreso
            </button>
            <button type='button' className='btn__general-primary' onClick={() => openModal('INCOME')} disabled={!hasShift}>
              Registrar ingreso
            </button>
          </div>
        </div>

        {/* Resumen del turno */}
        <div className='cash-movements__summary'>
          <div className='cash-movements__card'>
            <span>Ingresos</span>
            <b className='is-in'>{loading ? '—' : money(totals.incomes)}</b>
          </div>
          <div className='cash-movements__card'>
            <span>Egresos</span>
            <b className='is-out'>{loading ? '—' : money(totals.expenses)}</b>
          </div>
          <div className='cash-movements__card'>
            <span>Neto de movimientos</span>
            <b className={totals.net < 0 ? 'is-out' : ''}>{loading ? '—' : money(totals.net)}</b>
          </div>
        </div>

        <div className='cash-movements__list'>
          <div className='cash-movements__row cash-movements__row--head'>
            <span>Fecha y hora</span>
            <span>Concepto</span>
            <span>Tipo</span>
            <span className='cash-movements__col-amount'>Monto</span>
            <span>Responsable</span>
          </div>

          {loading ? (
            <TableSkeleton rowClassName='cash-movements__row' cols={[{ width: '70%' }, { width: '65%' }, { pill: true, width: '64px' }, { width: '60%' }, { width: '55%' }]} />
          ) : !hasShift ? (
            <div className='cash-movements__state'>
              <p>{branchId ? 'No hay un turno abierto en esta sucursal' : 'Selecciona una sucursal'}</p>
              <span>Los movimientos se registran dentro del turno de caja de cada sucursal.</span>
              {branchId ? (
                <button type='button' className='btn__general-primary' onClick={() => navigate('/auth/cash/shifts')}>
                  Ir a Turnos
                </button>
              ) : null}
            </div>
          ) : visible.length > 0 ? (
            visible.map((m) => (
              <div className='cash-movements__row' key={m.id}>
                <div className='cash-movements__cell cash-movements__cell--muted' data-label='Fecha y hora'>{dateTime(m.createdAt)}</div>
                <div className='cash-movements__cell cash-movements__cell--strong' data-label='Concepto'>{m.concept}</div>
                <div className='cash-movements__cell' data-label='Tipo'>
                  <span className={`cash-movements__badge ${m.type === 'INCOME' ? 'cash-movements__badge--in' : 'cash-movements__badge--out'}`}>
                    {m.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                  </span>
                </div>
                <div className={`cash-movements__cell cash-movements__col-amount ${m.type === 'INCOME' ? 'is-in' : 'is-out'}`} data-label='Monto'>
                  {m.type === 'INCOME' ? '+' : '−'}{money(m.amount)}
                </div>
                <div className='cash-movements__cell' data-label='Responsable'>{fullName(m.user)}</div>
              </div>
            ))
          ) : (
            <div className='cash-movements__state'>
              <p>{filter === 'ALL' ? 'Aún no hay movimientos en este turno' : 'No hay movimientos de este tipo'}</p>
              <span>Registra los ingresos y egresos de efectivo que no son ventas (pagos a proveedores, fondeos, retiros...).</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal en el <body>: encima del sidebar y el header */}
      {createPortal(
        <div className={`cash-movements_modal__overlay ${showModal ? 'active' : ''}`}>
          <div className={`cash-movements_modal__popup ${showModal ? 'active' : ''}`}>
            <div className='cash-movements_modal__header'>
              <button type='button' className='cash-movements_modal__close' onClick={() => setShowModal(false)} aria-label='Cerrar'>
                <span className='material-symbols-rounded'>close</span>
              </button>
              <p className='cash-movements_modal__title'>Nuevo movimiento de caja</p>
            </div>
            <form onSubmit={handleAddMovement} noValidate>
              <div className='cash-movements_modal__body'>
                <div className='cash-movements_modal__type' role='radiogroup' aria-label='Tipo de operación'>
                  {([['INCOME', 'Ingreso', 'add_circle'], ['EXPENSE', 'Egreso', 'remove_circle']] as const).map(([value, label, icon]) => (
                    <button
                      key={value}
                      type='button'
                      role='radio'
                      aria-checked={form.type === value}
                      className={`cash-movements_modal__type-btn cash-movements_modal__type-btn--${value === 'INCOME' ? 'in' : 'out'} ${form.type === value ? 'is-active' : ''}`}
                      onClick={() => setForm({ ...form, type: value })}
                      disabled={isSubmitting}
                    >
                      <span className='material-symbols-rounded'>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
                <div>
                  <label className='label__general'>Monto</label>
                  <input
                    className='inputs__general'
                    type='number'
                    step='0.01'
                    min='0'
                    placeholder='0.00'
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    disabled={isSubmitting}
                  />
                  {touched && amountError && <small className='cash-movements_modal__error'>{amountError}</small>}
                </div>
                <div>
                  <label className='label__general'>Concepto / motivo</label>
                  <input
                    className='inputs__general'
                    type='text'
                    maxLength={80}
                    placeholder='Ej. Pago a proveedor, fondeo de caja...'
                    value={form.concept}
                    onChange={(e) => setForm({ ...form, concept: e.target.value })}
                    disabled={isSubmitting}
                  />
                  {touched && conceptError && <small className='cash-movements_modal__error'>{conceptError}</small>}
                </div>
                <div className='cash-movements_modal__actions'>
                  <button type='button' className='btn__general-secondary' onClick={() => setShowModal(false)} disabled={isSubmitting}>Cancelar</button>
                  <button type='submit' className='btn__general-primary' disabled={isSubmitting}>
                    {isSubmitting ? 'Registrando...' : 'Registrar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default CashMovements;
