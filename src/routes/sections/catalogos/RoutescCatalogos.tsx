import React from 'react'
import { Route, Routes} from "react-router-dom";
import { PrivateRoutes } from "../../../models/routes";
import Categories from '../../../components/sidebar/sections/categories/Categories';
import Units from '../../../components/sidebar/sections/catalogos/units/Units';
import Services from '../../../components/sidebar/sections/catalogos/services/Services';
import Articles from '../../../components/sidebar/sections/catalogos/articles/Articles';
import Familias from '../../../components/sidebar/sections/catalogos/familias/Familias';
import Contenedores from '../../../components/sidebar/sections/catalogos/contenedores/Contenedores';


const RoutescCatalogos: React.FC = () => {
  return (
    <Routes>
        <Route path="/familias" element={<Familias />} />
        <Route path="/contenedores" element={<Contenedores />} />
        <Route path={`/${PrivateRoutes.CATEGORIES}`} element={<Categories />} />
        <Route path={`/${PrivateRoutes.UNITS}`} element={<Units />} />
        <Route path={`/${PrivateRoutes.SERVICES}`} element={<Services />} />
        <Route path={`/${PrivateRoutes.ARTICLES}`} element={<Articles />} />
    </Routes>
  )
}

export default RoutescCatalogos
