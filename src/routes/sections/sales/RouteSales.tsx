import React from "react";
import { Route, Routes} from "react-router-dom";
import { PrivateRoutes } from "../../../models/routes";
import SalesSheet from "../../../components/sidebar/sections/sales/sales-sheet/SalesSheet";
import PosConfig from "../../../components/sidebar/sections/sales/pos-config/PosConfig";

const RouteSales: React.FC = () => {
  return (
    <Routes>
      <Route path={`/${PrivateRoutes.SALES_SHEET}`} element={<SalesSheet />} />
      <Route path={`/${PrivateRoutes.POS_CONFIG}`} element={<PosConfig />} />
    </Routes>
  );
};

export default RouteSales;