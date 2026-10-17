import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { PrivateRoutes } from '../../../models/routes'
import CreditAccounts from '../../../components/sidebar/sections/cuentas-por-cobrar/credit-accounts/CreditAccounts'
import Debtors from '../../../components/sidebar/sections/cuentas-por-cobrar/debtors/Debtors'
import CreditPayments from '../../../components/sidebar/sections/cuentas-por-cobrar/credit-payments/CreditPayments'
import ModuleScreen from '../../../core/modules/ModuleScreen';

const RouteCuentasPorCobrar: React.FC = () => {
  return (
    <Routes>
      <Route path={`/${PrivateRoutes.CREDIT_ACCOUNTS}`} element={<CreditAccounts />} />
      <Route path={`/${PrivateRoutes.DEBTORS}`} element={<Debtors />} />
      <Route path={`/${PrivateRoutes.CREDIT_PAYMENTS}`} element={<CreditPayments />} />
      {/* Pantallas nuevas de la taxonomía de módulos (aún sin ruta propia): se resuelven en core/modules/ModuleScreen */}
      <Route path='*' element={<ModuleScreen />} />
    </Routes>
  )
}

export default RouteCuentasPorCobrar
