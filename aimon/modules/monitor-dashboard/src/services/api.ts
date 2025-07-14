import axios, { AxiosInstance } from 'axios';
import { store } from '@/store';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      timeout: 30000,
    });

    // Request interceptor to add auth token and base URL
    this.instance.interceptors.request.use(
      (config) => {
        const state = store.getState();
        const { apiUrl, apiKey } = state.settings;

        config.baseURL = apiUrl + '/api/v1';
        
        if (apiKey) {
          config.headers.Authorization = `Bearer ${apiKey}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          console.error('Unauthorized: Check API key');
        }
        return Promise.reject(error);
      }
    );
  }

  get = this.instance.get;
  post = this.instance.post;
  put = this.instance.put;
  delete = this.instance.delete;
  patch = this.instance.patch;
}

export const apiClient = new ApiClient();