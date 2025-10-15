/**
 * HTTP client utility for inter-service communication
 */

export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export class HttpClient {
  private config: Required<HttpClientConfig>;

  constructor(config: HttpClientConfig) {
    this.config = {
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: config.headers || {},
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
    };
  }

  private async request<T>(
    method: string,
    path: string,
    options: {
      data?: any;
      params?: Record<string, string>;
      headers?: Record<string, string>;
    } = {}
  ): Promise<HttpResponse<T>> {
    const url = new URL(path, this.config.baseURL);
    
    // Add query parameters
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          method,
          headers,
          body: options.data ? JSON.stringify(options.data) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        let data: T;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text() as any;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        };
      } catch (error: any) {
        lastError = error;

        // Don't retry on client errors (4xx)
        if (error.message.includes('HTTP 4')) {
          throw error;
        }

        // Retry on network errors or 5xx
        if (attempt < this.config.retries) {
          await this.delay(this.config.retryDelay * (attempt + 1));
          continue;
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get<T>(path: string, options?: { params?: Record<string, string>; headers?: Record<string, string> }): Promise<HttpResponse<T>> {
    return this.request<T>('GET', path, options);
  }

  async post<T>(path: string, data?: any, options?: { headers?: Record<string, string> }): Promise<HttpResponse<T>> {
    return this.request<T>('POST', path, { data, ...options });
  }

  async put<T>(path: string, data?: any, options?: { headers?: Record<string, string> }): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', path, { data, ...options });
  }

  async patch<T>(path: string, data?: any, options?: { headers?: Record<string, string> }): Promise<HttpResponse<T>> {
    return this.request<T>('PATCH', path, { data, ...options });
  }

  async delete<T>(path: string, options?: { headers?: Record<string, string> }): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', path, options);
  }

  setAuthToken(token: string): void {
    this.config.headers['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.config.headers['Authorization'];
  }
}

/**
 * Create an HTTP client instance
 */
export function createHttpClient(config: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}

