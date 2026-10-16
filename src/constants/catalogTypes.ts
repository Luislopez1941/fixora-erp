export const SERIES_MODULE_TYPES = [
  { id: 1, code: 'REQUISITION', label: 'Requisición', areaType: 'PURCHASES' },
  { id: 2, code: 'PURCHASE_ORDER', label: 'Orden de compra', areaType: 'PURCHASES' },
  { id: 3, code: 'STOCK_ENTRY', label: 'Entrada de almacén', areaType: 'WAREHOUSE' },
  { id: 4, code: 'SALE', label: 'Ventas', areaType: 'SALES' },
  { id: 5, code: 'PRODUCTION', label: 'Producción', areaType: 'PRODUCTION' },
  { id: 6, code: 'QUOTATION', label: 'Cotización', areaType: 'SALES' },
  { id: 7, code: 'SALES_ORDER', label: 'Orden de venta', areaType: 'SALES' },
  { id: 8, code: 'STOCK_EXIT', label: 'Salida de almacén', areaType: 'WAREHOUSE' },
  { id: 9, code: 'SALE_RETURN', label: 'Devolución de venta', areaType: 'SALES' },
];

export const getSeriesTypeLabel = (typeId?: number | null) =>
  SERIES_MODULE_TYPES.find((item) => item.id === typeId)?.label ??
  (typeId != null ? `Tipo ${typeId}` : '—');
