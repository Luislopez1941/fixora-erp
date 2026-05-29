import type { ModuleManifest } from './module.types'

/**
 * Registro de módulos del frontend (acoplar/desacoplar).
 *
 * Cada entrada es un módulo del ERP. El sidebar se construye a partir de esta
 * lista, ordenada por `order`. Para AGREGAR un módulo (ej: restaurante,
 * condominios) basta con añadir un objeto aquí; para QUITARLO, se elimina o se
 * pone `enabled: false`.
 *
 * Las `key` deben coincidir con las del backend para sincronizar con
 * /kernel/modules.
 *
 * Las rutas son relativas al área privada (se les antepone `/auth/`).
 */
export const MODULES: ModuleManifest[] = [
  {
    key: 'dashboard',
    label: 'Panel',
    icon: 'dashboard',
    order: 0,
    path: '',
    requiredPermission: 'dashboard.view',
  },
  {
    key: 'sales',
    label: 'Ventas',
    icon: 'tag',
    order: 20,
    requiredPermission: 'sales.view',
    children: [
      { key: 'sales.sheet', label: 'Ficha de venta', path: 'sales/sales-sheet', requiredPermission: 'sales.sheet.view' },
      { key: 'sales.quote', label: 'Cotización', path: 'sales/sales-sheet', requiredPermission: 'sales.quote.view' },
      { key: 'sales.order', label: 'Orden de venta', path: 'sales/sales-sheet', requiredPermission: 'sales.order.view' },
    ],
  },
  {
    key: 'cobranza',
    label: 'Cobranza',
    icon: 'cash',
    order: 30,
    requiredPermission: 'cobranza.view',
    children: [
      { key: 'cobranza.credit', label: 'Cuentas de crédito', path: 'cobranza/credit-accounts', requiredPermission: 'cobranza.credit.view' },
      { key: 'cobranza.debtors', label: 'Deudores', path: 'cobranza/debtors', requiredPermission: 'cobranza.debtors.view' },
      { key: 'cobranza.payments', label: 'Abonos', path: 'cobranza/credit-payments', requiredPermission: 'cobranza.payments.view' },
    ],
  },
  {
    key: 'shopping',
    label: 'Compras',
    icon: 'cart',
    order: 40,
    requiredPermission: 'shopping.view',
    children: [
      { key: 'shopping.requisition', label: 'Requisición', path: 'shopping/requisitions', requiredPermission: 'shopping.requisition.view' },
      { key: 'shopping.purchase', label: 'Orden de compra', path: 'shopping', requiredPermission: 'shopping.purchase.view' },
    ],
  },
  {
    key: 'cash-register',
    label: 'Caja',
    icon: 'box',
    order: 50,
    requiredPermission: 'cash.view',
    children: [
      { key: 'cash.register', label: 'Caja Actual', path: 'shopping', requiredPermission: 'cash.register.view' },
    ],
  },
  {
    key: 'production',
    label: 'Producción',
    icon: 'production',
    order: 60,
    requiredPermission: 'production.view',
    children: [
      { key: 'production.orders', label: 'Órdenes de producción', path: 'production/orders', requiredPermission: 'production.orders.view' },
      { key: 'production.queue', label: 'Cola', path: 'production/queue', requiredPermission: 'production.queue.view' },
      { key: 'production.areas', label: 'Áreas', path: 'production/areas', requiredPermission: 'production.areas.view' },
      { key: 'production.categories', label: 'Categorías', path: 'production/categories', requiredPermission: 'production.categories.view' },
    ],
  },
  {
    key: 'store',
    label: 'Almacén',
    icon: 'warehouse',
    order: 70,
    requiredPermission: 'store.view',
    children: [
      { key: 'store.warehouse', label: 'Almacén', path: 'store', requiredPermission: 'store.warehouse.view' },
      { key: 'store.inventory', label: 'Inventario', path: 'store/inventory', requiredPermission: 'store.inventory.view' },
      { key: 'store.tickets', label: 'Entradas', path: 'store/tickets', requiredPermission: 'store.tickets.view' },
      { key: 'store.orders', label: 'Pedidos', path: 'store/orders', requiredPermission: 'store.orders.view' },
      { key: 'store.departures', label: 'Salidas', path: 'store/departures', requiredPermission: 'store.departures.view' },
    ],
  },
  {
    key: 'catalogos',
    label: 'Catálogos',
    icon: 'catalog',
    order: 80,
    requiredPermission: 'catalogos.view',
    children: [
      { key: 'catalogos.types', label: 'Tipos y áreas', path: 'catalogos/tipos-areas', requiredPermission: 'catalogos.types.view' },
      { key: 'catalogos.familias', label: 'Familias', path: 'catalogos/familias', requiredPermission: 'catalogos.familias.view' },
      { key: 'catalogos.containers', label: 'Contenedores', path: 'catalogos/contenedores', requiredPermission: 'catalogos.containers.view' },
      { key: 'catalogos.categories', label: 'Categorías', path: 'catalogos/categories', requiredPermission: 'catalogos.categories.view' },
      { key: 'catalogos.units', label: 'Unidades', path: 'catalogos/units', requiredPermission: 'catalogos.units.view' },
      { key: 'catalogos.services', label: 'Servicios', path: 'catalogos/services', requiredPermission: 'catalogos.services.view' },
      { key: 'catalogos.articles', label: 'Artículos', path: 'catalogos/articles', requiredPermission: 'catalogos.articles.view' },
      { key: 'catalogos.prices', label: 'Rangos de Precio', path: 'catalogos/price-ranges', requiredPermission: 'catalogos.prices.view' },
    ],
  },
  {
    key: 'reports',
    label: 'Reportes',
    icon: 'report',
    order: 90,
    requiredPermission: 'reports.view',
    path: 'reports',
  },
  {
    key: 'income',
    label: 'Ingresos',
    icon: 'income',
    order: 100,
    requiredPermission: 'income.view',
    path: 'income',
  },
  {
    key: 'users',
    label: 'Usuarios',
    icon: 'user',
    order: 110,
    requiredPermission: 'users.view',
    children: [
      { key: 'users.staff', label: 'Personal', path: 'configurations/users', requiredPermission: 'users.view' },
      { key: 'users.roles', label: 'Roles y permisos', path: 'configurations/roles', requiredPermission: 'roles.view' },
    ],
  },
  {
    key: 'module-store',
    label: 'Tienda de Módulos',
    icon: 'module_store',
    order: 130,
    path: 'module-store',
    ownerOnly: true,
  },
  {
    key: 'configurations',
    label: 'Configuraciones',
    icon: 'settings',
    order: 120,
    requiredPermission: 'configurations.view',
    children: [
      { key: 'configurations.companies', label: 'Empresas', path: 'configurations/companies', requiredPermission: 'configurations.companies.view' },
      { key: 'configurations.branch', label: 'Sucursales', path: 'configurations/branch-offices', requiredPermission: 'configurations.branch.view' },
      { key: 'configurations.series', label: 'Series', path: 'configurations/series', requiredPermission: 'configurations.series.view' },
      { key: 'configurations.areas', label: 'Áreas', path: 'configurations/areas', requiredPermission: 'configurations.areas.view' },
      { key: 'configurations.users', label: 'Usuarios', path: 'configurations/users', requiredPermission: 'configurations.users.view' },
      { key: 'configurations.roles', label: 'Roles', path: 'configurations/roles', requiredPermission: 'configurations.roles.view' },
      { key: 'configurations.franchise', label: 'Franquicia', path: 'configurations/categories', requiredPermission: 'configurations.franchise.view' },
    ],
  },
]
