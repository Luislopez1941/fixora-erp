import React from 'react'
import { Link } from 'react-router-dom'
import { PrivateRoutes } from '../../../models/routes'
import './styles/Store.css'

const ProductionMenu: React.FC = () => {
  return (
    <div className='options__menu-store'>
      <div className='item'>
        <Link
          to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.PRODUCTION}/${PrivateRoutes.PRODUCTION_CATEGORIES}`}
          title='Categorías de producción'
          className='tooltip'
        >
          <p>Categorías</p>
        </Link>
      </div>
      <div className='item'>
        <Link
          to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.PRODUCTION}/${PrivateRoutes.PRODUCTION_ORDERS}`}
          title='Órdenes de producción'
          className='tooltip'
        >
          <p>Órdenes de producción</p>
        </Link>
      </div>
    </div>
  )
}

export default ProductionMenu
