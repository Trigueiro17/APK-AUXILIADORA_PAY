import { Platform } from 'react-native';
import NfcManager, { NfcEvents, NfcTech, Ndef } from 'react-native-nfc-manager';

// Interfaces para NFC
export interface NFCTag {
  id: string;
  type: string;
  techTypes: string[];
  maxSize?: number;
  isWritable?: boolean;
  canMakeReadOnly?: boolean;
}

export interface NFCMessage {
  id: string;
  type: 'payment' | 'receipt' | 'data';
  amount?: number;
  description?: string;
  timestamp: Date;
  data: any;
}

export interface NFCPayment {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  tagId?: string;
}

export interface NFCState {
  enabled: boolean;
  supported: boolean;
  scanning: boolean;
  writing: boolean;
  lastTag?: NFCTag;
  lastMessage?: NFCMessage;
  payments: NFCPayment[];
  error?: string;
}

class NFCService {
  private state: NFCState = {
    enabled: false,
    supported: false,
    scanning: false,
    writing: false,
    payments: [],
  };

  private listeners: ((state: NFCState) => void)[] = [];

  constructor() {
    // Inicializar de forma assíncrona para evitar problemas de contexto
    setTimeout(() => {
      this.initializeNFC().catch(error => {
        console.error('Erro na inicialização NFC:', error);
      });
    }, 100);
  }

  private async initializeNFC() {
    try {
      // Carregar pagamentos salvos primeiro
      await this.loadSavedPayments();
      
      // Verificar se NFC está habilitado nas configurações
      const nfcSettingEnabled = await this.checkNFCSettingsEnabled();
      if (!nfcSettingEnabled) {
        console.log('NFC desabilitado nas configurações');
        this.state.supported = false;
        this.state.enabled = false;
        this.notifyListeners();
        return;
      }
      
      if (Platform.OS !== 'android') {
        console.warn('NFC is only supported on Android');
        this.state.supported = false;
        this.state.enabled = false;
        this.notifyListeners();
        return;
      }

      // Tentar inicializar NFC Manager de forma segura
      try {
        await NfcManager.start();
        
        // Verificar suporte NFC
        const isSupported = await this.checkNFCSupport();
        this.state.supported = isSupported;
        
        if (isSupported) {
          // Verificar se NFC está habilitado
          const isEnabled = await this.checkNFCEnabled();
          this.state.enabled = isEnabled;
          
          // Configurar listeners apenas se suportado
          this.setupEventListeners();
        } else {
          this.state.enabled = false;
        }
      } catch (nfcError) {
        console.warn('NFC não disponível neste ambiente:', nfcError);
        this.state.supported = false;
        this.state.enabled = false;
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('Erro ao inicializar serviço NFC:', error);
      this.state.supported = false;
      this.state.enabled = false;
      this.state.error = 'NFC não disponível';
      this.notifyListeners();
    }
  }

  private async checkNFCSupport(): Promise<boolean> {
    try {
      const supported = await NfcManager.isSupported();
      return supported === true;
    } catch (error) {
      console.error('Erro ao verificar suporte NFC:', error);
      return false;
    }
  }

  private async checkNFCEnabled(): Promise<boolean> {
    try {
      const enabled = await NfcManager.isEnabled();
      return enabled === true;
    } catch (error) {
      console.error('Erro ao verificar se NFC está habilitado:', error);
      return false;
    }
  }

  private async checkNFCSettingsEnabled(): Promise<boolean> {
    try {
      // NFC sempre habilitado por padrão (sem armazenamento local)
      return true;
    } catch (error) {
      console.error('Erro ao verificar configuração NFC:', error);
      return true; // Default true em caso de erro
    }
  }

  private setupEventListeners() {
    try {
      // Listener para tags descobertas
      NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: any) => {
        this.handleTagDiscovered(tag);
      });

      // Listener para mudanças de estado do NFC
      NfcManager.setEventListener(NfcEvents.StateChanged, (state: any) => {
        this.state.enabled = state?.enabled || false;
        this.notifyListeners();
      });
    } catch (error) {
      console.error('Erro ao configurar listeners NFC:', error);
    }
  }

  private handleTagDiscovered(tag: any) {
    const nfcTag: NFCTag = {
      id: tag.id || '',
      type: tag.type || 'unknown',
      techTypes: tag.techTypes || [],
      maxSize: tag.maxSize,
      isWritable: tag.isWritable,
      canMakeReadOnly: tag.canMakeReadOnly,
    };

    this.state.lastTag = nfcTag;
    this.notifyListeners();

    // Tentar ler dados da tag
    this.readTagData(tag);
  }

  private async readTagData(tag: any) {
    try {
      // Conectar à tag
      await NfcManager.requestTechnology(NfcTech.Ndef);
      
      // Ler mensagem NDEF
      const tag = await NfcManager.getTag();
      if (tag && tag.ndefMessage && tag.ndefMessage.length > 0) {
        const message = this.parseNdefMessage(tag.ndefMessage[0]);
        if (message) {
          this.state.lastMessage = message;
          this.notifyListeners();
          
          // Se for um pagamento, processar
          if (message.type === 'payment') {
            await this.processPaymentFromTag(message);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao ler dados da tag:', error);
    } finally {
      // Cancelar tecnologia
      NfcManager.cancelTechnologyRequest();
    }
  }

  private parseNdefMessage(record: any): NFCMessage | null {
    try {
      if (record.payload) {
        // Converter payload para string
        const payloadString = String.fromCharCode.apply(null, Array.from(new Uint8Array(record.payload)));
        // Remover caracteres de controle (primeiro byte é geralmente o código de idioma)
        const cleanPayload = payloadString.substring(3); // Remove os 3 primeiros bytes
        
        const data = JSON.parse(cleanPayload);
        return {
          id: data.id || Date.now().toString(),
          type: data.type || 'data',
          amount: data.amount,
          description: data.description,
          timestamp: new Date(data.timestamp || Date.now()),
          data: data,
        };
      }
    } catch (error) {
      console.error('Erro ao analisar mensagem NDEF:', error);
    }
    return null;
  }

  private async processPaymentFromTag(message: NFCMessage) {
    if (message.type === 'payment' && message.amount) {
      const payment: NFCPayment = {
        id: message.id,
        amount: message.amount,
        currency: 'BRL',
        description: message.description || 'Pagamento NFC',
        status: 'completed',
        timestamp: message.timestamp,
        tagId: this.state.lastTag?.id,
      };

      this.state.payments.push(payment);
      await this.savePayments();
      this.notifyListeners();
    }
  }

  // Métodos públicos
  async startScanning(): Promise<boolean> {
    try {
      // Verificar se NFC está habilitado nas configurações
      const nfcSettingEnabled = await this.checkNFCSettingsEnabled();
      if (!nfcSettingEnabled) {
        console.warn('NFC desabilitado nas configurações');
        this.state.error = 'NFC desabilitado nas configurações';
        this.notifyListeners();
        return false;
      }

      if (!this.state.supported || !this.state.enabled) {
        console.warn('NFC não está disponível para escaneamento');
        return false;
      }

      await NfcManager.registerTagEvent();
      this.state.scanning = true;
      this.state.error = undefined;
      this.notifyListeners();
      return true;
    } catch (error) {
      console.warn('NFC não disponível para iniciar escaneamento:', error);
      this.state.scanning = false;
      this.state.error = 'NFC não disponível';
      this.notifyListeners();
      return false;
    }
  }

  async stopScanning(): Promise<void> {
    try {
      if (this.state.supported && this.state.enabled) {
        await NfcManager.unregisterTagEvent();
      }
      this.state.scanning = false;
      this.notifyListeners();
    } catch (error) {
      console.warn('NFC não disponível para parar escaneamento:', error);
      this.state.scanning = false;
      this.notifyListeners();
    }
  }

  async writePaymentToTag(amount: number, description: string): Promise<boolean> {
    try {
      // Verificar se NFC está habilitado nas configurações
      const nfcSettingEnabled = await this.checkNFCSettingsEnabled();
      if (!nfcSettingEnabled) {
        throw new Error('NFC desabilitado nas configurações');
      }

      if (!this.state.supported || !this.state.enabled) {
        throw new Error('NFC não está disponível');
      }

      const paymentData = {
        id: Date.now().toString(),
        type: 'payment',
        amount: amount,
        description: description,
        timestamp: new Date().toISOString(),
      };

      this.state.writing = true;
      this.notifyListeners();

      // Aguardar tag para escrita
      await NfcManager.requestTechnology(NfcTech.Ndef);
      
      // Criar registro NDEF
      const bytes = Ndef.encodeMessage([
        Ndef.textRecord(JSON.stringify(paymentData), 'en', 'id')
      ]);
      
      // Escrever na tag
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      
      this.state.writing = false;
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Erro ao escrever na tag NFC:', error);
      this.state.writing = false;
      this.state.error = error instanceof Error ? error.message : 'Erro ao escrever na tag';
      this.notifyListeners();
      return false;
    } finally {
      // Cancelar tecnologia
      NfcManager.cancelTechnologyRequest();
    }
  }

  async createPayment(amount: number, description: string): Promise<NFCPayment> {
    const payment: NFCPayment = {
      id: Date.now().toString(),
      amount: amount,
      currency: 'BRL',
      description: description,
      status: 'pending',
      timestamp: new Date(),
    };

    this.state.payments.push(payment);
    await this.savePayments();
    this.notifyListeners();

    return payment;
  }

  async completePayment(paymentId: string): Promise<boolean> {
    const payment = this.state.payments.find(p => p.id === paymentId);
    if (payment) {
      payment.status = 'completed';
      await this.savePayments();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  async cancelPayment(paymentId: string): Promise<boolean> {
    const payment = this.state.payments.find(p => p.id === paymentId);
    if (payment) {
      payment.status = 'failed';
      await this.savePayments();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  private async loadSavedPayments(): Promise<void> {
    // NFC payments are stored only in memory
    // No persistent storage to ensure remote-only operation
    console.log('NFC payments loaded from memory only');
  }

  private async savePayments(): Promise<void> {
    // NFC payments are stored only in memory
    // No persistent storage to ensure remote-only operation
    console.log('NFC payments stored in memory only');
  }

  // Gerenciamento de listeners
  addListener(callback: (state: NFCState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Método para reinicializar NFC quando configuração mudar
  async reinitialize(): Promise<void> {
    // Parar escaneamento se estiver ativo
    if (this.state.scanning) {
      await this.stopScanning();
    }
    
    // Reinicializar
    await this.initializeNFC();
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback({ ...this.state });
      } catch (error) {
        console.error('Erro ao notificar listener:', error);
      }
    });
  }

  // Getters
  getState(): NFCState {
    return {
      ...this.state,
      payments: this.state.payments || [],
    };
  }

  isSupported(): boolean {
    return this.state.supported;
  }

  isEnabled(): boolean {
    return this.state.enabled;
  }

  getPayments(): NFCPayment[] {
    return [...this.state.payments];
  }

  getPaymentById(id: string): NFCPayment | undefined {
    return this.state.payments.find(p => p.id === id);
  }

  // Cleanup
  destroy(): void {
    try {
      this.stopScanning();
      this.listeners = [];
      
      if (this.state.supported) {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
        NfcManager.setEventListener(NfcEvents.StateChanged, null);
        // NfcManager.stop() não existe na versão atual
        // Usar cancelTechnologyRequest() se necessário
      }
    } catch (error) {
      console.error('Erro ao destruir serviço NFC:', error);
    }
  }
}

// Instância singleton
export const nfcService = new NFCService();
export default nfcService;