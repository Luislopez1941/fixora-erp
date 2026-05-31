import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

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
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
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

  public get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const url = `/${path}`;
    return this.request<T>('GET', url, undefined, config);
  }

  public post<T>(path: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    const url = `/${path}`;
    return this.request<T>('POST', url, data, config);
  }
  
  public put<T>(path: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    const url = `/${path}`;
    return this.request<T>('PUT', url, data, config);
  }

  public patch<T>(path: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    const url = `/${path}`;
    return this.request<T>('PATCH', url, data, config);
  }

  public delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const url = `/${path}`;
    return this.request<T>('DELETE', url, undefined, config);
  }
}

export default new ApiService();
