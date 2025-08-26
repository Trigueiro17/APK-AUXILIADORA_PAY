import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { User, Product, CashRegister, CashSession, ConsolidatedData, Sale, PaymentMethod, CashSessionStatus } from '../types';
import { apiService, ApiUser, ApiProduct, ApiCashRegister, ApiCashSession, ApiConsolidatedData, ApiSale } from '../services/apiService';
import { ConsolidationService, ConsolidationSummary } from '../services/consolidationService';

// Mapping functions to convert API types to app types
const mapApiUserToUser = (apiUser: ApiUser): User => ({
  ...apiUser,
  password: '', // API doesn't return password
  role: apiUser.role as any,
  createdAt: new Date(apiUser.createdAt),
  updatedAt: new Date(apiUser.updatedAt),
});

const mapApiProductToProduct = (apiProduct: ApiProduct): Product => ({
  ...apiProduct,
  barcode: undefined,
  category: undefined,
  stock: 0,
  createdAt: new Date(apiProduct.createdAt),
  updatedAt: new Date(apiProduct.updatedAt),
});

const mapApiCashRegisterToCashRegister = (apiCashRegister: ApiCashRegister): CashRegister => ({
  ...apiCashRegister,
  cashSessionId: apiCashRegister.cashSessionId || '',
  openingAmount: apiCashRegister.initialAmount,
  closingAmount: apiCashRegister.finalAmount,
  status: apiCashRegister.status as any,
  openedAt: new Date(apiCashRegister.createdAt),
  closedAt: apiCashRegister.updatedAt ? new Date(apiCashRegister.updatedAt) : undefined,
  notes: undefined,
  createdAt: new Date(apiCashRegister.createdAt),
  updatedAt: new Date(apiCashRegister.updatedAt),
  user: apiCashRegister.user ? mapApiUserToUser(apiCashRegister.user) : undefined,
  sales: (apiCashRegister.sales && Array.isArray(apiCashRegister.sales)) ? apiCashRegister.sales.map(mapApiSaleToSale) : undefined,
});

const mapApiCashSessionToCashSession = (apiCashSession: ApiCashSession): CashSession => ({
  ...apiCashSession,
  sessionName: apiCashSession.sessionName || `Sessão ${new Date().toLocaleDateString()}`,
  status: apiCashSession.status as CashSessionStatus,
  openingAmount: apiCashSession.openingAmount || 0,
  closingAmount: apiCashSession.closingAmount,
  openedAt: new Date(apiCashSession.createdAt),
  closedAt: apiCashSession.updatedAt ? new Date(apiCashSession.updatedAt) : undefined,
  isConsolidated: false,
  createdAt: new Date(apiCashSession.createdAt),
  updatedAt: new Date(apiCashSession.updatedAt),
  user: apiCashSession.user ? mapApiUserToUser(apiCashSession.user) : undefined,
  cashRegisters: (apiCashSession.cashRegisters && Array.isArray(apiCashSession.cashRegisters)) ? apiCashSession.cashRegisters.map(mapApiCashRegisterToCashRegister) : undefined,
});

const mapApiConsolidatedDataToConsolidatedData = (apiData: ApiConsolidatedData): ConsolidatedData => ({
  ...apiData,
  consolidatedAt: new Date(apiData.consolidatedAt),
  createdAt: new Date(apiData.consolidatedAt),
  updatedAt: new Date(apiData.consolidatedAt),
  cashSession: apiData.cashSession ? mapApiCashSessionToCashSession(apiData.cashSession) : undefined,
  user: apiData.user ? mapApiUserToUser(apiData.user) : undefined,
});

const mapApiSaleToSale = (apiSale: ApiSale): Sale => {
  // Calculate total based on sum of individual items for consistency
  const calculatedTotal = (apiSale.items && Array.isArray(apiSale.items)) 
    ? apiSale.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    : apiSale.total; // Fallback to API total if items are not available
    
  return {
    id: apiSale.id,
    userId: apiSale.userId,
    cashRegisterId: apiSale.cashRegisterId,
    totalAmount: calculatedTotal,
    paymentMethod: apiSale.paymentMethod as any,
    paymentStatus: apiSale.status === 'COMPLETED' ? 'COMPLETED' as any : 'PENDING' as any,
    pixQrCode: undefined,
    createdAt: new Date(apiSale.createdAt),
    updatedAt: new Date(apiSale.updatedAt),
    user: apiSale.user ? mapApiUserToUser(apiSale.user) : undefined,
    cashRegister: apiSale.cashRegister ? mapApiCashRegisterToCashRegister(apiSale.cashRegister) : undefined,
    items: (apiSale.items && Array.isArray(apiSale.items)) ? apiSale.items.map(item => ({
      id: `${apiSale.id}-${item.productId}`,
      saleId: apiSale.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.price * item.quantity,
    })) : [],
  };
};

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  products: Product[];
  users: User[];
  currentCashRegister: CashRegister | null;
  currentCashSession: CashSession | null;
  cart: CartItem[];
  sales: Sale[];
  loading: boolean;
  error: string | null;
  cashRegisterOperationInProgress: boolean;
  isInitializing: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'SET_CASH_REGISTER'; payload: CashRegister | null }
  | { type: 'SET_CASH_SESSION'; payload: CashSession | null }
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_ITEM'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_SALES'; payload: Sale[] }
  | { type: 'ADD_SALE'; payload: Sale }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CASH_REGISTER_OPERATION'; payload: boolean }
  | { type: 'SET_INITIALIZING'; payload: boolean }
  | { type: 'RESET_APP' };

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  products: [],
  users: [],
  currentCashRegister: null,
  currentCashSession: null,
  cart: [],
  sales: [],
  loading: false,
  error: null,
  cashRegisterOperationInProgress: false,
  isInitializing: true,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => 
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(u => 
          u.id === action.payload.id ? action.payload : u
        ),
      };
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(u => u.id !== action.payload),
      };
    case 'SET_CASH_REGISTER':
      return { ...state, currentCashRegister: action.payload };
    case 'SET_CASH_SESSION':
      return { ...state, currentCashSession: action.payload };
    case 'ADD_TO_CART':
      const existingItem = state.cart.find(item => item.product.id === action.payload.product.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.product.id === action.payload.product.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }
      return { ...state, cart: [...state.cart, action.payload] };
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.product.id !== action.payload),
      };
    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.product.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'SET_SALES':
      return { ...state, sales: action.payload };
    case 'ADD_SALE':
      return { ...state, sales: [...state.sales, action.payload] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CASH_REGISTER_OPERATION':
      return { ...state, cashRegisterOperationInProgress: action.payload };
    case 'SET_INITIALIZING':
      return { ...state, isInitializing: action.payload };
    case 'RESET_APP':
      return {
        ...initialState,
        // Complete reset - no authentication state is preserved
        // Users must authenticate again after logout
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions using apiService
  loadUsers: () => Promise<void>;
  loadProducts: () => Promise<void>;
  loadCurrentCashRegister: () => Promise<void>;
  loadCurrentCashSession: () => Promise<void>;
  loadSales: () => Promise<void>;
  createUser: (userData: Partial<User>) => Promise<User>;
  updateUser: (id: string, userData: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  createProduct: (productData: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  openCashSession: (data: { userId: string; openingAmount: number }) => Promise<CashSession>;
  closeCashSession: (sessionId: string, data: { closingAmount: number }) => Promise<void>;
  openCashRegister: (data: { userId: string; openingAmount: number }) => Promise<CashRegister>;
  closeCashRegister: (id: string, data: { closingAmount: number }) => Promise<CashRegister>;
  createSale: (saleData: Partial<Sale>) => Promise<Sale>;
  getSalesByCashRegister: (cashRegisterId: string) => Promise<Sale[]>;
  getSalesBySession: (sessionId: string) => Promise<Sale[]>;
  authenticate: (email: string, password: string) => Promise<User | null>;
  getCurrentUser: () => Promise<User | null>;
  logout: () => Promise<void>;
  
  // Consolidation functions
  calculateConsolidationSummary: (sessionId: string, closingAmount: number) => Promise<ConsolidationSummary>;
  consolidateSession: (sessionId: string, closingAmount: number) => Promise<ConsolidatedData>;
  validateSessionForConsolidation: (sessionId: string) => Promise<{ canConsolidate: boolean; issues: string[]; }>;
  getConsolidatedData: (filters?: { userId?: string; startDate?: string; endDate?: string; }) => Promise<ConsolidatedData[]>;
  generateConsolidationReport: (userId: string, startDate?: string, endDate?: string) => Promise<{ consolidations: ConsolidatedData[]; summary: { totalConsolidations: number; totalRevenue: number; totalCashHandled: number; averageSessionValue: number; }; }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);



  // Initialize app without session persistence
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('=== INICIANDO APLICATIVO ===');
        console.log('1. Inicializando aplicativo sem persistência local...');
        
        console.log('2. Definindo inicialização como false...');
        dispatch({ type: 'SET_INITIALIZING', payload: false });
        console.log('3. Inicialização do aplicativo concluída com sucesso');
      } catch (error) {
        console.error('=== ERRO NA INICIALIZAÇÃO DO APLICATIVO ===');
        console.error('Erro completo:', error);
        console.error('Stack trace:', (error as any)?.stack);
        
        // Mesmo com erro, definir inicialização como false para não travar o app
        dispatch({ type: 'SET_INITIALIZING', payload: false });
        dispatch({ type: 'SET_ERROR', payload: 'Erro na inicialização do aplicativo' });
      }
    };
    initializeApp();
  }, []);

  // Helper functions using apiService
  const loadUsers = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const apiUsers = await apiService.getUsers();
      const users = apiUsers.map(mapApiUserToUser);
      dispatch({ type: 'SET_USERS', payload: users });
    } catch (error) {
      console.error('Error loading users:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar usuários' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadProducts = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const apiProducts = await apiService.getProducts();
      const products = apiProducts.map(mapApiProductToProduct);
      dispatch({ type: 'SET_PRODUCTS', payload: products });
    } catch (error) {
      console.error('Error loading products:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar produtos' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadCurrentCashRegister = async () => {
    try {
      // Check if user is authenticated in context first
      if (!state.user || !state.isAuthenticated) {
        console.log('User not authenticated in context, skipping cash register load');
        dispatch({ type: 'SET_CASH_REGISTER', payload: null });
        return;
      }
      
      console.log('Loading cash register for authenticated user:', state.user.email);
      console.log('User ID:', state.user.id);
      
      // Validate that the user still exists on the server
      try {
        console.log('Validating user exists on server...');
        await apiService.getUserById(state.user.id);
        console.log('User validation successful');
      } catch (userError: any) {
        console.error('User validation failed:', userError);
        if (userError.status === 404) {
          console.log('User no longer exists on server, clearing local data');
          await apiService.logout();
          dispatch({ type: 'SET_USER', payload: null });
          dispatch({ type: 'SET_AUTHENTICATED', payload: false });
          dispatch({ type: 'SET_CASH_REGISTER', payload: null });
          return;
        }
        throw userError;
      }
      
      // Primeiro, tentar buscar caixas abertas
      console.log('Fetching open cash registers for user...');
      const apiOpenCashRegisters = await apiService.getCashRegisters('OPEN', state.user.id);
      console.log('API response for open cash registers:', apiOpenCashRegisters);
      
      // Verificar se apiOpenCashRegisters é um array válido
      if (!Array.isArray(apiOpenCashRegisters)) {
        console.warn('API returned invalid data for open cash registers:', apiOpenCashRegisters);
        dispatch({ type: 'SET_CASH_REGISTER', payload: null });
        return;
      }
      
      console.log('Number of open cash registers found:', apiOpenCashRegisters.length);
      
      // Se há caixa aberto, usar ele
      if (apiOpenCashRegisters.length > 0) {
        console.log('Processing first open cash register:', apiOpenCashRegisters[0]);
        const openCashRegister = mapApiCashRegisterToCashRegister(apiOpenCashRegisters[0]);
        console.log('Mapped cash register:', openCashRegister);
        dispatch({ type: 'SET_CASH_REGISTER', payload: openCashRegister });
        console.log('Open cash register loaded successfully:', openCashRegister.id);
        return;
      }
      
      // Se não há caixa aberto, definir como null para mostrar status correto
      dispatch({ type: 'SET_CASH_REGISTER', payload: null });
      console.log('No open cash register found for user - status will show as closed');
    } catch (error: any) {
      console.error('Error loading cash register:', error);
      console.error('Error details:', {
        status: error.status,
        message: error.message,
        data: error.data,
        stack: error.stack
      });
      // Don't set error state for authentication-related issues
      if (error.status === 404 && error.data?.error === 'Usuário não encontrado') {
        console.log('User not found error, likely authentication issue');
        dispatch({ type: 'SET_CASH_REGISTER', payload: null });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar caixa registradora' });
      }
    }
  };

  const loadSales = async () => {
    try {
      const apiSales = await apiService.getSales();
      // Verificar se apiSales é um array válido antes de fazer o map
      if (!Array.isArray(apiSales)) {
        console.warn('API returned invalid data for sales:', apiSales);
        dispatch({ type: 'SET_SALES', payload: [] });
        return;
      }
      const sales = apiSales.map(mapApiSaleToSale);
      dispatch({ type: 'SET_SALES', payload: sales });
    } catch (error) {
      console.error('Error loading sales:', error);
      dispatch({ type: 'SET_SALES', payload: [] }); // Definir array vazio em caso de erro
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar vendas' });
    }
  };

  const createUser = async (userData: Partial<User>): Promise<User> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const apiUser = await apiService.createUser({
        email: userData.email!,
        name: userData.name!,
        password: userData.password!,
        role: userData.role as any,
      });
      const user = mapApiUserToUser(apiUser);
      dispatch({ type: 'ADD_USER', payload: user });
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao criar usuário' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updateData: any = {};
      if (userData.email) updateData.email = userData.email;
      if (userData.name) updateData.name = userData.name;
      if (userData.password) updateData.password = userData.password;
      if (userData.role) updateData.role = userData.role;
      
      const apiUser = await apiService.updateUser(id, updateData);
      const user = mapApiUserToUser(apiUser);
      dispatch({ type: 'UPDATE_USER', payload: user });
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar usuário' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await apiService.deleteUser(id);
      dispatch({ type: 'DELETE_USER', payload: id });
    } catch (error) {
      console.error('Error deleting user:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao excluir usuário' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createProduct = async (productData: Partial<Product>): Promise<Product> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const apiProduct = await apiService.createProduct({
        name: productData.name!,
        description: productData.description,
        price: productData.price!,
        imageUri: productData.imageUri,
      });
      const product = mapApiProductToProduct(apiProduct);
      dispatch({ type: 'ADD_PRODUCT', payload: product });
      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao criar produto' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updateData: any = {};
      if (productData.name) updateData.name = productData.name;
      if (productData.description !== undefined) updateData.description = productData.description;
      if (productData.price) updateData.price = productData.price;
      if (productData.imageUri !== undefined) updateData.imageUri = productData.imageUri;
      
      const apiProduct = await apiService.updateProduct(id, updateData);
      const product = mapApiProductToProduct(apiProduct);
      dispatch({ type: 'UPDATE_PRODUCT', payload: product });
      return product;
    } catch (error) {
      console.error('Error updating product:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar produto' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await apiService.deleteProduct(id);
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
    } catch (error) {
      console.error('Error deleting product:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao excluir produto' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const openCashRegister = async (data: { userId: string; openingAmount: number }): Promise<CashRegister> => {
    // Verificar se já há uma operação de caixa em andamento
    if (state.cashRegisterOperationInProgress) {
      console.log('Operação de caixa já em andamento, ignorando nova tentativa');
      throw new Error('Operação de caixa já em andamento');
    }

    // Verificar se já existe um caixa aberto no estado atual
    if (state.currentCashRegister && state.currentCashRegister.status === 'OPEN') {
      console.log('Caixa já aberto no estado atual, retornando caixa existente');
      return state.currentCashRegister;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_CASH_REGISTER_OPERATION', payload: true });
      
      // Verificar se já existe um caixa aberto para este usuário no servidor
      try {
        const existingCashRegisters = await apiService.getCashRegisters('OPEN', data.userId);
        if (Array.isArray(existingCashRegisters) && existingCashRegisters.length > 0) {
          const existingCashRegister = mapApiCashRegisterToCashRegister(existingCashRegisters[0]);
          dispatch({ type: 'SET_CASH_REGISTER', payload: existingCashRegister });
          console.log('Caixa já aberto encontrado no servidor, retornando caixa existente');
          return existingCashRegister;
        }
      } catch (checkError) {
        console.log('Erro ao verificar caixas existentes, prosseguindo com criação:', checkError);
      }
      
      // Se não há caixa aberto, criar um novo
      const apiCashRegister = await apiService.createCashRegister({ userId: data.userId, initialAmount: data.openingAmount });
      const cashRegister = mapApiCashRegisterToCashRegister(apiCashRegister);
      dispatch({ type: 'SET_CASH_REGISTER', payload: cashRegister });
      console.log('Novo caixa criado com sucesso');
      return cashRegister;
    } catch (error: any) {
      console.error('Error opening cash register:', error);
      
      // Tratamento específico para erro 409 (caixa já aberto)
      if (error.status === 409) {
        console.log('Erro 409 detectado, implementando estratégia de recuperação inteligente');
        
        // Estratégia 1: Tentar carregar caixa existente com retry
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`Tentativa ${attempt} de carregar caixa existente`);
            const existingCashRegisters = await apiService.getCashRegisters('OPEN', data.userId);
            
            if (Array.isArray(existingCashRegisters) && existingCashRegisters.length > 0) {
              const existingCashRegister = mapApiCashRegisterToCashRegister(existingCashRegisters[0]);
              dispatch({ type: 'SET_CASH_REGISTER', payload: existingCashRegister });
              dispatch({ type: 'SET_ERROR', payload: null }); // Limpar erro anterior
              console.log(`Caixa existente carregado com sucesso na tentativa ${attempt}`);
              return existingCashRegister;
            } else {
              console.log(`Tentativa ${attempt}: Nenhum caixa aberto encontrado ou dados inválidos, aguardando...`);
              // Aguardar um pouco antes da próxima tentativa
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          } catch (loadError: any) {
            console.error(`Erro na tentativa ${attempt} de carregar caixa existente:`, loadError);
            
            // Se for o último attempt, continuar com o erro
            if (attempt === 3) {
              console.error('Todas as tentativas de carregar caixa existente falharam');
              break;
            }
            
            // Aguardar antes da próxima tentativa
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
        
        // Se chegou até aqui, não conseguiu recuperar o caixa
        const errorMessage = 'Usuário já possui um caixa aberto. Tente novamente em alguns segundos.';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        throw new Error(errorMessage);
      }
      
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao abrir caixa registradora' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_CASH_REGISTER_OPERATION', payload: false });
    }
  };

  const closeCashRegister = async (id: string, data: { closingAmount: number }): Promise<CashRegister> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const apiCashRegister = await apiService.closeCashRegister(id, data.closingAmount);
      const cashRegister = mapApiCashRegisterToCashRegister(apiCashRegister);
      
      // Após fechar o caixa, definir currentCashRegister como null
      // para que a interface mostre o status correto (fechado)
      dispatch({ type: 'SET_CASH_REGISTER', payload: null });
      console.log('Cash register closed successfully, status updated to closed');
      
      return cashRegister;
    } catch (error) {
      console.error('Error closing cash register:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao fechar caixa registradora' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createSale = async (saleData: Partial<Sale>): Promise<Sale> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const apiSale = await apiService.createSale({
        cashRegisterId: saleData.cashRegisterId!,
        userId: saleData.userId!,
        items: saleData.items?.map(item => ({
          productId: item.productId,
          productName: '', // Will be filled by API
          quantity: item.quantity,
          price: item.unitPrice,
        })) || [],
        total: saleData.totalAmount!,
        paymentMethod: saleData.paymentMethod as any,
        status: 'COMPLETED',
      });
      const sale = mapApiSaleToSale(apiSale);
      dispatch({ type: 'ADD_SALE', payload: sale });
      return sale;
    } catch (error) {
      console.error('Error creating sale:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao criar venda' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const authenticate = async (email: string, password: string): Promise<User | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await apiService.login(email, password);
      const apiUser = result.user;
      if (apiUser) {
        const user = mapApiUserToUser(apiUser);
        
        // Set auth token in API service if provided
        if (result.token) {
          apiService.setAuthToken(result.token);
        }
        
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error authenticating:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao fazer login' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getCurrentUser = async (): Promise<User | null> => {
    try {
      const apiUser = await apiService.getCurrentUser();
      if (apiUser) {
        const user = mapApiUserToUser(apiUser);
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear all stored data and reset authentication state
      await apiService.logout();
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_AUTHENTICATED', payload: false });
      dispatch({ type: 'SET_CASH_REGISTER', payload: null });
      dispatch({ type: 'CLEAR_CART' });
      dispatch({ type: 'SET_SALES', payload: [] });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Force complete app state reset
      dispatch({ type: 'RESET_APP' });
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if logout fails, clear local state
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_AUTHENTICATED', payload: false });
      dispatch({ type: 'RESET_APP' });
    }
  };

  const getSalesByCashRegister = async (cashRegisterId: string): Promise<Sale[]> => {
    try {
      const apiSales = await apiService.getSales({ cashRegisterId });
      // Verificar se apiSales é um array válido antes de fazer o map
      if (!Array.isArray(apiSales)) {
        console.warn('API returned invalid data for sales:', apiSales);
        return [];
      }
      return apiSales.map(mapApiSaleToSale);
    } catch (error) {
      console.error('Error loading sales by cash register:', error);
      return []; // Retornar array vazio em caso de erro
    }
  };

  // Individual Cash Session Functions (Fallback using CashRegister)
  const loadCurrentCashSession = async () => {
    try {
      if (!state.user?.id) {
        console.log('No user logged in, cannot load cash session');
        return;
      }

      // Fallback: Use cash register as session since backend doesn't have sessions
      const apiCashRegisters = await apiService.getCashRegisters('OPEN', state.user.id);
      
      if (Array.isArray(apiCashRegisters) && apiCashRegisters.length > 0) {
        const cashRegister = apiCashRegisters[0];
        // Convert CashRegister to CashSession format
        const session: CashSession = {
          id: cashRegister.id,
          userId: cashRegister.userId,
          sessionName: `Sessão ${new Date().toLocaleDateString()}`,
          status: CashSessionStatus.ACTIVE,
          openingAmount: cashRegister.initialAmount,
          closingAmount: undefined,
          openedAt: new Date(cashRegister.createdAt),
          closedAt: undefined,
          isConsolidated: false,
          createdAt: new Date(cashRegister.createdAt),
          updatedAt: new Date(cashRegister.updatedAt),
          user: cashRegister.user ? mapApiUserToUser(cashRegister.user) : undefined,
          cashRegisters: [mapApiCashRegisterToCashRegister(cashRegister)]
        };
        dispatch({ type: 'SET_CASH_SESSION', payload: session });
        console.log('Active cash session loaded (from cash register):', session.id);
      } else {
        dispatch({ type: 'SET_CASH_SESSION', payload: null });
        console.log('No active cash session found for user');
      }
    } catch (error: any) {
      console.error('Error loading cash session:', error);
      dispatch({ type: 'SET_CASH_SESSION', payload: null });
      if (error.status !== 404) {
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar sessão de caixa' });
      }
    }
  };

  const openCashSession = async (data: { userId: string; openingAmount: number }): Promise<CashSession> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_CASH_REGISTER_OPERATION', payload: true });
      
      // Fallback: Use cash register system since backend doesn't have sessions
      // Check if user already has an active cash register
      const existingCashRegisters = await apiService.getCashRegisters('OPEN', data.userId);
      if (Array.isArray(existingCashRegisters) && existingCashRegisters.length > 0) {
        const cashRegister = existingCashRegisters[0];
        // Convert to session format
        const session: CashSession = {
          id: cashRegister.id,
          userId: cashRegister.userId,
          sessionName: `Sessão ${new Date().toLocaleDateString()}`,
          status: CashSessionStatus.ACTIVE,
          openingAmount: cashRegister.initialAmount,
          closingAmount: undefined,
          openedAt: new Date(cashRegister.createdAt),
          closedAt: undefined,
          isConsolidated: false,
          createdAt: new Date(cashRegister.createdAt),
          updatedAt: new Date(cashRegister.updatedAt),
          user: cashRegister.user ? mapApiUserToUser(cashRegister.user) : undefined,
          cashRegisters: [mapApiCashRegisterToCashRegister(cashRegister)]
        };
        dispatch({ type: 'SET_CASH_SESSION', payload: session });
        return session;
      }

      // Create new cash register (acting as session)
      const apiCashRegister = await apiService.createCashRegister({
        userId: data.userId,
        initialAmount: data.openingAmount
      });
      
      // Convert to session format
      const session: CashSession = {
        id: apiCashRegister.id,
        userId: apiCashRegister.userId,
        sessionName: `Sessão ${new Date().toLocaleDateString()}`,
        status: CashSessionStatus.ACTIVE,
        openingAmount: apiCashRegister.initialAmount,
        closingAmount: undefined,
        openedAt: new Date(apiCashRegister.createdAt),
        closedAt: undefined,
        isConsolidated: false,
        createdAt: new Date(apiCashRegister.createdAt),
        updatedAt: new Date(apiCashRegister.updatedAt),
        user: apiCashRegister.user ? mapApiUserToUser(apiCashRegister.user) : undefined,
        cashRegisters: [mapApiCashRegisterToCashRegister(apiCashRegister)]
      };
      
      dispatch({ type: 'SET_CASH_SESSION', payload: session });
      dispatch({ type: 'SET_ERROR', payload: null });
      console.log('Cash session opened successfully (using cash register):', session.id);
      
      return session;
    } catch (error: any) {
      console.error('Error opening cash session:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao abrir sessão de caixa' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_CASH_REGISTER_OPERATION', payload: false });
    }
  };

  const closeCashSession = async (sessionId: string, data: { closingAmount: number }): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Fallback: Close the cash register that represents this session
      await apiService.closeCashRegister(sessionId, data.closingAmount);
      
      // Clear current session from state
      dispatch({ type: 'SET_CASH_SESSION', payload: null });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      console.log('Cash session closed successfully (using cash register)');
    } catch (error: any) {
      console.error('Error closing cash session:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao fechar sessão de caixa' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getSalesBySession = async (sessionId: string): Promise<Sale[]> => {
    try {
      // Fallback: Get sales by cash register ID since session uses cash register ID
      const apiSales = await apiService.getSales({ cashRegisterId: sessionId });
      if (!Array.isArray(apiSales)) {
        console.warn('API returned invalid data for session sales:', apiSales);
        return [];
      }
      return apiSales.map(mapApiSaleToSale);
    } catch (error) {
      console.error('Error loading sales by session:', error);
      return [];
    }
  };

  // Consolidation functions
  const calculateConsolidationSummary = async (sessionId: string, closingAmount: number): Promise<ConsolidationSummary> => {
    try {
      return await ConsolidationService.calculateConsolidationSummary(sessionId, closingAmount);
    } catch (error) {
      console.error('Error calculating consolidation summary:', error);
      throw error;
    }
  };

  const consolidateSession = async (sessionId: string, closingAmount: number): Promise<ConsolidatedData> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const consolidatedData = await ConsolidationService.consolidateSession(sessionId, closingAmount);
      dispatch({ type: 'SET_ERROR', payload: null });
      return consolidatedData;
    } catch (error: any) {
      console.error('Error consolidating session:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao consolidar sessão de caixa' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const validateSessionForConsolidation = async (sessionId: string): Promise<{ canConsolidate: boolean; issues: string[]; }> => {
    try {
      return await ConsolidationService.validateSessionForConsolidation(sessionId);
    } catch (error) {
      console.error('Error validating session for consolidation:', error);
      return { canConsolidate: false, issues: ['Erro ao validar sessão'] };
    }
  };

  const getConsolidatedData = async (filters?: { userId?: string; startDate?: string; endDate?: string; }): Promise<ConsolidatedData[]> => {
    try {
      return await ConsolidationService.getConsolidatedData(filters);
    } catch (error) {
      console.error('Error getting consolidated data:', error);
      return [];
    }
  };

  const generateConsolidationReport = async (
    userId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<{ consolidations: ConsolidatedData[]; summary: { totalConsolidations: number; totalRevenue: number; totalCashHandled: number; averageSessionValue: number; }; }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const report = await ConsolidationService.generateConsolidationReport(userId, startDate, endDate);
      dispatch({ type: 'SET_ERROR', payload: null });
      return report;
    } catch (error: any) {
      console.error('Error generating consolidation report:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao gerar relatório de consolidação' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    loadUsers,
    loadProducts,
    loadCurrentCashRegister,
    loadCurrentCashSession,
    loadSales,
    createUser,
    updateUser,
    deleteUser,
    createProduct,
    updateProduct,
    deleteProduct,
    openCashSession,
    closeCashSession,
    openCashRegister,
    closeCashRegister,
    createSale,
    getSalesByCashRegister,
    getSalesBySession,
    authenticate,
    getCurrentUser,
    logout,
    // Consolidation functions
    calculateConsolidationSummary,
    consolidateSession,
    validateSessionForConsolidation,
    getConsolidatedData,
    generateConsolidationReport,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export type { CartItem, AppContextType };
export { mapApiConsolidatedDataToConsolidatedData };