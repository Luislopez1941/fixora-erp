import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import APIs from '../../../../../services/APIs';
import { PrivateRoutes } from '../../../../../models/routes';
import TableSkeleton from '../../../../general/skeleton/TableSkeleton';
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker';
import { fmt12, fmtRange } from '../shared/timeFormat';
import '../shared/CashShifts.css';

type Tab = 'active' | 'history';

const fullName = (user?: any) => [user?.firstName, user?.firstLastName].filter(Boolean).join(' ') || '—';
const initial = (user?: any) => (user?.firstName?.[0] ?? '?').toUpperCase();
const money = (value: any) =>
  Number(value ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const dateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : '—');

const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
// Horario que corresponde a este momento (considera los que cruzan la medianoche)
const scheduleAt = (list: any[], at = new Date()) => {
  const day = at.getDay();
  const now = at.getHours() * 60 + at.getMinutes();
  return list.find((s) => {
    if (!s.active) return false;
    const a = toMin(s.startTime), b = toMin(s.endTime);
    if (b > a) return s.days.includes(day) && now >= a && now < b;
    return (s.days.includes(day) && now >= a) || (s.days.includes((day + 6) % 7) && now < b);
  });
};
// Tiempo que falta (o que pasó) respecto a la hora de fin del turno programado
const remainingLabel = (end?: string | null, now = Date.now()) => {
  if (!end) return '';
  const diff = Math.round((new Date(end).getTime() - now) / 60000);
  const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`);
  return diff >= 0 ? `termina en ${fmt(diff)}` : `terminó hace ${fmt(-diff)}`;
};

// Estado del turno respecto a su horario: en horario, por terminar (30 min o menos) o vencido
const scheduleState = (end?: string | null, now = Date.now()) => {
  if (!end) return null;
  const diff = Math.round((new Date(end).getTime() - now) / 60000);
  if (diff < 0) return 'late';
  return diff <= 30 ? 'warn' : 'ok';
};
const STATE_TEXT: Record<string, string> = { ok: 'En horario', warn: 'Por terminar', late: 'Vencido' };

const CashShifts = () => {
  const navigate = useNavigate();
  const userState = useSelector((state: any) => state.user);
  const userId = userState?.id ?? userState?._id;
  // Sucursal que se está viendo; cambia al abrir un turno en otra sucursal
  const [branchId, setBranchId] = useState<number>(userState?.activeBranchId ?? userState?.branchId ?? 1);

  const [activeShifts, setActiveShifts] = useState<any[]>([]);
  const [historyShifts, setHistoryShifts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [handoverShiftId, setHandoverShiftId] = useState<number | null>(null);
  const [openingAmount, setOpeningAmount] = useState('');
  // Fondo inicial predeterminado de la sucursal (Configuración de caja)
  const [defaultOpening, setDefaultOpening] = useState(0);
  const [handoverUserId, setHandoverUserId] = useState('');
  // Usuarios que pueden recibir el turno (los trae el servidor: activos, de la empresa y con acceso a la sucursal)
  const [handoverUsers, setHandoverUsers] = useState<any[]>([]);
  const [handoverLoading, setHandoverLoading] = useState(false);
  // Empresa y sucursal en las que se abre el turno (el turno siempre pertenece a una sucursal)
  const [companies, setCompanies] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [modalCompanyId, setModalCompanyId] = useState<number | null>(null);
  const [modalBranchId, setModalBranchId] = useState<number | null>(null);
  const [assignableUsers, setAssignableUsers] = useState<any[]>([]);
  const [responsibleId, setResponsibleId] = useState('');
  // Turnos programados de la sucursal que se está viendo y de la sucursal del modal de apertura
  const [modalSchedules, setModalSchedules] = useState<any[]>([]);
  const [scheduleChoice, setScheduleChoice] = useState('');
  // Cajas de la sucursal del modal: con cajas, el turno se abre en una y sus horarios son los de esa caja
  const [modalRegisters, setModalRegisters] = useState<any[]>([]);
  const [registerChoice, setRegisterChoice] = useState('');
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  // Empresa que se está viendo en la página (el modal parte de ella) y si ya cargaron cajas/horarios del modal
  const [pageCompanyId, setPageCompanyId] = useState<number | null>(null);
  const [modalMetaLoaded, setModalMetaLoaded] = useState(false);
  // Reloj que se refresca cada minuto para el tiempo restante de los turnos
  const [clock, setClock] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchShifts = async () => {
    if (!branchId) {
      setActiveShifts([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const activeRes: any = await APIs.getActiveCashShifts(branchId);
      if (activeRes?.status === 'success') {
        setActiveShifts(Array.isArray(activeRes.data) ? activeRes.data : []);
      }

      // Pendiente: el API actual no expone historial, estos datos son de muestra.
      setHistoryShifts([
        { id: 101, user: { firstName: 'Ana', firstLastName: 'Pérez' }, openedAt: '2026-10-01T08:00:00Z', closedAt: '2026-10-01T16:00:00Z', openingAmount: 100, closingAmount: 1250, status: 'CLOSED' },
        { id: 102, user: { firstName: 'Carlos', firstLastName: 'Ruiz' }, openedAt: '2026-10-02T16:00:00Z', closedAt: '2026-10-03T00:00:00Z', openingAmount: 100, closingAmount: 980, status: 'CLOSED' },
      ]);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'No se pudieron cargar los turnos', text: err?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
    APIs.getCashAlerts(branchId).then((r: any) => setAlerts(Array.isArray(r?.data) ? r.data : [])).catch(() => setAlerts([]));
    (async () => {
      try {
        const res: any = await APIs.getCashConfig(branchId);
        setDefaultOpening(Number(res?.data?.defaultOpeningAmount ?? 0));
      } catch {
        setDefaultOpening(0);
      }
    })();
  }, [branchId]);

  // ── Abrir turno ──
  const amountNumber = Number(openingAmount);
  const amountError =
    openingAmount === ''
      ? 'El monto de apertura es requerido'
      : !Number.isFinite(amountNumber) || amountNumber < 0
        ? 'Debe ser un número mayor o igual a 0'
        : '';

  const asList = (res: any): any[] => (Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []);

  // Carga las sucursales de una empresa y deja elegida la indicada (o la primera)
  const loadModalBranches = async (companyId: number, preferredBranchId?: number | null) => {
    setBranchesLoading(true);
    setModalBranchId(null);
    try {
      const list = asList(await APIs.getBranchOffices(companyId, userId));
      setBranches(list);
      const keep = list.find((b) => b.id === preferredBranchId) ?? list[0];
      setModalBranchId(keep?.id ?? null);
    } catch {
      setBranches([]);
      setModalBranchId(null);
    } finally {
      setBranchesLoading(false);
    }
  };

  const loadCompanies = async (preferredBranchId: number) => {
    try {
      const list = asList(await APIs.getCompaniesByUser(userId));
      setCompanies(list);
      const initial =
        list.find((c) => c.id === (pageCompanyId ?? userState?.activeCompanyId ?? userState?.companyId)) ?? list[0];
      if (initial) {
        setModalCompanyId(initial.id);
        await loadModalBranches(initial.id, preferredBranchId);
      }
    } catch {
      setCompanies([]);
    }
  };

  const openCreate = async () => {
    // Se propone el fondo predeterminado, pero se puede cambiar
    setOpeningAmount(defaultOpening > 0 ? String(defaultOpening) : '');
    setTouched(false);
    setShowCreateModal(true);
    await loadCompanies(branchId);
  };

  // Si el responsable elegido tiene asignación vigente, se propone su caja
  useEffect(() => {
    if (!showCreateModal || !modalBranchId || !responsibleId || modalRegisters.length === 0) return;
    let cancelled = false;
    APIs.getCashCurrentAssignment(modalBranchId, Number(responsibleId))
      .then((r: any) => {
        const regId = r?.data?.registerId;
        if (!cancelled && regId && modalRegisters.some((x: any) => x.id === regId)) setRegisterChoice(String(regId));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [showCreateModal, modalBranchId, responsibleId, modalRegisters.length]);

  // Horarios de la caja elegida (o de la sucursal si no tiene cajas) y el que corresponde a esta hora
  useEffect(() => {
    const regId = registerChoice ? Number(registerChoice) : null;
    const list = allSchedules.filter((s) => (s.registerId ?? null) === regId);
    setModalSchedules(list);
    // El que corresponde a esta hora; si ninguno, el primero (con aviso), porque con horarios definidos no se abre sin uno
    setScheduleChoice(String(scheduleAt(list)?.id ?? list.find((x) => x.active)?.id ?? ''));
  }, [allSchedules, registerChoice]);

  // Responsables posibles según la sucursal elegida en el modal
  useEffect(() => {
    if (!showCreateModal || !modalBranchId) { setAssignableUsers([]); setModalSchedules([]); setModalRegisters([]); setAllSchedules([]); setModalMetaLoaded(false); return; }
    setModalMetaLoaded(false);
    Promise.all([APIs.getCashRegisters(modalBranchId), APIs.getCashSchedules(modalBranchId)])
      .then(([regRes, schRes]: any[]) => {
        const regs = (Array.isArray(regRes?.data) ? regRes.data : []).filter((r: any) => r.active);
        setModalRegisters(regs);
        setAllSchedules(Array.isArray(schRes?.data) ? schRes.data : []);
        // Por defecto la primera caja libre (sin turno abierto)
        setRegisterChoice((prev) => (regs.some((r: any) => String(r.id) === prev) ? prev : String((regs.find((r: any) => !r.shifts?.length) ?? regs[0])?.id ?? '')));
      })
      .catch(() => { setModalRegisters([]); setAllSchedules([]); })
      .finally(() => setModalMetaLoaded(true));
    let cancelled = false;
    APIs.getCashAssignableUsers(modalBranchId)
      .then((res: any) => {
        if (cancelled) return;
        const list = res?.data ?? [];
        setAssignableUsers(list);
        setResponsibleId((prev) => (list.some((u: any) => String(u.id) === prev) ? prev : String(list.find((u: any) => u.id === userId)?.id ?? list[0]?.id ?? '')));
      })
      .catch(() => { if (!cancelled) setAssignableUsers([]); });
    return () => { cancelled = true; };
  }, [showCreateModal, modalBranchId]);

  // Empresa y sucursal a las que pertenece lo que se está creando (turno u horario)
  const renderPlacePicker = () => (
    <>
                  {/* El turno siempre pertenece a una empresa y sucursal */}
                  {companies.length > 1 ? (
                    <div>
                      <label className='label__general'>Empresa</label>
                      <select
                        className='inputs__general'
                        value={modalCompanyId ?? ''}
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          setModalCompanyId(id);
                          loadModalBranches(id);
                        }}
                        disabled={isSubmitting}
                      >
                        {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  ) : null}
                  {branchesLoading ? (
                    <div role='status' aria-label='Cargando sucursales'>
                      <label className='label__general'>Sucursal</label>
                      <span className='table-skeleton__shimmer cash-shifts_modal__skeleton' />
                    </div>
                  ) : branches.length > 1 ? (
                    <div>
                      <label className='label__general'>Sucursal</label>
                      <select
                        className='inputs__general'
                        value={modalBranchId ?? ''}
                        onChange={(e) => setModalBranchId(Number(e.target.value))}
                        disabled={isSubmitting}
                      >
                        {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className='cash-shifts_modal__place'>
                      <span className='material-symbols-rounded'>storefront</span>
                      <div>
                        <strong>{branches[0]?.name ?? 'Sin sucursal'}</strong>
                        <span>{companies.find((c) => c.id === modalCompanyId)?.name ?? ''}</span>
                      </div>
                    </div>
                  )}
    </>
  );

  const branchError = !modalBranchId ? 'Selecciona la sucursal donde se abrirá el turno' : '';

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (amountError || branchError) return;
    try {
      setIsSubmitting(true);
      const response: any = await APIs.openCashShift({
        branchId: modalBranchId,
        userId: responsibleId ? Number(responsibleId) : userId,
        scheduleId: scheduleChoice ? Number(scheduleChoice) : 0,
        registerId: registerChoice ? Number(registerChoice) : undefined,
        openingAmount: amountNumber.toFixed(2),
      });
      if (response?.status === 'success') {
        setShowCreateModal(false);
        // Si se abrió en otra sucursal, la lista pasa a mostrar esa sucursal (el efecto recarga)
        if (modalBranchId !== branchId) setBranchId(modalBranchId as number);
        else await fetchShifts();
      } else {
        Swal.fire({ icon: 'warning', title: 'No se pudo abrir el turno', text: response?.message });
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error al abrir el turno', text: err?.response?.data?.message || err?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Relevo: transfiere el turno abierto a otro usuario autorizado ──
  const openHandover = async (shiftId: number) => {
    setHandoverUserId('');
    setTouched(false);
    setHandoverUsers([]);
    setHandoverShiftId(shiftId);
    setHandoverLoading(true);
    try {
      const res: any = await APIs.getCashHandoverCandidates(shiftId);
      setHandoverUsers(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setHandoverUsers([]);
    } finally {
      setHandoverLoading(false);
    }
  };

  const editShift = async (shift: any) => {
    // Cajas y horarios de la sucursal del turno, para ubicarlo (también turnos abiertos antes de que existieran)
    let regs: any[] = [];
    let schs: any[] = [];
    try {
      const [rr, sr]: any[] = await Promise.all([APIs.getCashRegisters(shift.branchId), APIs.getCashSchedules(shift.branchId)]);
      regs = (Array.isArray(rr?.data) ? rr.data : []).filter((x: any) => x.active);
      schs = (Array.isArray(sr?.data) ? sr.data : []).filter((x: any) => x.active);
    } catch { /* sin cajas ni horarios: solo se edita el fondo */ }
    const esc = (t: string) => String(t).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
    const regOptions = `<option value="">Sin caja</option>` + regs.map((x) => `<option value="${x.id}" ${x.id === shift.registerId ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
    const r = await Swal.fire({
      title: `Editar turno #${shift.id}`,
      html: `
        <div style="text-align:left;display:grid;gap:10px">
          <label>Fondo inicial<input id="sw-amount" class="swal2-input" type="number" min="0" step="0.01" value="${Number(shift.openingAmount ?? 0)}" style="margin:4px 0 0;width:100%"></label>
          ${regs.length ? `<label>Caja<select id="sw-reg" class="swal2-select" style="margin:4px 0 0;width:100%">${regOptions}</select></label>` : ''}
          ${regs.length || schs.length ? `<label>Turno programado<select id="sw-sch" class="swal2-select" style="margin:4px 0 0;width:100%"></select></label>` : ''}
        </div>`,
      didOpen: () => {
        const regSel = document.getElementById('sw-reg') as HTMLSelectElement | null;
        const schSel = document.getElementById('sw-sch') as HTMLSelectElement | null;
        if (!schSel) return;
        const fill = () => {
          // Sin cajas en la sucursal, los horarios son de la sucursal (sin caja)
          const regId = regSel ? (regSel.value ? Number(regSel.value) : null) : null;
          const list = schs.filter((x) => (x.registerId ?? null) === regId);
          schSel.innerHTML = `<option value="">Sin horario</option>` + list.map((x) => `<option value="${x.id}" ${x.id === shift.scheduleId ? 'selected' : ''}>${esc(x.name)} · ${fmtRange(x.startTime, x.endTime)}</option>`).join('');
        };
        regSel?.addEventListener('change', fill);
        fill();
      },
      preConfirm: () => {
        const amount = Number((document.getElementById('sw-amount') as HTMLInputElement)?.value);
        if (!Number.isFinite(amount) || amount < 0) { Swal.showValidationMessage('El fondo inicial no es válido'); return false; }
        const reg = (document.getElementById('sw-reg') as HTMLSelectElement | null)?.value;
        const sch = (document.getElementById('sw-sch') as HTMLSelectElement | null)?.value;
        return {
          openingAmount: amount,
          ...(regs.length ? { registerId: reg ? Number(reg) : null } : {}),
          ...(regs.length || schs.length ? { scheduleId: sch ? Number(sch) : null } : {}),
        };
      },
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
    });
    if (!r.isConfirmed || !r.value) return;
    try {
      const res: any = await APIs.updateCashShift(shift.id, r.value);
      if (res?.status !== 'success') throw new Error(res?.message);
      fetchShifts();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'No se pudo editar el turno', text: err?.response?.data?.message || err?.message });
    }
  };

  const deleteShift = async (shift: any) => {
    const r = await Swal.fire({
      icon: 'warning',
      title: `¿Eliminar el turno #${shift.id}?`,
      text: 'Solo se puede eliminar si no tiene cobros ni movimientos. Quedará registrado en la auditoría.',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!r.isConfirmed) return;
    try {
      const res: any = await APIs.deleteCashShift(shift.id);
      if (res?.status !== 'success') throw new Error(res?.message);
      fetchShifts();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'No se pudo eliminar el turno', text: err?.response?.data?.message || err?.message });
    }
  };

  const handleHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!handoverUserId || handoverShiftId == null) return;
    try {
      setIsSubmitting(true);
      const res: any = await APIs.handoverCashShift(handoverShiftId, Number(handoverUserId));
      if (res?.status !== 'success') throw new Error(res?.message || 'No se pudo registrar el relevo');
      const nuevo = handoverUsers.find((u) => String(u.id) === handoverUserId);
      Swal.fire({ icon: 'success', title: 'Relevo registrado', text: `El turno #${handoverShiftId} ahora es de ${fullName(nuevo)}` });
      setHandoverShiftId(null);
      setHandoverUserId('');
      fetchShifts();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'No se pudo hacer el relevo', text: err?.response?.data?.message || err?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadge = (status: string) => (
    <span className={`cash-shifts__badge ${status === 'OPEN' ? 'cash-shifts__badge--open' : 'cash-shifts__badge--closed'}`}>
      {status === 'OPEN' ? 'Abierto' : status === 'CLOSED' ? 'Cerrado' : status}
    </span>
  );

  return (
    <div className='cash-shifts'>
      <div className='cash-shifts__container'>
        <div className='cash-shifts__header'>
          <div className='cash-shifts__header-left'>
          <CategoriesStorePicker branchId={branchId} onBranchIdChange={setBranchId} onCompanyIdChange={setPageCompanyId} />
          <div className='cash-shifts__tabs' role='tablist'>
            {([['active', 'Turnos activos'], ['history', 'Historial']] as [Tab, string][]).map(([key, label]) => (
              <button
                key={key}
                type='button'
                role='tab'
                aria-selected={activeTab === key}
                className={`cash-shifts__tab ${activeTab === key ? 'cash-shifts__tab--active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
          </div>
          <div className='cash-shifts__header-actions'>
            <button type='button' className='btn__general-secondary' onClick={() => navigate(`/auth/cash/${PrivateRoutes.CASH_CONFIG}`)}>
              Configuración de turnos
            </button>
            <button type='button' className='btn__general-primary' onClick={openCreate}>
              Abrir nuevo turno
            </button>
          </div>
        </div>

        {activeTab === 'active' && alerts.length > 0 && (
          <div className='cash-shifts__list' role='status'>
            {alerts.slice(0, 5).map((a, i) => (
              <div className='cash-shifts__scheduled' key={i}>
                <span className='cash-shifts__scheduled-icon material-symbols-rounded'>warning</span>
                <div className='cash-shifts__scheduled-text'>
                  <strong>{a.type === 'REGISTER_NOT_OPEN' ? `${a.registerName} sin turno abierto` : `${a.scheduleName} sin titular`}</strong>
                  <span>{a.type === 'REGISTER_NOT_OPEN' ? `Debió abrir el turno ${a.scheduleName} (${fmt12(a.startTime)})${a.primary ? ` · Titular: ${a.primary}` : ''}` : 'Asigna un cajero titular en Programación de turnos'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'active' && (
          <div className='cash-shifts__list'>
            <div className='cash-shifts__row cash-shifts__row--head cash-shifts__row--active'>
              <span>Turno</span>
              <span>Caja</span>
              <span>Responsable</span>
              <span>Horario programado</span>
              <span>Apertura</span>
              <span>Monto inicial</span>
              <span>Estado</span>
              <span className='cash-shifts__col-actions'>Acciones</span>
            </div>
            {loading ? (
              <TableSkeleton rowClassName='cash-shifts__row cash-shifts__row--active' cols={[{ width: '40%' }, { width: '60%' }, { avatar: true }, { width: '70%' }, { width: '70%' }, { width: '50%' }, { pill: true, width: '64px' }, { actions: 1 }]} />
            ) : activeShifts.length > 0 ? (
              activeShifts.map((shift) => (
                <div className={`cash-shifts__row cash-shifts__row--active ${shift.overdue ? 'cash-shifts__row--overdue' : ''}`} key={shift.id}>
                  <div className='cash-shifts__cell cash-shifts__cell--strong' data-label='Turno'>#{shift.id}</div>
                  <div className='cash-shifts__cell' data-label='Caja'>{shift.register?.name ?? '—'}</div>
                  <div className='cash-shifts__cell cash-shifts__cell--user' data-label='Responsable'>
                    <span className='cash-shifts__avatar'>{initial(shift.user)}</span>
                    <span>{fullName(shift.user)}</span>
                  </div>
                  <div className='cash-shifts__cell' data-label='Horario programado'>
                    {shift.schedule ? (
                      <>
                        <strong>{shift.schedule.name}</strong>
                        <small className='cash-shifts__sub'>{fmtRange(shift.schedule.startTime, shift.schedule.endTime)}</small>
                        {(() => {
                          const st = scheduleState(shift.scheduledEnd, clock);
                          return st ? (
                            <span className={`cash-shifts__pill cash-shifts__pill--${st}`}>
                              <span className='material-symbols-rounded'>{st === 'late' ? 'alarm_off' : 'schedule'}</span>
                              {STATE_TEXT[st]} · {remainingLabel(shift.scheduledEnd, clock)}
                            </span>
                          ) : null;
                        })()}
                      </>
                    ) : (
                      <span className='cash-shifts__cell--muted'>Sin horario programado</span>
                    )}
                  </div>
                  <div className='cash-shifts__cell cash-shifts__cell--muted' data-label='Apertura'>{dateTime(shift.openedAt)}</div>
                  <div className='cash-shifts__cell' data-label='Monto inicial'>{money(shift.openingAmount)}</div>
                  <div className='cash-shifts__cell' data-label='Estado'>
                    {statusBadge(shift.status)}
                    {shift.overdue && <span className='cash-shifts__badge cash-shifts__badge--closed' title='Ya pasó la hora de fin del turno programado. Cuenta el efectivo y cierra el turno en Cortes de Caja.'>Pendiente de cierre</span>}
                  </div>
                  <div className='cash-shifts__cell cash-shifts__col-actions'>
                    <button
                      type='button'
                      className='cash-shifts__icon-btn'
                      title='Relevo de responsable'
                      aria-label='Relevo de responsable'
                      onClick={() => openHandover(shift.id)}
                    >
                      <span className='material-symbols-rounded'>swap_horiz</span>
                    </button>
                    <button type='button' className={`cash-shifts__icon-btn ${shift.overdue ? 'cash-shifts__icon-btn--alert' : ''}`} title='Cerrar turno (corte de caja)' aria-label='Cerrar turno' onClick={() => navigate(`/auth/cash/${PrivateRoutes.CASH_CUTS}`)}>
                      <span className='material-symbols-rounded'>lock_clock</span>
                    </button>
                    <button type='button' className='cash-shifts__icon-btn' title='Editar caja, horario y fondo inicial' aria-label='Editar turno' onClick={() => editShift(shift)}>
                      <span className='material-symbols-rounded'>edit</span>
                    </button>
                    <button type='button' className='cash-shifts__icon-btn' title='Eliminar turno' aria-label='Eliminar turno' onClick={() => deleteShift(shift)}>
                      <span className='material-symbols-rounded'>delete</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className='cash-shifts__state'>
                <p>No hay turnos activos</p>
                <span>Abre uno con "Abrir nuevo turno"</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className='cash-shifts__list'>
            <div className='cash-shifts__row cash-shifts__row--head cash-shifts__row--history'>
              <span>Turno</span>
              <span>Cajero</span>
              <span>Apertura</span>
              <span>Cierre</span>
              <span>Fondo inicial</span>
              <span>Cierre final</span>
              <span>Estado</span>
            </div>
            {loading ? (
              <TableSkeleton rowClassName='cash-shifts__row cash-shifts__row--history' cols={[{ width: '40%' }, { width: '70%' }, { width: '70%' }, { width: '70%' }, { width: '50%' }, { width: '50%' }, { pill: true, width: '64px' }]} />
            ) : (
              historyShifts.map((shift) => (
                <div className='cash-shifts__row cash-shifts__row--history' key={shift.id}>
                  <div className='cash-shifts__cell cash-shifts__cell--strong' data-label='Turno'>#{shift.id}</div>
                  <div className='cash-shifts__cell' data-label='Cajero'>{fullName(shift.user)}</div>
                  <div className='cash-shifts__cell cash-shifts__cell--muted' data-label='Apertura'>{dateTime(shift.openedAt)}</div>
                  <div className='cash-shifts__cell cash-shifts__cell--muted' data-label='Cierre'>{dateTime(shift.closedAt)}</div>
                  <div className='cash-shifts__cell' data-label='Fondo inicial'>{money(shift.openingAmount)}</div>
                  <div className='cash-shifts__cell cash-shifts__cell--strong' data-label='Cierre final'>{money(shift.closingAmount)}</div>
                  <div className='cash-shifts__cell' data-label='Estado'>{statusBadge(shift.status)}</div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Modales en el <body>: encima del sidebar y el header */}
      {createPortal(
        <>
          <div className={`cash-shifts_modal__overlay ${showCreateModal ? 'active' : ''}`}>
            <div className={`cash-shifts_modal__popup ${showCreateModal ? 'active' : ''}`}>
              <div className='cash-shifts_modal__header'>
                <button type='button' className='cash-shifts_modal__close' onClick={() => setShowCreateModal(false)} aria-label='Cerrar'>
                  <span className='material-symbols-rounded'>close</span>
                </button>
                <p className='cash-shifts_modal__title'>Abrir nuevo turno</p>
              </div>
              <form onSubmit={handleCreateShift} noValidate>
                <div className='cash-shifts_modal__body'>
                  {renderPlacePicker()}
                  {touched && !branchesLoading && branchError && <small className='cash-shifts_modal__error'>{branchError}</small>}
                  <div>
                    <label className='label__general'>Responsable del turno</label>
                    <select className='inputs__general' value={responsibleId} onChange={(e) => setResponsibleId(e.target.value)} disabled={isSubmitting}>
                      {assignableUsers.map((u: any) => (
                        <option key={u.id} value={u.id}>{fullName(u)}{u.role?.name ? ` · ${u.role.name}` : ''}{u.id === userId ? ' (yo)' : ''}</option>
                      ))}
                    </select>
                    <small className='cash-shifts_modal__hint'>Quien inicie sesión sin turno asignado no podrá vender.</small>
                  </div>
                  {modalMetaLoaded && modalRegisters.length === 0 && (
                    <div className='cash-shifts_modal__note'>
                      <span className='material-symbols-rounded'>info</span>
                      <div>
                        <strong>Esta sucursal aún no tiene cajas</strong>
                        <span>El turno se abrirá a nivel sucursal. Para abrirlo en una caja y con horario, créalas en Caja &gt; Cajas y Caja &gt; Programación de turnos.</span>
                      </div>
                    </div>
                  )}
                  {modalMetaLoaded && modalRegisters.length > 0 && modalSchedules.length === 0 && (
                    <div className='cash-shifts_modal__note'>
                      <span className='material-symbols-rounded'>info</span>
                      <div>
                        <strong>Esta caja no tiene turnos programados</strong>
                        <span>El turno se abrirá sin horario. Créalos en Caja &gt; Programación de turnos.</span>
                      </div>
                    </div>
                  )}
                  {modalRegisters.length > 0 && (
                    <div>
                      <label className='label__general'>Caja</label>
                      <select className='inputs__general' value={registerChoice} onChange={(e) => setRegisterChoice(e.target.value)} disabled={isSubmitting}>
                        {modalRegisters.map((r: any) => (
                          <option key={r.id} value={r.id}>{r.name}{r.shifts?.length ? ' · con turno abierto' : ''}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {modalSchedules.length > 0 && (
                    <div>
                      <label className='label__general'>Turno programado</label>
                      <select className='inputs__general' value={scheduleChoice} onChange={(e) => setScheduleChoice(e.target.value)} disabled={isSubmitting}>
                        {modalSchedules.filter((s) => s.active).map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name} · {fmtRange(s.startTime, s.endTime)}</option>
                        ))}
                      </select>
                      {!scheduleAt(modalSchedules) && (
                        <small className='cash-shifts_modal__hint'>Ahora no hay un turno programado a esta hora. Solo un supervisor puede abrirlo fuera de su horario.</small>
                      )}
                    </div>
                  )}
                  <div>
                    <label className='label__general'>Monto de apertura</label>
                    <input
                      className='inputs__general'
                      type='number'
                      step='0.01'
                      min='0'
                      value={openingAmount}
                      onChange={(e) => setOpeningAmount(e.target.value)}
                      placeholder='0.00'
                      disabled={isSubmitting}
                    />
                    {touched && amountError && <small className='cash-shifts_modal__error'>{amountError}</small>}
                  </div>
                  <div className='cash-shifts_modal__actions'>
                    <button type='button' className='btn__general-secondary' onClick={() => setShowCreateModal(false)} disabled={isSubmitting}>Cancelar</button>
                    <button type='submit' className='btn__general-primary' disabled={isSubmitting || branchesLoading}>
                      {isSubmitting ? 'Abriendo...' : 'Abrir turno'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className={`cash-shifts_modal__overlay ${handoverShiftId != null ? 'active' : ''}`}>
            <div className={`cash-shifts_modal__popup ${handoverShiftId != null ? 'active' : ''}`}>
              <div className='cash-shifts_modal__header'>
                <button type='button' className='cash-shifts_modal__close' onClick={() => setHandoverShiftId(null)} aria-label='Cerrar'>
                  <span className='material-symbols-rounded'>close</span>
                </button>
                <p className='cash-shifts_modal__title'>Relevo de responsable</p>
              </div>
              <form onSubmit={handleHandover} noValidate>
                <div className='cash-shifts_modal__body'>
                  <p className='cash-shifts_modal__hint'>
                    Transfiere la responsabilidad del turno #{handoverShiftId} a otro empleado.
                  </p>
                  <div>
                    <label className='label__general'>Nuevo responsable</label>
                    <select className='inputs__general' value={handoverUserId} onChange={(e) => setHandoverUserId(e.target.value)} disabled={handoverLoading}>
                      <option value=''>{handoverLoading ? 'Cargando usuarios…' : handoverUsers.length ? 'Selecciona un usuario...' : 'No hay usuarios disponibles'}</option>
                      {handoverUsers.map((u: any) => (
                        <option key={u.id} value={u.id}>{fullName(u)}{u.role?.name ? ` · ${u.role.name}` : ''}</option>
                      ))}
                    </select>
                    {touched && !handoverUserId && <small className='cash-shifts_modal__error'>Selecciona al responsable</small>}
                  </div>
                  <div className='cash-shifts_modal__actions'>
                    <button type='button' className='btn__general-secondary' onClick={() => setHandoverShiftId(null)}>Cancelar</button>
                    <button type='submit' className='btn__general-primary' disabled={isSubmitting || handoverLoading}>Confirmar relevo</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
};

export default CashShifts;
