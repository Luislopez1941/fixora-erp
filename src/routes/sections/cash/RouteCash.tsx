import React from "react";
import { Route, Routes } from "react-router-dom";
import { PrivateRoutes } from "../../../models/routes";
import CashCurrent from "../../../components/sidebar/sections/cash/CashCurrent";
import CashMovements from "../../../components/sidebar/sections/cash/CashMovements";
import CashCuts from "../../../components/sidebar/sections/cash/CashCuts";
import CashShifts from "../../../components/sidebar/sections/cash/CashShifts";
import CashRegisters from "../../../components/sidebar/sections/cash/CashRegisters";
import CashSchedules from "../../../components/sidebar/sections/cash/CashSchedules";
import CashConfig from "../../../components/sidebar/sections/cash/CashConfig";

const RouteCash: React.FC = () => {
  return (
    <Routes>
      <Route path={PrivateRoutes.CASH_CURRENT} element={<CashCurrent />} />
      <Route path={PrivateRoutes.CASH_MOVEMENTS} element={<CashMovements />} />
      <Route path={PrivateRoutes.CASH_CUTS} element={<CashCuts />} />
      <Route path={PrivateRoutes.CASH_SHIFTS} element={<CashShifts />} />
      <Route path={PrivateRoutes.CASH_REGISTERS} element={<CashRegisters />} />
      <Route path={PrivateRoutes.CASH_SCHEDULES} element={<CashSchedules />} />
      <Route path={PrivateRoutes.CASH_CONFIG} element={<CashConfig />} />
    </Routes>
  );
};

export default RouteCash;
