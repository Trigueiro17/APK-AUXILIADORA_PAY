/**
 * Exemplo prático de conexão Bluetooth equivalente ao código Java:
 * BluetoothDevice device = bluetoothAdapter.getRemoteDevice("DC:0D:30:71:D5:97");
 * BluetoothSocket socket = device.createRfcommSocketToServiceRecord(MY_UUID);
 * socket.connect();
 */

import { Alert } from 'react-native';
import bluetoothService, { BluetoothDevice } from '../services/bluetoothService';
import { BluetoothEscPosPrinterAdapter } from '../services/printers/BluetoothEscPosPrinterAdapter';
import { BluetoothManager } from '@brooons/react-native-bluetooth-escpos-printer';

/**
 * Classe para conexão Bluetooth equivalente ao código Java
 */
export class BluetoothConnectionExample {
  private static readonly TARGET_ADDRESS = "DC:0D:30:71:D5:97";
  private static readonly CONNECTION_TIMEOUT = 10000; // 10 segundos
  private static readonly SCAN_TIMEOUT = 5000; // 5 segundos

  /**
   * Método 1: Conexão usando bluetoothService (BLE)
   * Equivalente mais seguro e moderno
   */
  static async connectViaBLE(): Promise<BluetoothDevice | null> {
    try {
      console.log('🔍 Iniciando conexão BLE...');
      
      // Inicializar serviço Bluetooth
      await bluetoothService.initialize();
      
      // Verificar se Bluetooth está habilitado
      if (!bluetoothService.isEnabled()) {
        throw new Error('Bluetooth não está habilitado');
      }
      
      // Buscar dispositivo específico
      const device = await this.findDeviceByAddress(this.TARGET_ADDRESS);
      
      if (!device) {
        throw new Error(`Dispositivo ${this.TARGET_ADDRESS} não encontrado`);
      }
      
      // Conectar ao dispositivo
      const connected = await bluetoothService.connectDevice(device);
      
      if (connected) {
        console.log('✅ Conexão BLE estabelecida com sucesso!');
        Alert.alert('Sucesso', `Conectado ao dispositivo ${device.name}`);
        return device;
      } else {
        throw new Error('Falha na conexão BLE');
      }
      
    } catch (error) {
      console.error('❌ Erro na conexão BLE:', error);
      Alert.alert('Erro BLE', error instanceof Error ? error.message : 'Erro desconhecido');
      return null;
    }
  }

  /**
   * Método 2: Conexão usando Bluetooth Clássico (mais próximo do Java)
   * Equivalente direto ao código Java fornecido
   */
  static async connectViaClassic(): Promise<boolean> {
    try {
      console.log('🔍 Iniciando conexão Bluetooth Clássico...');
      
      const adapter = new BluetoothEscPosPrinterAdapter();
      
      // Inicializar adapter
      await adapter.initialize();
      
      // Conectar diretamente pelo endereço MAC (equivalente ao Java)
      const connected = await adapter.connect(this.TARGET_ADDRESS);
      
      if (connected) {
        console.log('✅ Conexão Bluetooth Clássico estabelecida!');
        Alert.alert('Sucesso', `Conectado ao dispositivo ${this.TARGET_ADDRESS}`);
        return true;
      } else {
        throw new Error('Falha na conexão Bluetooth Clássico');
      }
      
    } catch (error) {
      console.error('❌ Erro na conexão Bluetooth Clássico:', error);
      Alert.alert('Erro Bluetooth', error instanceof Error ? error.message : 'Erro desconhecido');
      return false;
    }
  }

  /**
   * Método 3: Conexão direta usando BluetoothManager
   * Mais próximo possível do código Java original
   */
  static async connectDirect(): Promise<boolean> {
    try {
      console.log('🔍 Iniciando conexão direta...');
      
      // Verificar se Bluetooth está habilitado (equivalente a verificar bluetoothAdapter)
      const isEnabled = await BluetoothManager.checkBluetoothEnabled();
      if (!isEnabled) {
        console.log('📱 Habilitando Bluetooth...');
        await BluetoothManager.enableBluetooth();
      }
      
      // Conectar diretamente (equivalente ao socket.connect())
      console.log(`🔗 Conectando ao dispositivo ${this.TARGET_ADDRESS}...`);
      await BluetoothManager.connect(this.TARGET_ADDRESS);
      
      // Verificar se a conexão foi estabelecida
      const connectedAddress = await BluetoothManager.getConnectedDeviceAddress();
      
      if (connectedAddress === this.TARGET_ADDRESS) {
        console.log('✅ Conexão direta estabelecida com sucesso!');
        Alert.alert('Sucesso', `Conectado diretamente ao dispositivo ${this.TARGET_ADDRESS}`);
        return true;
      } else {
        throw new Error('Conexão não confirmada');
      }
      
    } catch (error) {
      console.error('❌ Erro na conexão direta:', error);
      Alert.alert('Erro Conexão', error instanceof Error ? error.message : 'Erro desconhecido');
      return false;
    }
  }

  /**
   * Método auxiliar para encontrar dispositivo por endereço MAC
   */
  private static async findDeviceByAddress(address: string): Promise<BluetoothDevice | null> {
    try {
      console.log(`🔍 Procurando dispositivo ${address}...`);
      
      // Verificar primeiro nos dispositivos pareados
      const pairedDevices = bluetoothService.getState().pairedDevices;
      let device = pairedDevices.find(d => 
        d.address.toLowerCase() === address.toLowerCase()
      );
      
      if (device) {
        console.log('📱 Dispositivo encontrado nos pareados');
        return device;
      }
      
      // Se não encontrado, fazer scan
      console.log('🔍 Iniciando scan de dispositivos...');
      await bluetoothService.startScan();
      
      // Aguardar scan
      await new Promise(resolve => setTimeout(resolve, this.SCAN_TIMEOUT));
      
      // Parar scan
      await bluetoothService.stopScan();
      
      // Buscar nos dispositivos descobertos
      const discoveredDevices = bluetoothService.getState().devices;
      device = discoveredDevices.find(d => 
        d.address.toLowerCase() === address.toLowerCase()
      );
      
      if (device) {
        console.log('📱 Dispositivo encontrado no scan');
        return device;
      }
      
      console.warn('⚠️ Dispositivo não encontrado');
      return null;
      
    } catch (error) {
      console.error('❌ Erro ao buscar dispositivo:', error);
      return null;
    }
  }

  /**
   * Método para testar conexão com diferentes abordagens
   */
  static async testAllConnectionMethods(): Promise<void> {
    console.log('🧪 Testando todos os métodos de conexão...');
    
    // Teste 1: BLE
    console.log('\n--- Teste 1: Conexão BLE ---');
    const bleResult = await this.connectViaBLE();
    
    if (bleResult) {
      // Se BLE funcionou, desconectar antes do próximo teste
      await bluetoothService.disconnectDevice();
    }
    
    // Aguardar um pouco entre testes
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Teste 2: Bluetooth Clássico
    console.log('\n--- Teste 2: Conexão Bluetooth Clássico ---');
    const classicResult = await this.connectViaClassic();
    
    if (classicResult) {
      // Desconectar
      const adapter = new BluetoothEscPosPrinterAdapter();
      await adapter.disconnect();
    }
    
    // Aguardar um pouco entre testes
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Teste 3: Conexão Direta
    console.log('\n--- Teste 3: Conexão Direta ---');
    const directResult = await this.connectDirect();
    
    // Resumo dos testes
    console.log('\n📊 Resumo dos Testes:');
    console.log(`BLE: ${bleResult ? '✅ Sucesso' : '❌ Falhou'}`);
    console.log(`Clássico: ${classicResult ? '✅ Sucesso' : '❌ Falhou'}`);
    console.log(`Direto: ${directResult ? '✅ Sucesso' : '❌ Falhou'}`);
    
    Alert.alert(
      'Testes Concluídos',
      `BLE: ${bleResult ? 'Sucesso' : 'Falhou'}\n` +
      `Clássico: ${classicResult ? 'Sucesso' : 'Falhou'}\n` +
      `Direto: ${directResult ? 'Sucesso' : 'Falhou'}`
    );
  }

  /**
   * Método para desconectar de todos os dispositivos
   */
  static async disconnectAll(): Promise<void> {
    try {
      console.log('🔌 Desconectando de todos os dispositivos...');
      
      // Desconectar BLE
      await bluetoothService.disconnectDevice();
      
      // Desconectar Bluetooth Clássico
      await BluetoothManager.disconnect();
      
      console.log('✅ Todos os dispositivos desconectados');
      
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
    }
  }
}

// Exemplo de uso:
// BluetoothConnectionExample.connectViaBLE();
// BluetoothConnectionExample.connectViaClassic();
// BluetoothConnectionExample.connectDirect();
// BluetoothConnectionExample.testAllConnectionMethods();