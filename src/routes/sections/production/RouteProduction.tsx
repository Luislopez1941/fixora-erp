import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { PrivateRoutes } from '../../../models/routes'
import ProductionOrders from '../../../components/sidebar/sections/production/orders/ProductionOrders'
import Categories from '../../../components/sidebar/sections/categories/Categories'
import ProductionAreas from '../../../components/sidebar/sections/production/areas/ProductionAreas'
import ProductionQueue from '../../../components/sidebar/sections/production/queue/ProductionQueue'

const RouteProduction: React.FC = () => {
  return (
    <Routes>
      <Route path='/' element={<ProductionOrders />} />
      <Route path={`/${PrivateRoutes.PRODUCTION_ORDERS}`} element={<ProductionOrders />} />
      <Route path={`/${PrivateRoutes.PRODUCTION_QUEUE}`} element={<ProductionQueue />} />
      <Route path={`/${PrivateRoutes.PRODUCTION_CATEGORIES}`} element={<Categories />} />
      <Route path={`/${PrivateRoutes.PRODUCTION_AREAS}`} element={<ProductionAreas />} />
    </Routes>
  )
}

export default RouteProduction
