import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { PrivateRoutes } from '../../../models/routes'
import CreditAccounts from '../../../components/sidebar/sections/cuentas-por-cobrar/credit-accounts/CreditAccounts'
import Debtors from '../../../components/sidebar/sections/cuentas-por-cobrar/debtors/Debtors'
import CreditPayments from '../../../components/sidebar/sections/cuentas-por-cobrar/credit-payments/CreditPayments'

const RouteCuentasPorCobrar: React.FC = () => {
  return (
    <Routes>
      <Route path={`/${PrivateRoutes.CREDIT_ACCOUNTS}`} element={<CreditAccounts />} />
      <Route path={`/${PrivateRoutes.DEBTORS}`} element={<Debtors />} />
      <Route path={`/${PrivateRoutes.CREDIT_PAYMENTS}`} element={<CreditPayments />} />
    </Routes>
  )
}

export default RouteCuentasPorCobrar
