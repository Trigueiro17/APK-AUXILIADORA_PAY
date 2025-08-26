import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, State } from 'react-native-ble-plx';

export interface BluetoothDevice {
  id: string;
  name: string;
  address: string;
  paired: boolean;
  connected: boolean;
  rssi?: number;
  device?: Device; // Dispositivo BLE nativo
}

export interface BluetoothState {
  enabled: boolean;
  discovering: boolean;
  devices: BluetoothDevice[];
  pairedDevices: BluetoothDevice[];
  connectedDevice: BluetoothDevice | null;
  bleState: State;
}

class BluetoothService {
  private bleManager: BleManager = new BleManager();
  private listeners: ((state: BluetoothState) => void)[] = [];
  private state: BluetoothState = {
    enabled: false,
    discovering: false,
    devices: [],
    pairedDevices: [],
    connectedDevice: null,
    bleState: State.Unknown
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
        bleState: State.Unknown
      };
    }
  }

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
      
      this.notifyListeners();
    } catch (error) {
      console.error('Erro ao inicializar Bluetooth:', error);
    }
  }

  // Solicitar permissões necessárias
  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ];

      // Para Android 12+ (API 31+), adicionar permissões específicas do Bluetooth
      if (Platform.Version >= 31) {
        permissions.push(
          'android.permission.BLUETOOTH_SCAN',
          'android.permission.BLUETOOTH_CONNECT',
          'android.permission.BLUETOOTH_ADVERTISE'
        );
      } else {
        permissions.push(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );
      }

      const granted = await PermissionsAndroid.requestMultiple(permissions);

      return Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      return false;
    }
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
    try {
      if (!this.state.enabled) {
        throw new Error('Bluetooth não está habilitado');
      }

      if (this.state.discovering) {
        return;
      }

      // Verificar permissões
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Permissões de Bluetooth não concedidas');
      }

      this.state.discovering = true;
      this.state.devices = [];
      this.notifyListeners();

      // Buscar dispositivos BLE
      this.bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Erro durante scan:', error);
          this.state.discovering = false;
          this.notifyListeners();
          return;
        }

        if (device && device.name) {
          const bluetoothDevice: BluetoothDevice = {
            id: device.id,
            name: device.name,
            address: device.id, // BLE usa ID como endereço
            paired: false,
            connected: false,
            rssi: device.rssi || undefined,
            device: device
          };

          // Evitar duplicatas
          const exists = this.state.devices.find(d => d.id === device.id);
          if (!exists) {
            this.state.devices.push(bluetoothDevice);
            this.notifyListeners();
          }
        }
      });

      // Parar scan após 10 segundos
      setTimeout(() => {
        this.stopScan();
      }, 10000);
    } catch (error) {
      this.state.discovering = false;
      this.notifyListeners();
      console.error('Erro ao buscar dispositivos:', error);
      throw error;
    }
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
    console.log('Paired devices loaded from memory only');
  }

  // Parear com dispositivo (conectar no BLE)
  async pairDevice(device: BluetoothDevice): Promise<boolean> {
    try {
      if (!device.device) {
        throw new Error('Dispositivo BLE não encontrado');
      }

      // Conectar ao dispositivo BLE
      const connectedDevice = await this.bleManager.connectToDevice(device.id);
      await connectedDevice.discoverAllServicesAndCharacteristics();
      
      // Atualizar dispositivo como pareado e conectado
      const updatedDevice = { 
        ...device, 
        paired: true, 
        connected: true,
        device: connectedDevice 
      };
      
      // Remover da lista de dispositivos descobertos e adicionar aos pareados
      this.state.devices = this.state.devices.filter(d => d.id !== device.id);
      this.state.pairedDevices = [...this.state.pairedDevices, updatedDevice];
      this.state.connectedDevice = updatedDevice;
      
      this.notifyListeners();
      
      // Salvar no storage
      await this.saveConnectedDevice(updatedDevice);
      
      Alert.alert('Sucesso', `Conectado ao dispositivo ${device.name}`);
      
      return true;
    } catch (error) {
      console.error('Erro ao conectar dispositivo:', error);
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
        throw new Error('Dispositivo BLE não encontrado');
      }

      // Conectar ao dispositivo BLE
      const connectedDevice = await this.bleManager.connectToDevice(device.id);
      await connectedDevice.discoverAllServicesAndCharacteristics();
      
      // Atualizar dispositivo como conectado
      const updatedDevice = { 
        ...device, 
        connected: true,
        device: connectedDevice 
      };
      
      this.updateState({ connectedDevice: updatedDevice });
      
      // Salvar dispositivo conectado
      await this.saveConnectedDevice(updatedDevice);
      
      Alert.alert('Sucesso', `Conectado ao dispositivo ${device.name}`);
      
      return true;
    } catch (error) {
      console.error('Erro ao conectar dispositivo:', error);
      Alert.alert('Erro', `Falha ao conectar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
      
      // Converter string para base64
      const base64Data = Buffer.from(data, 'utf8').toString('base64');
      
      // Buscar serviços e características do dispositivo
      const services = await this.state.connectedDevice.device.services();
      
      // Procurar por uma característica de escrita
      for (const service of services) {
        const characteristics = await service.characteristics();
        
        for (const characteristic of characteristics) {
          // Verificar se a característica suporta escrita
          if (characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse) {
            await characteristic.writeWithResponse(base64Data);
            return true;
          }
        }
      }
      
      throw new Error('Nenhuma característica de escrita encontrada');
    } catch (error) {
      console.error('Erro ao enviar dados via Bluetooth:', error);
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

  // Remover dispositivo pareado
  async removePairedDevice(deviceId: string): Promise<void> {
    try {
      // Desconectar se estiver conectado
      if (this.state.connectedDevice?.id === deviceId) {
        await this.disconnectDevice();
      }
      
      // Remover da lista de pareados
      this.state.pairedDevices = this.state.pairedDevices.filter(d => d.id !== deviceId);
      this.notifyListeners();
      
      // Salvar no storage
      await this.savePairedDevices();
    } catch (error) {
      console.error('Erro ao remover dispositivo pareado:', error);
      throw error;
    }
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
    return [...this.state.pairedDevices];
  }

  getDiscoveredDevices(): BluetoothDevice[] {
    return [...this.state.devices];
  }
}

// Instância singleton
export const bluetoothService = new BluetoothService();
export default bluetoothService;