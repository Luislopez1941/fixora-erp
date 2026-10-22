import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import APIs from '../../../../services/APIs';
import TableSkeleton from '../../../general/skeleton/TableSkeleton';
import CategoriesStorePicker from '../catalogos/categories/CategoriesStorePicker';
import { CashReportData, CutKind, differenceLabel, printCashReport } from './printCashReport';
import './CashCuts.css';

type Tab = 'current' | 'history';

// Denominaciones del arqueo (pesos mexicanos)
const DENOMINATIONS: { value: number; label: string; kind: 'bill' | 'coin' }[] = [
  { value: 1000, label: '$1,000', kind: 'bill' },
  { value: 500, label: '$500', kind: 'bill' },
  { value: 200, label: '$200', kind: 'bill' },
  { value: 100, label: '$100', kind: 'bill' },
  { value: 50, label: '$50', kind: 'bill' },
  { value: 20, label: '$20', kind: 'bill' },
  { value: 10, label: '$10', kind: 'coin' },
  { value: 5, label: '$5', kind: 'coin' },
  { value: 2, label: '$2', kind: 'coin' },
  { value: 1, label: '$1', kind: 'coin' },
  { value: 0.5, label: '50¢', kind: 'coin' },
];

const money = (value: any) =>
  Number(value ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const dateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : '—');
const fullName = (user?: any) => [user?.firstName, user?.firstLastName].filter(Boolean).join(' ') || '—';
const diffClass = (difference: number | null | undefined) =>
  difference == null ? '' : difference === 0 ? 'is-ok' : difference > 0 ? 'is-over' : 'is-short';

const CashCuts = () => {
  const userState = useSelector((state: any) => state.user);
  // Los cortes son por sucursal: se elige arriba (por defecto la de la sesión)
  const [branchId, setBranchId] = useState<number>(userState?.activeBranchId ?? userState?.branchId ?? 1);

  const [activeTab, setActiveTab] = useState<Tab>('current');

  // ── Corte actual ──
  const [shift, setShift] = useState<any>(null);
  const [report, setReport] = useState<CashReportData | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [otherAmount, setOtherAmount] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  // Reglas de la sucursal (Configuración de caja)
  const [rules, setRules] = useState({ tolerance: 0, requireApproval: false, allowNegative: false });
  // Autorización de supervisor (cuando el cierre queda fuera de tolerancia)
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approverId, setApproverId] = useState('');
  const [approverPassword, setApproverPassword] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalTouched, setApprovalTouched] = useState(false);

  // ── Historial ──
  const [history, setHistory] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── Reporte en modal ──
  const [modalReport, setModalReport] = useState<{ report: CashReportData; kind: CutKind; counted?: number | null } | null>(null);

  const loadCurrent = useCallback(async () => {
    if (!branchId) {
      setShift(null);
      setReport(null);
      setLoadingCurrent(false);
      return;
    }
    setLoadingCurrent(true);
    try {
      const res: any = await APIs.getCurrentCashShift(branchId);
      const current = res?.status === 'success' ? res.data : null;
      setShift(current);
      if (current) {
        const rep: any = await APIs.getCashShiftReport(current.id);
        setReport(rep?.data ?? null);
      } else {
        setReport(null);
      }
    } catch (err: any) {
      setShift(null);
      setReport(null);
      Swal.fire({ icon: 'error', title: 'No se pudo cargar el corte', text: err?.message });
    } finally {
      setLoadingCurrent(false);
    }
  }, [branchId]);

  const loadHistory = useCallback(async () => {
    if (!branchId) {
      setHistory([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const res: any = await APIs.getCashShiftHistory(branchId, page);
      setHistory(Array.isArray(res?.data) ? res.data : []);
      setTotalPages(res?.total_pages || 1);
    } catch (err: any) {
      setHistory([]);
      Swal.fire({ icon: 'error', title: 'No se pudo cargar el historial', text: err?.message });
    } finally {
      setLoadingHistory(false);
    }
  }, [branchId, page]);

  useEffect(() => {
    loadCurrent();
    (async () => {
      try {
        const res: any = await APIs.getCashConfig(branchId);
        setRules({
          tolerance: Number(res?.data?.differenceTolerance ?? 0),
          requireApproval: !!res?.data?.requireManagerApproval,
          allowNegative: !!res?.data?.allowNegativeBalance,
        });
      } catch {
        // sin configuración se usan las reglas por defecto (sin tolerancia ni aprobación)
      }
    })();
  }, [loadCurrent, branchId]);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
  }, [activeTab, loadHistory]);

  // ── Arqueo ──
  const countedByDenominations = useMemo(
    () => DENOMINATIONS.reduce((acc, d) => acc + d.value * (Number(quantities[d.value]) || 0), 0),
    [quantities],
  );
  const counted = countedByDenominations + (Number(otherAmount) || 0);
  const expected = report?.expectedBalance ?? 0;
  const difference = counted - expected;
  const hasCount = counted > 0 || Object.values(quantities).some((q) => q !== '') || otherAmount !== '';

  const resetCount = () => {
    setQuantities({});
    setOtherAmount('');
    setTouched(false);
  };

  const setQuantity = (value: number, raw: string) => {
    // Solo enteros no negativos
    if (raw !== '' && !/^\d+$/.test(raw)) return;
    setQuantities((prev) => ({ ...prev, [value]: raw }));
  };

  // ── Cortes ──
  const handlePartialCut = async () => {
    if (!shift) return;
    try {
      setIsBusy(true);
      const rep: any = await APIs.getCashShiftReport(shift.id);
      setReport(rep?.data ?? null);
      setModalReport({ report: rep.data, kind: 'PARTIAL', counted: hasCount ? counted : null });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'No se pudo generar el corte parcial', text: err?.message });
    } finally {
      setIsBusy(false);
    }
  };

  // Cierra el turno; `approval` solo se manda cuando un supervisor autorizó
  const submitFinalCut = async (approval?: { userId: number; password: string }, notes?: string) => {
    try {
      setIsBusy(true);
      const response: any = await APIs.closeCashShift(shift.id, {
        closingAmount: counted.toFixed(2),
        ...(approval ? { approval } : {}),
        ...(notes?.trim() ? { notes: notes.trim() } : {}),
      });
      if (response?.status !== 'success') {
        Swal.fire({ icon: 'warning', title: 'No se pudo cerrar el turno', text: response?.message });
        return false;
      }
      const rep: any = await APIs.getCashShiftReport(shift.id);
      resetCount();
      setApprovalOpen(false);
      await loadCurrent();
      setModalReport({ report: rep.data, kind: 'FINAL', counted });
      return true;
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'No se pudo cerrar el turno', text: err?.response?.data?.message || err?.message });
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  const outOfTolerance = hasCount && Math.abs(difference) > rules.tolerance;

  const handleFinalCut = async () => {
    setTouched(true);
    if (!shift || !report) return;
    if (!hasCount) {
      Swal.fire({ icon: 'warning', title: 'Falta el arqueo', text: 'Captura el efectivo contado antes de cerrar el turno.' });
      return;
    }

    // Fuera de tolerancia: según la configuración se pide autorización o se bloquea el faltante
    if (outOfTolerance && rules.requireApproval) {
      try {
        const res: any = await APIs.getCashSupervisors();
        setSupervisors(Array.isArray(res?.data) ? res.data : []);
      } catch {
        setSupervisors([]);
      }
      setApproverId('');
      setApproverPassword('');
      setApprovalNotes('');
      setApprovalTouched(false);
      setApprovalOpen(true);
      return;
    }
    if (outOfTolerance && difference < 0 && !rules.allowNegative) {
      Swal.fire({
        icon: 'warning',
        title: 'No se puede cerrar con faltante',
        text: `Hay un faltante de ${money(Math.abs(difference))} y la sucursal no permite cerrar con saldo negativo (tolerancia ${money(rules.tolerance)}). Revisa el arqueo o ajusta la configuración de caja.`,
      });
      return;
    }

    const confirmation = await Swal.fire({
      icon: 'warning',
      title: 'Confirmar corte final',
      html: `Efectivo contado <b>${money(counted)}</b> contra esperado <b>${money(expected)}</b>.<br/>Diferencia: <b>${money(difference)}</b> (${differenceLabel(difference)}).<br/><br/>Esto <b>cierra el turno</b> y no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: 'Cerrar turno',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });
    if (!confirmation.isConfirmed) return;
    await submitFinalCut();
  };

  const approverError = !approverId ? 'Selecciona al supervisor' : '';
  const passwordError = !approverPassword ? 'La contraseña es requerida' : '';

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    setApprovalTouched(true);
    if (approverError || passwordError) return;
    await submitFinalCut({ userId: Number(approverId), password: approverPassword }, approvalNotes);
  };

  const openHistoryReport = async (item: any) => {
    try {
      const rep: any = await APIs.getCashShiftReport(item.id);
      setModalReport({ report: rep.data, kind: item.status === 'CLOSED' ? 'FINAL' : 'PARTIAL', counted: item.closingAmount != null ? Number(item.closingAmount) : null });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'No se pudo cargar el reporte', text: err?.message });
    }
  };

  // ── Datos derivados del reporte en modal ──
  const modalCounted = modalReport ? (modalReport.counted ?? modalReport.report.closingAmount ?? null) : null;
  const modalDifference = modalReport && modalCounted != null ? modalCounted - modalReport.report.expectedBalance : null;

  return (
    <div className='cash-cuts'>
      <div className='cash-cuts__container'>
        <div className='cash-cuts__header'>
          <div className='cash-cuts__header-left'>
          <CategoriesStorePicker
            branchId={branchId}
            onBranchIdChange={(id) => {
              setBranchId(id);
              setPage(1);
              resetCount();
            }}
          />
          <div className='cash-cuts__tabs' role='tablist'>
            {([['current', 'Corte actual'], ['history', 'Historial de cortes']] as [Tab, string][]).map(([key, label]) => (
              <button
                key={key}
                type='button'
                role='tab'
                aria-selected={activeTab === key}
                className={`cash-cuts__tab ${activeTab === key ? 'cash-cuts__tab--active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
          </div>
          {activeTab === 'current' && shift && (
            <div className='cash-cuts__header-actions'>
              <button type='button' className='btn__general-secondary' onClick={handlePartialCut} disabled={isBusy}>
                Corte parcial
              </button>
              <button type='button' className='btn__general-primary' onClick={handleFinalCut} disabled={isBusy}>
                Corte final
              </button>
            </div>
          )}
        </div>

        {activeTab === 'current' && (
          loadingCurrent ? (
            <div className='cash-cuts__grid'>
              <div className='cash-cuts__panel'><div className='cash-cuts__skeleton-block' /></div>
              <div className='cash-cuts__panel'><div className='cash-cuts__skeleton-block' /></div>
            </div>
          ) : !shift || !report ? (
            <div className='cash-cuts__panel cash-cuts__empty'>
              <span className='material-symbols-rounded'>point_of_sale</span>
              <p>{branchId ? 'No hay un turno abierto en esta sucursal' : 'Selecciona una sucursal'}</p>
              <span>Abre un turno en "Turnos" o revisa los cortes anteriores en el historial.</span>
            </div>
          ) : (
            <div className='cash-cuts__grid'>
              {/* Columna izquierda: esperado + desglose */}
              <div className='cash-cuts__column'>
                <section className='cash-cuts__panel'>
                  <h3 className='cash-cuts__panel-title'>Efectivo esperado <span>Turno #{report.shiftId} · {fullName(report.user)}</span></h3>
                  <div className='cash-cuts__lines'>
                    <div><span>Fondo inicial</span><b>{money(report.openingAmount)}</b></div>
                    <div><span>(+) Ventas en efectivo</span><b className='is-in'>{money(report.cashSalesTotal)}</b></div>
                    <div><span>(+) Ingresos</span><b className='is-in'>{money(report.incomes)}</b></div>
                    <div><span>(−) Egresos</span><b className='is-out'>{money(report.expenses)}</b></div>
                    <div className='cash-cuts__lines-total'><span>Efectivo esperado</span><b>{money(report.expectedBalance)}</b></div>
                  </div>
                </section>

                <section className='cash-cuts__panel'>
                  <h3 className='cash-cuts__panel-title'>Desglose por método de pago <span>{money(report.salesTotal ?? 0)} vendidos</span></h3>
                  {(report.byPaymentMethod ?? []).length === 0 ? (
                    <p className='cash-cuts__muted'>Aún no hay cobros en este turno.</p>
                  ) : (
                    <div className='cash-cuts__methods'>
                      {(report.byPaymentMethod ?? []).map((m) => {
                        const share = report.salesTotal ? (m.total / report.salesTotal) * 100 : 0;
                        return (
                          <div className='cash-cuts__method' key={m.code}>
                            <div className='cash-cuts__method-top'>
                              <span>{m.name} <small>{m.count} cobro{m.count === 1 ? '' : 's'}</small></span>
                              <b>{money(m.total)}</b>
                            </div>
                            <div className='cash-cuts__bar'><span style={{ width: `${share}%` }} /></div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>

              {/* Columna derecha: arqueo */}
              <section className='cash-cuts__panel'>
                <h3 className='cash-cuts__panel-title'>
                  Arqueo de caja <span>Cuenta billetes y monedas</span>
                  {hasCount && <button type='button' className='cash-cuts__link' onClick={resetCount}>Limpiar</button>}
                </h3>
                <div className='cash-cuts__count'>
                  {DENOMINATIONS.map((d) => {
                    const qty = Number(quantities[d.value]) || 0;
                    return (
                      <label className={`cash-cuts__denom cash-cuts__denom--${d.kind}`} key={d.value}>
                        <span className='cash-cuts__denom-label'>{d.label}</span>
                        <input
                          className='inputs__general'
                          inputMode='numeric'
                          placeholder='0'
                          value={quantities[d.value] ?? ''}
                          onChange={(e) => setQuantity(d.value, e.target.value)}
                          aria-label={`Cantidad de ${d.label}`}
                          disabled={isBusy}
                        />
                        <span className='cash-cuts__denom-sub'>{qty > 0 ? money(qty * d.value) : '—'}</span>
                      </label>
                    );
                  })}
                </div>

                <div className='cash-cuts__other'>
                  <label className='label__general'>Otros (vouchers en efectivo, monto libre)</label>
                  <input
                    className='inputs__general'
                    type='number'
                    min='0'
                    step='0.01'
                    placeholder='0.00'
                    value={otherAmount}
                    onChange={(e) => setOtherAmount(e.target.value)}
                    disabled={isBusy}
                  />
                </div>

                <div className='cash-cuts__summary'>
                  <div><span>Efectivo contado</span><b>{money(counted)}</b></div>
                  <div><span>Efectivo esperado</span><b>{money(expected)}</b></div>
                  <div className={`cash-cuts__diff ${hasCount ? diffClass(difference) : ''}`}>
                    <span>Diferencia</span>
                    <b>{hasCount ? money(difference) : '—'}</b>
                    <em>
                      {hasCount
                        ? (difference !== 0 && !outOfTolerance ? `${differenceLabel(difference)} · dentro de tolerancia` : differenceLabel(difference))
                        : 'Captura el arqueo'}
                    </em>
                  </div>
                </div>
                {touched && !hasCount && <small className='cash-cuts__error'>Captura el efectivo contado para hacer el corte final.</small>}
                {outOfTolerance && (
                  <small className='cash-cuts__error'>
                    {rules.requireApproval
                      ? `La diferencia excede la tolerancia (${money(rules.tolerance)}): el corte final pedirá la autorización de un supervisor.`
                      : difference < 0 && !rules.allowNegative
                        ? `El faltante excede la tolerancia (${money(rules.tolerance)}) y la sucursal no permite cerrar así.`
                        : `La diferencia excede la tolerancia (${money(rules.tolerance)}).`}
                  </small>
                )}
                <p className='cash-cuts__note'>
                  <span className='material-symbols-rounded'>info</span>
                  El corte parcial no cierra el turno; el corte final sí lo cierra con el efectivo contado.
                </p>
              </section>
            </div>
          )
        )}

        {activeTab === 'history' && (
          <>
            <div className='cash-cuts__list'>
              <div className='cash-cuts__row cash-cuts__row--head'>
                <span>Turno</span>
                <span>Cajero</span>
                <span>Apertura</span>
                <span>Cierre</span>
                <span>Esperado</span>
                <span>Contado</span>
                <span>Diferencia</span>
                <span className='cash-cuts__col-actions'>Reporte</span>
              </div>
              {loadingHistory ? (
                <TableSkeleton rowClassName='cash-cuts__row' cols={[{ width: '40%' }, { width: '70%' }, { width: '70%' }, { width: '70%' }, { width: '55%' }, { width: '55%' }, { pill: true, width: '70px' }, { actions: 2 }]} />
              ) : history.length > 0 ? (
                history.map((item) => (
                  <div className='cash-cuts__row' key={item.id}>
                    <div className='cash-cuts__cell cash-cuts__cell--strong' data-label='Turno'>#{item.id}</div>
                    <div className='cash-cuts__cell' data-label='Cajero'>{fullName(item.user)}</div>
                    <div className='cash-cuts__cell cash-cuts__cell--muted' data-label='Apertura'>{dateTime(item.openedAt)}</div>
                    <div className='cash-cuts__cell cash-cuts__cell--muted' data-label='Cierre'>{item.status === 'CLOSED' ? dateTime(item.closedAt) : 'Abierto'}</div>
                    <div className='cash-cuts__cell' data-label='Esperado'>{money(item.expectedAmount)}</div>
                    <div className='cash-cuts__cell' data-label='Contado'>{item.closingAmount != null ? money(item.closingAmount) : '—'}</div>
                    <div className='cash-cuts__cell' data-label='Diferencia'>
                      {item.difference != null
                        ? <span className={`cash-cuts__badge ${diffClass(item.difference)}`}>{money(item.difference)}</span>
                        : <span className='cash-cuts__badge'>En curso</span>}
                    </div>
                    <div className='cash-cuts__cell cash-cuts__col-actions'>
                      <button type='button' className='cash-cuts__icon-btn' title='Ver reporte' aria-label='Ver reporte' onClick={() => openHistoryReport(item)}>
                        <span className='material-symbols-rounded'>description</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className='cash-cuts__state'>
                  <p>Aún no hay cortes registrados</p>
                  <span>Los turnos cerrados aparecerán aquí con su diferencia.</span>
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <div className='cash-cuts__pager'>
                <button type='button' className='btn__general-secondary' disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
                <span>Página {page} de {totalPages}</span>
                <button type='button' className='btn__general-secondary' disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Autorización de supervisor para cierres fuera de tolerancia */}
      {createPortal(
        <div className={`cash-cuts_modal__overlay ${approvalOpen ? 'active' : ''}`}>
          <div className={`cash-cuts_modal__popup ${approvalOpen ? 'active' : ''}`}>
            <div className='cash-cuts_modal__header'>
              <button type='button' className='cash-cuts_modal__close' onClick={() => setApprovalOpen(false)} aria-label='Cerrar'>
                <span className='material-symbols-rounded'>close</span>
              </button>
              <p className='cash-cuts_modal__title'>Autorización de supervisor</p>
            </div>
            <form onSubmit={handleApprove} noValidate>
              <div className='cash-cuts_modal__body'>
                <p className='cash-cuts_modal__hint'>
                  La diferencia de <b>{money(difference)}</b> ({differenceLabel(difference)}) excede la tolerancia de {money(rules.tolerance)}.
                  Un supervisor debe autorizar el cierre con su usuario y contraseña.
                </p>
                <div>
                  <label className='label__general'>Supervisor</label>
                  <select className='inputs__general' value={approverId} onChange={(e) => setApproverId(e.target.value)} disabled={isBusy}>
                    <option value=''>Selecciona un supervisor...</option>
                    {supervisors.map((u) => (
                      <option key={u.id} value={u.id}>{fullName(u)}</option>
                    ))}
                  </select>
                  {approvalTouched && approverError && <small className='cash-cuts_modal__error'>{approverError}</small>}
                </div>
                <div>
                  <label className='label__general'>Contraseña del supervisor</label>
                  <input
                    className='inputs__general'
                    type='password'
                    autoComplete='off'
                    value={approverPassword}
                    onChange={(e) => setApproverPassword(e.target.value)}
                    disabled={isBusy}
                  />
                  {approvalTouched && passwordError && <small className='cash-cuts_modal__error'>{passwordError}</small>}
                </div>
                <div>
                  <label className='label__general'>Motivo de la diferencia (opcional)</label>
                  <input
                    className='inputs__general'
                    type='text'
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder='Ej. billete dañado, cambio mal dado...'
                    disabled={isBusy}
                  />
                </div>
                <div className='cash-cuts_modal__actions'>
                  <button type='button' className='btn__general-secondary' onClick={() => setApprovalOpen(false)} disabled={isBusy}>Cancelar</button>
                  <button type='submit' className='btn__general-primary' disabled={isBusy}>
                    {isBusy ? 'Cerrando...' : 'Autorizar y cerrar turno'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {/* Reporte del corte: modal en el <body>, encima del sidebar */}
      {createPortal(
        <div className={`cash-cuts_modal__overlay ${modalReport ? 'active' : ''}`}>
          <div className={`cash-cuts_modal__popup ${modalReport ? 'active' : ''}`}>
            <div className='cash-cuts_modal__header'>
              <button type='button' className='cash-cuts_modal__close' onClick={() => setModalReport(null)} aria-label='Cerrar'>
                <span className='material-symbols-rounded'>close</span>
              </button>
              <p className='cash-cuts_modal__title'>
                {modalReport ? `Corte ${modalReport.kind === 'FINAL' ? 'final' : 'parcial'} · Turno #${modalReport.report.shiftId}` : ''}
              </p>
            </div>
            {modalReport && (
              <div className='cash-cuts_modal__body'>
                <div className='cash-cuts_modal__meta'>
                  <div><span>Cajero</span><b>{fullName(modalReport.report.user)}</b></div>
                  <div><span>Sucursal</span><b>{modalReport.report.branchName ?? '—'}</b></div>
                  <div><span>Apertura</span><b>{dateTime(modalReport.report.openedAt)}</b></div>
                  <div><span>{modalReport.kind === 'FINAL' ? 'Cierre' : 'Estado'}</span><b>{modalReport.kind === 'FINAL' ? dateTime(modalReport.report.closedAt) : 'Turno abierto'}</b></div>
                </div>

                <div className='cash-cuts__lines'>
                  <div><span>Fondo inicial</span><b>{money(modalReport.report.openingAmount)}</b></div>
                  <div><span>(+) Ventas en efectivo</span><b className='is-in'>{money(modalReport.report.cashSalesTotal)}</b></div>
                  <div><span>(+) Ingresos</span><b className='is-in'>{money(modalReport.report.incomes)}</b></div>
                  <div><span>(−) Egresos</span><b className='is-out'>{money(modalReport.report.expenses)}</b></div>
                  <div className='cash-cuts__lines-total'><span>Efectivo esperado</span><b>{money(modalReport.report.expectedBalance)}</b></div>
                  <div><span>Efectivo contado</span><b>{modalCounted != null ? money(modalCounted) : '—'}</b></div>
                  <div className={`cash-cuts__lines-total cash-cuts__diff-line ${diffClass(modalDifference)}`}>
                    <span>Diferencia ({differenceLabel(modalDifference)})</span>
                    <b>{modalDifference != null ? money(modalDifference) : '—'}</b>
                  </div>
                </div>

                <h4 className='cash-cuts_modal__subtitle'>Desglose por método de pago</h4>
                <div className='cash-cuts__lines'>
                  {(modalReport.report.byPaymentMethod ?? []).length === 0
                    ? <div><span className='cash-cuts__muted'>Sin cobros registrados</span></div>
                    : (modalReport.report.byPaymentMethod ?? []).map((m) => (
                      <div key={m.code}><span>{m.name} <small>{m.count} cobro{m.count === 1 ? '' : 's'}</small></span><b>{money(m.total)}</b></div>
                    ))}
                  <div className='cash-cuts__lines-total'><span>Total vendido</span><b>{money(modalReport.report.salesTotal ?? 0)}</b></div>
                </div>

                <div className='cash-cuts_modal__actions'>
                  <button type='button' className='btn__general-secondary' onClick={() => setModalReport(null)}>Cerrar</button>
                  <button
                    type='button'
                    className='btn__general-primary'
                    onClick={() => printCashReport(modalReport.report, modalReport.kind, modalCounted)}
                  >
                    Imprimir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default CashCuts;
