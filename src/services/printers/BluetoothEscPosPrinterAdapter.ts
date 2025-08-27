import { BluetoothEscposPrinter, BluetoothManager } from '@brooons/react-native-bluetooth-escpos-printer';

/**
 * Classe voltada para conexão e impressão em impressoras Bluetooth ESC/POS.
 */
export class BluetoothEscPosPrinterAdapter {
  private isInitialized = false;

  /**
   * Inicializa o módulo de Bluetooth, verificando se está habilitado.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const isEnabled = await BluetoothManager.checkBluetoothEnabled();
      if (!isEnabled) {
        await BluetoothManager.enableBluetooth();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Erro ao inicializar o Bluetooth:', error);
      throw new Error('Bluetooth não pode ser iniciado');
    }
  }

  /**
   * Escaneia dispositivos Bluetooth disponíveis.
   */
  async scanDevices(): Promise<Array<{ name: string; address: string }>> {
    try {
      const result = await BluetoothManager.scanDevices();
      const devices = [...(result?.paired || []), ...(result?.found || [])];

      return devices.map((device: any) => ({
        name: device.name || 'Desconhecido',
        address: device.address
      }));
    } catch (error) {
      console.error('Erro ao escanear dispositivos:', error);
      return [];
    }
  }

  /**
   * Conecta-se a uma impressora via endereço MAC.
   * @param address Endereço MAC da impressora
   */
  async connect(address: string): Promise<boolean> {
    try {
      await BluetoothManager.connect(address);
      console.log(`Conectado à impressora: ${address}`);
      return true;
    } catch (error) {
      console.error('Erro ao conectar à impressora:', error);
      return false;
    }
  }

  /**
   * Verifica se está conectado a uma impressora.
   */
  async isConnected(): Promise<boolean> {
    try {
      const address = await BluetoothManager.getConnectedDeviceAddress();
      return !!address;
    } catch (error) {
      return false;
    }
  }

  /**
   * Desconecta da impressora atual.
   */
  async disconnect(): Promise<boolean> {
    try {
      await BluetoothManager.disconnect();
      return true;
    } catch (error) {
      console.error('Erro ao desconectar da impressora:', error);
      return false;
    }
  }

  /**
   * Imprime texto simples na impressora conectada.
   * @param text Texto a ser impresso
   */
  async printText(text: string): Promise<boolean> {
    try {
      const connected = await this.isConnected();
      if (!connected) throw new Error('Nenhuma impressora conectada');

      await BluetoothEscposPrinter.printText(`${text}\n`, {
        encoding: 'GBK',       // ou 'UTF-8' se sua impressora suportar
        codepage: 0,
        widthTimes: 1,
        heightTimes: 1,
        fonttype: 0
      });

      return true;
    } catch (error) {
      console.error('Erro ao imprimir texto:', error);
      return false;
    }
  }
}
