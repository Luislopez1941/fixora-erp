import ConfigurationAPIs from './configurationAPIs';

const APIs = {
  login: async (data: any, customPath?: string) => {
    const path = customPath || 'auth/login';
    return ConfigurationAPIs.post(path, data);
  },

  createUser: async (data: any, customPath?: string) => {
    const path = customPath || 'users/create';
    return ConfigurationAPIs.post(path, data);
  },

  ///////////////////////////////////ONBOARDING////////////////////////////////////////////////////

  getAvailableGiros: async (customPath?: string) => {
    const path = customPath || 'onboarding/giros';
    return ConfigurationAPIs.get(path);
  },

  completeOnboarding: async (data: any, customPath?: string) => {
    const path = customPath || 'onboarding/complete';
    return ConfigurationAPIs.post(path, data);
  },

  ///////////////////////////////////LICENCIA////////////////////////////////////////////////////

  activateLicense: async (licenseKey: string, _token: string) => {
    return ConfigurationAPIs.post('licensing/activate-license', { licenseKey });
  },

  activateModule: async (data: { branchId: number; moduleId: string }, customPath?: string) => {
    const path = customPath || 'licensing/activate-module';
    return ConfigurationAPIs.post(path, data);
  },




  ///////////////////////////////////GIROS////////////////////////////////////////////////////

  getBusinessTypes: async (customPath?: string, token?: string) => {
    const path = customPath || 'business-types/get-active';
    return ConfigurationAPIs.get(path, token ? { headers: { Authorization: token } } : undefined);
  },

  ///////////////////////////////////COMPANIES////////////////////////////////////////////////////

  getCompaniesByUser: async (userId: number, customPath?: string) => {
    const path = customPath || `companies/get-by-user/${userId}`;
    return ConfigurationAPIs.get(path);
  },

  createCompanies: async (data: any, customPath?: string) => {
    const path = customPath || 'companies/create';
    return ConfigurationAPIs.post(path, data);
  },



  // Lista de empresas DEL USUARIO (id = id de usuario). Antes pegaba a companies/get/:id,
  // que ahora devuelve UNA empresa por su id, y las pantallas que esperan una lista
  // (selectores de empresa, Empresas, Grupos, Áreas…) se quedaban vacías.
  getCompanies: async (userId: number, customPath?: string, token?: string) => {
    const path = customPath || `companies/get-by-user/${userId}`;
    return ConfigurationAPIs.get(path, token ? { headers: { Authorization: token } } : undefined);
  },

  // Una sola empresa por su id.
  getCompanyById: async (companyId: number, customPath?: string) => {
    const path = customPath || `companies/get/${companyId}`;
    return ConfigurationAPIs.get(path);
  },



  ///////////////////////////////////EMPRESAS////////////////////////////////////////////////////

  createCompany: async (data: any, customPath?: string) => {
    const path = customPath || 'companies/create';
    return ConfigurationAPIs.post(path, data);
  },

  updateCompany: async (id: number, data: any, customPath?: string) => {
    const path = customPath || `companies/${id}`;
    return ConfigurationAPIs.patch(path, data);
  },

  ///////////////////////////////////SUCURSALES////////////////////////////////////////////////////

  getBranchOffices: async (companyId: number, userId: number, customPath?: string) => {
    const path = customPath || `branch/get/${companyId}/${userId}`;
    return ConfigurationAPIs.get(path);
  },

  createBranch: async (data: any, customPath?: string) => {
    const path = customPath || 'branch/create';
    return ConfigurationAPIs.post(path, data);
  },

  deleteBranch: async (id: number, customPath?: string) => {
    const path = customPath || `branch/${id}`;
    return ConfigurationAPIs.delete(path);
  },

  updateBranch: async (id: number, data: any, customPath?: string) => {
    const path = customPath || `branch/${id}`;
    return ConfigurationAPIs.patch(path, data);
  },

  getBranch: async (data: any, customPath?: string, token?: string) => {
    const path = customPath || `branch/get/${data.companyId}/${data.userId}`;
    return ConfigurationAPIs.get(path, token ? { headers: { Authorization: token } } : undefined);
  },

    ///////////////////////////////////SERIES////////////////////////////////////////////////////

    getSeriesXUser: async ({ id, tipo_ducumento }: { id: number, tipo_ducumento: number }, customPath?: string) => {
      const path = customPath || `series/get?userId=${id}&tipo_documento=${tipo_ducumento}`;
      return ConfigurationAPIs.get(path);
    },

    createSeries: async (data: any, customPath?: string) => {
      const path = customPath || 'series/create';
      return ConfigurationAPIs.post(path, data);
    },
  
    updateSeries: async (id: number, data: any, customPath?: string) => {
      const path = customPath || `series/${id}`;
      return ConfigurationAPIs.patch(path, data);
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
          typeId?: number;
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
        if (filters?.typeId != null && filters.typeId > 0) {
          params.set('typeId', String(filters.typeId));
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

      // Catálogo de tipos de área — propio de cada empresa (ya no es una lista fija).
      // branchId opcional: filtra a los visibles para esa sucursal (los de toda
      // la empresa + los propios de esa sucursal); sin branchId trae todos.
      getAreaTypes: async (companyId: number, branchId?: number) => {
        const query = branchId != null && branchId > 0 ? `&branchId=${branchId}` : ''
        return ConfigurationAPIs.get(`area-types?companyId=${companyId}${query}`)
      },

      createAreaType: async (data: { companyId: number; branchId?: number; label: string; description?: string; color?: string; isProduction?: boolean }) => {
        return ConfigurationAPIs.post('area-types', data)
      },

      updateAreaType: async (id: number, data: { branchId?: number | null; label?: string; description?: string | null; isProduction?: boolean }) => {
        return ConfigurationAPIs.patch(`area-types/${id}`, data)
      },

      deleteAreaType: async (id: number) => {
        return ConfigurationAPIs.delete(`area-types/${id}`);
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

  createWarehouses: async (data: any, customPath?: string) => {
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

  createUnits: async (data: any, customPath?: string) => {
    const path = customPath || 'units/create';
    return ConfigurationAPIs.post(path, data);
  },

  getUnits: async (data: { companyId?: number; branchId?: number } = {}, customPath?: string) => {
    const params = new URLSearchParams();
    if (data.companyId != null) params.set('companyId', String(data.companyId));
    if (data.branchId != null && data.branchId > 0) params.set('branchId', String(data.branchId));
    const query = params.toString();
    const path = customPath || `units/get-by-company-and-branch${query ? `?${query}` : ''}`;
    return ConfigurationAPIs.get(path);
  },

  getUnitOptions: async (
    data: { companyId?: number; branchId?: number; branchIds?: number[] },
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
    // Solo unidades disponibles en TODAS estas sucursales
    if (data.branchIds?.length) {
      params.set('branchIds', data.branchIds.join(','));
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


  ///////////////////////////////////////////////////////// Administrador ////////////////////////////////////////////////////////

  runMigration: async () => {
    return ConfigurationAPIs.post('migration/run');
  },

  ///////////////////////////////////PRODUCTO////////////////////////////////////////////////////

  createProducts: async (data: any, customPath?: string) => {
    const path = customPath || 'products/create';
    return ConfigurationAPIs.post(path, data);
  },
  // Búsqueda rápida de la ficha de venta: una sola consulta en el servidor, solo lo que pinta la lista
  searchProducts: async (
    mode: 'code' | 'name',
    q: string,
    filters: { companyId?: number; branchId?: number; storeId?: number },
    signal?: AbortSignal,
  ) => {
    const params = new URLSearchParams({ mode, q })
    if (filters.companyId != null && filters.companyId > 0) params.set('companyId', String(filters.companyId))
    if (filters.branchId != null && filters.branchId > 0) params.set('branchId', String(filters.branchId))
    if (filters.storeId != null && filters.storeId > 0) params.set('storeId', String(filters.storeId))
    return ConfigurationAPIs.get(`products/search?${params.toString()}`, { signal })
  },
  // Artículo completo (variaciones, rangos, existencias por almacén) del resultado elegido
  getProductForSale: async (id: number, filters: { branchId?: number; storeId?: number }) => {
    const params = new URLSearchParams()
    if (filters.branchId != null && filters.branchId > 0) params.set('branchId', String(filters.branchId))
    if (filters.storeId != null && filters.storeId > 0) params.set('storeId', String(filters.storeId))
    const query = params.toString()
    return ConfigurationAPIs.get(`products/sale/${id}${query ? `?${query}` : ''}`)
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


  ///////////////////////////////////COTIZACIONES////////////////////////////////////////////////////

  getCustomers: async (companyId: number, branchId?: number, customPath?: string) => {
    const path = customPath || `customers?companyId=${companyId}${branchId ? `&branchId=${branchId}` : ''}`;
    return ConfigurationAPIs.get(path);
  },

  createCustomer: async (data: any, customPath?: string) => {
    const path = customPath || 'customers/create';
    return ConfigurationAPIs.post(path, data);
  },

  updateCustomer: async (id: number, data: any, customPath?: string) => {
    const path = customPath || `customers/${id}`;
    return ConfigurationAPIs.patch(path, data);
  },

  deleteCustomer: async (id: number, customPath?: string) => {
    const path = customPath || `customers/${id}`;
    return ConfigurationAPIs.delete(path);
  },

  createQuotation: async (data: any, customPath?: string) => {
    const path = customPath || 'quotations/create';
    return ConfigurationAPIs.post(path, data);
  },

  updateQuotation: async (id: number, data: any, customPath?: string) => {
    const path = customPath || `quotations/${id}`;
    return ConfigurationAPIs.patch(path, data);
  },

  deleteQuotation: async (id: number, customPath?: string) => {
    const path = customPath || `quotations/${id}`;
    return ConfigurationAPIs.delete(path);
  },

  getQuotationById: async (id: number, customPath?: string) => {
    const path = customPath || `quotations/${id}`;
    return ConfigurationAPIs.get(path);
  },

  updateQuotationStatus: async (id: number, status: string, customPath?: string) => {
    const path = customPath || `quotations/${id}/status`;
    return ConfigurationAPIs.patch(path, { status });
  },

  getQuotations: async (
    data: {
      companyId?: number;
      branchId?: number;
      status?: string;
      page?: number;
      folio?: string;
      desde?: string;
      hasta?: string;
    },
    customPath?: string,
  ) => {
    const params = new URLSearchParams();
    if (data.companyId != null && data.companyId > 0) params.set('companyId', String(data.companyId));
    if (data.branchId != null && data.branchId > 0) params.set('branchId', String(data.branchId));
    if (data.status != null) params.set('status', String(data.status));
    if (data.page != null) params.set('page', String(data.page));
    if (data.folio) params.set('folio', data.folio);
    if (data.desde) params.set('desde', data.desde);
    if (data.hasta) params.set('hasta', data.hasta);
    const query = params.toString();
    const path = customPath || `quotations/get${query ? `?${query}` : ''}`;
    return ConfigurationAPIs.get(path);
  },

  ///////////////////////////////////ORDENES DE VENTA////////////////////////////////////////////////////

  createSalesOrder: async (data: any, customPath?: string) => {
    const path = customPath || 'sales-orders/create';
    return ConfigurationAPIs.post(path, data);
  },

  createSalesOrderFromQuotation: async (quotationId: number, customPath?: string) => {
    const path = customPath || `sales-orders/from-quotation/${quotationId}`;
    return ConfigurationAPIs.post(path, {});
  },

  updateSalesOrder: async (id: number, data: any, customPath?: string) => {
    const path = customPath || `sales-orders/${id}`;
    return ConfigurationAPIs.patch(path, data);
  },

  deleteSalesOrder: async (id: number, customPath?: string) => {
    const path = customPath || `sales-orders/${id}`;
    return ConfigurationAPIs.delete(path);
  },

  getSalesOrderById: async (id: number, customPath?: string) => {
    const path = customPath || `sales-orders/${id}`;
    return ConfigurationAPIs.get(path);
  },

  updateSalesOrderStatus: async (id: number, status: string, customPath?: string) => {
    const path = customPath || `sales-orders/${id}/status`;
    return ConfigurationAPIs.patch(path, { status });
  },

  updateSalesOrderItemDelivery: async (itemId: number, deliveredQuantity: number, customPath?: string) => {
    const path = customPath || `sales-orders/items/${itemId}/delivery`;
    return ConfigurationAPIs.patch(path, { deliveredQuantity });
  },

  getSalesOrders: async (
    data: {
      companyId?: number;
      branchId?: number;
      status?: string;
      page?: number;
      folio?: string;
      desde?: string;
      hasta?: string;
    },
    customPath?: string,
  ) => {
    const params = new URLSearchParams();
    if (data.companyId != null && data.companyId > 0) params.set('companyId', String(data.companyId));
    if (data.branchId != null && data.branchId > 0) params.set('branchId', String(data.branchId));
    if (data.status != null) params.set('status', String(data.status));
    if (data.page != null) params.set('page', String(data.page));
    if (data.folio) params.set('folio', data.folio);
    if (data.desde) params.set('desde', data.desde);
    if (data.hasta) params.set('hasta', data.hasta);
    const query = params.toString();
    const path = customPath || `sales-orders/get${query ? `?${query}` : ''}`;
    return ConfigurationAPIs.get(path);
  },

  ///////////////////////////////////ORDENES DE COMPRA////////////////////////////////////////////////////

  createPurchaseOrder: async (data: any, customPath?: string) => {
    const path = customPath || 'purchase-orders/create';
    return ConfigurationAPIs.post(path, data);
  },

  updatePurchaseOrder: async (id: number, data: any, customPath?: string) => {
    const path = customPath || `purchase-orders/${id}`;
    return ConfigurationAPIs.patch(path, data);
  },

  deletePurchaseOrder: async (id: number, customPath?: string) => {
    const path = customPath || `purchase-orders/${id}`;
    return ConfigurationAPIs.delete(path);
  },

  getPurchaseOrderById: async (id: number, customPath?: string) => {
    const path = customPath || `purchase-orders/${id}`;
    return ConfigurationAPIs.get(path);
  },

  updatePurchaseOrderStatus: async (id: number, status: string, customPath?: string) => {
    const path = customPath || `purchase-orders/${id}/status`;
    return ConfigurationAPIs.patch(path, { status });
  },

  getPurchaseOrders: async (
    data: {
      companyId?: number;
      branchId?: number;
      serieId?: number;
      status?: string | number;
      page?: number;
      folio?: string;
      tipo?: number;
      desde?: string;
      hasta?: string;
    },
    customPath?: string,
  ) => {
    const params = new URLSearchParams();
    if (data.companyId != null && data.companyId > 0) params.set('companyId', String(data.companyId));
    if (data.branchId != null && data.branchId > 0) params.set('branchId', String(data.branchId));
    if (data.serieId != null && data.serieId > 0) params.set('serieId', String(data.serieId));
    if (data.status != null) params.set('status', String(data.status));
    if (data.page != null) params.set('page', String(data.page));
    if (data.folio) params.set('folio', data.folio);
    if (data.tipo != null) params.set('tipo', String(data.tipo));
    if (data.desde) params.set('desde', data.desde);
    if (data.hasta) params.set('hasta', data.hasta);

    const query = params.toString();
    const path = customPath || `purchase-orders/get${query ? `?${query}` : ''}`;
    return ConfigurationAPIs.get(path);
  },

  getSuppliers: async (
    data: { id_usuario: number; is_flete?: boolean; companyId?: number },
    customPath?: string,
  ) => {
    const params = new URLSearchParams();
    params.set('id_usuario', String(data.id_usuario));
    if (data.is_flete !== undefined) params.set('is_flete', String(data.is_flete));
    if (data.companyId) params.set('companyId', String(data.companyId));

    const query = params.toString();
    const path = customPath || `suppliers/get${query ? `?${query}` : ''}`;
    return ConfigurationAPIs.get(path);
  },

  // Lotes y caducidades
  getExpirations: async (params: { companyId: number; branchId?: number; storeId?: number; status?: string; search?: string; page?: number; pageSize?: number }) => {
    const search = new URLSearchParams({ companyId: String(params.companyId) })
    if (params.branchId && params.branchId > 0) search.set('branchId', String(params.branchId))
    if (params.storeId && params.storeId > 0) search.set('storeId', String(params.storeId))
    if (params.status) search.set('status', params.status)
    if (params.search?.trim()) search.set('search', params.search.trim())
    if (params.page) search.set('page', String(params.page))
    if (params.pageSize) search.set('pageSize', String(params.pageSize))
    return ConfigurationAPIs.get(`lots/expirations?${search.toString()}`)
  },
  writeOffLot: async (id: string, data: { quantity?: number; reason: string }) => ConfigurationAPIs.post(`lots/${id}/write-off`, data),

  // Contabilidad (catálogo de cuentas, periodos, pólizas/asientos, balanza)
  getAccounts: async (companyId: number) => ConfigurationAPIs.get(`accounting/accounts?companyId=${companyId}`),
  createAccount: async (data: any) => ConfigurationAPIs.post('accounting/accounts', data),
  updateAccount: async (id: string, data: any) => ConfigurationAPIs.patch(`accounting/accounts/${id}`, data),
  getAccountingPeriods: async (companyId: number) => ConfigurationAPIs.get(`accounting/periods?companyId=${companyId}`),
  closeAccountingPeriod: async (data: { companyId: number; year: number; month: number }) => ConfigurationAPIs.post('accounting/periods/close', data),
  reopenAccountingPeriod: async (data: { companyId: number; year: number; month: number }) => ConfigurationAPIs.post('accounting/periods/reopen', data),
  getJournalEntries: async (companyId: number, range?: { from?: string; to?: string }) => {
    const search = new URLSearchParams({ companyId: String(companyId) });
    if (range?.from) search.set('from', range.from);
    if (range?.to) search.set('to', range.to);
    return ConfigurationAPIs.get(`accounting/entries?${search.toString()}`);
  },
  getJournalEntry: async (id: string) => ConfigurationAPIs.get(`accounting/entries/${id}`),
  postJournalEntry: async (data: any) => ConfigurationAPIs.post('accounting/entries', data),
  reverseJournalEntry: async (id: string, data: { reason: string; entryDate?: string }) => ConfigurationAPIs.post(`accounting/entries/${id}/reverse`, data),
  getTrialBalance: async (companyId: number, from: string, to: string) =>
    ConfigurationAPIs.get(`accounting/trial-balance?companyId=${companyId}&from=${from}&to=${to}`),

  // Catálogo de proveedores
  getSuppliersCatalog: async (companyId: number, customPath?: string) => {
    const path = customPath || `suppliers?companyId=${companyId}`;
    return ConfigurationAPIs.get(path);
  },
  createSupplier: async (data: any, customPath?: string) => {
    const path = customPath || 'suppliers/create';
    return ConfigurationAPIs.post(path, data);
  },
  updateSupplier: async (id: number, data: any, customPath?: string) => {
    const path = customPath || `suppliers/${id}`;
    return ConfigurationAPIs.patch(path, data);
  },
  deleteSupplier: async (id: number, customPath?: string) => {
    const path = customPath || `suppliers/${id}`;
    return ConfigurationAPIs.delete(path);
  },

  ///////////////////////////////////REQUISICIONES////////////////////////////////////////////////////

  createRequisition: async (data: any, customPath?: string) => {
    const path = customPath || 'requisitions/create';
    return ConfigurationAPIs.post(path, data);
  },

  getMyRequisitions: async (customPath?: string, token?: string) => {
    const path = customPath || 'requisitions/my';
    return ConfigurationAPIs.get(path, token ? { headers: { Authorization: token } } : undefined);
  },

  getRequisitionById: async (id: number, customPath?: string) => {
    const path = customPath || `requisitions/${id}`;
    return ConfigurationAPIs.get(path);
  },

  updateRequisitionStatus: async (id: number, status: string, customPath?: string) => {
    const path = customPath || `requisitions/${id}/status`;
    return ConfigurationAPIs.patch(path, { status });
  },

  updateRequisitionItemDelivery: async (itemId: number, deliveredQuantity: number, customPath?: string) => {
    const path = customPath || `requisitions/items/${itemId}/delivery`;
    return ConfigurationAPIs.patch(path, { deliveredQuantity });
  },

  ///////////////////////////////////ENTRADAS////////////////////////////////////////////////////

  createTickets: async (data: any, customPath?: string) => {
    const path = customPath || 'tickets/create';
    return ConfigurationAPIs.post(path, data);
  },

  getRequisitions: async (
    data: {
      companyId?: number;
      branchId?: number;
      userId?: number;
      status?: string;
      page?: number;
      folio?: string;
      tipo?: number;
      desde?: string;
      hasta?: string;
      id_serie?: number;
      id_area?: number;
      id_area_type?: number;
    },
    config?: any,
    customPath?: string,
  ) => {
    const params = new URLSearchParams();
    if (data.companyId != null && data.companyId > 0) {
      params.set('companyId', String(data.companyId));
    }
    if (data.branchId != null && data.branchId > 0) {
      params.set('branchId', String(data.branchId));
    }
    if (data.userId != null && data.userId > 0) {
      params.set('userId', String(data.userId));
    }
    if (data.status != null) {
      params.set('status', String(data.status));
    }
    if (data.page != null) {
      params.set('page', String(data.page));
    }
    if (data.folio) {
      params.set('folio', data.folio);
    }
    if (data.tipo != null) {
      params.set('tipo', String(data.tipo));
    }
    if (data.desde) {
      params.set('desde', data.desde);
    }
    if (data.hasta) {
      params.set('hasta', data.hasta);
    }
    if (data.id_serie != null && data.id_serie > 0) {
      params.set('serieId', String(data.id_serie));
    }
    if (data.id_area != null && data.id_area > 0) {
      params.set('areaId', String(data.id_area));
    }
    if (data.id_area_type != null && data.id_area_type > 0) {
      params.set('areaTypeId', String(data.id_area_type));
    }
    const query = params.toString();
    const path = customPath || `requisitions${query ? `?${query}` : ''}`;
    return ConfigurationAPIs.get(path, config);
  },

  getTicketById: async (id: string | number, customPath?: string) => {
    const path = customPath || `tickets/${id}`;
    return ConfigurationAPIs.get(path);
  },

  deleteTicket: async (id: string | number, customPath?: string) => {
    const path = customPath || `tickets/${id}`;
    return ConfigurationAPIs.delete(path);
  },

  getTickets: async (
    data: {
      companyId?: number;
      branchId?: number;
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
    const query = params.toString();
    const path = customPath || `tickets/get${query ? `?${query}` : ''}`;
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

  // Cancelaciones y devoluciones de ventas
  getSaleReturnsOverview: async (saleId: number) => {
    return ConfigurationAPIs.get(`sales/${saleId}/returns`);
  },
  createSaleReturn: async (saleId: number, data: any) => {
    return ConfigurationAPIs.post(`sales/${saleId}/returns`, data);
  },
  cancelSale: async (saleId: number, data: { reason: string; notes?: string; idempotencyKey?: string }) => {
    return ConfigurationAPIs.patch(`sales/${saleId}/cancel`, data);
  },
  getSaleReturnConfig: async (companyId: number) => {
    return ConfigurationAPIs.get(`sales/returns/config?companyId=${companyId}`);
  },
  updateSaleReturnConfig: async (companyId: number, data: { returnWindowDays?: number; returnSupervisorAmount?: number | null }) => {
    return ConfigurationAPIs.put(`sales/returns/config?companyId=${companyId}`, data);
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
    /** Con page el servidor entrega solo esa página: { data, summary, pagination } */
    page?: number;
    pageSize?: number;
    search?: string;
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
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));
    if (filters?.search?.trim()) params.set('search', filters.search.trim());
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

  getUserById: async (id: number | string) => {
    return ConfigurationAPIs.get(`users/${id}`)
  },

  getUserPermissionOverrides: async (userId: number) => {
    return ConfigurationAPIs.get(`users/${userId}/permissions`)
  },

  getUserEffectivePermissions: async (userId: number) => {
    return ConfigurationAPIs.get(`users/${userId}/permissions/effective`)
  },

  getLicenseStatus: async () => {
    return ConfigurationAPIs.get('licensing/status')
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

  // Grupos de visibilidad de usuarios (quién puede ver a quién en el panel de Usuarios)
  getUserGroups: async (companyId: number) => {
    return ConfigurationAPIs.get(`user-groups?companyId=${companyId}`)
  },

  createUserGroup: async (data: { name: string; companyId: number; managerIds?: number[]; memberIds?: number[] }) => {
    return ConfigurationAPIs.post('user-groups', data)
  },

  updateUserGroup: async (id: number, data: { name?: string; managerIds?: number[]; memberIds?: number[] }) => {
    return ConfigurationAPIs.patch(`user-groups/${id}`, data)
  },

  deleteUserGroup: async (id: number) => {
    return ConfigurationAPIs.delete(`user-groups/${id}`)
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

  // --- CASH MODULE ---
  getCurrentCashShift: async (branchId: number, customPath?: string) => {
    const path = customPath || `cash/current?branchId=${branchId}`;
    return ConfigurationAPIs.get(path);
  },

  getActiveCashShifts: async (branchId: number, customPath?: string) => {
    const path = customPath || `cash/active?branchId=${branchId}`;
    return ConfigurationAPIs.get(path);
  },

  openCashShift: async (data: any, customPath?: string) => {
    const path = customPath || 'cash/open';
    return ConfigurationAPIs.post(path, data);
  },

  getCashShiftHistory: async (branchId: number, page: number, customPath?: string) => {
    const path = customPath || `cash/history?branchId=${branchId}&page=${page}`;
    return ConfigurationAPIs.get(path);
  },

  // Reporte de corte de un turno: fondo, ventas por método de pago, movimientos, esperado y diferencia
  getCashShiftReport: async (shiftId: number, customPath?: string) => {
    const path = customPath || `cash/report/${shiftId}`;
    return ConfigurationAPIs.get(path);
  },

  // Usuarios que pueden autorizar un cierre fuera de tolerancia
  getCashHandoverCandidates: async (shiftId: number) => {
    return ConfigurationAPIs.get(`cash/handover-candidates/${shiftId}`);
  },

  handoverCashShift: async (shiftId: number, userId: number) => {
    return ConfigurationAPIs.patch(`cash/handover/${shiftId}`, { userId });
  },

  getCashCurrentAssignment: async (branchId: number, userId?: number) => {
    return ConfigurationAPIs.get(`cash/assignment/current?branchId=${branchId}${userId ? `&userId=${userId}` : ''}`);
  },

  getCashSellStatus: async (branchId: number) => {
    return ConfigurationAPIs.get(`cash/sell-status?branchId=${branchId}`);
  },

  getCashAlerts: async (branchId: number) => {
    return ConfigurationAPIs.get(`cash/alerts?branchId=${branchId}`);
  },

  getLocalSyncStatus: async () => {
    return ConfigurationAPIs.get('local-sync/status');
  },

  listLocalSyncLinks: async () => {
    return ConfigurationAPIs.get('local-sync/links');
  },

  createLocalSyncLink: async (name: string, branchIds: number[] = []) => {
    return ConfigurationAPIs.post('local-sync/links', { name, branchIds });
  },

  revokeLocalSyncLink: async (id: number) => {
    return ConfigurationAPIs.delete(`local-sync/links/${id}`);
  },

  linkLocalSync: async (data: { cloudUrl: string; token: string; mode: 'replace' | 'merge' }) => {
    return ConfigurationAPIs.post('local-sync/link', data);
  },

  pullLocalSync: async (mode: 'replace' | 'merge') => {
    return ConfigurationAPIs.post('local-sync/pull', { mode });
  },

  unlinkLocalSync: async () => {
    return ConfigurationAPIs.delete('local-sync/link');
  },

  getCashRegisters: async (branchId: number) => {
    return ConfigurationAPIs.get(`cash/registers?branchId=${branchId}`);
  },

  createCashRegister: async (branchId: number, data: any) => {
    return ConfigurationAPIs.post(`cash/registers?branchId=${branchId}`, data);
  },

  updateCashRegister: async (id: number, data: any) => {
    return ConfigurationAPIs.patch(`cash/registers/${id}`, data);
  },

  deleteCashRegister: async (id: number) => {
    return ConfigurationAPIs.delete(`cash/registers/${id}`);
  },

  getCashSchedules: async (branchId: number) => {
    return ConfigurationAPIs.get(`cash/schedules?branchId=${branchId}`);
  },

  createCashSchedule: async (branchId: number, data: any) => {
    return ConfigurationAPIs.post(`cash/schedules?branchId=${branchId}`, data);
  },

  updateCashSchedule: async (id: number, data: any) => {
    return ConfigurationAPIs.patch(`cash/schedules/${id}`, data);
  },

  deleteCashSchedule: async (id: number) => {
    return ConfigurationAPIs.delete(`cash/schedules/${id}`);
  },

  getCashAssignableUsers: async (branchId: number) => {
    return ConfigurationAPIs.get(`cash/assignable-users?branchId=${branchId}`);
  },

  updateCashShift: async (shiftId: number, data: { openingAmount?: number; registerId?: number | null; scheduleId?: number | null }) => {
    return ConfigurationAPIs.patch(`cash/shifts/${shiftId}`, data);
  },

  deleteCashShift: async (shiftId: number) => {
    return ConfigurationAPIs.delete(`cash/shifts/${shiftId}`);
  },

  getCashSupervisors: async (customPath?: string) => {
    const path = customPath || 'cash/supervisors';
    return ConfigurationAPIs.get(path);
  },

  addCashMovement: async (data: any, customPath?: string) => {
    const path = customPath || 'cash/movement';
    return ConfigurationAPIs.post(path, data);
  },

  closeCashShift: async (id: number, data: any, customPath?: string) => {
    const path = customPath || `cash/close/${id}`;
    return ConfigurationAPIs.patch(path, data);
  },

  getCashConfig: async (branchId: number, customPath?: string) => {
    const path = customPath || `cash/config?branchId=${branchId}`;
    return ConfigurationAPIs.get(path);
  },

  getAuditLog: async (filters: { companyId?: number; branchId?: number; entity?: string; action?: string; from?: string; to?: string; page?: number; pageSize?: number }) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && !(typeof v === 'number' && v <= 0 && k !== 'page')) params.set(k, String(v));
    });
    return ConfigurationAPIs.get(`audit?${params.toString()}`);
  },

  getPosConfig: async (companyId: number, branchId = 0) => {
    return ConfigurationAPIs.get(`pos-config?companyId=${companyId}&branchId=${branchId}`);
  },

  updatePosConfig: async (companyId: number, branchId: number, data: any) => {
    return ConfigurationAPIs.patch(`pos-config?companyId=${companyId}&branchId=${branchId}`, data);
  },

  deletePosConfigOverride: async (companyId: number, branchId: number) => {
    return ConfigurationAPIs.delete(`pos-config?companyId=${companyId}&branchId=${branchId}`);
  },

  updateCashConfig: async (branchId: number, data: any, customPath?: string) => {
    const path = customPath || `cash/config?branchId=${branchId}`;
    return ConfigurationAPIs.patch(path, data);
  },
  // -------------------

  createCategory: async (body: Record<string, unknown>, _token: string, customPath?: string) => {
    const path = customPath || 'category/create';
    return ConfigurationAPIs.post(path, body);
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

  getCategoryOptions: async (branchId: number | undefined, _token: string, customPath?: string, branchIds?: number[]) => {
    const base = customPath || 'category/options-categories';
    const params = new URLSearchParams();
    if (branchId != null && !Number.isNaN(branchId)) params.set('branchId', String(branchId));
    // Solo categorías disponibles en TODAS estas sucursales
    if (branchIds?.length) params.set('branchIds', branchIds.join(','));
    const query = params.toString();
    return ConfigurationAPIs.get(query ? `${base}?${query}` : base);
  },

  /** Filtrar familias (nivel 1) con POST - Filtros flexibles */
  filterFamilias: async (
    filters: {
      companyId?: number;
      branchId?: number;
      branchIds?: number[];
      allowedItemType?: string;
      search?: string;
    },
    _token: string,
    customPath?: string
  ) => {
    const path = customPath || 'category/get-categories-familias-filter-level-1';
    return ConfigurationAPIs.post(path, filters);
  },

  getCategoryById: async (id: string | number, _token: string, customPath?: string) => {
    const path = customPath || `category/${id}`;
    return ConfigurationAPIs.get(path);
  },

  /** Disponibilidad de una categoría por sucursal (explícita y efectiva) */
  getCategoryAvailability: async (id: string | number) => {
    return ConfigurationAPIs.get(`category/${id}/availability`);
  },

  /** Artículos que dejarían de ofrecerse si la categoría se deshabilita en la sucursal */
  getCategoryAvailabilityImpact: async (id: string | number, branchId: number) => {
    return ConfigurationAPIs.get(`category/${id}/availability-impact?branchId=${branchId}`);
  },

  /** Artículos que dejarían de ofrecerse si la unidad se restringe y se quita esa sucursal */
  getUnitRestrictionImpact: async (id: string | number, branchId: number) => {
    return ConfigurationAPIs.get(`units/${id}/impact?branchId=${branchId}`);
  },

  /** enabled: true | false | null (null quita la excepción y vuelve a heredar) */
  setCategoryAvailability: async (id: string | number, body: { branchId: number; enabled: boolean | null }) => {
    return ConfigurationAPIs.patch(`category/${id}/availability`, body);
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
    filters?: { companyId?: number; branchId?: number; customPath?: string; page?: number; pageSize?: number; search?: string; type?: 'ARTICLE' | 'SERVICE' },
  ) => {
    const params = new URLSearchParams()
    // Con `page` el servidor responde { data, pagination } con solo esa página; sin `page` devuelve todo el catálogo
    if (filters?.page) params.set('page', String(filters.page))
    if (filters?.pageSize) params.set('pageSize', String(filters.pageSize))
    if (filters?.search?.trim()) params.set('search', filters.search.trim())
    if (filters?.type) params.set('type', filters.type)
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

  ///////////////////////////////////METODOS DE PAGO////////////////////////////////////////////////////

  getPaymentMethods: async (companyId: number, branchId?: number, customPath?: string) => {
    const params = new URLSearchParams();
    params.set('companyId', String(companyId));
    if (branchId != null && branchId > 0) {
      params.set('branchId', String(branchId));
    }
    const query = params.toString();
    const path = customPath || `payment-methods?${query}`;
    return ConfigurationAPIs.get(path);
  },

  createPaymentMethod: async (data: any, customPath?: string) => {
    const path = customPath || 'payment-methods';
    return ConfigurationAPIs.post(path, data);
  },

  updatePaymentMethod: async (id: number, data: any, customPath?: string) => {
    const path = customPath || `payment-methods/${id}`;
    return ConfigurationAPIs.put(path, data);
  },

  deletePaymentMethod: async (id: number, customPath?: string) => {
    const path = customPath || `payment-methods/${id}`;
    return ConfigurationAPIs.delete(path);
  },

  seedTenant: async (companyId: number, customPath?: string) => {
    const path = customPath || `seed/tenant/${companyId}`;
    return ConfigurationAPIs.post(path);
  },

  seedTenantByUserId: async (userId: number, customPath?: string) => {
    const path = customPath || `seed/user/${userId}`;
    return ConfigurationAPIs.post(path);
  },





}




export default APIs;



