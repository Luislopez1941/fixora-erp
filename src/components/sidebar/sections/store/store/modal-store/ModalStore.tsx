import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './ModalStore.css';
import { useDispatch, useSelector } from 'react-redux';
import { modal } from '../../../../../../redux/state/modals';
import APIs from '../../../../../../services/APIs';
import Swal from 'sweetalert2';
import CategoriesStorePicker from '../../../catalogos/categories/CategoriesStorePicker';
import { readCategoryBranchId } from '../../../../../../constants/category';

interface ModalStoreProps {
  selectedWarehouse?: any | null;
  onSaved?: () => void;
}

const LS_COMPANY = 'categories-picker-company-id';

const ModalStore: React.FC<ModalStoreProps> = ({ selectedWarehouse, onSaved }) => {
  const dispatch = useDispatch();
  const modalState = useSelector((state: any) => state.modals);

  const isOpen = modalState === 'store_modal' || modalState === 'store_modal_update';
  const isUpdate = modalState === 'store_modal_update';
  const [branchId, setBranchId] = useState(() => readCategoryBranchId());
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsSaving(false);
      setName('');
      return;
    }

    if (isUpdate && selectedWarehouse) {
      setName(selectedWarehouse.name ?? '');
      const whBranchId = Number(selectedWarehouse.branchId);
      setBranchId(!Number.isNaN(whBranchId) && whBranchId >= 0 ? whBranchId : readCategoryBranchId());
      return;
    }

    if (modalState === 'store_modal') {
      setName('');
      setBranchId(readCategoryBranchId());
    }
  }, [isOpen, isUpdate, selectedWarehouse, modalState]);

  const readCompanyId = (): number | null => {
    const id = Number(localStorage.getItem(LS_COMPANY));
    return !Number.isNaN(id) && id > 0 ? id : null;
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const companyId = readCompanyId();
    if (!name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre requerido',
        text: 'Ingresa el nombre del almacén.',
      });
      return;
    }

    if (!isUpdate && !companyId) {
      Swal.fire({
        icon: 'warning',
        title: 'Empresa requerida',
        text: 'Selecciona una empresa antes de crear el almacén.',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isUpdate && selectedWarehouse?.id) {
        const result: any = await APIs.updateWarehouse(selectedWarehouse.id, {
          name: name.trim(),
        });
        Swal.fire({
          icon: 'success',
          title: 'Almacén actualizado',
          text: result.message ?? 'Los cambios se guardaron correctamente.',
        });
      } else {
        // Un almacén pertenece a UNA sucursal: sin sucursal no se puede crear
        if (!(branchId > 0)) {
          setIsSaving(false);
          Swal.fire({ icon: 'warning', title: 'Sucursal requerida', text: 'Elige la sucursal a la que pertenece el almacén.' });
          return;
        }

        const payload: Record<string, string> = {
          name: name.trim(),
          companyId: String(companyId),
          branchId: String(branchId),
        };

        const result: any = await APIs.createWarehouses(payload);

        Swal.fire({
          icon: 'success',
          title: 'Almacén creado',
          text: result.message ?? 'El almacén se creó correctamente.',
        });
      }

      dispatch(modal(''));
      setName('');
      window.dispatchEvent(new CustomEvent('warehouse-updated'));
      onSaved?.();
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Hubo un problema al guardar el almacén. Inténtalo de nuevo.';
      Swal.fire({
        icon: 'error',
        title: isUpdate ? 'Error al actualizar el almacén' : 'Error al crear el almacén',
        text: errorMessage,
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
    <div className={`overlay__store_modal ${isOpen ? 'active' : ''}`}>
      <div className={`popup__store_modal ${isOpen ? 'active' : ''}`}>
        <div className='header__modal'>
          <a href='#' className='btn-cerrar-popup__store_modal' onClick={handleModalChange}>
            <svg className='svg__close' xmlns='http://www.w3.org/2000/svg' height='16' width='12' viewBox='0 0 384 512'>
              <path d='M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z' />
            </svg>
          </a>
          <p className='title__modals'>{isUpdate ? 'Editar almacén' : 'Nuevo almacén'}</p>
        </div>
        <form className={`store_modal ${isSaving ? 'store_modal--saving' : ''}`} onSubmit={handleSubmit}>
          <div className='store_modal_container'>
            <div className={`store_modal__stores ${isUpdate ? 'store_modal__field--locked' : ''}`}>
              <div className='store-store-picker'>
                <div className='store-store-picker__row'>
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
            <div className='store_modal__field'>
              <label className='label__general'>Nombre del almacén</label>
              <input
                className='inputs__general'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Nombre del almacén'
                type='text'
                required
                disabled={isSaving}
              />
            </div>
            <div className='store_modal__actions'>
              <button className='btn__general-primary' type='submit' disabled={isSaving}>
                {isSaving ? 'Guardando...' : isUpdate ? 'Guardar cambios' : 'Crear almacén'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ModalStore;
