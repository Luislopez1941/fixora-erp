import React, { useEffect, useState } from 'react';
import APIs from '../../../../services/APIs';
import { useDispatch, useSelector } from "react-redux";
import { modal } from '../../../../redux/state/modals';
import Swal from 'sweetalert2';
import './Modal.css';

const Modal = () => {

  const dispatch = useDispatch();
  
  // Asegúrate de que el tipo de state es AppStore
  const modalState = useSelector((state: any) => state.modals);

  const administratorUpdate = useSelector((state: any) => state.administrator);
  
  const token: any = localStorage.getItem('token-fixora');

  const handleModalChange = (value: any) => {
    dispatch(modal(value));
    setData({
      name: '',
      surnames: '',
      email: '',
      password: '',
      rol: '',
    });

  };

  console.log(administratorUpdate)
  
  useEffect(() => {
    if(administratorUpdate) {
      setData({
        name: administratorUpdate.name,
        surnames: administratorUpdate.surnames,
        email: administratorUpdate.email,
        rol: administratorUpdate.rol,
        token: token
      });
    }
  }, [administratorUpdate])
  
  const [roles] = useState<any>([
    {
      id: 1,
      name: 'Administrativo'
    },
    {
      id: 2,
      name: 'Cliente'
    }
  ]);




  // Estado inicial para los campos del formulario
  const [data, setData] = useState<any>({
    name: '',
    surnames: '',
    email: '',
    password: '',
    rol: '',
    token: token
  });

  // Función para actualizar el estado de `data`
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setData((prevData: any) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const [creating, setCreating] = useState<boolean>(false);

  const createAdministrator = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);

   if(administratorUpdate) {

    try {
      const result: any = await APIs.updateAdministrator(administratorUpdate._id, {email: data.email, rol: data.rol }, token);
      Swal.fire({
        title: result.status === 'warning' ? 'Advertencia' : 'Éxito',
        text: result.message,
        icon: result.status === 'warning' ? 'warning' : 'success'
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Hubo un error al crear el administrador',
        icon: 'error'
      });
    }
   } else {
    try {
      const result: any = await APIs.createAdministrator(data);
      Swal.fire({
        title: result.status === 'warning' ? 'Advertencia' : 'Éxito',
        text: result.message,
        icon: result.status === 'warning' ? 'warning' : 'success'
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Hubo un error al crear el administrador',
        icon: 'error'
      });
    }
   }

    setCreating(false);
  };

  const [selectAdministrator, setSelectAdministrator] = useState<boolean>(false);
  const [selectedAdministrator, setSelectedAdministrator] = useState<any>(null);

  const openSelectAdministrator = () => {
    setSelectAdministrator(!selectAdministrator);
  };

  const handleAdministratorChange = (administrator: any) => {
    setSelectedAdministrator(administrator);
    setData((prevData: any) => ({
      ...prevData,
      rol: administrator.name // Actualiza el rol en el estado `data`
    }));
    setSelectAdministrator(false);
  };


  return (
    <div className={`overlay__modal_administrator ${modalState === 'administrator-modal' ? 'active' : ''}`}>
      <div className={`popup__modal_administrator ${modalState === 'administrator-modal' ? 'active' : ''}`}>
        <div className='header__modal'>
          <a href="#" className="btn-cerrar-popup__modal_administrator" onClick={() => handleModalChange('')}>
            <svg className='svg__close' xmlns="http://www.w3.org/2000/svg" height="16" width="12" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
          </a>
          <p className='title__modals'>Precios</p>
        </div>
        <form className='administrator-modal' onSubmit={createAdministrator}>
          <div className='administrator-modal_container'>
            <div className='row__one'>
              <div>
                <label className='label__general'>Nombre</label>
                <input name="name" className={`inputs__general ${administratorUpdate == null ? '' : 'disabled'}`} disabled={administratorUpdate !== null} type="text" value={data.name} onChange={handleChange} placeholder='Ingresa el nombre' />
              </div>
              <div>
                <label className='label__general'>Apellidos</label>
                <input name="surnames" className={`inputs__general ${administratorUpdate == null ? '' : 'disabled'}`} disabled={administratorUpdate !== null}  type="text" value={data.surnames} onChange={handleChange} placeholder='Ingresa los apellidos' />
              </div>
              <div>
                <label className='label__general'>Email</label>
                <input name="email" className="inputs__general" type="email" value={data.email} onChange={handleChange} placeholder='Ingresa el email' />
              </div>
              <div>
                <label className='label__general'>Contraseña</label>
                <input name="password" className="inputs__general" type="password" value={data.password} onChange={handleChange} placeholder='Ingresa la contraseña' />
              </div>
              <div className='select__container'>
                <label className='label__general'>Rol</label>
                <div className='select-btn__general'>
                  <div className={`select-btn ${selectAdministrator ? 'active' : ''}`} onClick={openSelectAdministrator}>
                    <div className='select__container_title'>
                      <p>{selectedAdministrator ? roles.find((s: { id: number }) => s.id === selectedAdministrator.id)?.name : 'Selecciona'}</p>
                    </div>
                    <svg className='chevron__down' xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" /></svg>
                  </div>
                  <div className={`content ${selectAdministrator ? 'active' : ''}`}>
                    <ul className={`options ${selectAdministrator ? 'active' : ''}`} style={{ opacity: selectAdministrator ? '1' : '0' }}>
                      {roles?.map((administrator: any) => (
                        <li key={administrator.id} onClick={() => handleAdministratorChange(administrator)}>
                          {administrator.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='btn__create-administrator_container'>
            <button type="submit" className="btn__general-purple" disabled={creating}>
              {creating ? (
                <>
                  {administratorUpdate == undefined ? 'Creando sdministrador' : 'Actualizando administrador'}
                  <span className="loader_btn"></span>
                </>
              ) : (
                <p>{administratorUpdate == undefined ? 'Crear Administrador' : 'Actualizar administrador'}</p>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Modal;
