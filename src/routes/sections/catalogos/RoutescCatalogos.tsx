import React from 'react'
import { Route, Routes} from "react-router-dom";
import { PrivateRoutes } from "../../../models/routes";
import Units from '../../../components/sidebar/sections/catalogos/units/Units';
import Services from '../../../components/sidebar/sections/catalogos/services/Services';
import Articles from '../../../components/sidebar/sections/catalogos/articles/Articles';
import Familias from '../../../components/sidebar/sections/catalogos/familias/Familias';
import Categories from '../../../components/sidebar/sections/catalogos/categories/Categories';
import PriceRanges from '../../../components/sidebar/sections/catalogos/price-ranges/PriceRanges';
import PaymentMethods from '../../../components/sidebar/sections/catalogos/payment-methods/PaymentMethods';
import CatalogAreas from '../../../components/sidebar/sections/catalogos/areas/CatalogAreas';
import Suppliers from '../../../components/sidebar/sections/catalogos/Suppliers/Suppliers';
import CatalogTypes from '../../../components/sidebar/sections/catalogos/types/CatalogTypes';
import ModuleScreen from '../../../core/modules/ModuleScreen';


const RoutescCatalogos: React.FC = () => {
  return (
    <Routes>
        <Route path="/familias" element={<Familias />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/price-ranges" element={<PriceRanges />} />
        <Route path={`/${PrivateRoutes.CATALOGOS_AREAS_TYPES}`} element={<CatalogAreas />} />
        <Route path="/areas" element={<CatalogAreas />} />
        <Route path="/types" element={<CatalogTypes />} />
        <Route path="/payment-methods" element={<PaymentMethods />} />
        <Route path={`/${PrivateRoutes.SUPPLIERS}`} element={<Suppliers />} />
        <Route path={`/${PrivateRoutes.UNITS}`} element={<Units />} />
        <Route path={`/${PrivateRoutes.SERVICES}`} element={<Services />} />
        <Route path={`/${PrivateRoutes.ARTICLES}`} element={<Articles />} />
      {/* Pantallas nuevas de la taxonomía de módulos (aún sin ruta propia): se resuelven en core/modules/ModuleScreen */}
      <Route path='*' element={<ModuleScreen />} />
    </Routes>
  )
}

export default RoutescCatalogos
