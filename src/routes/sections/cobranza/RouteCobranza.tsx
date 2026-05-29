import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { PrivateRoutes } from '../../../models/routes'
import CreditAccounts from '../../../components/sidebar/sections/cobranza/credit-accounts/CreditAccounts'
import Debtors from '../../../components/sidebar/sections/cobranza/debtors/Debtors'
import CreditPayments from '../../../components/sidebar/sections/cobranza/credit-payments/CreditPayments'

const RouteCobranza: React.FC = () => {
  return (
    <Routes>
      <Route path={`/${PrivateRoutes.CREDIT_ACCOUNTS}`} element={<CreditAccounts />} />
      <Route path={`/${PrivateRoutes.DEBTORS}`} element={<Debtors />} />
      <Route path={`/${PrivateRoutes.CREDIT_PAYMENTS}`} element={<CreditPayments />} />
    </Routes>
  )
}

export default RouteCobranza
