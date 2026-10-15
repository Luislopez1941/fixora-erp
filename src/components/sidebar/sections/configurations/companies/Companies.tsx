import React, { useEffect, useState } from 'react'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'
import { useDispatch, useSelector } from "react-redux";
import { modal } from '../../../../../redux/state/modals';
import ModalCompanies from './modal-companies/ModalCompanies';
import { setCompanies } from '../../../../../redux/state/Configurations/Companies';
import './Companies.css'
import APIs from '../../../../../services/APIs';

const Companies: React.FC = () => {
    const dispatch = useDispatch();
    const companies = useSelector((store: any) => store.companies || []);
    const userState = useSelector((store: any) => store.user);
    const [loading, setLoading] = useState(true);

    const handleModalChange = (value: any) => {
        dispatch(modal(value));
    };

    const fetch = async () => {
        setLoading(true);
        try {
            let response: any = await APIs.getCompanies(userState.id)
            dispatch(setCompanies(response.data));
        } catch (error) {
            console.error('Error al cargar empresas:', error)
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetch()
    }, [userState.id])

    const updateModalCompanies = (_: any) => {

    }

    return (
        <div className='companies'>
            <div className='companies__container'>
                <div className='companies__header'>
                    <div className='companies__title-section'>
                        <h2 className='companies__title'>Empresas</h2>
                        {!loading && companies?.length > 0 && <span className='companies__count'>{companies.length}</span>}
                    </div>
                    <button className='btn__general-primary' onClick={() => handleModalChange('companies_modal')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nueva Empresa
                    </button>
                </div>

                <div className='companies__list'>
                    <div className='companies__row companies__row--head'>
                            <span>Empresa</span>
                            <span>Razón social</span>
                            <span>RFC</span>
                            <span>Giro</span>
                            <span className='companies__col-actions'>Acciones</span>
                    </div>
                    {loading ? (
                        <TableSkeleton rowClassName='companies__row' cols={[{ avatar: true }, { width: '65%' }, { width: '50%' }, { pill: true }, { actions: 2 }]} />
                    ) : companies?.length > 0 ? (
                        companies.map((item: any, index: any) => (
                            <div className='companies__row' key={item.id ?? index}>
                                <div className='companies__cell companies__cell--name' data-label='Empresa'>
                                    <span className='companies__row-icon material-symbols-rounded'>business</span>
                                    <strong>{item.name}</strong>
                                </div>
                                <div className='companies__cell' data-label='Razón social'>
                                    {item.businessName || '—'}
                                </div>
                                <div className='companies__cell companies__cell--muted' data-label='RFC'>
                                    {item.taxId || '—'}
                                </div>
                                <div className='companies__cell' data-label='Giro'>
                                    {item.businessType?.name
                                        ? <span className='companies__tag'>{item.businessType.name}</span>
                                        : <span className='companies__cell--muted'>—</span>}
                                </div>
                                <div className='companies__cell companies__col-actions'>
                                    <button className='companies__icon-btn' type='button' title='Editar' onClick={() => updateModalCompanies(item)}>
                                        <span className='material-symbols-rounded'>edit</span>
                                    </button>
                                    <button className='companies__icon-btn companies__icon-btn--danger' type='button' title='Eliminar'>
                                        <span className='material-symbols-rounded'>delete</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className='companies__empty'>
                            <p>No hay empresas registradas</p>
                            <span>Crea tu primera empresa para comenzar</span>
                        </div>
                    )}
                </div>
            </div>

            <ModalCompanies />
        </div>
    )
}

export default Companies
