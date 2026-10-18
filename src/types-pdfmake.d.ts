// pdfmake 0.3 no trae tipos propios: solo lo que usa el PDF del reporte de ventas (src/modules/reports/ventas/salesPdf.ts)
declare module 'pdfmake/build/pdfmake' {
  const pdfMake: any
  export default pdfMake
}
declare module 'pdfmake/build/vfs_fonts' {
  const vfs: Record<string, string>
  export default vfs
}
