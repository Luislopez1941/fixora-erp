// ARCHIVO GENERADO por fixora-erp/scripts/modules/generate.mjs a partir de taxonomy.mjs — no editar a mano.

export interface TaxScreen {
  key: string
  label: string
  /** Ruta relativa al área privada (se le antepone /auth/) */
  path: string
  /** Permiso (o cualquiera de varios) para ver la pantalla */
  permission?: string | string[]
  /** true = la pantalla ya existe; false = se muestra "en construcción" hasta que exista src/modules/<ruta>/index.tsx */
  live: boolean
  own?: boolean
  folder?: string
}
export interface TaxGroup { key: string | null; label: string | null; screens: TaxScreen[] }
export interface TaxModule {
  key: string
  label: string
  icon: string
  order: number
  description: string
  requiredPermission?: string
  ownerOnly?: boolean
  includedIn?: string[]
  groups: TaxGroup[]
}
export interface TaxShortcut { key: string; label: string; icon: string; order: number; path: string; requiredPermission?: string; includedIn?: string[] }

export const TAXONOMY: TaxModule[] = [
  {
    "key": "dashboard",
    "label": "Panel",
    "icon": "dashboard",
    "order": 10,
    "description": "Panel principal: indicadores, pendientes y actividad.",
    "requiredPermission": "dashboard.view",
    "groups": [
      {
        "key": null,
        "label": null,
        "screens": [
          {
            "key": "dashboard",
            "label": "Dashboard",
            "live": true,
            "path": "",
            "permission": "dashboard.view",
            "own": false
          },
          {
            "key": "indicadores",
            "label": "Indicadores",
            "live": false,
            "path": "dashboard/indicadores",
            "permission": "dashboard.indicadores.view",
            "own": false,
            "folder": "src/modules/dashboard/indicadores"
          },
          {
            "key": "pendientes",
            "label": "Pendientes",
            "live": false,
            "path": "dashboard/pendientes",
            "permission": "dashboard.pendientes.view",
            "own": false,
            "folder": "src/modules/dashboard/pendientes"
          },
          {
            "key": "actividad-reciente",
            "label": "Actividad reciente",
            "live": false,
            "path": "dashboard/actividad-reciente",
            "permission": "dashboard.actividad-reciente.view",
            "own": false,
            "folder": "src/modules/dashboard/actividad-reciente"
          },
          {
            "key": "favoritos",
            "label": "Favoritos",
            "live": false,
            "path": "dashboard/favoritos",
            "permission": "dashboard.favoritos.view",
            "own": false,
            "folder": "src/modules/dashboard/favoritos"
          }
        ]
      }
    ]
  },
  {
    "key": "sales",
    "label": "Ventas",
    "icon": "tag",
    "order": 20,
    "description": "Punto de venta, gestión comercial, descuentos, cobros, devoluciones y configuración de ventas.",
    "requiredPermission": "sales.view",
    "groups": [
      {
        "key": "punto-de-venta",
        "label": "Punto de venta",
        "screens": [
          {
            "key": "punto-de-venta-terminal-pos",
            "label": "Terminal POS",
            "live": true,
            "path": "sales/sales-sheet",
            "permission": "sales.sheet.view",
            "own": false
          },
          {
            "key": "punto-de-venta-suspender-y-recuperar-venta",
            "label": "Suspender y recuperar venta",
            "live": false,
            "path": "sales/punto-de-venta/suspender-y-recuperar-venta",
            "permission": "sales.punto-de-venta-suspender-y-recuperar-venta.view",
            "own": false,
            "folder": "src/modules/sales/punto-de-venta/suspender-y-recuperar-venta"
          },
          {
            "key": "punto-de-venta-devoluciones-rapidas",
            "label": "Devoluciones rápidas",
            "live": false,
            "path": "sales/punto-de-venta/devoluciones-rapidas",
            "permission": "sales.punto-de-venta-devoluciones-rapidas.view",
            "own": false,
            "folder": "src/modules/sales/punto-de-venta/devoluciones-rapidas"
          }
        ]
      },
      {
        "key": "gestion-comercial",
        "label": "Gestión comercial",
        "screens": [
          {
            "key": "gestion-comercial-cotizaciones",
            "label": "Cotizaciones",
            "live": true,
            "path": "sales/quotation",
            "permission": "sales.quote.view",
            "own": false
          },
          {
            "key": "gestion-comercial-pedidos-de-clientes",
            "label": "Pedidos de clientes",
            "live": false,
            "path": "sales/gestion-comercial/pedidos-de-clientes",
            "permission": "sales.gestion-comercial-pedidos-de-clientes.view",
            "own": false,
            "folder": "src/modules/sales/gestion-comercial/pedidos-de-clientes"
          },
          {
            "key": "gestion-comercial-ordenes-de-venta",
            "label": "Órdenes de venta",
            "live": true,
            "path": "sales/salesorder",
            "permission": "sales.order.view",
            "own": false
          },
          {
            "key": "gestion-comercial-historial-de-ventas",
            "label": "Historial de ventas",
            "live": false,
            "path": "sales/gestion-comercial/historial-de-ventas",
            "permission": "sales.gestion-comercial-historial-de-ventas.view",
            "own": false,
            "folder": "src/modules/sales/gestion-comercial/historial-de-ventas"
          },
          {
            "key": "gestion-comercial-detalle-de-venta",
            "label": "Detalle de venta",
            "live": false,
            "path": "sales/gestion-comercial/detalle-de-venta",
            "permission": "sales.gestion-comercial-detalle-de-venta.view",
            "own": false,
            "folder": "src/modules/sales/gestion-comercial/detalle-de-venta"
          }
        ]
      },
      {
        "key": "descuentos-y-promociones",
        "label": "Descuentos y promociones",
        "screens": [
          {
            "key": "descuentos-y-promociones-promociones",
            "label": "Promociones",
            "live": false,
            "path": "sales/descuentos-y-promociones/promociones",
            "permission": "sales.descuentos-y-promociones-promociones.view",
            "own": false,
            "folder": "src/modules/sales/descuentos-y-promociones/promociones"
          },
          {
            "key": "descuentos-y-promociones-cupones",
            "label": "Cupones",
            "live": false,
            "path": "sales/descuentos-y-promociones/cupones",
            "permission": "sales.descuentos-y-promociones-cupones.view",
            "own": false,
            "folder": "src/modules/sales/descuentos-y-promociones/cupones"
          },
          {
            "key": "descuentos-y-promociones-reglas-de-descuento",
            "label": "Reglas de descuento",
            "live": false,
            "path": "sales/descuentos-y-promociones/reglas-de-descuento",
            "permission": "sales.descuentos-y-promociones-reglas-de-descuento.view",
            "own": false,
            "folder": "src/modules/sales/descuentos-y-promociones/reglas-de-descuento"
          },
          {
            "key": "descuentos-y-promociones-autorizaciones",
            "label": "Autorizaciones",
            "live": false,
            "path": "sales/descuentos-y-promociones/autorizaciones",
            "permission": "sales.descuentos-y-promociones-autorizaciones.view",
            "own": false,
            "folder": "src/modules/sales/descuentos-y-promociones/autorizaciones"
          },
          {
            "key": "descuentos-y-promociones-precios-especiales",
            "label": "Precios especiales",
            "live": false,
            "path": "sales/descuentos-y-promociones/precios-especiales",
            "permission": "sales.descuentos-y-promociones-precios-especiales.view",
            "own": false,
            "folder": "src/modules/sales/descuentos-y-promociones/precios-especiales"
          }
        ]
      },
      {
        "key": "cobros",
        "label": "Cobros",
        "screens": [
          {
            "key": "cobros-registrar-cobro",
            "label": "Registrar cobro",
            "live": false,
            "path": "sales/cobros/registrar-cobro",
            "permission": "sales.cobros-registrar-cobro.view",
            "own": false,
            "folder": "src/modules/sales/cobros/registrar-cobro"
          },
          {
            "key": "cobros-pagos-mixtos",
            "label": "Pagos mixtos",
            "live": false,
            "path": "sales/cobros/pagos-mixtos",
            "permission": "sales.cobros-pagos-mixtos.view",
            "own": false,
            "folder": "src/modules/sales/cobros/pagos-mixtos"
          },
          {
            "key": "cobros-pagos-parciales",
            "label": "Pagos parciales",
            "live": false,
            "path": "sales/cobros/pagos-parciales",
            "permission": "sales.cobros-pagos-parciales.view",
            "own": false,
            "folder": "src/modules/sales/cobros/pagos-parciales"
          },
          {
            "key": "cobros-reembolsos",
            "label": "Reembolsos",
            "live": false,
            "path": "sales/cobros/reembolsos",
            "permission": "sales.cobros-reembolsos.view",
            "own": false,
            "folder": "src/modules/sales/cobros/reembolsos"
          },
          {
            "key": "cobros-metodos-de-cobro",
            "label": "Métodos de cobro",
            "live": false,
            "path": "sales/cobros/metodos-de-cobro",
            "permission": "sales.cobros-metodos-de-cobro.view",
            "own": false,
            "folder": "src/modules/sales/cobros/metodos-de-cobro"
          }
        ]
      },
      {
        "key": "devoluciones-y-cancelaciones",
        "label": "Devoluciones y cancelaciones",
        "screens": [
          {
            "key": "devoluciones-y-cancelaciones-devoluciones",
            "label": "Devoluciones",
            "live": false,
            "path": "sales/devoluciones-y-cancelaciones/devoluciones",
            "permission": "sales.devoluciones-y-cancelaciones-devoluciones.view",
            "own": false,
            "folder": "src/modules/sales/devoluciones-y-cancelaciones/devoluciones"
          },
          {
            "key": "devoluciones-y-cancelaciones-notas-de-credito",
            "label": "Notas de crédito",
            "live": false,
            "path": "sales/devoluciones-y-cancelaciones/notas-de-credito",
            "permission": "sales.devoluciones-y-cancelaciones-notas-de-credito.view",
            "own": false,
            "folder": "src/modules/sales/devoluciones-y-cancelaciones/notas-de-credito"
          },
          {
            "key": "devoluciones-y-cancelaciones-solicitudes-de-cancelacion",
            "label": "Solicitudes de cancelación",
            "live": false,
            "path": "sales/devoluciones-y-cancelaciones/solicitudes-de-cancelacion",
            "permission": "sales.devoluciones-y-cancelaciones-solicitudes-de-cancelacion.view",
            "own": false,
            "folder": "src/modules/sales/devoluciones-y-cancelaciones/solicitudes-de-cancelacion"
          },
          {
            "key": "devoluciones-y-cancelaciones-historial-de-autorizaciones",
            "label": "Historial de autorizaciones",
            "live": false,
            "path": "sales/devoluciones-y-cancelaciones/historial-de-autorizaciones",
            "permission": "sales.devoluciones-y-cancelaciones-historial-de-autorizaciones.view",
            "own": false,
            "folder": "src/modules/sales/devoluciones-y-cancelaciones/historial-de-autorizaciones"
          }
        ]
      },
      {
        "key": "configuracion-de-ventas",
        "label": "Configuración de ventas",
        "screens": [
          {
            "key": "configuracion-de-ventas-reglas-de-venta",
            "label": "Reglas de venta",
            "live": true,
            "path": "sales/pos-config",
            "permission": "sales.config.view",
            "own": false
          },
          {
            "key": "configuracion-de-ventas-canales",
            "label": "Canales",
            "live": false,
            "path": "sales/configuracion-de-ventas/canales",
            "permission": "sales.configuracion-de-ventas-canales.view",
            "own": false,
            "folder": "src/modules/sales/configuracion-de-ventas/canales"
          },
          {
            "key": "configuracion-de-ventas-comisiones",
            "label": "Comisiones",
            "live": false,
            "path": "sales/configuracion-de-ventas/comisiones",
            "permission": "sales.configuracion-de-ventas-comisiones.view",
            "own": false,
            "folder": "src/modules/sales/configuracion-de-ventas/comisiones"
          },
          {
            "key": "configuracion-de-ventas-politicas-comerciales",
            "label": "Políticas comerciales",
            "live": false,
            "path": "sales/configuracion-de-ventas/politicas-comerciales",
            "permission": "sales.configuracion-de-ventas-politicas-comerciales.view",
            "own": false,
            "folder": "src/modules/sales/configuracion-de-ventas/politicas-comerciales"
          },
          {
            "key": "configuracion-de-ventas-series-de-documentos",
            "label": "Series de documentos",
            "live": false,
            "path": "sales/configuracion-de-ventas/series-de-documentos",
            "permission": "sales.configuracion-de-ventas-series-de-documentos.view",
            "own": false,
            "folder": "src/modules/sales/configuracion-de-ventas/series-de-documentos"
          }
        ]
      }
    ]
  },
  {
    "key": "customers",
    "label": "Clientes y CRM",
    "icon": "customers",
    "order": 30,
    "description": "Directorio de clientes, CRM y relación comercial.",
    "requiredPermission": "customers.view",
    "includedIn": [
      "sales",
      "cobranza"
    ],
    "groups": [
      {
        "key": "clientes",
        "label": "Clientes",
        "screens": [
          {
            "key": "clientes-directorio",
            "label": "Directorio",
            "live": true,
            "path": "customers",
            "permission": "customers.view",
            "own": false
          },
          {
            "key": "clientes-alta-y-edicion",
            "label": "Alta y edición",
            "live": false,
            "path": "customers/clientes/alta-y-edicion",
            "permission": "customers.clientes-alta-y-edicion.view",
            "own": false,
            "folder": "src/modules/customers/clientes/alta-y-edicion"
          },
          {
            "key": "clientes-contactos",
            "label": "Contactos",
            "live": false,
            "path": "customers/clientes/contactos",
            "permission": "customers.clientes-contactos.view",
            "own": false,
            "folder": "src/modules/customers/clientes/contactos"
          },
          {
            "key": "clientes-direcciones",
            "label": "Direcciones",
            "live": false,
            "path": "customers/clientes/direcciones",
            "permission": "customers.clientes-direcciones.view",
            "own": false,
            "folder": "src/modules/customers/clientes/direcciones"
          },
          {
            "key": "clientes-clasificacion",
            "label": "Clasificación",
            "live": false,
            "path": "customers/clientes/clasificacion",
            "permission": "customers.clientes-clasificacion.view",
            "own": false,
            "folder": "src/modules/customers/clientes/clasificacion"
          },
          {
            "key": "clientes-historial-de-compras",
            "label": "Historial de compras",
            "live": false,
            "path": "customers/clientes/historial-de-compras",
            "permission": "customers.clientes-historial-de-compras.view",
            "own": false,
            "folder": "src/modules/customers/clientes/historial-de-compras"
          }
        ]
      },
      {
        "key": "crm",
        "label": "CRM",
        "screens": [
          {
            "key": "crm-prospectos",
            "label": "Prospectos",
            "live": false,
            "path": "customers/crm/prospectos",
            "permission": "customers.crm-prospectos.view",
            "own": false,
            "folder": "src/modules/customers/crm/prospectos"
          },
          {
            "key": "crm-oportunidades",
            "label": "Oportunidades",
            "live": false,
            "path": "customers/crm/oportunidades",
            "permission": "customers.crm-oportunidades.view",
            "own": false,
            "folder": "src/modules/customers/crm/oportunidades"
          },
          {
            "key": "crm-actividades",
            "label": "Actividades",
            "live": false,
            "path": "customers/crm/actividades",
            "permission": "customers.crm-actividades.view",
            "own": false,
            "folder": "src/modules/customers/crm/actividades"
          },
          {
            "key": "crm-seguimientos",
            "label": "Seguimientos",
            "live": false,
            "path": "customers/crm/seguimientos",
            "permission": "customers.crm-seguimientos.view",
            "own": false,
            "folder": "src/modules/customers/crm/seguimientos"
          },
          {
            "key": "crm-campanas",
            "label": "Campañas",
            "live": false,
            "path": "customers/crm/campanas",
            "permission": "customers.crm-campanas.view",
            "own": false,
            "folder": "src/modules/customers/crm/campanas"
          },
          {
            "key": "crm-embudo-comercial",
            "label": "Embudo comercial",
            "live": false,
            "path": "customers/crm/embudo-comercial",
            "permission": "customers.crm-embudo-comercial.view",
            "own": false,
            "folder": "src/modules/customers/crm/embudo-comercial"
          }
        ]
      },
      {
        "key": "relacion-comercial",
        "label": "Relación comercial",
        "screens": [
          {
            "key": "relacion-comercial-contratos",
            "label": "Contratos",
            "live": false,
            "path": "customers/relacion-comercial/contratos",
            "permission": "customers.relacion-comercial-contratos.view",
            "own": false,
            "folder": "src/modules/customers/relacion-comercial/contratos"
          },
          {
            "key": "relacion-comercial-condiciones-comerciales",
            "label": "Condiciones comerciales",
            "live": false,
            "path": "customers/relacion-comercial/condiciones-comerciales",
            "permission": "customers.relacion-comercial-condiciones-comerciales.view",
            "own": false,
            "folder": "src/modules/customers/relacion-comercial/condiciones-comerciales"
          },
          {
            "key": "relacion-comercial-listas-de-precios",
            "label": "Listas de precios",
            "live": false,
            "path": "customers/relacion-comercial/listas-de-precios",
            "permission": "customers.relacion-comercial-listas-de-precios.view",
            "own": false,
            "folder": "src/modules/customers/relacion-comercial/listas-de-precios"
          },
          {
            "key": "relacion-comercial-comunicaciones",
            "label": "Comunicaciones",
            "live": false,
            "path": "customers/relacion-comercial/comunicaciones",
            "permission": "customers.relacion-comercial-comunicaciones.view",
            "own": false,
            "folder": "src/modules/customers/relacion-comercial/comunicaciones"
          },
          {
            "key": "relacion-comercial-renovaciones",
            "label": "Renovaciones",
            "live": false,
            "path": "customers/relacion-comercial/renovaciones",
            "permission": "customers.relacion-comercial-renovaciones.view",
            "own": false,
            "folder": "src/modules/customers/relacion-comercial/renovaciones"
          }
        ]
      }
    ]
  },
  {
    "key": "cobranza",
    "label": "Cuentas por cobrar",
    "icon": "cash",
    "order": 40,
    "description": "Cartera, cobranza y seguimiento de saldos de clientes.",
    "requiredPermission": "cobranza.view",
    "groups": [
      {
        "key": "cartera",
        "label": "Cartera",
        "screens": [
          {
            "key": "cartera-cuentas-de-credito",
            "label": "Cuentas de crédito",
            "live": true,
            "path": "cuentas-por-cobrar/credit-accounts",
            "permission": "cobranza.credit.view",
            "own": false
          },
          {
            "key": "cartera-deudores",
            "label": "Deudores",
            "live": true,
            "path": "cuentas-por-cobrar/debtors",
            "permission": "cobranza.debtors.view",
            "own": false
          },
          {
            "key": "cartera-documentos-pendientes",
            "label": "Documentos pendientes",
            "live": false,
            "path": "cobranza/cartera/documentos-pendientes",
            "permission": "cobranza.cartera-documentos-pendientes.view",
            "own": false,
            "folder": "src/modules/cobranza/cartera/documentos-pendientes"
          },
          {
            "key": "cartera-anticipos",
            "label": "Anticipos",
            "live": false,
            "path": "cobranza/cartera/anticipos",
            "permission": "cobranza.cartera-anticipos.view",
            "own": false,
            "folder": "src/modules/cobranza/cartera/anticipos"
          },
          {
            "key": "cartera-saldos-a-favor",
            "label": "Saldos a favor",
            "live": false,
            "path": "cobranza/cartera/saldos-a-favor",
            "permission": "cobranza.cartera-saldos-a-favor.view",
            "own": false,
            "folder": "src/modules/cobranza/cartera/saldos-a-favor"
          }
        ]
      },
      {
        "key": "cobranza",
        "label": "Cobranza",
        "screens": [
          {
            "key": "cobranza-registrar-abonos",
            "label": "Registrar abonos",
            "live": true,
            "path": "cuentas-por-cobrar/credit-payments",
            "permission": "cobranza.payments.view",
            "own": false
          },
          {
            "key": "cobranza-aplicar-pagos",
            "label": "Aplicar pagos",
            "live": false,
            "path": "cobranza/cobranza/aplicar-pagos",
            "permission": "cobranza.cobranza-aplicar-pagos.view",
            "own": false,
            "folder": "src/modules/cobranza/cobranza/aplicar-pagos"
          },
          {
            "key": "cobranza-pagos-parciales",
            "label": "Pagos parciales",
            "live": false,
            "path": "cobranza/cobranza/pagos-parciales",
            "permission": "cobranza.cobranza-pagos-parciales.view",
            "own": false,
            "folder": "src/modules/cobranza/cobranza/pagos-parciales"
          },
          {
            "key": "cobranza-recibos",
            "label": "Recibos",
            "live": false,
            "path": "cobranza/cobranza/recibos",
            "permission": "cobranza.cobranza-recibos.view",
            "own": false,
            "folder": "src/modules/cobranza/cobranza/recibos"
          },
          {
            "key": "cobranza-promesas-de-pago",
            "label": "Promesas de pago",
            "live": false,
            "path": "cobranza/cobranza/promesas-de-pago",
            "permission": "cobranza.cobranza-promesas-de-pago.view",
            "own": false,
            "folder": "src/modules/cobranza/cobranza/promesas-de-pago"
          }
        ]
      },
      {
        "key": "seguimiento",
        "label": "Seguimiento",
        "screens": [
          {
            "key": "seguimiento-antiguedad-de-saldos",
            "label": "Antigüedad de saldos",
            "live": false,
            "path": "cobranza/seguimiento/antiguedad-de-saldos",
            "permission": "cobranza.seguimiento-antiguedad-de-saldos.view",
            "own": false,
            "folder": "src/modules/cobranza/seguimiento/antiguedad-de-saldos"
          },
          {
            "key": "seguimiento-vencimientos",
            "label": "Vencimientos",
            "live": false,
            "path": "cobranza/seguimiento/vencimientos",
            "permission": "cobranza.seguimiento-vencimientos.view",
            "own": false,
            "folder": "src/modules/cobranza/seguimiento/vencimientos"
          },
          {
            "key": "seguimiento-limites-de-credito",
            "label": "Límites de crédito",
            "live": false,
            "path": "cobranza/seguimiento/limites-de-credito",
            "permission": "cobranza.seguimiento-limites-de-credito.view",
            "own": false,
            "folder": "src/modules/cobranza/seguimiento/limites-de-credito"
          },
          {
            "key": "seguimiento-historial-de-cobranza",
            "label": "Historial de cobranza",
            "live": false,
            "path": "cobranza/seguimiento/historial-de-cobranza",
            "permission": "cobranza.seguimiento-historial-de-cobranza.view",
            "own": false,
            "folder": "src/modules/cobranza/seguimiento/historial-de-cobranza"
          }
        ]
      }
    ]
  },
  {
    "key": "shopping",
    "label": "Compras",
    "icon": "cart",
    "order": 50,
    "description": "Planeación, proveedores, adquisiciones, recepción y facturas de proveedor.",
    "requiredPermission": "shopping.view",
    "groups": [
      {
        "key": "planeacion",
        "label": "Planeación",
        "screens": [
          {
            "key": "planeacion-solicitudes-de-compra",
            "label": "Solicitudes de compra",
            "live": false,
            "path": "shopping/planeacion/solicitudes-de-compra",
            "permission": "shopping.planeacion-solicitudes-de-compra.view",
            "own": false,
            "folder": "src/modules/shopping/planeacion/solicitudes-de-compra"
          },
          {
            "key": "planeacion-requisiciones",
            "label": "Requisiciones",
            "live": true,
            "path": "shopping/requisitions",
            "permission": "shopping.requisition.view",
            "own": false
          },
          {
            "key": "planeacion-necesidades-de-reabastecimiento",
            "label": "Necesidades de reabastecimiento",
            "live": false,
            "path": "shopping/planeacion/necesidades-de-reabastecimiento",
            "permission": "shopping.planeacion-necesidades-de-reabastecimiento.view",
            "own": false,
            "folder": "src/modules/shopping/planeacion/necesidades-de-reabastecimiento"
          }
        ]
      },
      {
        "key": "proveedores",
        "label": "Proveedores",
        "screens": [
          {
            "key": "proveedores-directorio",
            "label": "Directorio",
            "live": true,
            "path": "catalogos/suppliers",
            "permission": "catalogos.suppliers.view",
            "own": false
          },
          {
            "key": "proveedores-contactos",
            "label": "Contactos",
            "live": false,
            "path": "shopping/proveedores/contactos",
            "permission": "shopping.proveedores-contactos.view",
            "own": false,
            "folder": "src/modules/shopping/proveedores/contactos"
          },
          {
            "key": "proveedores-condiciones",
            "label": "Condiciones",
            "live": false,
            "path": "shopping/proveedores/condiciones",
            "permission": "shopping.proveedores-condiciones.view",
            "own": false,
            "folder": "src/modules/shopping/proveedores/condiciones"
          },
          {
            "key": "proveedores-evaluaciones",
            "label": "Evaluaciones",
            "live": false,
            "path": "shopping/proveedores/evaluaciones",
            "permission": "shopping.proveedores-evaluaciones.view",
            "own": false,
            "folder": "src/modules/shopping/proveedores/evaluaciones"
          },
          {
            "key": "proveedores-historial-de-precios",
            "label": "Historial de precios",
            "live": false,
            "path": "shopping/proveedores/historial-de-precios",
            "permission": "shopping.proveedores-historial-de-precios.view",
            "own": false,
            "folder": "src/modules/shopping/proveedores/historial-de-precios"
          }
        ]
      },
      {
        "key": "adquisiciones",
        "label": "Adquisiciones",
        "screens": [
          {
            "key": "adquisiciones-solicitudes-de-cotizacion",
            "label": "Solicitudes de cotización",
            "live": false,
            "path": "shopping/adquisiciones/solicitudes-de-cotizacion",
            "permission": "shopping.adquisiciones-solicitudes-de-cotizacion.view",
            "own": false,
            "folder": "src/modules/shopping/adquisiciones/solicitudes-de-cotizacion"
          },
          {
            "key": "adquisiciones-comparativas",
            "label": "Comparativas",
            "live": false,
            "path": "shopping/adquisiciones/comparativas",
            "permission": "shopping.adquisiciones-comparativas.view",
            "own": false,
            "folder": "src/modules/shopping/adquisiciones/comparativas"
          },
          {
            "key": "adquisiciones-ordenes-de-compra",
            "label": "Órdenes de compra",
            "live": true,
            "path": "shopping/purchaseorders",
            "permission": "shopping.purchase.view",
            "own": false
          },
          {
            "key": "adquisiciones-autorizaciones",
            "label": "Autorizaciones",
            "live": false,
            "path": "shopping/adquisiciones/autorizaciones",
            "permission": "shopping.adquisiciones-autorizaciones.view",
            "own": false,
            "folder": "src/modules/shopping/adquisiciones/autorizaciones"
          }
        ]
      },
      {
        "key": "recepcion-y-devoluciones",
        "label": "Recepción y devoluciones",
        "screens": [
          {
            "key": "recepcion-y-devoluciones-recepciones",
            "label": "Recepciones",
            "live": false,
            "path": "shopping/recepcion-y-devoluciones/recepciones",
            "permission": "shopping.recepcion-y-devoluciones-recepciones.view",
            "own": false,
            "folder": "src/modules/shopping/recepcion-y-devoluciones/recepciones"
          },
          {
            "key": "recepcion-y-devoluciones-recepciones-parciales",
            "label": "Recepciones parciales",
            "live": false,
            "path": "shopping/recepcion-y-devoluciones/recepciones-parciales",
            "permission": "shopping.recepcion-y-devoluciones-recepciones-parciales.view",
            "own": false,
            "folder": "src/modules/shopping/recepcion-y-devoluciones/recepciones-parciales"
          },
          {
            "key": "recepcion-y-devoluciones-devoluciones-a-proveedores",
            "label": "Devoluciones a proveedores",
            "live": false,
            "path": "shopping/recepcion-y-devoluciones/devoluciones-a-proveedores",
            "permission": "shopping.recepcion-y-devoluciones-devoluciones-a-proveedores.view",
            "own": false,
            "folder": "src/modules/shopping/recepcion-y-devoluciones/devoluciones-a-proveedores"
          },
          {
            "key": "recepcion-y-devoluciones-diferencias",
            "label": "Diferencias",
            "live": false,
            "path": "shopping/recepcion-y-devoluciones/diferencias",
            "permission": "shopping.recepcion-y-devoluciones-diferencias.view",
            "own": false,
            "folder": "src/modules/shopping/recepcion-y-devoluciones/diferencias"
          }
        ]
      },
      {
        "key": "facturas-de-proveedor",
        "label": "Facturas de proveedor",
        "screens": [
          {
            "key": "facturas-de-proveedor-facturas-recibidas",
            "label": "Facturas recibidas",
            "live": false,
            "path": "shopping/facturas-de-proveedor/facturas-recibidas",
            "permission": "shopping.facturas-de-proveedor-facturas-recibidas.view",
            "own": false,
            "folder": "src/modules/shopping/facturas-de-proveedor/facturas-recibidas"
          },
          {
            "key": "facturas-de-proveedor-validacion",
            "label": "Validación",
            "live": false,
            "path": "shopping/facturas-de-proveedor/validacion",
            "permission": "shopping.facturas-de-proveedor-validacion.view",
            "own": false,
            "folder": "src/modules/shopping/facturas-de-proveedor/validacion"
          },
          {
            "key": "facturas-de-proveedor-costos-adicionales",
            "label": "Costos adicionales",
            "live": false,
            "path": "shopping/facturas-de-proveedor/costos-adicionales",
            "permission": "shopping.facturas-de-proveedor-costos-adicionales.view",
            "own": false,
            "folder": "src/modules/shopping/facturas-de-proveedor/costos-adicionales"
          },
          {
            "key": "facturas-de-proveedor-anticipos",
            "label": "Anticipos",
            "live": false,
            "path": "shopping/facturas-de-proveedor/anticipos",
            "permission": "shopping.facturas-de-proveedor-anticipos.view",
            "own": false,
            "folder": "src/modules/shopping/facturas-de-proveedor/anticipos"
          },
          {
            "key": "facturas-de-proveedor-enlace-a-cuentas-por-pagar",
            "label": "Enlace a cuentas por pagar",
            "live": false,
            "path": "shopping/facturas-de-proveedor/enlace-a-cuentas-por-pagar",
            "permission": "shopping.facturas-de-proveedor-enlace-a-cuentas-por-pagar.view",
            "own": false,
            "folder": "src/modules/shopping/facturas-de-proveedor/enlace-a-cuentas-por-pagar"
          }
        ]
      }
    ]
  },
  {
    "key": "cash-register",
    "label": "Caja",
    "icon": "box",
    "order": 60,
    "description": "Operación de caja, cortes, administración de cajas, turnos y controles.",
    "requiredPermission": "cash.view",
    "groups": [
      {
        "key": "operacion",
        "label": "Operación",
        "screens": [
          {
            "key": "operacion-caja-actual",
            "label": "Caja actual",
            "live": true,
            "path": "cash/current",
            "permission": "cash.current.view",
            "own": false
          },
          {
            "key": "operacion-abrir-caja",
            "label": "Abrir caja",
            "live": false,
            "path": "cash-register/operacion/abrir-caja",
            "permission": "cash-register.operacion-abrir-caja.view",
            "own": false,
            "folder": "src/modules/cash-register/operacion/abrir-caja"
          },
          {
            "key": "operacion-turno-activo",
            "label": "Turno activo",
            "live": false,
            "path": "cash-register/operacion/turno-activo",
            "permission": "cash-register.operacion-turno-activo.view",
            "own": false,
            "folder": "src/modules/cash-register/operacion/turno-activo"
          },
          {
            "key": "operacion-movimientos",
            "label": "Movimientos",
            "live": true,
            "path": "cash/movements",
            "permission": "cash.movements.view",
            "own": false
          },
          {
            "key": "operacion-ingresos",
            "label": "Ingresos",
            "live": false,
            "path": "cash-register/operacion/ingresos",
            "permission": "cash-register.operacion-ingresos.view",
            "own": false,
            "folder": "src/modules/cash-register/operacion/ingresos"
          },
          {
            "key": "operacion-retiros",
            "label": "Retiros",
            "live": false,
            "path": "cash-register/operacion/retiros",
            "permission": "cash-register.operacion-retiros.view",
            "own": false,
            "folder": "src/modules/cash-register/operacion/retiros"
          },
          {
            "key": "operacion-gastos",
            "label": "Gastos",
            "live": false,
            "path": "cash-register/operacion/gastos",
            "permission": "cash-register.operacion-gastos.view",
            "own": false,
            "folder": "src/modules/cash-register/operacion/gastos"
          }
        ]
      },
      {
        "key": "cortes-y-arqueos",
        "label": "Cortes y arqueos",
        "screens": [
          {
            "key": "cortes-y-arqueos-corte-de-caja",
            "label": "Corte de caja",
            "live": true,
            "path": "cash/cuts",
            "permission": "cash.cuts.view",
            "own": false
          },
          {
            "key": "cortes-y-arqueos-arqueo",
            "label": "Arqueo",
            "live": false,
            "path": "cash-register/cortes-y-arqueos/arqueo",
            "permission": "cash-register.cortes-y-arqueos-arqueo.view",
            "own": false,
            "folder": "src/modules/cash-register/cortes-y-arqueos/arqueo"
          },
          {
            "key": "cortes-y-arqueos-diferencias",
            "label": "Diferencias",
            "live": false,
            "path": "cash-register/cortes-y-arqueos/diferencias",
            "permission": "cash-register.cortes-y-arqueos-diferencias.view",
            "own": false,
            "folder": "src/modules/cash-register/cortes-y-arqueos/diferencias"
          },
          {
            "key": "cortes-y-arqueos-historial-de-cortes",
            "label": "Historial de cortes",
            "live": false,
            "path": "cash-register/cortes-y-arqueos/historial-de-cortes",
            "permission": "cash-register.cortes-y-arqueos-historial-de-cortes.view",
            "own": false,
            "folder": "src/modules/cash-register/cortes-y-arqueos/historial-de-cortes"
          },
          {
            "key": "cortes-y-arqueos-autorizaciones",
            "label": "Autorizaciones",
            "live": false,
            "path": "cash-register/cortes-y-arqueos/autorizaciones",
            "permission": "cash-register.cortes-y-arqueos-autorizaciones.view",
            "own": false,
            "folder": "src/modules/cash-register/cortes-y-arqueos/autorizaciones"
          }
        ]
      },
      {
        "key": "administracion-de-cajas",
        "label": "Administración de cajas",
        "screens": [
          {
            "key": "administracion-de-cajas-cajas-registradas",
            "label": "Cajas registradas",
            "live": true,
            "path": "cash/registers",
            "permission": "cash.registers.view",
            "own": false
          },
          {
            "key": "administracion-de-cajas-asignaciones",
            "label": "Asignaciones",
            "live": false,
            "path": "cash-register/administracion-de-cajas/asignaciones",
            "permission": "cash-register.administracion-de-cajas-asignaciones.view",
            "own": false,
            "folder": "src/modules/cash-register/administracion-de-cajas/asignaciones"
          },
          {
            "key": "administracion-de-cajas-sucursales",
            "label": "Sucursales",
            "live": false,
            "path": "cash-register/administracion-de-cajas/sucursales",
            "permission": "cash-register.administracion-de-cajas-sucursales.view",
            "own": false,
            "folder": "src/modules/cash-register/administracion-de-cajas/sucursales"
          },
          {
            "key": "administracion-de-cajas-terminales",
            "label": "Terminales",
            "live": false,
            "path": "cash-register/administracion-de-cajas/terminales",
            "permission": "cash-register.administracion-de-cajas-terminales.view",
            "own": false,
            "folder": "src/modules/cash-register/administracion-de-cajas/terminales"
          },
          {
            "key": "administracion-de-cajas-configuracion-de-caja",
            "label": "Configuración de caja",
            "live": true,
            "path": "cash/config",
            "permission": "cash.config.view",
            "own": false
          }
        ]
      },
      {
        "key": "turnos",
        "label": "Turnos",
        "screens": [
          {
            "key": "turnos-turnos-activos",
            "label": "Turnos activos",
            "live": true,
            "path": "cash/shifts",
            "permission": "cash.shifts.view",
            "own": false
          },
          {
            "key": "turnos-historial",
            "label": "Historial",
            "live": false,
            "path": "cash-register/turnos/historial",
            "permission": "cash-register.turnos-historial.view",
            "own": false,
            "folder": "src/modules/cash-register/turnos/historial"
          },
          {
            "key": "turnos-horarios",
            "label": "Horarios",
            "live": false,
            "path": "cash-register/turnos/horarios",
            "permission": "cash-register.turnos-horarios.view",
            "own": false,
            "folder": "src/modules/cash-register/turnos/horarios"
          },
          {
            "key": "turnos-programacion",
            "label": "Programación",
            "live": true,
            "path": "cash/schedules",
            "permission": "cash.schedules.view",
            "own": false
          },
          {
            "key": "turnos-rotaciones",
            "label": "Rotaciones",
            "live": false,
            "path": "cash-register/turnos/rotaciones",
            "permission": "cash-register.turnos-rotaciones.view",
            "own": false,
            "folder": "src/modules/cash-register/turnos/rotaciones"
          },
          {
            "key": "turnos-asignaciones-de-empleados",
            "label": "Asignaciones de empleados",
            "live": false,
            "path": "cash-register/turnos/asignaciones-de-empleados",
            "permission": "cash-register.turnos-asignaciones-de-empleados.view",
            "own": false,
            "folder": "src/modules/cash-register/turnos/asignaciones-de-empleados"
          }
        ]
      },
      {
        "key": "control",
        "label": "Control",
        "screens": [
          {
            "key": "control-limites",
            "label": "Límites",
            "live": false,
            "path": "cash-register/control/limites",
            "permission": "cash-register.control-limites.view",
            "own": false,
            "folder": "src/modules/cash-register/control/limites"
          },
          {
            "key": "control-fondos-iniciales",
            "label": "Fondos iniciales",
            "live": false,
            "path": "cash-register/control/fondos-iniciales",
            "permission": "cash-register.control-fondos-iniciales.view",
            "own": false,
            "folder": "src/modules/cash-register/control/fondos-iniciales"
          },
          {
            "key": "control-reglas-de-cierre",
            "label": "Reglas de cierre",
            "live": false,
            "path": "cash-register/control/reglas-de-cierre",
            "permission": "cash-register.control-reglas-de-cierre.view",
            "own": false,
            "folder": "src/modules/cash-register/control/reglas-de-cierre"
          },
          {
            "key": "control-denominaciones",
            "label": "Denominaciones",
            "live": false,
            "path": "cash-register/control/denominaciones",
            "permission": "cash-register.control-denominaciones.view",
            "own": false,
            "folder": "src/modules/cash-register/control/denominaciones"
          },
          {
            "key": "control-reglas-de-autorizacion",
            "label": "Reglas de autorización",
            "live": false,
            "path": "cash-register/control/reglas-de-autorizacion",
            "permission": "cash-register.control-reglas-de-autorizacion.view",
            "own": false,
            "folder": "src/modules/cash-register/control/reglas-de-autorizacion"
          }
        ]
      }
    ]
  },
  {
    "key": "store",
    "label": "Inventario y almacenes",
    "icon": "warehouse",
    "order": 70,
    "description": "Existencias, movimientos, control, lotes y series, reabastecimiento, costos y almacenes.",
    "requiredPermission": "store.view",
    "groups": [
      {
        "key": "existencias",
        "label": "Existencias",
        "screens": [
          {
            "key": "existencias-inventario-actual",
            "label": "Inventario actual",
            "live": true,
            "path": "store/inventory",
            "permission": "store.inventory.view",
            "own": false
          },
          {
            "key": "existencias-existencias-por-sucursal",
            "label": "Existencias por sucursal",
            "live": false,
            "path": "store/existencias/existencias-por-sucursal",
            "permission": "store.existencias-existencias-por-sucursal.view",
            "own": false,
            "folder": "src/modules/store/existencias/existencias-por-sucursal"
          },
          {
            "key": "existencias-existencias-por-almacen",
            "label": "Existencias por almacén",
            "live": false,
            "path": "store/existencias/existencias-por-almacen",
            "permission": "store.existencias-existencias-por-almacen.view",
            "own": false,
            "folder": "src/modules/store/existencias/existencias-por-almacen"
          },
          {
            "key": "existencias-disponibilidad",
            "label": "Disponibilidad",
            "live": false,
            "path": "store/existencias/disponibilidad",
            "permission": "store.existencias-disponibilidad.view",
            "own": false,
            "folder": "src/modules/store/existencias/disponibilidad"
          },
          {
            "key": "existencias-reservas",
            "label": "Reservas",
            "live": false,
            "path": "store/existencias/reservas",
            "permission": "store.existencias-reservas.view",
            "own": false,
            "folder": "src/modules/store/existencias/reservas"
          }
        ]
      },
      {
        "key": "movimientos",
        "label": "Movimientos",
        "screens": [
          {
            "key": "movimientos-entradas",
            "label": "Entradas",
            "live": true,
            "path": "store/tickets",
            "permission": "store.tickets.view",
            "own": false
          },
          {
            "key": "movimientos-salidas",
            "label": "Salidas",
            "live": true,
            "path": "store/departures",
            "permission": "store.departures.view",
            "own": false
          },
          {
            "key": "movimientos-ajustes",
            "label": "Ajustes",
            "live": false,
            "path": "store/movimientos/ajustes",
            "permission": "store.movimientos-ajustes.view",
            "own": false,
            "folder": "src/modules/store/movimientos/ajustes"
          },
          {
            "key": "movimientos-traspasos",
            "label": "Traspasos",
            "live": true,
            "path": "store/transfers",
            "permission": "store.transfers.view",
            "own": false
          },
          {
            "key": "movimientos-recepciones",
            "label": "Recepciones",
            "live": false,
            "path": "store/movimientos/recepciones",
            "permission": "store.movimientos-recepciones.view",
            "own": false,
            "folder": "src/modules/store/movimientos/recepciones"
          },
          {
            "key": "movimientos-inventario-en-transito",
            "label": "Inventario en tránsito",
            "live": false,
            "path": "store/movimientos/inventario-en-transito",
            "permission": "store.movimientos-inventario-en-transito.view",
            "own": false,
            "folder": "src/modules/store/movimientos/inventario-en-transito"
          },
          {
            "key": "movimientos-pedidos",
            "label": "Pedidos",
            "live": true,
            "path": "store/orders",
            "permission": "store.orders.view",
            "own": false
          }
        ]
      },
      {
        "key": "control-de-inventario",
        "label": "Control de inventario",
        "screens": [
          {
            "key": "control-de-inventario-kardex",
            "label": "Kardex",
            "live": false,
            "path": "store/control-de-inventario/kardex",
            "permission": "store.control-de-inventario-kardex.view",
            "own": false,
            "folder": "src/modules/store/control-de-inventario/kardex"
          },
          {
            "key": "control-de-inventario-conteos-fisicos",
            "label": "Conteos físicos",
            "live": false,
            "path": "store/control-de-inventario/conteos-fisicos",
            "permission": "store.control-de-inventario-conteos-fisicos.view",
            "own": false,
            "folder": "src/modules/store/control-de-inventario/conteos-fisicos"
          },
          {
            "key": "control-de-inventario-conteos-ciclicos",
            "label": "Conteos cíclicos",
            "live": false,
            "path": "store/control-de-inventario/conteos-ciclicos",
            "permission": "store.control-de-inventario-conteos-ciclicos.view",
            "own": false,
            "folder": "src/modules/store/control-de-inventario/conteos-ciclicos"
          },
          {
            "key": "control-de-inventario-conciliacion",
            "label": "Conciliación",
            "live": false,
            "path": "store/control-de-inventario/conciliacion",
            "permission": "store.control-de-inventario-conciliacion.view",
            "own": false,
            "folder": "src/modules/store/control-de-inventario/conciliacion"
          },
          {
            "key": "control-de-inventario-trazabilidad",
            "label": "Trazabilidad",
            "live": false,
            "path": "store/control-de-inventario/trazabilidad",
            "permission": "store.control-de-inventario-trazabilidad.view",
            "own": false,
            "folder": "src/modules/store/control-de-inventario/trazabilidad"
          }
        ]
      },
      {
        "key": "lotes-y-series",
        "label": "Lotes y series",
        "screens": [
          {
            "key": "lotes-y-series-lotes",
            "label": "Lotes",
            "live": false,
            "path": "store/lotes-y-series/lotes",
            "permission": "store.lotes-y-series-lotes.view",
            "own": false,
            "folder": "src/modules/store/lotes-y-series/lotes"
          },
          {
            "key": "lotes-y-series-numeros-de-serie",
            "label": "Números de serie",
            "live": false,
            "path": "store/lotes-y-series/numeros-de-serie",
            "permission": "store.lotes-y-series-numeros-de-serie.view",
            "own": false,
            "folder": "src/modules/store/lotes-y-series/numeros-de-serie"
          },
          {
            "key": "lotes-y-series-caducidades",
            "label": "Caducidades",
            "live": false,
            "path": "store/lotes-y-series/caducidades",
            "permission": "store.lotes-y-series-caducidades.view",
            "own": false,
            "folder": "src/modules/store/lotes-y-series/caducidades"
          },
          {
            "key": "lotes-y-series-trazabilidad-de-origen-y-destino",
            "label": "Trazabilidad de origen y destino",
            "live": false,
            "path": "store/lotes-y-series/trazabilidad-de-origen-y-destino",
            "permission": "store.lotes-y-series-trazabilidad-de-origen-y-destino.view",
            "own": false,
            "folder": "src/modules/store/lotes-y-series/trazabilidad-de-origen-y-destino"
          }
        ]
      },
      {
        "key": "reabastecimiento",
        "label": "Reabastecimiento",
        "screens": [
          {
            "key": "reabastecimiento-minimos-y-maximos",
            "label": "Mínimos y máximos",
            "live": false,
            "path": "store/reabastecimiento/minimos-y-maximos",
            "permission": "store.reabastecimiento-minimos-y-maximos.view",
            "own": false,
            "folder": "src/modules/store/reabastecimiento/minimos-y-maximos"
          },
          {
            "key": "reabastecimiento-alertas",
            "label": "Alertas",
            "live": false,
            "path": "store/reabastecimiento/alertas",
            "permission": "store.reabastecimiento-alertas.view",
            "own": false,
            "folder": "src/modules/store/reabastecimiento/alertas"
          },
          {
            "key": "reabastecimiento-sugerencias-de-compra",
            "label": "Sugerencias de compra",
            "live": false,
            "path": "store/reabastecimiento/sugerencias-de-compra",
            "permission": "store.reabastecimiento-sugerencias-de-compra.view",
            "own": false,
            "folder": "src/modules/store/reabastecimiento/sugerencias-de-compra"
          },
          {
            "key": "reabastecimiento-politicas-de-reposicion",
            "label": "Políticas de reposición",
            "live": false,
            "path": "store/reabastecimiento/politicas-de-reposicion",
            "permission": "store.reabastecimiento-politicas-de-reposicion.view",
            "own": false,
            "folder": "src/modules/store/reabastecimiento/politicas-de-reposicion"
          }
        ]
      },
      {
        "key": "costos",
        "label": "Costos",
        "screens": [
          {
            "key": "costos-costos-de-inventario",
            "label": "Costos de inventario",
            "live": false,
            "path": "store/costos/costos-de-inventario",
            "permission": "store.costos-costos-de-inventario.view",
            "own": false,
            "folder": "src/modules/store/costos/costos-de-inventario"
          },
          {
            "key": "costos-valoracion",
            "label": "Valoración",
            "live": false,
            "path": "store/costos/valoracion",
            "permission": "store.costos-valoracion.view",
            "own": false,
            "folder": "src/modules/store/costos/valoracion"
          },
          {
            "key": "costos-historial-de-costos",
            "label": "Historial de costos",
            "live": false,
            "path": "store/costos/historial-de-costos",
            "permission": "store.costos-historial-de-costos.view",
            "own": false,
            "folder": "src/modules/store/costos/historial-de-costos"
          },
          {
            "key": "costos-configuracion-de-valoracion",
            "label": "Configuración de valoración",
            "live": false,
            "path": "store/costos/configuracion-de-valoracion",
            "permission": "store.costos-configuracion-de-valoracion.view",
            "own": false,
            "folder": "src/modules/store/costos/configuracion-de-valoracion"
          }
        ]
      },
      {
        "key": "administracion-de-almacenes",
        "label": "Administración de almacenes",
        "screens": [
          {
            "key": "administracion-de-almacenes-almacenes",
            "label": "Almacenes",
            "live": true,
            "path": "store",
            "permission": "store.warehouse.view",
            "own": false
          },
          {
            "key": "administracion-de-almacenes-ubicaciones-internas",
            "label": "Ubicaciones internas",
            "live": false,
            "path": "store/administracion-de-almacenes/ubicaciones-internas",
            "permission": "store.administracion-de-almacenes-ubicaciones-internas.view",
            "own": false,
            "folder": "src/modules/store/administracion-de-almacenes/ubicaciones-internas"
          },
          {
            "key": "administracion-de-almacenes-zonas",
            "label": "Zonas",
            "live": false,
            "path": "store/administracion-de-almacenes/zonas",
            "permission": "store.administracion-de-almacenes-zonas.view",
            "own": false,
            "folder": "src/modules/store/administracion-de-almacenes/zonas"
          },
          {
            "key": "administracion-de-almacenes-capacidad",
            "label": "Capacidad",
            "live": false,
            "path": "store/administracion-de-almacenes/capacidad",
            "permission": "store.administracion-de-almacenes-capacidad.view",
            "own": false,
            "folder": "src/modules/store/administracion-de-almacenes/capacidad"
          },
          {
            "key": "administracion-de-almacenes-configuracion",
            "label": "Configuración",
            "live": false,
            "path": "store/administracion-de-almacenes/configuracion",
            "permission": "store.administracion-de-almacenes-configuracion.view",
            "own": false,
            "folder": "src/modules/store/administracion-de-almacenes/configuracion"
          }
        ]
      }
    ]
  },
  {
    "key": "production",
    "label": "Producción y manufactura",
    "icon": "production",
    "order": 80,
    "description": "Órdenes, materiales y fórmulas, ejecución, planificación, calidad, mantenimiento y costos de fabricación.",
    "requiredPermission": "production.view",
    "groups": [
      {
        "key": "ordenes-de-produccion",
        "label": "Órdenes de producción",
        "screens": [
          {
            "key": "ordenes-de-produccion-crear-ordenes",
            "label": "Crear órdenes",
            "live": false,
            "path": "production/ordenes-de-produccion/crear-ordenes",
            "permission": "production.ordenes-de-produccion-crear-ordenes.view",
            "own": false,
            "folder": "src/modules/production/ordenes-de-produccion/crear-ordenes"
          },
          {
            "key": "ordenes-de-produccion-planificacion",
            "label": "Planificación",
            "live": false,
            "path": "production/ordenes-de-produccion/planificacion",
            "permission": "production.ordenes-de-produccion-planificacion.view",
            "own": false,
            "folder": "src/modules/production/ordenes-de-produccion/planificacion"
          },
          {
            "key": "ordenes-de-produccion-cola-de-trabajo",
            "label": "Cola de trabajo",
            "live": true,
            "path": "production/queue",
            "permission": "production.queue.view",
            "own": false
          },
          {
            "key": "ordenes-de-produccion-seguimiento",
            "label": "Seguimiento",
            "live": true,
            "path": "production/orders",
            "permission": "production.orders.view",
            "own": false
          },
          {
            "key": "ordenes-de-produccion-cierre",
            "label": "Cierre",
            "live": false,
            "path": "production/ordenes-de-produccion/cierre",
            "permission": "production.ordenes-de-produccion-cierre.view",
            "own": false,
            "folder": "src/modules/production/ordenes-de-produccion/cierre"
          }
        ]
      },
      {
        "key": "materiales-y-formulas",
        "label": "Materiales y fórmulas",
        "screens": [
          {
            "key": "materiales-y-formulas-listas-de-materiales",
            "label": "Listas de materiales",
            "live": false,
            "path": "production/materiales-y-formulas/listas-de-materiales",
            "permission": "production.materiales-y-formulas-listas-de-materiales.view",
            "own": false,
            "folder": "src/modules/production/materiales-y-formulas/listas-de-materiales"
          },
          {
            "key": "materiales-y-formulas-versiones",
            "label": "Versiones",
            "live": false,
            "path": "production/materiales-y-formulas/versiones",
            "permission": "production.materiales-y-formulas-versiones.view",
            "own": false,
            "folder": "src/modules/production/materiales-y-formulas/versiones"
          },
          {
            "key": "materiales-y-formulas-recetas-industriales",
            "label": "Recetas industriales",
            "live": false,
            "path": "production/materiales-y-formulas/recetas-industriales",
            "permission": "production.materiales-y-formulas-recetas-industriales.view",
            "own": false,
            "folder": "src/modules/production/materiales-y-formulas/recetas-industriales"
          },
          {
            "key": "materiales-y-formulas-subproductos",
            "label": "Subproductos",
            "live": false,
            "path": "production/materiales-y-formulas/subproductos",
            "permission": "production.materiales-y-formulas-subproductos.view",
            "own": false,
            "folder": "src/modules/production/materiales-y-formulas/subproductos"
          },
          {
            "key": "materiales-y-formulas-sustituciones-autorizadas",
            "label": "Sustituciones autorizadas",
            "live": false,
            "path": "production/materiales-y-formulas/sustituciones-autorizadas",
            "permission": "production.materiales-y-formulas-sustituciones-autorizadas.view",
            "own": false,
            "folder": "src/modules/production/materiales-y-formulas/sustituciones-autorizadas"
          }
        ]
      },
      {
        "key": "ejecucion",
        "label": "Ejecución",
        "screens": [
          {
            "key": "ejecucion-operaciones",
            "label": "Operaciones",
            "live": false,
            "path": "production/ejecucion/operaciones",
            "permission": "production.ejecucion-operaciones.view",
            "own": false,
            "folder": "src/modules/production/ejecucion/operaciones"
          },
          {
            "key": "ejecucion-centros-de-trabajo",
            "label": "Centros de trabajo",
            "live": true,
            "path": "production/areas",
            "permission": "production.areas.view",
            "own": false
          },
          {
            "key": "ejecucion-consumos",
            "label": "Consumos",
            "live": false,
            "path": "production/ejecucion/consumos",
            "permission": "production.ejecucion-consumos.view",
            "own": false,
            "folder": "src/modules/production/ejecucion/consumos"
          },
          {
            "key": "ejecucion-producto-terminado",
            "label": "Producto terminado",
            "live": false,
            "path": "production/ejecucion/producto-terminado",
            "permission": "production.ejecucion-producto-terminado.view",
            "own": false,
            "folder": "src/modules/production/ejecucion/producto-terminado"
          },
          {
            "key": "ejecucion-mermas",
            "label": "Mermas",
            "live": false,
            "path": "production/ejecucion/mermas",
            "permission": "production.ejecucion-mermas.view",
            "own": false,
            "folder": "src/modules/production/ejecucion/mermas"
          },
          {
            "key": "ejecucion-rechazos",
            "label": "Rechazos",
            "live": false,
            "path": "production/ejecucion/rechazos",
            "permission": "production.ejecucion-rechazos.view",
            "own": false,
            "folder": "src/modules/production/ejecucion/rechazos"
          }
        ]
      },
      {
        "key": "planificacion",
        "label": "Planificación",
        "screens": [
          {
            "key": "planificacion-necesidades-de-materiales",
            "label": "Necesidades de materiales",
            "live": false,
            "path": "production/planificacion/necesidades-de-materiales",
            "permission": "production.planificacion-necesidades-de-materiales.view",
            "own": false,
            "folder": "src/modules/production/planificacion/necesidades-de-materiales"
          },
          {
            "key": "planificacion-capacidad",
            "label": "Capacidad",
            "live": false,
            "path": "production/planificacion/capacidad",
            "permission": "production.planificacion-capacidad.view",
            "own": false,
            "folder": "src/modules/production/planificacion/capacidad"
          },
          {
            "key": "planificacion-calendarios",
            "label": "Calendarios",
            "live": false,
            "path": "production/planificacion/calendarios",
            "permission": "production.planificacion-calendarios.view",
            "own": false,
            "folder": "src/modules/production/planificacion/calendarios"
          },
          {
            "key": "planificacion-programacion-de-produccion",
            "label": "Programación de producción",
            "live": false,
            "path": "production/planificacion/programacion-de-produccion",
            "permission": "production.planificacion-programacion-de-produccion.view",
            "own": false,
            "folder": "src/modules/production/planificacion/programacion-de-produccion"
          }
        ]
      },
      {
        "key": "calidad-y-mantenimiento",
        "label": "Calidad y mantenimiento",
        "screens": [
          {
            "key": "calidad-y-mantenimiento-inspecciones",
            "label": "Inspecciones",
            "live": false,
            "path": "production/calidad-y-mantenimiento/inspecciones",
            "permission": "production.calidad-y-mantenimiento-inspecciones.view",
            "own": false,
            "folder": "src/modules/production/calidad-y-mantenimiento/inspecciones"
          },
          {
            "key": "calidad-y-mantenimiento-no-conformidades",
            "label": "No conformidades",
            "live": false,
            "path": "production/calidad-y-mantenimiento/no-conformidades",
            "permission": "production.calidad-y-mantenimiento-no-conformidades.view",
            "own": false,
            "folder": "src/modules/production/calidad-y-mantenimiento/no-conformidades"
          },
          {
            "key": "calidad-y-mantenimiento-equipos",
            "label": "Equipos",
            "live": false,
            "path": "production/calidad-y-mantenimiento/equipos",
            "permission": "production.calidad-y-mantenimiento-equipos.view",
            "own": false,
            "folder": "src/modules/production/calidad-y-mantenimiento/equipos"
          },
          {
            "key": "calidad-y-mantenimiento-mantenimiento-preventivo",
            "label": "Mantenimiento preventivo",
            "live": false,
            "path": "production/calidad-y-mantenimiento/mantenimiento-preventivo",
            "permission": "production.calidad-y-mantenimiento-mantenimiento-preventivo.view",
            "own": false,
            "folder": "src/modules/production/calidad-y-mantenimiento/mantenimiento-preventivo"
          },
          {
            "key": "calidad-y-mantenimiento-ordenes-de-mantenimiento",
            "label": "Órdenes de mantenimiento",
            "live": false,
            "path": "production/calidad-y-mantenimiento/ordenes-de-mantenimiento",
            "permission": "production.calidad-y-mantenimiento-ordenes-de-mantenimiento.view",
            "own": false,
            "folder": "src/modules/production/calidad-y-mantenimiento/ordenes-de-mantenimiento"
          }
        ]
      },
      {
        "key": "costos-de-fabricacion",
        "label": "Costos de fabricación",
        "screens": [
          {
            "key": "costos-de-fabricacion-materiales",
            "label": "Materiales",
            "live": false,
            "path": "production/costos-de-fabricacion/materiales",
            "permission": "production.costos-de-fabricacion-materiales.view",
            "own": false,
            "folder": "src/modules/production/costos-de-fabricacion/materiales"
          },
          {
            "key": "costos-de-fabricacion-mano-de-obra",
            "label": "Mano de obra",
            "live": false,
            "path": "production/costos-de-fabricacion/mano-de-obra",
            "permission": "production.costos-de-fabricacion-mano-de-obra.view",
            "own": false,
            "folder": "src/modules/production/costos-de-fabricacion/mano-de-obra"
          },
          {
            "key": "costos-de-fabricacion-costos-indirectos",
            "label": "Costos indirectos",
            "live": false,
            "path": "production/costos-de-fabricacion/costos-indirectos",
            "permission": "production.costos-de-fabricacion-costos-indirectos.view",
            "own": false,
            "folder": "src/modules/production/costos-de-fabricacion/costos-indirectos"
          },
          {
            "key": "costos-de-fabricacion-costos-reales-y-estimados",
            "label": "Costos reales y estimados",
            "live": false,
            "path": "production/costos-de-fabricacion/costos-reales-y-estimados",
            "permission": "production.costos-de-fabricacion-costos-reales-y-estimados.view",
            "own": false,
            "folder": "src/modules/production/costos-de-fabricacion/costos-reales-y-estimados"
          }
        ]
      }
    ]
  },
  {
    "key": "restaurants",
    "label": "Restaurantes y Food Service",
    "icon": "restaurants",
    "order": 90,
    "description": "Salón, comandas, menús, cocina (KDS), recetas y entrega.",
    "requiredPermission": "restaurants.view",
    "groups": [
      {
        "key": "salon",
        "label": "Salón",
        "screens": [
          {
            "key": "salon-plano",
            "label": "Plano",
            "live": false,
            "path": "restaurants/salon/plano",
            "permission": "restaurants.salon-plano.view",
            "own": false,
            "folder": "src/modules/restaurants/salon/plano"
          },
          {
            "key": "salon-salones",
            "label": "Salones",
            "live": false,
            "path": "restaurants/salon/salones",
            "permission": "restaurants.salon-salones.view",
            "own": false,
            "folder": "src/modules/restaurants/salon/salones"
          },
          {
            "key": "salon-zonas",
            "label": "Zonas",
            "live": false,
            "path": "restaurants/salon/zonas",
            "permission": "restaurants.salon-zonas.view",
            "own": false,
            "folder": "src/modules/restaurants/salon/zonas"
          },
          {
            "key": "salon-mesas",
            "label": "Mesas",
            "live": false,
            "path": "restaurants/salon/mesas",
            "permission": "restaurants.salon-mesas.view",
            "own": false,
            "folder": "src/modules/restaurants/salon/mesas"
          },
          {
            "key": "salon-asignacion-de-meseros",
            "label": "Asignación de meseros",
            "live": false,
            "path": "restaurants/salon/asignacion-de-meseros",
            "permission": "restaurants.salon-asignacion-de-meseros.view",
            "own": false,
            "folder": "src/modules/restaurants/salon/asignacion-de-meseros"
          },
          {
            "key": "salon-reservaciones",
            "label": "Reservaciones",
            "live": false,
            "path": "restaurants/salon/reservaciones",
            "permission": "restaurants.salon-reservaciones.view",
            "own": false,
            "folder": "src/modules/restaurants/salon/reservaciones"
          }
        ]
      },
      {
        "key": "comandas",
        "label": "Comandas",
        "screens": [
          {
            "key": "comandas-nueva-comanda",
            "label": "Nueva comanda",
            "live": false,
            "path": "restaurants/comandas/nueva-comanda",
            "permission": "restaurants.comandas-nueva-comanda.view",
            "own": false,
            "folder": "src/modules/restaurants/comandas/nueva-comanda"
          },
          {
            "key": "comandas-modificaciones",
            "label": "Modificaciones",
            "live": false,
            "path": "restaurants/comandas/modificaciones",
            "permission": "restaurants.comandas-modificaciones.view",
            "own": false,
            "folder": "src/modules/restaurants/comandas/modificaciones"
          },
          {
            "key": "comandas-division-de-cuentas",
            "label": "División de cuentas",
            "live": false,
            "path": "restaurants/comandas/division-de-cuentas",
            "permission": "restaurants.comandas-division-de-cuentas.view",
            "own": false,
            "folder": "src/modules/restaurants/comandas/division-de-cuentas"
          },
          {
            "key": "comandas-division-de-conceptos",
            "label": "División de conceptos",
            "live": false,
            "path": "restaurants/comandas/division-de-conceptos",
            "permission": "restaurants.comandas-division-de-conceptos.view",
            "own": false,
            "folder": "src/modules/restaurants/comandas/division-de-conceptos"
          },
          {
            "key": "comandas-estados",
            "label": "Estados",
            "live": false,
            "path": "restaurants/comandas/estados",
            "permission": "restaurants.comandas-estados.view",
            "own": false,
            "folder": "src/modules/restaurants/comandas/estados"
          }
        ]
      },
      {
        "key": "menus",
        "label": "Menús",
        "screens": [
          {
            "key": "menus-menus",
            "label": "Menús",
            "live": false,
            "path": "restaurants/menus/menus",
            "permission": "restaurants.menus-menus.view",
            "own": false,
            "folder": "src/modules/restaurants/menus/menus"
          },
          {
            "key": "menus-categorias",
            "label": "Categorías",
            "live": false,
            "path": "restaurants/menus/categorias",
            "permission": "restaurants.menus-categorias.view",
            "own": false,
            "folder": "src/modules/restaurants/menus/categorias"
          },
          {
            "key": "menus-platillos",
            "label": "Platillos",
            "live": false,
            "path": "restaurants/menus/platillos",
            "permission": "restaurants.menus-platillos.view",
            "own": false,
            "folder": "src/modules/restaurants/menus/platillos"
          },
          {
            "key": "menus-modificadores",
            "label": "Modificadores",
            "live": false,
            "path": "restaurants/menus/modificadores",
            "permission": "restaurants.menus-modificadores.view",
            "own": false,
            "folder": "src/modules/restaurants/menus/modificadores"
          },
          {
            "key": "menus-complementos",
            "label": "Complementos",
            "live": false,
            "path": "restaurants/menus/complementos",
            "permission": "restaurants.menus-complementos.view",
            "own": false,
            "folder": "src/modules/restaurants/menus/complementos"
          },
          {
            "key": "menus-disponibilidad",
            "label": "Disponibilidad",
            "live": false,
            "path": "restaurants/menus/disponibilidad",
            "permission": "restaurants.menus-disponibilidad.view",
            "own": false,
            "folder": "src/modules/restaurants/menus/disponibilidad"
          }
        ]
      },
      {
        "key": "cocina",
        "label": "Cocina",
        "screens": [
          {
            "key": "cocina-estaciones",
            "label": "Estaciones",
            "live": false,
            "path": "restaurants/cocina/estaciones",
            "permission": "restaurants.cocina-estaciones.view",
            "own": false,
            "folder": "src/modules/restaurants/cocina/estaciones"
          },
          {
            "key": "cocina-cola-de-preparacion",
            "label": "Cola de preparación",
            "live": false,
            "path": "restaurants/cocina/cola-de-preparacion",
            "permission": "restaurants.cocina-cola-de-preparacion.view",
            "own": false,
            "folder": "src/modules/restaurants/cocina/cola-de-preparacion"
          },
          {
            "key": "cocina-enrutamiento",
            "label": "Enrutamiento",
            "live": false,
            "path": "restaurants/cocina/enrutamiento",
            "permission": "restaurants.cocina-enrutamiento.view",
            "own": false,
            "folder": "src/modules/restaurants/cocina/enrutamiento"
          },
          {
            "key": "cocina-tiempos",
            "label": "Tiempos",
            "live": false,
            "path": "restaurants/cocina/tiempos",
            "permission": "restaurants.cocina-tiempos.view",
            "own": false,
            "folder": "src/modules/restaurants/cocina/tiempos"
          },
          {
            "key": "cocina-pantalla-kds",
            "label": "Pantalla KDS",
            "live": false,
            "path": "restaurants/cocina/pantalla-kds",
            "permission": "restaurants.cocina-pantalla-kds.view",
            "own": false,
            "folder": "src/modules/restaurants/cocina/pantalla-kds"
          }
        ]
      },
      {
        "key": "recetas",
        "label": "Recetas",
        "screens": [
          {
            "key": "recetas-ingredientes",
            "label": "Ingredientes",
            "live": false,
            "path": "restaurants/recetas/ingredientes",
            "permission": "restaurants.recetas-ingredientes.view",
            "own": false,
            "folder": "src/modules/restaurants/recetas/ingredientes"
          },
          {
            "key": "recetas-subrecetas",
            "label": "Subrecetas",
            "live": false,
            "path": "restaurants/recetas/subrecetas",
            "permission": "restaurants.recetas-subrecetas.view",
            "own": false,
            "folder": "src/modules/restaurants/recetas/subrecetas"
          },
          {
            "key": "recetas-rendimientos",
            "label": "Rendimientos",
            "live": false,
            "path": "restaurants/recetas/rendimientos",
            "permission": "restaurants.recetas-rendimientos.view",
            "own": false,
            "folder": "src/modules/restaurants/recetas/rendimientos"
          },
          {
            "key": "recetas-unidades-de-consumo",
            "label": "Unidades de consumo",
            "live": false,
            "path": "restaurants/recetas/unidades-de-consumo",
            "permission": "restaurants.recetas-unidades-de-consumo.view",
            "own": false,
            "folder": "src/modules/restaurants/recetas/unidades-de-consumo"
          },
          {
            "key": "recetas-mermas",
            "label": "Mermas",
            "live": false,
            "path": "restaurants/recetas/mermas",
            "permission": "restaurants.recetas-mermas.view",
            "own": false,
            "folder": "src/modules/restaurants/recetas/mermas"
          },
          {
            "key": "recetas-costos",
            "label": "Costos",
            "live": false,
            "path": "restaurants/recetas/costos",
            "permission": "restaurants.recetas-costos.view",
            "own": false,
            "folder": "src/modules/restaurants/recetas/costos"
          }
        ]
      },
      {
        "key": "entrega",
        "label": "Entrega",
        "screens": [
          {
            "key": "entrega-para-llevar",
            "label": "Para llevar",
            "live": false,
            "path": "restaurants/entrega/para-llevar",
            "permission": "restaurants.entrega-para-llevar.view",
            "own": false,
            "folder": "src/modules/restaurants/entrega/para-llevar"
          },
          {
            "key": "entrega-reparto",
            "label": "Reparto",
            "live": false,
            "path": "restaurants/entrega/reparto",
            "permission": "restaurants.entrega-reparto.view",
            "own": false,
            "folder": "src/modules/restaurants/entrega/reparto"
          },
          {
            "key": "entrega-entregas",
            "label": "Entregas",
            "live": false,
            "path": "restaurants/entrega/entregas",
            "permission": "restaurants.entrega-entregas.view",
            "own": false,
            "folder": "src/modules/restaurants/entrega/entregas"
          },
          {
            "key": "entrega-canales-externos",
            "label": "Canales externos",
            "live": false,
            "path": "restaurants/entrega/canales-externos",
            "permission": "restaurants.entrega-canales-externos.view",
            "own": false,
            "folder": "src/modules/restaurants/entrega/canales-externos"
          },
          {
            "key": "entrega-seguimiento-de-pedidos",
            "label": "Seguimiento de pedidos",
            "live": false,
            "path": "restaurants/entrega/seguimiento-de-pedidos",
            "permission": "restaurants.entrega-seguimiento-de-pedidos.view",
            "own": false,
            "folder": "src/modules/restaurants/entrega/seguimiento-de-pedidos"
          }
        ]
      }
    ]
  },
  {
    "key": "catalogos",
    "label": "Catálogos",
    "icon": "catalog",
    "order": 100,
    "description": "Productos y servicios, clasificación, unidades, precios, impuestos y otros catálogos.",
    "requiredPermission": "catalogos.view",
    "groups": [
      {
        "key": "productos-y-servicios",
        "label": "Productos y servicios",
        "screens": [
          {
            "key": "productos-y-servicios-articulos",
            "label": "Artículos",
            "live": true,
            "path": "catalogos/articles",
            "permission": "catalogos.articles.view",
            "own": false
          },
          {
            "key": "productos-y-servicios-servicios",
            "label": "Servicios",
            "live": true,
            "path": "catalogos/services",
            "permission": "catalogos.services.view",
            "own": false
          },
          {
            "key": "productos-y-servicios-variantes",
            "label": "Plantillas de variantes",
            "live": false,
            "path": "catalogos/productos-y-servicios/variantes",
            "permission": "catalogos.productos-y-servicios-variantes.view",
            "own": false,
            "folder": "src/modules/catalogos/productos-y-servicios/variantes"
          },
          {
            "key": "productos-y-servicios-presentaciones",
            "label": "Presentaciones",
            "live": false,
            "path": "catalogos/productos-y-servicios/presentaciones",
            "permission": "catalogos.productos-y-servicios-presentaciones.view",
            "own": false,
            "folder": "src/modules/catalogos/productos-y-servicios/presentaciones"
          },
          {
            "key": "productos-y-servicios-codigos-de-barras",
            "label": "Códigos de barras",
            "live": false,
            "path": "catalogos/productos-y-servicios/codigos-de-barras",
            "permission": "catalogos.productos-y-servicios-codigos-de-barras.view",
            "own": false,
            "folder": "src/modules/catalogos/productos-y-servicios/codigos-de-barras"
          },
          {
            "key": "productos-y-servicios-kits-y-paquetes",
            "label": "Kits y paquetes",
            "live": false,
            "path": "catalogos/productos-y-servicios/kits-y-paquetes",
            "permission": "catalogos.productos-y-servicios-kits-y-paquetes.view",
            "own": false,
            "folder": "src/modules/catalogos/productos-y-servicios/kits-y-paquetes"
          }
        ]
      },
      {
        "key": "clasificacion",
        "label": "Clasificación",
        "screens": [
          {
            "key": "clasificacion-familias",
            "label": "Familias",
            "live": true,
            "path": "catalogos/familias",
            "permission": "catalogos.familias.view",
            "own": false
          },
          {
            "key": "clasificacion-categorias",
            "label": "Categorías",
            "live": true,
            "path": "catalogos/categories",
            "permission": "catalogos.containers.view",
            "own": false
          },
          {
            "key": "clasificacion-subcategorias",
            "label": "Subcategorías",
            "live": false,
            "path": "catalogos/clasificacion/subcategorias",
            "permission": "catalogos.clasificacion-subcategorias.view",
            "own": false,
            "folder": "src/modules/catalogos/clasificacion/subcategorias"
          },
          {
            "key": "clasificacion-marcas",
            "label": "Marcas",
            "live": false,
            "path": "catalogos/clasificacion/marcas",
            "permission": "catalogos.clasificacion-marcas.view",
            "own": false,
            "folder": "src/modules/catalogos/clasificacion/marcas"
          },
          {
            "key": "clasificacion-modelos",
            "label": "Modelos",
            "live": false,
            "path": "catalogos/clasificacion/modelos",
            "permission": "catalogos.clasificacion-modelos.view",
            "own": false,
            "folder": "src/modules/catalogos/clasificacion/modelos"
          },
          {
            "key": "clasificacion-atributos",
            "label": "Atributos",
            "live": false,
            "path": "catalogos/clasificacion/atributos",
            "permission": "catalogos.clasificacion-atributos.view",
            "own": false,
            "folder": "src/modules/catalogos/clasificacion/atributos"
          },
          {
            "key": "clasificacion-caracteristicas",
            "label": "Características",
            "live": false,
            "path": "catalogos/clasificacion/caracteristicas",
            "permission": "catalogos.clasificacion-caracteristicas.view",
            "own": false,
            "folder": "src/modules/catalogos/clasificacion/caracteristicas"
          }
        ]
      },
      {
        "key": "unidades-y-cantidades",
        "label": "Unidades y cantidades",
        "screens": [
          {
            "key": "unidades-y-cantidades-unidades-de-medida",
            "label": "Unidades de medida",
            "live": true,
            "path": "catalogos/units",
            "permission": "catalogos.units.view",
            "own": false
          },
          {
            "key": "unidades-y-cantidades-conversiones",
            "label": "Conversiones",
            "live": false,
            "path": "catalogos/unidades-y-cantidades/conversiones",
            "permission": "catalogos.unidades-y-cantidades-conversiones.view",
            "own": false,
            "folder": "src/modules/catalogos/unidades-y-cantidades/conversiones"
          },
          {
            "key": "unidades-y-cantidades-unidades-de-compra",
            "label": "Unidades de compra",
            "live": false,
            "path": "catalogos/unidades-y-cantidades/unidades-de-compra",
            "permission": "catalogos.unidades-y-cantidades-unidades-de-compra.view",
            "own": false,
            "folder": "src/modules/catalogos/unidades-y-cantidades/unidades-de-compra"
          },
          {
            "key": "unidades-y-cantidades-unidades-de-venta",
            "label": "Unidades de venta",
            "live": false,
            "path": "catalogos/unidades-y-cantidades/unidades-de-venta",
            "permission": "catalogos.unidades-y-cantidades-unidades-de-venta.view",
            "own": false,
            "folder": "src/modules/catalogos/unidades-y-cantidades/unidades-de-venta"
          }
        ]
      },
      {
        "key": "precios-y-condiciones",
        "label": "Precios y condiciones",
        "screens": [
          {
            "key": "precios-y-condiciones-listas-de-precios",
            "label": "Listas de precios",
            "live": false,
            "path": "catalogos/precios-y-condiciones/listas-de-precios",
            "permission": "catalogos.precios-y-condiciones-listas-de-precios.view",
            "own": false,
            "folder": "src/modules/catalogos/precios-y-condiciones/listas-de-precios"
          },
          {
            "key": "precios-y-condiciones-rangos",
            "label": "Rangos",
            "live": true,
            "path": "catalogos/price-ranges",
            "permission": "catalogos.prices.view",
            "own": false
          },
          {
            "key": "precios-y-condiciones-tarifas",
            "label": "Tarifas",
            "live": false,
            "path": "catalogos/precios-y-condiciones/tarifas",
            "permission": "catalogos.precios-y-condiciones-tarifas.view",
            "own": false,
            "folder": "src/modules/catalogos/precios-y-condiciones/tarifas"
          },
          {
            "key": "precios-y-condiciones-condiciones-comerciales",
            "label": "Condiciones comerciales",
            "live": false,
            "path": "catalogos/precios-y-condiciones/condiciones-comerciales",
            "permission": "catalogos.precios-y-condiciones-condiciones-comerciales.view",
            "own": false,
            "folder": "src/modules/catalogos/precios-y-condiciones/condiciones-comerciales"
          },
          {
            "key": "precios-y-condiciones-reglas-de-precio",
            "label": "Reglas de precio",
            "live": false,
            "path": "catalogos/precios-y-condiciones/reglas-de-precio",
            "permission": "catalogos.precios-y-condiciones-reglas-de-precio.view",
            "own": false,
            "folder": "src/modules/catalogos/precios-y-condiciones/reglas-de-precio"
          }
        ]
      },
      {
        "key": "impuestos-y-monedas",
        "label": "Impuestos y monedas",
        "screens": [
          {
            "key": "impuestos-y-monedas-impuestos",
            "label": "Impuestos",
            "live": false,
            "path": "catalogos/impuestos-y-monedas/impuestos",
            "permission": "catalogos.impuestos-y-monedas-impuestos.view",
            "own": false,
            "folder": "src/modules/catalogos/impuestos-y-monedas/impuestos"
          },
          {
            "key": "impuestos-y-monedas-monedas",
            "label": "Monedas",
            "live": false,
            "path": "catalogos/impuestos-y-monedas/monedas",
            "permission": "catalogos.impuestos-y-monedas-monedas.view",
            "own": false,
            "folder": "src/modules/catalogos/impuestos-y-monedas/monedas"
          },
          {
            "key": "impuestos-y-monedas-tipos-de-cambio",
            "label": "Tipos de cambio",
            "live": false,
            "path": "catalogos/impuestos-y-monedas/tipos-de-cambio",
            "permission": "catalogos.impuestos-y-monedas-tipos-de-cambio.view",
            "own": false,
            "folder": "src/modules/catalogos/impuestos-y-monedas/tipos-de-cambio"
          },
          {
            "key": "impuestos-y-monedas-catalogos-fiscales",
            "label": "Catálogos fiscales",
            "live": false,
            "path": "catalogos/impuestos-y-monedas/catalogos-fiscales",
            "permission": "catalogos.impuestos-y-monedas-catalogos-fiscales.view",
            "own": false,
            "folder": "src/modules/catalogos/impuestos-y-monedas/catalogos-fiscales"
          }
        ]
      },
      {
        "key": "otros-catalogos",
        "label": "Otros catálogos",
        "screens": [
          {
            "key": "otros-catalogos-metodos-de-pago",
            "label": "Métodos de pago",
            "live": true,
            "path": "catalogos/payment-methods",
            "permission": "catalogos.payment-methods.view",
            "own": false
          },
          {
            "key": "otros-catalogos-motivos-de-ajuste",
            "label": "Motivos de ajuste",
            "live": false,
            "path": "catalogos/otros-catalogos/motivos-de-ajuste",
            "permission": "catalogos.otros-catalogos-motivos-de-ajuste.view",
            "own": false,
            "folder": "src/modules/catalogos/otros-catalogos/motivos-de-ajuste"
          },
          {
            "key": "otros-catalogos-motivos-de-cancelacion",
            "label": "Motivos de cancelación",
            "live": false,
            "path": "catalogos/otros-catalogos/motivos-de-cancelacion",
            "permission": "catalogos.otros-catalogos-motivos-de-cancelacion.view",
            "own": false,
            "folder": "src/modules/catalogos/otros-catalogos/motivos-de-cancelacion"
          },
          {
            "key": "otros-catalogos-tipos-de-documento",
            "label": "Tipos de documento",
            "live": false,
            "path": "catalogos/otros-catalogos/tipos-de-documento",
            "permission": "catalogos.otros-catalogos-tipos-de-documento.view",
            "own": false,
            "folder": "src/modules/catalogos/otros-catalogos/tipos-de-documento"
          },
          {
            "key": "otros-catalogos-tipos-de-area",
            "label": "Tipos de área",
            "live": true,
            "path": "catalogos/types",
            "permission": "catalogos.types.view",
            "own": false
          },
          {
            "key": "otros-catalogos-subareas",
            "label": "Subáreas",
            "live": true,
            "path": "catalogos/areas",
            "permission": "catalogos.areas.view",
            "own": false
          }
        ]
      }
    ]
  },
  {
    "key": "finance",
    "label": "Finanzas y contabilidad",
    "icon": "finance",
    "order": 110,
    "description": "Contabilidad general, cierres, cuentas por pagar, bancos, costos, activos fijos, consolidación y estados financieros.",
    "requiredPermission": "finance.view",
    "groups": [
      {
        "key": "contabilidad-general",
        "label": "Contabilidad general",
        "screens": [
          {
            "key": "contabilidad-general-catalogo-de-cuentas",
            "label": "Catálogo de cuentas",
            "live": false,
            "path": "finance/contabilidad-general/catalogo-de-cuentas",
            "permission": "accounting.view",
            "own": true,
            "folder": "src/modules/finance/contabilidad-general/catalogo-de-cuentas"
          },
          {
            "key": "contabilidad-general-polizas",
            "label": "Pólizas",
            "live": false,
            "path": "finance/contabilidad-general/polizas",
            "permission": "accounting.view",
            "own": true,
            "folder": "src/modules/finance/contabilidad-general/polizas"
          },
          {
            "key": "contabilidad-general-asientos",
            "label": "Asientos",
            "live": false,
            "path": "finance/contabilidad-general/asientos",
            "permission": "accounting.view",
            "own": true,
            "folder": "src/modules/finance/contabilidad-general/asientos"
          },
          {
            "key": "contabilidad-general-libro-diario",
            "label": "Libro diario",
            "live": false,
            "path": "finance/contabilidad-general/libro-diario",
            "permission": "accounting.view",
            "own": true,
            "folder": "src/modules/finance/contabilidad-general/libro-diario"
          },
          {
            "key": "contabilidad-general-mayor",
            "label": "Mayor",
            "live": false,
            "path": "finance/contabilidad-general/mayor",
            "permission": "accounting.view",
            "own": true,
            "folder": "src/modules/finance/contabilidad-general/mayor"
          },
          {
            "key": "contabilidad-general-balanza-de-comprobacion",
            "label": "Balanza de comprobación",
            "live": false,
            "path": "finance/contabilidad-general/balanza-de-comprobacion",
            "permission": "accounting.view",
            "own": true,
            "folder": "src/modules/finance/contabilidad-general/balanza-de-comprobacion"
          }
        ]
      },
      {
        "key": "cierres-contables",
        "label": "Cierres contables",
        "screens": [
          {
            "key": "cierres-contables-periodos",
            "label": "Periodos",
            "live": false,
            "path": "finance/cierres-contables/periodos",
            "permission": "accounting.view",
            "own": true,
            "folder": "src/modules/finance/cierres-contables/periodos"
          },
          {
            "key": "cierres-contables-ejercicios",
            "label": "Ejercicios",
            "live": false,
            "path": "finance/cierres-contables/ejercicios",
            "permission": "accounting.view",
            "own": true,
            "folder": "src/modules/finance/cierres-contables/ejercicios"
          },
          {
            "key": "cierres-contables-aperturas",
            "label": "Aperturas",
            "live": false,
            "path": "finance/cierres-contables/aperturas",
            "permission": "accounting.view",
            "own": true,
            "folder": "src/modules/finance/cierres-contables/aperturas"
          },
          {
            "key": "cierres-contables-ajustes",
            "label": "Ajustes",
            "live": false,
            "path": "finance/cierres-contables/ajustes",
            "permission": "accounting.view",
            "own": true,
            "folder": "src/modules/finance/cierres-contables/ajustes"
          },
          {
            "key": "cierres-contables-reversiones",
            "label": "Reversiones",
            "live": false,
            "path": "finance/cierres-contables/reversiones",
            "permission": "accounting.view",
            "own": true,
            "folder": "src/modules/finance/cierres-contables/reversiones"
          },
          {
            "key": "cierres-contables-cierre-mensual-y-anual",
            "label": "Cierre mensual y anual",
            "live": false,
            "path": "finance/cierres-contables/cierre-mensual-y-anual",
            "permission": "accounting.view",
            "own": true,
            "folder": "src/modules/finance/cierres-contables/cierre-mensual-y-anual"
          }
        ]
      },
      {
        "key": "cuentas-por-pagar",
        "label": "Cuentas por pagar",
        "screens": [
          {
            "key": "cuentas-por-pagar-facturas",
            "label": "Facturas",
            "live": false,
            "path": "finance/cuentas-por-pagar/facturas",
            "permission": "finance.cuentas-por-pagar-facturas.view",
            "own": false,
            "folder": "src/modules/finance/cuentas-por-pagar/facturas"
          },
          {
            "key": "cuentas-por-pagar-anticipos",
            "label": "Anticipos",
            "live": false,
            "path": "finance/cuentas-por-pagar/anticipos",
            "permission": "finance.cuentas-por-pagar-anticipos.view",
            "own": false,
            "folder": "src/modules/finance/cuentas-por-pagar/anticipos"
          },
          {
            "key": "cuentas-por-pagar-vencimientos",
            "label": "Vencimientos",
            "live": false,
            "path": "finance/cuentas-por-pagar/vencimientos",
            "permission": "finance.cuentas-por-pagar-vencimientos.view",
            "own": false,
            "folder": "src/modules/finance/cuentas-por-pagar/vencimientos"
          },
          {
            "key": "cuentas-por-pagar-pagos",
            "label": "Pagos",
            "live": false,
            "path": "finance/cuentas-por-pagar/pagos",
            "permission": "finance.cuentas-por-pagar-pagos.view",
            "own": false,
            "folder": "src/modules/finance/cuentas-por-pagar/pagos"
          },
          {
            "key": "cuentas-por-pagar-aplicaciones",
            "label": "Aplicaciones",
            "live": false,
            "path": "finance/cuentas-por-pagar/aplicaciones",
            "permission": "finance.cuentas-por-pagar-aplicaciones.view",
            "own": false,
            "folder": "src/modules/finance/cuentas-por-pagar/aplicaciones"
          },
          {
            "key": "cuentas-por-pagar-propuestas-de-pago",
            "label": "Propuestas de pago",
            "live": false,
            "path": "finance/cuentas-por-pagar/propuestas-de-pago",
            "permission": "finance.cuentas-por-pagar-propuestas-de-pago.view",
            "own": false,
            "folder": "src/modules/finance/cuentas-por-pagar/propuestas-de-pago"
          }
        ]
      },
      {
        "key": "bancos-y-tesoreria",
        "label": "Bancos y tesorería",
        "screens": [
          {
            "key": "bancos-y-tesoreria-cuentas-bancarias",
            "label": "Cuentas bancarias",
            "live": false,
            "path": "finance/bancos-y-tesoreria/cuentas-bancarias",
            "permission": "finance.bancos-y-tesoreria-cuentas-bancarias.view",
            "own": false,
            "folder": "src/modules/finance/bancos-y-tesoreria/cuentas-bancarias"
          },
          {
            "key": "bancos-y-tesoreria-transferencias",
            "label": "Transferencias",
            "live": false,
            "path": "finance/bancos-y-tesoreria/transferencias",
            "permission": "finance.bancos-y-tesoreria-transferencias.view",
            "own": false,
            "folder": "src/modules/finance/bancos-y-tesoreria/transferencias"
          },
          {
            "key": "bancos-y-tesoreria-conciliacion-bancaria",
            "label": "Conciliación bancaria",
            "live": false,
            "path": "finance/bancos-y-tesoreria/conciliacion-bancaria",
            "permission": "finance.bancos-y-tesoreria-conciliacion-bancaria.view",
            "own": false,
            "folder": "src/modules/finance/bancos-y-tesoreria/conciliacion-bancaria"
          },
          {
            "key": "bancos-y-tesoreria-flujo-de-efectivo",
            "label": "Flujo de efectivo",
            "live": false,
            "path": "finance/bancos-y-tesoreria/flujo-de-efectivo",
            "permission": "finance.bancos-y-tesoreria-flujo-de-efectivo.view",
            "own": false,
            "folder": "src/modules/finance/bancos-y-tesoreria/flujo-de-efectivo"
          }
        ]
      },
      {
        "key": "costos-y-presupuestos",
        "label": "Costos y presupuestos",
        "screens": [
          {
            "key": "costos-y-presupuestos-centros-de-costos",
            "label": "Centros de costos",
            "live": false,
            "path": "finance/costos-y-presupuestos/centros-de-costos",
            "permission": "finance.costos-y-presupuestos-centros-de-costos.view",
            "own": false,
            "folder": "src/modules/finance/costos-y-presupuestos/centros-de-costos"
          },
          {
            "key": "costos-y-presupuestos-dimensiones",
            "label": "Dimensiones",
            "live": false,
            "path": "finance/costos-y-presupuestos/dimensiones",
            "permission": "finance.costos-y-presupuestos-dimensiones.view",
            "own": false,
            "folder": "src/modules/finance/costos-y-presupuestos/dimensiones"
          },
          {
            "key": "costos-y-presupuestos-presupuestos",
            "label": "Presupuestos",
            "live": false,
            "path": "finance/costos-y-presupuestos/presupuestos",
            "permission": "finance.costos-y-presupuestos-presupuestos.view",
            "own": false,
            "folder": "src/modules/finance/costos-y-presupuestos/presupuestos"
          },
          {
            "key": "costos-y-presupuestos-prorrateos",
            "label": "Prorrateos",
            "live": false,
            "path": "finance/costos-y-presupuestos/prorrateos",
            "permission": "finance.costos-y-presupuestos-prorrateos.view",
            "own": false,
            "folder": "src/modules/finance/costos-y-presupuestos/prorrateos"
          },
          {
            "key": "costos-y-presupuestos-analisis-de-desviaciones",
            "label": "Análisis de desviaciones",
            "live": false,
            "path": "finance/costos-y-presupuestos/analisis-de-desviaciones",
            "permission": "finance.costos-y-presupuestos-analisis-de-desviaciones.view",
            "own": false,
            "folder": "src/modules/finance/costos-y-presupuestos/analisis-de-desviaciones"
          }
        ]
      },
      {
        "key": "activos-fijos",
        "label": "Activos fijos",
        "screens": [
          {
            "key": "activos-fijos-registro",
            "label": "Registro",
            "live": false,
            "path": "finance/activos-fijos/registro",
            "permission": "finance.activos-fijos-registro.view",
            "own": false,
            "folder": "src/modules/finance/activos-fijos/registro"
          },
          {
            "key": "activos-fijos-depreciacion",
            "label": "Depreciación",
            "live": false,
            "path": "finance/activos-fijos/depreciacion",
            "permission": "finance.activos-fijos-depreciacion.view",
            "own": false,
            "folder": "src/modules/finance/activos-fijos/depreciacion"
          },
          {
            "key": "activos-fijos-mejoras",
            "label": "Mejoras",
            "live": false,
            "path": "finance/activos-fijos/mejoras",
            "permission": "finance.activos-fijos-mejoras.view",
            "own": false,
            "folder": "src/modules/finance/activos-fijos/mejoras"
          },
          {
            "key": "activos-fijos-deterioro",
            "label": "Deterioro",
            "live": false,
            "path": "finance/activos-fijos/deterioro",
            "permission": "finance.activos-fijos-deterioro.view",
            "own": false,
            "folder": "src/modules/finance/activos-fijos/deterioro"
          },
          {
            "key": "activos-fijos-bajas",
            "label": "Bajas",
            "live": false,
            "path": "finance/activos-fijos/bajas",
            "permission": "finance.activos-fijos-bajas.view",
            "own": false,
            "folder": "src/modules/finance/activos-fijos/bajas"
          },
          {
            "key": "activos-fijos-disposicion",
            "label": "Disposición",
            "live": false,
            "path": "finance/activos-fijos/disposicion",
            "permission": "finance.activos-fijos-disposicion.view",
            "own": false,
            "folder": "src/modules/finance/activos-fijos/disposicion"
          }
        ]
      },
      {
        "key": "multimoneda-y-consolidacion",
        "label": "Multimoneda y consolidación",
        "screens": [
          {
            "key": "multimoneda-y-consolidacion-diferencias-cambiarias",
            "label": "Diferencias cambiarias",
            "live": false,
            "path": "finance/multimoneda-y-consolidacion/diferencias-cambiarias",
            "permission": "finance.multimoneda-y-consolidacion-diferencias-cambiarias.view",
            "own": false,
            "folder": "src/modules/finance/multimoneda-y-consolidacion/diferencias-cambiarias"
          },
          {
            "key": "multimoneda-y-consolidacion-intercompania",
            "label": "Intercompañía",
            "live": false,
            "path": "finance/multimoneda-y-consolidacion/intercompania",
            "permission": "finance.multimoneda-y-consolidacion-intercompania.view",
            "own": false,
            "folder": "src/modules/finance/multimoneda-y-consolidacion/intercompania"
          },
          {
            "key": "multimoneda-y-consolidacion-eliminaciones",
            "label": "Eliminaciones",
            "live": false,
            "path": "finance/multimoneda-y-consolidacion/eliminaciones",
            "permission": "finance.multimoneda-y-consolidacion-eliminaciones.view",
            "own": false,
            "folder": "src/modules/finance/multimoneda-y-consolidacion/eliminaciones"
          },
          {
            "key": "multimoneda-y-consolidacion-estados-consolidados",
            "label": "Estados consolidados",
            "live": false,
            "path": "finance/multimoneda-y-consolidacion/estados-consolidados",
            "permission": "finance.multimoneda-y-consolidacion-estados-consolidados.view",
            "own": false,
            "folder": "src/modules/finance/multimoneda-y-consolidacion/estados-consolidados"
          }
        ]
      },
      {
        "key": "estados-financieros",
        "label": "Estados financieros",
        "screens": [
          {
            "key": "estados-financieros-balance-general",
            "label": "Balance general",
            "live": false,
            "path": "finance/estados-financieros/balance-general",
            "permission": "finance.estados-financieros-balance-general.view",
            "own": false,
            "folder": "src/modules/finance/estados-financieros/balance-general"
          },
          {
            "key": "estados-financieros-resultados",
            "label": "Resultados",
            "live": false,
            "path": "finance/estados-financieros/resultados",
            "permission": "finance.estados-financieros-resultados.view",
            "own": false,
            "folder": "src/modules/finance/estados-financieros/resultados"
          },
          {
            "key": "estados-financieros-flujo-de-efectivo",
            "label": "Flujo de efectivo",
            "live": false,
            "path": "finance/estados-financieros/flujo-de-efectivo",
            "permission": "finance.estados-financieros-flujo-de-efectivo.view",
            "own": false,
            "folder": "src/modules/finance/estados-financieros/flujo-de-efectivo"
          },
          {
            "key": "estados-financieros-cambios-en-capital",
            "label": "Cambios en capital",
            "live": false,
            "path": "finance/estados-financieros/cambios-en-capital",
            "permission": "finance.estados-financieros-cambios-en-capital.view",
            "own": false,
            "folder": "src/modules/finance/estados-financieros/cambios-en-capital"
          },
          {
            "key": "estados-financieros-auxiliares",
            "label": "Auxiliares",
            "live": false,
            "path": "finance/estados-financieros/auxiliares",
            "permission": "finance.estados-financieros-auxiliares.view",
            "own": false,
            "folder": "src/modules/finance/estados-financieros/auxiliares"
          }
        ]
      }
    ]
  },
  {
    "key": "fiscal",
    "label": "Facturación y fiscal",
    "icon": "fiscal",
    "order": 120,
    "description": "CFDI, complementos y cancelaciones, nómina fiscal, contabilidad electrónica y configuración fiscal.",
    "requiredPermission": "fiscal.view",
    "groups": [
      {
        "key": "cfdi",
        "label": "CFDI",
        "screens": [
          {
            "key": "cfdi-emision",
            "label": "Emisión",
            "live": false,
            "path": "fiscal/cfdi/emision",
            "permission": "fiscal.cfdi-emision.view",
            "own": false,
            "folder": "src/modules/fiscal/cfdi/emision"
          },
          {
            "key": "cfdi-recepcion",
            "label": "Recepción",
            "live": false,
            "path": "fiscal/cfdi/recepcion",
            "permission": "fiscal.cfdi-recepcion.view",
            "own": false,
            "folder": "src/modules/fiscal/cfdi/recepcion"
          },
          {
            "key": "cfdi-documentos-relacionados",
            "label": "Documentos relacionados",
            "live": false,
            "path": "fiscal/cfdi/documentos-relacionados",
            "permission": "fiscal.cfdi-documentos-relacionados.view",
            "own": false,
            "folder": "src/modules/fiscal/cfdi/documentos-relacionados"
          },
          {
            "key": "cfdi-uuid",
            "label": "UUID",
            "live": false,
            "path": "fiscal/cfdi/uuid",
            "permission": "fiscal.cfdi-uuid.view",
            "own": false,
            "folder": "src/modules/fiscal/cfdi/uuid"
          },
          {
            "key": "cfdi-estados",
            "label": "Estados",
            "live": false,
            "path": "fiscal/cfdi/estados",
            "permission": "fiscal.cfdi-estados.view",
            "own": false,
            "folder": "src/modules/fiscal/cfdi/estados"
          }
        ]
      },
      {
        "key": "complementos-y-cancelaciones",
        "label": "Complementos y cancelaciones",
        "screens": [
          {
            "key": "complementos-y-cancelaciones-complementos-de-pago",
            "label": "Complementos de pago",
            "live": false,
            "path": "fiscal/complementos-y-cancelaciones/complementos-de-pago",
            "permission": "fiscal.complementos-y-cancelaciones-complementos-de-pago.view",
            "own": false,
            "folder": "src/modules/fiscal/complementos-y-cancelaciones/complementos-de-pago"
          },
          {
            "key": "complementos-y-cancelaciones-solicitudes-de-cancelacion",
            "label": "Solicitudes de cancelación",
            "live": false,
            "path": "fiscal/complementos-y-cancelaciones/solicitudes-de-cancelacion",
            "permission": "fiscal.complementos-y-cancelaciones-solicitudes-de-cancelacion.view",
            "own": false,
            "folder": "src/modules/fiscal/complementos-y-cancelaciones/solicitudes-de-cancelacion"
          },
          {
            "key": "complementos-y-cancelaciones-sustituciones",
            "label": "Sustituciones",
            "live": false,
            "path": "fiscal/complementos-y-cancelaciones/sustituciones",
            "permission": "fiscal.complementos-y-cancelaciones-sustituciones.view",
            "own": false,
            "folder": "src/modules/fiscal/complementos-y-cancelaciones/sustituciones"
          },
          {
            "key": "complementos-y-cancelaciones-seguimiento",
            "label": "Seguimiento",
            "live": false,
            "path": "fiscal/complementos-y-cancelaciones/seguimiento",
            "permission": "fiscal.complementos-y-cancelaciones-seguimiento.view",
            "own": false,
            "folder": "src/modules/fiscal/complementos-y-cancelaciones/seguimiento"
          }
        ]
      },
      {
        "key": "nomina-fiscal",
        "label": "Nómina fiscal",
        "screens": [
          {
            "key": "nomina-fiscal-cfdi-de-nomina",
            "label": "CFDI de nómina",
            "live": false,
            "path": "fiscal/nomina-fiscal/cfdi-de-nomina",
            "permission": "fiscal.nomina-fiscal-cfdi-de-nomina.view",
            "own": false,
            "folder": "src/modules/fiscal/nomina-fiscal/cfdi-de-nomina"
          },
          {
            "key": "nomina-fiscal-timbrado",
            "label": "Timbrado",
            "live": false,
            "path": "fiscal/nomina-fiscal/timbrado",
            "permission": "fiscal.nomina-fiscal-timbrado.view",
            "own": false,
            "folder": "src/modules/fiscal/nomina-fiscal/timbrado"
          },
          {
            "key": "nomina-fiscal-cancelacion",
            "label": "Cancelación",
            "live": false,
            "path": "fiscal/nomina-fiscal/cancelacion",
            "permission": "fiscal.nomina-fiscal-cancelacion.view",
            "own": false,
            "folder": "src/modules/fiscal/nomina-fiscal/cancelacion"
          },
          {
            "key": "nomina-fiscal-historial-de-respuestas",
            "label": "Historial de respuestas",
            "live": false,
            "path": "fiscal/nomina-fiscal/historial-de-respuestas",
            "permission": "fiscal.nomina-fiscal-historial-de-respuestas.view",
            "own": false,
            "folder": "src/modules/fiscal/nomina-fiscal/historial-de-respuestas"
          }
        ]
      },
      {
        "key": "contabilidad-electronica",
        "label": "Contabilidad electrónica",
        "screens": [
          {
            "key": "contabilidad-electronica-catalogo-de-cuentas-fiscal",
            "label": "Catálogo de cuentas fiscal",
            "live": false,
            "path": "fiscal/contabilidad-electronica/catalogo-de-cuentas-fiscal",
            "permission": "fiscal.contabilidad-electronica-catalogo-de-cuentas-fiscal.view",
            "own": false,
            "folder": "src/modules/fiscal/contabilidad-electronica/catalogo-de-cuentas-fiscal"
          },
          {
            "key": "contabilidad-electronica-balanza",
            "label": "Balanza",
            "live": false,
            "path": "fiscal/contabilidad-electronica/balanza",
            "permission": "fiscal.contabilidad-electronica-balanza.view",
            "own": false,
            "folder": "src/modules/fiscal/contabilidad-electronica/balanza"
          },
          {
            "key": "contabilidad-electronica-polizas-y-auxiliares-cuando-correspondan",
            "label": "Pólizas y auxiliares cuando correspondan",
            "live": false,
            "path": "fiscal/contabilidad-electronica/polizas-y-auxiliares-cuando-correspondan",
            "permission": "fiscal.contabilidad-electronica-polizas-y-auxiliares-cuando-correspondan.view",
            "own": false,
            "folder": "src/modules/fiscal/contabilidad-electronica/polizas-y-auxiliares-cuando-correspondan"
          }
        ]
      },
      {
        "key": "configuracion-fiscal",
        "label": "Configuración fiscal",
        "screens": [
          {
            "key": "configuracion-fiscal-datos-fiscales",
            "label": "Datos fiscales",
            "live": false,
            "path": "fiscal/configuracion-fiscal/datos-fiscales",
            "permission": "fiscal.configuracion-fiscal-datos-fiscales.view",
            "own": false,
            "folder": "src/modules/fiscal/configuracion-fiscal/datos-fiscales"
          },
          {
            "key": "configuracion-fiscal-impuestos",
            "label": "Impuestos",
            "live": false,
            "path": "fiscal/configuracion-fiscal/impuestos",
            "permission": "fiscal.configuracion-fiscal-impuestos.view",
            "own": false,
            "folder": "src/modules/fiscal/configuracion-fiscal/impuestos"
          },
          {
            "key": "configuracion-fiscal-certificados-protegidos",
            "label": "Certificados protegidos",
            "live": false,
            "path": "fiscal/configuracion-fiscal/certificados-protegidos",
            "permission": "fiscal.configuracion-fiscal-certificados-protegidos.view",
            "own": false,
            "folder": "src/modules/fiscal/configuracion-fiscal/certificados-protegidos"
          },
          {
            "key": "configuracion-fiscal-pac",
            "label": "PAC",
            "live": false,
            "path": "fiscal/configuracion-fiscal/pac",
            "permission": "fiscal.configuracion-fiscal-pac.view",
            "own": false,
            "folder": "src/modules/fiscal/configuracion-fiscal/pac"
          },
          {
            "key": "configuracion-fiscal-catalogos-versionados",
            "label": "Catálogos versionados",
            "live": false,
            "path": "fiscal/configuracion-fiscal/catalogos-versionados",
            "permission": "fiscal.configuracion-fiscal-catalogos-versionados.view",
            "own": false,
            "folder": "src/modules/fiscal/configuracion-fiscal/catalogos-versionados"
          }
        ]
      }
    ]
  },
  {
    "key": "hr",
    "label": "Recursos humanos",
    "icon": "hr",
    "order": 130,
    "description": "Personal, reclutamiento, asistencia, ausencias, nómina, desarrollo, autoservicio y reportes de RH.",
    "requiredPermission": "hr.view",
    "groups": [
      {
        "key": "personal",
        "label": "Personal",
        "screens": [
          {
            "key": "personal-expedientes",
            "label": "Expedientes",
            "live": false,
            "path": "hr/personal/expedientes",
            "permission": "hr.personal-expedientes.view",
            "own": false,
            "folder": "src/modules/hr/personal/expedientes"
          },
          {
            "key": "personal-puestos",
            "label": "Puestos",
            "live": false,
            "path": "hr/personal/puestos",
            "permission": "hr.personal-puestos.view",
            "own": false,
            "folder": "src/modules/hr/personal/puestos"
          },
          {
            "key": "personal-departamentos",
            "label": "Departamentos",
            "live": false,
            "path": "hr/personal/departamentos",
            "permission": "hr.personal-departamentos.view",
            "own": false,
            "folder": "src/modules/hr/personal/departamentos"
          },
          {
            "key": "personal-organigrama",
            "label": "Organigrama",
            "live": false,
            "path": "hr/personal/organigrama",
            "permission": "hr.personal-organigrama.view",
            "own": false,
            "folder": "src/modules/hr/personal/organigrama"
          },
          {
            "key": "personal-historial-laboral",
            "label": "Historial laboral",
            "live": false,
            "path": "hr/personal/historial-laboral",
            "permission": "hr.personal-historial-laboral.view",
            "own": false,
            "folder": "src/modules/hr/personal/historial-laboral"
          },
          {
            "key": "personal-altas-y-bajas",
            "label": "Altas y bajas",
            "live": false,
            "path": "hr/personal/altas-y-bajas",
            "permission": "hr.personal-altas-y-bajas.view",
            "own": false,
            "folder": "src/modules/hr/personal/altas-y-bajas"
          }
        ]
      },
      {
        "key": "reclutamiento",
        "label": "Reclutamiento",
        "screens": [
          {
            "key": "reclutamiento-vacantes",
            "label": "Vacantes",
            "live": false,
            "path": "hr/reclutamiento/vacantes",
            "permission": "hr.reclutamiento-vacantes.view",
            "own": false,
            "folder": "src/modules/hr/reclutamiento/vacantes"
          },
          {
            "key": "reclutamiento-candidatos",
            "label": "Candidatos",
            "live": false,
            "path": "hr/reclutamiento/candidatos",
            "permission": "hr.reclutamiento-candidatos.view",
            "own": false,
            "folder": "src/modules/hr/reclutamiento/candidatos"
          },
          {
            "key": "reclutamiento-entrevistas",
            "label": "Entrevistas",
            "live": false,
            "path": "hr/reclutamiento/entrevistas",
            "permission": "hr.reclutamiento-entrevistas.view",
            "own": false,
            "folder": "src/modules/hr/reclutamiento/entrevistas"
          },
          {
            "key": "reclutamiento-seleccion",
            "label": "Selección",
            "live": false,
            "path": "hr/reclutamiento/seleccion",
            "permission": "hr.reclutamiento-seleccion.view",
            "own": false,
            "folder": "src/modules/hr/reclutamiento/seleccion"
          },
          {
            "key": "reclutamiento-contratacion",
            "label": "Contratación",
            "live": false,
            "path": "hr/reclutamiento/contratacion",
            "permission": "hr.reclutamiento-contratacion.view",
            "own": false,
            "folder": "src/modules/hr/reclutamiento/contratacion"
          },
          {
            "key": "reclutamiento-onboarding",
            "label": "Onboarding",
            "live": false,
            "path": "hr/reclutamiento/onboarding",
            "permission": "hr.reclutamiento-onboarding.view",
            "own": false,
            "folder": "src/modules/hr/reclutamiento/onboarding"
          }
        ]
      },
      {
        "key": "asistencia-y-horarios",
        "label": "Asistencia y horarios",
        "screens": [
          {
            "key": "asistencia-y-horarios-horarios",
            "label": "Horarios",
            "live": false,
            "path": "hr/asistencia-y-horarios/horarios",
            "permission": "hr.asistencia-y-horarios-horarios.view",
            "own": false,
            "folder": "src/modules/hr/asistencia-y-horarios/horarios"
          },
          {
            "key": "asistencia-y-horarios-turnos-laborales",
            "label": "Turnos laborales",
            "live": false,
            "path": "hr/asistencia-y-horarios/turnos-laborales",
            "permission": "hr.asistencia-y-horarios-turnos-laborales.view",
            "own": false,
            "folder": "src/modules/hr/asistencia-y-horarios/turnos-laborales"
          },
          {
            "key": "asistencia-y-horarios-marcajes",
            "label": "Marcajes",
            "live": false,
            "path": "hr/asistencia-y-horarios/marcajes",
            "permission": "hr.asistencia-y-horarios-marcajes.view",
            "own": false,
            "folder": "src/modules/hr/asistencia-y-horarios/marcajes"
          },
          {
            "key": "asistencia-y-horarios-retardos",
            "label": "Retardos",
            "live": false,
            "path": "hr/asistencia-y-horarios/retardos",
            "permission": "hr.asistencia-y-horarios-retardos.view",
            "own": false,
            "folder": "src/modules/hr/asistencia-y-horarios/retardos"
          },
          {
            "key": "asistencia-y-horarios-incidencias",
            "label": "Incidencias",
            "live": false,
            "path": "hr/asistencia-y-horarios/incidencias",
            "permission": "hr.asistencia-y-horarios-incidencias.view",
            "own": false,
            "folder": "src/modules/hr/asistencia-y-horarios/incidencias"
          },
          {
            "key": "asistencia-y-horarios-horas-extra",
            "label": "Horas extra",
            "live": false,
            "path": "hr/asistencia-y-horarios/horas-extra",
            "permission": "hr.asistencia-y-horarios-horas-extra.view",
            "own": false,
            "folder": "src/modules/hr/asistencia-y-horarios/horas-extra"
          }
        ]
      },
      {
        "key": "ausencias-y-prestaciones",
        "label": "Ausencias y prestaciones",
        "screens": [
          {
            "key": "ausencias-y-prestaciones-vacaciones",
            "label": "Vacaciones",
            "live": false,
            "path": "hr/ausencias-y-prestaciones/vacaciones",
            "permission": "hr.ausencias-y-prestaciones-vacaciones.view",
            "own": false,
            "folder": "src/modules/hr/ausencias-y-prestaciones/vacaciones"
          },
          {
            "key": "ausencias-y-prestaciones-permisos",
            "label": "Permisos",
            "live": false,
            "path": "hr/ausencias-y-prestaciones/permisos",
            "permission": "hr.ausencias-y-prestaciones-permisos.view",
            "own": false,
            "folder": "src/modules/hr/ausencias-y-prestaciones/permisos"
          },
          {
            "key": "ausencias-y-prestaciones-incapacidades",
            "label": "Incapacidades",
            "live": false,
            "path": "hr/ausencias-y-prestaciones/incapacidades",
            "permission": "hr.ausencias-y-prestaciones-incapacidades.view",
            "own": false,
            "folder": "src/modules/hr/ausencias-y-prestaciones/incapacidades"
          },
          {
            "key": "ausencias-y-prestaciones-prestaciones",
            "label": "Prestaciones",
            "live": false,
            "path": "hr/ausencias-y-prestaciones/prestaciones",
            "permission": "hr.ausencias-y-prestaciones-prestaciones.view",
            "own": false,
            "folder": "src/modules/hr/ausencias-y-prestaciones/prestaciones"
          },
          {
            "key": "ausencias-y-prestaciones-saldos-y-solicitudes",
            "label": "Saldos y solicitudes",
            "live": false,
            "path": "hr/ausencias-y-prestaciones/saldos-y-solicitudes",
            "permission": "hr.ausencias-y-prestaciones-saldos-y-solicitudes.view",
            "own": false,
            "folder": "src/modules/hr/ausencias-y-prestaciones/saldos-y-solicitudes"
          }
        ]
      },
      {
        "key": "nomina",
        "label": "Nómina",
        "screens": [
          {
            "key": "nomina-periodos",
            "label": "Periodos",
            "live": false,
            "path": "hr/nomina/periodos",
            "permission": "hr.nomina-periodos.view",
            "own": false,
            "folder": "src/modules/hr/nomina/periodos"
          },
          {
            "key": "nomina-percepciones",
            "label": "Percepciones",
            "live": false,
            "path": "hr/nomina/percepciones",
            "permission": "hr.nomina-percepciones.view",
            "own": false,
            "folder": "src/modules/hr/nomina/percepciones"
          },
          {
            "key": "nomina-deducciones",
            "label": "Deducciones",
            "live": false,
            "path": "hr/nomina/deducciones",
            "permission": "hr.nomina-deducciones.view",
            "own": false,
            "folder": "src/modules/hr/nomina/deducciones"
          },
          {
            "key": "nomina-comisiones",
            "label": "Comisiones",
            "live": false,
            "path": "hr/nomina/comisiones",
            "permission": "hr.nomina-comisiones.view",
            "own": false,
            "folder": "src/modules/hr/nomina/comisiones"
          },
          {
            "key": "nomina-calculo",
            "label": "Cálculo",
            "live": false,
            "path": "hr/nomina/calculo",
            "permission": "hr.nomina-calculo.view",
            "own": false,
            "folder": "src/modules/hr/nomina/calculo"
          },
          {
            "key": "nomina-aprobacion",
            "label": "Aprobación",
            "live": false,
            "path": "hr/nomina/aprobacion",
            "permission": "hr.nomina-aprobacion.view",
            "own": false,
            "folder": "src/modules/hr/nomina/aprobacion"
          },
          {
            "key": "nomina-recibos",
            "label": "Recibos",
            "live": false,
            "path": "hr/nomina/recibos",
            "permission": "hr.nomina-recibos.view",
            "own": false,
            "folder": "src/modules/hr/nomina/recibos"
          },
          {
            "key": "nomina-finiquitos",
            "label": "Finiquitos",
            "live": false,
            "path": "hr/nomina/finiquitos",
            "permission": "hr.nomina-finiquitos.view",
            "own": false,
            "folder": "src/modules/hr/nomina/finiquitos"
          }
        ]
      },
      {
        "key": "desarrollo",
        "label": "Desarrollo",
        "screens": [
          {
            "key": "desarrollo-capacitacion",
            "label": "Capacitación",
            "live": false,
            "path": "hr/desarrollo/capacitacion",
            "permission": "hr.desarrollo-capacitacion.view",
            "own": false,
            "folder": "src/modules/hr/desarrollo/capacitacion"
          },
          {
            "key": "desarrollo-certificaciones",
            "label": "Certificaciones",
            "live": false,
            "path": "hr/desarrollo/certificaciones",
            "permission": "hr.desarrollo-certificaciones.view",
            "own": false,
            "folder": "src/modules/hr/desarrollo/certificaciones"
          },
          {
            "key": "desarrollo-evaluaciones",
            "label": "Evaluaciones",
            "live": false,
            "path": "hr/desarrollo/evaluaciones",
            "permission": "hr.desarrollo-evaluaciones.view",
            "own": false,
            "folder": "src/modules/hr/desarrollo/evaluaciones"
          },
          {
            "key": "desarrollo-objetivos",
            "label": "Objetivos",
            "live": false,
            "path": "hr/desarrollo/objetivos",
            "permission": "hr.desarrollo-objetivos.view",
            "own": false,
            "folder": "src/modules/hr/desarrollo/objetivos"
          },
          {
            "key": "desarrollo-planes-de-desarrollo",
            "label": "Planes de desarrollo",
            "live": false,
            "path": "hr/desarrollo/planes-de-desarrollo",
            "permission": "hr.desarrollo-planes-de-desarrollo.view",
            "own": false,
            "folder": "src/modules/hr/desarrollo/planes-de-desarrollo"
          }
        ]
      },
      {
        "key": "autoservicio",
        "label": "Autoservicio",
        "screens": [
          {
            "key": "autoservicio-portal-del-empleado",
            "label": "Portal del empleado",
            "live": false,
            "path": "hr/autoservicio/portal-del-empleado",
            "permission": "hr.autoservicio-portal-del-empleado.view",
            "own": false,
            "folder": "src/modules/hr/autoservicio/portal-del-empleado"
          },
          {
            "key": "autoservicio-recibos",
            "label": "Recibos",
            "live": false,
            "path": "hr/autoservicio/recibos",
            "permission": "hr.autoservicio-recibos.view",
            "own": false,
            "folder": "src/modules/hr/autoservicio/recibos"
          },
          {
            "key": "autoservicio-solicitudes",
            "label": "Solicitudes",
            "live": false,
            "path": "hr/autoservicio/solicitudes",
            "permission": "hr.autoservicio-solicitudes.view",
            "own": false,
            "folder": "src/modules/hr/autoservicio/solicitudes"
          },
          {
            "key": "autoservicio-documentos",
            "label": "Documentos",
            "live": false,
            "path": "hr/autoservicio/documentos",
            "permission": "hr.autoservicio-documentos.view",
            "own": false,
            "folder": "src/modules/hr/autoservicio/documentos"
          },
          {
            "key": "autoservicio-actualizacion-controlada-de-datos",
            "label": "Actualización controlada de datos",
            "live": false,
            "path": "hr/autoservicio/actualizacion-controlada-de-datos",
            "permission": "hr.autoservicio-actualizacion-controlada-de-datos.view",
            "own": false,
            "folder": "src/modules/hr/autoservicio/actualizacion-controlada-de-datos"
          }
        ]
      },
      {
        "key": "reportes-de-rh",
        "label": "Reportes de RH",
        "screens": [
          {
            "key": "reportes-de-rh-rotacion",
            "label": "Rotación",
            "live": false,
            "path": "hr/reportes-de-rh/rotacion",
            "permission": "hr.reportes-de-rh-rotacion.view",
            "own": false,
            "folder": "src/modules/hr/reportes-de-rh/rotacion"
          },
          {
            "key": "reportes-de-rh-ausentismo",
            "label": "Ausentismo",
            "live": false,
            "path": "hr/reportes-de-rh/ausentismo",
            "permission": "hr.reportes-de-rh-ausentismo.view",
            "own": false,
            "folder": "src/modules/hr/reportes-de-rh/ausentismo"
          },
          {
            "key": "reportes-de-rh-costos-de-nomina",
            "label": "Costos de nómina",
            "live": false,
            "path": "hr/reportes-de-rh/costos-de-nomina",
            "permission": "hr.reportes-de-rh-costos-de-nomina.view",
            "own": false,
            "folder": "src/modules/hr/reportes-de-rh/costos-de-nomina"
          },
          {
            "key": "reportes-de-rh-vacaciones-pendientes",
            "label": "Vacaciones pendientes",
            "live": false,
            "path": "hr/reportes-de-rh/vacaciones-pendientes",
            "permission": "hr.reportes-de-rh-vacaciones-pendientes.view",
            "own": false,
            "folder": "src/modules/hr/reportes-de-rh/vacaciones-pendientes"
          },
          {
            "key": "reportes-de-rh-plantilla",
            "label": "Plantilla",
            "live": false,
            "path": "hr/reportes-de-rh/plantilla",
            "permission": "hr.reportes-de-rh-plantilla.view",
            "own": false,
            "folder": "src/modules/hr/reportes-de-rh/plantilla"
          }
        ]
      }
    ]
  },
  {
    "key": "projects",
    "label": "Servicios y proyectos",
    "icon": "projects",
    "order": 140,
    "description": "Proyectos, órdenes de servicio, contratos y soporte.",
    "requiredPermission": "projects.view",
    "groups": [
      {
        "key": "proyectos",
        "label": "Proyectos",
        "screens": [
          {
            "key": "proyectos-proyectos",
            "label": "Proyectos",
            "live": false,
            "path": "projects/proyectos/proyectos",
            "permission": "projects.proyectos-proyectos.view",
            "own": false,
            "folder": "src/modules/projects/proyectos/proyectos"
          },
          {
            "key": "proyectos-tareas",
            "label": "Tareas",
            "live": false,
            "path": "projects/proyectos/tareas",
            "permission": "projects.proyectos-tareas.view",
            "own": false,
            "folder": "src/modules/projects/proyectos/tareas"
          },
          {
            "key": "proyectos-hitos",
            "label": "Hitos",
            "live": false,
            "path": "projects/proyectos/hitos",
            "permission": "projects.proyectos-hitos.view",
            "own": false,
            "folder": "src/modules/projects/proyectos/hitos"
          },
          {
            "key": "proyectos-recursos",
            "label": "Recursos",
            "live": false,
            "path": "projects/proyectos/recursos",
            "permission": "projects.proyectos-recursos.view",
            "own": false,
            "folder": "src/modules/projects/proyectos/recursos"
          },
          {
            "key": "proyectos-tiempos",
            "label": "Tiempos",
            "live": false,
            "path": "projects/proyectos/tiempos",
            "permission": "projects.proyectos-tiempos.view",
            "own": false,
            "folder": "src/modules/projects/proyectos/tiempos"
          },
          {
            "key": "proyectos-gastos",
            "label": "Gastos",
            "live": false,
            "path": "projects/proyectos/gastos",
            "permission": "projects.proyectos-gastos.view",
            "own": false,
            "folder": "src/modules/projects/proyectos/gastos"
          }
        ]
      },
      {
        "key": "servicios",
        "label": "Servicios",
        "screens": [
          {
            "key": "servicios-ordenes-de-servicio",
            "label": "Órdenes de servicio",
            "live": false,
            "path": "projects/servicios/ordenes-de-servicio",
            "permission": "projects.servicios-ordenes-de-servicio.view",
            "own": false,
            "folder": "src/modules/projects/servicios/ordenes-de-servicio"
          },
          {
            "key": "servicios-tickets",
            "label": "Tickets",
            "live": false,
            "path": "projects/servicios/tickets",
            "permission": "projects.servicios-tickets.view",
            "own": false,
            "folder": "src/modules/projects/servicios/tickets"
          },
          {
            "key": "servicios-asignaciones",
            "label": "Asignaciones",
            "live": false,
            "path": "projects/servicios/asignaciones",
            "permission": "projects.servicios-asignaciones.view",
            "own": false,
            "folder": "src/modules/projects/servicios/asignaciones"
          },
          {
            "key": "servicios-visitas-tecnicas",
            "label": "Visitas técnicas",
            "live": false,
            "path": "projects/servicios/visitas-tecnicas",
            "permission": "projects.servicios-visitas-tecnicas.view",
            "own": false,
            "folder": "src/modules/projects/servicios/visitas-tecnicas"
          }
        ]
      },
      {
        "key": "contratos",
        "label": "Contratos",
        "screens": [
          {
            "key": "contratos-contratos",
            "label": "Contratos",
            "live": false,
            "path": "projects/contratos/contratos",
            "permission": "projects.contratos-contratos.view",
            "own": false,
            "folder": "src/modules/projects/contratos/contratos"
          },
          {
            "key": "contratos-suscripciones",
            "label": "Suscripciones",
            "live": false,
            "path": "projects/contratos/suscripciones",
            "permission": "projects.contratos-suscripciones.view",
            "own": false,
            "folder": "src/modules/projects/contratos/suscripciones"
          },
          {
            "key": "contratos-renovaciones",
            "label": "Renovaciones",
            "live": false,
            "path": "projects/contratos/renovaciones",
            "permission": "projects.contratos-renovaciones.view",
            "own": false,
            "folder": "src/modules/projects/contratos/renovaciones"
          },
          {
            "key": "contratos-facturacion-recurrente",
            "label": "Facturación recurrente",
            "live": false,
            "path": "projects/contratos/facturacion-recurrente",
            "permission": "projects.contratos-facturacion-recurrente.view",
            "own": false,
            "folder": "src/modules/projects/contratos/facturacion-recurrente"
          }
        ]
      },
      {
        "key": "soporte",
        "label": "Soporte",
        "screens": [
          {
            "key": "soporte-garantias",
            "label": "Garantías",
            "live": false,
            "path": "projects/soporte/garantias",
            "permission": "projects.soporte-garantias.view",
            "own": false,
            "folder": "src/modules/projects/soporte/garantias"
          },
          {
            "key": "soporte-sla",
            "label": "SLA",
            "live": false,
            "path": "projects/soporte/sla",
            "permission": "projects.soporte-sla.view",
            "own": false,
            "folder": "src/modules/projects/soporte/sla"
          },
          {
            "key": "soporte-incidencias",
            "label": "Incidencias",
            "live": false,
            "path": "projects/soporte/incidencias",
            "permission": "projects.soporte-incidencias.view",
            "own": false,
            "folder": "src/modules/projects/soporte/incidencias"
          },
          {
            "key": "soporte-historial-de-atencion",
            "label": "Historial de atención",
            "live": false,
            "path": "projects/soporte/historial-de-atencion",
            "permission": "projects.soporte-historial-de-atencion.view",
            "own": false,
            "folder": "src/modules/projects/soporte/historial-de-atencion"
          }
        ]
      }
    ]
  },
  {
    "key": "realestate",
    "label": "Inmuebles y condominios",
    "icon": "realestate",
    "order": 150,
    "description": "Inmuebles, propietarios y ocupantes, administración de cuotas y operación del condominio.",
    "requiredPermission": "realestate.view",
    "groups": [
      {
        "key": "inmuebles",
        "label": "Inmuebles",
        "screens": [
          {
            "key": "inmuebles-propiedades",
            "label": "Propiedades",
            "live": false,
            "path": "realestate/inmuebles/propiedades",
            "permission": "realestate.inmuebles-propiedades.view",
            "own": false,
            "folder": "src/modules/realestate/inmuebles/propiedades"
          },
          {
            "key": "inmuebles-edificios",
            "label": "Edificios",
            "live": false,
            "path": "realestate/inmuebles/edificios",
            "permission": "realestate.inmuebles-edificios.view",
            "own": false,
            "folder": "src/modules/realestate/inmuebles/edificios"
          },
          {
            "key": "inmuebles-torres",
            "label": "Torres",
            "live": false,
            "path": "realestate/inmuebles/torres",
            "permission": "realestate.inmuebles-torres.view",
            "own": false,
            "folder": "src/modules/realestate/inmuebles/torres"
          },
          {
            "key": "inmuebles-unidades",
            "label": "Unidades",
            "live": false,
            "path": "realestate/inmuebles/unidades",
            "permission": "realestate.inmuebles-unidades.view",
            "own": false,
            "folder": "src/modules/realestate/inmuebles/unidades"
          },
          {
            "key": "inmuebles-areas-comunes",
            "label": "Áreas comunes",
            "live": false,
            "path": "realestate/inmuebles/areas-comunes",
            "permission": "realestate.inmuebles-areas-comunes.view",
            "own": false,
            "folder": "src/modules/realestate/inmuebles/areas-comunes"
          }
        ]
      },
      {
        "key": "relaciones",
        "label": "Relaciones",
        "screens": [
          {
            "key": "relaciones-propietarios",
            "label": "Propietarios",
            "live": false,
            "path": "realestate/relaciones/propietarios",
            "permission": "realestate.relaciones-propietarios.view",
            "own": false,
            "folder": "src/modules/realestate/relaciones/propietarios"
          },
          {
            "key": "relaciones-copropiedades",
            "label": "Copropiedades",
            "live": false,
            "path": "realestate/relaciones/copropiedades",
            "permission": "realestate.relaciones-copropiedades.view",
            "own": false,
            "folder": "src/modules/realestate/relaciones/copropiedades"
          },
          {
            "key": "relaciones-ocupantes",
            "label": "Ocupantes",
            "live": false,
            "path": "realestate/relaciones/ocupantes",
            "permission": "realestate.relaciones-ocupantes.view",
            "own": false,
            "folder": "src/modules/realestate/relaciones/ocupantes"
          },
          {
            "key": "relaciones-arrendamientos",
            "label": "Arrendamientos",
            "live": false,
            "path": "realestate/relaciones/arrendamientos",
            "permission": "realestate.relaciones-arrendamientos.view",
            "own": false,
            "folder": "src/modules/realestate/relaciones/arrendamientos"
          }
        ]
      },
      {
        "key": "administracion",
        "label": "Administración",
        "screens": [
          {
            "key": "administracion-cuotas",
            "label": "Cuotas",
            "live": false,
            "path": "realestate/administracion/cuotas",
            "permission": "realestate.administracion-cuotas.view",
            "own": false,
            "folder": "src/modules/realestate/administracion/cuotas"
          },
          {
            "key": "administracion-cargos",
            "label": "Cargos",
            "live": false,
            "path": "realestate/administracion/cargos",
            "permission": "realestate.administracion-cargos.view",
            "own": false,
            "folder": "src/modules/realestate/administracion/cargos"
          },
          {
            "key": "administracion-presupuestos",
            "label": "Presupuestos",
            "live": false,
            "path": "realestate/administracion/presupuestos",
            "permission": "realestate.administracion-presupuestos.view",
            "own": false,
            "folder": "src/modules/realestate/administracion/presupuestos"
          },
          {
            "key": "administracion-gastos-comunes",
            "label": "Gastos comunes",
            "live": false,
            "path": "realestate/administracion/gastos-comunes",
            "permission": "realestate.administracion-gastos-comunes.view",
            "own": false,
            "folder": "src/modules/realestate/administracion/gastos-comunes"
          },
          {
            "key": "administracion-aplicaciones-de-pagos",
            "label": "Aplicaciones de pagos",
            "live": false,
            "path": "realestate/administracion/aplicaciones-de-pagos",
            "permission": "realestate.administracion-aplicaciones-de-pagos.view",
            "own": false,
            "folder": "src/modules/realestate/administracion/aplicaciones-de-pagos"
          }
        ]
      },
      {
        "key": "operacion",
        "label": "Operación",
        "screens": [
          {
            "key": "operacion-incidencias",
            "label": "Incidencias",
            "live": false,
            "path": "realestate/operacion/incidencias",
            "permission": "realestate.operacion-incidencias.view",
            "own": false,
            "folder": "src/modules/realestate/operacion/incidencias"
          },
          {
            "key": "operacion-mantenimiento",
            "label": "Mantenimiento",
            "live": false,
            "path": "realestate/operacion/mantenimiento",
            "permission": "realestate.operacion-mantenimiento.view",
            "own": false,
            "folder": "src/modules/realestate/operacion/mantenimiento"
          },
          {
            "key": "operacion-reservaciones",
            "label": "Reservaciones",
            "live": false,
            "path": "realestate/operacion/reservaciones",
            "permission": "realestate.operacion-reservaciones.view",
            "own": false,
            "folder": "src/modules/realestate/operacion/reservaciones"
          },
          {
            "key": "operacion-accesos",
            "label": "Accesos",
            "live": false,
            "path": "realestate/operacion/accesos",
            "permission": "realestate.operacion-accesos.view",
            "own": false,
            "folder": "src/modules/realestate/operacion/accesos"
          },
          {
            "key": "operacion-comunicados",
            "label": "Comunicados",
            "live": false,
            "path": "realestate/operacion/comunicados",
            "permission": "realestate.operacion-comunicados.view",
            "own": false,
            "folder": "src/modules/realestate/operacion/comunicados"
          },
          {
            "key": "operacion-asambleas-y-votaciones",
            "label": "Asambleas y votaciones",
            "live": false,
            "path": "realestate/operacion/asambleas-y-votaciones",
            "permission": "realestate.operacion-asambleas-y-votaciones.view",
            "own": false,
            "folder": "src/modules/realestate/operacion/asambleas-y-votaciones"
          }
        ]
      }
    ]
  },
  {
    "key": "reports",
    "label": "Reportes y análisis",
    "icon": "report",
    "order": 160,
    "description": "Reportes por área y reportes personalizados.",
    "requiredPermission": "reports.view",
    "groups": [
      {
        "key": null,
        "label": null,
        "screens": [
          {
            "key": "ventas",
            "label": "Ventas",
            "live": false,
            "path": "reports/ventas",
            "permission": "reports.ventas.view",
            "own": false,
            "folder": "src/modules/reports/ventas"
          },
          {
            "key": "caja",
            "label": "Caja",
            "live": false,
            "path": "reports/caja",
            "permission": "reports.caja.view",
            "own": false,
            "folder": "src/modules/reports/caja"
          },
          {
            "key": "inventario",
            "label": "Inventario",
            "live": false,
            "path": "reports/inventario",
            "permission": "reports.inventario.view",
            "own": false,
            "folder": "src/modules/reports/inventario"
          },
          {
            "key": "compras",
            "label": "Compras",
            "live": false,
            "path": "reports/compras",
            "permission": "reports.compras.view",
            "own": false,
            "folder": "src/modules/reports/compras"
          },
          {
            "key": "finanzas",
            "label": "Finanzas",
            "live": false,
            "path": "reports/finanzas",
            "permission": "reports.finanzas.view",
            "own": false,
            "folder": "src/modules/reports/finanzas"
          },
          {
            "key": "fiscal",
            "label": "Fiscal",
            "live": false,
            "path": "reports/fiscal",
            "permission": "reports.fiscal.view",
            "own": false,
            "folder": "src/modules/reports/fiscal"
          },
          {
            "key": "rh",
            "label": "RH",
            "live": false,
            "path": "reports/rh",
            "permission": "reports.rh.view",
            "own": false,
            "folder": "src/modules/reports/rh"
          },
          {
            "key": "produccion",
            "label": "Producción",
            "live": false,
            "path": "reports/produccion",
            "permission": "reports.produccion.view",
            "own": false,
            "folder": "src/modules/reports/produccion"
          },
          {
            "key": "rentabilidad",
            "label": "Rentabilidad",
            "live": false,
            "path": "reports/rentabilidad",
            "permission": "reports.rentabilidad.view",
            "own": false,
            "folder": "src/modules/reports/rentabilidad"
          },
          {
            "key": "reportes-personalizados",
            "label": "Reportes personalizados",
            "live": false,
            "path": "reports/reportes-personalizados",
            "permission": "reports.reportes-personalizados.view",
            "own": false,
            "folder": "src/modules/reports/reportes-personalizados"
          }
        ]
      }
    ]
  },
  {
    "key": "automation",
    "label": "Automatización e integraciones",
    "icon": "automation",
    "order": 170,
    "description": "Flujos y aprobaciones, integraciones, sincronización y notificaciones.",
    "requiredPermission": "automation.view",
    "groups": [
      {
        "key": "flujos-y-aprobaciones",
        "label": "Flujos y aprobaciones",
        "screens": [
          {
            "key": "flujos-y-aprobaciones-definiciones",
            "label": "Definiciones",
            "live": false,
            "path": "automation/flujos-y-aprobaciones/definiciones",
            "permission": "automation.flujos-y-aprobaciones-definiciones.view",
            "own": false,
            "folder": "src/modules/automation/flujos-y-aprobaciones/definiciones"
          },
          {
            "key": "flujos-y-aprobaciones-versiones",
            "label": "Versiones",
            "live": false,
            "path": "automation/flujos-y-aprobaciones/versiones",
            "permission": "automation.flujos-y-aprobaciones-versiones.view",
            "own": false,
            "folder": "src/modules/automation/flujos-y-aprobaciones/versiones"
          },
          {
            "key": "flujos-y-aprobaciones-instancias",
            "label": "Instancias",
            "live": false,
            "path": "automation/flujos-y-aprobaciones/instancias",
            "permission": "automation.flujos-y-aprobaciones-instancias.view",
            "own": false,
            "folder": "src/modules/automation/flujos-y-aprobaciones/instancias"
          },
          {
            "key": "flujos-y-aprobaciones-pasos",
            "label": "Pasos",
            "live": false,
            "path": "automation/flujos-y-aprobaciones/pasos",
            "permission": "automation.flujos-y-aprobaciones-pasos.view",
            "own": false,
            "folder": "src/modules/automation/flujos-y-aprobaciones/pasos"
          },
          {
            "key": "flujos-y-aprobaciones-reglas",
            "label": "Reglas",
            "live": false,
            "path": "automation/flujos-y-aprobaciones/reglas",
            "permission": "automation.flujos-y-aprobaciones-reglas.view",
            "own": false,
            "folder": "src/modules/automation/flujos-y-aprobaciones/reglas"
          },
          {
            "key": "flujos-y-aprobaciones-aprobaciones",
            "label": "Aprobaciones",
            "live": false,
            "path": "automation/flujos-y-aprobaciones/aprobaciones",
            "permission": "automation.flujos-y-aprobaciones-aprobaciones.view",
            "own": false,
            "folder": "src/modules/automation/flujos-y-aprobaciones/aprobaciones"
          }
        ]
      },
      {
        "key": "integraciones",
        "label": "Integraciones",
        "screens": [
          {
            "key": "integraciones-conectores",
            "label": "Conectores",
            "live": false,
            "path": "automation/integraciones/conectores",
            "permission": "automation.integraciones-conectores.view",
            "own": false,
            "folder": "src/modules/automation/integraciones/conectores"
          },
          {
            "key": "integraciones-credenciales-referenciadas",
            "label": "Credenciales referenciadas",
            "live": false,
            "path": "automation/integraciones/credenciales-referenciadas",
            "permission": "automation.integraciones-credenciales-referenciadas.view",
            "own": false,
            "folder": "src/modules/automation/integraciones/credenciales-referenciadas"
          },
          {
            "key": "integraciones-webhooks",
            "label": "Webhooks",
            "live": false,
            "path": "automation/integraciones/webhooks",
            "permission": "automation.integraciones-webhooks.view",
            "own": false,
            "folder": "src/modules/automation/integraciones/webhooks"
          },
          {
            "key": "integraciones-eventos",
            "label": "Eventos",
            "live": false,
            "path": "automation/integraciones/eventos",
            "permission": "automation.integraciones-eventos.view",
            "own": false,
            "folder": "src/modules/automation/integraciones/eventos"
          },
          {
            "key": "integraciones-suscripciones",
            "label": "Suscripciones",
            "live": false,
            "path": "automation/integraciones/suscripciones",
            "permission": "automation.integraciones-suscripciones.view",
            "own": false,
            "folder": "src/modules/automation/integraciones/suscripciones"
          }
        ]
      },
      {
        "key": "sincronizacion",
        "label": "Sincronización",
        "screens": [
          {
            "key": "sincronizacion-colas",
            "label": "Colas",
            "live": false,
            "path": "automation/sincronizacion/colas",
            "permission": "automation.sincronizacion-colas.view",
            "own": false,
            "folder": "src/modules/automation/sincronizacion/colas"
          },
          {
            "key": "sincronizacion-reintentos",
            "label": "Reintentos",
            "live": false,
            "path": "automation/sincronizacion/reintentos",
            "permission": "automation.sincronizacion-reintentos.view",
            "own": false,
            "folder": "src/modules/automation/sincronizacion/reintentos"
          },
          {
            "key": "sincronizacion-errores",
            "label": "Errores",
            "live": false,
            "path": "automation/sincronizacion/errores",
            "permission": "automation.sincronizacion-errores.view",
            "own": false,
            "folder": "src/modules/automation/sincronizacion/errores"
          },
          {
            "key": "sincronizacion-estado-de-sincronizacion",
            "label": "Estado de sincronización",
            "live": false,
            "path": "automation/sincronizacion/estado-de-sincronizacion",
            "permission": "automation.sincronizacion-estado-de-sincronizacion.view",
            "own": false,
            "folder": "src/modules/automation/sincronizacion/estado-de-sincronizacion"
          },
          {
            "key": "sincronizacion-idempotencia",
            "label": "Idempotencia",
            "live": false,
            "path": "automation/sincronizacion/idempotencia",
            "permission": "automation.sincronizacion-idempotencia.view",
            "own": false,
            "folder": "src/modules/automation/sincronizacion/idempotencia"
          }
        ]
      },
      {
        "key": "notificaciones-y-auditoria-tecnica",
        "label": "Notificaciones y auditoría técnica",
        "screens": [
          {
            "key": "notificaciones-y-auditoria-tecnica-plantillas",
            "label": "Plantillas",
            "live": false,
            "path": "automation/notificaciones-y-auditoria-tecnica/plantillas",
            "permission": "automation.notificaciones-y-auditoria-tecnica-plantillas.view",
            "own": false,
            "folder": "src/modules/automation/notificaciones-y-auditoria-tecnica/plantillas"
          },
          {
            "key": "notificaciones-y-auditoria-tecnica-notificaciones",
            "label": "Notificaciones",
            "live": false,
            "path": "automation/notificaciones-y-auditoria-tecnica/notificaciones",
            "permission": "automation.notificaciones-y-auditoria-tecnica-notificaciones.view",
            "own": false,
            "folder": "src/modules/automation/notificaciones-y-auditoria-tecnica/notificaciones"
          },
          {
            "key": "notificaciones-y-auditoria-tecnica-correlacion",
            "label": "Correlación",
            "live": false,
            "path": "automation/notificaciones-y-auditoria-tecnica/correlacion",
            "permission": "automation.notificaciones-y-auditoria-tecnica-correlacion.view",
            "own": false,
            "folder": "src/modules/automation/notificaciones-y-auditoria-tecnica/correlacion"
          },
          {
            "key": "notificaciones-y-auditoria-tecnica-registro-de-eventos",
            "label": "Registro de eventos",
            "live": false,
            "path": "automation/notificaciones-y-auditoria-tecnica/registro-de-eventos",
            "permission": "automation.notificaciones-y-auditoria-tecnica-registro-de-eventos.view",
            "own": false,
            "folder": "src/modules/automation/notificaciones-y-auditoria-tecnica/registro-de-eventos"
          },
          {
            "key": "notificaciones-y-auditoria-tecnica-historial-de-ejecucion",
            "label": "Historial de ejecución",
            "live": false,
            "path": "automation/notificaciones-y-auditoria-tecnica/historial-de-ejecucion",
            "permission": "automation.notificaciones-y-auditoria-tecnica-historial-de-ejecucion.view",
            "own": false,
            "folder": "src/modules/automation/notificaciones-y-auditoria-tecnica/historial-de-ejecucion"
          }
        ]
      }
    ]
  },
  {
    "key": "admin",
    "label": "Administración y seguridad",
    "icon": "settings",
    "order": 180,
    "description": "Organización, usuarios y accesos, seguridad y configuración avanzada.",
    "requiredPermission": "admin.view",
    "includedIn": [
      "configurations",
      "users"
    ],
    "groups": [
      {
        "key": "organizacion",
        "label": "Organización",
        "screens": [
          {
            "key": "organizacion-empresas",
            "label": "Empresas",
            "live": true,
            "path": "configurations/companies",
            "permission": "configurations.companies.view",
            "own": false
          },
          {
            "key": "organizacion-sucursales",
            "label": "Sucursales",
            "live": true,
            "path": "configurations/branch-offices",
            "permission": "configurations.branch.view",
            "own": false
          },
          {
            "key": "organizacion-almacenes",
            "label": "Almacenes",
            "live": false,
            "path": "admin/organizacion/almacenes",
            "permission": "admin.organizacion-almacenes.view",
            "own": false,
            "folder": "src/modules/admin/organizacion/almacenes"
          },
          {
            "key": "organizacion-areas",
            "label": "Áreas",
            "live": true,
            "path": "configurations/areas",
            "permission": "configurations.areas.view",
            "own": false
          },
          {
            "key": "organizacion-series-y-folios",
            "label": "Series y folios",
            "live": true,
            "path": "configurations/series",
            "permission": "configurations.series.view",
            "own": false
          },
          {
            "key": "organizacion-configuracion-general",
            "label": "Configuración general",
            "live": false,
            "path": "admin/organizacion/configuracion-general",
            "permission": "admin.organizacion-configuracion-general.view",
            "own": false,
            "folder": "src/modules/admin/organizacion/configuracion-general"
          }
        ]
      },
      {
        "key": "usuarios-y-accesos",
        "label": "Usuarios y accesos",
        "screens": [
          {
            "key": "usuarios-y-accesos-usuarios",
            "label": "Usuarios",
            "live": true,
            "path": "configurations/users",
            "permission": [
              "configurations.users.view",
              "users.view"
            ],
            "own": false
          },
          {
            "key": "usuarios-y-accesos-personal-vinculado",
            "label": "Personal vinculado",
            "live": false,
            "path": "admin/usuarios-y-accesos/personal-vinculado",
            "permission": "admin.usuarios-y-accesos-personal-vinculado.view",
            "own": false,
            "folder": "src/modules/admin/usuarios-y-accesos/personal-vinculado"
          },
          {
            "key": "usuarios-y-accesos-roles",
            "label": "Roles",
            "live": true,
            "path": "configurations/roles",
            "permission": [
              "configurations.roles.view",
              "roles.view"
            ],
            "own": false
          },
          {
            "key": "usuarios-y-accesos-permisos",
            "label": "Permisos",
            "live": false,
            "path": "admin/usuarios-y-accesos/permisos",
            "permission": "admin.usuarios-y-accesos-permisos.view",
            "own": false,
            "folder": "src/modules/admin/usuarios-y-accesos/permisos"
          },
          {
            "key": "usuarios-y-accesos-excepciones",
            "label": "Excepciones",
            "live": false,
            "path": "admin/usuarios-y-accesos/excepciones",
            "permission": "admin.usuarios-y-accesos-excepciones.view",
            "own": false,
            "folder": "src/modules/admin/usuarios-y-accesos/excepciones"
          },
          {
            "key": "usuarios-y-accesos-grupos-de-usuarios",
            "label": "Grupos de usuarios",
            "live": true,
            "path": "configurations/grupos-usuarios",
            "permission": "configurations.userGroups.view",
            "own": false
          }
        ]
      },
      {
        "key": "seguridad",
        "label": "Seguridad",
        "screens": [
          {
            "key": "seguridad-sesiones",
            "label": "Sesiones",
            "live": false,
            "path": "admin/seguridad/sesiones",
            "permission": "admin.seguridad-sesiones.view",
            "own": false,
            "folder": "src/modules/admin/seguridad/sesiones"
          },
          {
            "key": "seguridad-politicas-de-acceso",
            "label": "Políticas de acceso",
            "live": false,
            "path": "admin/seguridad/politicas-de-acceso",
            "permission": "admin.seguridad-politicas-de-acceso.view",
            "own": false,
            "folder": "src/modules/admin/seguridad/politicas-de-acceso"
          },
          {
            "key": "seguridad-autorizaciones",
            "label": "Autorizaciones",
            "live": false,
            "path": "admin/seguridad/autorizaciones",
            "permission": "admin.seguridad-autorizaciones.view",
            "own": false,
            "folder": "src/modules/admin/seguridad/autorizaciones"
          },
          {
            "key": "seguridad-auditoria",
            "label": "Auditoría",
            "live": true,
            "path": "configurations/audit",
            "permission": "configurations.audit.view",
            "own": false
          },
          {
            "key": "seguridad-historial-de-cambios",
            "label": "Historial de cambios",
            "live": false,
            "path": "admin/seguridad/historial-de-cambios",
            "permission": "admin.seguridad-historial-de-cambios.view",
            "own": false,
            "folder": "src/modules/admin/seguridad/historial-de-cambios"
          }
        ]
      },
      {
        "key": "configuracion-avanzada",
        "label": "Configuración avanzada",
        "screens": [
          {
            "key": "configuracion-avanzada-parametros-generales",
            "label": "Parámetros generales",
            "live": false,
            "path": "admin/configuracion-avanzada/parametros-generales",
            "permission": "admin.configuracion-avanzada-parametros-generales.view",
            "own": false,
            "folder": "src/modules/admin/configuracion-avanzada/parametros-generales"
          },
          {
            "key": "configuracion-avanzada-preferencias",
            "label": "Preferencias",
            "live": false,
            "path": "admin/configuracion-avanzada/preferencias",
            "permission": "admin.configuracion-avanzada-preferencias.view",
            "own": false,
            "folder": "src/modules/admin/configuracion-avanzada/preferencias"
          },
          {
            "key": "configuracion-avanzada-plantillas",
            "label": "Plantillas",
            "live": false,
            "path": "admin/configuracion-avanzada/plantillas",
            "permission": "admin.configuracion-avanzada-plantillas.view",
            "own": false,
            "folder": "src/modules/admin/configuracion-avanzada/plantillas"
          },
          {
            "key": "configuracion-avanzada-numeracion",
            "label": "Numeración",
            "live": false,
            "path": "admin/configuracion-avanzada/numeracion",
            "permission": "admin.configuracion-avanzada-numeracion.view",
            "own": false,
            "folder": "src/modules/admin/configuracion-avanzada/numeracion"
          },
          {
            "key": "configuracion-avanzada-configuraciones-por-empresa-y-sucursal",
            "label": "Configuraciones por empresa y sucursal",
            "live": false,
            "path": "admin/configuracion-avanzada/configuraciones-por-empresa-y-sucursal",
            "permission": "admin.configuracion-avanzada-configuraciones-por-empresa-y-sucursal.view",
            "own": false,
            "folder": "src/modules/admin/configuracion-avanzada/configuraciones-por-empresa-y-sucursal"
          },
          {
            "key": "configuracion-avanzada-franquicia",
            "label": "Franquicia",
            "live": true,
            "path": "configurations/categories",
            "permission": "configurations.franchise.view",
            "own": false
          }
        ]
      }
    ]
  },
  {
    "key": "module-store",
    "label": "Tienda de módulos",
    "icon": "module_store",
    "order": 190,
    "description": "Catálogo de módulos, planes, licencias y activación (solo dueño de la cuenta).",
    "ownerOnly": true,
    "groups": [
      {
        "key": null,
        "label": null,
        "screens": [
          {
            "key": "catalogo-de-modulos",
            "label": "Catálogo de módulos",
            "live": true,
            "path": "module-store",
            "own": false
          },
          {
            "key": "planes",
            "label": "Planes",
            "live": false,
            "path": "module-store/planes",
            "permission": "module-store.planes.view",
            "own": false,
            "folder": "src/modules/module-store/planes"
          },
          {
            "key": "dependencias",
            "label": "Dependencias",
            "live": false,
            "path": "module-store/dependencias",
            "permission": "module-store.dependencias.view",
            "own": false,
            "folder": "src/modules/module-store/dependencias"
          },
          {
            "key": "licencias",
            "label": "Licencias",
            "live": false,
            "path": "module-store/licencias",
            "permission": "module-store.licencias.view",
            "own": false,
            "folder": "src/modules/module-store/licencias"
          },
          {
            "key": "activacion",
            "label": "Activación",
            "live": false,
            "path": "module-store/activacion",
            "permission": "module-store.activacion.view",
            "own": false,
            "folder": "src/modules/module-store/activacion"
          },
          {
            "key": "renovacion",
            "label": "Renovación",
            "live": false,
            "path": "module-store/renovacion",
            "permission": "module-store.renovacion.view",
            "own": false,
            "folder": "src/modules/module-store/renovacion"
          },
          {
            "key": "historial-de-contratacion",
            "label": "Historial de contratación",
            "live": false,
            "path": "module-store/historial-de-contratacion",
            "permission": "module-store.historial-de-contratacion.view",
            "own": false,
            "folder": "src/modules/module-store/historial-de-contratacion"
          }
        ]
      }
    ]
  }
]

export const SHORTCUTS: TaxShortcut[] = []

/** Nombre visible de cada módulo (para roles, permisos y licencias). */
export const MODULE_LABELS: Record<string, string> = {
  "dashboard": "Panel",
  "sales": "Ventas",
  "customers": "Clientes y CRM",
  "cobranza": "Cuentas por cobrar",
  "shopping": "Compras",
  "cash-register": "Caja",
  "store": "Inventario y almacenes",
  "production": "Producción y manufactura",
  "restaurants": "Restaurantes y Food Service",
  "catalogos": "Catálogos",
  "finance": "Finanzas y contabilidad",
  "fiscal": "Facturación y fiscal",
  "hr": "Recursos humanos",
  "projects": "Servicios y proyectos",
  "realestate": "Inmuebles y condominios",
  "reports": "Reportes y análisis",
  "automation": "Automatización e integraciones",
  "admin": "Administración y seguridad",
  "module-store": "Tienda de módulos"
}

/** Nombre visible del "submódulo" de un permiso nuevo: clave "<módulo>.<pantalla>" → "Grupo › Pantalla". */
export const SUBMODULE_LABELS: Record<string, string> = {
  "dashboard.indicadores": "Indicadores",
  "dashboard.pendientes": "Pendientes",
  "dashboard.actividad-reciente": "Actividad reciente",
  "dashboard.favoritos": "Favoritos",
  "sales.punto-de-venta-suspender-y-recuperar-venta": "Punto de venta › Suspender y recuperar venta",
  "sales.punto-de-venta-devoluciones-rapidas": "Punto de venta › Devoluciones rápidas",
  "sales.gestion-comercial-pedidos-de-clientes": "Gestión comercial › Pedidos de clientes",
  "sales.gestion-comercial-historial-de-ventas": "Gestión comercial › Historial de ventas",
  "sales.gestion-comercial-detalle-de-venta": "Gestión comercial › Detalle de venta",
  "sales.descuentos-y-promociones-promociones": "Descuentos y promociones › Promociones",
  "sales.descuentos-y-promociones-cupones": "Descuentos y promociones › Cupones",
  "sales.descuentos-y-promociones-reglas-de-descuento": "Descuentos y promociones › Reglas de descuento",
  "sales.descuentos-y-promociones-autorizaciones": "Descuentos y promociones › Autorizaciones",
  "sales.descuentos-y-promociones-precios-especiales": "Descuentos y promociones › Precios especiales",
  "sales.cobros-registrar-cobro": "Cobros › Registrar cobro",
  "sales.cobros-pagos-mixtos": "Cobros › Pagos mixtos",
  "sales.cobros-pagos-parciales": "Cobros › Pagos parciales",
  "sales.cobros-reembolsos": "Cobros › Reembolsos",
  "sales.cobros-metodos-de-cobro": "Cobros › Métodos de cobro",
  "sales.devoluciones-y-cancelaciones-devoluciones": "Devoluciones y cancelaciones › Devoluciones",
  "sales.devoluciones-y-cancelaciones-notas-de-credito": "Devoluciones y cancelaciones › Notas de crédito",
  "sales.devoluciones-y-cancelaciones-solicitudes-de-cancelacion": "Devoluciones y cancelaciones › Solicitudes de cancelación",
  "sales.devoluciones-y-cancelaciones-historial-de-autorizaciones": "Devoluciones y cancelaciones › Historial de autorizaciones",
  "sales.configuracion-de-ventas-canales": "Configuración de ventas › Canales",
  "sales.configuracion-de-ventas-comisiones": "Configuración de ventas › Comisiones",
  "sales.configuracion-de-ventas-politicas-comerciales": "Configuración de ventas › Políticas comerciales",
  "sales.configuracion-de-ventas-series-de-documentos": "Configuración de ventas › Series de documentos",
  "customers.clientes-alta-y-edicion": "Clientes › Alta y edición",
  "customers.clientes-contactos": "Clientes › Contactos",
  "customers.clientes-direcciones": "Clientes › Direcciones",
  "customers.clientes-clasificacion": "Clientes › Clasificación",
  "customers.clientes-historial-de-compras": "Clientes › Historial de compras",
  "customers.crm-prospectos": "CRM › Prospectos",
  "customers.crm-oportunidades": "CRM › Oportunidades",
  "customers.crm-actividades": "CRM › Actividades",
  "customers.crm-seguimientos": "CRM › Seguimientos",
  "customers.crm-campanas": "CRM › Campañas",
  "customers.crm-embudo-comercial": "CRM › Embudo comercial",
  "customers.relacion-comercial-contratos": "Relación comercial › Contratos",
  "customers.relacion-comercial-condiciones-comerciales": "Relación comercial › Condiciones comerciales",
  "customers.relacion-comercial-listas-de-precios": "Relación comercial › Listas de precios",
  "customers.relacion-comercial-comunicaciones": "Relación comercial › Comunicaciones",
  "customers.relacion-comercial-renovaciones": "Relación comercial › Renovaciones",
  "cobranza.cartera-documentos-pendientes": "Cartera › Documentos pendientes",
  "cobranza.cartera-anticipos": "Cartera › Anticipos",
  "cobranza.cartera-saldos-a-favor": "Cartera › Saldos a favor",
  "cobranza.cobranza-aplicar-pagos": "Cobranza › Aplicar pagos",
  "cobranza.cobranza-pagos-parciales": "Cobranza › Pagos parciales",
  "cobranza.cobranza-recibos": "Cobranza › Recibos",
  "cobranza.cobranza-promesas-de-pago": "Cobranza › Promesas de pago",
  "cobranza.seguimiento-antiguedad-de-saldos": "Seguimiento › Antigüedad de saldos",
  "cobranza.seguimiento-vencimientos": "Seguimiento › Vencimientos",
  "cobranza.seguimiento-limites-de-credito": "Seguimiento › Límites de crédito",
  "cobranza.seguimiento-historial-de-cobranza": "Seguimiento › Historial de cobranza",
  "shopping.planeacion-solicitudes-de-compra": "Planeación › Solicitudes de compra",
  "shopping.planeacion-necesidades-de-reabastecimiento": "Planeación › Necesidades de reabastecimiento",
  "shopping.proveedores-contactos": "Proveedores › Contactos",
  "shopping.proveedores-condiciones": "Proveedores › Condiciones",
  "shopping.proveedores-evaluaciones": "Proveedores › Evaluaciones",
  "shopping.proveedores-historial-de-precios": "Proveedores › Historial de precios",
  "shopping.adquisiciones-solicitudes-de-cotizacion": "Adquisiciones › Solicitudes de cotización",
  "shopping.adquisiciones-comparativas": "Adquisiciones › Comparativas",
  "shopping.adquisiciones-autorizaciones": "Adquisiciones › Autorizaciones",
  "shopping.recepcion-y-devoluciones-recepciones": "Recepción y devoluciones › Recepciones",
  "shopping.recepcion-y-devoluciones-recepciones-parciales": "Recepción y devoluciones › Recepciones parciales",
  "shopping.recepcion-y-devoluciones-devoluciones-a-proveedores": "Recepción y devoluciones › Devoluciones a proveedores",
  "shopping.recepcion-y-devoluciones-diferencias": "Recepción y devoluciones › Diferencias",
  "shopping.facturas-de-proveedor-facturas-recibidas": "Facturas de proveedor › Facturas recibidas",
  "shopping.facturas-de-proveedor-validacion": "Facturas de proveedor › Validación",
  "shopping.facturas-de-proveedor-costos-adicionales": "Facturas de proveedor › Costos adicionales",
  "shopping.facturas-de-proveedor-anticipos": "Facturas de proveedor › Anticipos",
  "shopping.facturas-de-proveedor-enlace-a-cuentas-por-pagar": "Facturas de proveedor › Enlace a cuentas por pagar",
  "cash-register.operacion-abrir-caja": "Operación › Abrir caja",
  "cash-register.operacion-turno-activo": "Operación › Turno activo",
  "cash-register.operacion-ingresos": "Operación › Ingresos",
  "cash-register.operacion-retiros": "Operación › Retiros",
  "cash-register.operacion-gastos": "Operación › Gastos",
  "cash-register.cortes-y-arqueos-arqueo": "Cortes y arqueos › Arqueo",
  "cash-register.cortes-y-arqueos-diferencias": "Cortes y arqueos › Diferencias",
  "cash-register.cortes-y-arqueos-historial-de-cortes": "Cortes y arqueos › Historial de cortes",
  "cash-register.cortes-y-arqueos-autorizaciones": "Cortes y arqueos › Autorizaciones",
  "cash-register.administracion-de-cajas-asignaciones": "Administración de cajas › Asignaciones",
  "cash-register.administracion-de-cajas-sucursales": "Administración de cajas › Sucursales",
  "cash-register.administracion-de-cajas-terminales": "Administración de cajas › Terminales",
  "cash-register.turnos-historial": "Turnos › Historial",
  "cash-register.turnos-horarios": "Turnos › Horarios",
  "cash-register.turnos-rotaciones": "Turnos › Rotaciones",
  "cash-register.turnos-asignaciones-de-empleados": "Turnos › Asignaciones de empleados",
  "cash-register.control-limites": "Control › Límites",
  "cash-register.control-fondos-iniciales": "Control › Fondos iniciales",
  "cash-register.control-reglas-de-cierre": "Control › Reglas de cierre",
  "cash-register.control-denominaciones": "Control › Denominaciones",
  "cash-register.control-reglas-de-autorizacion": "Control › Reglas de autorización",
  "store.existencias-existencias-por-sucursal": "Existencias › Existencias por sucursal",
  "store.existencias-existencias-por-almacen": "Existencias › Existencias por almacén",
  "store.existencias-disponibilidad": "Existencias › Disponibilidad",
  "store.existencias-reservas": "Existencias › Reservas",
  "store.movimientos-ajustes": "Movimientos › Ajustes",
  "store.movimientos-recepciones": "Movimientos › Recepciones",
  "store.movimientos-inventario-en-transito": "Movimientos › Inventario en tránsito",
  "store.control-de-inventario-kardex": "Control de inventario › Kardex",
  "store.control-de-inventario-conteos-fisicos": "Control de inventario › Conteos físicos",
  "store.control-de-inventario-conteos-ciclicos": "Control de inventario › Conteos cíclicos",
  "store.control-de-inventario-conciliacion": "Control de inventario › Conciliación",
  "store.control-de-inventario-trazabilidad": "Control de inventario › Trazabilidad",
  "store.lotes-y-series-lotes": "Lotes y series › Lotes",
  "store.lotes-y-series-numeros-de-serie": "Lotes y series › Números de serie",
  "store.lotes-y-series-caducidades": "Lotes y series › Caducidades",
  "store.lotes-y-series-trazabilidad-de-origen-y-destino": "Lotes y series › Trazabilidad de origen y destino",
  "store.reabastecimiento-minimos-y-maximos": "Reabastecimiento › Mínimos y máximos",
  "store.reabastecimiento-alertas": "Reabastecimiento › Alertas",
  "store.reabastecimiento-sugerencias-de-compra": "Reabastecimiento › Sugerencias de compra",
  "store.reabastecimiento-politicas-de-reposicion": "Reabastecimiento › Políticas de reposición",
  "store.costos-costos-de-inventario": "Costos › Costos de inventario",
  "store.costos-valoracion": "Costos › Valoración",
  "store.costos-historial-de-costos": "Costos › Historial de costos",
  "store.costos-configuracion-de-valoracion": "Costos › Configuración de valoración",
  "store.administracion-de-almacenes-ubicaciones-internas": "Administración de almacenes › Ubicaciones internas",
  "store.administracion-de-almacenes-zonas": "Administración de almacenes › Zonas",
  "store.administracion-de-almacenes-capacidad": "Administración de almacenes › Capacidad",
  "store.administracion-de-almacenes-configuracion": "Administración de almacenes › Configuración",
  "production.ordenes-de-produccion-crear-ordenes": "Órdenes de producción › Crear órdenes",
  "production.ordenes-de-produccion-planificacion": "Órdenes de producción › Planificación",
  "production.ordenes-de-produccion-cierre": "Órdenes de producción › Cierre",
  "production.materiales-y-formulas-listas-de-materiales": "Materiales y fórmulas › Listas de materiales",
  "production.materiales-y-formulas-versiones": "Materiales y fórmulas › Versiones",
  "production.materiales-y-formulas-recetas-industriales": "Materiales y fórmulas › Recetas industriales",
  "production.materiales-y-formulas-subproductos": "Materiales y fórmulas › Subproductos",
  "production.materiales-y-formulas-sustituciones-autorizadas": "Materiales y fórmulas › Sustituciones autorizadas",
  "production.ejecucion-operaciones": "Ejecución › Operaciones",
  "production.ejecucion-consumos": "Ejecución › Consumos",
  "production.ejecucion-producto-terminado": "Ejecución › Producto terminado",
  "production.ejecucion-mermas": "Ejecución › Mermas",
  "production.ejecucion-rechazos": "Ejecución › Rechazos",
  "production.planificacion-necesidades-de-materiales": "Planificación › Necesidades de materiales",
  "production.planificacion-capacidad": "Planificación › Capacidad",
  "production.planificacion-calendarios": "Planificación › Calendarios",
  "production.planificacion-programacion-de-produccion": "Planificación › Programación de producción",
  "production.calidad-y-mantenimiento-inspecciones": "Calidad y mantenimiento › Inspecciones",
  "production.calidad-y-mantenimiento-no-conformidades": "Calidad y mantenimiento › No conformidades",
  "production.calidad-y-mantenimiento-equipos": "Calidad y mantenimiento › Equipos",
  "production.calidad-y-mantenimiento-mantenimiento-preventivo": "Calidad y mantenimiento › Mantenimiento preventivo",
  "production.calidad-y-mantenimiento-ordenes-de-mantenimiento": "Calidad y mantenimiento › Órdenes de mantenimiento",
  "production.costos-de-fabricacion-materiales": "Costos de fabricación › Materiales",
  "production.costos-de-fabricacion-mano-de-obra": "Costos de fabricación › Mano de obra",
  "production.costos-de-fabricacion-costos-indirectos": "Costos de fabricación › Costos indirectos",
  "production.costos-de-fabricacion-costos-reales-y-estimados": "Costos de fabricación › Costos reales y estimados",
  "restaurants.salon-plano": "Salón › Plano",
  "restaurants.salon-salones": "Salón › Salones",
  "restaurants.salon-zonas": "Salón › Zonas",
  "restaurants.salon-mesas": "Salón › Mesas",
  "restaurants.salon-asignacion-de-meseros": "Salón › Asignación de meseros",
  "restaurants.salon-reservaciones": "Salón › Reservaciones",
  "restaurants.comandas-nueva-comanda": "Comandas › Nueva comanda",
  "restaurants.comandas-modificaciones": "Comandas › Modificaciones",
  "restaurants.comandas-division-de-cuentas": "Comandas › División de cuentas",
  "restaurants.comandas-division-de-conceptos": "Comandas › División de conceptos",
  "restaurants.comandas-estados": "Comandas › Estados",
  "restaurants.menus-menus": "Menús › Menús",
  "restaurants.menus-categorias": "Menús › Categorías",
  "restaurants.menus-platillos": "Menús › Platillos",
  "restaurants.menus-modificadores": "Menús › Modificadores",
  "restaurants.menus-complementos": "Menús › Complementos",
  "restaurants.menus-disponibilidad": "Menús › Disponibilidad",
  "restaurants.cocina-estaciones": "Cocina › Estaciones",
  "restaurants.cocina-cola-de-preparacion": "Cocina › Cola de preparación",
  "restaurants.cocina-enrutamiento": "Cocina › Enrutamiento",
  "restaurants.cocina-tiempos": "Cocina › Tiempos",
  "restaurants.cocina-pantalla-kds": "Cocina › Pantalla KDS",
  "restaurants.recetas-ingredientes": "Recetas › Ingredientes",
  "restaurants.recetas-subrecetas": "Recetas › Subrecetas",
  "restaurants.recetas-rendimientos": "Recetas › Rendimientos",
  "restaurants.recetas-unidades-de-consumo": "Recetas › Unidades de consumo",
  "restaurants.recetas-mermas": "Recetas › Mermas",
  "restaurants.recetas-costos": "Recetas › Costos",
  "restaurants.entrega-para-llevar": "Entrega › Para llevar",
  "restaurants.entrega-reparto": "Entrega › Reparto",
  "restaurants.entrega-entregas": "Entrega › Entregas",
  "restaurants.entrega-canales-externos": "Entrega › Canales externos",
  "restaurants.entrega-seguimiento-de-pedidos": "Entrega › Seguimiento de pedidos",
  "catalogos.productos-y-servicios-variantes": "Productos y servicios › Plantillas de variantes",
  "catalogos.productos-y-servicios-presentaciones": "Productos y servicios › Presentaciones",
  "catalogos.productos-y-servicios-codigos-de-barras": "Productos y servicios › Códigos de barras",
  "catalogos.productos-y-servicios-kits-y-paquetes": "Productos y servicios › Kits y paquetes",
  "catalogos.clasificacion-subcategorias": "Clasificación › Subcategorías",
  "catalogos.clasificacion-marcas": "Clasificación › Marcas",
  "catalogos.clasificacion-modelos": "Clasificación › Modelos",
  "catalogos.clasificacion-atributos": "Clasificación › Atributos",
  "catalogos.clasificacion-caracteristicas": "Clasificación › Características",
  "catalogos.unidades-y-cantidades-conversiones": "Unidades y cantidades › Conversiones",
  "catalogos.unidades-y-cantidades-unidades-de-compra": "Unidades y cantidades › Unidades de compra",
  "catalogos.unidades-y-cantidades-unidades-de-venta": "Unidades y cantidades › Unidades de venta",
  "catalogos.precios-y-condiciones-listas-de-precios": "Precios y condiciones › Listas de precios",
  "catalogos.precios-y-condiciones-tarifas": "Precios y condiciones › Tarifas",
  "catalogos.precios-y-condiciones-condiciones-comerciales": "Precios y condiciones › Condiciones comerciales",
  "catalogos.precios-y-condiciones-reglas-de-precio": "Precios y condiciones › Reglas de precio",
  "catalogos.impuestos-y-monedas-impuestos": "Impuestos y monedas › Impuestos",
  "catalogos.impuestos-y-monedas-monedas": "Impuestos y monedas › Monedas",
  "catalogos.impuestos-y-monedas-tipos-de-cambio": "Impuestos y monedas › Tipos de cambio",
  "catalogos.impuestos-y-monedas-catalogos-fiscales": "Impuestos y monedas › Catálogos fiscales",
  "catalogos.otros-catalogos-motivos-de-ajuste": "Otros catálogos › Motivos de ajuste",
  "catalogos.otros-catalogos-motivos-de-cancelacion": "Otros catálogos › Motivos de cancelación",
  "catalogos.otros-catalogos-tipos-de-documento": "Otros catálogos › Tipos de documento",
  "finance.cuentas-por-pagar-facturas": "Cuentas por pagar › Facturas",
  "finance.cuentas-por-pagar-anticipos": "Cuentas por pagar › Anticipos",
  "finance.cuentas-por-pagar-vencimientos": "Cuentas por pagar › Vencimientos",
  "finance.cuentas-por-pagar-pagos": "Cuentas por pagar › Pagos",
  "finance.cuentas-por-pagar-aplicaciones": "Cuentas por pagar › Aplicaciones",
  "finance.cuentas-por-pagar-propuestas-de-pago": "Cuentas por pagar › Propuestas de pago",
  "finance.bancos-y-tesoreria-cuentas-bancarias": "Bancos y tesorería › Cuentas bancarias",
  "finance.bancos-y-tesoreria-transferencias": "Bancos y tesorería › Transferencias",
  "finance.bancos-y-tesoreria-conciliacion-bancaria": "Bancos y tesorería › Conciliación bancaria",
  "finance.bancos-y-tesoreria-flujo-de-efectivo": "Bancos y tesorería › Flujo de efectivo",
  "finance.costos-y-presupuestos-centros-de-costos": "Costos y presupuestos › Centros de costos",
  "finance.costos-y-presupuestos-dimensiones": "Costos y presupuestos › Dimensiones",
  "finance.costos-y-presupuestos-presupuestos": "Costos y presupuestos › Presupuestos",
  "finance.costos-y-presupuestos-prorrateos": "Costos y presupuestos › Prorrateos",
  "finance.costos-y-presupuestos-analisis-de-desviaciones": "Costos y presupuestos › Análisis de desviaciones",
  "finance.activos-fijos-registro": "Activos fijos › Registro",
  "finance.activos-fijos-depreciacion": "Activos fijos › Depreciación",
  "finance.activos-fijos-mejoras": "Activos fijos › Mejoras",
  "finance.activos-fijos-deterioro": "Activos fijos › Deterioro",
  "finance.activos-fijos-bajas": "Activos fijos › Bajas",
  "finance.activos-fijos-disposicion": "Activos fijos › Disposición",
  "finance.multimoneda-y-consolidacion-diferencias-cambiarias": "Multimoneda y consolidación › Diferencias cambiarias",
  "finance.multimoneda-y-consolidacion-intercompania": "Multimoneda y consolidación › Intercompañía",
  "finance.multimoneda-y-consolidacion-eliminaciones": "Multimoneda y consolidación › Eliminaciones",
  "finance.multimoneda-y-consolidacion-estados-consolidados": "Multimoneda y consolidación › Estados consolidados",
  "finance.estados-financieros-balance-general": "Estados financieros › Balance general",
  "finance.estados-financieros-resultados": "Estados financieros › Resultados",
  "finance.estados-financieros-flujo-de-efectivo": "Estados financieros › Flujo de efectivo",
  "finance.estados-financieros-cambios-en-capital": "Estados financieros › Cambios en capital",
  "finance.estados-financieros-auxiliares": "Estados financieros › Auxiliares",
  "fiscal.cfdi-emision": "CFDI › Emisión",
  "fiscal.cfdi-recepcion": "CFDI › Recepción",
  "fiscal.cfdi-documentos-relacionados": "CFDI › Documentos relacionados",
  "fiscal.cfdi-uuid": "CFDI › UUID",
  "fiscal.cfdi-estados": "CFDI › Estados",
  "fiscal.complementos-y-cancelaciones-complementos-de-pago": "Complementos y cancelaciones › Complementos de pago",
  "fiscal.complementos-y-cancelaciones-solicitudes-de-cancelacion": "Complementos y cancelaciones › Solicitudes de cancelación",
  "fiscal.complementos-y-cancelaciones-sustituciones": "Complementos y cancelaciones › Sustituciones",
  "fiscal.complementos-y-cancelaciones-seguimiento": "Complementos y cancelaciones › Seguimiento",
  "fiscal.nomina-fiscal-cfdi-de-nomina": "Nómina fiscal › CFDI de nómina",
  "fiscal.nomina-fiscal-timbrado": "Nómina fiscal › Timbrado",
  "fiscal.nomina-fiscal-cancelacion": "Nómina fiscal › Cancelación",
  "fiscal.nomina-fiscal-historial-de-respuestas": "Nómina fiscal › Historial de respuestas",
  "fiscal.contabilidad-electronica-catalogo-de-cuentas-fiscal": "Contabilidad electrónica › Catálogo de cuentas fiscal",
  "fiscal.contabilidad-electronica-balanza": "Contabilidad electrónica › Balanza",
  "fiscal.contabilidad-electronica-polizas-y-auxiliares-cuando-correspondan": "Contabilidad electrónica › Pólizas y auxiliares cuando correspondan",
  "fiscal.configuracion-fiscal-datos-fiscales": "Configuración fiscal › Datos fiscales",
  "fiscal.configuracion-fiscal-impuestos": "Configuración fiscal › Impuestos",
  "fiscal.configuracion-fiscal-certificados-protegidos": "Configuración fiscal › Certificados protegidos",
  "fiscal.configuracion-fiscal-pac": "Configuración fiscal › PAC",
  "fiscal.configuracion-fiscal-catalogos-versionados": "Configuración fiscal › Catálogos versionados",
  "hr.personal-expedientes": "Personal › Expedientes",
  "hr.personal-puestos": "Personal › Puestos",
  "hr.personal-departamentos": "Personal › Departamentos",
  "hr.personal-organigrama": "Personal › Organigrama",
  "hr.personal-historial-laboral": "Personal › Historial laboral",
  "hr.personal-altas-y-bajas": "Personal › Altas y bajas",
  "hr.reclutamiento-vacantes": "Reclutamiento › Vacantes",
  "hr.reclutamiento-candidatos": "Reclutamiento › Candidatos",
  "hr.reclutamiento-entrevistas": "Reclutamiento › Entrevistas",
  "hr.reclutamiento-seleccion": "Reclutamiento › Selección",
  "hr.reclutamiento-contratacion": "Reclutamiento › Contratación",
  "hr.reclutamiento-onboarding": "Reclutamiento › Onboarding",
  "hr.asistencia-y-horarios-horarios": "Asistencia y horarios › Horarios",
  "hr.asistencia-y-horarios-turnos-laborales": "Asistencia y horarios › Turnos laborales",
  "hr.asistencia-y-horarios-marcajes": "Asistencia y horarios › Marcajes",
  "hr.asistencia-y-horarios-retardos": "Asistencia y horarios › Retardos",
  "hr.asistencia-y-horarios-incidencias": "Asistencia y horarios › Incidencias",
  "hr.asistencia-y-horarios-horas-extra": "Asistencia y horarios › Horas extra",
  "hr.ausencias-y-prestaciones-vacaciones": "Ausencias y prestaciones › Vacaciones",
  "hr.ausencias-y-prestaciones-permisos": "Ausencias y prestaciones › Permisos",
  "hr.ausencias-y-prestaciones-incapacidades": "Ausencias y prestaciones › Incapacidades",
  "hr.ausencias-y-prestaciones-prestaciones": "Ausencias y prestaciones › Prestaciones",
  "hr.ausencias-y-prestaciones-saldos-y-solicitudes": "Ausencias y prestaciones › Saldos y solicitudes",
  "hr.nomina-periodos": "Nómina › Periodos",
  "hr.nomina-percepciones": "Nómina › Percepciones",
  "hr.nomina-deducciones": "Nómina › Deducciones",
  "hr.nomina-comisiones": "Nómina › Comisiones",
  "hr.nomina-calculo": "Nómina › Cálculo",
  "hr.nomina-aprobacion": "Nómina › Aprobación",
  "hr.nomina-recibos": "Nómina › Recibos",
  "hr.nomina-finiquitos": "Nómina › Finiquitos",
  "hr.desarrollo-capacitacion": "Desarrollo › Capacitación",
  "hr.desarrollo-certificaciones": "Desarrollo › Certificaciones",
  "hr.desarrollo-evaluaciones": "Desarrollo › Evaluaciones",
  "hr.desarrollo-objetivos": "Desarrollo › Objetivos",
  "hr.desarrollo-planes-de-desarrollo": "Desarrollo › Planes de desarrollo",
  "hr.autoservicio-portal-del-empleado": "Autoservicio › Portal del empleado",
  "hr.autoservicio-recibos": "Autoservicio › Recibos",
  "hr.autoservicio-solicitudes": "Autoservicio › Solicitudes",
  "hr.autoservicio-documentos": "Autoservicio › Documentos",
  "hr.autoservicio-actualizacion-controlada-de-datos": "Autoservicio › Actualización controlada de datos",
  "hr.reportes-de-rh-rotacion": "Reportes de RH › Rotación",
  "hr.reportes-de-rh-ausentismo": "Reportes de RH › Ausentismo",
  "hr.reportes-de-rh-costos-de-nomina": "Reportes de RH › Costos de nómina",
  "hr.reportes-de-rh-vacaciones-pendientes": "Reportes de RH › Vacaciones pendientes",
  "hr.reportes-de-rh-plantilla": "Reportes de RH › Plantilla",
  "projects.proyectos-proyectos": "Proyectos › Proyectos",
  "projects.proyectos-tareas": "Proyectos › Tareas",
  "projects.proyectos-hitos": "Proyectos › Hitos",
  "projects.proyectos-recursos": "Proyectos › Recursos",
  "projects.proyectos-tiempos": "Proyectos › Tiempos",
  "projects.proyectos-gastos": "Proyectos › Gastos",
  "projects.servicios-ordenes-de-servicio": "Servicios › Órdenes de servicio",
  "projects.servicios-tickets": "Servicios › Tickets",
  "projects.servicios-asignaciones": "Servicios › Asignaciones",
  "projects.servicios-visitas-tecnicas": "Servicios › Visitas técnicas",
  "projects.contratos-contratos": "Contratos › Contratos",
  "projects.contratos-suscripciones": "Contratos › Suscripciones",
  "projects.contratos-renovaciones": "Contratos › Renovaciones",
  "projects.contratos-facturacion-recurrente": "Contratos › Facturación recurrente",
  "projects.soporte-garantias": "Soporte › Garantías",
  "projects.soporte-sla": "Soporte › SLA",
  "projects.soporte-incidencias": "Soporte › Incidencias",
  "projects.soporte-historial-de-atencion": "Soporte › Historial de atención",
  "realestate.inmuebles-propiedades": "Inmuebles › Propiedades",
  "realestate.inmuebles-edificios": "Inmuebles › Edificios",
  "realestate.inmuebles-torres": "Inmuebles › Torres",
  "realestate.inmuebles-unidades": "Inmuebles › Unidades",
  "realestate.inmuebles-areas-comunes": "Inmuebles › Áreas comunes",
  "realestate.relaciones-propietarios": "Relaciones › Propietarios",
  "realestate.relaciones-copropiedades": "Relaciones › Copropiedades",
  "realestate.relaciones-ocupantes": "Relaciones › Ocupantes",
  "realestate.relaciones-arrendamientos": "Relaciones › Arrendamientos",
  "realestate.administracion-cuotas": "Administración › Cuotas",
  "realestate.administracion-cargos": "Administración › Cargos",
  "realestate.administracion-presupuestos": "Administración › Presupuestos",
  "realestate.administracion-gastos-comunes": "Administración › Gastos comunes",
  "realestate.administracion-aplicaciones-de-pagos": "Administración › Aplicaciones de pagos",
  "realestate.operacion-incidencias": "Operación › Incidencias",
  "realestate.operacion-mantenimiento": "Operación › Mantenimiento",
  "realestate.operacion-reservaciones": "Operación › Reservaciones",
  "realestate.operacion-accesos": "Operación › Accesos",
  "realestate.operacion-comunicados": "Operación › Comunicados",
  "realestate.operacion-asambleas-y-votaciones": "Operación › Asambleas y votaciones",
  "reports.ventas": "Ventas",
  "reports.caja": "Caja",
  "reports.inventario": "Inventario",
  "reports.compras": "Compras",
  "reports.finanzas": "Finanzas",
  "reports.fiscal": "Fiscal",
  "reports.rh": "RH",
  "reports.produccion": "Producción",
  "reports.rentabilidad": "Rentabilidad",
  "reports.reportes-personalizados": "Reportes personalizados",
  "automation.flujos-y-aprobaciones-definiciones": "Flujos y aprobaciones › Definiciones",
  "automation.flujos-y-aprobaciones-versiones": "Flujos y aprobaciones › Versiones",
  "automation.flujos-y-aprobaciones-instancias": "Flujos y aprobaciones › Instancias",
  "automation.flujos-y-aprobaciones-pasos": "Flujos y aprobaciones › Pasos",
  "automation.flujos-y-aprobaciones-reglas": "Flujos y aprobaciones › Reglas",
  "automation.flujos-y-aprobaciones-aprobaciones": "Flujos y aprobaciones › Aprobaciones",
  "automation.integraciones-conectores": "Integraciones › Conectores",
  "automation.integraciones-credenciales-referenciadas": "Integraciones › Credenciales referenciadas",
  "automation.integraciones-webhooks": "Integraciones › Webhooks",
  "automation.integraciones-eventos": "Integraciones › Eventos",
  "automation.integraciones-suscripciones": "Integraciones › Suscripciones",
  "automation.sincronizacion-colas": "Sincronización › Colas",
  "automation.sincronizacion-reintentos": "Sincronización › Reintentos",
  "automation.sincronizacion-errores": "Sincronización › Errores",
  "automation.sincronizacion-estado-de-sincronizacion": "Sincronización › Estado de sincronización",
  "automation.sincronizacion-idempotencia": "Sincronización › Idempotencia",
  "automation.notificaciones-y-auditoria-tecnica-plantillas": "Notificaciones y auditoría técnica › Plantillas",
  "automation.notificaciones-y-auditoria-tecnica-notificaciones": "Notificaciones y auditoría técnica › Notificaciones",
  "automation.notificaciones-y-auditoria-tecnica-correlacion": "Notificaciones y auditoría técnica › Correlación",
  "automation.notificaciones-y-auditoria-tecnica-registro-de-eventos": "Notificaciones y auditoría técnica › Registro de eventos",
  "automation.notificaciones-y-auditoria-tecnica-historial-de-ejecucion": "Notificaciones y auditoría técnica › Historial de ejecución",
  "admin.organizacion-almacenes": "Organización › Almacenes",
  "admin.organizacion-configuracion-general": "Organización › Configuración general",
  "admin.usuarios-y-accesos-personal-vinculado": "Usuarios y accesos › Personal vinculado",
  "admin.usuarios-y-accesos-permisos": "Usuarios y accesos › Permisos",
  "admin.usuarios-y-accesos-excepciones": "Usuarios y accesos › Excepciones",
  "admin.seguridad-sesiones": "Seguridad › Sesiones",
  "admin.seguridad-politicas-de-acceso": "Seguridad › Políticas de acceso",
  "admin.seguridad-autorizaciones": "Seguridad › Autorizaciones",
  "admin.seguridad-historial-de-cambios": "Seguridad › Historial de cambios",
  "admin.configuracion-avanzada-parametros-generales": "Configuración avanzada › Parámetros generales",
  "admin.configuracion-avanzada-preferencias": "Configuración avanzada › Preferencias",
  "admin.configuracion-avanzada-plantillas": "Configuración avanzada › Plantillas",
  "admin.configuracion-avanzada-numeracion": "Configuración avanzada › Numeración",
  "admin.configuracion-avanzada-configuraciones-por-empresa-y-sucursal": "Configuración avanzada › Configuraciones por empresa y sucursal",
  "module-store.planes": "Planes",
  "module-store.dependencias": "Dependencias",
  "module-store.licencias": "Licencias",
  "module-store.activacion": "Activación",
  "module-store.renovacion": "Renovación",
  "module-store.historial-de-contratacion": "Historial de contratación"
}
