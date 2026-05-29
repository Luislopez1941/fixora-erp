import React, { useEffect } from 'react'
import { useDispatch, useSelector } from "react-redux";
import { modal } from '../../../../../redux/state/modals';
import { getSeriesTypeLabel } from '../../../../../constants/catalogTypes';
import './Series.css'
import ModalSeries from './modal-series/ModalSeries';
import { setSeries } from '../../../../../redux/state/Configurations/Series';
import APIs from '../../../../../services/APIs';



const Series: React.FC = () => {

    const dispatch = useDispatch();

    const series = useSelector((state: any) => state.series.series);

    console.log(' seriesseriesseries', series)

    const fetch = async () => {
        let data = {
            companyId: 0,
            branchId: null
        }
        try {
            let response: any = await APIs.getSeries(data)
            dispatch(setSeries(response.data));
        } catch (error) {

        }
    }
console.log('series', series)
    useEffect(() => {
        fetch()
    }, [])




   


    const handleModalChange = (value: any) => {
        dispatch(modal(value));

        console.log(value)
    };

 

    return (
        <div className='series'>
            <div className='series__container'>
                <div className='row__one'>
                    <div>
                        <button className='btn__general-primary' onClick={() => handleModalChange('series_modal')}>Crear nueva serie</button>
                    </div>
                </div>
                <div className='table__series' >
                    <div>
                        {series ? (
                            <div className='table__numbers'>
                                <p className='text'>Total de administradores</p>
                                <div className='quantities_tables'>{series.length}</div>
                            </div>
                        ) : (
                            <p className='text'>No hay empresas</p>
                        )}
                    </div>
                    <div className='table__head'>
                        <div className='thead'>
                            <div className='th'>
                                <p className=''>Código</p>
                            </div>
                            <div className='th movil'>
                                <p className=''>Nombre</p>
                            </div>
                            <div className='th movil'>
                                <p className=''>Tipo</p>
                            </div>
                            <div className='th'>
                            </div>
                        </div>
                    </div>
                    {series?.length > 0 ? (
                        <div className='table__body'>
                            {series?.map((item: any, index: any) => (
                                <div className='tbody__container' key={index}>
                                    <div className='tbody-desk'>
                                        <div className='td'>
                                            {item.code}
                                        </div>
                                        <div className='td movil'>
                                            {item.name}
                                        </div>
                                        <div className='td movil'>
                                            {getSeriesTypeLabel(item.type)}
                                        </div>
                                        <div className='td edit'>
                                            <div className='edit-icon'>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-edit"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" /><path d="M16 5l3 3" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='tbody-response'>
                                        <div className='td'>
                                            {item.code}
                                        </div>
                                        <div className='td movil'>
                                            {item.name}
                                        </div>
                                        <div className='td movil'>
                                            {getSeriesTypeLabel(item.type)}
                                        </div>
                                        <div className='td edit'>
                                            <div className='edit-icon'>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-edit"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" /><path d="M16 5l3 3" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className='text'>No hay máximos y mínimos que mostrar</p>
                    )}
                </div>
                <ModalSeries />
            </div>
        </div>
    )
}

export default Series
