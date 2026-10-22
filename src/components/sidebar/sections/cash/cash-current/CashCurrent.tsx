import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import APIs from '../../../../../services/APIs';
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker';
import { CashReportData } from '../shared/printCashReport';
import '../../../../general/skeleton/TableSkeleton.css';
import './CashCurrent.css';

const REFRESH_MS = 30_000;

const money = (value: any) =>
  Number(value ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const dateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : '—');
const fullName = (user?: any) => [user?.firstName, user?.firstLastName].filter(Boolean).join(' ') || '—';

// "hace 2 h 15 min" desde la apertura
const openFor = (since?: string | null) => {
  if (!since) return '—';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
};

const CashCurrent = () => {
  const navigate = useNavigate();
  const userState = useSelector((state: any) => state.user);
  // La caja es por sucursal: se elige arriba (por defecto la de la sesión)
  const [branchId, setBranchId] = useState<number>(userState?.activeBranchId ?? userState?.branchId ?? 1);

  const [shift, setShift] = useState<any>(null);
  const [report, setReport] = useState<CashReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!branchId) {
      setShift(null);
      setReport(null);
      setLoading(false);
      return;
    }
    try {
      if (!silent) setLoading(true);
      const res: any = await APIs.getCurrentCashShift(branchId);
      const current = res?.status === 'success' ? res.data : null;
      setShift(current);
      if (current) {
        // El esperado sale del reporte del turno: incluye ventas en efectivo, no solo movimientos
        const rep: any = await APIs.getCashShiftReport(current.id);
        setReport(rep?.data ?? null);
      } else {
        setReport(null);
      }
    } catch (err: any) {
      if (!silent) {
        setShift(null);
        setReport(null);
        Swal.fire({ icon: 'error', title: 'No se pudo cargar la caja', text: err?.message });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    load();
  }, [load]);

  // La caja cambia con cada venta: se refresca sola cada 30 s
  useEffect(() => {
    const timer = setInterval(() => load(true), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const hasShift = !!shift && !!report;
  const recent = hasShift ? [...(report!.movements ?? [])].slice(-5).reverse() : [];

  return (
    <div className='cash-current'>
      <div className='cash-current__container'>
        <div className='cash-current__header'>
          <div className='cash-current__header-left'>
            <CategoriesStorePicker branchId={branchId} onBranchIdChange={setBranchId} />
            {hasShift && (
              <>
                <span className='cash-current__chip'>
                  <span className='cash-current__dot' />
                  Turno #{shift.id} abierto
                </span>
                <span className='cash-current__meta'>
                  <span className='material-symbols-rounded'>person</span>
                  {fullName(shift.user)}
                </span>
              </>
            )}
          </div>
          <div className='cash-current__header-actions'>
            <button type='button' className='btn__general-secondary' onClick={() => load()} disabled={loading}>
              Actualizar
            </button>
            <button type='button' className='btn__general-secondary' onClick={() => navigate('/auth/cash/movements')} disabled={!hasShift}>
              Nuevo movimiento
            </button>
            <button type='button' className='btn__general-primary' onClick={() => navigate('/auth/cash/cuts')} disabled={!hasShift}>
              Corte de caja
            </button>
          </div>
        </div>

        {loading ? (
          <>
            <div className='cash-current__cards'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div className='cash-current__card' key={i}>
                  <span className='table-skeleton__shimmer cash-current__sk cash-current__sk--label' />
                  <span className='table-skeleton__shimmer cash-current__sk cash-current__sk--value' />
                </div>
              ))}
            </div>
            <div className='cash-current__panels'>
              <div className='cash-current__panel'><div className='table-skeleton__shimmer cash-current__sk-block' /></div>
              <div className='cash-current__panel'><div className='table-skeleton__shimmer cash-current__sk-block' /></div>
            </div>
          </>
        ) : !hasShift ? (
          <div className='cash-current__empty'>
            <span className='material-symbols-rounded'>point_of_sale</span>
            <p>{branchId ? 'No hay un turno abierto en esta sucursal' : 'Selecciona una sucursal'}</p>
            <span>Para empezar a operar, abre la caja en la sección de Turnos.</span>
            {branchId ? (
              <button type='button' className='btn__general-primary' onClick={() => navigate('/auth/cash/shifts')}>
                Abrir turno
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className='cash-current__cards'>
              <div className='cash-current__card cash-current__card--highlight'>
                <span>Efectivo esperado</span>
                <b>{money(report!.expectedBalance)}</b>
                <small>Lo que debería haber en caja ahora</small>
              </div>
              <div className='cash-current__card'>
                <span>Fondo inicial</span>
                <b>{money(report!.openingAmount)}</b>
              </div>
              <div className='cash-current__card'>
                <span>Ventas en efectivo</span>
                <b className='is-in'>{money(report!.cashSalesTotal)}</b>
              </div>
              <div className='cash-current__card'>
                <span>Ingresos / egresos</span>
                <b>
                  <span className='is-in'>+{money(report!.incomes)}</span>
                  <em> / </em>
                  <span className='is-out'>−{money(report!.expenses)}</span>
                </b>
              </div>
              <div className='cash-current__card'>
                <span>Abierto desde</span>
                <b className='cash-current__card-small'>{dateTime(report!.openedAt)}</b>
                <small>Hace {openFor(report!.openedAt)}</small>
              </div>
            </div>

            <div className='cash-current__panels'>
              <section className='cash-current__panel'>
                <h3 className='cash-current__panel-title'>
                  Ventas por método de pago <span>{money(report!.salesTotal ?? 0)} vendidos</span>
                </h3>
                {(report!.byPaymentMethod ?? []).length === 0 ? (
                  <p className='cash-current__muted'>Aún no hay cobros en este turno.</p>
                ) : (
                  <div className='cash-current__methods'>
                    {(report!.byPaymentMethod ?? []).map((m) => {
                      const share = report!.salesTotal ? (m.total / report!.salesTotal) * 100 : 0;
                      return (
                        <div className='cash-current__method' key={m.code}>
                          <div className='cash-current__method-top'>
                            <span>{m.name} <small>{m.count} cobro{m.count === 1 ? '' : 's'}</small></span>
                            <b>{money(m.total)}</b>
                          </div>
                          <div className='cash-current__bar'><span style={{ width: `${share}%` }} /></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className='cash-current__panel'>
                <h3 className='cash-current__panel-title'>
                  Últimos movimientos
                  <button type='button' className='cash-current__link' onClick={() => navigate('/auth/cash/movements')}>Ver todos</button>
                </h3>
                {recent.length === 0 ? (
                  <p className='cash-current__muted'>No hay movimientos registrados aún.</p>
                ) : (
                  <div className='cash-current__moves'>
                    {recent.map((m) => (
                      <div className='cash-current__move' key={m.id}>
                        <span className={`cash-current__move-icon material-symbols-rounded ${m.type === 'INCOME' ? 'is-in' : 'is-out'}`}>
                          {m.type === 'INCOME' ? 'south_west' : 'north_east'}
                        </span>
                        <div className='cash-current__move-text'>
                          <strong>{m.concept}</strong>
                          <small>{dateTime(m.createdAt)}</small>
                        </div>
                        <b className={m.type === 'INCOME' ? 'is-in' : 'is-out'}>
                          {m.type === 'INCOME' ? '+' : '−'}{money(m.amount)}
                        </b>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CashCurrent;
