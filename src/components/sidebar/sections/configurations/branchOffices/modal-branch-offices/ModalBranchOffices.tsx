import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './ModalBranchOffices.css';
import { useDispatch, useSelector } from "react-redux";
import { modal } from '../../../../../../redux/state/modals';
import APIs from '../../../../../../services/APIs';
import { setBranch } from '../../../../../../redux/state/Configurations/Branch';
import Swal from 'sweetalert2';


const ModalBranchOffices = () => {

  const dispatch = useDispatch();

  // Asegúrate de que el tipo de state es AppStore
  const modalState = useSelector((state: any) => state.modals);
  const userState = useSelector((store: any) => store.user);

  const handleModalChange = (value: any) => {
    dispatch(modal(value));
    // dispatch(updateAdministrator('reset'));
  
  };

  const [companies, setCompanies] = useState<any>([])

  const fetch = async () => {
    let response: any = await APIs.getCompanies(userState.id)
    setCompanies({
      selectName: 'Series',
      dataSelect: Array.isArray(response?.data) ? response.data : [],
      options: 'name',
    })
  }

  // Con una sola empresa el select no aporta nada: se oculta y se usa esa empresa.
  // El select solo se muestra con 2 o más empresas (con 0 o 1 no hay nada que elegir).
  const companyCount = companies?.dataSelect?.length ?? 0
  const showCompanySelect = companyCount > 1
  const singleCompany = companyCount === 1 ? companies.dataSelect[0] : null
  const defaultCompanyId = singleCompany?.id ?? userState?.activeCompanyId ?? userState?.companyId ?? userState?.companyIds?.[0]

  useEffect(() => {
    fetch()
  }, [])




  // Estado inicial para los campos del formulario
  const [fields, setFields] = useState<any>({
    companyId: null,
    name: '',
    address: '',
    
    // token: token
  });




  const createAdministrator = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
    

      let data = {
        name: fields.name,
        address: fields.address,
        companyId: showCompanySelect ? fields.companyId : defaultCompanyId
      }
      
      const response: any = await APIs.createBranch(data);
      Swal.fire({
        icon: 'success',
        title: 'Sucursal creada',
        text: response.message,
      });
      let dataG = {
        userId: userState.id,
        companyId: 0
    }
      let result: any = await APIs.getBranch(dataG)
      dispatch(setBranch(result.data));
      // dispatch(setBranch(response.data));
  
      // Mostrar alerta de éxito con Swal
      
    } catch (error: any) {
      console.error('Error al crear sucursal:', error);

      // Si el backend manda un mensaje claro (ej. límite de la licencia), es una
      // regla de negocio esperada — se muestra como warning, no como error.
      const backendMessage = error?.response?.data?.message || error?.message;
      Swal.fire({
        icon: backendMessage ? 'warning' : 'error',
        title: backendMessage ? 'No se pudo crear la sucursal' : 'Error',
        text: backendMessage || 'Ocurrió un error al crear la sucursal.',
      });
    }
  };



  // Se pinta en <body> (portal): dentro del contenido quedaba atrapado en su propio
  // contexto de apilamiento y el sidebar le pasaba por encima.
  return createPortal(
    <div className={`branch-offices_modal__overlay ${modalState === 'branch-offices_modal' ? 'active' : ''}`}>
      <div className={`branch-offices_modal__popup ${modalState === 'branch-offices_modal' ? 'active' : ''}`}>
        <div className='branch-offices_modal__header'>
          <a href="#" className="branch-offices_modal__close" onClick={() => handleModalChange('')}>
            <svg className='branch-offices_modal__close-icon' xmlns="http://www.w3.org/2000/svg" height="16" width="12" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
          </a>
          <p className='branch-offices_modal__title'>Nueva sucursal</p>
        </div>
        <form onSubmit={createAdministrator}>
          <div className='branch-offices_modal__body'>
            <div className={`branch-offices_modal__fields ${!showCompanySelect ? 'branch-offices_modal__fields--two' : ''}`}>
              {showCompanySelect && (
                <div>
                  <label className='label__general'>Empresa</label>
                  <select
                    className='inputs__general'
                    value={fields.companyId ?? ''}
                    onChange={(e) => setFields({ ...fields, companyId: Number(e.target.value) })}
                  >
                    <option value='' disabled>Selecciona</option>
                    {companies?.dataSelect?.map((company: any) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className='label__general'>Nombre de sucursal</label>
                <input className='inputs__general' value={fields.name} onChange={(e) => setFields({ ...fields, name: e.target.value })} placeholder='Nombre de sucursal' type="text" />
              </div>
              <div>
                <label className='label__general'>Dirección</label>
                <input className='inputs__general' value={fields.address} onChange={(e) => setFields({ ...fields, address: e.target.value })} placeholder='Dirección' type="text" />
              </div>
            </div>
            <div className='branch-offices_modal__actions'>
              <div>
                <button className='btn__general-primary'>Crear nueva sucursal</button>
              </div>
            </div>

          </div>

        </form>
      </div>
    </div>,
    document.body
  );
};

export default ModalBranchOffices;
