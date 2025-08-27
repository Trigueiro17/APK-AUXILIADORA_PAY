import { auxiliadoraApiClient as apiClient } from './api-client';
// Logger removido para compatibilidade com frontend

interface SyncStatus {
  lastSync: Date;
  pendingOperations: number;
  isOnline: boolean;
  errors: string[];
}

interface PendingOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'sale' | 'product' | 'user' | 'cashRegister';
  data: any;
  timestamp: Date;
  retryCount: number;
}

class SyncService {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private pendingOperations: PendingOperation[] = [];
  private isOnline = true;
  private lastSync = new Date();
  private maxRetries = 3;
  private syncIntervalMs = 5 * 60 * 1000; // 5 minutos
  private listeners: ((status: SyncStatus) => void)[] = [];

  constructor() {
    this.initializeSync();
    this.setupNetworkMonitoring();
  }

  /**
   * Inicializa o serviço de sincronização
   */
  private initializeSync() {
    // Carregar operações pendentes do localStorage
    this.loadPendingOperations();
    
    // Iniciar sincronização automática
    this.startAutoSync();
    
    console.log('Serviço de sincronização inicializado');
  }

  /**
   * Configura monitoramento de rede
   */
  private setupNetworkMonitoring() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners();
        this.processPendingOperations();
        console.log('Conexão restaurada - processando operações pendentes');
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners();
        console.warn('Conexão perdida - modo offline ativado');
      });

      this.isOnline = navigator.onLine;
    }
  }

  /**
   * Inicia sincronização automática
   */
  startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.sync();
    }, this.syncIntervalMs);
  }

  /**
   * Para sincronização automática
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Configura intervalo de sincronização
   */
  setSyncInterval(minutes: number) {
    this.syncIntervalMs = minutes * 60 * 1000;
    this.startAutoSync();
  }

  /**
   * Executa sincronização completa
   */
  async sync(): Promise<void> {
    if (!this.isOnline) {
      console.warn('Tentativa de sincronização sem conexão');
      return;
    }

    try {
      console.log('Iniciando sincronização');
      
      // Processar operações pendentes primeiro
      await this.processPendingOperations();
      
      // Sincronizar dados do servidor
      await this.syncFromServer();
      
      this.lastSync = new Date();
      this.notifyListeners();
      
      console.log('Sincronização concluída com sucesso');
    } catch (error) {
      console.error('Erro durante sincronização:', error);
      throw error;
    }
  }

  /**
   * Processa operações pendentes
   */
  private async processPendingOperations(): Promise<void> {
    const operations = [...this.pendingOperations];
    
    for (const operation of operations) {
      try {
        await this.executeOperation(operation);
        this.removePendingOperation(operation.id);
        console.log(`Operação ${operation.id} executada com sucesso`);
      } catch (error) {
        operation.retryCount++;
        
        if (operation.retryCount >= this.maxRetries) {
          console.error(`Operação ${operation.id} falhou após ${this.maxRetries} tentativas:`, error);
          this.removePendingOperation(operation.id);
        } else {
          console.warn(`Operação ${operation.id} falhou, tentativa ${operation.retryCount}/${this.maxRetries}:`, error);
        }
      }
    }
    
    this.savePendingOperations();
  }

  /**
   * Executa uma operação específica
   */
  private async executeOperation(operation: PendingOperation): Promise<void> {
    switch (operation.entity) {
      case 'sale':
        await this.executeSaleOperation(operation);
        break;
      case 'product':
        await this.executeProductOperation(operation);
        break;
      case 'user':
        await this.executeUserOperation(operation);
        break;
      case 'cashRegister':
        await this.executeCashRegisterOperation(operation);
        break;
      default:
        throw new Error(`Tipo de entidade não suportado: ${operation.entity}`);
    }
  }

  /**
   * Executa operação de venda
   */
  private async executeSaleOperation(operation: PendingOperation): Promise<void> {
    switch (operation.type) {
      case 'CREATE':
        await apiClient.createSale(operation.data);
        break;
      case 'UPDATE':
        await apiClient.updateSale(operation.data.id, operation.data);
        break;
      case 'DELETE':
        await apiClient.deleteSale(operation.data.id);
        break;
    }
  }

  /**
   * Executa operação de produto
   */
  private async executeProductOperation(operation: PendingOperation): Promise<void> {
    switch (operation.type) {
      case 'CREATE':
        await apiClient.createProduct(operation.data);
        break;
      case 'UPDATE':
        await apiClient.updateProduct(operation.data.id, operation.data);
        break;
      case 'DELETE':
        await apiClient.deleteProduct(operation.data.id);
        break;
    }
  }

  /**
   * Executa operação de usuário
   */
  private async executeUserOperation(operation: PendingOperation): Promise<void> {
    switch (operation.type) {
      case 'CREATE':
        await apiClient.createUser(operation.data);
        break;
      case 'UPDATE':
        await apiClient.updateUser(operation.data.id, operation.data);
        break;
      case 'DELETE':
        await apiClient.deleteUser(operation.data.id);
        break;
    }
  }

  /**
   * Executa operação de caixa registradora
   */
  private async executeCashRegisterOperation(operation: PendingOperation): Promise<void> {
    switch (operation.type) {
      case 'CREATE':
        await apiClient.createCashRegister(operation.data);
        break;
      case 'UPDATE':
        await apiClient.updateCashRegister(operation.data.id, operation.data);
        break;
      case 'DELETE':
        await apiClient.deleteCashRegister(operation.data.id);
        break;
    }
  }

  /**
   * Sincroniza dados do servidor
   */
  private async syncFromServer(): Promise<void> {
    try {
      // Buscar dados atualizados do servidor
      const [sales, products, users, cashRegisters] = await Promise.all([
        apiClient.getSales(),
        apiClient.getProducts(),
        apiClient.getUsers(),
        apiClient.getCashRegisters()
      ]);

      // Atualizar cache local (se implementado)
      this.updateLocalCache();
      
      console.log(`Sincronizados: ${sales.length} vendas, ${products.length} produtos, ${users.length} usuários, ${cashRegisters.length} caixas`);
    } catch (error) {
      console.error('Erro ao sincronizar dados do servidor:', error);
      throw error;
    }
  }

  /**
   * Atualiza cache local
   */
  private updateLocalCache() {
    // Implementar cache local se necessário
    // Por exemplo, usando IndexedDB ou localStorage
    console.log('Cache local atualizado');
  }

  /**
   * Adiciona operação pendente
   */
  addPendingOperation(
    type: PendingOperation['type'],
    entity: PendingOperation['entity'],
    data: any
  ): string {
    const operation: PendingOperation = {
      id: `${entity}_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      entity,
      data,
      timestamp: new Date(),
      retryCount: 0
    };

    this.pendingOperations.push(operation);
    this.savePendingOperations();
    this.notifyListeners();

    console.log(`Operação pendente adicionada: ${operation.id}`);
    
    // Tentar executar imediatamente se online
    if (this.isOnline) {
      this.processPendingOperations().catch(error => {
        console.error('Erro ao processar operação pendente:', error);
      });
    }

    return operation.id;
  }

  /**
   * Remove operação pendente
   */
  private removePendingOperation(id: string) {
    this.pendingOperations = this.pendingOperations.filter(op => op.id !== id);
    this.savePendingOperations();
    this.notifyListeners();
  }

  /**
   * Salva operações pendentes no localStorage
   */
  private savePendingOperations() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pendingOperations', JSON.stringify(this.pendingOperations));
      } catch (error) {
        console.error('Erro ao salvar operações pendentes:', error);
      }
    }
  }

  /**
   * Carrega operações pendentes do localStorage
   */
  private loadPendingOperations() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('pendingOperations');
        if (stored) {
          this.pendingOperations = JSON.parse(stored).map((op: any) => ({
            ...op,
            timestamp: new Date(op.timestamp)
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar operações pendentes:', error);
        this.pendingOperations = [];
      }
    }
  }

  /**
   * Obtém status da sincronização
   */
  getStatus(): SyncStatus {
    return {
      lastSync: this.lastSync,
      pendingOperations: this.pendingOperations.length,
      isOnline: this.isOnline,
      errors: this.pendingOperations
        .filter(op => op.retryCount >= this.maxRetries)
        .map(op => `Operação ${op.id} falhou após ${this.maxRetries} tentativas`)
    };
  }

  /**
   * Adiciona listener para mudanças de status
   */
  addStatusListener(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
  }

  /**
   * Remove listener
   */
  removeStatusListener(listener: (status: SyncStatus) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notifica listeners sobre mudanças
   */
  private notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Erro ao notificar listener:', error);
      }
    });
  }

  /**
   * Limpa todas as operações pendentes
   */
  clearPendingOperations() {
    this.pendingOperations = [];
    this.savePendingOperations();
    this.notifyListeners();
    console.log('Operações pendentes limpas');
  }

  /**
   * Força sincronização manual
   */
  async forcSync(): Promise<void> {
    console.log('Sincronização manual iniciada');
    await this.sync();
  }

  /**
   * Método para tentar novamente uma venda específica
   */
  async retrySale(saleId: string): Promise<void> {
    const pendingOp = this.pendingOperations.find(op => op.id === saleId && op.entity === 'sale');
    
    if (!pendingOp) {
      throw new Error('Venda não encontrada nas operações pendentes');
    }
    
    try {
      await this.executeOperation(pendingOp);
      this.removePendingOperation(saleId);
      this.notifyListeners();
      console.log(`Venda ${saleId} sincronizada com sucesso`);
    } catch (error) {
      pendingOp.retryCount++;
      this.savePendingOperations();
      this.notifyListeners();
      console.error(`Erro ao tentar sincronizar venda ${saleId}:`, error);
      throw error;
    }
  }

  /**
   * Método para obter vendas pendentes
   */
  getPendingSales(): PendingOperation[] {
    return this.pendingOperations.filter(op => op.entity === 'sale');
  }

  /**
   * Método para adicionar venda pendente
   */
  addPendingSale(sale: any): string {
    return this.addPendingOperation('CREATE', 'sale', sale);
  }

  /**
   * Destrói o serviço
   */
  destroy() {
    this.stopAutoSync();
    this.listeners = [];
    console.log('Serviço de sincronização destruído');
  }
}

// Instância singleton
export const syncService = new SyncService();

// Funções de conveniência para operações offline
export const offlineOperations = {
  createSale: (data: any) => syncService.addPendingOperation('CREATE', 'sale', data),
  updateSale: (data: any) => syncService.addPendingOperation('UPDATE', 'sale', data),
  deleteSale: (data: any) => syncService.addPendingOperation('DELETE', 'sale', data),
  
  createProduct: (data: any) => syncService.addPendingOperation('CREATE', 'product', data),
  updateProduct: (data: any) => syncService.addPendingOperation('UPDATE', 'product', data),
  deleteProduct: (data: any) => syncService.addPendingOperation('DELETE', 'product', data),
  
  createUser: (data: any) => syncService.addPendingOperation('CREATE', 'user', data),
  updateUser: (data: any) => syncService.addPendingOperation('UPDATE', 'user', data),
  deleteUser: (data: any) => syncService.addPendingOperation('DELETE', 'user', data),
  
  createCashRegister: (data: any) => syncService.addPendingOperation('CREATE', 'cashRegister', data),
  updateCashRegister: (data: any) => syncService.addPendingOperation('UPDATE', 'cashRegister', data),
  deleteCashRegister: (data: any) => syncService.addPendingOperation('DELETE', 'cashRegister', data)
};

export default syncService;