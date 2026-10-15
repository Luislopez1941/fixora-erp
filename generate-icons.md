# Generar iconos para PWA

## Opción 1: Usando una herramienta online (más fácil)

1. Ve a: https://www.pwabuilder.com/imageGenerator
2. Sube tu logo (preferiblemente 512x512 px)
3. Descarga los iconos generados
4. Coloca `icon-192.png` y `icon-512.png` en `/public/`

## Opción 2: Manualmente con tu logo actual

Si tienes un logo en `/src/assets/`, puedes usar ImageMagick:

```bash
# Instalar ImageMagick (si no lo tienes)
brew install imagemagick

# Generar iconos desde tu logo
convert src/assets/astra.svg -resize 192x192 public/icon-192.png
convert src/assets/astra.svg -resize 512x512 public/icon-512.png
```

## Opción 3: Usar un placeholder temporal

Por ahora, puedes usar iconos de placeholder:
- Descarga cualquier icono cuadrado
- Renómbralo a `icon-192.png` y `icon-512.png`
- Colócalos en `/public/`

## Verificar que funciona

1. Ejecuta `npm run dev`
2. Abre Chrome DevTools
3. Ve a Application > Manifest
4. Deberías ver "Fixora ERP" con los iconos
5. Click en "Install" para instalar la app
