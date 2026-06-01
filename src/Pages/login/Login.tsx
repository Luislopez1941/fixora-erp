import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { createUser } from '../../redux/state/user';
import { useNavigate } from 'react-router-dom';
import { PrivateRoutes } from '../../models/routes';
import APIs from '../../services/APIs';
import { Toaster, toast } from 'sonner'
import MoralPersonCreate from '../../components/login/MoralPersonCreate';
import NaturalPersonCreate from '../../components/login/NaturalPersonCreate';
import { setStatusLogin } from '../../redux/state/login/Login';
import astra from '../../assets/astra.svg'


import './Login.css'

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const navigate = useNavigate()
  const dispatch = useDispatch();

  const statusCreate = useSelector((state: any) => state.login.statusCreate);
  const statusLogin = useSelector((state: any) => state.login.statusLogin); // Obtén el valor de statusCreate desde Redux


  const login = async () => {

    try {
      let result: any = await APIs.login({ email, password })
      if (result.status == 'warning') {
        return toast.warning(result.message)

      }
      if (result.status == 'success') {
        const payload = result.data?.user ?? result.data;
        const token = result.data?.token;
        const companyIds: number[] = (payload.userCompanies ?? []).map((uc: any) => uc.companyId).filter(Boolean);
        const activeCompanyId = companyIds[0] ?? null;
        const userPayload = {
          id: payload.id,
          _id: payload.id,
          name: `${payload.firstName ?? ''} ${payload.firstLastName ?? ''}`.trim() || payload.businessName || payload.email,
          email: payload.email,
          firstName: payload.firstName,
          firstLastName: payload.firstLastName,
          userKind: payload.userKind,
          role: payload.role,
          permissions: payload.permissions ?? [],
          branchId: payload.branchId,
          branch: payload.branch,
          companyId: activeCompanyId,
          companyIds,
          activeCompanyId,
          active: payload.active,
          token,
        };
        dispatch(createUser(userPayload));
        if (token) {
          localStorage.setItem('token-eco', token);
        }
        navigate(`/${PrivateRoutes.PRIVATE}`, { replace: true })
      }

    } catch (error) {
      toast.error("Ocurri un error al iniciar sesion")
    }

  }


  console.log(statusLogin)
  const handleDemoClick = () => {
    console.log("Despachando setStatusLogin con false");
    dispatch(setStatusLogin(true));  // Cambiar el estado a false
  };

  return (
    <div className='login'>
      <Toaster richColors expand={false} position="top-right" />
      <div className='login__container'>
        <div className='left'>
          <div className='left__container'>
            <div className="erp__header">
              <img src={astra} alt="ERP icon" className="erp__icon" />
              <h1>ERP Punto de Venta</h1>
              <p>Potencia tu negocio con herramientas de gestión modernas y eficientes.</p>
            </div>

            <div className="erp__highlight">
              <svg xmlns="http://www.w3.org/2000/svg" className="highlight__icon" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              Automatiza tu operación diaria y obtén insights al instante.
            </div>

            <div className="erp__features">
              <div className="feature">
                <svg xmlns="http://www.w3.org/2000/svg" fill="rgb(242, 165, 65)" viewBox="0 0 24 24" width="24" height="24">
                  <path d="M3 3h18v2H3V3zm2 4h14v14H5V7zm4 2v2h6V9H9zm0 4v2h6v-2H9z" />
                </svg>
                <span>Facturación y ventas simplificadas</span>
              </div>
              <div className="feature">
                <svg xmlns="http://www.w3.org/2000/svg" fill="rgb(242, 165, 65)" viewBox="0 0 24 24" width="24" height="24">
                  <path d="M12 4.44L8.34 7h7.32L12 4.44zM4 8v11h16V8H4zm14 9H6v-7h12v7z" />
                </svg>
                <span>Control de inventario en tiempo real</span>
              </div>
              <div className="feature">
                <svg xmlns="http://www.w3.org/2000/svg" fill="rgb(242, 165, 65)" viewBox="0 0 24 24" width="24" height="24">
                  <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm-2 2h4c2.67 0 8 1.34 8 4v2H2v-2c0-2.66 5.33-4 8-4z" />
                </svg>
                <span>Gestión de clientes y usuarios</span>
              </div>
            </div>
          </div>


        </div>
        <div className='right'>
          <div className='form__login' >
            {statusLogin ?
              <div>
                {statusCreate ?
                  <NaturalPersonCreate />
                  :
                  <MoralPersonCreate />
                }
              </div>
              :
              <div className='form__login_container'>
                <div className='container_head'>
                  <div className='logo'>
                    <img width={70} src={astra} alt="Astra logo" />
                    <p>Astra</p>
                  </div>
                  <div className='title'>
                    <h2>¡Bienvenido de nuevo!</h2>
                    <p>Inicia sesión para gestionar tu negocio con inteligencia y facilidad.</p>
                  </div>
                </div>
                <div className='row__one'>
                  <div className='row__one'>
                    <div>
                      <label className='label__general'>Usuario</label>
                      <div className='inputs__general_icons'>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-287q5 0 10.5-1.5T501-453l283-177q8-5 12-12.5t4-16.5q0-20-17-30t-35 1L480-520 212-688q-18-11-35-.5T160-659q0 10 4 17.5t12 11.5l283 177q5 3 10.5 4.5T480-447Z" /></svg>
                        <input className='inputs__generic' value={email} onChange={(e) => setEmail(e.target.value)} type="text" placeholder='Correo electronico' />
                      </div>
                    </div>
                    <div>
                      <label className='label__general'>Contraseña</label>
                      <div className='inputs__general_icons'>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M280-240q-100 0-170-70T40-480q0-100 70-170t170-70q81 0 141.5 45.5T506-560h334q33 0 56.5 23.5T920-480q0 36-25 58t-55 22v80q0 33-23.5 56.5T760-240q-33 0-56.5-23.5T680-320v-80H506q-24 69-84.5 114.5T280-240Zm0-160q33 0 56.5-23.5T360-480q0-33-23.5-56.5T280-560q-33 0-56.5 23.5T200-480q0 33 23.5 56.5T280-400Z" /></svg>
                        <input className='inputs__generic' value={password} onChange={(e) => setPassword(e.target.value)} type="text" placeholder='Contraseña' />
                      </div>
                    </div>
                  </div>
                </div>
                <div className='row__two'>
                  <div>
                    <div className='btn__login'>
                      <button className='btn__general-purple' type='button' onClick={login}>Iniciar sesión</button>
                    </div>
                    <div className='btn__create_container'>
                      <button className='btn__create' type='button' onClick={handleDemoClick}>Crear una demo</button>
                    </div>
                  </div>
                </div>

              </div>
            }
            <div className='row__btns'>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
