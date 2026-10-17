import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { PrivateRoutes } from '../../../models/routes'
import ProductionOrders from '../../../components/sidebar/sections/production/orders/ProductionOrders'
import ProductionAreas from '../../../components/sidebar/sections/production/areas/ProductionAreas'
import ProductionQueue from '../../../components/sidebar/sections/production/queue/ProductionQueue'
import ModuleScreen from '../../../core/modules/ModuleScreen';

const RouteProduction: React.FC = () => {
  return (
    <Routes>
      <Route path='/' element={<ProductionOrders />} />
      <Route path={`/${PrivateRoutes.PRODUCTION_ORDERS}`} element={<ProductionOrders />} />
      <Route path={`/${PrivateRoutes.PRODUCTION_QUEUE}`} element={<ProductionQueue />} />
      <Route path={`/${PrivateRoutes.PRODUCTION_AREAS}`} element={<ProductionAreas />} />
      {/* Pantallas nuevas de la taxonomía de módulos (aún sin ruta propia): se resuelven en core/modules/ModuleScreen */}
      <Route path='*' element={<ModuleScreen />} />
    </Routes>
  )
}

export default RouteProduction
