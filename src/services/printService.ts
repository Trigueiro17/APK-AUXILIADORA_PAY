import { Alert } from 'react-native';
import bluetoothService, { BluetoothDevice } from './bluetoothService';
import {
  BluetoothEscposPrinter,
  BluetoothManager,
  BluetoothTscPrinter
} from '@brooons/react-native-bluetooth-escpos-printer';

// Nova arquitetura modular de impressoras
import { IPrinterAdapter, PrinterType as AdapterPrinterType } from './printers/IPrinterAdapter';
import { PrinterAdapterFactory, PrinterAdapterDetector } from './printers/PrinterAdapterFactory';

// Tipos de impressoras suportadas (mantido para compatibilidade)
export type PrinterType = 'mini_thermal_58mm' | 'mpt_ii_pos_mini_58mm';

// Mapeamento entre tipos antigos e novos
const PRINTER_TYPE_MAPPING: Record<PrinterType, AdapterPrinterType> = {
  'mini_thermal_58mm': AdapterPrinterType.BLUETOOTH_ESCPOS,
  'mpt_ii_pos_mini_58mm': AdapterPrinterType.BLUETOOTH_ESCPOS
};

// Interface para configuração da impressora
export interface PrinterConfig {
  type: PrinterType;
  deviceName?: string;
  macAddress?: string;
  isConnected: boolean;
  bluetoothDevice?: BluetoothDevice;
}

// Interface para dados do recibo
export interface ReceiptData {
  saleId: string;
  date: string;
  time: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  total: number;
  paymentMethod: string;
  cashierName?: string;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

// Comandos ESC/POS para impressoras térmicas
const ESC_POS_COMMANDS = {
  INIT: '\x1B\x40', // Inicializar impressora
  ALIGN_CENTER: '\x1B\x61\x01', // Centralizar texto
  ALIGN_LEFT: '\x1B\x61\x00', // Alinhar à esquerda
  ALIGN_RIGHT: '\x1B\x61\x02', // Alinhar à direita
  BOLD_ON: '\x1B\x45\x01', // Negrito ligado
  BOLD_OFF: '\x1B\x45\x00', // Negrito desligado
  UNDERLINE_ON: '\x1B\x2D\x01', // Sublinhado ligado
  UNDERLINE_OFF: '\x1B\x2D\x00', // Sublinhado desligado
  DOUBLE_HEIGHT: '\x1B\x21\x10', // Altura dupla
  NORMAL_SIZE: '\x1B\x21\x00', // Tamanho normal
  CUT_PAPER: '\x1D\x56\x00', // Cortar papel
  FEED_LINE: '\x0A', // Nova linha
  FEED_LINES: (lines: number) => '\x1B\x64' + String.fromCharCode(lines), // Múltiplas linhas
};

class PrintService {
  private printerConfig: PrinterConfig | null = null;
  private printerAdapter: IPrinterAdapter | null = null;
  private currentAdapterType: AdapterPrinterType | null = null;

  // Configurar impressora
  setPrinterConfig(config: PrinterConfig): void {
    this.printerConfig = config;
    // Configuração salva apenas em memória (sem persistência local)
    console.log('Configuração da impressora salva:', config);
  }

  // Métodos da nova arquitetura modular
  async initializeAdapter(adapterType?: AdapterPrinterType): Promise<boolean> {
    try {
      // Se não especificado, detecta automaticamente
      const targetType = adapterType || await PrinterAdapterDetector.detectBestAdapter();
      
      if (!targetType) {
        console.error('Nenhum adapter de impressora disponível');
        return false;
      }

      // Cria novo adapter se necessário
      if (this.currentAdapterType !== targetType) {
        this.printerAdapter = PrinterAdapterFactory.createAdapter({ type: targetType });
        this.currentAdapterType = targetType;
      }

      // Inicializa o adapter
      await this.printerAdapter!.initialize();
      console.log(`Adapter ${targetType} inicializado com sucesso`);
      return true;
    } catch (error) {
      console.error('Erro ao inicializar adapter:', error);
      return false;
    }
  }

  async connectWithAdapter(deviceAddress: string): Promise<boolean> {
    if (!this.printerAdapter) {
      const initialized = await this.initializeAdapter();
      if (!initialized) return false;
    }

    try {
      const connected = await this.printerAdapter!.connect(deviceAddress);
      if (connected) {
        console.log('Conectado via adapter:', deviceAddress);
      }
      return connected;
    } catch (error) {
      console.error('Erro ao conectar via adapter:', error);
      return false;
    }
  }

  async printWithAdapter(text: string): Promise<boolean> {
    if (!this.printerAdapter) {
      console.error('Adapter não inicializado');
      return false;
    }

    try {
      const isConnected = await this.printerAdapter.isConnected();
      if (!isConnected) {
        console.error('Impressora não conectada');
        return false;
      }

      return await this.printerAdapter.printText(text);
    } catch (error) {
      console.error('Erro ao imprimir via adapter:', error);
      return false;
    }
  }

  getAdapter(): IPrinterAdapter | null {
    return this.printerAdapter;
  }

  getCurrentAdapterType(): AdapterPrinterType | null {
    return this.currentAdapterType;
  }

  // Configurar impressora Bluetooth
  async setBluetoothPrinter(device: BluetoothDevice): Promise<boolean> {
    try {
      const config: PrinterConfig = {
        type: 'mini_thermal_58mm',
        deviceName: device.name,
        macAddress: device.address,
        isConnected: false,
        bluetoothDevice: device
      };
      
      this.setPrinterConfig(config);
      
      // Tentar conectar com o dispositivo
      const connected = await bluetoothService.connectDevice(device);
      if (connected) {
        config.isConnected = true;
        this.setPrinterConfig(config);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao configurar impressora Bluetooth:', error);
      return false;
    }
  }

  // Configurar impressora MPT-II pos Mini 58mm especificamente
  async setMPTIIPrinter(device: BluetoothDevice): Promise<boolean> {
    try {
      const config: PrinterConfig = {
        type: 'mpt_ii_pos_mini_58mm',
        deviceName: device.name,
        macAddress: device.address,
        isConnected: false,
        bluetoothDevice: device
      };
      
      this.setPrinterConfig(config);
      
      // Tentar conectar com o dispositivo
      const connected = await bluetoothService.connectDevice(device);
      if (connected) {
        config.isConnected = true;
        this.setPrinterConfig(config);
        console.log('MPT-II pos Mini 58mm conectada com sucesso');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao configurar impressora MPT-II:', error);
      return false;
    }
  }

  // Obter configuração atual da impressora
  getPrinterConfig(): PrinterConfig | null {
    return this.printerConfig;
  }

  // Verificar se a impressora está configurada
  isPrinterConfigured(): boolean {
    return this.printerConfig !== null && this.printerConfig.isConnected;
  }

  // Verificar se a impressora está conectada
  isPrinterConnected(): boolean {
    return this.printerConfig?.isConnected || false;
  }

  // Testar conectividade da nova biblioteca BluetoothEscposPrinter
  async testBluetoothConnection(): Promise<boolean> {
    try {
      // Verificar se o Bluetooth está habilitado
      const isEnabled = await BluetoothManager.checkBluetoothEnabled();
      if (!isEnabled) {
        console.log('Bluetooth não está habilitado');
        return false;
      }

      // Verificar dispositivos pareados
      const scanResult = await BluetoothManager.scanDevices();
      const parsedResult = JSON.parse(scanResult);
      const pairedDevices = parsedResult.paired || [];
      console.log('Dispositivos pareados:', pairedDevices);

      return pairedDevices.length > 0;
    } catch (error) {
      console.error('Erro ao testar conectividade Bluetooth:', error);
      return false;
    }
  }

  // Imprimir teste para verificar funcionamento
  async printTest(): Promise<boolean> {
    try {
      if (!this.printerConfig?.bluetoothDevice) {
        console.error('Nenhuma impressora configurada para teste');
        return false;
      }

      // Conectar com a impressora
      try {
        await BluetoothManager.connect(this.printerConfig.bluetoothDevice.address);
        console.log('Conectado com sucesso à impressora');
      } catch (error) {
        console.error('Falha ao conectar para teste:', error);
        return false;
      }

      // Imprimir teste simples
      await BluetoothEscposPrinter.printerInit();
      await BluetoothEscposPrinter.printText('=== TESTE DE IMPRESSÃO ===\n', {});
      await BluetoothEscposPrinter.printText('Impressora Bluetooth funcionando!\n', {});
      await BluetoothEscposPrinter.printText('Data: ' + new Date().toLocaleString() + '\n', {});
      await BluetoothEscposPrinter.printText('===============================\n\n\n', {});
      
      console.log('Teste de impressão concluído com sucesso');
      return true;
    } catch (error) {
      console.error('Erro no teste de impressão:', error);
      return false;
    }
  }

  // Gerar template de recibo formatado para impressora térmica 58mm
  private generateReceiptTemplate(data: ReceiptData): string {
    const { INIT, ALIGN_CENTER, ALIGN_LEFT, ALIGN_RIGHT, BOLD_ON, BOLD_OFF, DOUBLE_HEIGHT, NORMAL_SIZE, CUT_PAPER, FEED_LINE, FEED_LINES } = ESC_POS_COMMANDS;
    
    let receipt = INIT; // Inicializar impressora
    
    // Cabeçalho da loja
    receipt += ALIGN_CENTER + DOUBLE_HEIGHT + BOLD_ON;
    receipt += (data.storeName || 'AUXILIADORA PAY') + FEED_LINE;
    receipt += NORMAL_SIZE + BOLD_OFF;
    
    if (data.storeAddress) {
      receipt += data.storeAddress + FEED_LINE;
    }
    if (data.storePhone) {
      receipt += 'Tel: ' + data.storePhone + FEED_LINE;
    }
    
    receipt += FEED_LINE;
    receipt += '================================' + FEED_LINE;
    receipt += BOLD_ON + 'CUPOM FISCAL' + BOLD_OFF + FEED_LINE;
    receipt += '================================' + FEED_LINE;
    receipt += FEED_LINE;
    
    // Informações da venda
    receipt += ALIGN_LEFT;
    receipt += `Venda: ${data.saleId}` + FEED_LINE;
    receipt += `Data: ${data.date}` + FEED_LINE;
    receipt += `Hora: ${data.time}` + FEED_LINE;
    if (data.cashierName) {
      receipt += `Operador: ${data.cashierName}` + FEED_LINE;
    }
    receipt += FEED_LINE;
    
    // Cabeçalho dos itens
    receipt += '--------------------------------' + FEED_LINE;
    receipt += BOLD_ON + 'ITEM' + '\t' + 'QTD' + '\t' + 'VLR UNIT' + '\t' + 'TOTAL' + BOLD_OFF + FEED_LINE;
    receipt += '--------------------------------' + FEED_LINE;
    
    // Itens da venda
    data.items.forEach((item, index) => {
      const itemName = item.name.length > 20 ? item.name.substring(0, 17) + '...' : item.name;
      receipt += `${index + 1}. ${itemName}` + FEED_LINE;
      receipt += `   ${item.quantity}x R$ ${item.price.toFixed(2)}` + '\t' + `R$ ${item.total.toFixed(2)}` + FEED_LINE;
    });
    
    receipt += '--------------------------------' + FEED_LINE;
    
    // Totais
    receipt += ALIGN_RIGHT;
    receipt += `Subtotal: R$ ${data.subtotal.toFixed(2)}` + FEED_LINE;
    receipt += BOLD_ON + `TOTAL: R$ ${data.total.toFixed(2)}` + BOLD_OFF + FEED_LINE;
    receipt += FEED_LINE;
    
    // Forma de pagamento
    receipt += ALIGN_LEFT;
    receipt += `Forma de Pagamento: ${data.paymentMethod}` + FEED_LINE;
    receipt += FEED_LINE;
    
    // Rodapé
    receipt += ALIGN_CENTER;
    receipt += '================================' + FEED_LINE;
    receipt += 'Obrigado pela preferência!' + FEED_LINE;
    receipt += 'Volte sempre!' + FEED_LINE;
    receipt += '================================' + FEED_LINE;
    
    // Alimentar papel e cortar
    receipt += FEED_LINES(3);
    receipt += CUT_PAPER;
    
    return receipt;
  }

  // Conectar com a impressora via Bluetooth
  private async connectToPrinter(): Promise<boolean> {
    if (!this.printerConfig) {
      throw new Error('Impressora não configurada');
    }

    try {
      // Implementar lógica de conexão para impressoras térmicas Bluetooth
      switch (this.printerConfig.type) {
        case 'mini_thermal_58mm':
          return await this.connectMiniThermal58mm();
        case 'mpt_ii_pos_mini_58mm':
          return await this.connectMPTII();
        default:
          throw new Error('Tipo de impressora não suportado');
      }
    } catch (error) {
      console.error('Erro ao conectar com a impressora:', error);
      return false;
    }
  }

  // Conectar com Mini Impressora Térmica Bluetooth 58mm
  private async connectMiniThermal58mm(): Promise<boolean> {
    try {
      console.log('Conectando com Mini Impressora Térmica 58mm...');
      
      // Verificar se há um dispositivo Bluetooth configurado
      if (this.printerConfig?.bluetoothDevice) {
        // Usar BluetoothManager da nova biblioteca
        const isEnabled = await BluetoothManager.checkBluetoothEnabled();
        if (!isEnabled) {
          await BluetoothManager.enableBluetooth();
        }
        
        await BluetoothManager.connect(this.printerConfig.bluetoothDevice.address);
        const success = true;
        if (success) {
          console.log('Conectado via BluetoothEscposPrinter com sucesso');
          return true;
        }
      }
      
      // Se não há dispositivo configurado, verificar se há um conectado
      const connectedDevice = bluetoothService.getConnectedDevice();
      if (connectedDevice) {
        console.log('Usando dispositivo Bluetooth já conectado:', connectedDevice.name);
        return true;
      }
      
      console.log('Nenhum dispositivo Bluetooth disponível para impressão');
      return false;
    } catch (error) {
      console.error('Erro ao conectar via Bluetooth:', error);
      return false;
    }
  }

  // Conectar com MPT-II pos Mini 58mm
  private async connectMPTII(): Promise<boolean> {
    try {
      console.log('Conectando com MPT-II pos Mini 58mm...');
      
      // Verificar se a impressora já está conectada
      if (this.printerConfig?.isConnected) {
        return true;
      }
      
      // Verificar se há um dispositivo configurado
      if (this.printerConfig?.bluetoothDevice) {
        // Usar BluetoothManager da nova biblioteca
        const isEnabled = await BluetoothManager.checkBluetoothEnabled();
        if (!isEnabled) {
          await BluetoothManager.enableBluetooth();
        }
        
        await BluetoothManager.connect(this.printerConfig.bluetoothDevice.address);
        const connected = true;
        
        if (connected) {
          console.log('MPT-II conectada com sucesso via BluetoothEscposPrinter');
          return true;
        }
      }
      
      console.log('Falha ao conectar com MPT-II');
      return false;
    } catch (error) {
      console.error('Erro ao conectar com MPT-II:', error);
      return false;
    }
  }

  // Imprimir recibo
  async printReceipt(receiptData: ReceiptData): Promise<boolean> {
    try {
      // Tentar usar o novo adapter primeiro
      if (this.printerAdapter) {
        return await this.printReceiptWithAdapter(receiptData);
      }

      // Fallback para o método legado
      if (!this.isPrinterConfigured()) {
        Alert.alert(
          'Impressora não configurada',
          'Por favor, configure uma impressora nas configurações do aplicativo.'
        );
        return false;
      }

      // Conectar com a impressora
      const connected = await this.connectToPrinter();
      if (!connected) {
        Alert.alert(
          'Erro de conexão',
          'Não foi possível conectar com a impressora. Verifique se ela está ligada e pareada.'
        );
        return false;
      }

      // Gerar template do recibo
      const receiptTemplate = this.generateReceiptTemplate(receiptData);

      // Enviar dados para impressão
      const printed = await this.sendToPrinter(receiptTemplate);
      
      if (printed) {
        Alert.alert(
          'Sucesso',
          'Recibo impresso com sucesso!'
        );
        return true;
      } else {
        Alert.alert(
          'Erro na impressão',
          'Ocorreu um erro durante a impressão. Tente novamente.'
        );
        return false;
      }
    } catch (error) {
      console.error('Erro ao imprimir recibo:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro inesperado durante a impressão.'
      );
      return false;
    }
  }

  // Método para imprimir recibo usando o novo adapter
  private async printReceiptWithAdapter(receiptData: ReceiptData): Promise<boolean> {
    try {
      const isConnected = await this.printerAdapter!.isConnected();
      if (!isConnected) {
        Alert.alert(
          'Erro de conexão',
          'Impressora não conectada. Verifique a conexão.'
        );
        return false;
      }

      // Gerar template do recibo
      const receiptTemplate = this.generateReceiptTemplate(receiptData);

      // Imprimir usando o adapter
      const printed = await this.printerAdapter!.printText(receiptTemplate);
      
      if (printed) {
        // Cortar papel se suportado
        await this.printerAdapter!.cutPaper().catch(() => {
          console.log('Corte de papel não suportado ou falhou');
        });
        
        Alert.alert(
          'Sucesso',
          'Recibo impresso com sucesso!'
        );
        return true;
      } else {
        Alert.alert(
          'Erro na impressão',
          'Ocorreu um erro durante a impressão. Tente novamente.'
        );
        return false;
      }
    } catch (error) {
      console.error('Erro ao imprimir recibo via adapter:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro inesperado durante a impressão.'
      );
      return false;
    }
  }

  // Enviar dados para a impressora
  private async sendToPrinter(data: string): Promise<boolean> {
    try {
      // Aqui seria implementada a lógica real de envio dos dados
      // dependendo do tipo de impressora configurada
      
      switch (this.printerConfig?.type) {
        case 'mini_thermal_58mm':
          return await this.printMiniThermal58mm(data);
        case 'mpt_ii_pos_mini_58mm':
          return await this.printMPTII(data);
        default:
          return false;
      }
    } catch (error) {
      console.error('Erro ao enviar dados para impressora:', error);
      return false;
    }
  }

  // Imprimir via Mini Impressora Térmica 58mm
  private async printMiniThermal58mm(data: string): Promise<boolean> {
    try {
      console.log('Imprimindo via Mini Impressora Térmica 58mm:', data);
      
      // Verificar se há um dispositivo Bluetooth conectado
      const connectedDevice = bluetoothService.getConnectedDevice();
      if (!connectedDevice) {
        console.error('Nenhum dispositivo Bluetooth conectado');
        return false;
      }
      
      // Usar a nova biblioteca BluetoothEscposPrinter
      await BluetoothEscposPrinter.printerInit();
      await BluetoothEscposPrinter.printText(data, {});
      await BluetoothEscposPrinter.printText('\n\n\n', {});
      await BluetoothEscposPrinter.printerLeftSpace(0);
      
      console.log('Dados enviados via BluetoothEscposPrinter com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao imprimir via BluetoothEscposPrinter:', error);
      return false;
    }
  }

  // Imprimir via MPT-II pos Mini 58mm
  private async printMPTII(data: string): Promise<boolean> {
    try {
      console.log('Imprimindo via MPT-II pos Mini 58mm:', data);
      
      // Verificar se há um dispositivo Bluetooth conectado
      const connectedDevice = bluetoothService.getConnectedDevice();
      if (!connectedDevice) {
        console.error('Nenhum dispositivo Bluetooth conectado para MPT-II');
        return false;
      }
      
      // Usar a nova biblioteca BluetoothEscposPrinter para MPT-II
      await BluetoothEscposPrinter.printerInit();
      await BluetoothEscposPrinter.printText(data, {});
      await BluetoothEscposPrinter.printText('\n\n\n', {});
      await BluetoothEscposPrinter.printerLeftSpace(0);
      
      console.log('Impressão MPT-II via BluetoothEscposPrinter concluída');
      return true;
    } catch (error) {
      console.error('Erro ao imprimir via MPT-II:', error);
      return false;
    }
  }

  // Testar impressão
  async testPrint(): Promise<boolean> {
    const testData: ReceiptData = {
      saleId: 'TEST-001',
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR'),
      items: [
        {
          name: 'Produto Teste',
          quantity: 1,
          price: 10.00,
          total: 10.00
        }
      ],
      subtotal: 10.00,
      total: 10.00,
      paymentMethod: 'Dinheiro',
      cashierName: 'Teste',
      storeName: 'AUXILIADORA PAY',
      storeAddress: 'Endereço da Loja',
      storePhone: '(11) 99999-9999'
    };

    return await this.printReceipt(testData);
  }

  // Listar impressoras disponíveis
  async getAvailablePrinters(): Promise<PrinterConfig[]> {
    const printers: PrinterConfig[] = [];

    try {
      console.log('🔍 [PrintService] Iniciando busca por impressoras...');
      
      // Verificar se o Bluetooth está habilitado
      const bluetoothState = bluetoothService.getState();
      console.log('📱 [PrintService] Estado do Bluetooth:', {
        enabled: bluetoothState.enabled,
        bleState: bluetoothState.bleState,
        discovering: bluetoothState.discovering
      });
      
      if (!bluetoothState.enabled) {
        console.warn('⚠️ [PrintService] Bluetooth não está habilitado');
        return printers;
      }
      
      // Buscar dispositivos Bluetooth pareados (BLE e clássicos)
      const pairedDevices = await bluetoothService.getPairedDevices();
      const classicDevices = await bluetoothService.getClassicBluetoothDevices();
      const connectedDevice = bluetoothService.getConnectedDevice();
      
      // Combinar dispositivos BLE e clássicos
      const allDevices = [...pairedDevices, ...classicDevices];
      
      // Remover duplicatas baseado no endereço MAC
      const uniqueDevices = allDevices.filter((device, index, self) => 
        index === self.findIndex(d => d.address === device.address)
      );
      
      console.log('📋 [PrintService] Dispositivos BLE encontrados:', pairedDevices.length);
      console.log('📱 [PrintService] Dispositivos clássicos encontrados:', classicDevices.length);
      console.log('📋 [PrintService] Total de dispositivos únicos:', uniqueDevices.length);
      console.log('🔗 [PrintService] Dispositivo conectado:', connectedDevice?.name || 'Nenhum');
      
      // Log de todos os dispositivos encontrados
      uniqueDevices.forEach((device, index) => {
        console.log(`📱 [PrintService] Dispositivo ${index + 1}:`, {
          name: device.name,
          address: device.address,
          paired: device.paired,
          connected: device.connected
        });
      });
      
      // Verificar cada dispositivo único
      for (const device of uniqueDevices) {
        // Filtrar dispositivos que podem ser impressoras (baseado no nome ou tipo)
        const isLikelyPrinter = this.isLikelyPrinter(device.name);
        console.log(`🖨️ [PrintService] É provável impressora? ${isLikelyPrinter} (${device.name})`);
        
        if (isLikelyPrinter) {
          // Detectar se é especificamente uma MPT-II
          const isMPTII = this.isMPTIIPrinter(device.name);
          const printerType = isMPTII ? 'mpt_ii_pos_mini_58mm' : 'mini_thermal_58mm';
          
          console.log(`✅ [PrintService] Impressora detectada: ${device.name} (Tipo: ${printerType})`);
          
          printers.push({
            type: printerType,
            deviceName: device.name,
            macAddress: device.address,
            isConnected: connectedDevice?.address === device.address,
            bluetoothDevice: device
          });
        }
      }
      
      console.log(`🎯 [PrintService] Total de impressoras encontradas: ${printers.length}`);
      
    } catch (error) {
      console.error('❌ [PrintService] Erro ao buscar dispositivos Bluetooth:', error);
    }

    return printers;
  }

  // Verificar se um dispositivo é provavelmente uma impressora
  private isLikelyPrinter(deviceName: string): boolean {
    const printerKeywords = [
      'printer', 'print', 'thermal', 'pos', 'receipt', 
      'impressora', 'termica', 'cupom', 'ticket',
      'rp', 'tm', 'ep', 'zj', 'xp', 'mpt', 'mini',
      'escpos', 'esc/pos', 'bluetooth printer', 'bt printer'
    ];
    
    const lowerName = deviceName.toLowerCase();
    const isMatch = printerKeywords.some(keyword => lowerName.includes(keyword));
    
    console.log(`🔍 [PrintService] Verificando '${deviceName}' contra palavras-chave:`, {
      deviceName: lowerName,
      keywords: printerKeywords,
      isMatch
    });
    
    return isMatch;
  }

  // Verificar se um dispositivo é especificamente uma MPT-II
  private isMPTIIPrinter(deviceName: string): boolean {
    const mptKeywords = [
      'mpt-ii', 'mpt ii', 'mpt2', 'mpt_ii', 'mptii',
      'pos mini', 'mini 58mm', 'mini58mm'
    ];
    
    const lowerName = deviceName.toLowerCase();
    const isMatch = mptKeywords.some(keyword => lowerName.includes(keyword));
    
    console.log(`🔍 [PrintService] Verificando MPT-II '${deviceName}':`, {
      deviceName: lowerName,
      keywords: mptKeywords,
      isMatch
    });
    
    return isMatch;
  }
}

// Instância singleton do serviço
const printService = new PrintService();

// Método utilitário para configurar MPT-II rapidamente
export const configureMPTII = async (device: BluetoothDevice): Promise<boolean> => {
  return await printService.setMPTIIPrinter(device);
};

// Método utilitário para testar impressão MPT-II
export const testMPTIIPrint = async (): Promise<boolean> => {
  const config = printService.getPrinterConfig();
  if (config?.type === 'mpt_ii_pos_mini_58mm') {
    return await printService.testPrint();
  }
  return false;
};

export default printService;
export { PrintService };