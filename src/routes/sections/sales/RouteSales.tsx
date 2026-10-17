import React from "react";
import { Route, Routes} from "react-router-dom";
import { PrivateRoutes } from "../../../models/routes";
import SalesSheet from "../../../components/sidebar/sections/sales/sales-sheet/SalesSheet";
import Quotation from "../../../components/sidebar/sections/sales/quotation/Quotation";
import SalesOrder from "../../../components/sidebar/sections/sales/sales-order/SalesOrder";
import PosConfig from "../../../components/sidebar/sections/sales/pos-config/PosConfig";
import ModuleScreen from '../../../core/modules/ModuleScreen';

const RouteSales: React.FC = () => {
  return (
    <Routes>
      <Route path={`/${PrivateRoutes.SALES_SHEET}`} element={<SalesSheet />} />
      <Route path={`/${PrivateRoutes.QUOTATION}`} element={<Quotation />} />
      <Route path={`/${PrivateRoutes.SALESORDER}`} element={<SalesOrder />} />
      <Route path={`/${PrivateRoutes.POS_CONFIG}`} element={<PosConfig />} />
      {/* Pantallas nuevas de la taxonomía de módulos (aún sin ruta propia): se resuelven en core/modules/ModuleScreen */}
      <Route path='*' element={<ModuleScreen />} />
    </Routes>
  );
};

export default RouteSales;