import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Puerto fijo por proyecto: fixora-erp 5173, fixora-admin-erp 5174. strictPort evita que dos Vite compartan el puerto
  // (uno en IPv4 y otro en IPv6), lo que hacía que localhost respondiera con la app equivocada.
  server: { port: 5173, strictPort: true },
})
