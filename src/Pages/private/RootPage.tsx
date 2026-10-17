import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/sidebar/Sidebar'
import { Routes, Route } from 'react-router-dom';
import RouteSales from '../../routes/sections/sales/RouteSales';
import RouteCuentasPorCobrar from '../../routes/sections/cuentas-por-cobrar/RouteCuentasPorCobrar';
import RouteCash from '../../routes/sections/cash/RouteCash';
import RouteStore from '../../routes/sections/store/RouteStore';
import RoutesConfigurations from '../../routes/sections/configurations/RoutesConfigurations';
import RoutescCatalogos from '../../routes/sections/catalogos/RoutescCatalogos';
import RoutesShopping from '../../routes/sections/shopping/RoutesShopping';
import Menu from '../../components/sidebar/Menu';
import Dashboard from '../../components/sidebar/sections/dashboard/Dashboard';
import OptionsMenu from '../../components/sidebar/OptionsMenu';
import ModuleScreen from '../../core/modules/ModuleScreen';
import Customers from '../../components/sidebar/sections/customers/Customers';
import Sales from '../../components/sidebar/options-menu/Sales';
import Shopping from '../../components/sidebar/options-menu/Shopping';
import Store from '../../components/sidebar/options-menu/Store';
import Settings from '../../components/sidebar/options-menu/Settings';
import RouteProduction from '../../routes/sections/production/RouteProduction';
import ModuleStore from '../../components/sidebar/sections/module-store/ModuleStore';
import ProductionMenu from '../../components/sidebar/options-menu/Production';
import Catalogo from '../../components/sidebar/options-menu/Catalogo';
import APIs from '../../services/APIs'
import { updateUser } from '../../redux/state/UserFixora'

import { PrivateRoutes } from '../../models/routes';
import Header from '../../components/header/Header';
import Profile from '../profile/Profile';
import './RootPage.css'

// /auth/cobranza/... -> /auth/cuentas-por-cobrar/... (conserva la ruta interna y los parámetros de búsqueda)
const LegacyCobranzaRedirect: React.FC = () => {
  const { pathname, search } = useLocation()
  return <Navigate replace to={pathname.replace('/cobranza', '/cuentas-por-cobrar') + search} />
}

const RootPage: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state: any) => state.user)
  const userId = user?.id ?? user?._id

  useEffect(() => {
    if (!userId) return

    if (!user?.branchId) {
      navigate('/onboarding');
      return;
    }

    const loadPermissions = async () => {
      try {
        const res: any = await APIs.getUserEffectivePermissions(userId)
        const perms = res?.data ?? res?.permissions ?? []
        const permissionNames = Array.isArray(perms)
          ? perms.map((p: any) => (typeof p === 'string' ? p : p.name)).filter(Boolean)
          : []
        if (permissionNames.length > 0) {
          dispatch(updateUser({ permissions: permissionNames }))
        }
      } catch (err) {
        console.error('Error cargando permisos efectivos:', err)
      }
    }

    loadPermissions()
  }, [userId, dispatch])

  return (
    <div className='root-page'>
      <Sidebar />
      <Menu />
      <div className='container'>
        <Header />
        <main className='main'>
          <Routes>
            <Route path={`${PrivateRoutes.SALES}/*`} element={<RouteSales />} />
            <Route path={`${PrivateRoutes.CUENTAS_POR_COBRAR}/*`} element={<RouteCuentasPorCobrar />} />
            {/* El módulo se llamaba Cobranza: los enlaces y favoritos viejos siguen funcionando */}
            <Route path='cobranza/*' element={<LegacyCobranzaRedirect />} />
            <Route path={`${PrivateRoutes.CASH}/*`} element={<RouteCash />} />
            <Route path={`${PrivateRoutes.SHOPPING}/*`} element={<RoutesShopping />} />
            <Route path={`${PrivateRoutes.STORE}/*`} element={<RouteStore />} />
            <Route path={`${PrivateRoutes.PRODUCTION}/*`} element={<RouteProduction />} />
            <Route path={`${PrivateRoutes.CATALOGOS}/*`} element={<RoutescCatalogos />} />
            <Route path={`${PrivateRoutes.CONFIGURATIONS}/*`} element={<RoutesConfigurations />} />
            {/* "Ingresos" era una pantalla vacía: la ruta (y el icono de la barra inferior) llevan a la ficha de venta */}
            <Route path={`${PrivateRoutes.INCOME}/*`} element={<Navigate replace to={`/${PrivateRoutes.PRIVATE}/sales/sales-sheet`} />} />
            <Route path={PrivateRoutes.CUSTOMERS} element={<Customers />} />
            {/* Las pantallas nuevas de Clientes y CRM (Prospectos, Oportunidades…) se resuelven en ModuleScreen */}
            <Route path={`${PrivateRoutes.CUSTOMERS}/*`} element={<ModuleScreen />} />
            <Route path={`/options/*`} element={<OptionsMenu />} />
            <Route path={`/profile`} element={<Profile />} />
            <Route path={`/`} element={<Dashboard />} />

            <Route path={PrivateRoutes.MENUSALES} element={<Sales />} />
            <Route path={PrivateRoutes.MENUSHOPPING} element={<Shopping />} />
            <Route path={PrivateRoutes.MENUSTORE} element={<Store />} />
            <Route path={PrivateRoutes.MENUSETTINGS} element={<Settings />} />
            <Route path={PrivateRoutes.MENU_PRODUCTION} element={<ProductionMenu />} />
            <Route path={PrivateRoutes.MENUCATALOGOS} element={<Catalogo />} />
            <Route path={PrivateRoutes.MENUSETTINGS} element={<Settings />} />
            <Route path={PrivateRoutes.MODULE_STORE} element={<ModuleStore />} />
            {/* Pantallas nuevas de la taxonomía de módulos: "en construcción" hasta que exista su archivo en src/modules/ */}
            <Route path='*' element={<ModuleScreen />} />
            
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default RootPage
