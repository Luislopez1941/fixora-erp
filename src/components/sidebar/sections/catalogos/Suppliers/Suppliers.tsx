import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
// Mismo diseño que Requisiciones, Clientes y Órdenes de venta (filtros compactos, tabla en filas, tarjetas en celular)
import '../../shopping/requisition/Requisition.css';
import '../../sales/quotation/Quotation.css';
import TableSkeleton from '../../../../general/skeleton/TableSkeleton';
import { useSelector } from 'react-redux';
import { useCan } from '../../../../../core/permissions/useCan';
import APIs from '../../../../../services/APIs';
import ModalSupplier from './ModalSupplier';
import './Suppliers.css';

const FILTERS = [
  { id: 'ALL', label: 'Todos' },
  { id: 'ACTIVE', label: 'Activos' },
  { id: 'FREIGHT', label: 'Envíos' },
  { id: 'INACTIVE', label: 'Inactivos' },
];

const errorText = (error: any, fallback: string) => {
  const message = error?.response?.data?.message;
  return (Array.isArray(message) ? message.join(', ') : message) || fallback;
};

const Suppliers: React.FC = () => {
  const userState = useSelector((state: any) => state.user);
  const can = useCan();
  const canCreate = can('catalogos.suppliers.create');
  const canManage = can('catalogos.suppliers.manage');

  const [companies, setCompanies] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState(0);
  const [suppliers, setSuppliers] = useState<any[]>([]);
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
        const initial =
          list.length === 1
            ? list[0].id
            : userState?.activeCompanyId && list.some((c: any) => c.id === userState.activeCompanyId)
              ? userState.activeCompanyId
              : list[0]?.id ?? 0;
        setCompanyId(initial);
      } catch (e) {
        console.error('Error loading companies', e);
      }
    })();
  }, [userState?.id, userState?.activeCompanyId]);

  const fetchSuppliers = useCallback(async () => {
    if (!companyId) {
      setSuppliers([]);
      return;
    }
    setLoading(true);
    try {
      const response: any = await APIs.getSuppliersCatalog(companyId);
      setSuppliers(Array.isArray(response) ? response : response?.data || []);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suppliers.filter((s) => {
      if (filter === 'ACTIVE' && s.active === false) return false;
      if (filter === 'INACTIVE' && s.active !== false) return false;
      if (filter === 'FREIGHT' && !s.isFreight) return false;
      if (!q) return true;
      return [s.name, s.taxId, s.contactName, s.email, s.phone].some((value) => String(value ?? '').toLowerCase().includes(q));
    });
  }, [suppliers, search, filter]);

  const stats = useMemo(
    () => ({
      total: suppliers.length,
      active: suppliers.filter((s) => s.active !== false).length,
      freight: suppliers.filter((s) => s.isFreight).length,
      withCredit: suppliers.filter((s) => Number(s.creditDays) > 0).length,
    }),
    [suppliers],
  );

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (supplier: any) => {
    setEditing(supplier);
    setModalOpen(true);
  };

  const handleDelete = async (supplier: any) => {
    const result = await Swal.fire({
      title: '¿Eliminar proveedor?',
      text: `${supplier.name} se eliminará y no se puede deshacer. Si ya tiene compras, desactívalo en vez de eliminarlo.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await APIs.deleteSupplier(supplier.id);
      Swal.fire({ icon: 'success', title: 'Proveedor eliminado', timer: 1400, showConfirmButton: false });
      fetchSuppliers();
    } catch (error: any) {
      Swal.fire('No se pudo eliminar', errorText(error, 'Ocurrió un error al eliminar el proveedor.'), 'error');
    }
  };

  const toggleActive = async (supplier: any) => {
    try {
      await APIs.updateSupplier(supplier.id, { active: supplier.active === false });
      fetchSuppliers();
    } catch (error: any) {
      Swal.fire('Error', errorText(error, 'No se pudo actualizar el proveedor.'), 'error');
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
          {canCreate && (
            <button type='button' className='btn__general-primary' onClick={openNew}>
              Nuevo proveedor
            </button>
          )}
        </div>

        <div className='sup__stats'>
          <div className='sup__stat'>
            <span>Proveedores</span>
            <strong>{stats.total}</strong>
            <small>{stats.active} activos</small>
          </div>
          <div className='sup__stat'>
            <span>Con crédito</span>
            <strong>{stats.withCredit}</strong>
            <small>dan días de crédito</small>
          </div>
          <div className='sup__stat'>
            <span>De envíos</span>
            <strong>{stats.freight}</strong>
            <small>para las órdenes de compra</small>
          </div>
        </div>

        <div className='reqs__toolbar'>
          <div className='reqs__toolbar-left'>
            <div className='reqs__search'>
              <span className='reqs__search-icon material-symbols-rounded' aria-hidden>search</span>
              <input
                className='inputs__general reqs__search-input'
                type='text'
                placeholder='Nombre, RFC, contacto, correo o teléfono'
                aria-label='Buscar proveedor'
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
          <div className='reqs__row sup__row reqs__row--head'>
            <span>Proveedor</span>
            <span>Contacto</span>
            <span>Crédito</span>
            <span>Tipo</span>
            <span>Estado</span>
            <span>Compras</span>
            <span className='reqs__col-actions'>Acciones</span>
          </div>

          {loading ? (
            <TableSkeleton
              rowClassName='reqs__row sup__row'
              cols={[{ avatar: true }, { width: '70%' }, { width: '50%' }, { pill: true }, { pill: true }, { width: '55%' }, { actions: 2 }]}
            />
          ) : visible.length > 0 ? (
            visible.map((supplier) => {
              const inactive = supplier.active === false;
              const purchases = supplier._count?.purchaseOrderItems ?? 0;
              const days = Number(supplier.creditDays ?? 0);
              return (
                <div className='reqs__row sup__row' key={supplier.id}>
                  <div className='reqs__cell reqs__cell--name' data-label='Proveedor'>
                    <span className='reqs__row-icon material-symbols-rounded' aria-hidden>{supplier.isFreight ? 'local_shipping' : 'storefront'}</span>
                    <div className='quote-name'>
                      <strong>{supplier.name}</strong>
                      <small>{supplier.taxId || 'Sin RFC'}</small>
                    </div>
                  </div>
                  <div className='reqs__cell sup__contact' data-label='Contacto'>
                    <span>{supplier.contactName || supplier.phone || '—'}</span>
                    {(supplier.contactName ? supplier.phone : null) && <small>{supplier.phone}</small>}
                    {supplier.email && <small>{supplier.email}</small>}
                  </div>
                  <div className='reqs__cell reqs__cell--muted' data-label='Crédito'>
                    {days > 0 ? `${days} días` : 'Contado'}
                  </div>
                  <div className='reqs__cell' data-label='Tipo'>
                    <span
                      className='reqs__badge'
                      style={supplier.isFreight ? { backgroundColor: '#F59E0B20', color: '#B45309' } : { backgroundColor: '#3B82F620', color: '#1D4ED8' }}
                    >
                      {supplier.isFreight ? 'Envíos' : 'General'}
                    </span>
                  </div>
                  <div className='reqs__cell' data-label='Estado'>
                    <span
                      className='reqs__badge'
                      style={inactive ? { backgroundColor: '#9CA3AF20', color: '#6B7280' } : { backgroundColor: '#10B98120', color: '#059669' }}
                    >
                      {inactive ? 'Inactivo' : 'Activo'}
                    </span>
                  </div>
                  <div className='reqs__cell reqs__cell--muted' data-label='Compras'>
                    {purchases > 0 ? `${purchases} ${purchases === 1 ? 'partida' : 'partidas'}` : 'Ninguna'}
                  </div>
                  <div className='reqs__cell reqs__col-actions'>
                    {canManage && (
                      <button type='button' className='reqs__icon-btn' title='Editar' aria-label='Editar proveedor' onClick={() => openEdit(supplier)}>
                        <span className='material-symbols-rounded'>edit</span>
                      </button>
                    )}
                    {canManage && (
                      <button
                        type='button'
                        className='reqs__icon-btn'
                        title={inactive ? 'Activar' : 'Desactivar'}
                        aria-label={inactive ? 'Activar proveedor' : 'Desactivar proveedor'}
                        onClick={() => toggleActive(supplier)}
                      >
                        <span className='material-symbols-rounded'>{inactive ? 'toggle_off' : 'toggle_on'}</span>
                      </button>
                    )}
                    {canManage && (
                      <button type='button' className='reqs__icon-btn reqs__icon-btn--danger' title='Eliminar' aria-label='Eliminar proveedor' onClick={() => handleDelete(supplier)}>
                        <span className='material-symbols-rounded'>delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className='reqs__state'>
              <p>{suppliers.length === 0 ? 'Todavía no hay proveedores' : 'Ningún proveedor coincide con el filtro'}</p>
              <span>{suppliers.length === 0 ? 'Crea el primero con "Nuevo proveedor"' : 'Prueba con otra búsqueda o filtro'}</span>
            </div>
          )}
        </div>
      </div>

      <ModalSupplier
        open={modalOpen}
        supplier={editing}
        companies={companies}
        companyId={companyId}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          fetchSuppliers();
        }}
      />
    </div>
  );
};

export default Suppliers;
