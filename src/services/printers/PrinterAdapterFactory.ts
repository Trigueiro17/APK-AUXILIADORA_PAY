import { IPrinterAdapter, IPrinterAdapterConfig, PrinterType } from './IPrinterAdapter';
import { BluetoothEscPosPrinterAdapter } from './BluetoothEscPosPrinterAdapter';

/**
 * Factory para criação de adapters de impressora
 * Permite fácil adição de novos tipos de impressora
 */
export class PrinterAdapterFactory {
  private static adapters: Map<PrinterType, new () => IPrinterAdapter> = new Map([
    [PrinterType.BLUETOOTH_ESCPOS, BluetoothEscPosPrinterAdapter]
  ]);

  /**
   * Cria uma instância do adapter apropriado
   */
  static createAdapter(config: IPrinterAdapterConfig): IPrinterAdapter {
    const AdapterClass = this.adapters.get(config.type);
    
    if (!AdapterClass) {
      throw new Error(`Adapter não encontrado para o tipo: ${config.type}`);
    }

    return new AdapterClass();
  }

  /**
   * Registra um novo adapter
   */
  static registerAdapter(
    type: PrinterType, 
    adapterClass: new () => IPrinterAdapter
  ): void {
    this.adapters.set(type, adapterClass);
  }

  /**
   * Remove um adapter registrado
   */
  static unregisterAdapter(type: PrinterType): boolean {
    return this.adapters.delete(type);
  }

  /**
   * Lista todos os tipos de adapter disponíveis
   */
  static getAvailableAdapters(): PrinterType[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Verifica se um tipo de adapter está disponível
   */
  static isAdapterAvailable(type: PrinterType): boolean {
    return this.adapters.has(type);
  }

  /**
   * Cria um adapter com configuração padrão para Bluetooth ESC/POS
   */
  static createDefaultBluetoothAdapter(): IPrinterAdapter {
    return this.createAdapter({
      type: PrinterType.BLUETOOTH_ESCPOS,
      options: {
        encoding: 'GBK',
        codepage: 0,
        timeout: 10000
      }
    });
  }
}

/**
 * Configurações padrão para diferentes tipos de impressora
 */
export const DefaultPrinterConfigs: Record<PrinterType, IPrinterAdapterConfig> = {
  [PrinterType.BLUETOOTH_ESCPOS]: {
    type: PrinterType.BLUETOOTH_ESCPOS,
    options: {
      encoding: 'GBK',
      codepage: 0,
      timeout: 10000
    }
  },
  [PrinterType.BLUETOOTH_ESC_POS_PRINTER]: {
    type: PrinterType.BLUETOOTH_ESC_POS_PRINTER,
    options: {
      encoding: 'UTF-8',
      timeout: 15000
    }
  },
  [PrinterType.USB]: {
    type: PrinterType.USB,
    options: {
      timeout: 5000
    }
  },
  [PrinterType.WIFI]: {
    type: PrinterType.WIFI,
    options: {
      timeout: 20000
    }
  }
};

/**
 * Utilitário para detectar o melhor adapter baseado no ambiente
 */
export class PrinterAdapterDetector {
  /**
   * Detecta automaticamente o melhor adapter disponível
   */
  static async detectBestAdapter(): Promise<PrinterType | null> {
    const availableAdapters = PrinterAdapterFactory.getAvailableAdapters();
    
    // Prioridade: Bluetooth ESC/POS > Bluetooth ESC-POS-Printer > USB > WiFi
    const priority = [
      PrinterType.BLUETOOTH_ESCPOS,
      PrinterType.BLUETOOTH_ESC_POS_PRINTER,
      PrinterType.USB,
      PrinterType.WIFI
    ];

    for (const type of priority) {
      if (availableAdapters.includes(type)) {
        try {
          const adapter = PrinterAdapterFactory.createAdapter({ type });
          await adapter.initialize();
          
          // Verifica se o Bluetooth está disponível para adapters Bluetooth
          if (type.includes('bluetooth')) {
            const bluetoothEnabled = await adapter.isBluetoothEnabled();
            if (bluetoothEnabled) {
              return type;
            }
          } else {
            return type;
          }
        } catch (error) {
          console.warn(`Adapter ${type} não está disponível:`, error);
          continue;
        }
      }
    }

    return null;
  }
}