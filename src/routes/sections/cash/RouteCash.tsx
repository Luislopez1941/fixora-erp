import React from "react";
import { Route, Routes } from "react-router-dom";
import { PrivateRoutes } from "../../../models/routes";
import CashCurrent from "../../../components/sidebar/sections/cash/cash-current/CashCurrent";
import CashMovements from "../../../components/sidebar/sections/cash/cash-movements/CashMovements";
import CashCuts from "../../../components/sidebar/sections/cash/cash-cuts/CashCuts";
import CashShifts from "../../../components/sidebar/sections/cash/cash-shifts/CashShifts";
import CashRegisters from "../../../components/sidebar/sections/cash/cash-registers/CashRegisters";
import CashSchedules from "../../../components/sidebar/sections/cash/cash-schedules/CashSchedules";
import CashConfig from "../../../components/sidebar/sections/cash/cash-config/CashConfig";
import ModuleScreen from '../../../core/modules/ModuleScreen';

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
      {/* Pantallas nuevas de la taxonomía de módulos (aún sin ruta propia): se resuelven en core/modules/ModuleScreen */}
      <Route path='*' element={<ModuleScreen />} />
    </Routes>
  );
};

export default RouteCash;
