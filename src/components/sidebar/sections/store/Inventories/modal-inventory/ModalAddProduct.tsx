import React, { useCallback, useState } from 'react';
import './ModalAddProduct.css';
import { useDispatch, useSelector } from "react-redux";
import { modal } from '../../../../../../redux/state/modals';
import Select from '../../../../../general/Select';
import { setModal } from '../../../../../../redux/state/store/Inventory';
import Branch from './modals/Branch';
import Units from './modals/Units';
import Store from './modals/Store';
import { useDropzone } from 'react-dropzone';
import APIs from '../../../../../../services/APIs';


const ModalInventory = () => {

  const dispatch = useDispatch();

  // Asegúrate de que el tipo de state es AppStore
  const modalState = useSelector((state: any) => state.modals);

  const branch = useSelector((state: any) => state.inventory.branch);
  const store = useSelector((state: any) => state.inventory.store);
  const units = useSelector((state: any) => state.inventory.units);




  const handleModalChange = (value: any) => {
    dispatch(modal(value));
    // dispatch(updateAdministrator('reset'));


  };



  const [fields, setFields] = useState<any>({
    codigo: '',
    name: '',
    description: '',
    barcode: '',
    photos: []
  })

  const createAdministrator = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let data = {
      code: fields.code,
      name: fields.name,
      description: fields.description,
      barcode: fields.barcode,
      photos: fields.photos,
      branch: branch,
      store: store,
      units: units
    }

    try {
      APIs.createProducts(data)
    } catch (error) {

    }


  };

  const [type, setType] = useState<number>(1)

  const typeChange = (value: number) => {
    setType(value)
  }


  const handleModalProductChange = (value: any) => {
    dispatch(setModal(value));
  };


  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      // Convierte el archivo a base64 y lo guarda en el estado
      const base64Image = reader.result as string;
      setFields((prev: any) => ({
        ...prev,
        photos: [...prev.photos, base64Image],
      }));
    };

    // Lee el archivo como base64
    if (file) {
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': []
    },
    maxFiles: 1
  });



  return (
    <div className={`overlay__inventory_modal ${modalState === 'inventory_modal' ? 'active' : ''}`}>
      <div className={`popup__inventory_modal ${modalState === 'inventory_modal' ? 'active' : ''}`}>
        <div className='header__modal'>
          <a href="#" className="btn-cerrar-popup__inventory_modal" onClick={() => handleModalChange('')}>
            <svg className='svg__close' xmlns="http://www.w3.org/2000/svg" height="16" width="12" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
          </a>
          <p className='title__modals'>Venta</p>
        </div>
        <form className='inventory_modal' onSubmit={createAdministrator}>
          <div className='options'>
            <button className={`${type == 1 ? 'active' : ''}`} onClick={() => typeChange(1)}>Productos</button>
            <button className={`${type == 2 ? 'active' : ''}`} onClick={() => typeChange(2)}>Productos</button>
          </div>
          <div className='inventory_modal_container'>

            <div className='row__one'>
              <div className='row__one'>
                <div>
                  <label className='label__general'>Codigo</label>
                  <input className='inputs__general' value={fields.code} onChange={(e) => setFields({ ...fields, code: e.target.value })} placeholder='Buscar' type="text" name="" id="" />
                </div>
                <div>
                  <label className='label__general'>Nombre del producto</label>
                  <input className='inputs__general' value={fields.name} onChange={(e) => setFields({ ...fields, name: e.target.value })} placeholder='Buscar' type="text" name="" id="" />
                </div>
                <div>
                  <label className='label__general'>Descripción</label>
                  <input className='inputs__general' value={fields.description} onChange={(e) => setFields({ ...fields, description: e.target.value })} placeholder='Buscar' type="text" name="" id="" />
                </div>
                <div>
                  <label className='label__general'>Codígo de barras</label>
                  <input className='inputs__general' value={fields.barcode} onChange={(e) => setFields({ ...fields, barcode: e.target.value })} placeholder='Codígo de barra' type="text" name="" id="" />
                </div>

                <div>
                  <Select
                    dataSelects={{
                      selectName: "Empresa",
                      dataSelect: [
                        { id: 1, name: "Empresa A" },
                        { id: 2, name: "Empresa B" },
                      ],
                      options: 'name',
                    }}
                    instanceId="empresa"
                    nameSelect="Categorías"
                  />
                </div>



              </div>
              <div className="row__two">
                <div
                  {...getRootProps()}
                  className="dropzone"
                  style={{
                    border: '2px dashed #aaa',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: '10px'
                  }}
                >
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <p>Suelta la imagen aquí...</p>
                  ) : (
                    <p>Arrastra una imagen o haz clic para seleccionarla</p>
                  )}
                </div>

                {fields.photos && fields.photos.length > 0 && (
                  <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {fields.photos.map((photo: string, index: number) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Vista previa ${index}`}
                        style={{ maxWidth: '150px', borderRadius: '10px' }}
                      />
                    ))}
                  </div>
                )}

              </div>
            </div>
            <div className='row__two'>
              <div className='item' onClick={() => handleModalProductChange('branch_modal-product')}>
                <svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 -960 960 960" width="30" fill="#e8eaed"><path d="M200-800h560q17 0 28.5 11.5T800-760q0 17-11.5 28.5T760-720H200q-17 0-28.5-11.5T160-760q0-17 11.5-28.5T200-800Zm0 640q-17 0-28.5-11.5T160-200v-200h-7q-19 0-31-14.5t-8-33.5l40-200q3-14 14-23t25-9h574q14 0 25 9t14 23l40 200q4 19-8 33.5T807-400h-7v200q0 17-11.5 28.5T760-160q-17 0-28.5-11.5T720-200v-200H560v200q0 17-11.5 28.5T520-160H200Zm40-80h240v-160H240v160Z" /></svg>
              </div>
              <div className='item' onClick={() => handleModalProductChange('store_modal-product')}>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M440-91 160-252q-19-11-29.5-29T120-321v-318q0-22 10.5-40t29.5-29l280-161q19-11 40-11t40 11l280 161q19 11 29.5 29t10.5 40v318q0 22-10.5 40T800-252L520-91q-19 11-40 11t-40-11Zm0-366v274l40 23 40-23v-274l240-139v-42l-43-25-237 137-237-137-43 25v42l240 139Z" /></svg>
              </div>
              <div className='item' onClick={() => handleModalProductChange('units_modal-product')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e8eaed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-scale"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 20l10 0" /><path d="M6 6l6 -1l6 1" /><path d="M12 3l0 17" /><path d="M9 12l-3 -6l-3 6a3 3 0 0 0 6 0" /><path d="M21 12l-3 -6l-3 6a3 3 0 0 0 6 0" /></svg>
              </div>
            </div>
          </div>
          <div className='row__three'>
            <button className='btn__general-primary'>Crear producto</button>
          </div>
        </form>
        <Branch />
        <Store />
        <Units />
      </div>
    </div>
  );
};

export default ModalInventory;
