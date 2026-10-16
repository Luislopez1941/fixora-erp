import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
// Mismo diseño que Requisiciones, Cotizaciones y Órdenes de venta (filtros compactos, tabla en filas, tarjetas en celular)
import '../shopping/requisition/Requisition.css';
import TableSkeleton from '../../../general/skeleton/TableSkeleton';
import { useSelector } from 'react-redux';
import { useCan } from '../../../../core/permissions/useCan';
import APIs from '../../../../services/APIs';
import ModalCustomer from './ModalCustomer';
import './Customers.css';

const money = (value: number) => Number(value ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

export const customerName = (c: any) => c?.businessName || [c?.firstName, c?.lastName].filter(Boolean).join(' ') || `Cliente ${c?.id}`;

const FILTERS = [
  { id: 'ALL', label: 'Todos' },
  { id: 'OWES', label: 'Con saldo' },
  { id: 'CLEAR', label: 'Al corriente' },
  { id: 'INACTIVE', label: 'Inactivos' },
];

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const userState = useSelector((state: any) => state.user);
  const can = useCan();
  const canCreate = can('customers.create') || can('customers.manage');
  const canManage = can('customers.manage');

  const [companies, setCompanies] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState(0);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [editing, setEditing] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response: any = await APIs.getCompaniesByUser(userState?.id || 1);
        const list = Array.isArray(response) ? response : response?.data || [];
        setCompanies(list);
        // Con una sola empresa (o la activa de la sesión) se elige sola
        const initial = list.length === 1 ? list[0].id : userState?.activeCompanyId && list.some((c: any) => c.id === userState.activeCompanyId) ? userState.activeCompanyId : list[0]?.id ?? 0;
        setCompanyId(initial);
      } catch (e) {
        console.error('Error loading companies', e);
      }
    })();
  }, [userState?.id, userState?.activeCompanyId]);

  const fetchCustomers = useCallback(async () => {
    if (!companyId) {
      setCustomers([]);
      return;
    }
    setLoading(true);
    try {
      const response: any = await APIs.getCustomers(companyId);
      setCustomers(Array.isArray(response) ? response : response?.data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const balanceOf = (c: any) => Number(c.creditAccount?.balance ?? 0);

  const stats = useMemo(() => {
    const withBalance = customers.filter((c) => balanceOf(c) > 0);
    return {
      total: customers.length,
      active: customers.filter((c) => c.active !== false).length,
      owing: withBalance.length,
      receivable: withBalance.reduce((sum, c) => sum + balanceOf(c), 0),
    };
  }, [customers]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (filter === 'OWES' && !(balanceOf(c) > 0)) return false;
      if (filter === 'CLEAR' && balanceOf(c) > 0) return false;
      if (filter === 'INACTIVE' && c.active !== false) return false;
      if (!q) return true;
      return [customerName(c), c.taxId, c.email, c.phone].some((value) => String(value ?? '').toLowerCase().includes(q));
    });
  }, [customers, search, filter]);

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (customer: any) => {
    setEditing(customer);
    setModalOpen(true);
  };

  // A Cuentas por cobrar se va con el nombre del cliente para que la lista llegue ya filtrada
  const goToCuentasPorCobrar = (customer?: any) =>
    navigate(customer ? `/auth/cuentas-por-cobrar/credit-accounts?search=${encodeURIComponent(customerName(customer))}` : '/auth/cuentas-por-cobrar/debtors');

  const handleDelete = async (customer: any) => {
    const result = await Swal.fire({
      title: '¿Eliminar cliente?',
      text: `${customerName(customer)} se eliminará y no se puede deshacer. Si tiene saldo o documentos, desactívalo en vez de eliminarlo.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await APIs.deleteCustomer(customer.id);
      Swal.fire({ icon: 'success', title: 'Cliente eliminado', timer: 1400, showConfirmButton: false });
      fetchCustomers();
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Swal.fire('No se pudo eliminar', (Array.isArray(message) ? message.join(', ') : message) || 'Ocurrió un error al eliminar el cliente.', 'error');
    }
  };

  const toggleActive = async (customer: any) => {
    try {
      await APIs.updateCustomer(customer.id, { active: customer.active === false });
      fetchCustomers();
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Swal.fire('Error', (Array.isArray(message) ? message.join(', ') : message) || 'No se pudo actualizar el cliente.', 'error');
    }
  };

  return (
    <div className='reqs'>
      <div className='reqs__container'>
        <div className='reqs__header'>
          <div className='reqs__header-left'>
            {companies.length > 1 && (
              <select className='inputs__general reqs__filter' aria-label='Empresa' value={companyId} onChange={(e) => setCompanyId(Number(e.target.value))}>
                {companies.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className='cust__header-actions'>
            <button type='button' className='cust__link-btn' onClick={() => goToCuentasPorCobrar()}>
              <span className='material-symbols-rounded' aria-hidden>payments</span>
              Ir a Cuentas por cobrar
            </button>
            {canCreate && (
              <button type='button' className='btn__general-primary' onClick={openNew}>
                Nuevo cliente
              </button>
            )}
          </div>
        </div>

        <div className='cust__stats'>
          <div className='cust__stat'>
            <span>Clientes</span>
            <strong>{stats.total}</strong>
            <small>{stats.active} activos</small>
          </div>
          <div className='cust__stat'>
            <span>Con saldo</span>
            <strong>{stats.owing}</strong>
            <small>de {stats.total}</small>
          </div>
          <div className='cust__stat cust__stat--main'>
            <span>Por cobrar</span>
            <strong>{money(stats.receivable)}</strong>
            <small>cuentas pendientes de clientes</small>
          </div>
        </div>

        <div className='reqs__toolbar'>
          <div className='reqs__toolbar-left'>
            <div className='reqs__search'>
              <span className='reqs__search-icon material-symbols-rounded' aria-hidden>search</span>
              <input
                className='inputs__general reqs__search-input'
                type='text'
                placeholder='Nombre, RFC, correo o teléfono'
                aria-label='Buscar cliente'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className='reqs__chips'>
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type='button'
                className={`reqs__chip ${filter === item.id ? 'reqs__chip--active' : ''}`}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* La tabla siempre se ve; el skeleton va dentro */}
        <div className='reqs__list'>
          <div className='reqs__row cust__row reqs__row--head'>
            <span>Cliente</span>
            <span>Contacto</span>
            <span>Estado</span>
            <span>Crédito</span>
            <span>Por cobrar</span>
            <span>Movimientos</span>
            <span className='reqs__col-actions'>Acciones</span>
          </div>

          {loading ? (
            <TableSkeleton
              rowClassName='reqs__row cust__row'
              cols={[{ avatar: true }, { width: '70%' }, { pill: true }, { width: '60%' }, { width: '60%' }, { width: '55%' }, { actions: 2 }]}
            />
          ) : visible.length > 0 ? (
            visible.map((customer) => {
              const balance = balanceOf(customer);
              const limit = Number(customer.creditAccount?.creditLimit ?? 0);
              const overLimit = limit > 0 && balance > limit;
              const movements = (customer._count?.sales ?? 0) + (customer._count?.quotations ?? 0) + (customer._count?.salesOrders ?? 0);
              const inactive = customer.active === false;
              return (
                <div className='reqs__row cust__row' key={customer.id}>
                  <div className='reqs__cell reqs__cell--name' data-label='Cliente'>
                    <span className='reqs__row-icon material-symbols-rounded' aria-hidden>person</span>
                    <div className='quote-name'>
                      <strong>{customerName(customer)}</strong>
                      <small>{customer.taxId || 'Sin RFC'}</small>
                    </div>
                  </div>
                  <div className='reqs__cell cust__contact' data-label='Contacto'>
                    <span>{customer.phone || '—'}</span>
                    {customer.email && <small>{customer.email}</small>}
                  </div>
                  <div className='reqs__cell' data-label='Estado'>
                    <span
                      className='reqs__badge'
                      style={inactive ? { backgroundColor: '#9CA3AF20', color: '#6B7280' } : { backgroundColor: '#10B98120', color: '#059669' }}
                    >
                      {inactive ? 'Inactivo' : 'Activo'}
                    </span>
                  </div>
                  <div className='reqs__cell reqs__cell--muted' data-label='Crédito'>
                    {customer.creditAccount ? money(limit) : 'Sin crédito'}
                  </div>
                  <div className='reqs__cell' data-label='Por cobrar'>
                    {customer.creditAccount ? (
                      <strong className={`cust__balance ${balance > 0 ? 'cust__balance--owes' : ''} ${overLimit ? 'cust__balance--over' : ''}`}>
                        {money(balance)}
                        {overLimit && <small>Excede el límite</small>}
                      </strong>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className='reqs__cell reqs__cell--muted' data-label='Movimientos'>
                    {movements > 0 ? `${movements} ${movements === 1 ? 'documento' : 'documentos'}` : 'Ninguno'}
                  </div>
                  <div className='reqs__cell reqs__col-actions'>
                    <button type='button' className='reqs__icon-btn' title='Ver en Cuentas por cobrar' aria-label='Ver en Cuentas por cobrar' onClick={() => goToCuentasPorCobrar(customer)}>
                      <span className='material-symbols-rounded'>payments</span>
                    </button>
                    {canManage && (
                      <button type='button' className='reqs__icon-btn' title='Editar' aria-label='Editar cliente' onClick={() => openEdit(customer)}>
                        <span className='material-symbols-rounded'>edit</span>
                      </button>
                    )}
                    {canManage && (
                      <button
                        type='button'
                        className='reqs__icon-btn'
                        title={inactive ? 'Activar' : 'Desactivar'}
                        aria-label={inactive ? 'Activar cliente' : 'Desactivar cliente'}
                        onClick={() => toggleActive(customer)}
                      >
                        <span className='material-symbols-rounded'>{inactive ? 'toggle_off' : 'toggle_on'}</span>
                      </button>
                    )}
                    {canManage && (
                      <button type='button' className='reqs__icon-btn reqs__icon-btn--danger' title='Eliminar' aria-label='Eliminar cliente' onClick={() => handleDelete(customer)}>
                        <span className='material-symbols-rounded'>delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className='reqs__state'>
              <p>{customers.length === 0 ? 'Todavía no hay clientes' : 'Ningún cliente coincide con el filtro'}</p>
              <span>{customers.length === 0 ? 'Crea el primero con "Nuevo cliente"' : 'Prueba con otra búsqueda o filtro'}</span>
            </div>
          )}
        </div>
      </div>

      <ModalCustomer
        open={modalOpen}
        customer={editing}
        companies={companies}
        companyId={companyId}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          fetchCustomers();
        }}
      />
    </div>
  );
};

export default Customers;
