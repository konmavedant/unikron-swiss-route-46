import { ChainType } from '@/types';
import { ApiException } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.unikron.xyz';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private getChainPath(chainType: ChainType): string {
    return chainType === 'evm' ? '/api/evm' : '/api/solana';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorDetails;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errorDetails = errorData;
        } catch {
          // If response is not JSON, use the status text
        }

        throw new ApiException(
          errorMessage,
          errorDetails?.code,
          response.status,
          errorDetails
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return response as T;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }

      // Network or other errors
      throw new ApiException(
        error instanceof Error ? error.message : 'Network error occurred',
        'NETWORK_ERROR'
      );
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return this.request<T>(url.pathname + url.search);
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Chain-specific helpers
  async getForChain<T>(chainType: ChainType, endpoint: string, params?: Record<string, string>): Promise<T> {
    const chainPath = this.getChainPath(chainType);
    return this.get<T>(`${chainPath}${endpoint}`, params);
  }

  async postForChain<T>(chainType: ChainType, endpoint: string, data?: any): Promise<T> {
    const chainPath = this.getChainPath(chainType);
    return this.post<T>(`${chainPath}${endpoint}`, data);
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export class for testing or custom instances
export { ApiClient };