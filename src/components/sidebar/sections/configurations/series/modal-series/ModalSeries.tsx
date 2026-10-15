import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './ModalSeries.css';
import { useDispatch, useSelector } from "react-redux";
import APIs from '../../../../../../services/APIs';
import Swal from 'sweetalert2';
import { SERIES_MODULE_TYPES, getSeriesTypeLabel } from '../../../../../../constants/catalogTypes';
import { setSeries } from '../../../../../../redux/state/Configurations/Series';
import BranchAvailabilityPicker from '../../../catalogos/shared/BranchAvailabilityPicker';

const NAME_MAX = 10;

interface Props {
  open: boolean;
  // Con `serie` es edición (solo el nombre); sin ella es alta.
  serie?: any | null;
  onClose: () => void;
}

const ModalSeries: React.FC<Props> = ({ open, serie, onClose }) => {
  const userState = useSelector((store: any) => store.user);
  const existingSeries: any[] = useSelector((state: any) => state.series.series) ?? [];
  const dispatch = useDispatch();
  const isEdit = !!serie;

  const [companies, setCompanies] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  // Sucursales donde se crea la serie (null = todas); cada sucursal lleva su propio folio
  const [serieBranchIds, setSerieBranchIds] = useState<number[] | null>(null);
  const [tab, setTab] = useState<'info' | 'company'>('info');
  const [fields, setFields] = useState<any>({ companyId: null, name: '', type: '' });
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const loadBranches = async (companyId: number) => {
    const result: any = await APIs.getBranch({ userId: userState.id, companyId });
    setBranches(Array.isArray(result?.data) ? result.data : []);
    setSerieBranchIds(null);
    setFields((prev: any) => ({ ...prev, companyId }));
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const response: any = await APIs.getCompanies(userState.id);
        const list = Array.isArray(response?.data) ? response.data : [];
        setCompanies(list);
        if (list.length) await loadBranches(list[0].id);
      } catch (error) {
        console.error('Error al cargar empresas y sucursales:', error);
      }
    };
    fetch();
  }, []);

  // Cada vez que se abre: edición precarga la serie, alta limpia el formulario.
  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setTab('info');
    if (!isEdit) setSerieBranchIds(null);
    if (isEdit) {
      setFields((prev: any) => ({ ...prev, name: serie.name ?? '', type: serie.type, companyId: serie.companyId }));
    } else {
      setFields((prev: any) => ({ ...prev, name: '', type: '' }));
    }
  }, [open, serie]);

  // Sucursales elegidas para el alta (todas si no se restringió)
  const chosenBranchIds: number[] = serieBranchIds ?? branches.map((b: any) => b.id);

  // Alta: un tipo está disponible si alguna de las sucursales elegidas todavía no tiene una serie de ese tipo.
  const availableTypes = SERIES_MODULE_TYPES.filter((t) =>
    chosenBranchIds.some(
      (bid) => !existingSeries.some((s: any) => s.companyId === fields.companyId && s.branchId === bid && s.type === t.id),
    ),
  );

  // Si el tipo elegido deja de estar disponible (cambió la empresa o ya se creó), se limpia.
  useEffect(() => {
    if (!isEdit && fields.type !== '' && !availableTypes.some((t) => t.id === Number(fields.type))) {
      setFields((prev: any) => ({ ...prev, type: '' }));
    }
  }, [availableTypes.length, fields.companyId, serieBranchIds]);

  const name = String(fields.name).trim();
  // El nombre solo puede repetirse entre sucursales distintas
  const nameDuplicated = existingSeries.some(
    (s: any) =>
      s.companyId === fields.companyId &&
      s.id !== serie?.id &&
      (isEdit ? s.branchId === serie?.branchId : chosenBranchIds.includes(s.branchId)) &&
      String(s.name).toLowerCase() === name.toLowerCase(),
  );
  const nameError = !name
    ? 'El nombre es requerido'
    : name.length > NAME_MAX
      ? `Máximo ${NAME_MAX} caracteres`
      : nameDuplicated
        ? 'Ya existe una serie con ese nombre'
        : '';
  const typeError = !isEdit && fields.type === '' ? 'Selecciona para qué documento es' : '';
  const canSave = !nameError && !typeError && !saving;

  const reload = async () => {
    const result: any = await APIs.getSeries({});
    dispatch(setSeries(result.data));
  };

  const save = async () => {
    setTouched(true);
    if (!canSave) return;
    setSaving(true);
    try {
      if (isEdit) {
        await APIs.updateSeries(serie.id, { name });
      } else {
        const response: any = await APIs.createSeries({
          companyId: fields.companyId,
          branchIds: chosenBranchIds,
          name,
          type: Number(fields.type),
        });
        Swal.fire({ icon: 'success', title: 'Serie creada correctamente', text: response.message, confirmButtonColor: '#3085d6' });
      }
      await reload();
      onClose();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: isEdit ? 'No se pudo actualizar la serie' : 'Error al crear la serie',
        text: error.response?.data?.message || error.message || 'Ocurrió un error inesperado',
        confirmButtonColor: '#d33',
      });
    } finally {
      setSaving(false);
    }
  };

  // Portal al <body>: encima del sidebar y el header.
  return createPortal(
    <div className={`series_modal__overlay ${open ? 'active' : ''}`}>
      <div className={`series_modal__popup ${open ? 'active' : ''}`}>
        <div className='series_modal__header'>
          <a href="#" className="series_modal__close" onClick={(e) => { e.preventDefault(); onClose(); }}>
            <span className='material-symbols-rounded'>close</span>
          </a>
          <p className='series_modal__title'>{isEdit ? 'Editar serie' : 'Crear nueva serie'}</p>
        </div>
        <div className='series_modal__tabs' role='tablist'>
          <button type='button' role='tab' aria-selected={tab === 'info'} className={`series_modal__tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>
            Información
          </button>
          <button type='button' role='tab' aria-selected={tab === 'company'} className={`series_modal__tab ${tab === 'company' ? 'active' : ''}`} onClick={() => setTab('company')}>
            Empresa y sucursales
          </button>
        </div>
        <div className='series_modal__body'>
          {tab === 'info' && (
            <div className='series_modal__fields'>
              <div>
                <label className='label__general'>Nombre</label>
                <input
                  className='inputs__general'
                  value={fields.name}
                  maxLength={NAME_MAX}
                  onChange={(e) => setFields({ ...fields, name: e.target.value })}
                  placeholder='Nombre'
                  type="text"
                />
                {touched && nameError && <small className='series_modal__error'>{nameError}</small>}
              </div>
              <div>
                <label className='label__general'>Para</label>
                {isEdit ? (
                  <input className='inputs__general' value={getSeriesTypeLabel(serie.type)} disabled type="text" />
                ) : (
                  <select
                    className='inputs__general'
                    value={fields.type}
                    disabled={availableTypes.length === 0}
                    onChange={(e) => setFields({ ...fields, type: e.target.value })}
                  >
                    <option value='' disabled>{availableTypes.length ? 'Selecciona' : 'Ya tienes todas las series'}</option>
                    {availableTypes.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                )}
                {touched && typeError && <small className='series_modal__error'>{typeError}</small>}
              </div>
            </div>
          )}

          {tab === 'company' && (
            <div className='series_modal__company'>
              <div>
                <label className='label__general'>Empresa</label>
                {!isEdit && companies.length > 1 ? (
                  <select className='inputs__general' value={fields.companyId ?? ''} onChange={(e) => loadBranches(Number(e.target.value))}>
                    {companies.map((company: any) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className='series_modal__static'>{companies.find((c: any) => c.id === fields.companyId)?.name ?? '—'}</p>
                )}
              </div>
              {isEdit ? (
                <div>
                  <label className='label__general'>Sucursal</label>
                  <p className='series_modal__static'>{serie?.branch?.name ?? '—'}</p>
                </div>
              ) : (
                <BranchAvailabilityPicker
                  companyId={fields.companyId}
                  value={serieBranchIds}
                  onChange={setSerieBranchIds}
                  title='Sucursales donde se crea'
                  hint={branches.length > 1 ? 'Se crea una serie por sucursal, cada una con su propio folio.' : undefined}
                />
              )}
            </div>
          )}

          <div className='series_modal__actions'>
            <button className='btn__general-primary' onClick={save} disabled={saving}>
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear serie'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalSeries;
