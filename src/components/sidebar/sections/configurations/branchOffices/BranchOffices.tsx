import React, { useState, useEffect } from 'react'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'
import { useDispatch, useSelector } from "react-redux";
import { modal } from '../../../../../redux/state/modals';
import ModalBranchOffices from './modal-branch-offices/ModalBranchOffices';
import './BranchOffices.css'
import APIs from '../../../../../services/APIs';
import { setBranch } from '../../../../../redux/state/Configurations/Branch';
import Swal from 'sweetalert2';



const BranchOffices: React.FC = () => {
    const branch = useSelector((store: any) => store.branch || []);
    const userState = useSelector((store: any) => store.user);
    const [loading, setLoading] = useState(true);
    // Empresas del usuario y filtro: 'ALL' = sucursales de todas sus empresas
    const [companies, setCompanies] = useState<any[]>([]);
    const [companyFilter, setCompanyFilter] = useState<'ALL' | number>('ALL');

    const dispatch = useDispatch();

    useEffect(() => {
        if (!userState?.id) return
        APIs.getCompaniesByUser(userState.id)
            .then((res: any) => setCompanies(Array.isArray(res?.data) ? res.data : []))
            .catch(() => setCompanies([]))
    }, [userState?.id])

    const fetch = async () => {
        setLoading(true);
        const fallbackId = userState?.activeCompanyId || userState?.companyId;
        const ids: number[] =
            companyFilter !== 'ALL'
                ? [companyFilter]
                : companies.length > 0
                    ? companies.map((c: any) => c.id)
                    : fallbackId ? [fallbackId] : [];
        if (ids.length === 0) {
            setLoading(false);
            return;
        }
        try {
            const responses: any[] = await Promise.all(
                ids.map((companyId) => APIs.getBranch({ userId: userState.id, companyId }).catch(() => ({ data: [] }))),
            )
            const merged = responses.flatMap((r: any) => (Array.isArray(r?.data) ? r.data : []))
            dispatch(setBranch(merged));
        } catch (error) {
            console.error('Error al cargar sucursales:', error)
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetch()
    }, [userState.id, companyFilter, companies])


    const handleModalChange = (value: any) => {
        dispatch(modal(value));
    };

    const updateModalCategories = (_: any) => {

    }

    const handleDelete = async (item: any) => {
        const r = await Swal.fire({
            title: '¿Eliminar sucursal?',
            text: `Se eliminará "${item.name}". Si ya tiene ventas, inventario u otros documentos, solo se desactivará para conservar el historial.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        })
        if (!r.isConfirmed) return
        try {
            const res: any = await APIs.deleteBranch(item.id)
            await Swal.fire({ icon: 'success', title: res?.deactivated ? 'Sucursal desactivada' : 'Sucursal eliminada', text: res?.message, timer: 2200, showConfirmButton: false })
            fetch()
        } catch (err: any) {
            Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: err?.response?.data?.message || err?.message })
        }
    }

    return (
        <div className='branch-office'>
            <div className='branch-office__container'>
                <div className='branch-office__header'>
                    <div className='branch-office__filters'>
                    {companies.length > 1 && (
                        <div className='branch-office__chips' role='tablist' aria-label='Filtrar sucursales por empresa'>
                            <button
                                type='button'
                                role='tab'
                                aria-selected={companyFilter === 'ALL'}
                                className={`branch-office__chip ${companyFilter === 'ALL' ? 'branch-office__chip--active' : ''}`}
                                onClick={() => setCompanyFilter('ALL')}
                            >
                                Todas
                            </button>
                            {companies.map((c: any) => (
                                <button
                                    key={c.id}
                                    type='button'
                                    role='tab'
                                    aria-selected={companyFilter === c.id}
                                    className={`branch-office__chip ${companyFilter === c.id ? 'branch-office__chip--active' : ''}`}
                                    onClick={() => setCompanyFilter(c.id)}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    )}
                    </div>
                    <button className='btn__general-primary' onClick={() => handleModalChange('branch-offices_modal')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nueva Sucursal
                    </button>
                </div>

                <div className='branch-office__list'>
                    <div className='branch-office__row branch-office__row--head'>
                            <span>Sucursal</span>
                            <span>Empresa</span>
                            <span>Dirección</span>
                            <span>Giro</span>
                            <span className='branch-office__col-actions'>Acciones</span>
                    </div>
                    {loading ? (
                        <TableSkeleton rowClassName='branch-office__row' cols={[{ avatar: true }, { width: '60%' }, { width: '75%' }, { pill: true }, { actions: 2 }]} />
                    ) : branch?.length > 0 ? (
                        branch.map((item: any, index: any) => (
                            <div className='branch-office__row' key={item.id ?? index}>
                                <div className='branch-office__cell branch-office__cell--name' data-label='Sucursal'>
                                    <span className='branch-office__row-icon material-symbols-rounded'>storefront</span>
                                    <strong>{item.name}</strong>
                                </div>
                                <div className='branch-office__cell' data-label='Empresa'>
                                    {item.company?.name || 'Sin empresa'}
                                </div>
                                <div className='branch-office__cell branch-office__cell--muted' data-label='Dirección'>
                                    {item.address || '—'}
                                </div>
                                <div className='branch-office__cell' data-label='Giro'>
                                    {item.businessType?.name
                                        ? <span className='branch-office__tag'>{item.businessType.name}</span>
                                        : <span className='branch-office__cell--muted'>—</span>}
                                </div>
                                <div className='branch-office__cell branch-office__col-actions'>
                                    <button className='branch-office__icon-btn' type='button' title='Editar' onClick={() => updateModalCategories(item)}>
                                        <span className='material-symbols-rounded'>edit</span>
                                    </button>
                                    <button className='branch-office__icon-btn branch-office__icon-btn--danger' type='button' title='Eliminar' onClick={() => handleDelete(item)}>
                                        <span className='material-symbols-rounded'>delete</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className='branch-office__empty'>
                            <p>No hay sucursales registradas</p>
                            <span>Crea tu primera sucursal para comenzar</span>
                        </div>
                    )}
                </div>
            </div>

            <ModalBranchOffices />
        </div>
    )
}

export default BranchOffices
