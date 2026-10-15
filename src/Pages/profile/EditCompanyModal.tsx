import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import APIs from '../../services/APIs'
import Swal from 'sweetalert2'
import './Modal.css'

interface EditCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  company: any
}

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({ isOpen, onClose, onSuccess, company }) => {
  const user = useSelector((state: any) => state.user)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    logo: '',
    taxId: '',
  })

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        businessName: company.businessName || '',
        logo: company.logo || '',
        taxId: company.taxId || '',
      })
    }
  }, [company])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.businessName) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos obligatorios',
        text: 'Por favor, completa el nombre y la razón social.',
        customClass: {
          confirmButton: 'swal-confirm-btn',
        },
      })
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        userId: user.id,
      }

      await APIs.updateCompany(company.id, payload)

      Swal.fire({
        icon: 'success',
        title: '¡Actualizado!',
        text: 'Empresa actualizada exitosamente',
        customClass: {
          confirmButton: 'swal-confirm-btn',
        },
        timer: 2000,
        timerProgressBar: true,
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error en handleSubmit:', error)

      const errorMessage = typeof error === 'string'
        ? error
        : (error?.message || error?.response?.data?.message || 'Error al actualizar la empresa')

      const isWarning = errorMessage.toLowerCase().includes('rfc') || errorMessage.toLowerCase().includes('registrado')

      Swal.fire({
        icon: isWarning ? 'warning' : 'error',
        title: isWarning ? 'Atención' : 'Error',
        text: errorMessage,
        customClass: {
          confirmButton: 'swal-confirm-btn',
        },
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='company-modal-overlay' onClick={onClose}>
      <div className='modal-content' onClick={(e) => e.stopPropagation()}>
        <div className='modal-header'>
          <h2 className='modal-title'>Editar Empresa</h2>
          <button className='modal-close' onClick={onClose} type='button'>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className='modal-form'>
          <div className='modal-form-row'>
            <div className='modal-field'>
              <label className='modal-label'>
                Nombre de la Empresa <span className='modal-required'>*</span>
              </label>
              <div className='modal-input-wrapper'>
                <svg className='modal-input-icon' xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <input
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  className='modal-input'
                  placeholder='Ej: Mi Empresa S.A.'
                  required
                />
              </div>
            </div>

            <div className='modal-field'>
              <label className='modal-label'>
                Razón Social <span className='modal-required'>*</span>
              </label>
              <div className='modal-input-wrapper'>
                <svg className='modal-input-icon' xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <input
                  type='text'
                  name='businessName'
                  value={formData.businessName}
                  onChange={handleChange}
                  className='modal-input'
                  placeholder='Ej: Mi Empresa S.A. de C.V.'
                  required
                />
              </div>
            </div>
          </div>

          <div className='modal-form-row'>
            <div className='modal-field'>
              <label className='modal-label'>RFC / Tax ID</label>
              <div className='modal-input-wrapper'>
                <svg className='modal-input-icon' xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
                  <line x1="7" y1="8" x2="17" y2="8"></line>
                  <line x1="7" y1="12" x2="17" y2="12"></line>
                  <line x1="7" y1="16" x2="13" y2="16"></line>
                </svg>
                <input
                  type='text'
                  name='taxId'
                  value={formData.taxId}
                  onChange={handleChange}
                  className='modal-input'
                  placeholder='Ej: ABC123456XYZ'
                />
              </div>
            </div>

            <div className='modal-field'>
              <label className='modal-label'>Logo (URL)</label>
              <div className='modal-input-wrapper'>
                <svg className='modal-input-icon' xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 15"></polyline>
                </svg>
                <input
                  type='text'
                  name='logo'
                  value={formData.logo}
                  onChange={handleChange}
                  className='modal-input'
                  placeholder='https://ejemplo.com/logo.png'
                />
              </div>
            </div>
          </div>

          {formData.logo && (
            <div className='modal-logo-preview'>
              <p className='modal-preview-label'>Vista previa del logo:</p>
              <img src={formData.logo} alt='Logo Preview' className='modal-logo-img' onError={(e) => (e.currentTarget.style.display = 'none')} />
            </div>
          )}

          <div className='modal-actions'>
            <button
              type='button'
              className='modal-btn modal-btn-secondary'
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type='submit'
              className='modal-btn modal-btn-primary'
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditCompanyModal
