import ConfigurationAPIs from './configurationAPIs';

const APIs = {
  login: async (data: any, customPath?: string) => {
    const path = customPath || 'auth/login';
    return ConfigurationAPIs.post(path, data);
  },

  cresteUser: async (data: any, customPath?: string) => {
    const path = customPath || 'users/create';
    return ConfigurationAPIs.post(path, data);
  },




  ///////////////////////////////////COMPANIES////////////////////////////////////////////////////

  cresteCompanies: async (data: any, customPath?: string) => {
    const path = customPath || 'companies/create';
    return ConfigurationAPIs.post(path, data);
  },



  getCompanies: async (id: number, customPath?: string, token?: string) => {
    const path = customPath || `companies/get/${id}`;
    return ConfigurationAPIs.get(path, token ? { headers: { Authorization: token } } : undefined);
  },



  ///////////////////////////////////SUCURSALES////////////////////////////////////////////////////

  cresteBranch: async (data: any, customPath?: string) => {
    const path = customPath || 'branch/create';
    return ConfigurationAPIs.post(path, data);
  },

  getBranch: async (data: any, customPath?: string, token?: string) => {
    const path = customPath || `branch/get/${data.companyId}/${data.userId}`;
    return ConfigurationAPIs.get(path, token ? { headers: { Authorization: token } } : undefined);
  },

    ///////////////////////////////////SERIES////////////////////////////////////////////////////

    createSeries: async (data: any, customPath?: string) => {
      const path = customPath || 'series/create';
      return ConfigurationAPIs.post(path, data);
    },
  
    getSeries: async (_: any, customPath?: string) => {
      // const path = customPath || `tickets/get?companyId=${data.companyId}&branchId=${data.branchId}`;
      const path = customPath || `series/get`;
      return ConfigurationAPIs.get(path);
    },


       ///////////////////////////////////AREAS////////////////////////////////////////////////////

       createAreas: async (data: any, customPath?: string) => {
        const path = customPath || 'areas/create';
        return ConfigurationAPIs.post(path, data);
      },
    
      getAreas: async (
        filters?: {
          companyId?: number;
          branchId?: number;
          production?: boolean;
          type?: string;
        },
        customPath?: string,
      ) => {
        const params = new URLSearchParams();
        if (filters?.companyId != null && filters.companyId > 0) {
          params.set('companyId', String(filters.companyId));
        }
        if (filters?.branchId != null && filters.branchId > 0) {
          params.set('branchId', String(filters.branchId));
        }
        if (filters?.production != null) {
          params.set('production', String(filters.production));
        }
        if (filters?.type) {
          params.set('type', filters.type);
        }
        const query = params.toString();
        const path = customPath || `areas/get${query ? `?${query}` : ''}`;
        return ConfigurationAPIs.get(path);
      },

      updateArea: async (id: string | number, data: any, customPath?: string) => {
        const path = customPath || `areas/${id}`;
        return ConfigurationAPIs.patch(path, data);
      },

      deleteArea: async (id: string | number, customPath?: string) => {
        const path = customPath || `areas/${id}`;
        return ConfigurationAPIs.delete(path);
      },

      getCatalogTypes: async (customPath?: string) => {
        const path = customPath || 'areas/catalog-types';
        return ConfigurationAPIs.get(path);
      },

      getAreaTree: async (companyId?: number, customPath?: string) => {
        const params = new URLSearchParams();
        if (companyId != null && companyId > 0) params.set('companyId', String(companyId));
        const query = params.toString();
        const path = customPath || `areas/tree${query ? `?${query}` : ''}`;
        return ConfigurationAPIs.get(path);
      },

      getAreaMembers: async (areaId: number, customPath?: string) => {
        const path = customPath || `areas/${areaId}/members`;
        return ConfigurationAPIs.get(path);
      },

      addAreaMember: async (areaId: number, data: { userId: number; position?: string }, customPath?: string) => {
        const path = customPath || `areas/${areaId}/members`;
        return ConfigurationAPIs.post(path, data);
      },

      removeAreaMember: async (areaId: number, userId: number, customPath?: string) => {
        const path = customPath || `areas/${areaId}/members/${userId}`;
        return ConfigurationAPIs.delete(path);
      },

      setAreaLeader: async (areaId: number, data: { leaderId?: number }, customPath?: string) => {
        const path = customPath || `areas/${areaId}/leader`;
        return ConfigurationAPIs.patch(path, data);
      },

  ///////////////////////////////////ALMACEN////////////////////////////////////////////////////

  cresteWarehouses: async (data: any, customPath?: string) => {
    const path = customPath || 'store/create';
    return ConfigurationAPIs.post(path, data);
  },

  getWarehouses: async (data: { companyId?: number; branchId?: number }, customPath?: string, token?: string) => {
    const params = new URLSearchParams();
    if (data.companyId != null && data.companyId > 0) {
      params.set('companyId', String(data.companyId));
    }
    if (data.branchId != null && data.branchId > 0) {
      params.set('branchId', String(data.branchId));
    }
    const query = params.toString();
    const path = customPath || `store/get${query ? `?${query}` : ''}`;
    return ConfigurationAPIs.get(path, token ? { headers: { Authorization: token } } : undefined);
  },

  deleteWarehouse: async (id: string | number, customPath?: string) => {
    const path = customPath || `store/${id}`;
    return ConfigurationAPIs.delete(path);
  },

  updateWarehouse: async (id: string | number, data: any, customPath?: string) => {
    const path = customPath || `store/${id}`;
    return ConfigurationAPIs.patch(path, data);
  },



  ///////////////////////////////////UNIDADES////////////////////////////////////////////////////

  cresteUnits: async (data: any, customPath?: string) => {
    const path = customPath || 'units/create';
    return ConfigurationAPIs.post(path, data);
  },

  getUnits: async (data: { companyId?: number; branchId?: number }, customPath?: string) => {
    const params = new URLSearchParams();
    if (data.companyId != null) params.set('companyId', String(data.companyId));
    if (data.branchId != null && data.branchId > 0) params.set('branchId', String(data.branchId));
    const query = params.toString();
    const path = customPath || `units/get-by-company-and-branch${query ? `?${query}` : ''}`;
    return ConfigurationAPIs.get(path);
  },

  getUnitOptions: async (
    data: { companyId?: number; branchId?: number },
    token?: string,
    customPath?: string,
  ) => {
    const params = new URLSearchParams();
    if (data.companyId != null && data.companyId > 0) {
      params.set('companyId', String(data.companyId));
    }
    if (data.branchId != null && data.branchId > 0) {
      params.set('branchId', String(data.branchId));
    }
    const query = params.toString();
    const path = customPath || `units/options-units${query ? `?${query}` : ''}`;
    return ConfigurationAPIs.get(
      path,
      token ? { headers: { Authorization: token } } : undefined,
    );
  },

  deleteUnit: async (id: string | number, customPath?: string) => {
    const path = customPath || `units/${id}`;
    return ConfigurationAPIs.delete(path);
  },

  updateUnit: async (id: string | number, data: Record<string, unknown>, customPath?: string) => {
    const path = customPath || `units/${id}`;
    return ConfigurationAPIs.patch(path, data);
  },


  ///////////////////////////////////PRODUCTO////////////////////////////////////////////////////

  cresteProducts: async (data: any, customPath?: string) => {
    const path = customPath || 'products/create';
    return ConfigurationAPIs.post(path, data);
  },
  getProducts: async (
    code: string,
    name: string,
    customPath?: string,
    filters?: { companyId?: number; branchId?: number },
  ) => {
    const params = new URLSearchParams()
    if (filters?.companyId != null && filters.companyId > 0) {
      params.set('companyId', String(filters.companyId))
    }
    if (filters?.branchId != null && filters.branchId > 0) {
      params.set('branchId', String(filters.branchId))
    }
    const query = params.toString()
    const path =
      customPath ||
      `products/get/${code || '_'}/${name || '_'}${query ? `?${query}` : ''}`
    return ConfigurationAPIs.get(path)
  },


  ///////////////////////////////////ENTRADAS////////////////////////////////////////////////////

  cresteTickets: async (data: any, customPath?: string) => {
    const path = customPath || 'tickets/create';
    return ConfigurationAPIs.post(path, data);
  },

  getTickets: async (
    data: { companyId?: number; branchId?: number },
    customPath?: string,
  ) => {
    const params = new URLSearchParams();
    if (data.companyId != null && data.companyId > 0) {
      params.set('companyId', String(data.companyId));
    }
    if (data.branchId != null && data.branchId > 0) {
      params.set('branchId', String(data.branchId));
    }
    const query = params.toString();
    const path = customPath || `tickets/get${query ? `?${query}` : ''}`;
    return ConfigurationAPIs.get(path);
  },

  deleteTicket: async (id: string | number, customPath?: string) => {
    const path = customPath || `tickets/${id}`;
    return ConfigurationAPIs.delete(path);
  },

  getTicketById: async (id: string | number, customPath?: string) => {
    const path = customPath || `tickets/${id}`;
    return ConfigurationAPIs.get(path);
  },

  updateTicket: async (id: string | number, data: any, customPath?: string) => {
    const path = customPath || `tickets/${id}`;
    return ConfigurationAPIs.patch(path, data);
  },

  ///////////////////////////////////VENTAS////////////////////////////////////////////////////

  createSale: async (data: any, customPath?: string) => {
    const path = customPath || 'sales/create';
    return ConfigurationAPIs.post(path, data);
  },

  getSales: async (
    data: {
      companyId?: number;
      branchId?: number;
      source?: string;
      deliveryType?: string;
      customerOrderStatus?: string;
    },
    customPath?: string,
  ) => {
    const params = new URLSearchParams();
    if (data.companyId != null && data.companyId > 0) {
      params.set('companyId', String(data.companyId));
    }
    if (data.branchId != null && data.branchId > 0) {
      params.set('branchId', String(data.branchId));
    }
    if (data.source) {
      params.set('source', data.source);
    }
    if (data.deliveryType) {
      params.set('deliveryType', data.deliveryType);
    }
    if (data.customerOrderStatus) {
      params.set('customerOrderStatus', data.customerOrderStatus);
    }
    const query = params.toString();
    const path = customPath || `sales/get${query ? `?${query}` : ''}`;
    return ConfigurationAPIs.get(path);
  },

  updateSaleFulfillment: async (
    saleId: number,
    data: {
      customerOrderStatus?: string;
      status?: string;
      assignedDriverId?: number | null;
    },
  ) => {
    return ConfigurationAPIs.patch(`orders/${saleId}/fulfillment`, data);
  },

  getInventory: async (filters?: {
    companyId?: number;
    branchId?: number;
    storeId?: number;
    status?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.companyId != null && filters.companyId > 0) {
      params.set('companyId', String(filters.companyId));
    }
    if (filters?.branchId != null && filters.branchId > 0) {
      params.set('branchId', String(filters.branchId));
    }
    if (filters?.storeId != null && filters.storeId > 0) {
      params.set('storeId', String(filters.storeId));
    }
    if (filters?.status) {
      params.set('status', filters.status);
    }
    const query = params.toString();
    return ConfigurationAPIs.get(`inventory${query ? `?${query}` : ''}`);
  },

  getItemStock: async (itemId: number, storeId?: number) => {
    const params = storeId != null && storeId > 0 ? `?storeId=${storeId}` : '';
    return ConfigurationAPIs.get(`inventory/item/${itemId}${params}`);
  },

  getItemStockByStores: async (itemId: number) => {
    return ConfigurationAPIs.get(`inventory/item/${itemId}/stores`);
  },

  ///////////////////////////////////DASHBOARD////////////////////////////////////////////////////

  getDashboard: async (filters: {
    companyId: number;
    branchId?: number;
    storeId?: number;
    year?: number;
    month?: number;
  }) => {
    const params = new URLSearchParams();
    params.set('companyId', String(filters.companyId));
    if (filters.branchId != null && filters.branchId > 0) {
      params.set('branchId', String(filters.branchId));
    }
    if (filters.storeId != null && filters.storeId > 0) {
      params.set('storeId', String(filters.storeId));
    }
    if (filters.year != null) params.set('year', String(filters.year));
    if (filters.month != null) params.set('month', String(filters.month));
    return ConfigurationAPIs.get(`dashboard/get?${params.toString()}`);
  },

  getDashboardGanancia: async (filters: {
    companyId: number;
    branchId?: number;
    year?: number;
    month?: number;
  }) => {
    const params = new URLSearchParams();
    params.set('companyId', String(filters.companyId));
    if (filters.branchId != null && filters.branchId > 0) {
      params.set('branchId', String(filters.branchId));
    }
    if (filters.year != null) params.set('year', String(filters.year));
    if (filters.month != null) params.set('month', String(filters.month));
    return ConfigurationAPIs.get(`dashboard/ganancia-mensual?${params.toString()}`);
  },







  // Usuarios del sistema y personal
  getSystemUsers: async (params: {
    companyId?: number
    branchId?: number
    userKind?: string
    active?: boolean
  }) => {
    const search = new URLSearchParams()
    if (params.companyId != null && params.companyId > 0) {
      search.set('companyId', String(params.companyId))
    }
    if (params.branchId != null && params.branchId > 0) {
      search.set('branchId', String(params.branchId))
    }
    if (params.userKind) search.set('userKind', params.userKind)
    if (params.active != null) search.set('active', String(params.active))
    const query = search.toString()
    return ConfigurationAPIs.get(`users/list${query ? `?${query}` : ''}`)
  },

  createStaffUser: async (data: any) => {
    return ConfigurationAPIs.post('users/staff', data)
  },

  updateSystemUser: async (id: number, data: any) => {
    return ConfigurationAPIs.patch(`users/${id}`, data)
  },

  setUserStatus: async (id: number, data: { active: boolean }) => {
    return ConfigurationAPIs.patch(`users/${id}/status`, data)
  },

  getUserPermissionOverrides: async (userId: number) => {
    return ConfigurationAPIs.get(`users/${userId}/permissions`)
  },

  getUserEffectivePermissions: async (userId: number) => {
    return ConfigurationAPIs.get(`users/${userId}/permissions/effective`)
  },

  setUserPermissionOverrides: async (userId: number, overrides: { permissionId: number; grant: boolean }[]) => {
    return ConfigurationAPIs.patch(`users/${userId}/permissions`, { overrides })
  },

  getRolesCatalog: async () => {
    return ConfigurationAPIs.get('roles')
  },

  createRole: async (data: { name: string; level: number; permissionIds?: number[] }) => {
    return ConfigurationAPIs.post('roles', data)
  },

  updateRole: async (roleId: number, data: { name?: string; level?: number; permissionIds?: number[] }) => {
    return ConfigurationAPIs.patch(`roles/${roleId}`, data)
  },

  updateRolePermissions: async (roleId: number, permissionIds: number[]) => {
    return ConfigurationAPIs.put(`roles/${roleId}/permissions`, {
      permissionIds,
    })
  },

  getRolePermissions: async (roleId: number) => {
    return ConfigurationAPIs.get(`roles/${roleId}/permissions`)
  },

  // Legacy administradores (mantener compatibilidad temporal)
  createAdministrator: async (data: any, customPath?: string) => {
    const path = customPath || 'users/staff'
    return ConfigurationAPIs.post(path, data)
  },

  getUsers: async (data: any, customPath?: string) => {
    if (customPath) {
      return ConfigurationAPIs.get(customPath)
    }

    const search = new URLSearchParams()
    if (data.companyId != null && data.companyId > 0) {
      search.set('companyId', String(data.companyId))
    }
    if (data.branchId != null && data.branchId > 0) {
      search.set('branchId', String(data.branchId))
    }
    if (data.userKind) search.set('userKind', data.userKind)
    const query = search.toString()
    return ConfigurationAPIs.get(`users/list${query ? `?${query}` : ''}`)
  },

  // Administradores
  updateStatus: async (id: any, data: any, token: any, customPath?: string) => {
    const path = customPath || `user/setState/${id}`;
    const config = {
      headers: {
        Authorization: token,
      },
      params: { ...data },
    };

    return ConfigurationAPIs.put(path, data, config);
  },

  // Administradores
  updateAdministrator: async (id: any, data: any, token: any, customPath?: string) => {
    const path = customPath || `user/updateUser/${id}`;
    const config = {
      headers: {
        Authorization: token,
      },
      params: { ...data },
    };

    return ConfigurationAPIs.put(path, data, config);
  },

  // Administradores
  searchUser: async (data: any, customPath?: string) => {
    const path = customPath || `user/searchUser/${data.email}`;
    const config = {
      headers: {
        Authorization: data.token,
      },
      params: { ...data },
    };

    return ConfigurationAPIs.get(path, config);
  },




  ///////////////////////////////////////////////////////// Categorías (API raíz + árbol) ////////////////////////////////////////////////////////
  createCategory: async (body: Record<string, unknown>, token: string, customPath?: string) => {
    const path = customPath || 'category/create';
    return ConfigurationAPIs.post(path, body, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
    });
  },

  /** Raíces con subcategories anidados. Opcional ?branchId= o ?companyId= */
  getCategoryList: async (
    branchId: number | undefined,
    tokenOrCompanyId: string | number | undefined,
    tokenOrCustomPath?: string,
    customPath?: string,
  ) => {
    // Soporte firma antigua: (branchId, token, customPath?)
    // y nueva: (branchId, companyId, token, customPath?)
    let companyId: number | undefined;
    let token: string;
    let finalCustomPath: string | undefined;

    if (typeof tokenOrCompanyId === 'string') {
      // Firma antigua: (branchId, token, customPath?)
      token = tokenOrCompanyId;
      finalCustomPath = tokenOrCustomPath;
    } else {
      // Firma nueva: (branchId, companyId, token, customPath?)
      companyId = tokenOrCompanyId;
      token = tokenOrCustomPath as string;
      finalCustomPath = customPath;
    }
    const base = finalCustomPath || 'category';
    const params = new URLSearchParams();
    if (branchId != null && !Number.isNaN(branchId) && branchId >= 1) {
      params.set('branchId', String(branchId));
    } else if (companyId != null && !Number.isNaN(companyId) && companyId >= 1) {
      params.set('companyId', String(companyId));
    }
    const query = params.toString();
    const path = query ? `${base}?${query}` : base;
    return ConfigurationAPIs.get(path, {
      headers: { Authorization: token },
    });
  },

  getCategoryOptions: async (branchId: number | undefined, token: string, customPath?: string) => {
    const base = customPath || 'category/options-categories';
    const path =
      branchId != null && !Number.isNaN(branchId)
        ? `${base}?branchId=${encodeURIComponent(String(branchId))}`
        : base;
    return ConfigurationAPIs.get(path, {
      headers: { Authorization: token },
    });
  },

  /** Filtrar familias (nivel 1) con POST - Filtros flexibles */
  filterFamilias: async (
    filters: {
      companyId?: number;
      branchId?: number;
      allowedItemType?: string;
      search?: string;
    },
    token: string,
    customPath?: string
  ) => {
    const path = customPath || 'category/get-categories-familias-filter-level-1';
    return ConfigurationAPIs.post(path, filters, {
      headers: { Authorization: token },
    });
  },

  getCategoryById: async (id: string | number, token: string, customPath?: string) => {
    const path = customPath || `category/${id}`;
    return ConfigurationAPIs.get(path, {
      headers: { Authorization: token },
    });
  },

  /** Campos parciales; no envía subcategories */
  patchCategory: async (id: string | number, body: Record<string, unknown>, token: string, customPath?: string) => {
    const path = customPath || `category/${id}`;
    return ConfigurationAPIs.patch(path, body, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
    });
  },

  deleteCategory: async (id: string | number, token: string, customPath?: string) => {
    const path = customPath || `category/${id}`;
    return ConfigurationAPIs.delete(path, {
      headers: { Authorization: token },
    });
  },

  ///////////////////////////////////////////////////////// Items (Artículos y Servicios) ////////////////////////////////////////////////////////
  getItemList: async (
    token: string,
    filters?: { companyId?: number; branchId?: number; customPath?: string },
  ) => {
    const params = new URLSearchParams()
    if (filters?.companyId != null && filters.companyId > 0) {
      params.set('companyId', String(filters.companyId))
    }
    if (filters?.branchId != null && filters.branchId > 0) {
      params.set('branchId', String(filters.branchId))
    }
    const query = params.toString()
    const path = filters?.customPath || `item${query ? `?${query}` : ''}`
    return ConfigurationAPIs.get(path, {
      headers: { Authorization: token },
    })
  },

  getItemsByCategory: async (categoryId: number, token: string) => {
    return ConfigurationAPIs.get('item/get-by-category', {
      params: { categoryId },
      headers: { Authorization: token },
    });
  },

  createItem: async (body: Record<string, unknown>, token: string, customPath?: string) => {
    const path = customPath || 'item';
    return ConfigurationAPIs.post(path, body, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
    });
  },

  getItemById: async (id: string | number, token: string, customPath?: string) => {
    const path = customPath || `item/${id}`;
    return ConfigurationAPIs.get(path, {
      headers: { Authorization: token },
    });
  },

  updateItem: async (id: string | number, body: Record<string, unknown>, token: string, customPath?: string) => {
    const path = customPath || `item/${id}`;
    return ConfigurationAPIs.patch(path, body, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
    });
  },

  getItemProductionRoute: async (id: string | number, token: string, customPath?: string) => {
    const path = customPath || `item/${id}/production-route`;
    return ConfigurationAPIs.get(path, {
      headers: { Authorization: token },
    });
  },

  setItemProductionRoute: async (
    id: string | number,
    areaIds: number[],
    token: string,
    customPath?: string,
  ) => {
    const path = customPath || `item/${id}/production-route`;
    return ConfigurationAPIs.patch(path, { areaIds }, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
    });
  },

  deleteItem: async (id: string | number, token: string, customPath?: string) => {
    const path = customPath || `item/${id}`;
    return ConfigurationAPIs.delete(path, {
      headers: { Authorization: token },
    });
  },

  ///////////////////////////////////PRODUCCIÓN////////////////////////////////////////////////////

  createProductionOrder: async (data: any, customPath?: string) => {
    const path = customPath || 'production/create';
    return ConfigurationAPIs.post(path, data);
  },

  getProductionOrders: async (
    data: {
      companyId?: number;
      branchId?: number;
      status?: string;
      areaId?: number;
      urgency?: string;
    },
    customPath?: string,
  ) => {
    const params = new URLSearchParams();
    if (data.companyId != null && data.companyId > 0) {
      params.set('companyId', String(data.companyId));
    }
    if (data.branchId != null && data.branchId > 0) {
      params.set('branchId', String(data.branchId));
    }
    if (data.status) {
      params.set('status', data.status);
    }
    if (data.areaId != null && data.areaId > 0) {
      params.set('areaId', String(data.areaId));
    }
    if (data.urgency) {
      params.set('urgency', data.urgency);
    }
    const query = params.toString();
    const path = customPath || `production/get${query ? `?${query}` : ''}`;
    return ConfigurationAPIs.get(path);
  },

  getProductionOrderById: async (id: string | number, customPath?: string) => {
    const path = customPath || `production/${id}`;
    return ConfigurationAPIs.get(path);
  },

  updateProductionOrder: async (id: string | number, data: any, customPath?: string) => {
    const path = customPath || `production/${id}`;
    return ConfigurationAPIs.patch(path, data);
  },

  assignProductionOrderArea: async (
    id: string | number,
    areaId: number | null,
    customPath?: string,
  ) => {
    const path = customPath || `production/${id}/area`;
    return ConfigurationAPIs.patch(path, { areaId: areaId ?? null });
  },

  advanceProductionOrderArea: async (id: string | number, customPath?: string) => {
    const path = customPath || `production/${id}/advance-area`;
    return ConfigurationAPIs.patch(path, {});
  },

  updateProductionOrderUrgency: async (
    id: string | number,
    urgency: string,
    customPath?: string,
  ) => {
    const path = customPath || `production/${id}/urgency`;
    return ConfigurationAPIs.patch(path, { urgency });
  },

  deleteProductionOrder: async (id: string | number, customPath?: string) => {
    const path = customPath || `production/${id}`;
    return ConfigurationAPIs.delete(path);
  },





}




export default APIs;



