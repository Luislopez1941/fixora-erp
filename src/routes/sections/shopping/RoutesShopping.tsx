import React from 'react'
import { Route, Routes} from "react-router-dom";
import { PrivateRoutes } from "../../../models/routes";
import Requisition from '../../../components/sidebar/sections/shopping/requisition/Requisition';
import PurchaseOrder from '../../../components/sidebar/sections/shopping/purchaseorder/PurchaseOrder';
import ModuleScreen from '../../../core/modules/ModuleScreen';

const RoutesShopping: React.FC = () => {
  return (
    <Routes>
        <Route path={`/${PrivateRoutes.REQUISITION}`} element={<Requisition />} />
        <Route path={`/${PrivateRoutes.REQUISITION}/approvals`} element={<Requisition mode="approval" />} />
        <Route path={`/${PrivateRoutes.PURCHASEORDERS}`} element={<PurchaseOrder />} />
      {/* Pantallas nuevas de la taxonomía de módulos (aún sin ruta propia): se resuelven en core/modules/ModuleScreen */}
      <Route path='*' element={<ModuleScreen />} />
    </Routes>
  )
}

export default RoutesShopping
