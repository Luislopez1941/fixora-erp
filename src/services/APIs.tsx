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
    
      getAreas: async (_: any, customPath?: string) => {
        // const path = customPath || `tickets/get?companyId=${data.companyId}&branchId=${data.branchId}`;
        const path = customPath || `areas/get`;
        return ConfigurationAPIs.get(path);
      },
    
  

  ///////////////////////////////////ALMACEN////////////////////////////////////////////////////

  cresteWarehouses: async (data: any, customPath?: string) => {
    const path = customPath || 'store/create';
    return ConfigurationAPIs.post(path, data);
  },

  getWarehouses: async (data: any, customPath?: string, token?: string) => {
    const path = customPath || `store/get?companyId=${data.companyId}&branchId=${data.branchId}`;
    return ConfigurationAPIs.get(path, token ? { headers: { Authorization: token } } : undefined);
  },



  ///////////////////////////////////UNIDADES////////////////////////////////////////////////////

  cresteUnits: async (data: any, customPath?: string) => {
    const path = customPath || 'units/create';
    return ConfigurationAPIs.post(path, data);
  },

  getUnits: async (data: any, customPath?: string) => {
    const path = customPath || `units/get?companyId=${data.companyId}` + (data.branchId ? `&branchId=${data.branchId}` : '');
    return ConfigurationAPIs.get(path);
  },


  ///////////////////////////////////PRODUCTO////////////////////////////////////////////////////

  cresteProducts: async (data: any, customPath?: string) => {
    const path = customPath || 'products/create';
    return ConfigurationAPIs.post(path, data);
  },
  getProducts: async (code: string, name: string, customPath?: string) => {
    const path = customPath || `products/get/${code || '_'}/${name || '_'}`;
    console.log('URL solicitada:', path);
    return ConfigurationAPIs.get(path);
  },


  ///////////////////////////////////ENTRADAS////////////////////////////////////////////////////

  cresteTickets: async (data: any, customPath?: string) => {
    const path = customPath || 'tickets/create';
    return ConfigurationAPIs.post(path, data);
  },

  getTickets: async (data: any, customPath?: string) => {
    const path = customPath || `tickets/get?companyId=${data.companyId}&branchId=${data.branchId}`;
    return ConfigurationAPIs.get(path);
  },







  // Administradores 
  createAdministrator: async (data: any, customPath?: string) => {
    console.log(data)
    const path = customPath || 'user/create';
    const token = data.token;
    // delete data.token;
    const headers = {
      Authorization: token,
    };
    return ConfigurationAPIs.post(path, data, { headers });
  },


  // Administradores
  getUsers: async (data: any, customPath?: string) => {
    const path = customPath || `user/${data.filtro}`;
    const config = {
      headers: {
        Authorization: data.token,
      },
      params: { ...data },
    };

    return ConfigurationAPIs.get(path, config);
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

  /** Raíces con subcategories anidados. Opcional ?branchId= */
  getCategoryList: async (branchId: number | undefined, token: string, customPath?: string) => {
    const base = customPath || 'category';
    const path =
      branchId != null && !Number.isNaN(branchId)
        ? `${base}?branchId=${encodeURIComponent(String(branchId))}`
        : base;
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
  getItemList: async (token: string, customPath?: string) => {
    const path = customPath || 'item';
    return ConfigurationAPIs.get(path, {
      headers: { Authorization: token },
    });
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

  deleteItem: async (id: string | number, token: string, customPath?: string) => {
    const path = customPath || `item/${id}`;
    return ConfigurationAPIs.delete(path, {
      headers: { Authorization: token },
    });
  },





}




export default APIs;



