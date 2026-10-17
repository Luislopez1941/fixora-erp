import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import APIs from '../../../../../services/APIs';
// Mismo formulario visual que el de clientes (clases cm-)
import '../../customers/ModalCustomer.css';

interface Props {
  open: boolean;
  /** Proveedor a editar; vacío = proveedor nuevo */
  supplier: any | null;
  companies: any[];
  /** Empresa seleccionada en la lista (la que se usa al crear) */
  companyId: number;
  onClose: () => void;
  onSaved: () => void;
}

const RFC = /^([A-ZÑ&]{3,4})\d{6}[A-Z0-9]{3}$/;

const empty = { name: '', taxId: '', contactName: '', email: '', phone: '', address: '', creditDays: '0', notes: '', isFreight: false, active: true };

const ModalSupplier: React.FC<Props> = ({ open, supplier, companies, companyId, onClose, onSaved }) => {
  const [fields, setFields] = useState(empty);
  const [company, setCompany] = useState(companyId);
  const [saving, setSaving] = useState(false);
  const isEdit = !!supplier;

  // Cada vez que se abre: formulario limpio, o con los datos del proveedor que se edita
  useEffect(() => {
    if (!open) return;
    setCompany(supplier?.companyId ?? companyId);
    setFields(
      supplier
        ? {
            name: supplier.name ?? '',
            taxId: supplier.taxId ?? '',
            contactName: supplier.contactName ?? '',
            email: supplier.email ?? '',
            phone: supplier.phone ?? '',
            address: supplier.address ?? '',
            creditDays: String(supplier.creditDays ?? 0),
            notes: supplier.notes ?? '',
            isFreight: supplier.isFreight === true,
            active: supplier.active !== false,
          }
        : empty,
    );
  }, [open, supplier, companyId]);

  const set = (key: keyof typeof empty, value: string | boolean) => setFields((prev) => ({ ...prev, [key]: value }));

  const validate = (): string | null => {
    if (!fields.name.trim()) return 'Escribe el nombre del proveedor.';
    const rfc = fields.taxId.trim().toUpperCase();
    if (rfc && !RFC.test(rfc) && !['XAXX010101000', 'XEXX010101000'].includes(rfc)) {
      return 'El RFC no es válido: 12 caracteres para empresas y 13 para personas físicas.';
    }
    const days = Number(fields.creditDays || 0);
    if (!Number.isInteger(days) || days < 0 || days > 365) return 'Los días de crédito deben estar entre 0 y 365.';
    if (!isEdit && !company) return 'Selecciona la empresa.';
    return null;
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) {
      Swal.fire('Atención', problem, 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...fields,
        taxId: fields.taxId.trim().toUpperCase(),
        creditDays: Number(fields.creditDays || 0),
        ...(isEdit ? {} : { companyId: company }),
      };
      if (isEdit) await APIs.updateSupplier(supplier.id, payload);
      else await APIs.createSupplier(payload);
      Swal.fire({ icon: 'success', title: isEdit ? 'Proveedor actualizado' : 'Proveedor creado', timer: 1400, showConfirmButton: false });
      onSaved();
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Swal.fire('Error', (Array.isArray(message) ? message.join(', ') : message) || 'No se pudo guardar el proveedor.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`cm-overlay ${open ? 'active' : ''}`} onClick={onClose}>
      <div className='cm-popup' onClick={(e) => e.stopPropagation()}>
        <div className='cm-header'>
          <h3>{isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}</h3>
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
              <label>Nombre o razón social *</label>
              <input type='text' value={fields.name} onChange={(e) => set('name', e.target.value)} placeholder='Nombre del proveedor' autoFocus />
            </div>
            <div className='cm-field'>
              <label>RFC (opcional)</label>
              <input
                type='text'
                value={fields.taxId}
                maxLength={13}
                onChange={(e) => set('taxId', e.target.value.toUpperCase().replace(/\s/g, ''))}
                placeholder='ABC800101AB1'
              />
            </div>
            <div className='cm-field'>
              <label>Días de crédito</label>
              <input
                type='text'
                inputMode='numeric'
                value={fields.creditDays}
                onChange={(e) => /^\d{0,3}$/.test(e.target.value) && set('creditDays', e.target.value)}
                placeholder='0 = de contado'
              />
            </div>
            <div className='cm-field'>
              <label>Contacto</label>
              <input type='text' value={fields.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder='Persona de contacto' />
            </div>
            <div className='cm-field'>
              <label>Teléfono</label>
              <input type='tel' value={fields.phone} onChange={(e) => set('phone', e.target.value)} placeholder='10 dígitos' />
            </div>
            <div className='cm-field cm-field--wide'>
              <label>Correo</label>
              <input type='email' value={fields.email} onChange={(e) => set('email', e.target.value)} placeholder='proveedor@correo.com' />
            </div>
            <div className='cm-field cm-field--wide'>
              <label>Dirección</label>
              <input type='text' value={fields.address} onChange={(e) => set('address', e.target.value)} placeholder='Calle, número, colonia, ciudad' />
            </div>
            <div className='cm-field cm-field--wide'>
              <label>Notas</label>
              <input type='text' value={fields.notes} maxLength={500} onChange={(e) => set('notes', e.target.value)} placeholder='Condiciones de entrega, horarios, etc.' />
            </div>
          </div>

          <label className='cm-check' htmlFor='sup-freight'>
            <input id='sup-freight' type='checkbox' checked={fields.isFreight} onChange={(e) => set('isFreight', e.target.checked)} />
            Proveedor de envíos (paquetería o transporte; aparece en el envío de las órdenes de compra)
          </label>
          <label className='cm-check' htmlFor='sup-active'>
            <input id='sup-active' type='checkbox' checked={fields.active} onChange={(e) => set('active', e.target.checked)} />
            Proveedor activo
          </label>
        </div>

        <div className='cm-footer'>
          <button type='button' className='cm-btn cm-btn--ghost' onClick={onClose}>Cancelar</button>
          <button type='button' className='cm-btn cm-btn--primary' disabled={saving} onClick={handleSave}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear proveedor'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSupplier;
