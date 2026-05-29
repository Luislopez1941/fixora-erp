import React from 'react'
import { Link } from 'react-router-dom'
import { PrivateRoutes } from '../../../models/routes'
import './styles/Catalogo.css'


const Catalogo: React.FC = () => {
    return (
        <div className='options__menu-catalogo'>
            <div className='item'>
                <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.CATALOGOS}/${PrivateRoutes.CATALOGOS_AREAS_TYPES}`} title="Tipos y áreas" className="tooltip">
                    <p>Tipos y áreas</p>
                </Link>
            </div>
            <div className='item'>
                <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.CATALOGOS}/${PrivateRoutes.CATEGORIES}`} title="Payments" className="tooltip">
                    <p>Categorías</p>
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
