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

// Registrar Service Worker para PWA (solo en producción). En desarrollo interceptaba y copiaba al caché cada módulo que sirve
// Vite (cientos por recarga), lo que hacía lentas las recargas; además se quita el que haya quedado registrado de antes.
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
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
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()))
    if ('caches' in window) caches.keys().then((keys) => keys.filter((k) => k.startsWith('fixora-')).forEach((k) => caches.delete(k)))
  }
}
