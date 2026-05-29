import React, { useEffect, useState } from 'react';
import './ModalUnits.css';
import { useDispatch, useSelector } from 'react-redux';
import { modal } from '../../../../../../redux/state/modals';
import APIs from '../../../../../../services/APIs';
import Swal from 'sweetalert2';
import CategoriesStorePicker from '../../../categories/CategoriesStorePicker';
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

  useEffect(() => {
    if (!isOpen) {
      setIsSaving(false);
      return;
    }

    if (isUpdate && selectedUnit) {
      setFields({
        name: selectedUnit.name ?? '',
        symbol: selectedUnit.symbol ?? '',
        value: String(selectedUnit.value ?? 1),
        predetermined: Boolean(selectedUnit.predetermined),
      });
      const unitBranchId = Number(selectedUnit.branchId);
      setBranchId(!Number.isNaN(unitBranchId) && unitBranchId >= 0 ? unitBranchId : readCategoryBranchId());
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

    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: fields.name.trim(),
        symbol: fields.symbol.trim(),
        value: parsedValue,
        predetermined: Boolean(fields.predetermined),
      };

      const bid = Number(branchId);
      if (!Number.isNaN(bid) && bid >= 1) {
        payload.branchId = bid;
      }

      const response: any =
        isUpdate && selectedUnit?.id
          ? await APIs.updateUnit(selectedUnit.id, payload)
          : await APIs.cresteUnits({
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

  return (
    <div className={`overlay__units_modal ${isOpen ? 'active' : ''}`}>
      <div className={`popup__units_modal ${isOpen ? 'active' : ''}`}>
        <div className='header__modal'>
          <a href='#' className='btn-cerrar-popup__units_modal' onClick={handleModalChange}>
            <svg className='svg__close' xmlns='http://www.w3.org/2000/svg' height='16' width='12' viewBox='0 0 384 512'>
              <path d='M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z' />
            </svg>
          </a>
          <p className='title__modals'>{isUpdate ? 'Editar unidad' : 'Crear nueva unidad'}</p>
        </div>
        <form className={`units_modal ${isSaving ? 'units_modal--saving' : ''}`} onSubmit={handleSubmit}>
          <div className='units_modal_container'>
            <div className={`row__one ${isUpdate ? 'units_modal__field--locked' : ''}`}>
              <div className='units-store-picker'>
                <div className='units-store-picker__row'>
                  <CategoriesStorePicker
                    variant='modal'
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
            <div className='row__two'>
              <div>
                <label className='label__general'>Nombre</label>
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
              <div>
                <label className='label__general'>Símbolo de unidad</label>
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
              <div>
                <label className='label__general'>Valor</label>
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
            <div className='row__predetermined'>
              <div className='units_modal__switch-wrap'>
                <label className='label__general'>Predeterminado</label>
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
                <p className='units_modal__switch-hint'>
                  {fields.predetermined ? 'Esta unidad será la predeterminada' : 'No es la predeterminada'}
                </p>
              </div>
            </div>
            <div className='row__three'>
              <div>
                <button className='btn__general-primary' type='submit' disabled={isSaving}>
                  {isSaving ? 'Guardando...' : isUpdate ? 'Guardar cambios' : 'Crear unidad'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalUnits;
