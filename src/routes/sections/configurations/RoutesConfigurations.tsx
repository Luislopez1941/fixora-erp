import React from 'react'
import { Route, Routes} from "react-router-dom";
import { PrivateRoutes } from "../../../models/routes";
import Companies from '../../../components/sidebar/sections/configurations/companies/Companies';
import BranchOffices from '../../../components/sidebar/sections/configurations/branchOffices/BranchOffices';
import Roles from '../../../components/sidebar/sections/configurations/roles/Roles';
import Series from '../../../components/sidebar/sections/configurations/series/Series';
import CatalogTypes from '../../../components/sidebar/sections/catalogos/types/CatalogTypes';
import Users from '../../../components/sidebar/sections/configurations/users/Users';
import AuditLog from '../../../components/sidebar/sections/configurations/audit/AuditLog';
import UserGroups from '../../../components/sidebar/sections/configurations/userGroups/UserGroups';

const RoutesConfigurations: React.FC = () => {
  return (
    <Routes>
        <Route path={`/${PrivateRoutes.COMPANIES}`} element={<Companies />} />
        <Route path={`/${PrivateRoutes.BRANCH_OFFICES}`} element={<BranchOffices />} />
        <Route path={`/${PrivateRoutes.USERS}`} element={<Users />} />
        <Route path={`/${PrivateRoutes.ROLES}`} element={<Roles />} />
        <Route path={`/${PrivateRoutes.SERIES}`} element={<Series />} />
        <Route path={`/${PrivateRoutes.AREAS}`} element={<CatalogTypes />} />
        <Route path={`/${PrivateRoutes.AUDIT}`} element={<AuditLog />} />
        <Route path={`/${PrivateRoutes.USER_GROUPS}`} element={<UserGroups />} />
    </Routes>
  )
}

export default RoutesConfigurations
