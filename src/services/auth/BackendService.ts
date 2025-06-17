import * as vscode from 'vscode';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { ISecureStorage } from '../../types/secureStorage';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
  user: any;
  a4f_api_key?: string;        // 🆕 A4F API key included
  api_endpoint?: string;       // 🆕 Backend endpoint
}

export interface VSCodeConfig {
  config: {
    a4f_api_key: string;
    api_endpoint: string;
    providers: {
      a4f: {
        enabled: boolean;
        base_url: string;
        models: string[];
        priority: number;
      };
    };
    model_routing: {
      popular_models_to_a4f: boolean;
      default_provider: string;
    };
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  context_length: number;
  description: string;
}

export interface ProxyResponse {
  models: ModelInfo[];
  provider_status: Record<string, string>;
  total_models: number;
}

export interface ApiKeyRequest {
  provider: string;
  api_key: string;
  name: string;
}

export interface LLMRequest {
  provider: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_tokens?: number;
  temperature?: number;
}

export class BackendService {
  private httpClient: AxiosInstance;
  private baseURL: string;

  constructor(private secureStorage: ISecureStorage) {
    this.baseURL = vscode.workspace.getConfiguration('auto-gen-code-builder')
      .get('authApiUrl', 'http://localhost:8000');

    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }
  private setupInterceptors(): void {
    // Request interceptor to add authentication
    this.httpClient.interceptors.request.use(
      async (config) => {
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log(`Adding auth token to request: ${config.method?.toUpperCase()} ${config.url}`);
        } else {
          console.log(`No auth token available for request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling and token refresh
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshTokens();
            const newToken = await this.getAuthToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.httpClient(originalRequest);
          } catch (refreshError) {
            // Refresh failed, user needs to re-authenticate
            await this.secureStorage.clearTokens();
            throw new Error('Session expired. Please sign in again.');
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }
  private async getAuthToken(): Promise<string | null> {
    try {
      const tokens = await this.secureStorage.getTokens();
      if (!tokens.accessToken) {
        console.log('No access token found in secure storage');
        return null;
      }
      return tokens.accessToken;
    } catch (error) {
      console.error('Failed to get auth token from secure storage:', error);
      return null;
    }
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      const data = error.response.data as any;
      const message = data?.detail || data?.message || `HTTP ${error.response.status}`;

      if (error.response.status === 429) {
        return new Error('Rate limit exceeded. Please try again later.');
      } else if (error.response.status === 503) {
        return new Error('Service temporarily unavailable. Please try again later.');
      }

      return new Error(message);
    } else if (error.request) {
      return new Error('Unable to connect to AutoGen backend. Please check your internet connection.');
    } else {
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxRetries - 1) break;

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Request failed after retries');
  }
  // Authentication Methods
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.retryRequest(() =>
      this.httpClient.post('/auth/login-json', { email, password })
    ) as any;
    return response.data;
  }
  async register(data: RegisterRequest): Promise<any> {
    const response = await this.retryRequest(() =>
      this.httpClient.post('/auth/register', data)
    ) as any;
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.httpClient.post('/auth/logout');
    } finally {
      await this.secureStorage.clearTokens();
    }
  }
  async refreshTokens(): Promise<void> {
    const tokens = await this.secureStorage.getTokens();
    if (!tokens.refreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('Attempting to refresh tokens...');
    const response = await this.httpClient.post('/auth/refresh', {
      refresh_token: tokens.refreshToken
    });

    const { access_token, refresh_token } = response.data;
    console.log('Tokens refreshed successfully');
    await this.secureStorage.storeTokens(access_token, refresh_token);
  }
  async getCurrentUser(): Promise<any> {
    const response = await this.retryRequest(() =>
      this.httpClient.get('/auth/me')
    ) as any;
    return response.data.user;
  }  // Subscription methods
  async getUserSubscription(): Promise<any> {
    try {
      const response = await this.httpClient.get('/subscriptions/current') as any;
      return response.data;
    } catch (error: any) {
      // If the subscription endpoint returns 404, it means the user is on free plan
      if (error.response?.status === 404) {
        throw new Error('Not Found');
      }
      throw this.handleError(error);
    }
  } async getSubscriptionPlans(): Promise<any[]> {
    try {
      const response = await this.httpClient.get('/subscriptions/plans') as any;
      return response.data;
    } catch (error: any) {
      // If the subscription plans endpoint doesn't exist, return mock plans
      if (error.response?.status === 404) {
        console.log('Subscription plans endpoint not found, returning mock plans');
        return this.getMockSubscriptionPlans();
      }
      throw this.handleError(error);
    }
  }

  private getMockSubscriptionPlans(): any[] {
    return [
      {
        id: 'free',
        name: 'Free Plan',
        price: 0,
        currency: 'USD',
        billing_cycle: 'monthly',
        features: {
          monthly_requests: 100,
          monthly_tokens: 10000,
          models: ['gpt-3.5-turbo', 'claude-haiku'],
          priority_support: false
        },
        description: 'Get started with basic AI assistance'
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        price: 20,
        currency: 'USD',
        billing_cycle: 'monthly',
        features: {
          monthly_requests: 10000,
          monthly_tokens: 1000000,
          models: ['gpt-4', 'claude-sonnet', 'claude-haiku', 'gpt-3.5-turbo'],
          priority_support: true
        },
        description: 'Perfect for professional developers'
      },
      {
        id: 'enterprise',
        name: 'Enterprise Plan',
        price: 100,
        currency: 'USD',
        billing_cycle: 'monthly',
        features: {
          monthly_requests: 100000,
          monthly_tokens: 10000000,
          models: ['gpt-4', 'claude-sonnet', 'claude-haiku', 'gpt-3.5-turbo', 'gemini-pro'],
          priority_support: true,
          dedicated_support: true
        },
        description: 'For teams and organizations'
      }
    ];
  }

  async getUsageStatistics(): Promise<any> {
    try {
      const response = await this.httpClient.get('/usage/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }  // Billing methods
  async createCheckoutSession(priceId: string): Promise<any> {
    try {
      const response = await this.httpClient.post('/subscriptions/subscribe', {
        plan_name: priceId,
        setup_future_usage: 'off_session', // Ensure payment methods are saved
        payment_method_types: ['card']
      }) as any;
      return response.data;
    } catch (error: any) {
      // If the checkout endpoint doesn't exist, simulate the response
      if (error.response?.status === 404) {
        console.log('Checkout session endpoint not found, simulating checkout');

        // For free plan, just return success
        if (priceId === 'free') {
          return {
            success: true,
            message: 'Successfully subscribed to free plan'
          };
        }

        // For paid plans, return a mock checkout URL
        return {
          checkout_url: `https://checkout.stripe.com/c/pay/mock_${priceId}`,
          client_secret: `pi_mock_${Date.now()}_secret_mock`,
          success_url: 'vscode://auto-gen-code-builder/payment-success',
          cancel_url: 'vscode://auto-gen-code-builder/payment-cancel'
        };
      }
      throw this.handleError(error);
    }
  } async createBillingPortalSession(): Promise<any> {
    try {
      // Try multiple possible billing portal endpoints
      const endpoints = [
        '/subscriptions/billing-portal',
        '/subscriptions/manage',
        '/billing/portal',
        '/billing/manage'
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.httpClient.post(endpoint) as any;
          return response.data;
        } catch (error: any) {
          if (error.response?.status !== 404) {
            throw error; // Re-throw non-404 errors
          }
          // Continue to next endpoint if 404
        }
      }

      // If all endpoints fail, throw a proper error
      throw new Error('Billing portal endpoint not available');
    } catch (error: any) {
      // Return a fallback URL if no billing portal endpoint exists
      console.log('Billing portal endpoint not found, using fallback URL');
      const config = vscode.workspace.getConfiguration('auto-gen-code-builder');
      const fallbackUrl = config.get<string>('subscription.billingPortalUrl', 'https://billing.stripe.com/p/login/autogen');
      return {
        portal_url: fallbackUrl,
        fallback: true
      };
    }
  }

  // API key management methods
  async getApiKeys(): Promise<any[]> {
    try {
      const response = await this.httpClient.get('/auth/api-keys');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addApiKey(request: ApiKeyRequest): Promise<any> {
    try {
      const response = await this.httpClient.post('/auth/api-keys', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getApiKeyDetails(keyId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/auth/api-keys/${keyId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateApiKey(keyId: string, data: any): Promise<any> {
    try {
      const response = await this.httpClient.patch(`/auth/api-keys/${keyId}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async removeApiKey(keyId: string): Promise<void> {
    try {
      await this.httpClient.delete(`/auth/api-keys/${keyId}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // OAuth methods
  async initiateOAuth(provider: string): Promise<string> {
    try {
      const response = await this.httpClient.post('/auth/oauth/initiate', { provider });
      return response.data.auth_url;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  // Models and LLM execution
  async getAvailableModels(): Promise<any> {
    const response = await this.retryRequest(() =>
      this.httpClient.get('/llm/models')
    ) as any;
    return response.data;
  }

  async executeLLMRequest(request: any): Promise<any> {
    try {
      const response = await this.httpClient.post('/llm/execute', request);
      return response.data.response;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async getLLMProviders(): Promise<any[]> {
    const response = await this.retryRequest(() =>
      this.httpClient.get('/llm/providers')
    ) as any;
    return response.data.providers;
  }

  // Health and Status
  async healthCheck(): Promise<{ status: string; message?: string }> {
    try {
      const response = await this.httpClient.get('/health', { timeout: 5000 });
      return { status: 'healthy', message: response.data.message };
    } catch (error) {
      const err = error as AxiosError;
      if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        return { status: 'unreachable', message: 'Backend server is not responding' };
      }
      return { status: 'error', message: err.message };
    }
  }
  // Organization and Sub-user Management
  async getOrganization(): Promise<any> {
    const response = await this.retryRequest(() =>
      this.httpClient.get('/organization')
    ) as any;
    return response.data;
  }

  async getSubUsers(): Promise<any[]> {
    const response = await this.retryRequest(() =>
      this.httpClient.get('/organization/sub-users')
    ) as any;
    return response.data.sub_users;
  }
  async createSubUser(data: { email: string; role: string }): Promise<any> {
    const response = await this.retryRequest(() =>
      this.httpClient.post('/organization/sub-users', data)
    ) as any;
    return response.data;
  }

  async updateSubUser(subUserId: string, data: { role?: string; is_active?: boolean }): Promise<any> {
    const response = await this.retryRequest(() =>
      this.httpClient.patch(`/organization/sub-users/${subUserId}`, data)
    ) as any;
    return response.data;
  }

  async removeSubUser(subUserId: string): Promise<void> {
    await this.retryRequest(() =>
      this.httpClient.delete(`/organization/sub-users/${subUserId}`)
    );
  }

  // Configuration
  setBaseURL(url: string): void {
    this.baseURL = url;
    this.httpClient.defaults.baseURL = url;
  }

  getBaseURL(): string {
    return this.baseURL;
  }
  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.httpClient.get('/health', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }  // 🆕 A4F Integration Methods
  async getVSCodeConfig(): Promise<VSCodeConfig> {
    const response = await this.retryRequest(() =>
      this.httpClient.get('/auth/vscode-config')
    ) as any;
    return response.data;
  }
  async getA4FModels(): Promise<ModelInfo[]> {
    const modelsData = await this.getAvailableModels();
    return modelsData.models.filter((model: ModelInfo) => model.provider === 'a4f');
  }
  async getProviders(): Promise<any> {
    const response = await this.retryRequest(() =>
      this.httpClient.get('/llm/providers')
    ) as any;
    return response.data;
  }

  async chatCompletion(model: string, messages: Array<{ role: string, content: string }>, options: any = {}): Promise<any> {
    const response = await this.retryRequest(() =>
      this.httpClient.post('/llm/chat/completions', {
        model,
        messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        ...options
      })
    ) as any;
    return response.data;
  }

  // Authentication status check
  async isAuthenticated(): Promise<boolean> {
    try {
      const tokens = await this.secureStorage.getTokens();
      if (!tokens.accessToken) {
        console.log('No access token found - user not authenticated');
        return false;
      }

      // Try to get current user to verify token is valid
      const user = await this.getCurrentUser();
      console.log('Authentication verified - user:', user?.email || 'unknown');
      return true;
    } catch (error) {
      console.log('Authentication check failed:', error);
      return false;
    }
  }

  // Method to get authentication status for debugging
  async getAuthStatus(): Promise<{ authenticated: boolean; hasTokens: boolean; error?: string }> {
    try {
      const tokens = await this.secureStorage.getTokens();
      const hasTokens = !!(tokens.accessToken && tokens.refreshToken);

      if (!hasTokens) {
        return { authenticated: false, hasTokens: false, error: 'No tokens found' };
      }

      try {
        await this.getCurrentUser();
        return { authenticated: true, hasTokens: true };
      } catch (error: any) {
        return {
          authenticated: false,
          hasTokens: true,
          error: `Token validation failed: ${error.message}`
        };
      }
    } catch (error: any) {
      return {
        authenticated: false,
        hasTokens: false,
        error: `Failed to check auth status: ${error.message}`
      };
    }
  }
}
