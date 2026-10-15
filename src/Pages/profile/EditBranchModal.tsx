import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import APIs from '../../services/APIs'
import { toast } from 'sonner'
import './Modal.css'

interface EditBranchModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  branch: any
}

const EditBranchModal: React.FC<EditBranchModalProps> = ({ isOpen, onClose, onSuccess, branch }) => {
  const user = useSelector((state: any) => state.user)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
  })

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        address: branch.address || '',
      })
    }
  }, [branch])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      toast.warning('Por favor ingresa el nombre de la sucursal')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        userId: user.id,
      }

      const response: any = await APIs.updateBranch(branch.id, payload)
      
      if (response?.status === 'success') {
        toast.success('Sucursal actualizada exitosamente')
        onSuccess()
        onClose()
      } else {
        toast.error(response?.message || 'Error al actualizar la sucursal')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar la sucursal')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='company-modal-overlay' onClick={onClose}>
      <div className='modal-content' onClick={(e) => e.stopPropagation()}>
        <div className='modal-header'>
          <h2>Editar Sucursal</h2>
          <button className='modal-close' onClick={onClose} type='button'>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className='modal-form'>
          <div className='modal-field'>
            <label className='modal-label'>
              Nombre de la Sucursal <span className='modal-required'>*</span>
            </label>
            <input
              type='text'
              name='name'
              value={formData.name}
              onChange={handleChange}
              className='modal-input'
              placeholder='Ej: Sucursal Centro'
              required
            />
          </div>

          <div className='modal-field'>
            <label className='modal-label'>Dirección</label>
            <textarea
              name='address'
              value={formData.address}
              onChange={handleChange}
              className='modal-textarea'
              placeholder='Ej: Calle Principal #123, Col. Centro'
              rows={3}
            />
          </div>

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

export default EditBranchModal
