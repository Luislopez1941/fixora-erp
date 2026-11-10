/**
 * Descarga un archivo generado en el navegador. Nada sale a internet: el archivo se arma en memoria
 * y se entrega al usuario. La URL temporal se libera unos segundos después (si se libera de inmediato,
 * Safari y Firefox pueden cancelar la descarga).
 */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
