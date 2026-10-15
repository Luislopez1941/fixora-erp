import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './ModalCompanies.css';
import { useDispatch, useSelector } from "react-redux";
import { modal } from '../../../../../../redux/state/modals';
import { useDropzone } from 'react-dropzone';
import APIs from '../../../../../../services/APIs';
import { setCompanies } from '../../../../../../redux/state/Configurations/Companies';
import Swal from 'sweetalert2';

const EMPTY_FIELDS = { name: '', businessName: '', taxId: '' };

const ModalCompanies = () => {
  const dispatch = useDispatch();
  const modalState = useSelector((state: any) => state.modals);
  const userState = useSelector((store: any) => store.user);

  const [fields, setFields] = useState<any>(EMPTY_FIELDS);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  const handleModalChange = (value: any) => {
    dispatch(modal(value));
    if (!value) {
      setFields(EMPTY_FIELDS);
      setPreview(null);
    }
  };

  const canSave = !!fields.name.trim() && !!fields.businessName.trim() && !saving;

  const createCompanies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      const response: any = await APIs.createCompanies({
        name: fields.name.trim(),
        businessName: fields.businessName.trim(),
        // El RFC es opcional: vacío no se manda (el campo es único en la base)
        taxId: fields.taxId.trim() || undefined,
        user_id: userState.id,
      });

      Swal.fire({
        icon: 'success',
        title: 'Empresa creada',
        text: response.message,
      });

      const result: any = await APIs.getCompanies(userState.id);
      dispatch(setCompanies(result.data));
      handleModalChange('');
    } catch (error: any) {
      console.error(error);

      // Si el backend manda un mensaje claro (ej. límite de la licencia), es una
      // regla de negocio esperada — se muestra como warning, no como error.
      const backendMessage = error?.response?.data?.message || error?.message;
      Swal.fire({
        icon: backendMessage ? 'warning' : 'error',
        title: backendMessage ? 'No se pudo crear la empresa' : 'Error al crear empresa',
        text: backendMessage || 'Hubo un problema al crear la empresa. Inténtalo de nuevo.',
      });
    } finally {
      setSaving(false);
    }
  };

  const open = modalState === 'companies_modal';

  // Portal al <body>: encima del sidebar y el header.
  return createPortal(
    <div className={`companies_modal__overlay ${open ? 'active' : ''}`}>
      <div className={`companies_modal__popup ${open ? 'active' : ''}`}>
        <div className='companies_modal__header'>
          <a href="#" className="companies_modal__close" onClick={(e) => { e.preventDefault(); handleModalChange('') }}>
            <span className='material-symbols-rounded'>close</span>
          </a>
          <p className='companies_modal__title'>Nueva empresa</p>
        </div>
        <form onSubmit={createCompanies}>
          <div className='companies_modal__body'>
            <div className='companies_modal__fields'>
              <div>
                <label className='label__general'>Nombre comercial</label>
                <input className='inputs__general' value={fields.name} onChange={(e) => setFields({ ...fields, name: e.target.value })} placeholder='Nombre comercial' type="text" />
              </div>
              <div>
                <label className='label__general'>Razón social</label>
                <input className='inputs__general' value={fields.businessName} onChange={(e) => setFields({ ...fields, businessName: e.target.value })} placeholder='Razón social' type="text" />
              </div>
              <div>
                <label className='label__general'>RFC (opcional)</label>
                <input className='inputs__general' value={fields.taxId} onChange={(e) => setFields({ ...fields, taxId: e.target.value })} placeholder='RFC de la empresa' type="text" />
              </div>
            </div>
            <div {...getRootProps({ className: `companies_modal__dropzone ${isDragActive ? 'is-active' : ''}` })}>
              <input {...getInputProps()} />
              {preview
                ? <img src={preview} alt="Logo de la empresa" className="companies_modal__preview" />
                : (
                  <>
                    <span className='material-symbols-rounded'>add_photo_alternate</span>
                    <p>{isDragActive ? 'Suelta la imagen aquí...' : 'Haz clic o arrastra el logo de la empresa'}</p>
                  </>
                )}
            </div>
            <div className='companies_modal__actions'>
              <button className='btn__general-primary' type='submit' disabled={!canSave}>
                {saving ? 'Creando...' : 'Crear nueva empresa'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ModalCompanies;
