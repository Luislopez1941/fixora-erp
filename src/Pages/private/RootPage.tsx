import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Sidebar from '../../components/sidebar/Sidebar'
import { Routes, Route } from 'react-router-dom';
import RouteSales from '../../routes/sections/sales/RouteSales';
import RouteCobranza from '../../routes/sections/cobranza/RouteCobranza';
import RouteStore from '../../routes/sections/store/RouteStore';
import RoutesConfigurations from '../../routes/sections/configurations/RoutesConfigurations';
import RoutescCatalogos from '../../routes/sections/catalogos/RoutescCatalogos';
import RoutesShopping from '../../routes/sections/shopping/RoutesShopping';
import Menu from '../../components/sidebar/Menu';
import Dashboard from '../../components/sidebar/sections/dashboard/Dashboard';
import OptionsMenu from '../../components/sidebar/OptionsMenu';
import Income from '../../components/sidebar/sections/income/Income';
import Sales from '../../components/sidebar/options-menu/Sales';
import Shopping from '../../components/sidebar/options-menu/Shopping';
import Store from '../../components/sidebar/options-menu/Store';
import Settings from '../../components/sidebar/options-menu/Settings';
import RouteProduction from '../../routes/sections/production/RouteProduction';
import ModuleStore from '../../components/sidebar/sections/module-store/ModuleStore';
import ProductionMenu from '../../components/sidebar/options-menu/Production';
import Catalogo from '../../components/sidebar/options-menu/Catalogo';
import APIs from '../../services/APIs'
import { updateUser } from '../../redux/state/user'

import { PrivateRoutes } from '../../models/routes';
import Header from '../../components/header/Header';
import './RootPage.css'

const RootPage: React.FC = () => {
  const dispatch = useDispatch()
  const userId = useSelector((state: any) => state.user?.id ?? state.user?._id)

  useEffect(() => {
    if (!userId) return

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
            <Route path={`${PrivateRoutes.COBRANZA}/*`} element={<RouteCobranza />} />
            <Route path={`${PrivateRoutes.SHOPPING}/*`} element={<RoutesShopping />} />
            <Route path={`${PrivateRoutes.STORE}/*`} element={<RouteStore />} />
            <Route path={`${PrivateRoutes.PRODUCTION}/*`} element={<RouteProduction />} />
            <Route path={`${PrivateRoutes.CATALOGOS}/*`} element={<RoutescCatalogos />} />
            <Route path={`${PrivateRoutes.CONFIGURATIONS}/*`} element={<RoutesConfigurations />} />
            <Route path={`${PrivateRoutes.INCOME}/*`} element={<Income />} />
            <Route path={`/options/*`} element={<OptionsMenu />} />
            <Route path={`/`} element={<Dashboard />} />

            <Route path={PrivateRoutes.MENUSALES} element={<Sales />} />
            <Route path={PrivateRoutes.MENUSHOPPING} element={<Shopping />} />
            <Route path={PrivateRoutes.MENUSTORE} element={<Store />} />
            <Route path={PrivateRoutes.MENUSETTINGS} element={<Settings />} />
            <Route path={PrivateRoutes.MENU_PRODUCTION} element={<ProductionMenu />} />
            <Route path={PrivateRoutes.MENUCATALOGOS} element={<Catalogo />} />
            <Route path={PrivateRoutes.MENUSETTINGS} element={<Settings />} />
            <Route path={PrivateRoutes.MODULE_STORE} element={<ModuleStore />} />
            
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default RootPage
