/**
 * Interface abstrata para adapters de impressoras térmicas
 * Permite fácil troca entre diferentes bibliotecas de impressão
 */
export interface IPrinterDevice {
  id: string;
  name: string;
  address: string;
  connected?: boolean;
}

export interface IPrintOptions {
  encoding?: string;
  codepage?: number;
  widthTimes?: number;
  heightTimes?: number;
  fonttype?: number;
}

export interface IPrinterAdapter {
  /**
   * Inicializa o adapter da impressora
   */
  initialize(): Promise<void>;

  /**
   * Verifica se o Bluetooth está habilitado
   */
  isBluetoothEnabled(): Promise<boolean>;

  /**
   * Habilita o Bluetooth
   */
  enableBluetooth(): Promise<boolean>;

  /**
   * Busca dispositivos Bluetooth disponíveis
   */
  scanDevices(): Promise<IPrinterDevice[]>;

  /**
   * Conecta a um dispositivo específico
   */
  connect(deviceAddress: string): Promise<boolean>;

  /**
   * Desconecta do dispositivo atual
   */
  disconnect(): Promise<boolean>;

  /**
   * Verifica se está conectado a algum dispositivo
   */
  isConnected(): Promise<boolean>;

  /**
   * Obtém o endereço do dispositivo conectado
   */
  getConnectedDeviceAddress(): Promise<string | null>;

  /**
   * Imprime texto simples
   */
  printText(text: string, options?: IPrintOptions): Promise<boolean>;

  /**
   * Imprime texto com formatação
   */
  printFormattedText(text: string, options?: IPrintOptions): Promise<boolean>;

  /**
   * Imprime código de barras
   */
  printBarcode(data: string, type: string, options?: IPrintOptions): Promise<boolean>;

  /**
   * Imprime QR Code
   */
  printQRCode(data: string, size?: number): Promise<boolean>;

  /**
   * Imprime imagem (se suportado)
   */
  printImage?(imagePath: string, options?: IPrintOptions): Promise<boolean>;

  /**
   * Corta o papel
   */
  cutPaper(): Promise<boolean>;

  /**
   * Abre a gaveta de dinheiro
   */
  openCashDrawer(): Promise<boolean>;

  /**
   * Limpa o buffer de impressão
   */
  clearBuffer(): Promise<boolean>;

  /**
   * Obtém informações sobre o adapter
   */
  getAdapterInfo(): {
    name: string;
    version: string;
    supportedFeatures: string[];
  };
}

/**
 * Tipos de impressora suportados
 */
export enum PrinterType {
  BLUETOOTH_ESCPOS = 'bluetooth-escpos',
  BLUETOOTH_ESC_POS_PRINTER = 'bluetooth-esc-pos-printer',
  USB = 'usb',
  WIFI = 'wifi'
}

/**
 * Configuração do adapter de impressora
 */
export interface IPrinterAdapterConfig {
  type: PrinterType;
  options?: {
    encoding?: string;
    codepage?: number;
    timeout?: number;
    [key: string]: any;
  };
}