import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import APIs from '../../../../services/APIs';
import './ModalCustomer.css';

interface Props {
  open: boolean;
  /** Cliente a editar; vacío = cliente nuevo */
  customer: any | null;
  companies: any[];
  /** Empresa seleccionada en la lista (la que se usa al crear) */
  companyId: number;
  /** Sucursales de la empresa (para asignar el cliente) */
  branches: any[];
  /** Sucursal elegida en la lista; 0 = todas */
  defaultBranchId: number;
  onClose: () => void;
  onSaved: () => void;
}

type CustomerType = 'FISICA' | 'MORAL';

// Qué es cada tipo de cliente y por qué cambian los campos
const TYPES: { id: CustomerType; label: string; hint: string; icon: string }[] = [
  { id: 'FISICA', label: 'Persona física', hint: 'Nombre y apellidos. El RFC es opcional', icon: 'person' },
  { id: 'MORAL', label: 'Persona moral', hint: 'Empresa: razón social y RFC', icon: 'apartment' },
];

const RFC_FISICA = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;
const RFC_MORAL = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;

const empty = { branchId: 0, customerType: 'FISICA' as CustomerType, businessName: '', firstName: '', lastName: '', taxId: '', email: '', phone: '', address: '', active: true };

const ModalCustomer: React.FC<Props> = ({ open, customer, companies, companyId, branches: pageBranches, defaultBranchId, onClose, onSaved }) => {
  const userState = useSelector((state: any) => state.user);
  // Sucursales de la empresa que se está usando en el modal (si cambias de empresa se piden de nuevo)
  const [branches, setBranches] = useState<any[]>(pageBranches);
  const [fields, setFields] = useState(empty);
  const [company, setCompany] = useState(companyId);
  const [saving, setSaving] = useState(false);
  const isEdit = !!customer;

  // Cada vez que se abre: formulario limpio, o con los datos del cliente que se edita
  useEffect(() => {
    if (!open) return;
    setCompany(customer?.companyId ?? companyId);
    setFields(
      customer
        ? {
            branchId: customer.branchId ?? 0,
            customerType: (customer.customerType === 'MORAL' || (!customer.customerType && customer.businessName) ? 'MORAL' : 'FISICA') as CustomerType,
            businessName: customer.businessName ?? '',
            firstName: customer.firstName ?? '',
            lastName: customer.lastName ?? '',
            taxId: customer.taxId ?? '',
            email: customer.email ?? '',
            phone: customer.phone ?? '',
            address: customer.address ?? '',
            active: customer.active !== false,
          }
        : { ...empty, branchId: defaultBranchId || 0 },
    );
  }, [open, customer, companyId, defaultBranchId]);

  useEffect(() => {
    if (!open || !company) return;
    let alive = true;
    APIs.getBranchOffices(company, userState?.id || 1)
      .then((response: any) => {
        if (!alive) return;
        const list = Array.isArray(response) ? response : response?.data || [];
        setBranches(list);
        // Una sucursal de otra empresa no vale: vuelve a "Todas"
        setFields((prev) => (prev.branchId > 0 && !list.some((b: any) => b.id === prev.branchId) ? { ...prev, branchId: 0 } : prev));
      })
      .catch(() => alive && setBranches([]));
    return () => {
      alive = false;
    };
  }, [open, company, userState?.id]);

  const set = (key: keyof typeof empty, value: string | boolean | number) => setFields((prev) => ({ ...prev, [key]: value }));

  const type = fields.customerType;
  const isMoral = type === 'MORAL';

  const validate = (): string | null => {
    if (isMoral && !fields.businessName.trim()) return 'Escribe la razón social.';
    if (!isMoral && !fields.firstName.trim()) return 'Escribe el nombre del cliente.';
    const rfc = fields.taxId.trim().toUpperCase();
    if (isMoral && !rfc) return 'El RFC es obligatorio para una persona moral.';
    if (rfc && !isMoral && !RFC_FISICA.test(rfc)) return 'El RFC de una persona física tiene 13 caracteres (ej. PEPJ800101AB1).';
    if (rfc && isMoral && !RFC_MORAL.test(rfc)) return 'El RFC de una persona moral tiene 12 caracteres (ej. ABC800101AB1).';
    return null;
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) {
      Swal.fire('Atención', problem, 'warning');
      return;
    }
    if (!isEdit && !company) {
      Swal.fire('Atención', 'Selecciona la empresa.', 'warning');
      return;
    }
    setSaving(true);
    try {
      // La persona física no lleva razón social
      const payload = {
        ...fields,
        branchId: fields.branchId > 0 ? fields.branchId : null,
        taxId: fields.taxId.trim().toUpperCase(),
        businessName: isMoral ? fields.businessName : '',
        ...(isEdit ? {} : { companyId: company }),
      };
      if (isEdit) await APIs.updateCustomer(customer.id, payload);
      else await APIs.createCustomer(payload);
      Swal.fire({ icon: 'success', title: isEdit ? 'Cliente actualizado' : 'Cliente creado', timer: 1400, showConfirmButton: false });
      onSaved();
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Swal.fire('Error', (Array.isArray(message) ? message.join(', ') : message) || 'No se pudo guardar el cliente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`cm-overlay ${open ? 'active' : ''}`} onClick={onClose}>
      <div className='cm-popup' onClick={(e) => e.stopPropagation()}>
        <div className='cm-header'>
          <h3>{isEdit ? 'Editar cliente' : 'Nuevo cliente'}</h3>
          <button className='cm-close' onClick={onClose} aria-label='Cerrar'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>

        <div className='cm-body'>
          {((!isEdit && companies.length > 1) || branches.length > 0) && (
            <div className='cm-row'>
              {!isEdit && companies.length > 1 && (
                <div className='cm-field'>
                  <label>Empresa</label>
                  <select value={company} onChange={(e) => setCompany(Number(e.target.value))}>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {branches.length > 0 && (
                <div className='cm-field'>
                  <label>Sucursal</label>
                  <select value={fields.branchId} onChange={(e) => set('branchId', Number(e.target.value))}>
                    <option value={0}>Todas (compartido)</option>
                    {branches.map((br: any) => (
                      <option key={br.id} value={br.id}>{br.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className='cm-types' role='tablist' aria-label='Tipo de cliente'>
            {TYPES.map((t) => (
              <button
                key={t.id}
                type='button'
                role='tab'
                aria-selected={type === t.id}
                className={`cm-type ${type === t.id ? 'is-active' : ''}`}
                onClick={() => set('customerType', t.id)}
              >
                <span className='material-symbols-rounded' aria-hidden>{t.icon}</span>
                <span className='cm-type__text'>
                  <strong>{t.label}</strong>
                  <small>{t.hint}</small>
                </span>
              </button>
            ))}
          </div>

          <div className='cm-grid'>
            {isMoral && (
              <div className='cm-field cm-field--wide'>
                <label>Razón social *</label>
                <input type='text' value={fields.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder='Nombre de la empresa' autoFocus />
              </div>
            )}
            <div className={`cm-field ${isMoral ? 'cm-field--wide' : ''}`}>
              <label>{isMoral ? 'RFC *' : 'RFC (opcional)'}</label>
              <input
                type='text'
                value={fields.taxId}
                maxLength={isMoral ? 12 : 13}
                onChange={(e) => set('taxId', e.target.value.toUpperCase().replace(/\s/g, ''))}
                placeholder={isMoral ? 'ABC800101AB1' : 'PEPJ800101AB1'}
              />
            </div>
            <div className='cm-field'>
              <label>{isMoral ? 'Nombre del contacto' : 'Nombre *'}</label>
              <input type='text' value={fields.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder='Nombre(s)' autoFocus={!isMoral} />
            </div>
            <div className='cm-field'>
              <label>{isMoral ? 'Apellidos del contacto' : 'Apellidos'}</label>
              <input type='text' value={fields.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder='Apellidos' />
            </div>
            <div className='cm-field'>
              <label>Teléfono</label>
              <input type='tel' value={fields.phone} onChange={(e) => set('phone', e.target.value)} placeholder='10 dígitos' />
            </div>
            <div className='cm-field'>
              <label>Correo</label>
              <input type='email' value={fields.email} onChange={(e) => set('email', e.target.value)} placeholder='cliente@correo.com' />
            </div>
            <div className='cm-field cm-field--wide'>
              <label>{isMoral ? 'Domicilio fiscal' : 'Dirección'}</label>
              <input type='text' value={fields.address} onChange={(e) => set('address', e.target.value)} placeholder='Calle, número, colonia, ciudad' />
            </div>
          </div>

          <label className='cm-check' htmlFor='cm-active'>
            <input id='cm-active' type='checkbox' checked={fields.active} onChange={(e) => set('active', e.target.checked)} />
            Cliente activo
          </label>
        </div>

        <div className='cm-footer'>
          <button type='button' className='cm-btn cm-btn--ghost' onClick={onClose}>Cancelar</button>
          <button type='button' className='cm-btn cm-btn--primary' disabled={saving} onClick={handleSave}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalCustomer;
