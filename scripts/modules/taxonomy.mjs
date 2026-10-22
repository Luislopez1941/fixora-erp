/**
 * TAXONOMÍA DE MÓDULOS DE FIXORA — fuente única.
 *
 * Aquí se define TODO el menú: módulos → grupos → pantallas. De este archivo `generate.mjs` genera:
 *   · el menú lateral y el menú de celular del frontend (con grupos),
 *   · las rutas de las pantallas nuevas (hasta que exista su archivo, muestran "en construcción"),
 *   · una carpeta por pantalla en `src/modules/<módulo>/<grupo>/<pantalla>/` para ir creando sus archivos,
 *   · el catálogo de módulos de licencia y los permisos del backend y del panel de admin.
 *
 * Cómo renombrar o agregar (y luego correr `node scripts/modules/generate.mjs`):
 *   · Renombrar una etiqueta  → cambia el texto. La `key` del módulo NO se renombra nunca: es la clave de la licencia.
 *   · Agregar una pantalla    → agrega su nombre al arreglo del grupo.
 *   · Agregar un módulo       → agrega un objeto a MODULES con su `key` nueva, `label`, `icon` y `order`.
 *   · Pantalla que YA existe   → `live('Etiqueta', 'ruta/existente', 'permiso.existente')` (conserva ruta y permiso actuales).
 *   · Una pantalla nueva se identifica por la ruta  <módulo>/<grupo>/<pantalla>  y el permiso  <módulo>.<grupo>-<pantalla>.view
 *     (ambos salen del nombre; no se escriben a mano).
 *
 * `includedIn`: otras licencias que ya incluyen este módulo (así las licencias que ya existen no se quedan sin él).
 */

/** Pantalla nueva que usa un permiso que ya existe (no genera permisos propios): ruta nueva, permiso `permission`. */
const own = (label, permission) => ({ label, permission });

/** Pantalla que ya existe en el ERP: conserva su ruta y su permiso actuales. */
const live = (label, path, permission) => ({ label, path, permission, live: true });

export const MODULES = [
  {
    key: 'dashboard', label: 'Panel', icon: 'dashboard', symbol: 'dashboard', order: 10, requiredPermission: 'dashboard.view',
    description: 'Panel principal: indicadores, pendientes y actividad.',
    groups: [
      { label: null, screens: [live('Dashboard', '', 'dashboard.view'), 'Indicadores', 'Pendientes', 'Actividad reciente', 'Favoritos'] },
    ],
  },
  {
    key: 'sales', label: 'Ventas', icon: 'tag', symbol: 'sell', order: 20,
    sections: [
      ['sheet', 'Ficha de venta', 99, 990],
      ['quote', 'Cotización', 49, 490],
      ['order', 'Orden de venta', 49, 490],
    ],
    requiredPermission: 'sales.view',
    description: 'Punto de venta, gestión comercial, descuentos, cobros, devoluciones y configuración de ventas.',
    groups: [
      { label: 'Punto de venta', screens: [live('Terminal POS', 'sales/sales-sheet', 'sales.sheet.view'), 'Suspender y recuperar venta', 'Devoluciones rápidas'] },
      { label: 'Gestión comercial', screens: [live('Cotizaciones', 'sales/quotation', 'sales.quote.view'), 'Pedidos de clientes', live('Órdenes de venta', 'sales/salesorder', 'sales.order.view'), 'Historial de ventas', 'Detalle de venta'] },
      { label: 'Descuentos y promociones', screens: ['Promociones', 'Cupones', 'Reglas de descuento', 'Autorizaciones', 'Precios especiales'] },
      { label: 'Cobros', screens: ['Registrar cobro', 'Pagos mixtos', 'Pagos parciales', 'Reembolsos', 'Métodos de cobro'] },
      { label: 'Devoluciones y cancelaciones', screens: ['Devoluciones', 'Notas de crédito', 'Solicitudes de cancelación', 'Historial de autorizaciones'] },
      { label: 'Configuración de ventas', screens: [live('Reglas de venta', 'sales/pos-config', 'sales.config.view'), 'Canales', 'Comisiones', 'Políticas comerciales', 'Series de documentos'] },
    ],
  },
  {
    key: 'customers', label: 'Clientes y CRM', icon: 'customers', symbol: 'contacts', order: 30, requiredPermission: 'customers.view', includedIn: ['sales', 'cobranza'],
    description: 'Directorio de clientes, CRM y relación comercial.',
    groups: [
      { label: 'Clientes', screens: [live('Directorio', 'customers', 'customers.view'), 'Alta y edición', 'Contactos', 'Direcciones', 'Clasificación', 'Historial de compras'] },
      { label: 'CRM', screens: ['Prospectos', 'Oportunidades', 'Actividades', 'Seguimientos', 'Campañas', 'Embudo comercial'] },
      { label: 'Relación comercial', screens: ['Contratos', 'Condiciones comerciales', 'Listas de precios', 'Comunicaciones', 'Renovaciones'] },
    ],
  },
  {
    // La clave 'cobranza' no se renombra: licencias, permisos y sucursales ya la usan
    key: 'cobranza', label: 'Cuentas por cobrar', icon: 'cash', symbol: 'payments', order: 40,
    sections: [
      ['credit', 'Cuentas de crédito', 49, 490],
      ['debtors', 'Deudores', 29, 290],
      ['payments', 'Abonos', 29, 290],
    ],
    requiredPermission: 'cobranza.view',
    description: 'Cartera, cobranza y seguimiento de saldos de clientes.',
    groups: [
      { label: 'Cartera', screens: [live('Cuentas de crédito', 'cuentas-por-cobrar/credit-accounts', 'cobranza.credit.view'), live('Deudores', 'cuentas-por-cobrar/debtors', 'cobranza.debtors.view'), 'Documentos pendientes', 'Anticipos', 'Saldos a favor'] },
      { label: 'Cobranza', screens: [live('Registrar abonos', 'cuentas-por-cobrar/credit-payments', 'cobranza.payments.view'), 'Aplicar pagos', 'Pagos parciales', 'Recibos', 'Promesas de pago'] },
      { label: 'Seguimiento', screens: ['Antigüedad de saldos', 'Vencimientos', 'Límites de crédito', 'Historial de cobranza'] },
    ],
  },
  {
    key: 'shopping', label: 'Compras', icon: 'cart', symbol: 'shopping_cart', order: 50,
    sections: [
      ['requisition', 'Requisición', 49, 490],
      ['purchase', 'Orden de compra', 49, 490],
    ],
    requiredPermission: 'shopping.view',
    description: 'Planeación, proveedores, adquisiciones, recepción y facturas de proveedor.',
    groups: [
      { label: 'Planeación', screens: ['Solicitudes de compra', live('Requisiciones', 'shopping/requisitions', 'shopping.requisition.view'), 'Necesidades de reabastecimiento'] },
      { label: 'Proveedores', screens: [live('Directorio', 'catalogos/suppliers', 'catalogos.suppliers.view'), 'Contactos', 'Condiciones', 'Evaluaciones', 'Historial de precios'] },
      { label: 'Adquisiciones', screens: ['Solicitudes de cotización', 'Comparativas', live('Órdenes de compra', 'shopping/purchaseorders', 'shopping.purchase.view'), 'Autorizaciones'] },
      { label: 'Recepción y devoluciones', screens: ['Recepciones', 'Recepciones parciales', 'Devoluciones a proveedores', 'Diferencias'] },
      { label: 'Facturas de proveedor', screens: ['Facturas recibidas', 'Validación', 'Costos adicionales', 'Anticipos', 'Enlace a cuentas por pagar'] },
    ],
  },
  {
    key: 'cash-register', label: 'Caja', icon: 'box', symbol: 'point_of_sale', order: 60,
    sections: [
      ['current', 'Caja Actual', 49, 490],
      ['movements', 'Movimientos de Caja', 29, 290],
      ['cuts', 'Cortes de Caja', 29, 290],
      ['shifts', 'Turnos', 29, 290],
      ['registers', 'Cajas', 29, 290],
      ['schedules', 'Programación de turnos', 29, 290],
      ['config', 'Configuración de Caja', 29, 290],
    ],
    requiredPermission: 'cash.view',
    description: 'Operación de caja, cortes, administración de cajas, turnos y controles.',
    groups: [
      { label: 'Operación', screens: [live('Caja actual', 'cash/current', 'cash.current.view'), 'Abrir caja', 'Turno activo', live('Movimientos', 'cash/movements', 'cash.movements.view'), 'Ingresos', 'Retiros', 'Gastos'] },
      { label: 'Cortes y arqueos', screens: [live('Corte de caja', 'cash/cuts', 'cash.cuts.view'), 'Arqueo', 'Diferencias', 'Historial de cortes', 'Autorizaciones'] },
      { label: 'Administración de cajas', screens: [live('Cajas registradas', 'cash/registers', 'cash.registers.view'), 'Asignaciones', 'Sucursales', 'Terminales', live('Configuración de caja', 'cash/config', 'cash.config.view')] },
      { label: 'Turnos', screens: [live('Turnos activos', 'cash/shifts', 'cash.shifts.view'), 'Historial', 'Horarios', live('Programación', 'cash/schedules', 'cash.schedules.view'), 'Rotaciones', 'Asignaciones de empleados'] },
      { label: 'Control', screens: ['Límites', 'Fondos iniciales', 'Reglas de cierre', 'Denominaciones', 'Reglas de autorización'] },
    ],
  },
  {
    // La clave 'store' no se renombra (licencias y sucursales ya la usan)
    key: 'store', label: 'Inventario y almacenes', icon: 'warehouse', symbol: 'warehouse', order: 70,
    sections: [
      ['warehouse', 'Almacenes', 49, 490],
      ['inventory', 'Inventario', 49, 490],
      ['tickets', 'Entradas', 29, 290],
      ['orders', 'Pedidos almacén', 29, 290],
      ['departures', 'Salidas', 29, 290],
    ],
    requiredPermission: 'store.view',
    description: 'Existencias, movimientos, control, lotes y series, reabastecimiento, costos y almacenes.',
    groups: [
      { label: 'Existencias', screens: [live('Inventario actual', 'store/inventory', 'store.inventory.view'), 'Existencias por sucursal', 'Existencias por almacén', 'Disponibilidad', 'Reservas'] },
      { label: 'Movimientos', screens: [live('Entradas', 'store/tickets', 'store.tickets.view'), live('Salidas', 'store/departures', 'store.departures.view'), 'Ajustes', live('Traspasos', 'store/transfers', 'store.transfers.view'), 'Recepciones', 'Inventario en tránsito', live('Pedidos', 'store/orders', 'store.orders.view')] },
      { label: 'Control de inventario', screens: ['Kardex', 'Conteos físicos', 'Conteos cíclicos', 'Conciliación', 'Trazabilidad'] },
      { label: 'Lotes y series', screens: ['Lotes', 'Números de serie', 'Caducidades', 'Trazabilidad de origen y destino'] },
      { label: 'Reabastecimiento', screens: ['Mínimos y máximos', 'Alertas', 'Sugerencias de compra', 'Políticas de reposición'] },
      { label: 'Costos', screens: ['Costos de inventario', 'Valoración', 'Historial de costos', 'Configuración de valoración'] },
      { label: 'Administración de almacenes', screens: [live('Almacenes', 'store', 'store.warehouse.view'), 'Ubicaciones internas', 'Zonas', 'Capacidad', 'Configuración'] },
    ],
  },
  {
    key: 'production', label: 'Producción y manufactura', icon: 'production', symbol: 'precision_manufacturing', order: 80,
    sections: [
      ['orders', 'Órdenes producción', 99, 990],
      ['queue', 'Cola producción', 49, 490],
      ['areas', 'Áreas producción', 49, 490],
      ['categories', 'Categorías producción', 29, 290],
    ],
    requiredPermission: 'production.view',
    description: 'Órdenes, materiales y fórmulas, ejecución, planificación, calidad, mantenimiento y costos de fabricación.',
    groups: [
      { label: 'Órdenes de producción', screens: ['Crear órdenes', 'Planificación', live('Cola de trabajo', 'production/queue', 'production.queue.view'), live('Seguimiento', 'production/orders', 'production.orders.view'), 'Cierre'] },
      { label: 'Materiales y fórmulas', screens: ['Listas de materiales', 'Versiones', 'Recetas industriales', 'Subproductos', 'Sustituciones autorizadas'] },
      { label: 'Ejecución', screens: ['Operaciones', live('Centros de trabajo', 'production/areas', 'production.areas.view'), 'Consumos', 'Producto terminado', 'Mermas', 'Rechazos'] },
      { label: 'Planificación', screens: ['Necesidades de materiales', 'Capacidad', 'Calendarios', 'Programación de producción'] },
      { label: 'Calidad y mantenimiento', screens: ['Inspecciones', 'No conformidades', 'Equipos', 'Mantenimiento preventivo', 'Órdenes de mantenimiento'] },
      { label: 'Costos de fabricación', screens: ['Materiales', 'Mano de obra', 'Costos indirectos', 'Costos reales y estimados'] },
    ],
  },
  {
    key: 'restaurants', label: 'Restaurantes y Food Service', icon: 'restaurants', symbol: 'restaurant', order: 90,
    description: 'Salón, comandas, menús, cocina (KDS), recetas y entrega.',
    groups: [
      { label: 'Salón', screens: ['Plano', 'Salones', 'Zonas', 'Mesas', 'Asignación de meseros', 'Reservaciones'] },
      { label: 'Comandas', screens: ['Nueva comanda', 'Modificaciones', 'División de cuentas', 'División de conceptos', 'Estados'] },
      { label: 'Menús', screens: ['Menús', 'Categorías', 'Platillos', 'Modificadores', 'Complementos', 'Disponibilidad'] },
      { label: 'Cocina', screens: ['Estaciones', 'Cola de preparación', 'Enrutamiento', 'Tiempos', 'Pantalla KDS'] },
      { label: 'Recetas', screens: ['Ingredientes', 'Subrecetas', 'Rendimientos', 'Unidades de consumo', 'Mermas', 'Costos'] },
      { label: 'Entrega', screens: ['Para llevar', 'Reparto', 'Entregas', 'Canales externos', 'Seguimiento de pedidos'] },
    ],
  },
  {
    key: 'catalogos', label: 'Catálogos', icon: 'catalog', symbol: 'category', order: 100,
    sections: [
      ['types', 'Tipos y áreas', 29, 290],
      ['familias', 'Familias', 29, 290],
      ['containers', 'Contenedores', 29, 290],
      ['categories', 'Categorías', 29, 290],
      ['units', 'Unidades', 29, 290],
      ['services', 'Servicios', 29, 290],
      ['articles', 'Artículos', 29, 290],
      ['prices', 'Rangos de precio', 29, 290],
    ],
    requiredPermission: 'catalogos.view',
    description: 'Productos y servicios, clasificación, unidades, precios, impuestos y otros catálogos.',
    groups: [
      { label: 'Productos y servicios', screens: [live('Artículos', 'catalogos/articles', 'catalogos.articles.view'), live('Servicios', 'catalogos/services', 'catalogos.services.view'), { label: 'Plantillas de variantes', slug: 'variantes' }, 'Presentaciones', 'Códigos de barras', 'Kits y paquetes'] },
      { label: 'Clasificación', screens: [live('Familias', 'catalogos/familias', 'catalogos.familias.view'), live('Categorías', 'catalogos/categories', 'catalogos.containers.view'), 'Subcategorías', 'Marcas', 'Modelos', 'Atributos', 'Características'] },
      { label: 'Unidades y cantidades', screens: [live('Unidades de medida', 'catalogos/units', 'catalogos.units.view'), 'Conversiones', 'Unidades de compra', 'Unidades de venta'] },
      { label: 'Precios y condiciones', screens: ['Listas de precios', live('Rangos', 'catalogos/price-ranges', 'catalogos.prices.view'), 'Tarifas', 'Condiciones comerciales', 'Reglas de precio'] },
      { label: 'Impuestos y monedas', screens: ['Impuestos', 'Monedas', 'Tipos de cambio', 'Catálogos fiscales'] },
      { label: 'Otros catálogos', screens: [live('Métodos de pago', 'catalogos/payment-methods', 'catalogos.payment-methods.view'), 'Motivos de ajuste', 'Motivos de cancelación', 'Tipos de documento', live('Tipos de área', 'catalogos/types', 'catalogos.types.view'), live('Subáreas', 'catalogos/areas', 'catalogos.areas.view')] },
    ],
  },
  {
    key: 'finance', label: 'Finanzas y contabilidad', icon: 'finance', symbol: 'account_balance', order: 110,
    description: 'Contabilidad general, cierres, cuentas por pagar, bancos, costos, activos fijos, consolidación y estados financieros.',
    groups: [
      // Estas pantallas ya existen en el backend (accounting.*): usan sus permisos
      { label: 'Contabilidad general', screens: ['Catálogo de cuentas', 'Pólizas', 'Asientos', 'Libro diario', 'Mayor', 'Balanza de comprobación'].map((n) => own(n, 'accounting.view')) },
      { label: 'Cierres contables', screens: ['Periodos', 'Ejercicios', 'Aperturas', 'Ajustes', 'Reversiones', 'Cierre mensual y anual'].map((n) => own(n, 'accounting.view')) },
      { label: 'Cuentas por pagar', screens: ['Facturas', 'Anticipos', 'Vencimientos', 'Pagos', 'Aplicaciones', 'Propuestas de pago'] },
      { label: 'Bancos y tesorería', screens: ['Cuentas bancarias', 'Transferencias', 'Conciliación bancaria', 'Flujo de efectivo'] },
      { label: 'Costos y presupuestos', screens: ['Centros de costos', 'Dimensiones', 'Presupuestos', 'Prorrateos', 'Análisis de desviaciones'] },
      { label: 'Activos fijos', screens: ['Registro', 'Depreciación', 'Mejoras', 'Deterioro', 'Bajas', 'Disposición'] },
      { label: 'Multimoneda y consolidación', screens: ['Diferencias cambiarias', 'Intercompañía', 'Eliminaciones', 'Estados consolidados'] },
      { label: 'Estados financieros', screens: ['Balance general', 'Resultados', 'Flujo de efectivo', 'Cambios en capital', 'Auxiliares'] },
    ],
  },
  {
    key: 'fiscal', label: 'Facturación y fiscal', icon: 'fiscal', symbol: 'receipt_long', order: 120,
    description: 'CFDI, complementos y cancelaciones, nómina fiscal, contabilidad electrónica y configuración fiscal.',
    groups: [
      { label: 'CFDI', screens: ['Emisión', 'Recepción', 'Documentos relacionados', 'UUID', 'Estados'] },
      { label: 'Complementos y cancelaciones', screens: ['Complementos de pago', 'Solicitudes de cancelación', 'Sustituciones', 'Seguimiento'] },
      { label: 'Nómina fiscal', screens: ['CFDI de nómina', 'Timbrado', 'Cancelación', 'Historial de respuestas'] },
      { label: 'Contabilidad electrónica', screens: ['Catálogo de cuentas fiscal', 'Balanza', 'Pólizas y auxiliares cuando correspondan'] },
      { label: 'Configuración fiscal', screens: ['Datos fiscales', 'Impuestos', 'Certificados protegidos', 'PAC', 'Catálogos versionados'] },
    ],
  },
  {
    key: 'hr', label: 'Recursos humanos', icon: 'hr', symbol: 'groups', order: 130,
    description: 'Personal, reclutamiento, asistencia, ausencias, nómina, desarrollo, autoservicio y reportes de RH.',
    groups: [
      { label: 'Personal', screens: ['Expedientes', 'Puestos', 'Departamentos', 'Organigrama', 'Historial laboral', 'Altas y bajas'] },
      { label: 'Reclutamiento', screens: ['Vacantes', 'Candidatos', 'Entrevistas', 'Selección', 'Contratación', 'Onboarding'] },
      { label: 'Asistencia y horarios', screens: ['Horarios', 'Turnos laborales', 'Marcajes', 'Retardos', 'Incidencias', 'Horas extra'] },
      { label: 'Ausencias y prestaciones', screens: ['Vacaciones', 'Permisos', 'Incapacidades', 'Prestaciones', 'Saldos y solicitudes'] },
      { label: 'Nómina', screens: ['Periodos', 'Percepciones', 'Deducciones', 'Comisiones', 'Cálculo', 'Aprobación', 'Recibos', 'Finiquitos'] },
      { label: 'Desarrollo', screens: ['Capacitación', 'Certificaciones', 'Evaluaciones', 'Objetivos', 'Planes de desarrollo'] },
      { label: 'Autoservicio', screens: ['Portal del empleado', 'Recibos', 'Solicitudes', 'Documentos', 'Actualización controlada de datos'] },
      { label: 'Reportes de RH', screens: ['Rotación', 'Ausentismo', 'Costos de nómina', 'Vacaciones pendientes', 'Plantilla'] },
    ],
  },
  {
    key: 'projects', label: 'Servicios y proyectos', icon: 'projects', symbol: 'assignment', order: 140,
    description: 'Proyectos, órdenes de servicio, contratos y soporte.',
    groups: [
      { label: 'Proyectos', screens: ['Proyectos', 'Tareas', 'Hitos', 'Recursos', 'Tiempos', 'Gastos'] },
      { label: 'Servicios', screens: ['Órdenes de servicio', 'Tickets', 'Asignaciones', 'Visitas técnicas'] },
      { label: 'Contratos', screens: ['Contratos', 'Suscripciones', 'Renovaciones', 'Facturación recurrente'] },
      { label: 'Soporte', screens: ['Garantías', 'SLA', 'Incidencias', 'Historial de atención'] },
    ],
  },
  {
    key: 'realestate', label: 'Inmuebles y condominios', icon: 'realestate', symbol: 'apartment', order: 150,
    description: 'Inmuebles, propietarios y ocupantes, administración de cuotas y operación del condominio.',
    groups: [
      { label: 'Inmuebles', screens: ['Propiedades', 'Edificios', 'Torres', 'Unidades', 'Áreas comunes'] },
      { label: 'Relaciones', screens: ['Propietarios', 'Copropiedades', 'Ocupantes', 'Arrendamientos'] },
      { label: 'Administración', screens: ['Cuotas', 'Cargos', 'Presupuestos', 'Gastos comunes', 'Aplicaciones de pagos'] },
      { label: 'Operación', screens: ['Incidencias', 'Mantenimiento', 'Reservaciones', 'Accesos', 'Comunicados', 'Asambleas y votaciones'] },
    ],
  },
  {
    key: 'reports', label: 'Reportes y análisis', icon: 'report', symbol: 'analytics', order: 160, price: [349, 3490], requiredPermission: 'reports.view',
    description: 'Reportes por área y reportes personalizados.',
    groups: [
      { label: null, screens: ['Ventas', 'Caja', 'Inventario', 'Compras', 'Finanzas', 'Fiscal', 'RH', 'Producción', 'Rentabilidad', 'Reportes personalizados'] },
    ],
  },
  {
    key: 'automation', label: 'Automatización e integraciones', icon: 'automation', symbol: 'bolt', order: 170,
    description: 'Flujos y aprobaciones, integraciones, sincronización y notificaciones.',
    groups: [
      { label: 'Flujos y aprobaciones', screens: ['Definiciones', 'Versiones', 'Instancias', 'Pasos', 'Reglas', 'Aprobaciones'] },
      { label: 'Integraciones', screens: ['Conectores', 'Credenciales referenciadas', 'Webhooks', 'Eventos', 'Suscripciones'] },
      { label: 'Sincronización', screens: ['Colas', 'Reintentos', 'Errores', 'Estado de sincronización', 'Idempotencia'] },
      { label: 'Notificaciones y auditoría técnica', screens: ['Plantillas', 'Notificaciones', 'Correlación', 'Registro de eventos', 'Historial de ejecución'] },
    ],
  },
  {
    // Reúne lo que antes eran 'Usuarios' y 'Configuraciones'. Las licencias que ya tenían cualquiera de las dos lo siguen viendo.
    key: 'admin', label: 'Administración y seguridad', icon: 'settings', symbol: 'admin_panel_settings', order: 180, includedIn: ['configurations', 'users'],
    description: 'Organización, usuarios y accesos, seguridad y configuración avanzada.',
    groups: [
      { label: 'Organización', screens: [live('Empresas', 'configurations/companies', 'configurations.companies.view'), live('Sucursales', 'configurations/branch-offices', 'configurations.branch.view'), 'Almacenes', live('Áreas', 'configurations/areas', 'configurations.areas.view'), live('Series y folios', 'configurations/series', 'configurations.series.view'), 'Configuración general'] },
      { label: 'Usuarios y accesos', screens: [live('Usuarios', 'configurations/users', ['configurations.users.view', 'users.view']), 'Personal vinculado', live('Roles', 'configurations/roles', ['configurations.roles.view', 'roles.view']), 'Permisos', 'Excepciones', live('Grupos de usuarios', 'configurations/grupos-usuarios', 'configurations.userGroups.view')] },
      { label: 'Seguridad', screens: ['Sesiones', 'Políticas de acceso', 'Autorizaciones', live('Auditoría', 'configurations/audit', 'configurations.audit.view'), 'Historial de cambios'] },
      { label: 'Configuración avanzada', screens: ['Parámetros generales', 'Preferencias', 'Plantillas', 'Numeración', 'Configuraciones por empresa y sucursal', live('Franquicia', 'configurations/categories', 'configurations.franchise.view')] },
    ],
  },
  {
    key: 'module-store', label: 'Tienda de módulos', icon: 'module_store', symbol: 'storefront', order: 190, ownerOnly: true,
    description: 'Catálogo de módulos, planes, licencias y activación (solo dueño de la cuenta).',
    groups: [
      { label: null, screens: [live('Catálogo de módulos', 'module-store', undefined), 'Planes', 'Dependencias', 'Licencias', 'Activación', 'Renovación', 'Historial de contratación'] },
    ],
  },
];

/**
 * Accesos directos: entradas de una sola pantalla que apuntan a algo que ya existe en otro módulo (no son módulos de licencia).
 * Aparecen en el menú si la licencia incluye alguno de `includedIn`.
 */
// "Nueva venta" se quitó: era el mismo flujo que Terminal POS (la ficha de venta).
// Sin accesos directos: "Ficha de venta" era el mismo destino que Ventas › Punto de venta › Terminal POS y se quitó por repetida.
export const SHORTCUTS = [];

/**
 * Licencias precio-por-sección que SIGUEN en el catálogo por compatibilidad (módulos que ya no tienen menú propio).
 * El seed las mantiene tal cual estaban.
 */
export const LEGACY_LICENSE_ROWS = [
  { key: 'income', name: 'Ingresos', priceMonthly: 199, priceAnnual: 1990 },
  { key: 'users', name: 'Usuarios', priceMonthly: 149, priceAnnual: 1490 },
  { key: 'configurations', name: 'Configuraciones', priceMonthly: 0, priceAnnual: 0 },
  { key: 'configurations.companies', name: 'Empresas', priceMonthly: 0, priceAnnual: 0 },
  { key: 'configurations.branch', name: 'Sucursales', priceMonthly: 0, priceAnnual: 0 },
  { key: 'configurations.series', name: 'Series', priceMonthly: 0, priceAnnual: 0 },
  { key: 'configurations.areas', name: 'Áreas', priceMonthly: 0, priceAnnual: 0 },
  { key: 'configurations.users', name: 'Usuarios config', priceMonthly: 0, priceAnnual: 0 },
  { key: 'configurations.roles', name: 'Roles config', priceMonthly: 0, priceAnnual: 0 },
  { key: 'configurations.franchise', name: 'Franquicia', priceMonthly: 0, priceAnnual: 0 },
];
