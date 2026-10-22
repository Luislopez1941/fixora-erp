import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import APIs from '../../../../../services/APIs';
import TableSkeleton from '../../../../general/skeleton/TableSkeleton';
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker';
import '../shared/CashShifts.css';

// El tipo de caja (principal, rápida, autoservicio, móvil) queda para más adelante: el servidor guarda 'MAIN' por defecto
const EMPTY = { id: null as number | null, name: '', active: true };
const asList = (res: any): any[] => (Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []);

/** Cajas de la sucursal: sobre ellas se abren turnos y se programan horarios. */
const CashRegisters = () => {
  const userState = useSelector((state: any) => state.user);
  const userId = userState?.id ?? userState?._id;
  const [branchId, setBranchId] = useState<number>(userState?.activeBranchId ?? userState?.branchId ?? 1);
  const [pageCompanyId, setPageCompanyId] = useState<number | null>(null);

  const [registers, setRegisters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Empresa y sucursal de la caja nueva
  const [companies, setCompanies] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [modalCompanyId, setModalCompanyId] = useState<number | null>(null);
  const [modalBranchId, setModalBranchId] = useState<number | null>(null);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const fetchRegisters = async () => {
    if (!branchId) { setRegisters([]); setLoading(false); return; }
    try {
      setLoading(true);
      setRegisters(asList(await APIs.getCashRegisters(branchId)));
    } catch (err: any) {
      setRegisters([]);
      Swal.fire({ icon: 'error', title: 'No se pudieron cargar las cajas', text: err?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRegisters(); }, [branchId]);

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
      setForm({ id: item.id, name: item.name, active: item.active });
      setModalBranchId(item.branchId);
      setBranches([{ id: item.branchId, name: 'Esta sucursal' }]);
      return;
    }
    setForm({ ...EMPTY });
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
    if (!form.name.trim() || !modalBranchId) return;
    try {
      setIsSubmitting(true);
      const payload = { name: form.name.trim(), active: form.active };
      const res: any = form.id ? await APIs.updateCashRegister(form.id, payload) : await APIs.createCashRegister(modalBranchId, payload);
      if (res?.status !== 'success') throw new Error(res?.message);
      setForm(null);
      setTouched(false);
      if (modalBranchId !== branchId) setBranchId(modalBranchId);
      else fetchRegisters();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'No se pudo guardar la caja', text: err?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async (r: any) => {
    const ok = await Swal.fire({ icon: 'warning', title: `¿Eliminar la caja "${r.name}"?`, text: 'También se eliminan sus turnos programados. Si ya tuvo turnos, desactívala en su lugar.', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' });
    if (!ok.isConfirmed) return;
    try {
      await APIs.deleteCashRegister(r.id);
      fetchRegisters();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: err?.message });
    }
  };

  const responsible = (r: any) => {
    const s = r.shifts?.[0];
    return s ? [s.user?.firstName, s.user?.firstLastName].filter(Boolean).join(' ') || 'Turno abierto' : null;
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
            <button type='button' className='btn__general-primary' onClick={() => openForm()}>Nueva caja</button>
          </div>
        </div>

        <div className='cash-shifts__list'>
          {loading ? (
            <TableSkeleton rowClassName='cash-shifts__scheduled' cols={[{ width: '36px' }, { width: '50%' }, { pill: true, width: '64px' }, { actions: 2 }]} />
          ) : registers.length === 0 ? (
            <div className='cash-shifts__state'>
              <p>Esta sucursal aún no tiene cajas</p>
              <span>Sin cajas, los turnos se abren a nivel sucursal. Crea una para programar turnos por caja.</span>
            </div>
          ) : registers.map((r) => (
            <div className='cash-shifts__scheduled' key={r.id}>
              <span className='cash-shifts__scheduled-icon material-symbols-rounded'>point_of_sale</span>
              <div className='cash-shifts__scheduled-text'>
                <strong>{r.name}</strong>
                <span>
                  {responsible(r) ? `Turno abierto: ${responsible(r)}` : 'Sin turno abierto'} · {r._count?.schedules ?? 0} turno(s) programado(s)
                </span>
              </div>
              <span className={`cash-shifts__badge ${r.active ? 'cash-shifts__badge--open' : 'cash-shifts__badge--closed'}`}>{r.active ? 'Activa' : 'Inactiva'}</span>
              <button type='button' className='cash-shifts__icon-btn' title='Editar' aria-label='Editar' onClick={() => openForm({ ...r, branchId })}>
                <span className='material-symbols-rounded'>edit</span>
              </button>
              <button type='button' className='cash-shifts__icon-btn' title='Eliminar' aria-label='Eliminar' onClick={() => remove(r)}>
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
                <h3 className='cash-shifts_modal__title'>¿Cómo funcionan las cajas?</h3>
              </div>
              <div className='cash-shifts_modal__body'>
                <ul className='cash-shifts_modal__help'>
                  <li><strong>Qué es una caja:</strong> un punto de cobro de la sucursal (Caja 1, Caja 2, Express…). Cada sucursal puede tener varias.</li>
                  <li><strong>Un turno por caja:</strong> si la sucursal tiene cajas, cada turno se abre en una caja y una caja solo admite un turno abierto a la vez. Dos cajas sí pueden operar al mismo tiempo.</li>
                  <li><strong>Horarios por caja:</strong> en Programación de turnos eliges la caja de cada horario. El sistema valida que los turnos de una misma caja no se empalmen; cajas distintas pueden usar las mismas horas.</li>
                  <li><strong>Abrir un turno:</strong> en Turnos eliges la caja y el sistema propone el turno programado que corresponde a esa caja y a la hora.</li>
                  <li><strong>Sin cajas:</strong> si la sucursal no tiene cajas todo funciona como antes, con turnos a nivel sucursal.</li>
                  <li><strong>Desactivar o eliminar:</strong> una caja con historial de turnos solo se puede desactivar. Si no tiene historial se puede eliminar, y se van sus horarios.</li>
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
                <h3 className='cash-shifts_modal__title'>{form?.id ? 'Editar caja' : 'Nueva caja'}</h3>
              </div>
              {form && (
                <form onSubmit={save} noValidate>
                  <div className='cash-shifts_modal__body'>
                    {form.id ? null : (
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
                    <div>
                      <label className='label__general'>Nombre</label>
                      <input className='inputs__general' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder='Caja 1' disabled={isSubmitting} />
                      {touched && !form.name.trim() && <small className='cash-shifts_modal__error'>El nombre es obligatorio</small>}
                    </div>
                    {form.id && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type='checkbox' checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} disabled={isSubmitting} />
                        <span>Caja activa</span>
                      </label>
                    )}
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

export default CashRegisters;
