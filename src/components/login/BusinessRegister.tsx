import React, { useState, useEffect } from 'react'
import './styles/BusinessRegister.css'
import { useDispatch } from 'react-redux'
import { setStatusLogin } from '../../redux/state/login/Login'
import APIs from '../../services/APIs'
import { toast } from 'sonner'
import logoFixora from '../../assets/logo-fixora.png'

const BusinessRegister: React.FC = () => {
  const dispatch = useDispatch()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 2
  const [isCreating, setIsCreating] = useState(false)

  const [fields, setFields] = useState({
    companyName: '',
    businessName: '',
    firstName: '',
    firstLastName: '',
    email: '',
    password: '',
    phone: '',
    type: 'MORAL_PERSON',
    businessTypeId: ''
  })

  const [businessTypes, setBusinessTypes] = useState<any[]>([])

  useEffect(() => {
    const loadBusinessTypes = async () => {
      try {
        const response: any = await APIs.getBusinessTypes()
        if (response?.data) {
          setBusinessTypes(response.data)
        }
      } catch (error) {
        console.error('Error cargando giros:', error)
      }
    }
    loadBusinessTypes()
  }, [])

  const updateField = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const createAccount = async () => {
    setIsCreating(true)
    try {
      const payload = {
        ...fields,
        businessTypeId: fields.businessTypeId ? parseInt(fields.businessTypeId, 10) : undefined
      }
      const response: any = await APIs.createUser(payload)
      if (response.status === 'warning') {
        setIsCreating(false)
        return toast.warning(response.message)
      }
      if (response.status === 'success') {
        toast.success(response.message)
        setTimeout(() => {
          setIsCreating(false)
          dispatch(setStatusLogin(false))
        }, 1000)
      }
    } catch (error) {
      setIsCreating(false)
      toast.error('Error al crear la cuenta')
    }
  }

  return (
    <div className='business-register'>
      {isCreating && (
        <div className='business-register__loading-overlay'>
          <div className='business-register__loading-content'>
            <div className='business-register__spinner'></div>
            <h3>Creando tu cuenta...</h3>
            <p>Configurando módulos y preparando tu negocio</p>
          </div>
        </div>
      )}
      <div className='business-register__head'>
        <div className='business-register__logo'>
          <img src={logoFixora} alt="Fixora logo" />
        </div>
        <h2>Crea tu cuenta</h2>
        <p>Paso {currentStep} de {totalSteps}</p>
      </div>

      {/* Barra de progreso */}
      <div className='business-register__progress'>
        <div className='business-register__progress-bar' style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
      </div>

      <form className='business-register__form'>
        {/* Paso 1: Datos personales */}
        {currentStep === 1 && (
          <div className='business-register__section'>
            <h3 className='business-register__section-title'>Tus datos personales</h3>
            <div className='business-register__row'>
              <div className='business-register__field'>
                <label className='label__general'>Nombre</label>
                <input
                  className='inputs__general'
                  value={fields.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  type='text'
                  placeholder='Nombre'
                />
              </div>
              <div className='business-register__field'>
                <label className='label__general'>Apellido</label>
                <input
                  className='inputs__general'
                  value={fields.firstLastName}
                  onChange={(e) => updateField('firstLastName', e.target.value)}
                  type='text'
                  placeholder='Apellido'
                />
              </div>
              <div className='business-register__field'>
                <label className='label__general'>Correo electrónico</label>
                <div className='inputs__general_icons'>
                  <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                    <path stroke='none' d='M0 0h24v24H0z' fill='none' />
                    <path d='M22 7.535v9.465a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-9.465l9.445 6.297l.116 .066a1 1 0 0 0 .878 0l.116 -.066l9.445 -6.297z' />
                    <path d='M19 4c1.08 0 2.027 .57 2.555 1.427l-9.555 6.37l-9.555 -6.37a2.999 2.999 0 0 1 2.354 -1.42l.201 -.007h14z' />
                  </svg>
                  <input
                    className='inputs__generic'
                    value={fields.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    type='text'
                    placeholder='correo@ejemplo.com'
                  />
                </div>
              </div>
              <div className='business-register__field'>
                <label className='label__general'>Contraseña</label>
                <div className='inputs__general_icons'>
                  <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                    <path stroke='none' d='M0 0h24v24H0z' fill='none' />
                    <path d='M14.52 2c1.029 0 2.015 .409 2.742 1.136l3.602 3.602a3.877 3.877 0 0 1 0 5.483l-2.643 2.643a3.88 3.88 0 0 1 -4.941 .452l-.105 -.078l-5.882 5.883a3 3 0 0 1 -1.68 .843l-.22 .027l-.221 .009h-1.172c-1.014 0 -1.867 -.759 -1.991 -1.823l-.009 -.177v-1.172c0 -.704 .248 -1.386 .73 -1.96l.149 -.161l.414 -.414a1 1 0 0 1 .707 -.293h1v-1a1 1 0 0 1 .883 -.993l.117 -.007h1v-1a1 1 0 0 1 .206 -.608l.087 -.1l1.468 -1.469l-.076 -.103a3.9 3.9 0 0 1 -.678 -1.963l-.007 -.236c0 -1.029 .409 -2.015 1.136 -2.742l2.643 -2.643a3.88 3.88 0 0 1 2.741 -1.136m.495 5h-.02a2 2 0 1 0 0 4h.02a2 2 0 1 0 0 -4' />
                  </svg>
                  <input
                    className='inputs__generic'
                    value={fields.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    type='password'
                    placeholder='Contraseña'
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paso 2: Datos del negocio */}
        {currentStep === 2 && (
          <div className='business-register__section'>
            <h3 className='business-register__section-title'>Datos de tu negocio</h3>
            <div className='business-register__row'>
              <div className='business-register__field business-register__field--full'>
                <label className='label__general'>Nombre de tu negocio</label>
                <input
                  className='inputs__general'
                  value={fields.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  type='text'
                  placeholder='Ej. Abarrotes La Esquina'
                />
              </div>
              <div className='business-register__field business-register__field--full'>
                <label className='label__general'>Razón social (opcional)</label>
                <input
                  className='inputs__general'
                  value={fields.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                  type='text'
                  placeholder='Ej. La Esquina S.A. de C.V.'
                />
              </div>
              <div className='business-register__field'>
                <label className='label__general'>Teléfono</label>
                <div className='inputs__general_icons'>
                  <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                    <path stroke='none' d='M0 0h24v24H0z' fill='none' />
                    <path d='M9 3a1 1 0 0 1 .877 .519l.051 .11l2 5a1 1 0 0 1 -.313 1.16l-.1 .068l-1.674 1.004l.063 .103a10 10 0 0 0 3.132 3.132l.102 .062l1.005 -1.672a1 1 0 0 1 1.113 -.453l.115 .039l5 2a1 1 0 0 1 .622 .807l.007 .121v4c0 1.657 -1.343 3 -3.06 2.998c-8.579 -.521 -15.418 -7.36 -15.94 -15.998a3 3 0 0 1 2.824 -2.995l.176 -.005h4z' />
                  </svg>
                  <input
                    className='inputs__generic'
                    value={fields.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    type='text'
                    placeholder='998 465 ****'
                  />
                </div>
              </div>
              <div className='business-register__field'>
                <label className='label__general'>Giro de tu negocio</label>
                <select
                  className='inputs__general'
                  value={fields.businessTypeId}
                  onChange={(e) => updateField('businessTypeId', e.target.value)}
                >
                  <option value=''>Selecciona un giro</option>
                  {businessTypes.map((bt: any) => (
                    <option key={bt.id} value={bt.id}>
                      {bt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className='business-register__actions'>
          {currentStep > 1 && (
            <button className='business-register__btn-secondary' type='button' onClick={prevStep}>
              Atrás
            </button>
          )}
          {currentStep < totalSteps ? (
            <button className='business-register__btn-primary' type='button' onClick={nextStep}>
              Siguiente
            </button>
          ) : (
            <button 
              className='business-register__btn-primary' 
              type='button' 
              onClick={createAccount}
              disabled={isCreating}
            >
              {isCreating ? 'Creando...' : 'Crear cuenta'}
            </button>
          )}
        </div>

        {currentStep === 1 && (
          <button className='business-register__login-btn' type='button' onClick={() => dispatch(setStatusLogin(false))}>
            Ya tengo cuenta, iniciar sesión
          </button>
        )}
      </form>
    </div>
  )
}

export default BusinessRegister
