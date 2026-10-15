import React from 'react'
import Header from '../../components/header/Header'
import './SettingUp.css'

interface Props {
  retrying: boolean
  onRetry: () => void
  onBack: () => void
}

// Se ve como si el usuario YA estuviera adentro (mismo header que el resto del
// ERP) en vez de quedarse en la pantalla de login — la cuenta existe, solo falta
// que termine de prepararse su base de datos.
const SettingUp: React.FC<Props> = ({ retrying, onRetry, onBack }) => {
  return (
    <div className='root-page'>
      <div className='container'>
        <Header />
        <div className='main setting-up__main'>
          <div className='setting-up__card'>
            <div className='setting-up__icon'>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                <path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm40-240H440v-240h80v160h160v80Z" />
              </svg>
            </div>
            {retrying ? (
              <>
                <h2>Configuración en proceso…</h2>
                <p>Estamos preparando tu cuenta ahora mismo. No cierres esta ventana.</p>
              </>
            ) : (
              <>
                <h2>Configurando tu ERP…</h2>
                <p>
                  Tu cuenta ya existe, pero tu base de datos todavía se está preparando.
                  Esto puede tardar unos minutos — lo intentamos de nuevo automáticamente,
                  no necesitas hacer nada.
                </p>
                <div className='setting-up__actions'>
                  <button className='btn__general-purple' type='button' onClick={onRetry}>
                    Reintentar ahora
                  </button>
                  <button className='btn__create' type='button' onClick={onBack}>
                    Volver al login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingUp
