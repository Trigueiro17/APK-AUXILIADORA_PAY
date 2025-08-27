import { Alert, Platform } from 'react-native';
import bluetoothService, { BluetoothDevice } from '../services/bluetoothService';
import printService from '../services/printService';

/**
 * Utilitário para diagnóstico de problemas com Bluetooth e impressoras
 */
export class BluetoothDiagnostic {
  
  /**
   * Executa diagnóstico completo do Bluetooth
   */
  static async runFullDiagnostic(): Promise<void> {
    console.log('🔍 Iniciando diagnóstico Bluetooth...');
    
    try {
      // 1. Verificar estado do Bluetooth
      await this.checkBluetoothState();
      
      // 2. Verificar permissões
      await this.checkPermissions();
      
      // 3. Testar scan de dispositivos
      await this.testDeviceScan();
      
      // 4. Listar impressoras disponíveis
      await this.listAvailablePrinters();
      
      console.log('✅ Diagnóstico concluído');
      
    } catch (error) {
      console.error('❌ Erro durante diagnóstico:', error);
      Alert.alert('Erro no Diagnóstico', `${error}`);
    }
  }
  
  /**
   * Verifica o estado atual do Bluetooth
   */
  static async checkBluetoothState(): Promise<void> {
    console.log('📡 Verificando estado do Bluetooth...');
    
    const state = bluetoothService.getState();
    
    console.log('Estado BLE:', state.bleState);
    console.log('Bluetooth habilitado:', state.enabled);
    console.log('Descobrindo dispositivos:', state.discovering);
    console.log('Dispositivo conectado:', state.connectedDevice?.name || 'Nenhum');
    console.log('Dispositivos pareados:', state.pairedDevices.length);
    
    if (!state.enabled) {
      throw new Error('Bluetooth não está habilitado. Ative nas configurações do dispositivo.');
    }
  }
  
  /**
   * Verifica permissões necessárias
   */
  static async checkPermissions(): Promise<void> {
    console.log('🔐 Verificando permissões...');
    
    if (Platform.OS === 'android') {
      // As permissões são verificadas automaticamente pelo bluetoothService
      // durante a inicialização e scan
      console.log('Permissões Android serão verificadas durante o scan');
    } else {
      console.log('iOS - permissões gerenciadas automaticamente');
    }
  }
  
  /**
   * Testa a funcionalidade de scan de dispositivos
   */
  static async testDeviceScan(): Promise<BluetoothDevice[]> {
    console.log('🔍 Testando scan de dispositivos...');
    
    try {
      // Iniciar scan
      await bluetoothService.startScan();
      console.log('Scan iniciado com sucesso');
      
      // Aguardar 5 segundos
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Obter dispositivos descobertos
      const devices = bluetoothService.getDiscoveredDevices();
      console.log(`Dispositivos encontrados: ${devices.length}`);
      
      devices.forEach((device, index) => {
        console.log(`${index + 1}. ${device.name} (${device.address})`);
      });
      
      // Parar scan
      await bluetoothService.stopScan();
      console.log('Scan finalizado');
      
      return devices;
      
    } catch (error) {
      console.error('Erro durante scan:', error);
      throw new Error(`Falha no scan: ${error}`);
    }
  }
  
  /**
   * Lista impressoras disponíveis detectadas pelo sistema
   */
  static async listAvailablePrinters(): Promise<void> {
    console.log('🖨️ Listando impressoras disponíveis...');
    
    try {
      const printers = await printService.getAvailablePrinters();
      
      console.log(`Impressoras detectadas: ${printers.length}`);
      
      printers.forEach((printer, index) => {
        console.log(`${index + 1}. ${printer.deviceName} (${printer.type})`);
        console.log(`   - Conectada: ${printer.isConnected ? 'Sim' : 'Não'}`);
        console.log(`   - MAC: ${printer.macAddress || 'N/A'}`);
      });
      
      if (printers.length === 0) {
        console.log('⚠️ Nenhuma impressora detectada');
        console.log('Verifique se:');
        console.log('- A impressora está ligada');
        console.log('- A impressora está em modo pareamento');
        console.log('- A impressora está próxima (< 10m)');
        console.log('- O nome da impressora contém palavras-chave reconhecidas');
      }
      
    } catch (error) {
      console.error('Erro ao listar impressoras:', error);
      throw new Error(`Falha ao listar impressoras: ${error}`);
    }
  }
  
  /**
   * Verifica se um nome de dispositivo seria reconhecido como impressora
   */
  static checkPrinterNameCompatibility(deviceName: string): boolean {
    const printerKeywords = [
      'printer', 'print', 'thermal', 'pos', 'receipt', 
      'impressora', 'termica', 'cupom', 'ticket',
      'rp', 'tm', 'ep', 'zj', 'xp', 'mpt', 'mini'
    ];
    
    const lowerName = deviceName.toLowerCase();
    const isRecognized = printerKeywords.some(keyword => lowerName.includes(keyword));
    
    console.log(`Dispositivo "${deviceName}" seria reconhecido como impressora: ${isRecognized ? 'SIM' : 'NÃO'}`);
    
    if (!isRecognized) {
      console.log('Palavras-chave que o sistema procura:', printerKeywords.join(', '));
    }
    
    return isRecognized;
  }
  
  /**
   * Testa conexão com uma impressora específica
   */
  static async testPrinterConnection(device: BluetoothDevice): Promise<boolean> {
    console.log(`🔗 Testando conexão com ${device.name}...`);
    
    try {
      // Tentar conectar
      const connected = await bluetoothService.connectDevice(device);
      
      if (connected) {
        console.log('✅ Conexão estabelecida com sucesso');
        
        // Configurar como impressora
        const configured = await printService.setBluetoothPrinter(device);
        
        if (configured) {
          console.log('✅ Impressora configurada com sucesso');
          
          // Testar impressão
          try {
            await printService.testPrint();
            console.log('✅ Teste de impressão enviado');
          } catch (printError) {
            console.log('⚠️ Erro no teste de impressão:', printError);
          }
        } else {
          console.log('❌ Falha ao configurar impressora');
        }
        
        return true;
      } else {
        console.log('❌ Falha na conexão');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erro durante teste de conexão:', error);
      return false;
    }
  }
  
  /**
   * Gera relatório de diagnóstico
   */
  static async generateDiagnosticReport(): Promise<string> {
    const state = bluetoothService.getState();
    const printers = await printService.getAvailablePrinters();
    
    const report = `
=== RELATÓRIO DE DIAGNÓSTICO BLUETOOTH ===
Data: ${new Date().toLocaleString('pt-BR')}
Plataforma: ${Platform.OS} ${Platform.Version}

--- ESTADO DO BLUETOOTH ---
BLE State: ${state.bleState}
Habilitado: ${state.enabled ? 'SIM' : 'NÃO'}
Discovering: ${state.discovering ? 'SIM' : 'NÃO'}
Dispositivo Conectado: ${state.connectedDevice?.name || 'Nenhum'}

--- DISPOSITIVOS PAREADOS ---
${state.pairedDevices.length > 0 
  ? state.pairedDevices.map((d, i) => `${i+1}. ${d.name} (${d.address})`).join('\n')
  : 'Nenhum dispositivo pareado'
}

--- DISPOSITIVOS DESCOBERTOS ---
${state.devices.length > 0 
  ? state.devices.map((d, i) => `${i+1}. ${d.name} (${d.address})`).join('\n')
  : 'Nenhum dispositivo descoberto'
}

--- IMPRESSORAS DETECTADAS ---
${printers.length > 0 
  ? printers.map((p, i) => `${i+1}. ${p.deviceName} (${p.type}) - ${p.isConnected ? 'Conectada' : 'Desconectada'}`).join('\n')
  : 'Nenhuma impressora detectada'
}

=== FIM DO RELATÓRIO ===
`;
    
    console.log(report);
    return report;
  }
}

export default BluetoothDiagnostic;