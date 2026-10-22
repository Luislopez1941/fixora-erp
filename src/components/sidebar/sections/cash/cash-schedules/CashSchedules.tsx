import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import APIs from '../../../../services/APIs';
import TableSkeleton from '../../../general/skeleton/TableSkeleton';
import CategoriesStorePicker from '../catalogos/categories/CategoriesStorePicker';
import { fmtRange } from './timeFormat';
import './CashShifts.css';

const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const daysLabel = (days: number[]) => (days.length === 7 ? 'Todos los días' : days.map((d) => DAY_NAMES[d].slice(0, 3)).join(', '));
const EMPTY_SCHEDULE = { id: null as number | null, registerId: '' as string, primaryUserId: '' as string, backupUserIds: [] as number[], name: '', startTime: '08:00', endTime: '16:00', days: [0, 1, 2, 3, 4, 5, 6] };
const asList = (res: any): any[] => (Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []);

/** Programación de turnos: horarios de inicio y fin de cada turno por sucursal. */
const CashSchedules = () => {
  const userState = useSelector((state: any) => state.user);
  const userId = userState?.id ?? userState?._id;
  // Sucursal que se está viendo (el modal pide su propia sucursal al crear)
  const [branchId, setBranchId] = useState<number>(userState?.activeBranchId ?? userState?.branchId ?? 1);
  const [pageCompanyId, setPageCompanyId] = useState<number | null>(null);

  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<typeof EMPTY_SCHEDULE | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Empresa y sucursal a la que pertenecerá el horario nuevo
  const [companies, setCompanies] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [modalCompanyId, setModalCompanyId] = useState<number | null>(null);
  const [modalBranchId, setModalBranchId] = useState<number | null>(null);
  const [branchesLoading, setBranchesLoading] = useState(false);
  // Cajas de la sucursal del modal: los horarios (y sus traslapes) son por caja
  const [modalRegisters, setModalRegisters] = useState<any[]>([]);
  // Cajeros que pueden operar en la sucursal del modal (titular y suplentes)
  const [modalUsers, setModalUsers] = useState<any[]>([]);

  const fetchSchedules = async () => {
    if (!branchId) { setSchedules([]); setLoading(false); return; }
    try {
      setLoading(true);
      setSchedules(asList(await APIs.getCashSchedules(branchId)));
    } catch (err: any) {
      setSchedules([]);
      Swal.fire({ icon: 'error', title: 'No se pudieron cargar los turnos programados', text: err?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, [branchId]);

  useEffect(() => {
    if (!form || !modalBranchId) { setModalRegisters([]); return; }
    let cancelled = false;
    APIs.getCashRegisters(modalBranchId)
      .then((res: any) => {
        if (cancelled) return;
        const list = asList(res).filter((r) => r.active);
        setModalRegisters(list);
        // Sin cajas el horario es de la sucursal; con cajas se elige una (por defecto la primera)
        setForm((f) => (f ? { ...f, registerId: list.some((r) => String(r.id) === f.registerId) ? f.registerId : String(list[0]?.id ?? '') } : f));
      })
      .catch(() => { if (!cancelled) setModalRegisters([]); });
    return () => { cancelled = true; };
  }, [!!form, modalBranchId]);

  useEffect(() => {
    if (!form || !modalBranchId) { setModalUsers([]); return; }
    let cancelled = false;
    APIs.getCashAssignableUsers(modalBranchId)
      .then((res: any) => { if (!cancelled) setModalUsers(asList(res)); })
      .catch(() => { if (!cancelled) setModalUsers([]); });
    return () => { cancelled = true; };
  }, [!!form, modalBranchId]);

  const loadModalBranches = async (companyId: number, preferredBranchId?: number | null) => {
    setBranchesLoading(true);
    setModalBranchId(null);
    try {
      const list = asList(await APIs.getBranchOffices(companyId, userId));
      setBranches(list);
      setModalBranchId((list.find((b) => b.id === preferredBranchId) ?? list[0])?.id ?? null);
    } catch {
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

  const openForm = async (item?: any) => {
    setTouched(false);
    if (item) {
      // Al editar la sucursal es la del horario (no se mueve entre sucursales)
      setForm({ id: item.id, registerId: String(item.registerId ?? ''), primaryUserId: String(item.assignments?.find((a: any) => a.role === 'PRIMARY')?.userId ?? ''), backupUserIds: (item.assignments ?? []).filter((a: any) => a.role === 'BACKUP').map((a: any) => a.userId), name: item.name, startTime: item.startTime, endTime: item.endTime, days: item.days });
      setModalBranchId(item.branchId);
      setBranches([{ id: item.branchId, name: item.branch?.name ?? `Sucursal ${item.branchId}` }]);
      return;
    }
    setForm({ ...EMPTY_SCHEDULE });
    try {
      const list = asList(await APIs.getCompaniesByUser(userId));
      setCompanies(list);
      const initial = list.find((c) => c.id === (pageCompanyId ?? userState?.activeCompanyId ?? userState?.companyId)) ?? list[0];
      if (initial) {
        setModalCompanyId(initial.id);
        await loadModalBranches(initial.id, branchId);
      }
    } catch {
      setCompanies([]);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setTouched(true);
    if (!form.name.trim() || !form.days.length || !modalBranchId) return;
    if (modalRegisters.length > 0 && !form.registerId) return;
    try {
      setIsSubmitting(true);
      const payload = { registerId: form.registerId ? Number(form.registerId) : null, primaryUserId: form.primaryUserId ? Number(form.primaryUserId) : null, backupUserIds: form.backupUserIds, name: form.name.trim(), startTime: form.startTime, endTime: form.endTime, days: form.days };
      const res: any = form.id ? await APIs.updateCashSchedule(form.id, payload) : await APIs.createCashSchedule(modalBranchId, payload);
      if (res?.status !== 'success') throw new Error(res?.message);
      setForm(null);
      setTouched(false);
      // Si se creó en otra sucursal, la lista pasa a mostrarla (el efecto recarga)
      if (modalBranchId !== branchId) setBranchId(modalBranchId);
      else fetchSchedules();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'No se pudo guardar el turno programado', text: err?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async (s: any) => {
    const r = await Swal.fire({ icon: 'warning', title: `¿Eliminar "${s.name}"?`, text: 'Los turnos ya operados conservan su historial.', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' });
    if (!r.isConfirmed) return;
    try {
      await APIs.deleteCashSchedule(s.id);
      fetchSchedules();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: err?.message });
    }
  };

  return (
    <div className='cash-shifts'>
      <div className='cash-shifts__container'>
        <div className='cash-shifts__header'>
          <div className='cash-shifts__header-left'>
            <CategoriesStorePicker branchId={branchId} onBranchIdChange={setBranchId} onCompanyIdChange={setPageCompanyId} />
            <button type='button' className='cash-shifts__icon-btn' title='¿Cómo funciona?' aria-label='¿Cómo funciona?' onClick={() => setShowHelp(true)}>
              <span className='material-symbols-rounded'>help</span>
            </button>
          </div>
          <div className='cash-shifts__header-actions'>
            <button type='button' className='btn__general-primary' onClick={() => openForm()}>Nuevo turno programado</button>
          </div>
        </div>

        <div className='cash-shifts__list'>
          {loading ? (
            <TableSkeleton rowClassName='cash-shifts__scheduled' cols={[{ width: '36px' }, { width: '50%' }, { pill: true, width: '64px' }, { actions: 2 }]} />
          ) : schedules.length === 0 ? (
            <div className='cash-shifts__state'>
              <p>Aún no hay turnos programados</p>
              <span>Crea, por ejemplo, Matutino 08:00–16:00 y Vespertino 16:00–00:00</span>
            </div>
          ) : schedules.map((item) => (
            <div className='cash-shifts__scheduled' key={item.id}>
              <span className='cash-shifts__scheduled-icon material-symbols-rounded'>schedule</span>
              <div className='cash-shifts__scheduled-text'>
                <strong>{item.name} · {fmtRange(item.startTime, item.endTime)}</strong>
                <span>{item.register ? `Caja: ${item.register.name} · ` : ''}{daysLabel(item.days)}</span>
                <span>{(() => { const t = item.assignments?.find((a: any) => a.role === 'PRIMARY'); const b = (item.assignments ?? []).filter((a: any) => a.role === 'BACKUP'); const nm = (a: any) => [a.user?.firstName, a.user?.firstLastName].filter(Boolean).join(' '); return t ? `Titular: ${nm(t)}${b.length ? ` · Suplentes: ${b.map(nm).join(', ')}` : ''}` : 'Sin titular asignado'; })()}</span>
              </div>
              <span className={`cash-shifts__badge ${item.active ? 'cash-shifts__badge--open' : 'cash-shifts__badge--closed'}`}>{item.active ? 'Activo' : 'Inactivo'}</span>
              <button type='button' className='cash-shifts__icon-btn' title='Editar' aria-label='Editar' onClick={() => openForm(item)}>
                <span className='material-symbols-rounded'>edit</span>
              </button>
              <button type='button' className='cash-shifts__icon-btn' title='Eliminar' aria-label='Eliminar' onClick={() => remove(item)}>
                <span className='material-symbols-rounded'>delete</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {createPortal(
        <>
        <div className={`cash-shifts_modal__overlay ${showHelp ? 'active' : ''}`} onClick={() => setShowHelp(false)}>
          <div className={`cash-shifts_modal__popup ${showHelp ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className='cash-shifts_modal__header'>
              <button type='button' className='cash-shifts_modal__close' onClick={() => setShowHelp(false)} aria-label='Cerrar'>
                <span className='material-symbols-rounded'>close</span>
              </button>
              <h3 className='cash-shifts_modal__title'>¿Cómo funciona la programación de turnos?</h3>
            </div>
            <div className='cash-shifts_modal__body'>
              <ul className='cash-shifts_modal__help'>
                <li><strong>Qué es:</strong> defines los turnos de cada sucursal (por ejemplo Matutino 08:00–16:00 y Vespertino 16:00–00:00) con su hora de inicio, su hora de fin y los días en que aplican.</li>
                <li><strong>Medianoche:</strong> si la hora de fin es menor que la de inicio, el turno cruza la medianoche (16:00 a 00:00).</li>
                <li><strong>Cajeros:</strong> cada turno programado tiene un titular y, opcionalmente, suplentes. Solo ellos pueden abrir ese turno; un supervisor puede abrirlo a nombre de otro y queda auditado. Un titular no puede serlo de dos cajas a la misma hora. Sin titular, el turno aparece como alerta.</li>
                <li><strong>Por caja:</strong> si la sucursal tiene cajas, cada horario pertenece a una caja. Los turnos de una misma caja no pueden empalmarse en un mismo día, pero cajas distintas pueden usar las mismas horas. Las cajas se crean en Caja &gt; Cajas.</li>
                <li><strong>Al abrir un turno:</strong> en Caja &gt; Turnos el sistema propone el turno que corresponde a la hora actual. Puedes cambiarlo o abrir sin horario.</li>
                <li><strong>Pendiente de cierre:</strong> pasada la hora de fin, el turno abierto se marca como pendiente de cierre para que el supervisor haga el corte.</li>
                <li><strong>Relevo:</strong> al terminar un turno se cierra con su corte y se abre el siguiente a nombre de quien lo recibe.</li>
                <li><strong>Eliminar un horario:</strong> los turnos que ya operaron conservan su historial.</li>
                <li><strong>Hora del servidor:</strong> los horarios usan la hora del servidor.</li>
              </ul>
              <div className='cash-shifts_modal__actions'>
                <button type='button' className='btn__general-primary' onClick={() => setShowHelp(false)}>Entendido</button>
              </div>
            </div>
          </div>
        </div>
        <div className={`cash-shifts_modal__overlay ${form ? 'active' : ''}`}>
          <div className={`cash-shifts_modal__popup ${form ? 'active' : ''}`}>
            <div className='cash-shifts_modal__header'>
              <button type='button' className='cash-shifts_modal__close' onClick={() => setForm(null)} aria-label='Cerrar'>
                <span className='material-symbols-rounded'>close</span>
              </button>
              <h3 className='cash-shifts_modal__title'>{form?.id ? 'Editar turno programado' : 'Nuevo turno programado'}</h3>
            </div>
            {form && (
              <form onSubmit={save} noValidate>
                <div className='cash-shifts_modal__body'>
                  {form.id ? (
                    <div className='cash-shifts_modal__place'>
                      <span className='material-symbols-rounded'>storefront</span>
                      <div><strong>{branches[0]?.name ?? 'Sucursal'}</strong><span>El turno pertenece a esta sucursal</span></div>
                    </div>
                  ) : (
                    <>
                      {companies.length > 1 && (
                        <div>
                          <label className='label__general'>Empresa</label>
                          <select className='inputs__general' value={modalCompanyId ?? ''} disabled={isSubmitting}
                            onChange={(e) => { const id = Number(e.target.value); setModalCompanyId(id); loadModalBranches(id); }}>
                            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      )}
                      {branchesLoading ? (
                        <div role='status' aria-label='Cargando sucursales'>
                          <label className='label__general'>Sucursal</label>
                          <span className='table-skeleton__shimmer cash-shifts_modal__skeleton' />
                        </div>
                      ) : branches.length > 1 ? (
                        <div>
                          <label className='label__general'>Sucursal</label>
                          <select className='inputs__general' value={modalBranchId ?? ''} onChange={(e) => setModalBranchId(Number(e.target.value))} disabled={isSubmitting}>
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
                      {touched && !branchesLoading && !modalBranchId && <small className='cash-shifts_modal__error'>Selecciona la sucursal</small>}
                    </>
                  )}
                  {modalRegisters.length > 0 && (
                    <div>
                      <label className='label__general'>Caja</label>
                      <select className='inputs__general' value={form.registerId} onChange={(e) => setForm({ ...form, registerId: e.target.value })} disabled={isSubmitting || !!form.id}>
                        {modalRegisters.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                      <small className='cash-shifts_modal__hint'>Los turnos de una misma caja no pueden empalmarse; cajas distintas sí pueden usar las mismas horas.</small>
                    </div>
                  )}
                  <div>
                    <label className='label__general'>Cajero titular</label>
                    <select className='inputs__general' value={form.primaryUserId} onChange={(e) => setForm({ ...form, primaryUserId: e.target.value, backupUserIds: form.backupUserIds.filter((x) => String(x) !== e.target.value) })} disabled={isSubmitting}>
                      <option value=''>Sin titular</option>
                      {modalUsers.map((u: any) => <option key={u.id} value={u.id}>{[u.firstName, u.firstLastName].filter(Boolean).join(' ')}{u.role?.name ? ` · ${u.role.name}` : ''}</option>)}
                    </select>
                  </div>
                  {modalUsers.length > 1 && (
                    <div>
                      <label className='label__general'>Suplentes</label>
                      <div className='cash-shifts_modal__chips'>
                        {modalUsers.filter((u: any) => String(u.id) !== form.primaryUserId).map((u: any) => {
                          const on = form.backupUserIds.includes(u.id);
                          return (
                            <label key={u.id} className={`cash-shifts_modal__chip ${on ? 'is-on' : ''}`}>
                              <input type='checkbox' checked={on} disabled={isSubmitting}
                                onChange={(e) => setForm({ ...form, backupUserIds: e.target.checked ? [...form.backupUserIds, u.id] : form.backupUserIds.filter((x) => x !== u.id) })} />
                              <span className='material-symbols-rounded'>{on ? 'check_circle' : 'add_circle'}</span>
                              <span>{[u.firstName, u.firstLastName].filter(Boolean).join(' ')}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className='label__general'>Nombre</label>
                    <input className='inputs__general' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder='Matutino' disabled={isSubmitting} />
                    {touched && !form.name.trim() && <small className='cash-shifts_modal__error'>El nombre es obligatorio</small>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className='label__general'>Inicio</label>
                      <input className='inputs__general' type='time' value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} disabled={isSubmitting} />
                    </div>
                    <div>
                      <label className='label__general'>Fin</label>
                      <input className='inputs__general' type='time' value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} disabled={isSubmitting} />
                    </div>
                  </div>
                  <small className='cash-shifts_modal__hint'>Si el fin es menor que el inicio, el turno cruza la medianoche (16:00 a 00:00).</small>
                  <div>
                    <label className='label__general'>Días</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {DAY_LABELS.map((label, d) => {
                        const on = form.days.includes(d);
                        return (
                          <button key={d} type='button' title={DAY_NAMES[d]} aria-pressed={on}
                            className={on ? 'btn__general-primary' : 'btn__general-secondary'} style={{ minWidth: 36, padding: '6px 0' }}
                            onClick={() => setForm({ ...form, days: on ? form.days.filter((x) => x !== d) : [...form.days, d] })}>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {touched && !form.days.length && <small className='cash-shifts_modal__error'>Selecciona al menos un día</small>}
                  </div>
                  <div className='cash-shifts_modal__actions'>
                    <button type='button' className='btn__general-secondary' onClick={() => setForm(null)} disabled={isSubmitting}>Cancelar</button>
                    <button type='submit' className='btn__general-primary' disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar'}</button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
        </>,
        document.body,
      )}
    </div>
  );
};

export default CashSchedules;
