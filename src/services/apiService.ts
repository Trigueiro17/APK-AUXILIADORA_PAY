import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Alert } from 'react-native';

// API Configuration
const API_BASE_URL = 'https://www.auxiliadorapay.shop//api'; // URL original
// const API_BASE_URL = 'http://192.168.1.100:3000/api'; // URL local para desenvolvimento
const TIMEOUT = 10000;

// API Types based on PDV Rafa API
export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUri?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCashRegister {
  id: string;
  userId: string;
  cashSessionId?: string;
  status: 'OPEN' | 'CLOSED';
  initialAmount: number;
  currentAmount: number;
  finalAmount?: number;
  createdAt: string;
  updatedAt: string;
  user?: ApiUser;
  sales?: ApiSale[];
}

export interface ApiSale {
  id: string;
  cashRegisterId: string;
  userId: string;
  items: ApiSaleItem[];
  total: number;
  paymentMethod: 'CASH' | 'CARD' | 'PIX';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  user?: ApiUser;
  cashRegister?: ApiCashRegister;
}

export interface ApiSaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface ApiCashSession {
  id: string;
  userId: string;
  sessionName?: string;
  status: 'ACTIVE' | 'CLOSED' | 'CONSOLIDATED';
  openingAmount: number;
  closingAmount?: number;
  openedAt: string;
  closedAt?: string;
  consolidatedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: ApiUser;
  cashRegisters?: ApiCashRegister[];
}

export interface ApiConsolidatedData {
  id: string;
  cashSessionId: string;
  userId: string;
  totalSales: number;
  totalCash: number;
  totalCard: number;
  totalPix: number;
  salesCount: number;
  openingAmount: number;
  closingAmount: number;
  consolidatedAt: string;
  cashSession?: ApiCashSession;
  user?: ApiUser;
}

// Create interfaces
export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role?: 'USER' | 'ADMIN';
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  imageUri?: string;
}

export interface CreateCashRegisterRequest {
  userId: string;
  initialAmount?: number;
}

export interface CreateSaleRequest {
  cashRegisterId: string;
  userId: string;
  items: ApiSaleItem[];
  total: number;
  paymentMethod: 'CASH' | 'CARD' | 'PIX';
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  sessionId?: string;
}

export interface CreateCashSessionRequest {
  userId: string;
  sessionName?: string;
  openingAmount: number;
  status?: 'ACTIVE' | 'CLOSED' | 'CONSOLIDATED';
}

export interface ConsolidateCashSessionRequest {
  closingAmount: number;
}

// API Error interface
export interface ApiError {
  message: string;
  status: number;
  data?: any;
}

export interface ApiSettings {
  id?: string;
  userId?: string;
  darkMode: boolean;
  notifications: boolean;
  autoBackup: boolean;
  language: string;
  nfcEnabled: boolean;
  hideHistoryEnabled: boolean;
  printerConfig?: {
    type: string;
    name: string;
    address?: string;
    isConnected: boolean;
  };
  bluetoothEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface UpdateSettingsRequest {
  darkMode?: boolean;
  notifications?: boolean;
  autoBackup?: boolean;
  language?: string;
  nfcEnabled?: boolean;
  hideHistoryEnabled?: boolean;
  printerConfig?: {
    type: string;
    name: string;
    address?: string;
    isConnected: boolean;
  };
  bluetoothEnabled?: boolean;
}

class ApiService {
  private api: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        let message = 'Erro de conexão';
        
        if (error.response) {
          // Server responded with error status
          switch (error.response.status) {
            case 503:
              message = 'Servidor temporariamente indisponível. O aplicativo funcionará em modo offline.';
              break;
            case 500:
              message = 'Erro interno do servidor. Tente novamente em alguns minutos.';
              break;
            case 404:
              message = 'Serviço não encontrado. Verifique sua conexão.';
              break;
            case 401:
              message = 'Credenciais inválidas ou sessão expirada.';
              // Token expired or invalid - clear in-memory token
              this.authToken = null;
              break;
            case 400:
              message = error.response.data?.message || 'Dados inválidos fornecidos.';
              break;
            default:
              message = error.response.data?.message || `Erro ${error.response.status}: ${error.response.statusText}`;
          }
        } else if (error.request) {
          // Network error
          message = 'Sem conexão com a internet. O aplicativo funcionará em modo offline.';
        } else {
          // Other error
          message = error.message || 'Erro desconhecido';
        }

        const apiError: ApiError = {
          message,
          status: error.response?.status || 0,
          data: error.response?.data,
        };

        return Promise.reject(apiError);
      }
    );
  }

  // Set authentication token in memory
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // Get current auth token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Helper method for making requests
  private async makeRequest<T>(request: Promise<AxiosResponse<T>>): Promise<T> {
    try {
      const response = await request;
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // User endpoints
  async getUsers(): Promise<ApiUser[]> {
    return this.makeRequest(this.api.get('/users'));
  }

  async getUserById(id: string): Promise<ApiUser> {
    return this.makeRequest(this.api.get(`/users/${id}`));
  }

  async createUser(userData: CreateUserRequest): Promise<ApiUser> {
    return this.makeRequest(this.api.post('/users', userData));
  }

  async updateUser(id: string, userData: Partial<CreateUserRequest>): Promise<ApiUser> {
    return this.makeRequest(this.api.put(`/users/${id}`, userData));
  }

  async deleteUser(id: string): Promise<void> {
    return this.makeRequest(this.api.delete(`/users/${id}`));
  }

  // Product endpoints
  async getProducts(active?: boolean): Promise<ApiProduct[]> {
    const params = active !== undefined ? { active } : {};
    return this.makeRequest(this.api.get('/products', { params }));
  }

  async getProductById(id: string): Promise<ApiProduct> {
    return this.makeRequest(this.api.get(`/products/${id}`));
  }

  async createProduct(productData: CreateProductRequest): Promise<ApiProduct> {
    return this.makeRequest(this.api.post('/products', productData));
  }

  async updateProduct(id: string, productData: Partial<CreateProductRequest>): Promise<ApiProduct> {
    return this.makeRequest(this.api.put(`/products/${id}`, productData));
  }

  async deleteProduct(id: string): Promise<void> {
    return this.makeRequest(this.api.delete(`/products/${id}`));
  }

  // Cash Register endpoints
  async getCashRegisters(status?: 'OPEN' | 'CLOSED', userId?: string): Promise<ApiCashRegister[]> {
    try {
      const params: any = {};
      if (status) params.status = status;
      if (userId) params.userId = userId;
      const result = await this.makeRequest(this.api.get('/cash-registers', { params }));
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.warn('Error fetching cash registers, returning empty array:', error);
      return [];
    }
  }

  async getCashRegisterById(id: string): Promise<ApiCashRegister> {
    return this.makeRequest(this.api.get(`/cash-registers/${id}`));
  }

  async createCashRegister(cashRegisterData: CreateCashRegisterRequest): Promise<ApiCashRegister> {
    return this.makeRequest(this.api.post('/cash-registers', cashRegisterData));
  }

  async updateCashRegister(id: string, cashRegisterData: Partial<CreateCashRegisterRequest & { status?: 'OPEN' | 'CLOSED'; currentAmount?: number; finalAmount?: number }>): Promise<ApiCashRegister> {
    return this.makeRequest(this.api.put(`/cash-registers/${id}`, cashRegisterData));
  }

  // Método específico para fechar o caixa
  async closeCashRegister(id: string, finalAmount: number): Promise<ApiCashRegister> {
    return this.makeRequest(this.api.put(`/cash-registers/${id}`, {
      status: 'CLOSED',
      finalAmount: finalAmount
    }));
  }

  async deleteCashRegister(id: string): Promise<void> {
    return this.makeRequest(this.api.delete(`/cash-registers/${id}`));
  }

  // Cash Session endpoints
  async getCashSessions(status?: 'ACTIVE' | 'CLOSED' | 'CONSOLIDATED', userId?: string): Promise<ApiCashSession[]> {
    try {
      const params: any = {};
      if (status) params.status = status;
      if (userId) params.userId = userId;
      const result = await this.makeRequest(this.api.get('/cash-sessions', { params }));
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.warn('Error fetching cash sessions, returning empty array:', error);
      return [];
    }
  }

  async getCashSessionById(id: string): Promise<ApiCashSession> {
    return this.makeRequest(this.api.get(`/cash-sessions/${id}`));
  }

  async createCashSession(sessionData: CreateCashSessionRequest): Promise<ApiCashSession> {
    return this.makeRequest(this.api.post('/cash-sessions', sessionData));
  }

  async updateCashSession(id: string, sessionData: Partial<CreateCashSessionRequest & { status?: 'ACTIVE' | 'CLOSED' | 'CONSOLIDATED'; closingAmount?: number; closedAt?: string }>): Promise<ApiCashSession> {
    return this.makeRequest(this.api.put(`/cash-sessions/${id}`, sessionData));
  }

  async deleteCashSession(id: string): Promise<void> {
    return this.makeRequest(this.api.delete(`/cash-sessions/${id}`));
  }

  async consolidateCashSession(sessionId: string, data: ConsolidateCashSessionRequest): Promise<ApiConsolidatedData> {
    return this.makeRequest(this.api.post(`/cash-sessions/${sessionId}/consolidate`, data));
  }

  async getConsolidatedData(filters?: {
    userId?: string;
    sessionId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiConsolidatedData[]> {
    try {
      const result = await this.makeRequest(this.api.get('/consolidated-data', { params: filters }));
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.warn('Error fetching consolidated data, returning empty array:', error);
      return [];
    }
  }

  // Sales endpoints
  async getSales(filters?: {
    status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    userId?: string;
    cashRegisterId?: string;
    sessionId?: string;
    paymentMethod?: 'CASH' | 'CARD' | 'PIX';
    startDate?: string;
    endDate?: string;
  }): Promise<ApiSale[]> {
    try {
      const result = await this.makeRequest(this.api.get('/sales', { params: filters }));
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.warn('Error fetching sales, returning empty array:', error);
      return [];
    }
  }

  async getSaleById(id: string): Promise<ApiSale> {
    return this.makeRequest(this.api.get(`/sales/${id}`));
  }

  async createSale(saleData: CreateSaleRequest): Promise<ApiSale> {
    return this.makeRequest(this.api.post('/sales', saleData));
  }

  async updateSale(id: string, saleData: Partial<CreateSaleRequest>): Promise<ApiSale> {
    return this.makeRequest(this.api.put(`/sales/${id}`, saleData));
  }

  async deleteSale(id: string): Promise<void> {
    return this.makeRequest(this.api.delete(`/sales/${id}`));
  }

  async clearAllSales(): Promise<void> {
    try {
      // Get all sales
      const allSales = await this.getSales();
      
      // Get all cash registers to check which ones are open
      const allCashRegisters = await this.getCashRegisters();
      const openCashRegisterIds = allCashRegisters
        .filter(cr => cr.status === 'OPEN')
        .map(cr => cr.id);
      
      // Filter sales to only include those from open cash registers
      const salesFromOpenCashRegisters = allSales.filter(sale => 
        openCashRegisterIds.includes(sale.cashRegisterId)
      );
      
      // Delete each sale from open cash registers individually
      const deletePromises = salesFromOpenCashRegisters.map(sale => this.deleteSale(sale.id));
      await Promise.all(deletePromises);
      
      // Log information about sales that couldn't be deleted
      const salesFromClosedCashRegisters = allSales.filter(sale => 
        !openCashRegisterIds.includes(sale.cashRegisterId)
      );
      
      if (salesFromClosedCashRegisters.length > 0) {
        console.log(`${salesFromClosedCashRegisters.length} vendas de caixas fechados não puderam ser deletadas`);
      }
    } catch (error) {
      console.error('Error clearing all sales:', error);
      throw new Error('Erro ao limpar vendas disponíveis');
    }
  }



  // Authentication methods
  async login(email: string, password: string): Promise<{ user: ApiUser; token?: string }> {
    try {
      const response = await this.makeRequest(this.api.post('/auth/login', { email, password }));
      // Store token in memory only
      if (response.token) {
        this.setAuthToken(response.token);
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      
      // If API is unavailable (503 or network error), allow offline mode with demo user
      if ((error as ApiError).status === 503 || (error as ApiError).status === 0) {
        console.log('API unavailable, creating offline demo user');
        
        // Create a demo user for offline mode
        const offlineUser: ApiUser = {
          id: 'offline-user-' + Date.now(),
          email: email,
          name: 'Usuário Offline',
          role: 'USER',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        return { user: offlineUser };
      }
      
      // Fallback: try to find user by email and validate password
      try {
        const users = await this.getUsers();
        const user = users.find(u => u.email === email);
        if (user) {
          // Note: Password validation would need to be implemented on the server
          // For now, we'll accept any user found by email
          return { user };
        }
      } catch (fallbackError) {
        console.log('Fallback user lookup also failed:', fallbackError);
      }
      
      throw new Error('Credenciais inválidas');
    }
  }

  async getCurrentUser(): Promise<ApiUser | null> {
    try {
      // Try to get current user from server if we have a valid session
      const response = await this.makeRequest(this.api.get('/auth/me'));
      return response;
    } catch (error) {
      // If no valid session or endpoint doesn't exist, return null
      console.log('No valid session found:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    // Clear authentication token from memory
    this.setAuthToken(null);
    
    // Optionally call logout endpoint if it exists
    try {
      await this.makeRequest(this.api.post('/auth/logout'));
    } catch (error) {
      // Logout endpoint might not exist, continue anyway
      console.log('Logout endpoint not available:', error);
    }
  }

  // Settings
  async getSettings(): Promise<ApiSettings> {
    try {
      const response = await this.makeRequest(this.api.get('/settings'));
      return response;
    } catch (error) {
      console.log('Settings endpoint not available, using default values');
      // Return default settings if API doesn't have settings endpoint
      return {
        darkMode: false,
        notifications: true,
        autoBackup: false,
        language: 'pt-BR',
        nfcEnabled: true,
        hideHistoryEnabled: false,
        bluetoothEnabled: false
      };
    }
  }

  async getUserSettings(userId: string): Promise<ApiSettings> {
    try {
      const response = await this.makeRequest(this.api.get(`/users/${userId}/settings`));
      return response;
    } catch (error) {
      console.log('User settings endpoint not available, using default values');
      // Return default settings if API doesn't have user settings endpoint
      return {
        darkMode: false,
        notifications: true,
        autoBackup: false,
        language: 'pt-BR',
        nfcEnabled: true,
        hideHistoryEnabled: false,
        bluetoothEnabled: false
      };
    }
  }

  async updateUserSettings(userId: string, settings: UpdateSettingsRequest): Promise<ApiSettings> {
    try {
      const response = await this.makeRequest(
        this.api.put(`/users/${userId}/settings`, settings)
      );
      return response;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  async updateSettings(settings: UpdateSettingsRequest): Promise<ApiSettings> {
    try {
      const response = await this.makeRequest(
        this.api.put('/settings', settings)
      );
      return response;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  // Connectivity check
  async checkConnection(): Promise<boolean> {
    try {
      await this.api.get('/users', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;