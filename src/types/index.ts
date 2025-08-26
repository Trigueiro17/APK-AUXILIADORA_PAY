export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  barcode?: string;
  category?: string;
  stock?: number;
  imageUri?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CashSession {
  id: string;
  userId: string;
  sessionName: string;
  openingAmount: number;
  closingAmount?: number;
  status: CashSessionStatus;
  openedAt: Date;
  closedAt?: Date;
  notes?: string;
  isConsolidated: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  cashRegisters?: CashRegister[];
  consolidatedData?: ConsolidatedData;
}

export interface CashRegister {
  id: string;
  userId: string;
  cashSessionId: string;
  openingAmount: number;
  initialAmount: number;
  currentAmount: number;
  closingAmount?: number;
  finalAmount?: number;
  status: CashRegisterStatus;
  openedAt: Date;
  closedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  cashSession?: CashSession;
  sales?: Sale[];
}

export interface ConsolidatedData {
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
  consolidatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  cashSession?: CashSession;
  user?: User;
}

export interface Sale {
  id: string;
  userId: string;
  cashRegisterId: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  pixQrCode?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  cashRegister?: CashRegister;
  items: SaleItem[];
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sale?: Sale;
  product?: Product;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum CashSessionStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  CONSOLIDATED = 'CONSOLIDATED',
}

export enum CashRegisterStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum PaymentMethod {
  PIX = 'PIX',
  CARD = 'CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  CREDIT_CARD = 'CREDIT_CARD',
  CASH = 'CASH',
  NFC = 'NFC',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  barcode?: string;
  category?: string;
  stock: number;
}

export interface OpenCashRegisterData {
  userId: string;
  openingAmount: number;
  notes?: string;
}

export interface CloseCashRegisterData {
  closingAmount: number;
  notes?: string;
}

export interface CreateSaleData {
  userId: string;
  cashRegisterId: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  paymentMethod: PaymentMethod;
}

export interface DailySalesReport {
  date: string;
  totalSales: number;
  totalAmount: number;
  paymentMethods: {
    method: PaymentMethod;
    count: number;
    amount: number;
  }[];
}

export interface CashRegisterReport {
  id: string;
  openedAt: Date;
  closedAt?: Date;
  openingAmount: number;
  closingAmount?: number;
  totalSales: number;
  totalAmount: number;
  user: {
    name: string;
    email: string;
  };
}