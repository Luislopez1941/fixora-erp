# 🚀 Tu app ya está configurada como PWA!

## ✅ Lo que ya está hecho:

1. ✅ `manifest.json` - Configuración de la app
2. ✅ `sw.js` - Service Worker para offline
3. ✅ Meta tags en `index.html`
4. ✅ Registro del Service Worker en `main.tsx`
5. ✅ Componente `InstallPWA` para botón de instalación

## 📋 Pasos para probar:

### 1. Crear los iconos (IMPORTANTE)

Necesitas 2 iconos en `/public/`:
- `icon-192.png` (192x192 px)
- `icon-512.png` (512x512 px)

**Opción A - Rápida (placeholder):**
```bash
# Descarga cualquier logo cuadrado y renómbralo
# O usa https://www.pwabuilder.com/imageGenerator
```

**Opción B - Con tu logo:**
```bash
# Si tienes ImageMagick instalado
brew install imagemagick
convert src/assets/astra.svg -resize 192x192 public/icon-192.png
convert src/assets/astra.svg -resize 512x512 public/icon-512.png
```

### 2. Ejecutar en modo desarrollo

```bash
npm run dev
```

### 3. Verificar en Chrome DevTools

1. Abre Chrome DevTools (F12)
2. Ve a la pestaña **Application**
3. En el menú izquierdo, click en **Manifest**
4. Deberías ver:
   - Name: "Fixora ERP"
   - Icons: 192x192 y 512x512
   - Display: standalone
   - Theme color: #3f7dc0

5. En **Service Workers**, deberías ver:
   - Status: activated and running
   - Source: /sw.js

### 4. Instalar la app

**En Chrome (escritorio):**
- Verás un icono de instalación en la barra de direcciones (➕)
- O un botón flotante "Instalar App" en la esquina inferior derecha
- Click para instalar

**En Chrome (móvil):**
- Menú (⋮) → "Instalar app" o "Agregar a pantalla de inicio"

### 5. Probar modo offline

1. Instala la app
2. En DevTools → Network → Marca "Offline"
3. Recarga la página
4. ✅ Debería seguir funcionando (cache)

## 🎯 Resultado:

- ✅ Se instala como app nativa
- ✅ Icono en escritorio/dock
- ✅ Se abre sin barra de navegador
- ✅ Funciona offline (básico)
- ✅ Parece app de escritorio

## 🚀 Para producción:

Cuando hagas build para producción:

```bash
npm run build
```

El Service Worker y manifest se incluirán automáticamente.

## 📱 Probar en móvil:

1. Haz build: `npm run build`
2. Sirve en red local: `npx serve -s dist -p 3000`
3. Abre desde tu celular: `http://TU_IP:3000`
4. Instala desde el navegador móvil

## 🎨 Personalizar:

Edita `/public/manifest.json` para cambiar:
- Nombre de la app
- Colores
- Iconos
- Shortcuts (atajos)
- Orientación

## ⚠️ Notas importantes:

1. **HTTPS requerido** en producción (localhost funciona sin HTTPS)
2. Los iconos deben ser **cuadrados** (1:1)
3. El Service Worker se actualiza automáticamente
4. Funciona en Chrome, Edge, Safari (limitado), Firefox

## 🔍 Troubleshooting:

**No aparece botón de instalación:**
- Verifica que los iconos existan
- Revisa la consola por errores
- Asegúrate que manifest.json sea válido

**Service Worker no se registra:**
- Revisa la consola
- Verifica que `/sw.js` sea accesible
- Limpia cache y recarga

**App no funciona offline:**
- El Service Worker necesita tiempo para cachear
- Recarga 2-3 veces después de instalar
- Verifica en Application → Cache Storage

¡Listo! Tu app ya es instalable como PWA 🎉
