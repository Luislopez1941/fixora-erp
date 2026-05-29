import React from 'react'
import { Route, Routes} from "react-router-dom";
import { PrivateRoutes } from "../../../models/routes";
import Companies from '../../../components/sidebar/sections/configurations/companies/Companies';
import BranchOffices from '../../../components/sidebar/sections/configurations/branchOffices/BranchOffices';
import Roles from '../../../components/sidebar/sections/configurations/roles/Roles';
import Series from '../../../components/sidebar/sections/configurations/series/Series';
import Areas from '../../../components/sidebar/sections/configurations/areas/Areas';
import Users from '../../../components/sidebar/sections/configurations/users/Users';

const RoutesConfigurations: React.FC = () => {
  return (
    <Routes>
        <Route path={`/${PrivateRoutes.COMPANIES}`} element={<Companies />} />
        <Route path={`/${PrivateRoutes.BRANCH_OFFICES}`} element={<BranchOffices />} />
        <Route path={`/${PrivateRoutes.USERS}`} element={<Users />} />
        <Route path={`/${PrivateRoutes.ROLES}`} element={<Roles />} />
        <Route path={`/${PrivateRoutes.SERIES}`} element={<Series />} />
        <Route path={`/${PrivateRoutes.AREAS}`} element={<Areas />} />
    </Routes>
  )
}

export default RoutesConfigurations
