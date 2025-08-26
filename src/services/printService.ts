import { Alert } from 'react-native';
import bluetoothService, { BluetoothDevice } from './bluetoothService';
import ThermalPrinter from 'react-native-thermal-printer';

// Tipos de impressoras suportadas
export type PrinterType = 'moderninha_smart_2' | 'mercado_pago_point_smart' | 'mini_thermal_58mm' | 'mpt_ii_pos_mini_58mm';

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

  // Configurar impressora
  setPrinterConfig(config: PrinterConfig): void {
    this.printerConfig = config;
    // Configuração salva apenas em memória (sem persistência local)
    console.log('Configuração da impressora salva:', config);
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
      
      // Tentar conectar com ThermalPrinter
      try {
        await ThermalPrinter.init();
        const connected = await bluetoothService.connectDevice(device);
        
        if (connected) {
          config.isConnected = true;
          this.setPrinterConfig(config);
          console.log('MPT-II pos Mini 58mm conectada com sucesso');
          return true;
        }
      } catch (thermalError) {
        console.log('ThermalPrinter não disponível, usando conexão Bluetooth padrão');
        // Fallback para conexão Bluetooth padrão
        const connected = await bluetoothService.connectDevice(device);
        if (connected) {
          config.isConnected = true;
          this.setPrinterConfig(config);
          console.log('MPT-II conectada via Bluetooth padrão');
          return true;
        }
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
      // Aqui seria implementada a lógica específica para cada tipo de impressora
      switch (this.printerConfig.type) {
        case 'moderninha_smart_2':
          return await this.connectModerninhaSmartV2();
        case 'mercado_pago_point_smart':
          return await this.connectMercadoPagoPointSmart();
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

  // Conectar com Moderninha Smart V2
  private async connectModerninhaSmartV2(): Promise<boolean> {
    // Implementação específica para Moderninha Smart V2
    // Esta seria a integração real com o SDK da PagSeguro
    console.log('Conectando com Moderninha Smart V2...');
    
    // Simulação de conexão
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  }

  // Conectar com Mercado Pago Point Smart
  private async connectMercadoPagoPointSmart(): Promise<boolean> {
    // Implementação específica para Mercado Pago Point Smart
    // Esta seria a integração real com o SDK do Mercado Pago
    console.log('Conectando com Mercado Pago Point Smart...');
    
    // Simulação de conexão
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  }

  // Conectar com Mini Impressora Térmica Bluetooth 58mm
  private async connectMiniThermal58mm(): Promise<boolean> {
    try {
      console.log('Conectando com Mini Impressora Térmica 58mm...');
      
      // Verificar se há um dispositivo Bluetooth configurado
      if (this.printerConfig?.bluetoothDevice) {
        const success = await bluetoothService.connectDevice(this.printerConfig.bluetoothDevice);
        if (success) {
          console.log('Conectado via Bluetooth com sucesso');
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
        const connected = await bluetoothService.connectDevice(this.printerConfig.bluetoothDevice);
        
        if (connected) {
          console.log('MPT-II conectada com sucesso via Bluetooth');
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

  // Enviar dados para a impressora
  private async sendToPrinter(data: string): Promise<boolean> {
    try {
      // Aqui seria implementada a lógica real de envio dos dados
      // dependendo do tipo de impressora configurada
      
      switch (this.printerConfig?.type) {
        case 'moderninha_smart_2':
          return await this.printModerninhaSmartV2(data);
        case 'mercado_pago_point_smart':
          return await this.printMercadoPagoPointSmart(data);
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

  // Imprimir via Moderninha Smart V2
  private async printModerninhaSmartV2(data: string): Promise<boolean> {
    // Implementação específica para impressão via Moderninha Smart V2
    console.log('Imprimindo via Moderninha Smart V2:', data);
    
    // Simulação de impressão
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 2000);
    });
  }

  // Imprimir via Mercado Pago Point Smart
  private async printMercadoPagoPointSmart(data: string): Promise<boolean> {
    // Implementação específica para impressão via Mercado Pago Point Smart
    console.log('Imprimindo via Mercado Pago Point Smart:', data);
    
    // Simulação de impressão
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 2000);
    });
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
      
      // Enviar dados via Bluetooth
      const success = await bluetoothService.sendData(data);
      if (success) {
        console.log('Dados enviados via Bluetooth com sucesso');
        return true;
      } else {
        console.error('Falha ao enviar dados via Bluetooth');
        return false;
      }
    } catch (error) {
      console.error('Erro ao imprimir via Bluetooth:', error);
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
      
      // Tentar usar ThermalPrinter se disponível
      try {
        await ThermalPrinter.printText(data);
        console.log('Impressão MPT-II via ThermalPrinter concluída');
        return true;
      } catch (thermalError) {
        console.log('ThermalPrinter não disponível, usando Bluetooth padrão');
        
        // Fallback: enviar dados via Bluetooth padrão
        const success = await bluetoothService.sendData(data);
        if (success) {
          console.log('Impressão MPT-II via Bluetooth padrão concluída');
          return true;
        } else {
          console.error('Falha ao enviar dados via Bluetooth para MPT-II');
          return false;
        }
      }
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
    const printers: PrinterConfig[] = [
      {
        type: 'moderninha_smart_2',
        deviceName: 'Moderninha Smart V2',
        isConnected: false
      },
      {
        type: 'mercado_pago_point_smart',
        deviceName: 'Mercado Pago Point Smart',
        isConnected: false
      }
    ];

    try {
      // Adicionar dispositivos Bluetooth pareados como impressoras térmicas
      const pairedDevices = await bluetoothService.getPairedDevices();
      const connectedDevice = bluetoothService.getConnectedDevice();
      
      pairedDevices.forEach(device => {
        // Filtrar dispositivos que podem ser impressoras (baseado no nome ou tipo)
        if (this.isLikelyPrinter(device.name)) {
          // Detectar se é especificamente uma MPT-II
          const printerType = this.isMPTIIPrinter(device.name) ? 'mpt_ii_pos_mini_58mm' : 'mini_thermal_58mm';
          
          printers.push({
            type: printerType,
            deviceName: device.name,
            macAddress: device.address,
            isConnected: connectedDevice?.address === device.address,
            bluetoothDevice: device
          });
        }
      });
    } catch (error) {
      console.error('Erro ao buscar dispositivos Bluetooth:', error);
    }

    return printers;
  }

  // Verificar se um dispositivo é provavelmente uma impressora
  private isLikelyPrinter(deviceName: string): boolean {
    const printerKeywords = [
      'printer', 'print', 'thermal', 'pos', 'receipt', 
      'impressora', 'termica', 'cupom', 'ticket',
      'rp', 'tm', 'ep', 'zj', 'xp', 'mpt', 'mini'
    ];
    
    const lowerName = deviceName.toLowerCase();
    return printerKeywords.some(keyword => lowerName.includes(keyword));
  }

  // Verificar se um dispositivo é especificamente uma MPT-II
  private isMPTIIPrinter(deviceName: string): boolean {
    const mptKeywords = [
      'mpt-ii', 'mpt ii', 'mpt2', 'mpt_ii', 'mptii',
      'pos mini', 'mini 58mm', 'mini58mm'
    ];
    
    const lowerName = deviceName.toLowerCase();
    return mptKeywords.some(keyword => lowerName.includes(keyword));
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