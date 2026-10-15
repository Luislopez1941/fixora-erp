import React, { useState } from 'react'
import Header from '../../components/header/Header'
import APIs from '../../services/APIs'
import { toast } from 'sonner'
import './SettingUp.css'

interface Props {
  token: string
  onActivated: () => void
  onBack: () => void
}

// Misma idea visual que SettingUp (se ve como si ya estuviera adentro del ERP) —
// pero aquí la cuenta y la base YA están listas, solo falta una licencia activa
// para saber qué módulos desbloquearle.
const ActivateLicense: React.FC<Props> = ({ token, onActivated, onBack }) => {
  const [licenseKey, setLicenseKey] = useState('')
  const [activating, setActivating] = useState(false)

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      toast.warning('Ingresa tu clave de licencia')
      return
    }
    setActivating(true)
    try {
      await APIs.activateLicense(licenseKey.trim(), token)
      toast.success('Licencia activada')
      onActivated()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'No se pudo activar la licencia')
    } finally {
      setActivating(false)
    }
  }

  return (
    <div className='root-page'>
      <div className='container'>
        <Header />
        <div className='main setting-up__main'>
          <div className='setting-up__card'>
            <div className='setting-up__icon'>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                <path d="M480-80 200-240v-320L40-660l440-220 440 220-160 100v400L480-80Zm0-274 280-145v-241L480-566 200-740v241l280 145Zm0-172L720-640l-240-114-240 114 240 114Zm0 400 160-80v-233l-160 88-160-88v233l160 80ZM480-526Z" />
              </svg>
            </div>
            <h2>Activa tu licencia</h2>
            <p>
              Tu cuenta y tu base de datos ya están listas. Ingresa la clave de
              licencia que te dio Fixora para desbloquear los módulos de tu plan.
            </p>
            <div className='activate-license__input'>
              <input
                className='inputs__generic'
                type='text'
                placeholder='XXXX-XXXX-XXXX-XXXX'
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                disabled={activating}
              />
            </div>
            <div className='setting-up__actions'>
              <button className='btn__general-purple' type='button' onClick={handleActivate} disabled={activating}>
                {activating ? 'Activando…' : 'Activar licencia'}
              </button>
              <button className='btn__create' type='button' onClick={onBack} disabled={activating}>
                Volver al login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivateLicense
