import React from 'react'
import { Link } from 'react-router-dom'
import { PrivateRoutes } from '../../../models/routes'
import './styles/Catalogo.css'


const Sales: React.FC = () => {
    return (
        <div className='options__menu-catalogo'>
             <div className='item'>
                <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.SALES}/${PrivateRoutes.SALES_SHEET}`} title="Payments" className="tooltip">
                    <p>Ficha de venta</p>
                </Link>
            </div>
            <div className='item'>
                <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.SALES}/${PrivateRoutes.QUOTATION}`} title="Payments" className="tooltip">
                    <p>Cotización</p>
                </Link>
            </div>
            <div className='item'>
                <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.SALES}/${PrivateRoutes.SALESORDER}`} title="Payments" className="tooltip">
                    <p>Orden de venta</p>
                </Link>
            </div>
            <div className='item'>
                <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.SALES}/${PrivateRoutes.POS_CONFIG}`} title="Configuración de cobro" className="tooltip">
                    <p>Configurar cobro</p>
                </Link>
            </div>
        </div>
    )
}

export default Sales
