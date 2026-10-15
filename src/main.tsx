import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

try { document.documentElement.setAttribute('data-theme', localStorage.getItem('crm-theme') || 'light') } catch { document.documentElement.setAttribute('data-theme', 'light') }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado:', registration.scope)
      })
      .catch((error) => {
        console.log('❌ Error al registrar Service Worker:', error)
      })
  })
}
