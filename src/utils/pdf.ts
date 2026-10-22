/**
 * pdfmake compartido (reporte de ventas, arqueos…): se carga con import dinámico una sola vez, solo al exportar.
 * También da los colores del tema para que los PDF sigan la marca.
 */
let pdfMakePromise: Promise<any> | null = null

export async function loadPdfMake() {
  if (!pdfMakePromise) {
    pdfMakePromise = Promise.all([import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts')]).then(([pdfMod, fontsMod]: any[]) => {
      const pdfMake = pdfMod.default ?? pdfMod
      const fonts = fontsMod.default ?? fontsMod
      if (typeof pdfMake.addVirtualFileSystem === 'function') pdfMake.addVirtualFileSystem(fonts)
      else pdfMake.vfs = fonts?.pdfMake?.vfs ?? fonts?.vfs ?? fonts
      return pdfMake
    })
    pdfMakePromise.catch(() => {
      pdfMakePromise = null
    })
  }
  return pdfMakePromise
}

/** Color de una variable del tema (--primary-color…) o el de respaldo. */
export const cssVar = (name: string, fallback: string) => {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return /^#[0-9a-f]{6}$/i.test(v) ? v : fallback
  } catch {
    return fallback
  }
}

/** Mezcla un color con blanco (0 = color, 1 = blanco) para fondos suaves. */
export const tint = (hex: string, amount: number) => {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, '0')
  return `#${mix((n >> 16) & 255)}${mix((n >> 8) & 255)}${mix(n & 255)}`
}
