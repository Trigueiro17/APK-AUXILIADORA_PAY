// Tipos base da API Auxiliadora Pay

// Tipos de sistema
export type SystemStatus = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'ERROR' | 'HEALTHY';
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
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
  lastSyncAt?: string;
}

export interface CashRegister {
  id: string;
  userId: string;
  status: 'OPEN' | 'CLOSED';
  initialAmount: number;
  currentAmount: number;
  finalAmount?: number;
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
  user?: User;
  sales?: Sale[];
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
  lastSyncAt?: string;
  user?: User;
  cashRegister?: CashRegister;
}

export interface SaleItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  product?: Product;
}

// Tipos de controle e monitoramento
export interface SyncConfig {
  id: string;
  apiBaseUrl: string;
  apiKey?: string;
  syncInterval: number;
  retryAttempts: number;
  timeout: number;
  enabled: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncLog {
  id: string;
  entity: 'users' | 'products' | 'cash-registers' | 'sales';
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC';
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
  message?: string;
  data?: any;
  duration?: number;
  userId?: string;
  createdAt: string;
  user?: User;
}

export interface SystemMetrics {
  id: string;
  totalUsers: number;
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  syncStatus: 'HEALTHY' | 'WARNING' | 'ERROR';
  lastSyncDuration?: number;
  errorRate: number;
  createdAt: string;
}

export interface ErrorLog {
  id: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  stack?: string;
  context?: any;
  userId?: string;
  createdAt: string;
}

export interface ApiRequest {
  id: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  requestBody?: any;
  responseBody?: any;
  errorMessage?: string;
  createdAt: string;
}

// Tipos para requisições da API
export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role?: 'USER' | 'ADMIN';
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  password?: string;
  role?: 'USER' | 'ADMIN';
  active?: boolean;
}

export interface CreateProductRequest {
  name: string;
  price: number;
  description?: string;
  imageUri?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  imageUri?: string;
  active?: boolean;
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

export interface CreateSaleRequest {
  cashRegisterId: string;
  userId: string;
  items: SaleItem[];
  total: number;
  paymentMethod: 'CASH' | 'CARD' | 'PIX';
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

export interface UpdateSaleRequest {
  items?: SaleItem[];
  total?: number;
  paymentMethod?: 'CASH' | 'CARD' | 'PIX';
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

// Tipos para filtros e queries
export interface UserFilters {
  active?: boolean;
  role?: 'USER' | 'ADMIN';
  search?: string;
}

export interface ProductFilters {
  active?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface CashRegisterFilters {
  status?: 'OPEN' | 'CLOSED';
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface SaleFilters {
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  userId?: string;
  cashRegisterId?: string;
  paymentMethod?: 'CASH' | 'CARD' | 'PIX';
  startDate?: string;
  endDate?: string;
}

export interface SyncLogFilters {
  entity?: 'users' | 'products' | 'cash-registers' | 'sales';
  status?: 'SUCCESS' | 'ERROR' | 'PENDING';
  operation?: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC';
  startDate?: string;
  endDate?: string;
}

// Tipos para paginação
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Tipos para respostas da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// Tipos para configuração
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  sync: {
    interval: number;
    enabled: boolean;
    batchSize: number;
  };
  logging: {
    level: string;
    maxFiles: number;
    maxSize: string;
  };
}

// Tipos para dashboard
export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  todaySales: number;
  todayRevenue: number;
  openCashRegisters: number;
  syncStatus: 'HEALTHY' | 'WARNING' | 'ERROR';
  lastSyncAt?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

// Tipos para notificações
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Tipos para WebSocket
export interface WebSocketMessage {
  type: 'sync_update' | 'error' | 'notification';
  payload: any;
  timestamp: string;
}

// Tipos para autenticação
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

// Tipos para validação
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string[];
}

// Tipos utilitários
export type EntityType = 'users' | 'products' | 'cash-registers' | 'sales';
export type SyncStatus = 'SUCCESS' | 'ERROR' | 'PENDING';
export type SystemHealth = 'HEALTHY' | 'WARNING' | 'ERROR';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// Tipos removidos: Prisma não é mais utilizado
// A aplicação agora usa apenas a API externa do Auxiliadora Pay