import React from 'react'
import { Route, Routes} from "react-router-dom";
import { PrivateRoutes } from "../../../models/routes";
import Requisition from '../../../components/sidebar/sections/shopping/requisition/Requisition';
import PurchaseOrder from '../../../components/sidebar/sections/shopping/purchaseorder/PurchaseOrder';

const RoutesShopping: React.FC = () => {
  return (
    <Routes>
        <Route path={`/${PrivateRoutes.REQUISITION}`} element={<Requisition />} />
        <Route path={`/${PrivateRoutes.REQUISITION}/approvals`} element={<Requisition mode="approval" />} />
        <Route path={`/${PrivateRoutes.PURCHASEORDERS}`} element={<PurchaseOrder />} />
    </Routes>
  )
}

export default RoutesShopping
