import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
// Logger removido para compatibilidade com frontend
import {
  User,
  Product,
  CashRegister,
  Sale,
  CreateUserRequest,
  UpdateUserRequest,
  CreateProductRequest,
  UpdateProductRequest,
  CreateCashRegisterRequest,
  UpdateCashRegisterRequest,
  CreateSaleRequest,
  UpdateSaleRequest,
  UserFilters,
  ProductFilters,
  CashRegisterFilters,
  SaleFilters,
  ApiError,
} from '@/types';

/**
 * Cliente para comunicação com a API Auxiliadora Pay
 */
export class AuxiliadoraPayApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private apiKey?: string;
  private retryAttempts: number;
  private timeout: number;

  constructor(config: {
    baseURL?: string;
    apiKey?: string;
    timeout?: number;
    retryAttempts?: number;
  } = {}) {
    this.baseURL = config.baseURL || process.env.AUXILIADORA_API_BASE_URL || 'https://www.auxiliadorapay.shop/api';
    this.apiKey = config.apiKey || process.env.AUXILIADORA_API_KEY;
    this.timeout = config.timeout || parseInt(process.env.AUXILIADORA_API_TIMEOUT || '30000');
    this.retryAttempts = config.retryAttempts || 3;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
    });

    this.setupInterceptors();
  }

  /**
   * Configura interceptors para logging e tratamento de erros
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log('API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
        });
        return config;
      },
      (error) => {
        console.error('API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log('API Response', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      (error) => {
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message,
          status: error.response?.status || 500,
          code: error.response?.data?.code,
          details: error.response?.data,
        };

        console.error('API Response Error', apiError);
        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Executa uma requisição com retry automático
   */
  private async requestWithRetry<T>(
    config: AxiosRequestConfig,
    attempt: number = 1
  ): Promise<AxiosResponse<T>> {
    try {
      return await this.client.request<T>(config);
    } catch (error: any) {
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.warn(`Retrying request in ${delay}ms (attempt ${attempt + 1}/${this.retryAttempts})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.requestWithRetry<T>(config, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Determina se uma requisição deve ser repetida
   */
  private shouldRetry(error: any): boolean {
    // Retry em casos de erro de rede ou timeout
    return (
      !error.response ||
      error.response.status >= 500 ||
      error.response.status === 429 ||
      error.code === 'ECONNABORTED'
    );
  }

  /**
   * Testa a conectividade com a API
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Usar endpoint de usuários para verificar conectividade
      await this.requestWithRetry({
        method: 'GET',
        url: '/users',
        timeout: 5000,
      });
      return true;
    } catch (error) {
      console.error('Health check failed', error);
      return false;
    }
  }

  // ==================== USUÁRIOS ====================

  /**
   * Lista todos os usuários
   */
  async getUsers(filters: UserFilters = {}): Promise<User[]> {
    const response = await this.requestWithRetry<User[]>({
      method: 'GET',
      url: '/users',
      params: filters,
    });
    return response.data;
  }

  /**
   * Busca um usuário por ID
   */
  async getUserById(id: string): Promise<User> {
    const response = await this.requestWithRetry<User>({
      method: 'GET',
      url: `/users/${id}`,
    });
    return response.data;
  }

  /**
   * Cria um novo usuário
   */
  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await this.requestWithRetry<User>({
      method: 'POST',
      url: '/users',
      data,
    });
    return response.data;
  }

  /**
   * Atualiza um usuário
   */
  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    const response = await this.requestWithRetry<User>({
      method: 'PUT',
      url: `/users/${id}`,
      data,
    });
    return response.data;
  }

  /**
   * Remove um usuário
   */
  async deleteUser(id: string): Promise<void> {
    await this.requestWithRetry({
      method: 'DELETE',
      url: `/users/${id}`,
    });
  }

  // ==================== PRODUTOS ====================

  /**
   * Lista todos os produtos
   */
  async getProducts(filters: ProductFilters = {}): Promise<Product[]> {
    const response = await this.requestWithRetry<Product[]>({
      method: 'GET',
      url: '/products',
      params: filters,
    });
    return response.data;
  }

  /**
   * Busca um produto por ID
   */
  async getProductById(id: string): Promise<Product> {
    const response = await this.requestWithRetry<Product>({
      method: 'GET',
      url: `/products/${id}`,
    });
    return response.data;
  }

  /**
   * Cria um novo produto
   */
  async createProduct(data: CreateProductRequest): Promise<Product> {
    const response = await this.requestWithRetry<Product>({
      method: 'POST',
      url: '/products',
      data,
    });
    return response.data;
  }

  /**
   * Atualiza um produto
   */
  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    const response = await this.requestWithRetry<Product>({
      method: 'PUT',
      url: `/products/${id}`,
      data,
    });
    return response.data;
  }

  /**
   * Remove um produto
   */
  async deleteProduct(id: string): Promise<void> {
    await this.requestWithRetry({
      method: 'DELETE',
      url: `/products/${id}`,
    });
  }

  // ==================== CAIXAS REGISTRADORAS ====================

  /**
   * Lista todas as caixas registradoras
   */
  async getCashRegisters(filters: CashRegisterFilters = {}): Promise<CashRegister[]> {
    const response = await this.requestWithRetry<CashRegister[]>({
      method: 'GET',
      url: '/cash-registers',
      params: filters,
    });
    return response.data;
  }

  /**
   * Busca uma caixa registradora por ID
   */
  async getCashRegisterById(id: string): Promise<CashRegister> {
    const response = await this.requestWithRetry<CashRegister>({
      method: 'GET',
      url: `/cash-registers/${id}`,
    });
    return response.data;
  }

  /**
   * Cria uma nova caixa registradora
   */
  async createCashRegister(data: CreateCashRegisterRequest): Promise<CashRegister> {
    const response = await this.requestWithRetry<CashRegister>({
      method: 'POST',
      url: '/cash-registers',
      data,
    });
    return response.data;
  }

  /**
   * Atualiza uma caixa registradora
   */
  async updateCashRegister(id: string, data: UpdateCashRegisterRequest): Promise<CashRegister> {
    const response = await this.requestWithRetry<CashRegister>({
      method: 'PUT',
      url: `/cash-registers/${id}`,
      data,
    });
    return response.data;
  }

  /**
   * Remove uma caixa registradora
   */
  async deleteCashRegister(id: string): Promise<void> {
    await this.requestWithRetry({
      method: 'DELETE',
      url: `/cash-registers/${id}`,
    });
  }

  // ==================== VENDAS ====================

  /**
   * Lista todas as vendas
   */
  async getSales(filters: SaleFilters = {}): Promise<Sale[]> {
    const response = await this.requestWithRetry<Sale[]>({
      method: 'GET',
      url: '/sales',
      params: filters,
    });
    return response.data;
  }

  /**
   * Busca uma venda por ID
   */
  async getSaleById(id: string): Promise<Sale> {
    const response = await this.requestWithRetry<Sale>({
      method: 'GET',
      url: `/sales/${id}`,
    });
    return response.data;
  }

  /**
   * Cria uma nova venda
   */
  async createSale(data: CreateSaleRequest): Promise<Sale> {
    const response = await this.requestWithRetry<Sale>({
      method: 'POST',
      url: '/sales',
      data,
    });
    return response.data;
  }

  /**
   * Atualiza uma venda
   */
  async updateSale(id: string, data: UpdateSaleRequest): Promise<Sale> {
    const response = await this.requestWithRetry<Sale>({
      method: 'PUT',
      url: `/sales/${id}`,
      data,
    });
    return response.data;
  }

  /**
   * Remove uma venda
   */
  async deleteSale(id: string): Promise<void> {
    await this.requestWithRetry({
      method: 'DELETE',
      url: `/sales/${id}`,
    });
  }

  // ==================== MÉTODOS UTILITÁRIOS ====================

  /**
   * Atualiza a configuração do cliente
   */
  updateConfig(config: {
    baseURL?: string;
    apiKey?: string;
    timeout?: number;
    retryAttempts?: number;
  }): void {
    if (config.baseURL) {
      this.baseURL = config.baseURL;
      this.client.defaults.baseURL = config.baseURL;
    }

    if (config.apiKey) {
      this.apiKey = config.apiKey;
      this.client.defaults.headers.common['Authorization'] = `Bearer ${config.apiKey}`;
    }

    if (config.timeout) {
      this.timeout = config.timeout;
      this.client.defaults.timeout = config.timeout;
    }

    if (config.retryAttempts) {
      this.retryAttempts = config.retryAttempts;
    }
  }

  /**
   * Obtém estatísticas da API
   */
  async getApiStats(): Promise<{
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
  }> {
    // Esta seria uma implementação personalizada baseada nos logs
    // Por enquanto, retorna dados mock
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
    };
  }
}

// Instância singleton do cliente
export const auxiliadoraApiClient = new AuxiliadoraPayApiClient();

// Exportação para compatibilidade
export const apiClient = auxiliadoraApiClient;

// Função helper para criar uma nova instância com configuração específica
export const createApiClient = (config: {
  baseURL?: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
}) => new AuxiliadoraPayApiClient(config);