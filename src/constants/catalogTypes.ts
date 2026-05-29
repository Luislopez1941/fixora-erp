export const AREA_TYPE_META: Record<
  string,
  { label: string; description: string; color: string }
> = {
  GENERAL: {
    label: 'General',
    description: 'Áreas administrativas o de uso general',
    color: '#8b919c',
  },
  SALES: {
    label: 'Ventas',
    description: 'Ficha de venta, cotizaciones y pedidos',
    color: '#586ae9',
  },
  PURCHASES: {
    label: 'Compras',
    description: 'Requisiciones y órdenes de compra',
    color: '#14b8a6',
  },
  WAREHOUSE: {
    label: 'Almacén',
    description: 'Entradas, salidas e inventario',
    color: '#ffb74d',
  },
  PRODUCTION: {
    label: 'Producción',
    description: 'Procesos de maquila y fabricación',
    color: '#ef5350',
  },
  ADMIN: {
    label: 'Administración',
    description: 'Configuración y control interno',
    color: '#9575cd',
  },
};

export const AREA_TYPE_OPTIONS = Object.entries(AREA_TYPE_META).map(
  ([value, meta]) => ({
    value,
    ...meta,
  }),
);

export const SERIES_MODULE_TYPES = [
  { id: 1, code: 'REQUISITION', label: 'Requisición', areaType: 'PURCHASES' },
  { id: 2, code: 'PURCHASE_ORDER', label: 'Orden de compra', areaType: 'PURCHASES' },
  { id: 3, code: 'STOCK_ENTRY', label: 'Entrada de almacén', areaType: 'WAREHOUSE' },
  { id: 4, code: 'SALE', label: 'Ventas', areaType: 'SALES' },
  { id: 5, code: 'PRODUCTION', label: 'Producción', areaType: 'PRODUCTION' },
  { id: 6, code: 'QUOTATION', label: 'Cotización', areaType: 'SALES' },
  { id: 7, code: 'SALES_ORDER', label: 'Orden de venta', areaType: 'SALES' },
  { id: 8, code: 'STOCK_EXIT', label: 'Salida de almacén', areaType: 'WAREHOUSE' },
];

export const getAreaTypeLabel = (type?: string | null) =>
  AREA_TYPE_META[type ?? 'GENERAL']?.label ?? type ?? 'General';

export const getSeriesTypeLabel = (typeId?: number | null) =>
  SERIES_MODULE_TYPES.find((item) => item.id === typeId)?.label ??
  (typeId != null ? `Tipo ${typeId}` : '—');
