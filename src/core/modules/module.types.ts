/**
 * Sistema de módulos del frontend (espejo del Kernel del backend).
 *
 * Cada módulo del ERP (ventas, almacén, producción, etc.) se declara como un
 * ModuleManifest autocontenido. El sidebar y, a futuro, las rutas se generan a
 * partir del registro de estos manifiestos.
 *
 * Acoplar un módulo  = registrar su manifiesto.
 * Desacoplar un módulo = quitarlo del registro (o deshabilitarlo en backend).
 */

/** Un enlace hijo dentro de un módulo (aparece en el submenú). */
export interface MenuLink {
  /** Identificador único del submódulo, coincide con moduleId del backend. */
  key?: string
  label: string
  /** Ruta relativa al área privada, ej: `sales/sales-sheet`. */
  path: string
  /** Permiso requerido para verlo (opcional). Con varios, basta con tener cualquiera. */
  requiredPermission?: string | string[]
  /** Grupo del submenú al que pertenece (encabezado que agrupa pantallas), ej: "Punto de venta". */
  group?: string
  /** true = la pantalla todavía no existe: se muestra "en construcción" hasta que se cree su archivo. */
  placeholder?: boolean
}

/**
 * Manifiesto de un módulo del frontend.
 */
export interface ModuleManifest {
  /** Identificador único, debe coincidir con la `key` del módulo en backend. */
  key: string
  /** Texto visible en el sidebar. */
  label: string
  /** Nombre del icono (ver icons.tsx). */
  icon: string
  /** Orden en el sidebar (menor = primero). */
  order?: number
  /**
   * Ruta directa si el módulo es un enlace simple (sin submenú),
   * ej: Dashboard o Ingresos.
   */
  path?: string
  /** Enlaces hijos (si tiene submenú). */
  children?: MenuLink[]
  /** Permiso requerido para ver el módulo completo. */
  requiredPermission?: string
  /**
   * Si es false, no se muestra. Por defecto true. Se puede sobreescribir con la
   * lista de módulos activos que reporta el backend (/kernel/modules).
   */
  enabled?: boolean
  /**
   * Si es true, solo lo ven los usuarios ACCOUNT o SYSTEM (dueños).
   * Nunca se filtra por empresa — siempre visible para el dueño.
   */
  ownerOnly?: boolean
  /**
   * Otros módulos licenciados que ya incluyen a este (ej: Clientes viene con Ventas y con Cuentas por cobrar). El módulo se muestra si la
   * licencia tiene su propia clave O alguna de estas.
   */
  includedIn?: string[]
}
