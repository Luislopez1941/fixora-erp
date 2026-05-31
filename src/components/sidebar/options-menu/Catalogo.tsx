import React from 'react'
import { Link } from 'react-router-dom'
import { PrivateRoutes } from '../../../models/routes'
import './styles/Catalogo.css'


const Catalogo: React.FC = () => {
    return (
        <div className='options__menu-catalogo'>
            <div className='item'>
                <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.CATALOGOS}/types`} title="Áreas" className="tooltip">
                    <p>Áreas</p>
                </Link>
            </div>
            <div className='item'>
                <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.CATALOGOS}/areas`} title="SubÁreas" className="tooltip">
                    <p>SubÁreas</p>
                </Link>
            </div>
            <div className='item'>
                <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.CATALOGOS}/${PrivateRoutes.UNITS}`} title="Payments" className="tooltip">
                    <p>Unidades</p>
                </Link>
            </div>
            
        </div>
    )
}

export default Catalogo
