import React, { useEffect, useState } from 'react';
import './ModalTickets.css';
import { useDispatch, useSelector } from "react-redux";
import { modal } from '../../../../../../redux/state/modals';
import APIs from '../../../../../../services/APIs';
import Swal from 'sweetalert2';

const ModalTickets: React.FC<any> = ({ companies, branch }) => {
  const userState = useSelector((store: any) => store.user);
  const dispatch = useDispatch();
  const modalState = useSelector((state: any) => state.modals);



  const fetch = async () => {
    try {

      setSelectCompany((prevState: any) => ({
        ...prevState,
        companies: companies,
      }));
      setSelectBranch((prevState: any) => ({
        ...prevState,
        branch: branch,
      }));
      setFields((prevState: any) => ({
        ...prevState,
        companyId: companies[0]?.id,
        branchId: branch[0]?.id,
        companyName: companies[0]?.name,
        branchName: branch[0]?.name,
      }));

    } catch (error) {

    }
  }

  useEffect(() => {
    fetch()
  }, [modalState])


  // Estado inicial para los campos del formulario
  const [fields, setFields] = useState<any>({
    companyId: null,
    branchId: null,
    companyName: '',
    branchName: '',
    comments: ''
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

  const handleModalChange = (value: any) => {
    dispatch(modal(value));
    // dispatch(updateAdministrator('reset'));
  };

  const [selectAdd, setSelectAdd] = useState<any>({
    types: [
      {
        id: 1,
        name: 'Codigo'
      },
      {
        id: 2,
        name: 'Nombre'
      }
    ],
    selectType: null,
    selectedType: null,
    selectResult: null,
    selectedResult: '',
    result: [],
    field: ''
  })

  const [concepts, setConcepts] = useState<any>([])






  const openSelectType = () => {
    setSelectAdd((prevState: any) => ({
      ...prevState,
      selectType: !prevState.selectType,
    }));
  }

  const handleTypeChange = async (type: any) => {
    setSelectAdd((prevState: any) => ({
      ...prevState,
      selectType: !prevState.selectType,
    }));

    setSelectAdd((prevState: any) => ({
      ...prevState,
      selectedType: type.id,
    }));
  }

  const openSelectResult = () => {
    setSelectAdd((prevState: any) => ({
      ...prevState,
      selectResult: !prevState.selectResult
    }));
  }

  const handleResultChange = (result: any) => {
    setSelectAdd((prevState: any) => ({
      ...prevState,
      selectResult: !prevState.selectResult,
      selectedResult: result
    }));




  }

  const search = async () => {
    try {
      if (selectAdd.selectedType == 1) {
        const response: any = await APIs.getProducts(selectAdd.field, '');
        setSelectAdd((prevState: any) => ({
          ...prevState,
          result: response.data
        }));
      }
      if (selectAdd.selectedType == 2) {
        const response: any = await APIs.getProducts('', selectAdd.field);
        setSelectAdd((prevState: any) => ({
          ...prevState,
          result: response.data
        }));
      }

    } catch (error) {
      console.error('Error al obtener los productos:', error);
    }
  }

  console.log(userState, userState)

  const createTickets = async () => {
    let data = {
      companyId: fields.companyId,
      companyName: fields.companyName,
      branchId: fields.branchId,
      branchName: fields.branchName,
      comments: fields.comments,
      userId: userState.id,
      concepts: concepts,
    };

    try {
      let response: any = await APIs.createTickets(data);
      Swal.fire({
        icon: 'success',
        title: 'Serie creada correctamente',
        text: response.message,
        confirmButtonColor: '#3085d6',
      });
      dispatch(modal(''));
    } catch (error: any) {
      console.error('Error al crear el ticket:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al crear la serie',
        text: error.response?.data?.message || 'Ocurrió un error inesperado',
        confirmButtonColor: '#d33',
      });
    }
  };


  const addTickets = () => {
    let data = {
      code: selectAdd.selectedResult.code,
      name: selectAdd.selectedResult.name,
      productId: selectAdd.selectedResult.id,
      quantity: 0,
      unitId: 0,
      storeId: 0,
      store: selectAdd.selectedResult.productStores,
      units: selectAdd.selectedResult.productUnits
    }
    setConcepts([...concepts, data])
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.trim();
    const parsedValue = value === '' ? null : parseFloat(value);

    const updatedConcepts = concepts.map((concept: any, i: number) =>
      i === index ? { ...concept, quantity: parsedValue } : concept
    );

    setConcepts(updatedConcepts);
  };


  const handlUnitsChange = (e: React.ChangeEvent<HTMLSelectElement>, index: number) => {
    const value = e.target.value.trim();
    const updatedConcepts = concepts.map((concept: any, i: number) =>
      i === index ? { ...concept, unit_id: value } : concept
    );
    setConcepts(updatedConcepts);

  };

  const handlStoreChange = (e: React.ChangeEvent<HTMLSelectElement>, index: number) => {
    const value = e.target.value.trim();
    const updatedConcepts = concepts.map((concept: any, i: number) =>
      i === index ? { ...concept, store_id: value } : concept
    );
    setConcepts(updatedConcepts);

  };


  const deleteBranch = (_: any, i: number) => {
    let filter = concepts.filter((_: any, index: any) => index !== i)
    setConcepts(filter)
  }


  console.log('branch', fields)

  return (
    <div className={`overlay__tickets_modal ${modalState === 'tickets_modal' ? 'active' : ''}`}>
      <div className={`popup__tickets_modal ${modalState === 'tickets_modal' ? 'active' : ''}`}>
        <div className='header__modal'>
          <a href="#" className="btn-cerrar-popup__tickets_modal" onClick={() => handleModalChange('')}>
            <svg className='svg__close' xmlns="http://www.w3.org/2000/svg" height="16" width="12" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
          </a>
          <p className='title__modals'>Nueva entrada</p>
        </div>
        <div className='tickets_modal'>
          <div className='tickets_modal_container'>
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
              <div className="col-4 comments">
                <label className='label__general'>Comentarios</label>
                <input className={`inputs__general`} type='text' value={fields.field} onChange={(e) => setFields({ ...fields, field: e.target.value })} placeholder='Comentarios' />
              </div>
            </div>
            <div className='row__two'>
              <div className='row__one'>
                <div className='select__container'>
                  <label className='label__general'>Buscar por</label>
                  <div className='select-btn__general'>
                    <div className={`select-btn ${selectAdd.selectType ? 'active' : ''}`} onClick={openSelectType}>
                      <p>{selectAdd.selectedType !== null ? selectAdd?.types.find((s: { id: number }) => s.id === selectAdd.selectedType)?.name : 'selecciona'}</p>
                      <svg className='chevron__down' xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" /></svg>
                    </div>
                    <div className={`content ${selectAdd.selectType ? 'active' : ''}`}>
                      <ul className={`options ${selectAdd.selectType ? 'active' : ''}`} style={{ opacity: selectAdd.selectType ? '1' : '0' }}>
                        {selectAdd?.types?.map((type: any) => (
                          <li key={type.id} onClick={() => handleTypeChange(type)}>
                            {type.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className='row__two'>
                  <div className="col-4 comments">
                    <label className='label__general'>Buscar por</label>
                    <input className={`inputs__general`} type='text' value={fields.comments} onChange={(e) => setFields({ ...fields, comments: e.target.value })} placeholder='Buscar' />
                  </div>
                  <div>
                    <button className='btn__general-primary' onClick={search}>Buscar</button>
                  </div>
                </div>
              </div>
              <div className='row__two'>
                <div className='select__container'>
                  <label className='label__general'>Resultado</label>
                  <div className='select-btn__general'>
                    <div className={`select-btn ${selectAdd.selectResult ? 'active' : ''}`} onClick={openSelectResult}>
                      <p>{selectAdd.selectedResult.id !== null ? selectAdd?.result?.find((s: { id: number }) => s.id === selectAdd.selectedResult.id)?.name : 'selecciona'}</p>
                      <svg className='chevron__down' xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" /></svg>
                    </div>
                    <div className={`content ${selectAdd.selectResult ? 'active' : ''}`}>
                      <ul className={`options ${selectAdd.selectResult ? 'active' : ''}`} style={{ opacity: selectAdd.selectResult ? '1' : '0' }}>
                        {selectAdd?.result?.map((result: any) => (
                          <li key={result.id} onClick={() => handleResultChange(result)}>
                            {result.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className=''>
                  <button className='btn__general-primary' onClick={addTickets}>Agregar</button>
                </div>
              </div>
            </div>
            <div className='table__tickets_modal' >
              <div>
                {concepts ? (
                  <div className='table__numbers'>
                    <p className='text'>Total de entradas</p>
                    <div className='quantities_tables'>{concepts.length}</div>
                  </div>
                ) : (
                  <p className='text'>No hay empresas</p>
                )}
              </div>
              <div className='table__head'>
                <div className='thead'>
                  <div className='th '>
                    <p className=''>Codigo / Nombre</p>
                  </div>
                  <div className='th movil'>
                    <p className=''>Cantidad</p>
                  </div>
                  <div className='th movil'>
                    <p className=''>Unidad</p>
                  </div>
                  <div className='th movil'>
                    <p className=''>Almacén </p>
                  </div>
                  <div className='th'>

                  </div>
                </div>
              </div>
              {concepts?.length > 0 ? (
                <div className='table__body'>
                  {concepts?.map((item: any, index: any) => (
                    <div className='tbody__container' key={index}>
                      <div className='tbody-desk'>
                        <div className='td'>
                          <p className='code-identifier'>{item.code}-{item.name}</p>
                        </div>
                        <div className='td'>
                          <input className={`inputs__general`} type='text' value={item.cantidad === null ? '' : item.cantidad} onChange={(e) => handleAmountChange(e, index)} placeholder='Comentarios' />
                        </div>
                        <div className='td'>

                          <select className='traditional__selector' onChange={(event) => handlUnitsChange(event, index)} value={item.unit_id} >
                            {item.units?.map((item: any) => (
                              <option key={item.id} value={item.unit_id}>
                                {item.unit.name}
                              </option>
                            ))}
                          </select>

                        </div>

                        <div className='td'>
                          <select className='traditional__selector' onChange={(event) => handlStoreChange(event, index)} value={item.store_id} >
                            {item.store?.map((item: any) => (
                              <option key={item.id} value={item.store_id}>
                                {item.store.name}
                              </option>
                            ))}
                          </select>
                        </div>


                        <div className='td edit'>
                          <div className='edit-icon'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-edit"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" /><path d="M16 5l3 3" /></svg>
                          </div>
                        </div>
                        <div className='td delete' onClick={() => deleteBranch(item, index)}>
                          <div className='delete-icon'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className=" icon icon-tabler icons-tabler-filled icon-tabler-trash"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20 6a1 1 0 0 1 .117 1.993l-.117 .007h-.081l-.919 11a3 3 0 0 1 -2.824 2.995l-.176 .005h-8c-1.598 0 -2.904 -1.249 -2.992 -2.75l-.005 -.167l-.923 -11.083h-.08a1 1 0 0 1 -.117 -1.993l.117 -.007h16z" /><path d="M14 2a2 2 0 0 1 2 2a1 1 0 0 1 -1.993 .117l-.007 -.117h-4l-.007 .117a1 1 0 0 1 -1.993 -.117a2 2 0 0 1 1.85 -1.995l.15 -.005h4z" /></svg>
                          </div>
                        </div>
                      </div>
                      <div className='tbody-response'>
                        <div className='td'>
                          <p className='code-identifier'>{item.code}-{item.name}</p>
                        </div>
                        <div className='td movil'>
                          <input className={`inputs__general`} type='text' value={item?.quantity === null ? '' : item?.quantity} onChange={(e) => handleAmountChange(e, index)} placeholder='Cantidad' />
                        </div>
                        <div className='td'>
                          <select className='traditional__selector' onChange={(event) => handlUnitsChange(event, index)} value={item.unit_id} >
                            {item.units?.map((item: any) => (
                              <option key={item.id} value={item.unit_id}>
                                {item.unit.name}
                              </option>
                            ))}
                          </select>

                        </div>

                        <div className='td'>
                          <select className='traditional__selector' onChange={(event) => handlStoreChange(event, index)} value={item.store_id} >
                            {item.store?.map((item: any) => (
                              <option key={item.id} value={item.store_id}>
                                {item.store.name}
                              </option>
                            ))}
                          </select>
                        </div>


                        <div className='td edit'>
                          <div className='edit-icon'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-edit"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" /><path d="M16 5l3 3" /></svg>
                          </div>
                        </div>
                        <div className='td delete' onClick={() => deleteBranch(item, index)}>
                          <div className='delete-icon'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className=" icon icon-tabler icons-tabler-filled icon-tabler-trash"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20 6a1 1 0 0 1 .117 1.993l-.117 .007h-.081l-.919 11a3 3 0 0 1 -2.824 2.995l-.176 .005h-8c-1.598 0 -2.904 -1.249 -2.992 -2.75l-.005 -.167l-.923 -11.083h-.08a1 1 0 0 1 -.117 -1.993l.117 -.007h16z" /><path d="M14 2a2 2 0 0 1 2 2a1 1 0 0 1 -1.993 .117l-.007 -.117h-4l-.007 .117a1 1 0 0 1 -1.993 -.117a2 2 0 0 1 1.85 -1.995l.15 -.005h4z" /></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text'>No hay máximos y mínimos que mostrar</p>
              )}
            </div>
          </div>
          <div className='row__three'>
            <button className='btn__general-primary' onClick={createTickets}>Crear entrada</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalTickets;
