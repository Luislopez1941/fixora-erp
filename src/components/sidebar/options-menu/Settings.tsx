import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { PrivateRoutes } from '../../../models/routes'
import APIs from '../../../services/APIs'
import './styles/Settings.css'


const Settings: React.FC = () => {
    const userFromRedux = useSelector((state: any) => state.user)
    const [showCompanies, setShowCompanies] = useState(false)
    const [showBranches, setShowBranches] = useState(false)

    useEffect(() => {
        // Usar companyIds del Redux store (ya guardado en login)
        const companyCount = userFromRedux?.companyIds?.length || 0
        setShowCompanies(companyCount > 1)
        
        // Para sucursales, hacer petición al backend
        const checkBranches = async () => {
            try {
                const userId = userFromRedux?.id || userFromRedux?._id
                if (!userId) return
                
                const response: any = await APIs.getUserById(userId)
                if (response?.status === 'success' && response?.data?.userCompanies) {
                    let totalBranches = 0
                    response.data.userCompanies.forEach((uc: any) => {
                        totalBranches += uc.company?.branches?.length || 0
                    })
                    setShowBranches(totalBranches > 1)
                }
            } catch (error) {
                console.error('Error al verificar sucursales:', error)
            }
        }
        
        checkBranches()
    }, [userFromRedux])

    return (
        <div className='options__menu-settings'>
            {showCompanies && (
                <div className='item'>
                    <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.CONFIGURATIONS}/${PrivateRoutes.COMPANIES}`} title="Empresas" className="tooltip">
                        <p>Empresas</p>
                    </Link>
                </div>
            )}
            {showBranches && (
                <div className='item'>
                    <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.CONFIGURATIONS}/${PrivateRoutes.BRANCH_OFFICES}`} title="Sucursales" className="tooltip">
                        <p>Sucursales</p>
                    </Link>
                </div>
            )}
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
                <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.CONFIGURATIONS}/${PrivateRoutes.USER_GROUPS}`} title="Grupos de usuarios" className="tooltip">
                    <p>Grupos de usuarios</p>
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
