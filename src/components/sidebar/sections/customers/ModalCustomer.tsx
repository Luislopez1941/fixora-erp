import React, { useEffect, useState } from 'react';
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
  onClose: () => void;
  onSaved: () => void;
}

const empty = { businessName: '', firstName: '', lastName: '', taxId: '', email: '', phone: '', address: '', active: true };

const ModalCustomer: React.FC<Props> = ({ open, customer, companies, companyId, onClose, onSaved }) => {
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
            businessName: customer.businessName ?? '',
            firstName: customer.firstName ?? '',
            lastName: customer.lastName ?? '',
            taxId: customer.taxId ?? '',
            email: customer.email ?? '',
            phone: customer.phone ?? '',
            address: customer.address ?? '',
            active: customer.active !== false,
          }
        : empty,
    );
  }, [open, customer, companyId]);

  const set = (key: keyof typeof empty, value: string | boolean) => setFields((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!fields.businessName.trim() && !fields.firstName.trim()) {
      Swal.fire('Atención', 'Escribe la razón social o el nombre del cliente.', 'warning');
      return;
    }
    if (!isEdit && !company) {
      Swal.fire('Atención', 'Selecciona la empresa.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...fields, ...(isEdit ? {} : { companyId: company }) };
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

          <div className='cm-grid'>
            <div className='cm-field cm-field--wide'>
              <label>Razón social</label>
              <input type='text' value={fields.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder='Empresa o nombre comercial' />
            </div>
            <div className='cm-field'>
              <label>RFC</label>
              <input type='text' value={fields.taxId} onChange={(e) => set('taxId', e.target.value.toUpperCase())} placeholder='XAXX010101000' />
            </div>
            <div className='cm-field'>
              <label>Nombre</label>
              <input type='text' value={fields.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder='Nombre(s)' />
            </div>
            <div className='cm-field'>
              <label>Apellidos</label>
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
              <label>Dirección</label>
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
