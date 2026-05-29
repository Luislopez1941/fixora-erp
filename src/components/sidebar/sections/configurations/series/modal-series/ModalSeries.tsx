import React, { useEffect, useState } from 'react';
import './ModalSeries.css';
import { useDispatch, useSelector } from "react-redux";
import { modal } from '../../../../../../redux/state/modals';
import APIs from '../../../../../../services/APIs';
import Select from '../../../../../general/Select';
import Swal from 'sweetalert2';
import { SERIES_MODULE_TYPES } from '../../../../../../constants/catalogTypes';
import { setSeries } from '../../../../../../redux/state/Configurations/Series';



const ModalSeries: React.FC = () => {
  const modalState = useSelector((state: any) => state.modals);
  const userState = useSelector((store: any) => store.user);
  const dispatch = useDispatch();
  const select = useSelector((store: any) => store.select);

  const handleModalChange = (value: any) => {
    dispatch(modal(value));
  };

  const [nameModules] = useState<any>(SERIES_MODULE_TYPES.map((item) => ({
    id: item.id,
    name: item.label,
  })))


  const [tickets, setTickets] = useState<any>([])

  const [typeSeries, setTypeSeries] = useState<any>([])
  const [branch, setBranch] = useState<any>([])
  console.log(tickets, branch)

  const fetch = async () => {
    setTypeSeries({
      selectName: 'Para',
      dataSelect: nameModules,
      options: 'name',
    })
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
        companies: result.data,
      }));
      setFields((prevState: any) => ({
        ...prevState,
        companyId: response.data[0].id,
        branchId: result.data[0].id,
        companyName: response.data[0].name,
        branchName: result.data[0].name,
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
    name: ''
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


  const createSeries = async () => {
    try {
      let data = {
        companyId: fields.companyId,
        branchId: fields.branchId, // corregido typo de "brnachId"
        name: fields.name,
        type: select.selectedItems.typeSeries.id,
      };
      let response: any = await APIs.createSeries(data);
      
      Swal.fire({
        icon: 'success',
        title: 'Serie creada correctamente',
        text: response.message,
        confirmButtonColor: '#3085d6',
      });
      let result: any = await APIs.getSeries(data)
      dispatch(setSeries(result.data));
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

 

  return (
    <div className={`overlay__series_modal ${modalState === 'series_modal' ? 'active' : ''}`}>
      <div className={`popup__series_modal ${modalState === 'series_modal' ? 'active' : ''}`}>
        <div className='header__modal'>
          <a href="#" className="btn-cerrar-popup__series_modal" onClick={() => handleModalChange('')}>
            <svg className='svg__close' xmlns="http://www.w3.org/2000/svg" height="16" width="12" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
          </a>
          <p className='title__modals'>Crear nueva serie</p>
        </div>
        <div className='series_modal'>
          <div className='series_modal_container'>
            <div className='row__one'>
          
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
            </div>
            <div className='row__two'>
              <div>
                <label className='label__general'>Nombre</label>
                <input className='inputs__general' value={fields.name} onChange={(e) => setFields({ ...fields, name: e.target.value })} placeholder='Nombre' type="text" />
              </div>
              <div>
                <Select dataSelects={typeSeries} instanceId="typeSeries" nameSelect="Para" />
              </div>
              <div className=''>
              
              </div>
            </div>
            <div className='row__three'>
              <div>
                <button className='btn__general-primary' onClick={createSeries}>Crear serie</button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default ModalSeries;
