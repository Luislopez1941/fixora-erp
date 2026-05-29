import React from 'react'
import { Link } from 'react-router-dom'
import { PrivateRoutes } from '../../../models/routes'
import './styles/Settings.css'


const Settings: React.FC = () => {
    return (
        <div className='options__menu-settings'>
            <div className='item'>
                <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.CONFIGURATIONS}/${PrivateRoutes.COMPANIES}`} title="Payments" className="tooltip">
                    <p>Empresas</p>
                </Link>
            </div>
            <div className='item'>
                <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.CONFIGURATIONS}/${PrivateRoutes.BRANCH_OFFICES}`} title="Payments" className="tooltip">
                    <p>Sucursales</p>
                </Link>
            </div>
            <div className='item'>
                <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.CONFIGURATIONS}/${PrivateRoutes.SERIES}`} title="Payments" className="tooltip">
                    <p>Series</p>
                </Link>
            </div>
            <div className='item'>
                <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.CONFIGURATIONS}/${PrivateRoutes.AREAS}`} title="Payments" className="tooltip">
                    <p>Areas</p>
                </Link>
            </div>
            <div className='item'>
                <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.CONFIGURATIONS}/${PrivateRoutes.USERS}`} title="Usuarios" className="tooltip">
                    <p>Usuarios</p>
                </Link>
            </div>
            <div className='item'>
                <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.CONFIGURATIONS}/${PrivateRoutes.ROLES}`} title="Roles" className="tooltip">
                    <p>Roles</p>
                </Link>
            </div>
        </div>
    )
}

export default Settings
