import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { invalidateRequests } from './requestCache'

class ApiService {
  private axiosInstance: AxiosInstance;
  
//  constructor(baseURL: string = 'https://jllc-back.com/cms-01/') {
//     this.axiosInstance = axios.create({
//       baseURL,
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });
//   }

  constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000') {
    console.log('DEBUG: ApiService initialized with baseURL:', baseURL);
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // El guard global del backend (JwtAuthGuard) exige Authorization en CASI toda
    // ruta. Antes cada llamada que lo necesitaba tenía que pasarlo a mano (varias
    // no lo hacían — ej. fetchBranchActiveModules, que por eso siempre recibía 401
    // y el sidebar ocultaba todos los módulos). Con esto, cualquier llamada que no
    // mande su propio header ya sale autenticada por default.
    this.axiosInstance.interceptors.request.use((config) => {
      // Cualquier escritura (crear/editar/borrar) puede cambiar empresas, sucursales, módulos o permisos: se vacía el
      // caché corto de lecturas compartidas para que la siguiente lectura traiga lo nuevo.
      if (config.method && config.method.toLowerCase() !== 'get') invalidateRequests()
      if (!config.headers?.Authorization) {
        const token = localStorage.getItem('token-fixora');
        if (token) {
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error?.response?.data?.message || error?.message || 'Error de red';
        return Promise.reject({ message });
      },
    );
  }


  private async request<T>(
    method: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig // Añadir este argumento
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.request({
      method,
      url,
      data,
      ...config, // Añadir configuraciones adicionales
    });
    return response.data;
  }

  public get<T = any>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const url = `/${path}`;
    return this.request<T>('GET', url, undefined, config);
  }

  public post<T = any>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const url = `/${path}`;
    return this.request<T>('POST', url, data, config);
  }
  
  public put<T = any>(path: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    const url = `/${path}`;
    return this.request<T>('PUT', url, data, config);
  }

  public patch<T = any>(path: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    const url = `/${path}`;
    return this.request<T>('PATCH', url, data, config);
  }

  public delete<T = any>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const url = `/${path}`;
    return this.request<T>('DELETE', url, undefined, config);
  }
}

export default new ApiService();
