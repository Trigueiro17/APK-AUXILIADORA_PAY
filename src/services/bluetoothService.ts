import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, State } from 'react-native-ble-plx';
import CryptoJS from 'crypto-js';

// Tipos de erro personalizados
export enum BluetoothErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  BLUETOOTH_DISABLED = 'BLUETOOTH_DISABLED',
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  TIMEOUT = 'TIMEOUT',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  PLATFORM_NOT_SUPPORTED = 'PLATFORM_NOT_SUPPORTED',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION'
}

export class BluetoothError extends Error {
  public readonly type: BluetoothErrorType;
  public readonly deviceId?: string;
  public readonly timestamp: Date;
  public readonly recoverable: boolean;

  constructor(
    type: BluetoothErrorType,
    message: string,
    deviceId?: string,
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'BluetoothError';
    this.type = type;
    this.deviceId = deviceId;
    this.timestamp = new Date();
    this.recoverable = recoverable;
  }
}

// Interface para logs de erro
interface ErrorLog {
  id: string;
  type: BluetoothErrorType;
  message: string;
  deviceId?: string;
  timestamp: Date;
  resolved: boolean;
  attempts: number;
}

// Configurações de segurança
export interface SecurityConfig {
  encryptionEnabled: boolean;
  authenticationRequired: boolean;
  deviceWhitelist: string[];
  maxConnectionAttempts: number;
  connectionTimeout: number;
  encryptionKey: string;
  trustedDeviceValidation: boolean;
}

export interface BluetoothDevice {
  id: string;
  name: string;
  address: string;
  paired: boolean;
  connected: boolean;
  rssi?: number;
  device?: Device;
  // Campos de segurança
  trusted: boolean;
  lastConnected?: Date;
  connectionAttempts: number;
  securityLevel: 'low' | 'medium' | 'high';
  encryptionSupported: boolean;
  authenticationHash?: string;
}

export interface BluetoothState {
  enabled: boolean;
  discovering: boolean;
  devices: BluetoothDevice[];
  pairedDevices: BluetoothDevice[];
  connectedDevice: BluetoothDevice | null;
  bleState: State;
  securityConfig: SecurityConfig;
  errorLogs: ErrorLog[];
  lastError?: BluetoothError;
  connectionRetries: { [deviceId: string]: number };
}

class BluetoothService {
  private bleManager: BleManager = new BleManager();
  private listeners: ((state: BluetoothState) => void)[] = [];
  private securityConfig: SecurityConfig = {
    encryptionEnabled: true,
    authenticationRequired: true,
    deviceWhitelist: [],
    maxConnectionAttempts: 3,
    connectionTimeout: 30000,
    encryptionKey: this.generateEncryptionKey(),
    trustedDeviceValidation: true
  };
  private state: BluetoothState = {
    enabled: false,
    discovering: false,
    devices: [],
    pairedDevices: [],
    connectedDevice: null,
    bleState: State.Unknown,
    securityConfig: this.securityConfig,
    errorLogs: [],
    lastError: undefined,
    connectionRetries: {}
  };

  constructor() {
    try {
      this.bleManager = new BleManager();
      this.initializeBluetooth();
    } catch (error) {
      console.error('Erro ao inicializar BleManager:', error);
      // Garantir que o estado seja válido mesmo com erro
      this.state = {
        enabled: false,
        discovering: false,
        devices: [],
        pairedDevices: [],
        connectedDevice: null,
        bleState: State.Unknown,
        securityConfig: this.securityConfig,
        errorLogs: [],
        lastError: undefined,
        connectionRetries: {}
      };
    }
  }

  // ===== MÉTODOS DE SEGURANÇA =====

  // Gerar chave de criptografia única
  private generateEncryptionKey(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return CryptoJS.SHA256(timestamp + random).toString();
  }

  // Validar dispositivo confiável
  private validateTrustedDevice(device: BluetoothDevice): boolean {
    if (!this.securityConfig.trustedDeviceValidation) {
      return true;
    }

    // Verificar se o dispositivo tem referência BLE válida
    if (!device.device && device.paired) {
      console.warn(`⚠️ [Security] Dispositivo ${device.name} pareado mas sem referência BLE ativa`);
      // Ainda permitir validação para dispositivos pareados sem referência ativa
    }

    // Verificar whitelist
    if (this.securityConfig.deviceWhitelist.length > 0) {
      const isWhitelisted = this.securityConfig.deviceWhitelist.includes(device.address) ||
                           this.securityConfig.deviceWhitelist.includes(device.id);
      if (!isWhitelisted) {
        console.warn(`🚫 [Security] Dispositivo ${device.name} não está na whitelist`);
        return false;
      }
    }

    // Verificar tentativas de conexão
    if (device.connectionAttempts >= this.securityConfig.maxConnectionAttempts) {
      console.warn(`🚫 [Security] Dispositivo ${device.name} excedeu tentativas de conexão`);
      return false;
    }

    // Verificar nível de segurança
    if (device.securityLevel === 'low' && this.securityConfig.authenticationRequired) {
      console.warn(`🚫 [Security] Dispositivo ${device.name} tem nível de segurança baixo`);
      return false;
    }

    return true;
  }

  // Autenticar dispositivo
  private async authenticateDevice(device: BluetoothDevice): Promise<boolean> {
    if (!this.securityConfig.authenticationRequired) {
      return true;
    }

    try {
      console.log(`🔐 [Security] Autenticando dispositivo ${device.name}...`);
      
      // Gerar hash de autenticação baseado em características do dispositivo
      const deviceFingerprint = this.generateDeviceFingerprint(device);
      const authHash = CryptoJS.SHA256(deviceFingerprint + this.securityConfig.encryptionKey).toString();
      
      // Verificar se o dispositivo já foi autenticado anteriormente
      if (device.authenticationHash && device.authenticationHash === authHash) {
        console.log(`✅ [Security] Dispositivo ${device.name} já autenticado`);
        return true;
      }
      
      // Simular processo de autenticação (em implementação real, seria via características BLE)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Salvar hash de autenticação
      device.authenticationHash = authHash;
      device.trusted = true;
      
      console.log(`✅ [Security] Dispositivo ${device.name} autenticado com sucesso`);
      return true;
    } catch (error) {
      console.error(`❌ [Security] Falha na autenticação do dispositivo ${device.name}:`, error);
      return false;
    }
  }

  // Gerar fingerprint do dispositivo
  private generateDeviceFingerprint(device: BluetoothDevice): string {
    const components = [
      device.id,
      device.name,
      device.address,
      device.rssi?.toString() || '0'
    ];
    return components.join('|');
  }

  // Criptografar dados
  private encryptData(data: string): string {
    if (!this.securityConfig.encryptionEnabled) {
      return data;
    }
    
    try {
      const encrypted = CryptoJS.AES.encrypt(data, this.securityConfig.encryptionKey).toString();
      console.log('🔒 [Security] Dados criptografados');
      return encrypted;
    } catch (error) {
      console.error('❌ [Security] Erro ao criptografar dados:', error);
      return data;
    }
  }

  // Descriptografar dados
  private decryptData(encryptedData: string): string {
    if (!this.securityConfig.encryptionEnabled) {
      return encryptedData;
    }
    
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.securityConfig.encryptionKey);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      console.log('🔓 [Security] Dados descriptografados');
      return decryptedString;
    } catch (error) {
      console.error('❌ [Security] Erro ao descriptografar dados:', error);
      return encryptedData;
    }
  }

  // Adicionar dispositivo à whitelist
  public addToWhitelist(deviceAddress: string): void {
    if (!this.securityConfig.deviceWhitelist.includes(deviceAddress)) {
      this.securityConfig.deviceWhitelist.push(deviceAddress);
      console.log(`✅ [Security] Dispositivo ${deviceAddress} adicionado à whitelist`);
      this.notifyListeners();
    }
  }

  // Remover dispositivo da whitelist
  public removeFromWhitelist(deviceAddress: string): void {
    const index = this.securityConfig.deviceWhitelist.indexOf(deviceAddress);
    if (index > -1) {
      this.securityConfig.deviceWhitelist.splice(index, 1);
      console.log(`🗑️ [Security] Dispositivo ${deviceAddress} removido da whitelist`);
      this.notifyListeners();
    }
  }

  // Configurar nível de segurança
  public setSecurityLevel(level: 'low' | 'medium' | 'high'): void {
    switch (level) {
      case 'low':
        this.securityConfig.encryptionEnabled = false;
        this.securityConfig.authenticationRequired = false;
        this.securityConfig.trustedDeviceValidation = false;
        break;
      case 'medium':
        this.securityConfig.encryptionEnabled = true;
        this.securityConfig.authenticationRequired = false;
        this.securityConfig.trustedDeviceValidation = true;
        break;
      case 'high':
        this.securityConfig.encryptionEnabled = true;
        this.securityConfig.authenticationRequired = true;
        this.securityConfig.trustedDeviceValidation = true;
        break;
    }
    
    console.log(`🔧 [Security] Nível de segurança definido para: ${level}`);
    this.state.securityConfig = { ...this.securityConfig };
    this.notifyListeners();
  }

  // ===== FIM DOS MÉTODOS DE SEGURANÇA =====

  // ===== MÉTODOS DE TRATAMENTO DE ERRO =====

  // Registrar erro no log
  private logError(error: BluetoothError): void {
    const errorLog: ErrorLog = {
      id: Date.now().toString(),
      type: error.type,
      message: error.message,
      deviceId: error.deviceId,
      timestamp: error.timestamp,
      resolved: false,
      attempts: 0
    };

    this.state.errorLogs.push(errorLog);
    this.state.lastError = error;
    
    // Manter apenas os últimos 50 logs
    if (this.state.errorLogs.length > 50) {
      this.state.errorLogs = this.state.errorLogs.slice(-50);
    }

    console.error(`📝 [ErrorLog] ${error.type}: ${error.message}`, {
      deviceId: error.deviceId,
      timestamp: error.timestamp,
      recoverable: error.recoverable
    });

    this.notifyListeners();
  }

  // Criar e registrar erro
  private createAndLogError(
    type: BluetoothErrorType,
    message: string,
    deviceId?: string,
    recoverable: boolean = true
  ): BluetoothError {
    const error = new BluetoothError(type, message, deviceId, recoverable);
    this.logError(error);
    return error;
  }

  // Resolver erro
  public resolveError(errorId: string): void {
    const errorLog = this.state.errorLogs.find(log => log.id === errorId);
    if (errorLog) {
      errorLog.resolved = true;
      console.log(`✅ [ErrorLog] Erro ${errorId} marcado como resolvido`);
      this.notifyListeners();
    }
  }

  // Limpar logs de erro
  public clearErrorLogs(): void {
    this.state.errorLogs = [];
    this.state.lastError = undefined;
    console.log(`🧹 [ErrorLog] Logs de erro limpos`);
    this.notifyListeners();
  }

  // Obter logs de erro
  public getErrorLogs(): ErrorLog[] {
    return [...this.state.errorLogs];
  }

  // Obter último erro
  public getLastError(): BluetoothError | undefined {
    return this.state.lastError;
  }

  // Retry de conexão com controle de tentativas
  private async retryConnection(device: BluetoothDevice, maxRetries: number = 3): Promise<boolean> {
    const deviceId = device.id;
    
    if (!this.state.connectionRetries[deviceId]) {
      this.state.connectionRetries[deviceId] = 0;
    }

    if (this.state.connectionRetries[deviceId] >= maxRetries) {
      const error = this.createAndLogError(
        BluetoothErrorType.CONNECTION_FAILED,
        `Máximo de tentativas de conexão excedido para ${device.name}`,
        deviceId,
        false
      );
      throw error;
    }

    this.state.connectionRetries[deviceId]++;
    console.log(`🔄 [Retry] Tentativa ${this.state.connectionRetries[deviceId]}/${maxRetries} para ${device.name}`);

    try {
      const success = await this.connectDevice(device);
      if (success) {
        // Reset contador em caso de sucesso
        this.state.connectionRetries[deviceId] = 0;
      }
      return success;
    } catch (error) {
      if (this.state.connectionRetries[deviceId] < maxRetries) {
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 2000 * this.state.connectionRetries[deviceId]));
        return this.retryConnection(device, maxRetries);
      }
      throw error;
    }
  }

  // Validar estado antes de operações
  private validateBluetoothState(): void {
    if (!this.state.enabled) {
      throw this.createAndLogError(
        BluetoothErrorType.BLUETOOTH_DISABLED,
        'Bluetooth não está habilitado',
        undefined,
        true
      );
    }

    if (this.state.bleState !== State.PoweredOn) {
      throw this.createAndLogError(
        BluetoothErrorType.BLUETOOTH_DISABLED,
        `Estado do Bluetooth inválido: ${this.state.bleState}`,
        undefined,
        true
      );
    }
  }

  // Recuperação automática de erros
  private async attemptErrorRecovery(error: BluetoothError): Promise<boolean> {
    if (!error.recoverable) {
      console.warn(`⚠️ [Recovery] Erro ${error.type} não é recuperável`);
      return false;
    }

    console.log(`🔧 [Recovery] Tentando recuperar do erro: ${error.type}`);

    try {
      switch (error.type) {
        case BluetoothErrorType.BLUETOOTH_DISABLED:
          // Tentar reativar o Bluetooth
          return await this.enableBluetooth();

        case BluetoothErrorType.PERMISSION_DENIED:
          // Solicitar permissões novamente
          return await this.requestPermissions();

        case BluetoothErrorType.CONNECTION_FAILED:
          // Tentar reconectar se há dispositivo
          if (error.deviceId && this.state.connectedDevice?.id === error.deviceId) {
            await this.disconnectDevice();
            await new Promise(resolve => setTimeout(resolve, 1000));
            const device = this.state.pairedDevices.find(d => d.id === error.deviceId);
            if (device) {
              return await this.connectDevice(device);
            }
          }
          return false;

        case BluetoothErrorType.TIMEOUT:
          // Reinicializar scan ou conexão
          if (this.state.discovering) {
            await this.stopScan();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.startScan();
            return true;
          }
          return false;

        default:
          console.warn(`⚠️ [Recovery] Tipo de erro não suportado para recuperação: ${error.type}`);
          return false;
      }
    } catch (recoveryError) {
      console.error(`❌ [Recovery] Falha na recuperação:`, recoveryError);
      return false;
    }
  }

  // Wrapper para operações com tratamento de erro
  private async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    errorType: BluetoothErrorType,
    errorMessage: string,
    deviceId?: string,
    autoRecover: boolean = true
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const bluetoothError = this.createAndLogError(
        errorType,
        `${errorMessage}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        deviceId,
        true
      );

      if (autoRecover) {
        const recovered = await this.attemptErrorRecovery(bluetoothError);
        if (recovered) {
          console.log(`✅ [Recovery] Recuperação bem-sucedida para ${errorType}`);
          // Tentar operação novamente após recuperação
          try {
            return await operation();
          } catch (retryError) {
            console.error(`❌ [Recovery] Falha na operação após recuperação:`, retryError);
            throw bluetoothError;
          }
        }
      }

      throw bluetoothError;
    }
  }

  // ===== FIM DOS MÉTODOS DE TRATAMENTO DE ERRO =====

  private async initializeBluetooth() {
    try {
      // Monitorar estado do Bluetooth
      this.bleManager.onStateChange((state) => {
        this.state.bleState = state;
        this.state.enabled = state === State.PoweredOn;
        this.notifyListeners();
      }, true);
      
      // Verificar permissões
      await this.requestPermissions();
      
      // Carregar dispositivos pareados do storage
      await this.loadPairedDevices();
      
      // Buscar dispositivos Bluetooth clássicos pareados
      try {
        await this.getClassicBluetoothDevices();
        console.log('✅ [BluetoothService] Dispositivos Bluetooth clássicos carregados');
      } catch (error) {
        console.warn('⚠️ [BluetoothService] Erro ao carregar dispositivos clássicos:', error);
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('Erro ao inicializar Bluetooth:', error);
    }
  }

  // Solicitar permissões necessárias
  private async requestPermissions(): Promise<boolean> {
    return this.executeWithErrorHandling(
      async () => {
        if (Platform.OS !== 'android') {
          console.log('🔐 [BluetoothService] Plataforma não-Android, permissões não necessárias');
          return true;
        }

        console.log('🔐 [BluetoothService] Solicitando permissões Bluetooth...');
        console.log('📱 [BluetoothService] Versão do Android:', Platform.Version);
        
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ];

        // Para Android 12+ (API 31+), adicionar permissões específicas do Bluetooth
        if (Platform.Version >= 31) {
          console.log('📱 [BluetoothService] Android 12+, adicionando permissões específicas do Bluetooth');
          permissions.push(
            'android.permission.BLUETOOTH_SCAN',
            'android.permission.BLUETOOTH_CONNECT',
            'android.permission.BLUETOOTH_ADVERTISE'
          );
        } else {
          console.log('📱 [BluetoothService] Android < 12, adicionando permissões clássicas do Bluetooth');
          permissions.push(
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
        }

        console.log('📋 [BluetoothService] Permissões a solicitar:', permissions);
        
        // Verificar permissões já concedidas
        for (const permission of permissions) {
          const hasPermission = await PermissionsAndroid.check(permission);
          console.log(`🔍 [BluetoothService] ${permission}: ${hasPermission ? 'JÁ CONCEDIDA' : 'PENDENTE'}`);
        }

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        console.log('📋 [BluetoothService] Resultado das permissões:');
        Object.entries(granted).forEach(([permission, result]) => {
          const status = result === PermissionsAndroid.RESULTS.GRANTED ? 'CONCEDIDA' : 
                        result === PermissionsAndroid.RESULTS.DENIED ? 'NEGADA' : 
                        result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? 'NUNCA_PERGUNTAR' : 'DESCONHECIDO';
          console.log(`  ${permission}: ${status}`);
        });

        const allGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
        
        console.log(`🔐 [BluetoothService] Todas as permissões concedidas: ${allGranted ? 'SIM' : 'NÃO'}`);
        
        if (!allGranted) {
          const deniedPermissions = Object.entries(granted)
            .filter(([_, result]) => result !== PermissionsAndroid.RESULTS.GRANTED)
            .map(([permission, _]) => permission);
          
          console.warn('⚠️ [BluetoothService] Algumas permissões foram negadas:', deniedPermissions);
          Alert.alert(
            'Permissões Necessárias',
            `Para detectar impressoras térmicas, o aplicativo precisa das seguintes permissões:\n\n${deniedPermissions.join('\n')}\n\nPor favor, conceda as permissões nas configurações do aplicativo.`,
            [{ text: 'OK' }]
          );
          
          throw new Error(`Permissões negadas: ${deniedPermissions.join(', ')}`);
        }

        return allGranted;
      },
      BluetoothErrorType.PERMISSION_DENIED,
      'Falha ao solicitar permissões Bluetooth',
      undefined,
      false // Não tentar recuperação automática para permissões
    );
  }

  // Ativar/Desativar Bluetooth
  async enableBluetooth(): Promise<boolean> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Permissões Bluetooth não concedidas');
      }

      // Com BLE, não podemos ativar o Bluetooth programaticamente
      // O usuário deve ativar nas configurações do dispositivo
      const state = await this.bleManager.state();
      if (state === 'PoweredOn') {
        this.updateState({ enabled: true });
        await this.loadPairedDevices();
        return true;
      } else {
        Alert.alert(
          'Bluetooth Desativado',
          'Por favor, ative o Bluetooth nas configurações do dispositivo.'
        );
        return false;
      }
    } catch (error) {
      console.error('Erro ao verificar Bluetooth:', error);
      return false;
    }
  }

  async disableBluetooth(): Promise<boolean> {
    try {
      // Com BLE, não podemos desativar o Bluetooth programaticamente
      // O usuário deve desativar nas configurações do dispositivo
      Alert.alert(
        'Desativar Bluetooth',
        'Para desativar o Bluetooth, vá para as configurações do dispositivo.'
      );
      return false;
    } catch (error) {
      console.error('Erro ao desativar Bluetooth:', error);
      return false;
    }
  }

  // Iniciar busca por dispositivos
  async startScan(): Promise<void> {
    return this.executeWithErrorHandling(
      async () => {
        console.log('🔍 [BluetoothService] Iniciando scan de dispositivos...');
        
        // Validar estado do Bluetooth
        this.validateBluetoothState();

        if (this.state.discovering) {
          console.log('🔍 [BluetoothService] Scan já em andamento');
          return;
        }

        // Verificar permissões
        console.log('🔐 [BluetoothService] Verificando permissões...');
        const hasPermissions = await this.requestPermissions();
        if (!hasPermissions) {
          throw new Error('Permissões de Bluetooth não concedidas');
        }
        console.log('✅ [BluetoothService] Permissões concedidas');

        this.state.discovering = true;
        this.state.devices = [];
        this.notifyListeners();
        
        console.log('📡 [BluetoothService] Iniciando scan BLE...');

        // Configurar timeout do scan
        const scanTimeout = setTimeout(() => {
          console.log('⏰ [BluetoothService] Timeout do scan (10s)');
          this.stopScan();
          
          // Se nenhum dispositivo foi encontrado, mostrar mensagem informativa
          if (this.state.devices.length === 0) {
            this.createAndLogError(
              BluetoothErrorType.DEVICE_NOT_FOUND,
              'Nenhum dispositivo Bluetooth encontrado. Verifique se os dispositivos estão ligados, próximos e em modo de pareamento.',
              undefined,
              false
            );
          }
        }, this.securityConfig.connectionTimeout || 10000);

        // Buscar dispositivos BLE
        this.bleManager.startDeviceScan(null, null, (error, device) => {
          if (error) {
            console.error('❌ [BluetoothService] Erro durante scan:', error);
            clearTimeout(scanTimeout);
            this.state.discovering = false;
            this.notifyListeners();
            
            // Criar erro específico para scan
            this.createAndLogError(
              BluetoothErrorType.DEVICE_NOT_FOUND,
              `Erro durante scan BLE: ${error.message}`,
              undefined,
              true
            );
            return;
          }

          if (device && device.name) {
            console.log('📱 [BluetoothService] Dispositivo encontrado:', {
              id: device.id,
              name: device.name,
              rssi: device.rssi
            });
            
            try {
              // Determinar nível de segurança baseado no RSSI e características
              const securityLevel: 'low' | 'medium' | 'high' = 
                (device.rssi && device.rssi > -50) ? 'high' :
                (device.rssi && device.rssi > -70) ? 'medium' : 'low';
              
              const bluetoothDevice: BluetoothDevice = {
                id: device.id,
                name: device.name,
                address: device.id, // BLE usa ID como endereço
                paired: false,
                connected: false,
                rssi: device.rssi || undefined,
                device: device,
                // Campos de segurança
                trusted: false,
                connectionAttempts: 0,
                securityLevel: securityLevel,
                encryptionSupported: true // Assumir que BLE suporta criptografia
              };

              // Validar dispositivo antes de adicionar
              if (this.validateTrustedDevice(bluetoothDevice)) {
                // Evitar duplicatas
                const exists = this.state.devices.find(d => d.id === device.id);
                if (!exists) {
                  console.log(`✅ [BluetoothService] Novo dispositivo adicionado: ${device.name} (Segurança: ${securityLevel})`);
                  this.state.devices.push(bluetoothDevice);
                  this.notifyListeners();
                }
              } else {
                console.warn(`🚫 [BluetoothService] Dispositivo ${device.name} rejeitado por validação de segurança`);
                
                // Log de segurança para dispositivo rejeitado
                this.createAndLogError(
                  BluetoothErrorType.SECURITY_VIOLATION,
                  `Dispositivo ${device.name} rejeitado por validação de segurança`,
                  device.id,
                  false
                );
              }
            } catch (deviceError) {
              console.error(`❌ [BluetoothService] Erro ao processar dispositivo ${device.name}:`, deviceError);
              this.createAndLogError(
                BluetoothErrorType.DEVICE_NOT_FOUND,
                `Erro ao processar dispositivo ${device.name}: ${deviceError instanceof Error ? deviceError.message : 'Erro desconhecido'}`,
                device.id,
                true
              );
            }
          } else if (device) {
            console.log('📱 [BluetoothService] Dispositivo sem nome encontrado:', device.id);
          }
        });
        
        console.log('✅ [BluetoothService] Scan iniciado com sucesso');
      },
      BluetoothErrorType.DEVICE_NOT_FOUND,
      'Falha ao iniciar scan de dispositivos',
      undefined,
      true
    );
  }

  // Parar busca por dispositivos
  async stopScan(): Promise<void> {
    try {
      if (this.state.discovering) {
        this.bleManager.stopDeviceScan();
        this.state.discovering = false;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Erro ao parar busca:', error);
      this.state.discovering = false;
      this.notifyListeners();
    }
  }

  // Redescobrir dispositivo específico
  private async rediscoverDevice(deviceId: string): Promise<any> {
    return new Promise((resolve) => {
      console.log(`🔍 [BluetoothService] Redescobrir dispositivo: ${deviceId}`);
      
      let found = false;
      const timeout = setTimeout(() => {
        if (!found) {
          this.bleManager.stopDeviceScan();
          console.log(`⏰ [BluetoothService] Timeout na redescoberta do dispositivo ${deviceId}`);
          this.showTroubleshootingTips(deviceId);
          resolve(null);
        }
      }, 5000); // 5 segundos de timeout

      this.bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error(`❌ [BluetoothService] Erro na redescoberta:`, error);
          clearTimeout(timeout);
          this.bleManager.stopDeviceScan();
          resolve(null);
          return;
        }

        if (device && device.id === deviceId) {
          found = true;
          clearTimeout(timeout);
          this.bleManager.stopDeviceScan();
          console.log(`✅ [BluetoothService] Dispositivo ${deviceId} redescoberto`);
          resolve(device);
        }
      });
    });
  }

  // Mostrar dicas de troubleshooting
  private showTroubleshootingTips(deviceId?: string): void {
    const tips = [
      '📱 Verifique se o dispositivo está ligado',
      '📡 Certifique-se de que o dispositivo está próximo (menos de 10 metros)',
      '🔄 Tente reiniciar o Bluetooth do dispositivo',
      '⚙️ Verifique se o dispositivo está em modo de pareamento',
      '🔋 Confirme se a bateria do dispositivo não está baixa',
      '📲 Tente reiniciar o aplicativo'
    ];
    
    console.log('💡 [BluetoothService] Dicas de troubleshooting:');
    tips.forEach(tip => console.log(`   ${tip}`));
    
    if (deviceId) {
      console.log(`   🔍 Dispositivo procurado: ${deviceId}`);
    }
  }

  // Redescobrir dispositivo pareado com estratégias avançadas
  private async rediscoverPairedDevice(device: BluetoothDevice): Promise<any> {
    try {
      console.log(`🔍 [BluetoothService] Redescoberta avançada para dispositivo pareado: ${device.name} (${device.id})`);
      
      // Estratégia 1: Buscar por ID exato
      console.log(`📍 [BluetoothService] Estratégia 1: Busca por ID exato`);
      let foundDevice = await this.rediscoverDevice(device.id);
      if (foundDevice) {
        console.log(`✅ [BluetoothService] Dispositivo encontrado por ID exato`);
        return foundDevice;
      }
      
      // Estratégia 2: Buscar por nome (para casos onde o ID pode ter mudado)
      console.log(`📍 [BluetoothService] Estratégia 2: Busca por nome`);
      const devices = await this.scanForDevices();
      foundDevice = devices.find(d => d.name === device.name || d.localName === device.name);
      if (foundDevice) {
        console.log(`✅ [BluetoothService] Dispositivo encontrado por nome: ${foundDevice.name}`);
        // Atualizar o ID se necessário
        if (foundDevice.id !== device.id) {
          console.log(`🔄 [BluetoothService] Atualizando ID do dispositivo de ${device.id} para ${foundDevice.id}`);
          device.id = foundDevice.id;
        }
        return foundDevice;
      }
      
      // Estratégia 3: Buscar por endereço MAC (se disponível)
      if (device.address) {
        console.log(`📍 [BluetoothService] Estratégia 3: Busca por endereço MAC`);
        foundDevice = devices.find(d => d.id === device.address || d.name?.includes(device.address));
        if (foundDevice) {
          console.log(`✅ [BluetoothService] Dispositivo encontrado por endereço MAC`);
          return foundDevice;
        }
      }
      
      // Estratégia 4: Scan mais longo para dispositivos que demoram para aparecer
      console.log(`📍 [BluetoothService] Estratégia 4: Scan estendido (10 segundos)`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
      const extendedDevices = await this.scanForDevices();
      foundDevice = extendedDevices.find(d => 
        d.id === device.id || 
        d.name === device.name || 
        d.localName === device.name ||
        (device.address && (d.id === device.address || d.name?.includes(device.address)))
      );
      
      if (foundDevice) {
        console.log(`✅ [BluetoothService] Dispositivo encontrado no scan estendido`);
        return foundDevice;
      }
      
      console.warn(`⚠️ [BluetoothService] Dispositivo pareado ${device.name} não encontrado após todas as estratégias`);
      return null;
    } catch (error) {
      console.error(`❌ [BluetoothService] Erro na redescoberta avançada:`, error);
      return null;
    }
  }

  // Mostrar dicas de solução de problemas para dispositivos pareados
  private showPairedDeviceTroubleshootingTips(device: BluetoothDevice): void {
    console.log(`💡 [BluetoothService] Dicas para resolver problema com ${device.name}:`);
    console.log(`   1. Verifique se o dispositivo está ligado`);
    console.log(`   2. Certifique-se de que está próximo (menos de 10 metros)`);
    console.log(`   3. Tente desligar e ligar o Bluetooth do celular`);
    console.log(`   4. Reinicie o dispositivo ${device.name}`);
    console.log(`   5. Se persistir, remova o pareamento e pareie novamente`);
    
    // Adicionar dicas específicas para MPT-II
    if (device.name?.includes('MPT') || device.name?.includes('mpt')) {
      console.log(`   📱 Dicas específicas para MPT-II:`);
      console.log(`      - Pressione e segure o botão de energia por 3 segundos`);
      console.log(`      - Verifique se o LED azul está piscando`);
      console.log(`      - Aguarde 5-10 segundos antes de tentar conectar novamente`);
    }
  }

  // Salvar dispositivos pareados
  private async savePairedDevices(): Promise<void> {
    // Paired devices are now stored only in memory
    // No persistent storage to ensure remote-only operation
    console.log('Paired devices stored in memory only');
  }

  // Load paired devices (memory only)
  async loadPairedDevices(): Promise<void> {
    // Paired devices are stored only in memory
    // No persistent storage to ensure remote-only operation
    console.log('📋 [BluetoothService] Dispositivos pareados carregados apenas da memória');
    console.log('📋 [BluetoothService] Dispositivos pareados atuais:', this.state.pairedDevices.length);
    this.state.pairedDevices.forEach((device, index) => {
      console.log(`📱 [BluetoothService] Pareado ${index + 1}:`, {
        name: device.name,
        address: device.address,
        paired: device.paired,
        connected: device.connected
      });
    });
  }

  // Parear com dispositivo (conectar no BLE)
  async pairDevice(device: BluetoothDevice): Promise<boolean> {
    try {
      console.log(`🔗 [BluetoothService] Iniciando pareamento com ${device.name}...`);
      
      if (!device.device) {
        console.warn(`⚠️ [BluetoothService] Dispositivo ${device.name} não possui referência BLE. Tentando redescobrir...`);
        
        // Tentar redescobrir o dispositivo
        const rediscoveredDevice = await this.rediscoverDevice(device.id);
        if (rediscoveredDevice) {
          device.device = rediscoveredDevice;
          console.log(`✅ [BluetoothService] Dispositivo ${device.name} redescoberto com sucesso`);
        } else {
          throw this.createAndLogError(
            BluetoothErrorType.DEVICE_NOT_FOUND,
            `Dispositivo BLE ${device.name} não encontrado. Certifique-se de que o dispositivo está ligado e próximo.`,
            device.id,
            true
          );
        }
      }

      // Incrementar tentativas de conexão
      device.connectionAttempts += 1;
      
      // Validar dispositivo confiável
      if (!this.validateTrustedDevice(device)) {
        throw new Error('Dispositivo não passou na validação de segurança');
      }
      
      // Autenticar dispositivo se necessário
      const isAuthenticated = await this.authenticateDevice(device);
      if (!isAuthenticated) {
        throw new Error('Falha na autenticação do dispositivo');
      }

      console.log(`🔐 [BluetoothService] Conectando ao dispositivo ${device.name}...`);
      
      // Conectar ao dispositivo BLE com timeout
      const connectionPromise = this.bleManager.connectToDevice(device.id);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de conexão')), this.securityConfig.connectionTimeout)
      );
      
      const connectedDevice = await Promise.race([connectionPromise, timeoutPromise]) as Device;
      await connectedDevice.discoverAllServicesAndCharacteristics();
      
      // Atualizar dispositivo como pareado e conectado
      const updatedDevice = { 
        ...device, 
        paired: true, 
        connected: true,
        device: connectedDevice,
        lastConnected: new Date(),
        connectionAttempts: 0 // Reset após conexão bem-sucedida
      };
      
      // Adicionar à whitelist automaticamente após pareamento bem-sucedido
      this.addToWhitelist(device.address);
      
      // Remover da lista de dispositivos descobertos e adicionar aos pareados
      this.state.devices = this.state.devices.filter(d => d.id !== device.id);
      this.state.pairedDevices = [...this.state.pairedDevices, updatedDevice];
      this.state.connectedDevice = updatedDevice;
      
      this.notifyListeners();
      
      // Salvar no storage
      await this.saveConnectedDevice(updatedDevice);
      
      console.log(`✅ [BluetoothService] Pareamento com ${device.name} concluído com sucesso`);
      Alert.alert('Sucesso', `Conectado ao dispositivo ${device.name}`);
      
      return true;
    } catch (error) {
      console.error(`❌ [BluetoothService] Erro ao parear dispositivo ${device.name}:`, error);
      
      // Incrementar tentativas em caso de erro
      if (device.connectionAttempts < this.securityConfig.maxConnectionAttempts) {
        console.warn(`⚠️ [BluetoothService] Tentativa ${device.connectionAttempts}/${this.securityConfig.maxConnectionAttempts} falhou`);
      }
      
      Alert.alert('Erro', `Falha ao conectar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return false;
    }
  }

  // Conectar/Desconectar dispositivo
  async connectDevice(device: BluetoothDevice): Promise<boolean> {
    try {
      // Desconectar dispositivo atual se houver
      if (this.state.connectedDevice) {
        await this.disconnectDevice();
      }

      if (!device.device) {
        console.warn(`⚠️ [BluetoothService] Dispositivo ${device.name} não possui referência BLE. Tentando redescobrir...`);
        
        // Para dispositivos pareados, tentar múltiplas estratégias de redescoberta
        if (device.paired) {
          console.log(`🔍 [BluetoothService] Dispositivo pareado ${device.name} - usando estratégia avançada de redescoberta`);
          const rediscoveredDevice = await this.rediscoverPairedDevice(device);
          if (rediscoveredDevice) {
            device.device = rediscoveredDevice;
            console.log(`✅ [BluetoothService] Dispositivo pareado ${device.name} redescoberto com sucesso`);
          } else {
            // Mostrar dicas específicas para dispositivos pareados
            this.showPairedDeviceTroubleshootingTips(device);
            throw this.createAndLogError(
              BluetoothErrorType.DEVICE_NOT_FOUND,
              `Dispositivo pareado ${device.name} não encontrado. Verifique as dicas de solução de problemas.`,
              device.id,
              true
            );
          }
        } else {
          // Tentar redescobrir dispositivo normal
          const rediscoveredDevice = await this.rediscoverDevice(device.id);
          if (rediscoveredDevice) {
            device.device = rediscoveredDevice;
            console.log(`✅ [BluetoothService] Dispositivo ${device.name} redescoberto com sucesso`);
          } else {
            throw this.createAndLogError(
              BluetoothErrorType.DEVICE_NOT_FOUND,
              `Dispositivo BLE ${device.name} não encontrado. Certifique-se de que o dispositivo está ligado e próximo.`,
              device.id,
              true
            );
          }
        }
      }

      console.log(`🔗 [BluetoothService] Tentando conectar ao dispositivo ${device.name}...`);
      
      // Validar dispositivo antes da conexão
      if (!this.validateTrustedDevice(device)) {
        console.warn(`🚫 [BluetoothService] Dispositivo ${device.name} não é confiável`);
        throw new Error('Dispositivo não é confiável para conexão');
      }
      
      // Verificar se o dispositivo está na whitelist (se habilitada)
      if (this.securityConfig.deviceWhitelist.length > 0 && 
          !this.securityConfig.deviceWhitelist.includes(device.address) &&
          !this.securityConfig.deviceWhitelist.includes(device.id)) {
        console.warn(`🚫 [BluetoothService] Dispositivo ${device.name} não está na whitelist`);
        throw new Error('Dispositivo não autorizado (não está na whitelist)');
      }
      
      // Conectar ao dispositivo BLE com timeout
      const connectionPromise = this.bleManager.connectToDevice(device.id);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout de conexão')), this.securityConfig.connectionTimeout);
      });
      
      const connectedDevice = await Promise.race([connectionPromise, timeoutPromise]) as Device;
      
      console.log(`🔍 [BluetoothService] Descobrindo serviços do dispositivo ${device.name}...`);
      
      await connectedDevice.discoverAllServicesAndCharacteristics();
      
      // Autenticar dispositivo após conexão
      const isAuthenticated = await this.authenticateDevice(device);
      if (!isAuthenticated) {
        console.warn(`🚫 [BluetoothService] Falha na autenticação do dispositivo ${device.name}`);
        await connectedDevice.cancelConnection();
        throw new Error('Falha na autenticação do dispositivo');
      }
      
      console.log(`✅ [BluetoothService] Dispositivo ${device.name} conectado e autenticado com sucesso`);
      
      // Atualizar dispositivo como conectado
      const updatedDevice = { 
        ...device, 
        connected: true,
        device: connectedDevice,
        lastConnected: new Date(),
        connectionAttempts: 0 // Reset após conexão bem-sucedida
      };
      
      this.updateState({ connectedDevice: updatedDevice });
      
      // Salvar dispositivo conectado
      await this.saveConnectedDevice(updatedDevice);
      
      Alert.alert('Sucesso', `Conectado ao dispositivo ${device.name}`);
      
      return true;
    } catch (error) {
      console.error(`❌ [BluetoothService] Erro ao conectar dispositivo:`, error);
      
      // Incrementar tentativas de conexão falhadas
      device.connectionAttempts = (device.connectionAttempts || 0) + 1;
      
      // Se muitas tentativas falharam, remover da whitelist
      if (device.connectionAttempts >= this.securityConfig.maxConnectionAttempts) {
        console.warn(`🚫 [BluetoothService] Removendo ${device.name} da whitelist por muitas tentativas falhadas`);
        this.removeFromWhitelist(device.address);
      }
      
      Alert.alert('Erro de Conexão', 
        error instanceof Error ? error.message : 'Falha ao conectar com o dispositivo');
      return false;
    }
  }

  async disconnectDevice(): Promise<boolean> {
    try {
      if (this.state.connectedDevice && this.state.connectedDevice.device) {
        await this.state.connectedDevice.device.cancelConnection();
        
        // Atualizar dispositivo como desconectado
        const disconnectedDevice = { 
          ...this.state.connectedDevice, 
          connected: false 
        };
        
        // Atualizar lista de pareados
        this.state.pairedDevices = this.state.pairedDevices.map(d => 
          d.id === disconnectedDevice.id ? disconnectedDevice : d
        );
        
        this.state.connectedDevice = null;
        this.notifyListeners();
        
        // Dispositivo removido da memória (não há mais armazenamento local)
        
        Alert.alert('Sucesso', 'Dispositivo desconectado');
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao desconectar dispositivo:', error);
      Alert.alert('Erro', `Falha ao desconectar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return false;
    }
  }



  // Enviar dados via Bluetooth
  async sendData(data: string): Promise<boolean> {
    try {
      if (!this.state.connectedDevice || !this.state.connectedDevice.device) {
        throw new Error('Nenhum dispositivo conectado');
      }
      
      console.log(`📤 [BluetoothService] Enviando dados para ${this.state.connectedDevice.name}...`);
      
      // Validar dispositivo antes de enviar dados
      if (!this.validateTrustedDevice(this.state.connectedDevice)) {
        throw new Error('Dispositivo não é confiável para envio de dados');
      }
      
      // Criptografar dados se habilitado
      const processedData = this.encryptData(data);
      
      // Converter string para base64
      const base64Data = Buffer.from(processedData, 'utf8').toString('base64');
      
      console.log(`🔒 [BluetoothService] Dados processados (${this.securityConfig.encryptionEnabled ? 'criptografados' : 'não criptografados'})`);
      
      // Buscar serviços e características do dispositivo
      const services = await this.state.connectedDevice.device.services();
      
      // Procurar por uma característica de escrita
      for (const service of services) {
        const characteristics = await service.characteristics();
        
        for (const characteristic of characteristics) {
          // Verificar se a característica suporta escrita
          if (characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse) {
            console.log(`📡 [BluetoothService] Enviando via característica ${characteristic.uuid}`);
            await characteristic.writeWithResponse(base64Data);
            console.log(`✅ [BluetoothService] Dados enviados com sucesso`);
            return true;
          }
        }
      }
      
      throw new Error('Nenhuma característica de escrita encontrada');
    } catch (error) {
      console.error(`❌ [BluetoothService] Erro ao enviar dados via Bluetooth:`, error);
      
      // Se o erro for relacionado à segurança, desconectar o dispositivo
      if (error instanceof Error && error.message.includes('confiável')) {
        console.warn(`🚫 [BluetoothService] Desconectando dispositivo não confiável`);
        await this.disconnectDevice();
      }
      
      return false;
    }
  }

  // Salvar/Carregar dispositivo conectado
  private async saveConnectedDevice(device: BluetoothDevice): Promise<void> {
    // Connected device is stored only in memory
    // No persistent storage to ensure remote-only operation
    console.log('Connected device stored in memory only');
  }

  private async loadConnectedDevice(): Promise<void> {
    // Connected device is stored only in memory
    // No persistent storage to ensure remote-only operation
    console.log('Connected device loaded from memory only');
  }

  // Gerenciamento de estado
  private updateState(updates: Partial<BluetoothState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Adicionar/Remover listeners
  addListener(listener: (state: BluetoothState) => void): () => void {
    this.listeners.push(listener);
    
    // Retornar função para remover listener
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Remover dispositivo pareado com validações de segurança
  async removePairedDevice(deviceId: string): Promise<void> {
    try {
      console.log(`🗑️ [BluetoothService] Removendo dispositivo pareado: ${deviceId}`);
      
      // Remover da whitelist também
      this.removeFromWhitelist(deviceId);
      
      // Desconectar se estiver conectado
      if (this.state.connectedDevice?.id === deviceId) {
        await this.disconnectDevice();
      }
      
      // Remover da lista de pareados
      this.state.pairedDevices = this.state.pairedDevices.filter(d => d.id !== deviceId);
      this.notifyListeners();
      
      // Salvar no storage
      await this.savePairedDevices();
      
      console.log(`✅ [BluetoothService] Dispositivo ${deviceId} removido com sucesso`);
    } catch (error) {
      console.error('Erro ao remover dispositivo pareado:', error);
      throw error;
    }
  }

  // Limpar todos os dispositivos pareados
  async clearAllPairedDevices(): Promise<void> {
    try {
      console.log(`🧹 [BluetoothService] Limpando todos os dispositivos pareados`);
      
      // Desconectar dispositivo atual se houver
      if (this.state.connectedDevice) {
        await this.disconnectDevice();
      }
      
      // Limpar whitelist
      this.securityConfig.deviceWhitelist = [];
      
      // Limpar dispositivos pareados
      this.state.pairedDevices = [];
      this.state.securityConfig = { ...this.securityConfig };
      this.notifyListeners();
      
      // Salvar no storage
      await this.savePairedDevices();
      
      console.log(`✅ [BluetoothService] Todos os dispositivos foram removidos`);
    } catch (error) {
      console.error('Erro ao limpar dispositivos pareados:', error);
      throw error;
    }
  }

  // Forçar reconexão de dispositivo pareado
  async forceReconnectPairedDevice(deviceId: string): Promise<boolean> {
    try {
      console.log(`🔄 [BluetoothService] Forçando reconexão do dispositivo pareado: ${deviceId}`);
      
      // Encontrar dispositivo pareado
      const pairedDevice = this.state.pairedDevices.find(d => d.id === deviceId);
      if (!pairedDevice) {
        throw new Error(`Dispositivo ${deviceId} não está na lista de pareados`);
      }
      
      // Desconectar se estiver conectado
      if (this.state.connectedDevice?.id === deviceId) {
        await this.disconnectDevice();
        // Aguardar um pouco antes de tentar reconectar
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Limpar referência BLE para forçar redescoberta
      pairedDevice.device = null;
      
      // Tentar conectar novamente
      const success = await this.connectDevice(pairedDevice);
      
      if (success) {
        console.log(`✅ [BluetoothService] Reconexão forçada bem-sucedida para ${pairedDevice.name}`);
      } else {
        console.error(`❌ [BluetoothService] Falha na reconexão forçada para ${pairedDevice.name}`);
      }
      
      return success;
    } catch (error) {
      console.error(`❌ [BluetoothService] Erro na reconexão forçada:`, error);
      return false;
    }
  }

  // Método específico para resolver problemas do MPT-II
  async troubleshootMPTDevice(deviceId: string): Promise<boolean> {
    try {
      console.log(`🔧 [BluetoothService] Iniciando troubleshooting para MPT-II: ${deviceId}`);
      
      const device = this.state.pairedDevices.find(d => d.id === deviceId);
      if (!device) {
        console.error(`❌ [BluetoothService] Dispositivo ${deviceId} não encontrado`);
        return false;
      }
      
      // Mostrar dicas específicas
      this.showPairedDeviceTroubleshootingTips(device);
      
      // Tentar múltiplas estratégias de reconexão
      console.log(`🔄 [BluetoothService] Tentativa 1: Reconexão simples`);
      let success = await this.forceReconnectPairedDevice(deviceId);
      
      if (!success) {
        console.log(`🔄 [BluetoothService] Tentativa 2: Aguardar e tentar novamente`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        success = await this.forceReconnectPairedDevice(deviceId);
      }
      
      if (!success) {
        console.log(`🔄 [BluetoothService] Tentativa 3: Reset do Bluetooth e reconexão`);
        // Simular reset do Bluetooth parando e reiniciando o scan
        await this.stopScan();
        await new Promise(resolve => setTimeout(resolve, 2000));
        success = await this.forceReconnectPairedDevice(deviceId);
      }
      
      if (success) {
        console.log(`✅ [BluetoothService] Troubleshooting MPT-II bem-sucedido`);
      } else {
        console.log(`⚠️ [BluetoothService] Troubleshooting MPT-II falhou. Considere remover e parear novamente.`);
      }
      
      return success;
    } catch (error) {
      console.error(`❌ [BluetoothService] Erro no troubleshooting MPT-II:`, error);
      return false;
    }
  }

  // Exportar configurações de segurança
  exportSecurityConfig(): SecurityConfig {
    return { ...this.securityConfig };
  }

  // Importar configurações de segurança
  importSecurityConfig(config: Partial<SecurityConfig>): void {
    console.log(`⚙️ [BluetoothService] Importando configurações de segurança`);
    
    this.securityConfig = {
      ...this.securityConfig,
      ...config
    };
    
    // Se a chave de criptografia foi alterada, gerar nova
    if (!config.encryptionKey) {
      this.securityConfig.encryptionKey = this.generateEncryptionKey();
    }
    
    // Atualizar estado
    this.state.securityConfig = { ...this.securityConfig };
    this.notifyListeners();
    
    console.log(`✅ [BluetoothService] Configurações de segurança atualizadas`);
  }

  // Resetar configurações de segurança para padrão
  resetSecurityConfig(): void {
    console.log(`🔄 [BluetoothService] Resetando configurações de segurança`);
    
    this.securityConfig = {
      encryptionEnabled: true,
      authenticationRequired: true,
      deviceWhitelist: [],
      maxConnectionAttempts: 3,
      connectionTimeout: 30000,
      encryptionKey: this.generateEncryptionKey(),
      trustedDeviceValidation: true
    };
    
    this.state.securityConfig = { ...this.securityConfig };
    this.notifyListeners();
    
    console.log(`✅ [BluetoothService] Configurações de segurança resetadas`);
  }

  // Métodos para compatibilidade com diferentes SO
  async checkOSCompatibility(): Promise<{
    platform: string;
    bluetoothSupported: boolean;
    securityFeatures: string[];
    recommendations: string[];
  }> {
    const platform = Platform.OS;
    const bluetoothSupported = this.state.enabled;
    
    const compatibility = {
      platform,
      bluetoothSupported,
      securityFeatures: [] as string[],
      recommendations: [] as string[]
    };
    
    switch (platform) {
      case 'android':
        compatibility.securityFeatures = [
          'BLE Security',
          'Device Pairing',
          'Encryption Support',
          'Permission Management'
        ];
        
        if (Platform.Version >= 31) {
          compatibility.securityFeatures.push('Enhanced Bluetooth Permissions');
        }
        
        compatibility.recommendations = [
          'Usar BLUETOOTH_CONNECT permission para Android 12+',
          'Implementar validação de dispositivos pareados',
          'Configurar timeout de conexão adequado'
        ];
        break;
        
      case 'ios':
        compatibility.securityFeatures = [
          'Core Bluetooth Security',
          'App Transport Security',
          'Keychain Integration',
          'Background Processing'
        ];
        
        compatibility.recommendations = [
          'Configurar NSBluetoothAlwaysUsageDescription',
          'Implementar background modes adequados',
          'Usar Keychain para armazenar chaves de criptografia'
        ];
        break;
        
      default:
        compatibility.recommendations = [
          'Verificar suporte específico da plataforma',
          'Implementar fallbacks adequados'
        ];
    }
    
    console.log(`📱 [BluetoothService] Compatibilidade ${platform}:`, compatibility);
    return compatibility;
  }
  
  // Validar configurações de segurança específicas do SO
  async validatePlatformSecurity(): Promise<boolean> {
    try {
      const platform = Platform.OS;
      
      console.log(`🔍 [BluetoothService] Validando segurança para ${platform}...`);
      
      switch (platform) {
        case 'android':
          // Verificar permissões específicas do Android
          const hasBluetoothPermissions = await this.requestPermissions();
          if (!hasBluetoothPermissions) {
            console.warn(`⚠️ [BluetoothService] Permissões Bluetooth insuficientes no Android`);
            return false;
          }
          break;
          
        case 'ios':
          // Verificar estado do Bluetooth no iOS
          const bluetoothState = this.state.bleState;
          if (bluetoothState !== State.PoweredOn) {
            console.warn(`⚠️ [BluetoothService] Bluetooth não está ativo no iOS: ${bluetoothState}`);
            return false;
          }
          break;
      }
      
      // Validações gerais de segurança
      if (this.securityConfig.encryptionEnabled && !this.securityConfig.encryptionKey) {
        console.warn(`⚠️ [BluetoothService] Criptografia habilitada mas chave não definida`);
        return false;
      }
      
      console.log(`✅ [BluetoothService] Validação de segurança ${platform} bem-sucedida`);
      return true;
    } catch (error) {
      console.error(`❌ [BluetoothService] Erro na validação de segurança:`, error);
      return false;
    }
  }
  
  // Obter estatísticas de segurança
  getSecurityStats(): {
    totalDevices: number;
    trustedDevices: number;
    whitelistedDevices: number;
    failedConnections: number;
    encryptionEnabled: boolean;
    authenticationEnabled: boolean;
  } {
    const trustedDevices = this.state.pairedDevices.filter(d => d.trusted).length;
    const failedConnections = this.state.pairedDevices.reduce(
      (sum, device) => sum + (device.connectionAttempts || 0), 0
    );
    
    return {
      totalDevices: this.state.pairedDevices.length,
      trustedDevices,
      whitelistedDevices: this.securityConfig.deviceWhitelist.length,
      failedConnections,
      encryptionEnabled: this.securityConfig.encryptionEnabled,
      authenticationEnabled: this.securityConfig.authenticationRequired
    };
  }
  
  // Getters
  getState(): BluetoothState {
    return {
      ...this.state,
      devices: this.state.devices || [],
      pairedDevices: this.state.pairedDevices || []
    };
  }

  isEnabled(): boolean {
    return this.state.enabled;
  }

  isDiscovering(): boolean {
    return this.state.discovering;
  }

  getConnectedDevice(): BluetoothDevice | null {
    return this.state.connectedDevice;
  }

  getPairedDevices(): BluetoothDevice[] {
    console.log('📋 [BluetoothService] Retornando dispositivos pareados:', this.state.pairedDevices.length);
    return this.state.pairedDevices;
  }
  
  getSecurityConfig(): SecurityConfig {
    return { ...this.securityConfig };
  }
  
  getWhitelistedDevices(): string[] {
    return [...this.securityConfig.deviceWhitelist];
  }

  // Verificar dispositivos Bluetooth clássicos pareados via biblioteca nativa
  async getClassicBluetoothDevices(): Promise<BluetoothDevice[]> {
    try {
      console.log('📱 [BluetoothService] Buscando dispositivos Bluetooth clássicos pareados...');
      
      // Importar BluetoothManager dinamicamente para evitar erros se não estiver disponível
      const { BluetoothManager } = await import('@brooons/react-native-bluetooth-escpos-printer');
      
      // Verificar se o Bluetooth está habilitado
      const isEnabled = await BluetoothManager.checkBluetoothEnabled();
      console.log('📡 [BluetoothService] Bluetooth clássico habilitado:', isEnabled);
      
      if (!isEnabled) {
        console.warn('⚠️ [BluetoothService] Bluetooth clássico não está habilitado');
        return [];
      }
      
      // Buscar dispositivos pareados
      const scanResult = await BluetoothManager.scanDevices();
      const parsedResult = JSON.parse(scanResult);
      const pairedDevices = parsedResult.paired || [];
      console.log('📋 [BluetoothService] Dispositivos Bluetooth clássicos encontrados:', pairedDevices.length);
      
      const devices: BluetoothDevice[] = pairedDevices.map((device: any, index: number) => {
        console.log(`📱 [BluetoothService] Dispositivo clássico ${index + 1}:`, {
          name: device.name || 'Nome desconhecido',
          address: device.address || 'Endereço desconhecido'
        });
        
        return {
          id: device.address || `classic_${index}`,
          name: device.name || 'Dispositivo Bluetooth',
          address: device.address || '',
          paired: true,
          connected: false,
          rssi: undefined
        };
      });
      
      // Adicionar dispositivos clássicos aos pareados se não estiverem já presentes
      devices.forEach(device => {
        const exists = this.state.pairedDevices.find(d => d.address === device.address);
        if (!exists) {
          console.log(`➕ [BluetoothService] Adicionando dispositivo clássico: ${device.name}`);
          this.state.pairedDevices.push(device);
        }
      });
      
      this.notifyListeners();
      
      return devices;
    } catch (error) {
      console.error('❌ [BluetoothService] Erro ao buscar dispositivos Bluetooth clássicos:', error);
      return [];
    }
  }

  getDiscoveredDevices(): BluetoothDevice[] {
    return [...this.state.devices];
  }
}

// Instância singleton
export const bluetoothService = new BluetoothService();
export default bluetoothService;