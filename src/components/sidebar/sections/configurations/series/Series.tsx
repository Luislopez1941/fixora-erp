import React, { useEffect, useState } from 'react'
import TableSkeleton from '../../../../general/skeleton/TableSkeleton'
import { useDispatch, useSelector } from "react-redux";
import { getSeriesTypeLabel, SERIES_MODULE_TYPES } from '../../../../../constants/catalogTypes';
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker';
import { readCategoryBranchId } from '../../../../../constants/category';
import './Series.css'
import ModalSeries from './modal-series/ModalSeries';
import { setSeries } from '../../../../../redux/state/Configurations/Series';
import APIs from '../../../../../services/APIs';

const Series: React.FC = () => {

    const dispatch = useDispatch();

    const series = useSelector((state: any) => state.series.series);
    const [loading, setLoading] = useState(true);
    // Filtros principales: empresa, sucursal (0 = todas) y tipo de documento
    const [companyId, setCompanyId] = useState<number | null>(null);
    const [branchId, setBranchId] = useState<number>(() => readCategoryBranchId());
    const [typeFilter, setTypeFilter] = useState<number | 'ALL'>('ALL');
    // null = cerrado; { serie: null } = alta; { serie } = edición (mismo modal para ambos)
    const [dialog, setDialog] = useState<{ serie: any | null } | null>(null);
    const visibleSeries = (series ?? []).filter((s: any) =>
        (companyId == null || s.companyId === companyId) &&
        (!(branchId > 0) || s.branchId === branchId) &&
        (typeFilter === 'ALL' || s.type === typeFilter),
    );

    const fetch = async () => {
        let data = {
            companyId: 0,
            branchId: null
        }
        try {
            let response: any = await APIs.getSeries(data)
            dispatch(setSeries(response.data));
        } catch (error) {
            console.error('Error al cargar series:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetch()
    }, [])

    return (
        <div className='series'>
            <div className='series__container'>
                <div className='series__header'>
                    <div className='series__filters'>
                        <CategoriesStorePicker
                            branchId={branchId}
                            onBranchIdChange={(id) => {
                                setBranchId(id)
                                localStorage.setItem('categories-store-id', String(id))
                            }}
                            onCompanyIdChange={(id) => setCompanyId(id)}
                        />
                        <select
                            className='inputs__general series__filter'
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                            aria-label='Filtrar por tipo de documento'
                        >
                            <option value='ALL'>Todos los documentos</option>
                            {SERIES_MODULE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                    </div>
                    <button className='btn__general-primary' onClick={() => setDialog({ serie: null })}>
                        Nueva serie
                    </button>
                </div>

                <div className='series__list'>
                    <div className='series__row series__row--head'>
                        <span>Nombre</span>
                        <span>Sucursal</span>
                        <span>Tipo</span>
                        <span className='series__col-actions'>Acciones</span>
                    </div>
                    <div className='series__body'>
                        {loading ? (
                            <TableSkeleton rowClassName='series__row' cols={[{ width: '45%' }, { width: '50%' }, { pill: true, width: '90px' }, { actions: 1 }]} />
                        ) : visibleSeries.length > 0 ? (
                            visibleSeries.map((item: any, index: number) => (
                                <div className='series__row' key={item.id ?? index}>
                                    <div className='series__cell series__cell--name' data-label='Nombre'>
                                        <strong>{item.name}</strong>
                                    </div>
                                    <div className='series__cell' data-label='Sucursal'>
                                        {item.branch?.name ?? '—'}
                                    </div>
                                    <div className='series__cell' data-label='Tipo'>
                                        <span className='series__tag'>{getSeriesTypeLabel(item.type)}</span>
                                    </div>
                                    <div className='series__cell series__col-actions'>
                                        <button className='series__icon-btn' type='button' title='Editar' onClick={() => setDialog({ serie: item })}>
                                            <span className='material-symbols-rounded'>edit</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className='series__empty'>
                                <p>No hay series registradas</p>
                                <span>Crea tu primera serie para comenzar</span>
                            </div>
                        )}
                    </div>
                </div>
                <ModalSeries open={!!dialog} serie={dialog?.serie ?? null} onClose={() => setDialog(null)} />
            </div>
        </div>
    )
}

export default Series
