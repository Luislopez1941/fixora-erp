import React, { useEffect, useState } from 'react';
import './ModalAreas.css';
import { useDispatch, useSelector } from "react-redux";
import { modal } from '../../../../../../redux/state/modals';
import APIs from '../../../../../../services/APIs';
import { setAreas } from '../../../../../../redux/state/Configurations/Areas';
import Swal from 'sweetalert2';



const ModalAreas: React.FC = () => {
  const modalState = useSelector((state: any) => state.modals);
  const userState = useSelector((store: any) => store.user);
  const dispatch = useDispatch();

  const handleModalChange = (value: any) => {
    dispatch(modal(value));
  };



  const [tickets, setTickets] = useState<any>([])


  const [branch, setBranch] = useState<any>([])
  console.log(tickets, branch)

  const fetch = async () => {

    try {
      let response: any = await APIs.getCompanies(userState.id)
      let dataG = {
        companyId: response.data[0].id,
        branchId: 0
      }
      let tickets = await APIs.getTickets(dataG)
      setTickets(tickets)
      let data = {
        userId: userState.id,
        companyId: response.data[0].id
      }
      let result: any = await APIs.getBranch(data)
      setBranch(result.data)
      result.data.unshift({
        id: 0,
        name: "Sin sucursal"
      });
      setSelectBranch((prevState: any) => ({
        ...prevState,
        branch: result.data,
      }));
      setSelectCompany((prevState: any) => ({
        ...prevState,
        companies: response.data,
      }));
      setFields((prevState: any) => ({
        ...prevState,
        companyId: response.data[0].id,
        // Con una sola sucursal real se usa esa por defecto (el select se oculta).
        branchId: (result.data.filter((b: any) => b.id !== 0).length === 1 ? result.data.find((b: any) => b.id !== 0) : result.data[0]).id,
        companyName: response.data[0].name,
        branchName: (result.data.filter((b: any) => b.id !== 0).length === 1 ? result.data.find((b: any) => b.id !== 0) : result.data[0]).name,
      }));

    } catch (error) {

    }
  }

  useEffect(() => {
    fetch()
  }, [])


  // Estado inicial para los campos del formulario
  const [fields, setFields] = useState<any>({
    companyId: null,
    branchId: null,
    companyName: '',
    branchName: '',
    name: '',
    predetermined: false
  })

  const [selectCompany, setSelectCompany] = useState<any>({
    selectCompany: false,
    companies: []
  })

  const openSelectCompany = () => {
    setSelectCompany((prevState: any) => ({
      ...prevState,
      selectCompany: !prevState.selectCompany, // Close the dropdown on selection
    }));
  }

  const handleCompanyChange = async (company: any) => {
    setSelectCompany((prevState: any) => ({
      ...prevState,
      selectCompany: !prevState.selectCompany,
    }));
    setSelectBranch((prevState: any) => ({
      ...prevState,
      companyId: company.id,
      companyName: company.name,

    }));

    let data = {
      userId: userState.id,
      companyId: company.id
    }
    let response: any = await APIs.getBranch(data)
    response.data.unshift({
      id: 0,
      name: "Sin sucursal"
    });
    setSelectBranch((prevState: any) => ({
      ...prevState,
      branch: response.data, // Close the dropdown on selection
    }));

    setFields((prevState: any) => ({
      ...prevState,
      companyId: company.id,
      companyName: company.name,
      branchId: response.data[0].id,
      branchName: response.data[0].name,
    }));
  }

  const [selectBranch, setSelectBranch] = useState<any>({
    selectBranch: false,
    branch: []
  })

  const openSelectBranch = () => {
    setSelectBranch((prevState: any) => ({
      ...prevState,
      selectBranch: !prevState.selectBranch, // Close the dropdown on selection
    }));
  }

  const handleBranchChange = (branch: any) => {
    setSelectBranch((prevState: any) => ({
      ...prevState,
      selectBranch: !prevState.selectBranch
    }));

    setFields((prevState: any) => ({
      ...prevState,
      branchId: branch.id,
      branchName: branch.name,
    }));
  }


  const createArea = async () => {
    try {
      let data = {
        companyId: fields.companyId,
        branchId: fields.branchId, // corregido typo de "brnachId"
        name: fields.name,
        production: fields.predetermined,
      };
      let response: any = await APIs.createAreas(data);

      Swal.fire({
        icon: 'success',
        title: 'Serie creada correctamente',
        text: response.message,
        confirmButtonColor: '#3085d6',
      });
      let result: any = await APIs.getAreas(data)
      dispatch(setAreas(result.data));
      dispatch(modal(''));

    } catch (error: any) {
      // En caso de error, muestra alerta de error
      Swal.fire({
        icon: 'error',
        title: 'Error al crear la serie',
        text: error.response?.data?.message || 'Ocurrió un error inesperado',
        confirmButtonColor: '#d33',
      });
    }
  };

  const selectPredeterminada = (_: any) => {
    const exist = selectBranch.branch.filter((x: any) => x.predeterminado_empresa == true)
    if (exist.length > 0) {
      Swal.fire('Notificacion', 'Ya existe una empresa predeterminada para este almacen: ' + exist[0].empresa, 'info')
      return
    }
    setFields((prevState: any) => ({
      ...prevState,
      predetermined: !fields.predetermined
    }));

  }



  return (
    <div className={`overlay__areas_modal ${modalState === 'areas_modal' ? 'active' : ''}`}>
      <div className={`popup__areas_modal ${modalState === 'areas_modal' ? 'active' : ''}`}>
        <div className='header__modal'>
          <a href="#" className="btn-cerrar-popup__areas_modal" onClick={() => handleModalChange('')}>
            <svg className='svg__close' xmlns="http://www.w3.org/2000/svg" height="16" width="12" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
          </a>
          <p className='title__modals'>Crear nueva área</p>
        </div>
        <div className='areas_modal'>
          <div className='areas_modal_container'>
            <div className='row__one'>
              {(selectCompany?.companies?.length ?? 0) > 1 && (
              <div className='select__container'>
                <label className='label__general'>Empresa</label>
                <div className='select-btn__general'>
                  <div className={`select-btn ${selectCompany.selectCompany ? 'active' : ''}`} onClick={openSelectCompany}>
                    <p>{fields.companyId !== null ? selectCompany.companies.find((s: { id: number }) => s.id === fields.companyId)?.name : 'selecciona'}</p>
                    <svg className='chevron__down' xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" /></svg>
                  </div>
                  <div className={`content ${selectCompany.selectCompany ? 'active' : ''}`}>
                    <ul className={`options ${selectCompany.selectCompany ? 'active' : ''}`} style={{ opacity: selectCompany.selectCompany ? '1' : '0' }}>
                      {selectCompany?.companies?.map((company: any) => (
                        <li key={company.id} onClick={() => handleCompanyChange(company)}>
                          {company.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              )}
              {(selectBranch?.branch?.filter((b: any) => b.id !== 0).length ?? 0) > 1 && (
              <div className='select__container'>
                <label className='label__general'>Sucursal</label>
                <div className='select-btn__general'>
                  <div className={`select-btn ${selectBranch.selectBranch ? 'active' : ''}`} onClick={openSelectBranch}>
                    <p>{fields.branchId !== null ? selectBranch.branch.find((s: { id: number }) => s.id === fields.branchId)?.name : 'selecciona'}</p>
                    <svg className='chevron__down' xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" /></svg>
                  </div>
                  <div className={`content ${selectBranch.selectBranch ? 'active' : ''}`}>
                    <ul className={`options ${selectBranch.selectBranch ? 'active' : ''}`} style={{ opacity: selectBranch.selectBranch ? '1' : '0' }}>
                      {selectBranch?.branch?.map((branch: any) => (
                        <li key={branch.id} onClick={() => handleBranchChange(branch)}>
                          {branch.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              )}
              <div>
                <label className='label__general'>Nombre</label>
                <input className='inputs__general' value={fields.name} onChange={(e) => setFields({ ...fields, name: e.target.value })} placeholder='Nombre' type="text" />
              </div>
              <div className=''>
                <label className='label__general'>Predeterminado</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={fields.predetermined} // Asignar el valor del estado al atributo 'checked'
                    onChange={(e) => { selectPredeterminada(e.target.checked); }}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
            <div className='row__two'>
             
            </div>
            <div className='row__three'>
              <div>
                <button className='btn__general-primary' onClick={createArea}>Crear área</button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default ModalAreas;
