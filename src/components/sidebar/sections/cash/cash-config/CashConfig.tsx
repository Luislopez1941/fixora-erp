import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import APIs from '../../../../services/APIs';
import IOSSwitch from '../catalogos/shared/IOSSwitch';
import CategoriesStorePicker from '../catalogos/categories/CategoriesStorePicker';
import './CashConfig.css';

interface CashConfigForm {
  requireClosingAmount: boolean;
  autoCloseTime: string;
  maxParallelShifts: string;
  defaultOpeningAmount: string;
  allowNegativeBalance: boolean;
  autoOpenShift: boolean;
  requireShiftToSell: boolean;
  blockSalesAfterShiftEnd: boolean;
  shiftGraceMinutes: string;
  enforceShiftForAdmins: boolean;
  requireManagerApproval: boolean;
  differenceTolerance: string;
}

const DEFAULTS: CashConfigForm = {
  requireClosingAmount: true,
  autoCloseTime: '23:59',
  maxParallelShifts: '1',
  defaultOpeningAmount: '0',
  allowNegativeBalance: false,
  autoOpenShift: false,
  requireShiftToSell: true,
  blockSalesAfterShiftEnd: true,
  shiftGraceMinutes: '15',
  enforceShiftForAdmins: false,
  requireManagerApproval: false,
  differenceTolerance: '0',
};

const CashConfig = () => {
  const userState = useSelector((state: any) => state.user);
  // La configuración es por sucursal: se elige arriba (por defecto la de la sesión)
  const [branchId, setBranchId] = useState<number>(userState?.activeBranchId ?? userState?.branchId ?? 1);

  const [form, setForm] = useState<CashConfigForm>(DEFAULTS);
  const [saved, setSaved] = useState<CashConfigForm>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!branchId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const response: any = await APIs.getCashConfig(branchId);
        if (response?.status === 'success' && response.data) {
          const loaded: CashConfigForm = {
            requireClosingAmount: response.data.requireClosingAmount ?? DEFAULTS.requireClosingAmount,
            autoCloseTime: response.data.autoCloseTime ?? DEFAULTS.autoCloseTime,
            maxParallelShifts: String(response.data.maxParallelShifts ?? DEFAULTS.maxParallelShifts),
            defaultOpeningAmount: String(Number(response.data.defaultOpeningAmount ?? 0)),
            allowNegativeBalance: response.data.allowNegativeBalance ?? DEFAULTS.allowNegativeBalance,
            autoOpenShift: response.data.autoOpenShift ?? DEFAULTS.autoOpenShift,
            requireShiftToSell: response.data.requireShiftToSell ?? DEFAULTS.requireShiftToSell,
            blockSalesAfterShiftEnd: response.data.blockSalesAfterShiftEnd ?? DEFAULTS.blockSalesAfterShiftEnd,
            shiftGraceMinutes: String(response.data.shiftGraceMinutes ?? DEFAULTS.shiftGraceMinutes),
            enforceShiftForAdmins: response.data.enforceShiftForAdmins ?? DEFAULTS.enforceShiftForAdmins,
            requireManagerApproval: response.data.requireManagerApproval ?? DEFAULTS.requireManagerApproval,
            differenceTolerance: String(Number(response.data.differenceTolerance ?? 0)),
          };
          setForm(loaded);
          setSaved(loaded);
        } else {
          Swal.fire({ icon: 'warning', title: 'No se pudo cargar la configuración', text: response?.message });
        }
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'No se pudo cargar la configuración', text: err?.message });
      } finally {
        setLoading(false);
      }
    })();
  }, [branchId]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

  // Validaciones (se muestran bajo el campo al intentar guardar)
  const timeError = !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.autoCloseTime) ? 'Usa el formato de 24 horas (HH:mm)' : '';
  const max = Number(form.maxParallelShifts);
  const maxError = !Number.isInteger(max) || max < 1 ? 'Debe ser un entero mayor o igual a 1' : '';
  const isMoneyInvalid = (value: string) => value === '' || !Number.isFinite(Number(value)) || Number(value) < 0;
  const openingError = isMoneyInvalid(form.defaultOpeningAmount) ? 'Debe ser un monto mayor o igual a 0' : '';
  const toleranceError = isMoneyInvalid(form.differenceTolerance) ? 'Debe ser un monto mayor o igual a 0' : '';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!branchId) return;
    if (timeError || maxError || openingError || toleranceError) return;
    try {
      setIsSaving(true);
      const response: any = await APIs.updateCashConfig(branchId, {
        requireClosingAmount: form.requireClosingAmount,
        autoCloseTime: form.autoCloseTime,
        maxParallelShifts: max,
        defaultOpeningAmount: Number(form.defaultOpeningAmount),
        allowNegativeBalance: form.allowNegativeBalance,
        autoOpenShift: form.autoOpenShift,
        requireShiftToSell: form.requireShiftToSell,
        blockSalesAfterShiftEnd: form.blockSalesAfterShiftEnd,
        shiftGraceMinutes: Number(form.shiftGraceMinutes),
        enforceShiftForAdmins: form.enforceShiftForAdmins,
        requireManagerApproval: form.requireManagerApproval,
        differenceTolerance: Number(form.differenceTolerance),
      });
      if (response?.status === 'success') {
        setSaved(form);
        setTouched(false);
        Swal.fire({ icon: 'success', title: 'Configuración guardada' });
      } else {
        Swal.fire({ icon: 'warning', title: 'No se pudo guardar', text: response?.message });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: err?.response?.data?.message || err?.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const discard = () => {
    setForm(saved);
    setTouched(false);
  };

  return (
    <div className='cash-config'>
      <form className='cash-config__container' onSubmit={handleSave} noValidate>
        <div className='cash-config__header'>
          <div className='cash-config__lead-group'>
            <CategoriesStorePicker branchId={branchId} onBranchIdChange={setBranchId} />
            <p className='cash-config__lead'>
              {branchId ? 'Reglas de operación de la caja de esta sucursal.' : 'Selecciona una sucursal para configurar su caja.'}
            </p>
          </div>
          <div className='cash-config__header-actions'>
            {dirty && (
              <button type='button' className='btn__general-secondary' onClick={discard} disabled={isSaving}>
                Descartar
              </button>
            )}
            <button type='submit' className='btn__general-primary' disabled={isSaving || loading || !branchId}>
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        <section className='cash-config__panel'>
          <h3 className='cash-config__panel-title'>
            <span className='material-symbols-rounded'>calculate</span>
            Cierre y arqueo
          </h3>

          {loading ? (
            <div className='cash-config__skeleton' />
          ) : (
            <>
              <div className='cash-config__row'>
                <div className='cash-config__row-text'>
                  <strong>Obligar monto de cierre</strong>
                  <span>El cajero debe capturar el efectivo contado al cerrar el turno.</span>
                </div>
                <IOSSwitch
                  checked={form.requireClosingAmount}
                  onChange={(checked) => setForm({ ...form, requireClosingAmount: checked })}
                  ariaLabel='Obligar monto de cierre'
                />
              </div>
              <div className='cash-config__row'>
                <div className='cash-config__row-text'>
                  <strong>Tolerancia de diferencia</strong>
                  <span>Diferencia máxima (en pesos, hacia arriba o abajo) que se acepta sin aprobación al cerrar.</span>
                  {touched && toleranceError && <small className='cash-config__error'>{toleranceError}</small>}
                </div>
                <input
                  className='inputs__general cash-config__input'
                  type='number' 
                  min='0'
                  step='0.01'
                  value={form.differenceTolerance}
                  onChange={(e) => setForm({ ...form, differenceTolerance: e.target.value })}
                  aria-label='Tolerancia de diferencia'
                />
              </div>
              <div className='cash-config__row'>
                <div className='cash-config__row-text'>
                  <strong>Aprobación de gerente</strong>
                  <span>Un cierre fuera de la tolerancia solo se completa con el usuario y contraseña de un supervisor.</span>
                </div>
                <IOSSwitch
                  checked={form.requireManagerApproval}
                  onChange={(checked) => setForm({ ...form, requireManagerApproval: checked })}
                  ariaLabel='Aprobación de gerente'
                />
              </div>
              <div className='cash-config__row'>
                <div className='cash-config__row-text'>
                  <strong>Permitir saldo negativo</strong>
                  <span>Permite cerrar con faltante fuera de la tolerancia sin aprobación. Si está apagado, el cierre con faltante se bloquea.</span>
                </div>
                <IOSSwitch
                  checked={form.allowNegativeBalance}
                  onChange={(checked) => setForm({ ...form, allowNegativeBalance: checked })}
                  ariaLabel='Permitir saldo negativo'
                />
              </div>
              <div className='cash-config__row'>
                <div className='cash-config__row-text'>
                  <strong>Hora de cierre automático</strong>
                  <span>Hora de referencia para cerrar turnos abiertos. Hoy solo se guarda: el cierre automático aún no se ejecuta.</span>
                  {touched && timeError && <small className='cash-config__error'>{timeError}</small>}
                </div>
                <input
                  className='inputs__general cash-config__input'
                  type='time'
                  value={form.autoCloseTime}
                  onChange={(e) => setForm({ ...form, autoCloseTime: e.target.value })}
                  aria-label='Hora de cierre automático'
                />
              </div>
            </>
          )}
        </section>

        <section className='cash-config__panel'>
          <h3 className='cash-config__panel-title'>
            <span className='material-symbols-rounded'>schedule</span>
            Apertura de turnos
          </h3>

          {loading ? (
            <div className='cash-config__skeleton cash-config__skeleton--short' />
          ) : (
            <>
              <div className='cash-config__row'>
                <div className='cash-config__row-text'>
                  <strong>Fondo inicial predeterminado</strong>
                  <span>Monto con el que se propone abrir cada turno (se puede cambiar al abrir).</span>
                  {touched && openingError && <small className='cash-config__error'>{openingError}</small>}
                </div>
                <input
                  className='inputs__general cash-config__input'
                  type='number' 
                  min='0'
                  step='0.01'
                  value={form.defaultOpeningAmount}
                  onChange={(e) => setForm({ ...form, defaultOpeningAmount: e.target.value })}
                  aria-label='Fondo inicial predeterminado'
                />
              </div>
              <div className='cash-config__row'>
                <div className='cash-config__row-text'>
                  <strong>Exigir turno para vender</strong>
                  <span>Cajeros y roles operativos solo venden si tienen un turno abierto asignado a su usuario. Dueños y administradores están exentos.</span>
                </div>
                <IOSSwitch
                  checked={form.requireShiftToSell}
                  onChange={(checked) => setForm({ ...form, requireShiftToSell: checked })}
                  ariaLabel='Exigir turno para vender'
                />
              </div>
              <div className='cash-config__row'>
                <div className='cash-config__row-text'>
                  <strong>Aplicar también a dueños y administradores</strong>
                  <span>Por defecto ellos pueden vender sin turno. Actívalo para que también necesiten turno abierto y respeten el horario.</span>
                </div>
                <IOSSwitch
                  checked={form.enforceShiftForAdmins}
                  onChange={(checked) => setForm({ ...form, enforceShiftForAdmins: checked })}
                  ariaLabel='Aplicar también a dueños y administradores'
                />
              </div>
              <div className='cash-config__row'>
                <div className='cash-config__row-text'>
                  <strong>Bloquear ventas al terminar el turno</strong>
                  <span>Pasada la hora de fin del turno programado (más la tolerancia), el cajero debe cerrar su turno con el corte antes de seguir vendiendo.</span>
                </div>
                <IOSSwitch
                  checked={form.blockSalesAfterShiftEnd}
                  onChange={(checked) => setForm({ ...form, blockSalesAfterShiftEnd: checked })}
                  ariaLabel='Bloquear ventas al terminar el turno'
                />
              </div>
              <div className='cash-config__row'>
                <div className='cash-config__row-text'>
                  <strong>Tolerancia del turno (minutos)</strong>
                  <span>Minutos permitidos antes del inicio para abrir el turno y después del fin para terminar de cobrar.</span>
                </div>
                <input
                  className='inputs__general cash-config__input'
                  type='number'
                  min='0'
                  max='240'
                  step='1'
                  value={form.shiftGraceMinutes}
                  onChange={(e) => setForm({ ...form, shiftGraceMinutes: e.target.value })}
                  aria-label='Tolerancia del turno en minutos'
                />
              </div>
              <div className='cash-config__row'>
                <div className='cash-config__row-text'>
                  <strong>Apertura automática</strong>
                  <span>Si no hay turno abierto, el primer cobro en efectivo abre uno con el fondo predeterminado.</span>
                </div>
                <IOSSwitch
                  checked={form.autoOpenShift}
                  onChange={(checked) => setForm({ ...form, autoOpenShift: checked })}
                  ariaLabel='Apertura automática'
                />
              </div>
              <div className='cash-config__row'>
                <div className='cash-config__row-text'>
                  <strong>Límite de turnos paralelos</strong>
                  <span>Cuántos turnos pueden estar abiertos a la vez en la sucursal.</span>
                  {touched && maxError && <small className='cash-config__error'>{maxError}</small>}
                </div>
                <input
                  className='inputs__general cash-config__input'
                  type='number' 
                  min='1'
                  step='1'
                  value={form.maxParallelShifts}
                  onChange={(e) => setForm({ ...form, maxParallelShifts: e.target.value })}
                  aria-label='Límite de turnos paralelos'
                />
              </div>
            </>
          )}
        </section>

        <p className='cash-config__hint cash-config__hint--standalone'>
          Los métodos de pago aceptados se administran en Catálogos &gt; Métodos de pago.
        </p>
      </form>
    </div>
  );
};

export default CashConfig;
