const API_BASE_URL = '/api';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUri?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CashRegister {
  id: string;
  userId: string;
  status: 'OPEN' | 'CLOSED';
  initialAmount: number;
  currentAmount: number;
  finalAmount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCashRegisterRequest {
  userId: string;
  initialAmount?: number;
}

export interface UpdateCashRegisterRequest {
  status?: 'OPEN' | 'CLOSED';
  currentAmount?: number;
  finalAmount?: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  cashRegisterId: string;
  userId: string;
  items: SaleItem[];
  total: number;
  paymentMethod: 'CASH' | 'CARD' | 'PIX';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  user?: User;
  cashRegister?: CashRegister;
}

// API Client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // Users API
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUserById(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async updateUser(id: string, userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Products API
  async getProducts(active?: boolean): Promise<Product[]> {
    const query = active !== undefined ? `?active=${active}` : '';
    return this.request<Product[]>(`/products${query}`);
  }

  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async getProductById(id: string): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  async updateProduct(id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Cash Registers
  async getCashRegisters(params?: { status?: 'OPEN' | 'CLOSED'; userId?: string }): Promise<CashRegister[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.userId) queryParams.append('userId', params.userId);
    
    const url = `/cash-registers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<CashRegister[]>(url);
  }

  async getCashRegister(id: string): Promise<CashRegister> {
    return this.request<CashRegister>(`/cash-registers/${id}`);
  }

  async createCashRegister(data: CreateCashRegisterRequest): Promise<CashRegister> {
    return this.request<CashRegister>('/cash-registers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCashRegister(id: string, data: UpdateCashRegisterRequest): Promise<CashRegister> {
    return this.request<CashRegister>(`/cash-registers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCashRegister(id: string): Promise<void> {
    return this.request<void>(`/cash-registers/${id}`, {
      method: 'DELETE',
    });
  }

  // Sales API
  async getSales(filters?: {
    status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    userId?: string;
    cashRegisterId?: string;
    paymentMethod?: 'CASH' | 'CARD' | 'PIX';
    startDate?: string;
    endDate?: string;
  }): Promise<Sale[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Sale[]>(`/sales${query}`);
  }

  async createSale(saleData: {
    cashRegisterId: string;
    userId: string;
    items: SaleItem[];
    total: number;
    paymentMethod: 'CASH' | 'CARD' | 'PIX';
    status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  }): Promise<Sale> {
    return this.request<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  async getSaleById(id: string): Promise<Sale> {
    return this.request<Sale>(`/sales/${id}`);
  }

  async updateSale(id: string, saleData: Partial<Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Sale> {
    return this.request<Sale>(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(saleData),
    });
  }

  async deleteSale(id: string): Promise<void> {
    return this.request<void>(`/sales/${id}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);