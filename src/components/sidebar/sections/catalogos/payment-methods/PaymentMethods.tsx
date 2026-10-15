import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import APIs from '../../../../../services/APIs';
import TableSkeleton from '../../../../general/skeleton/TableSkeleton';
import './PaymentMethods.css';

const EMPTY_FORM = { name: '', code: '', active: true, sortOrder: 0 };

const asList = (res: any): any[] =>
  Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];

const PaymentMethods = () => {
  const userState = useSelector((state: any) => state.user);
  const userId = userState?.id ?? userState?._id;

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  // Empresa: la elegida, o la activa de la sesión mientras se resuelve la lista
  const [selectedCompany, setSelectedCompany] = useState<number>(
    userState?.activeCompanyId ?? userState?.companyId ?? 0,
  );
  const [selectedBranch, setSelectedBranch] = useState(0);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Datos ──
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const list = asList(await APIs.getCompaniesByUser(userId));
        setCompanies(list);
        if (list.length > 0 && !list.some((c) => c.id === selectedCompany)) {
          setSelectedCompany(list[0].id);
        }
      } catch (err) {
        console.error('Error fetching companies:', err);
      }
    })();
  }, [userId]);

  useEffect(() => {
    if (!selectedCompany || !userId) return;
    (async () => {
      try {
        setBranches(asList(await APIs.getBranchOffices(selectedCompany, userId)));
      } catch (err) {
        console.error('Error fetching branches:', err);
        setBranches([]);
      }
    })();
  }, [selectedCompany, userId]);

  const fetchPaymentMethods = async () => {
    if (!selectedCompany) {
      setPaymentMethods([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response: any = await APIs.getPaymentMethods(selectedCompany, selectedBranch);
      setPaymentMethods(response?.status === 'success' ? asList(response) : []);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, [selectedCompany, selectedBranch]);

  // ── Modal ──
  const openCreate = () => {
    setEditingMethod(null);
    setFormData(EMPTY_FORM);
    setTouched(false);
    setShowModal(true);
  };

  const openEdit = (method: any) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      code: method.code,
      active: method.active,
      sortOrder: method.sortOrder ?? 0,
    });
    setTouched(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMethod(null);
  };

  // Validaciones (se muestran bajo el campo al intentar guardar)
  const nameError = !formData.name.trim()
    ? 'El nombre es requerido'
    : formData.name.trim().length > 40 ? 'Máximo 40 caracteres' : '';
  const codeValue = formData.code.trim();
  const codeError = !codeValue
    ? 'El código es requerido'
    : !/^[A-Za-z0-9_]+$/.test(codeValue)
      ? 'Solo letras, números y guion bajo (sin espacios)'
      : paymentMethods.some((m) => m.id !== editingMethod?.id && String(m.code).toLowerCase() === codeValue.toLowerCase())
        ? 'Ya existe un método con ese código'
        : '';
  const orderError = !Number.isInteger(formData.sortOrder) || formData.sortOrder < 0 ? 'Debe ser un entero mayor o igual a 0' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (nameError || codeError || orderError) return;
    setSaving(true);
    try {
      const payload = { ...formData, name: formData.name.trim(), code: codeValue };
      const response: any = editingMethod
        ? await APIs.updatePaymentMethod(editingMethod.id, payload)
        : await APIs.createPaymentMethod({
            ...payload,
            companyId: selectedCompany,
            branchId: selectedBranch > 0 ? selectedBranch : null,
          });
      if (response?.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: editingMethod ? 'Método de pago actualizado' : 'Método de pago creado',
        });
        closeModal();
        fetchPaymentMethods();
      } else {
        Swal.fire({ icon: 'warning', title: 'No se pudo guardar', text: response?.message });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: err?.response?.data?.message || err?.message || 'No se pudo guardar el método de pago',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (method: any) => {
    const confirmation = await Swal.fire({
      title: '¿Eliminar método de pago?',
      text: `Se eliminará "${method.name}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirmation.isConfirmed) return;
    try {
      const response: any = await APIs.deletePaymentMethod(method.id);
      if (response?.status === 'success') {
        Swal.fire({ icon: 'success', title: 'Método de pago eliminado' });
        fetchPaymentMethods();
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo eliminar',
        text: err?.response?.data?.message || err?.message,
      });
    }
  };

  // Los selectores solo aparecen si hay algo que elegir
  const showCompanySelect = companies.length > 1;
  const showBranchSelect = branches.length > 1;

  return (
    <div className='payment-methods'>
      <div className='payment-methods__container'>
        <div className='payment-methods__header'>
          <div className='payment-methods__header-left'>
            {showCompanySelect && (
              <select
                className='inputs__general payment-methods__select'
                value={selectedCompany}
                aria-label='Empresa'
                onChange={(e) => {
                  setSelectedCompany(Number(e.target.value));
                  setSelectedBranch(0);
                }}
              >
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            {showBranchSelect && (
              <select
                className='inputs__general payment-methods__select'
                value={selectedBranch}
                aria-label='Sucursal'
                onChange={(e) => setSelectedBranch(Number(e.target.value))}
              >
                <option value={0}>Todas las sucursales</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <p className='payment-methods__hint'>Métodos de cobro aceptados</p>
          </div>
          <button className='btn__general-primary' type='button' onClick={openCreate}>
            Nuevo método de pago
          </button>
        </div>

        {/* La tabla siempre se ve; el skeleton va dentro */}
        <div className='payment-methods__list'>
          <div className='payment-methods__row payment-methods__row--head'>
            <span>Código</span>
            <span>Nombre</span>
            <span>Estado</span>
            <span>Orden</span>
            <span className='payment-methods__col-actions'>Acciones</span>
          </div>

          {loading ? (
            <TableSkeleton rowClassName='payment-methods__row' cols={[{ pill: true, width: '84px' }, { width: '55%' }, { pill: true, width: '60px' }, { width: '30%' }, { actions: 2 }]} />
          ) : paymentMethods.length > 0 ? (
            paymentMethods.map((method, index) => (
              <div className='payment-methods__row' key={method.id ?? index}>
                <div className='payment-methods__cell' data-label='Código'>
                  <span className='payment-methods__tag'>{method.code}</span>
                </div>
                <div className='payment-methods__cell payment-methods__cell--name' data-label='Nombre'>
                  <strong>{method.name}</strong>
                </div>
                <div className='payment-methods__cell' data-label='Estado'>
                  <span className={`payment-methods__badge ${method.active ? 'payment-methods__badge--active' : 'payment-methods__badge--inactive'}`}>
                    {method.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className='payment-methods__cell' data-label='Orden'>{method.sortOrder}</div>
                <div className='payment-methods__cell payment-methods__col-actions'>
                  <button type='button' className='payment-methods__icon-btn' title='Editar' aria-label='Editar método de pago' onClick={() => openEdit(method)}>
                    <span className='material-symbols-rounded'>edit</span>
                  </button>
                  <button type='button' className='payment-methods__icon-btn payment-methods__icon-btn--danger' title='Eliminar' aria-label='Eliminar método de pago' onClick={() => handleDelete(method)}>
                    <span className='material-symbols-rounded'>delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className='payment-methods__state'>
              <p>No hay métodos de pago configurados</p>
              <span>Crea el primero con "Nuevo método de pago"</span>
            </div>
          )}
        </div>
      </div>

      {/* Portal al <body>: encima del sidebar y el header */}
      {createPortal(
        <div className={`payment-methods_modal__overlay ${showModal ? 'active' : ''}`}>
          <div className={`payment-methods_modal__popup ${showModal ? 'active' : ''}`}>
            <div className='payment-methods_modal__header'>
              <button type='button' className='payment-methods_modal__close' onClick={closeModal} aria-label='Cerrar'>
                <span className='material-symbols-rounded'>close</span>
              </button>
              <p className='payment-methods_modal__title'>{editingMethod ? 'Editar método de pago' : 'Nuevo método de pago'}</p>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className='payment-methods_modal__body'>
                <div className='payment-methods_modal__fields'>
                  <div>
                    <label className='label__general'>Nombre</label>
                    <input
                      className='inputs__general'
                      type='text'
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder='Ej. Efectivo, Tarjeta Visa...'
                    />
                    {touched && nameError && <small className='payment-methods_modal__error'>{nameError}</small>}
                  </div>
                  <div>
                    <label className='label__general'>Código (interno)</label>
                    <input
                      className='inputs__general'
                      type='text'
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder='Ej. CASH, CARD_CREDIT'
                      disabled={!!editingMethod}
                    />
                    {touched && codeError && <small className='payment-methods_modal__error'>{codeError}</small>}
                  </div>
                  <div>
                    <label className='label__general'>Orden de visualización</label>
                    <input
                      className='inputs__general'
                      type='number'
                      min={0}
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    />
                    {touched && orderError && <small className='payment-methods_modal__error'>{orderError}</small>}
                  </div>
                </div>

                <label className={`payment-methods_modal__check ${formData.active ? 'is-checked' : ''}`}>
                  <input
                    className='payment-methods_modal__check-input'
                    type='checkbox'
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <span className='payment-methods_modal__check-box' aria-hidden>
                    <span className='material-symbols-rounded'>check</span>
                  </span>
                  <span className='payment-methods_modal__check-text'>
                    <strong>Activo</strong>
                    <small>Solo los métodos activos se ofrecen al cobrar.</small>
                  </span>
                </label>

                <div className='payment-methods_modal__actions'>
                  <button type='button' className='btn__general-secondary' onClick={closeModal} disabled={saving}>Cancelar</button>
                  <button type='submit' className='btn__general-primary' disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default PaymentMethods;
