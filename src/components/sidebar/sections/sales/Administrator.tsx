import React, { useEffect, useState } from 'react';
import APIs from '../../../../services/APIs';
import './Administrator.css';
import Modal from './Modal';
import { useDispatch } from 'react-redux';// Importa la interfaz AppStore
import { modal } from '../../../../redux/state/modals'; // Importa la acción modal


const Administrator: React.FC = () => {

  const [user, setUser] = useState<any>([])
  const [currentPage] = useState<number>(1)
  const [pages, setPages] = useState<any>([1])

  const token: any = localStorage.getItem('token-fixora')

  const fetch = async () => {
    let data = {
      filtro: 'Todos',
      currentPage: currentPage,
      token: token
    }
    let resultUsers: any = await APIs.getUsers(data)
    setUser(resultUsers.data)
    setPages(resultUsers.pagination.pages)
  }

  useEffect(() => {
    fetch()
  }, [])


  const dispatch = useDispatch();
  


  const handleModalChange = (value: any) => {
    dispatch(modal(value));
  };

  const [search, setSearch] = useState<any>('')

  const modalUpdate = (_: any) => {
    handleModalChange('administrator-modal')

  }

  const updateStatus = async (item: any)  => {
    let id = item._id
    try {
      let result = await APIs.updateStatus(id, {status: item.state}, token);
      console.log(result)
      fetch()
    } catch (error) {
      console.error(error);
    }
  }

  const sendPaginated = async (index: any) => {
    let data = {
      filtro: 'Todos',
      currentPage: index + 1,
      token: token
    }
    let resultUsers: any = await APIs.getUsers(data)
    setUser(resultUsers.data)
    setPages(resultUsers.pagination.pages)
  }
 
  const searchEngineFilter = async () => {
    if(search) {
      let data = {
        email: search,
        token: token
      }
      let resultUsers: any = await APIs.searchUser(data)
      setUser(resultUsers.data)

    }
  }

  return (
    <div className='administrator'>
      <div className='administrator__container'>
        <div className='row__one'>
          <div className='input__search'>
            <div>
              <input className='inputs__general' value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder='Buscar'/>
            </div>
            <div className='icon__search' onClick={searchEngineFilter}>
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#f5f6f7"><path d="M380-320q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l224 224q11 11 11 28t-11 28q-11 11-28 11t-28-11L532-372q-30 24-69 38t-83 14Zm0-80q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>
            </div>
          </div>
          <div className='btn__create-user__container'>
            <button className='btn__general-purple' onClick={() => handleModalChange('administrator-modal')}>
              Crear usuarios
            </button>
          </div>
        </div>
        <Modal />
        <div className='table__administrators' >
          <div>
            {user ? (
              <div className='table__numbers'>
                  <p className='text'>Total de administradores</p>
                  <div className='quantities_tables'>{user.length}</div>
              </div>
              ) : (
                  <p className='text'>No hay empresas</p>
              )}
          </div>
          <div className='table__head'>
            <div className='thead'>
              <div className='th '>
                  <p className=''>Nombres</p>
              </div>
              <div className='th movil'>
                  <p className=''>Apellidos</p>
              </div>
              <div className='th movil'>
                  <p className=''>Email</p>
              </div>
              <div className='th movil'>
                  <p className=''>Estado</p>
              </div>
              <div className='th'>
                  
              </div>
            </div>
          </div>
          {user?.length > 0 ? (
            <div className='table__body'>
                {user?.map((item: any, index: any) => (
                    <div className='tbody__container' key={index}>
                        <div className='tbody'>
                            <div className='td'>
                                {item.name}
                            </div>
                            <div className='td movil'>
                              {item.surnames}
                            </div>
                            <div className='td movil'>
                                {item.email}
                            </div>
                            <div className='td movil'>
                              {item.state == true ? 
                              <div className='activated-status' onClick={() => updateStatus(item)}>
                                <p>Activo</p>
                              </div>
                              :
                              <div className='idle-status' onClick={() => updateStatus(item)}>
                                <p>Inactivo</p>
                              </div>
                              }
                            </div>
                            <div className='td update'>
                                <button className='btn__general-purple' type='button' onClick={() => modalUpdate(item)}>Editar</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          ) : (
              <p className='text'>No hay máximos y mínimos que mostrar</p>
          )}
        </div>
        <div className='row__two'>
          <div className='pagination__container'>
          {Array.from({ length: pages }, (_, index) => (
            <div className='item' onClick={() => sendPaginated(index)} key={index}>
             <p>{index + 1}</p>
           </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Administrator;


            