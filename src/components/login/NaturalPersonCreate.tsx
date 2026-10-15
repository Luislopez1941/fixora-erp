import React, { useState } from 'react'
import './styles/NaturalPersonCreate.css'
import { useDispatch } from 'react-redux'
import { setStatusCreate } from '../../redux/state/login/Login'; // Importar la acción
import { setStatusLogin } from '../../redux/state/login/Login'; // Importar la acción
import APIs from '../../services/APIs';
import { toast } from 'sonner'


const NaturalPersonCreate: React.FC = () => {

  const dispatch = useDispatch();

  const changeStatus = () => {
    dispatch(setStatusCreate(false));
  }

  const [fields, setFields] = useState<any>({
    companyName: '',
    businessName: '',
    firstName: '',
    secondName: '',
    firstLastName: '',
    secondLastName: '',
    email: '',
    password: '',
    phone: '',
    type: 'NATURAL_PERSON'

  })


  const createNaturalPerson = async () => {
    try {
      let response: any = await APIs.createUser(fields)
      if (response.status == 'warning') {
        return toast.warning(response.message)
      }
      if (response.status == 'success') {
        return toast.success(response.message)
      }
    } catch (error) {
      toast.success('Error al crear la cuenta')
    }
  }


  return (
    <div className='natural_person_create'>

      <div className='container_head'>
        <h2>Crea tu cuenta personal</h2>
        <p>Administra tus empresas y accede a todas las funcionalidades</p>
      </div>
      <div className='row__one'>
        <div className='btn__moral-person'>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-user"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" /><path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" /></svg>
          <p>Cuenta normal</p>
        </div>
        <div className='btn__natural-person'>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-building"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 21l18 0" /><path d="M9 8l1 0" /><path d="M9 12l1 0" /><path d="M9 16l1 0" /><path d="M14 8l1 0" /><path d="M14 12l1 0" /><path d="M14 16l1 0" /><path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" /></svg>
          <p onClick={changeStatus}>Soy personas moral</p>
        </div>
      </div>
      <form className='form__natural_person'>
        <div className='form__natural_person_container'>
          {/* <div className='row__one'>
            <div>
              <label className='label__general'>Nombre de tu negocio</label>
              <input className='inputs__general' value={fields.businessName} onChange={(e) => setFields({ ...fields, businessName: e.target.value })} type="text" placeholder='Nombre' />
            </div>
          </div> */}
          <div className='row__two'>
            <div>
              <label className='label__general'>Primer nombre</label>
              <input className='inputs__general' value={fields.firstName} onChange={(e) => setFields({ ...fields, firstName: e.target.value })} type="text" placeholder='Nombre' />
            </div>
            <div>
              <label className='label__general'>Segundo nombre</label>
              <input className='inputs__general' value={fields.secondName} onChange={(e) => setFields({ ...fields, secondName: e.target.value })} type="text" placeholder='Opcional' />
            </div>
            <div>
              <label className='label__general'>Primer apellido</label>
              <input className='inputs__general' value={fields.firstLastName} onChange={(e) => setFields({ ...fields, firstLastName: e.target.value })} type="text" placeholder='Apellido' />
            </div>
            <div>
              <label className='label__general'>Segundo apellido</label>
              <input className='inputs__general' value={fields.secondLastName} onChange={(e) => setFields({ ...fields, secondLastName: e.target.value })} type="text" placeholder='Segundo Apellido' />
            </div>
            <div className='email'>
              <label className='label__general'>Correo electronico</label>
              <div className='inputs__general_icons'>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-mail"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M22 7.535v9.465a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-9.465l9.445 6.297l.116 .066a1 1 0 0 0 .878 0l.116 -.066l9.445 -6.297z" /><path d="M19 4c1.08 0 2.027 .57 2.555 1.427l-9.555 6.37l-9.555 -6.37a2.999 2.999 0 0 1 2.354 -1.42l.201 -.007h14z" /></svg>
                <input className='inputs__generic' value={fields.email} onChange={(e) => setFields({ ...fields, email: e.target.value })} type="text" placeholder='Correo electronico' />
              </div>
            </div>
            <div className='password'>
              <label className='label__general'>Contraseña</label>
              <div className='inputs__general_icons'>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-key"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14.52 2c1.029 0 2.015 .409 2.742 1.136l3.602 3.602a3.877 3.877 0 0 1 0 5.483l-2.643 2.643a3.88 3.88 0 0 1 -4.941 .452l-.105 -.078l-5.882 5.883a3 3 0 0 1 -1.68 .843l-.22 .027l-.221 .009h-1.172c-1.014 0 -1.867 -.759 -1.991 -1.823l-.009 -.177v-1.172c0 -.704 .248 -1.386 .73 -1.96l.149 -.161l.414 -.414a1 1 0 0 1 .707 -.293h1v-1a1 1 0 0 1 .883 -.993l.117 -.007h1v-1a1 1 0 0 1 .206 -.608l.087 -.1l1.468 -1.469l-.076 -.103a3.9 3.9 0 0 1 -.678 -1.963l-.007 -.236c0 -1.029 .409 -2.015 1.136 -2.742l2.643 -2.643a3.88 3.88 0 0 1 2.741 -1.136m.495 5h-.02a2 2 0 1 0 0 4h.02a2 2 0 1 0 0 -4" /></svg>
                <input className='inputs__generic' value={fields.password} onChange={(e) => setFields({ ...fields, password: e.target.value })} type="text" placeholder='Contraseña' />
              </div>
            </div>
            <div className='phone'>
              <label className='label__general'>Numero telefonico</label>
              <div className='inputs__general_icons'>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-phone"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 3a1 1 0 0 1 .877 .519l.051 .11l2 5a1 1 0 0 1 -.313 1.16l-.1 .068l-1.674 1.004l.063 .103a10 10 0 0 0 3.132 3.132l.102 .062l1.005 -1.672a1 1 0 0 1 1.113 -.453l.115 .039l5 2a1 1 0 0 1 .622 .807l.007 .121v4c0 1.657 -1.343 3 -3.06 2.998c-8.579 -.521 -15.418 -7.36 -15.94 -15.998a3 3 0 0 1 2.824 -2.995l.176 -.005h4z" /></svg>
                <input className='inputs__generic' value={fields.phone} onChange={(e) => setFields({ ...fields, phone: e.target.value })} type="text" placeholder='998 465 ****' />
              </div>
            </div>
          </div>
        </div>
        <div className='row__three'>
          <div className='btn__create'>
            <button className='btn__general-primary' type='button' onClick={createNaturalPerson}>Crear una demo</button>
          </div>
          <div className='btn__login'>
            <button type='button' onClick={() => dispatch(setStatusLogin(false))}>Iniciar sesión</button>
          </div>

        </div>
      </form>
    </div>

  )
}

export default NaturalPersonCreate
