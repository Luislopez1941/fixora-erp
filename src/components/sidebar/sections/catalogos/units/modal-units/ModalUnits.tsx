import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './ModalUnits.css';
import { useDispatch, useSelector } from 'react-redux';
import { modal } from '../../../../../../redux/state/modals';
import APIs from '../../../../../../services/APIs';
import Swal from 'sweetalert2';
import BranchAvailabilityPicker from '../../shared/BranchAvailabilityPicker';
import { confirmImpact } from '../../shared/categoryAvailability';
import CategoriesStorePicker from '../../../catalogos/categories/CategoriesStorePicker';
import { readCategoryBranchId } from '../../../../../../constants/category';

interface ModalUnitsProps {
  selectedUnit?: any | null;
  onSaved?: () => void;
}

const LS_COMPANY = 'categories-picker-company-id';

const ModalUnits: React.FC<ModalUnitsProps> = ({ selectedUnit, onSaved }) => {
  const dispatch = useDispatch();
  const modalState = useSelector((state: any) => state.modals);

  const isOpen = modalState === 'units_modal' || modalState === 'units_modal_update';
  const isUpdate = modalState === 'units_modal_update';

  const [branchId, setBranchId] = useState(() => readCategoryBranchId());
  const [fields, setFields] = useState<any>({
    name: '',
    symbol: '',
    value: '1',
    predetermined: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [tab, setTab] = useState<'info' | 'company'>('info');
  // Sucursales donde está disponible la unidad (null = todas)
  const [unitBranchIds, setUnitBranchIds] = useState<number[] | null>(null);
  const [allBranches, setAllBranches] = useState<{ id: number; name: string }[]>([]);
  const [pickedCompanyId, setPickedCompanyId] = useState<number | null>(() => {
    const id = Number(localStorage.getItem('categories-picker-company-id'));
    return !Number.isNaN(id) && id > 0 ? id : null;
  });

  useEffect(() => {
    if (!isOpen) {
      setIsSaving(false);
      setTab('info');
      setUnitBranchIds(null);
      return;
    }

    if (isUpdate && selectedUnit) {
      setFields({
        name: selectedUnit.name ?? '',
        symbol: selectedUnit.symbol ?? '',
        value: String(selectedUnit.value ?? 1),
        predetermined: Boolean(selectedUnit.predetermined),
      });
      setUnitBranchIds(Array.isArray(selectedUnit.branchIds) && selectedUnit.branchIds.length > 0 ? selectedUnit.branchIds : null);
      if (selectedUnit.companyId) setPickedCompanyId(Number(selectedUnit.companyId));
      return;
    }

    if (modalState === 'units_modal') {
      setFields({
        name: '',
        symbol: '',
        value: '1',
        predetermined: false,
      });
      setBranchId(readCategoryBranchId());
    }
  }, [isOpen, isUpdate, selectedUnit, modalState]);

  const readCompanyId = (): number | null => {
    const id = Number(localStorage.getItem(LS_COMPANY));
    return !Number.isNaN(id) && id > 0 ? id : null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const parsedValue = Number(fields.value);
    const companyId = readCompanyId();

    if (!fields.name.trim() || !fields.symbol.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Ingresa el nombre y el símbolo de la unidad.',
      });
      return;
    }

    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Valor inválido',
        text: 'Ingresa un valor numérico mayor a 0.',
      });
      return;
    }

    if (!isUpdate && !companyId) {
      Swal.fire({
        icon: 'warning',
        title: 'Empresa requerida',
        text: 'Selecciona una empresa antes de crear la unidad.',
      });
      return;
    }

    // Al restringir la unidad: se avisa qué artículos dejarían de ofrecerse en las sucursales que se quitan
    if (isUpdate && selectedUnit?.id && allBranches.length > 0) {
      const before: number[] = Array.isArray(selectedUnit.branchIds) && selectedUnit.branchIds.length > 0 ? selectedUnit.branchIds : allBranches.map((b) => b.id);
      const after: number[] = unitBranchIds ?? allBranches.map((b) => b.id);
      const removed = before.filter((b) => !after.includes(b));
      if (removed.length > 0) {
        try {
          const impacts = [];
          for (const bid of removed) {
            const imp: any = await APIs.getUnitRestrictionImpact(selectedUnit.id, bid);
            impacts.push({ branchName: allBranches.find((b) => b.id === bid)?.name ?? `Sucursal ${bid}`, count: Number(imp?.count ?? 0), sample: (imp?.sample ?? []).map((i: any) => i.name) });
          }
          if (!(await confirmImpact(impacts, 'Al restringir esta unidad, los artículos que la usan como unidad base:'))) return;
        } catch {
          /* si no se puede calcular el impacto, se continúa */
        }
      }
    }

    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: fields.name.trim(),
        symbol: fields.symbol.trim(),
        value: parsedValue,
        predetermined: Boolean(fields.predetermined),
      };

      // La unidad es de la EMPRESA; branchIds restringe las sucursales (null = todas). Las conversiones van por producto.
      payload.branchIds = unitBranchIds ?? [];
      const response: any =
        isUpdate && selectedUnit?.id
          ? await APIs.updateUnit(selectedUnit.id, payload)
          : await APIs.createUnits({
              ...payload,
              companyId,
            });

      Swal.fire({
        icon: 'success',
        title: isUpdate ? 'Unidad actualizada' : 'Unidad creada',
        text: response.message ?? 'Los cambios se guardaron correctamente.',
      });

      dispatch(modal(''));
      onSaved?.();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: isUpdate ? 'Error al actualizar unidad' : 'Error al crear unidad',
        text: 'Hubo un problema al guardar la unidad. Inténtalo de nuevo.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalChange = () => {
    if (isSaving) return;
    dispatch(modal(''));
  };

  // Portal al <body>: encima del sidebar y el header.
  return createPortal(
    <div className={`modal-units-overlay ${isOpen ? 'active' : ''}`}>
      <div className={`modal-units-content ${isOpen ? 'active' : ''}`}>
        <div className='modal-units-header'>
          <button className='modal-units-close' onClick={handleModalChange} aria-label="Close">
            <svg className='svg__close' xmlns='http://www.w3.org/2000/svg' height='16' width='12' viewBox='0 0 384 512'>
              <path d='M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z' />
            </svg>
          </button>
          <h2>{isUpdate ? 'Editar unidad' : 'Crear nueva unidad'}</h2>
        </div>
        <div className='modal-units-tabs' role='tablist'>
          <button type='button' role='tab' aria-selected={tab === 'info'} className={`modal-units-tab ${tab === 'info' ? 'modal-units-tab--active' : ''}`} onClick={() => setTab('info')}>
            Información
          </button>
          <button type='button' role='tab' aria-selected={tab === 'company'} className={`modal-units-tab ${tab === 'company' ? 'modal-units-tab--active' : ''}`} onClick={() => setTab('company')}>
            Empresa y sucursales
          </button>
        </div>
        <div className='modal-units-body'>
          <form className={`units_modal ${isSaving ? 'units_modal--saving' : ''}`} onSubmit={handleSubmit}>
            <div className='modal-units-container'>
              <div className='modal-units-tabpane' hidden={tab !== 'info'}>
              <div className='modal-units-row'>
                <div className='modal-units-field'>
                  <label className='modal-units-label'>Nombre</label>
                  <input
                    className='inputs__general'
                    value={fields.name}
                    onChange={(e) => setFields({ ...fields, name: e.target.value })}
                    placeholder='Nombre'
                    type='text'
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className='modal-units-field'>
                  <label className='modal-units-label'>Símbolo de unidad</label>
                  <input
                    className='inputs__general'
                    value={fields.symbol}
                    onChange={(e) => setFields({ ...fields, symbol: e.target.value })}
                    placeholder='Símbolo'
                    type='text'
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className='modal-units-field'>
                  <label className='modal-units-label'>Valor</label>
                  <input
                    className='inputs__general'
                    value={fields.value}
                    onChange={(e) => setFields({ ...fields, value: e.target.value })}
                    placeholder='1'
                    type='number'
                    min='0.0001'
                    step='any'
                    required
                    disabled={isSaving}
                  />
                </div>
              </div>
              <div className='modal-units-status-group'>
                <div className='modal-units-field'>
                  <label className='modal-units-label'>Predeterminado</label>
                  <div className='modal-units-switch-wrap'>
                    <label className='switch'>
                      <input
                        type='checkbox'
                        checked={Boolean(fields.predetermined)}
                        disabled={isSaving}
                        onChange={(e) =>
                          setFields((prev: any) => ({
                            ...prev,
                            predetermined: e.target.checked,
                          }))
                        }
                      />
                      <span className='slider'></span>
                    </label>
                    <p className='modal-units-switch-hint'>
                      {fields.predetermined ? 'Esta unidad será la predeterminada' : 'No es la predeterminada'}
                    </p>
                  </div>
                </div>
              </div>
              </div>
              <div className='modal-units-tabpane' hidden={tab !== 'company'}>
              <div className={`modal-units-row ${isUpdate ? 'units_modal__field--locked' : ''}`}>
                <div className='modal-units-field'>
                  <label className='modal-units-label'>Empresa</label>
                  <div className='modal-units-store-picker'>
                    <CategoriesStorePicker
                      variant='modal'
                      companyOnly
                      onCompanyIdChange={(id) => setPickedCompanyId(id)}
                      branchId={branchId}
                      onBranchIdChange={(id) => {
                        if (isUpdate || isSaving) return;
                        setBranchId(id);
                        localStorage.setItem('categories-store-id', String(id));
                      }}
                    />
                  </div>
                </div>
              </div>
                <BranchAvailabilityPicker companyId={pickedCompanyId} value={unitBranchIds} onChange={setUnitBranchIds} onBranchesLoaded={(_ids, list) => setAllBranches(list)} title='Disponible en sucursales' hint='Las conversiones (por ejemplo, 1 caja = 12 piezas) se definen en cada artículo.' />
              </div>
              <div className='modal-units-actions'>
                <button type='button' className='btn-cancel' onClick={handleModalChange} disabled={isSaving}>
                  Cancelar
                </button>
                <button className='btn-submit' type='submit' disabled={isSaving}>
                  {isSaving ? 'Guardando...' : isUpdate ? 'Guardar cambios' : 'Crear unidad'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalUnits;
