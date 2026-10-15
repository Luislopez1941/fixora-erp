import './App.css'
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Route, Navigate } from 'react-router-dom';
import RoutesWithNotFonud from './utils/routes-with-not-found'
import { PrivateRoutes } from './models/routes'
import { PublicRoutes } from './models/routes'
import Login from './Pages/login/Login';
import OnboardingFlow from './Pages/onboarding/OnboardingFlow';
import AuthGuard from './guards/auth.guard'
import RouteProtector from './Pages/private/RouteProtector'
import { Toaster } from 'sonner'

import store from './redux/store';

function App() {

  return (
    <Provider store={store}>
      <Router>
      <RoutesWithNotFonud>
        <Route path="/" element={<Navigate to={PrivateRoutes.PRIVATE} />} />
        <Route path={PublicRoutes.LOGIN} element={<Login />} />
        <Route path="/onboarding" element={<OnboardingFlow />} />
        <Route element={<AuthGuard privateValidation={true}/>}>
          <Route path={`${PrivateRoutes.PRIVATE}/*`} element={<RouteProtector />} />
        </Route>
      </RoutesWithNotFonud>
      </Router>
      <Toaster richColors expand={false} position="top-right" />
    </Provider>
  )
}

export default App
