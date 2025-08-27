/**
 * Exemplo de uso da arquitetura modular de impressoras
 * Este arquivo demonstra como usar os novos adapters de impressora
 */

import { PrinterAdapterFactory, PrinterAdapterDetector } from './PrinterAdapterFactory';
import { PrinterType, IPrinterAdapter } from './IPrinterAdapter';
import printService from '../printService';

/**
 * Exemplo 1: Uso básico com detecção automática
 */
export async function exemploUsoBasico() {
  try {
    // Inicializar com detecção automática do melhor adapter
    const inicializado = await printService.initializeAdapter();
    
    if (!inicializado) {
      console.error('Nenhum adapter de impressora disponível');
      return;
    }

    console.log('Adapter inicializado:', printService.getCurrentAdapterType());

    // Conectar a um dispositivo (substitua pelo endereço real)
    const conectado = await printService.connectWithAdapter('00:11:22:33:44:55');
    
    if (conectado) {
      // Imprimir texto simples
      await printService.printWithAdapter('Teste de impressão\n\n');
      console.log('Impressão realizada com sucesso!');
    }
  } catch (error) {
    console.error('Erro no exemplo básico:', error);
  }
}

/**
 * Exemplo 2: Uso direto do adapter
 */
export async function exemploUsoDirecto() {
  try {
    // Criar adapter específico
    const adapter = PrinterAdapterFactory.createAdapter({
      type: PrinterType.BLUETOOTH_ESCPOS,
      options: {
        encoding: 'GBK',
        timeout: 15000
      }
    });

    // Inicializar
    await adapter.initialize();

    // Verificar Bluetooth
    const bluetoothHabilitado = await adapter.isBluetoothEnabled();
    if (!bluetoothHabilitado) {
      await adapter.enableBluetooth();
    }

    // Escanear dispositivos
    const dispositivos = await adapter.scanDevices();
    console.log('Dispositivos encontrados:', dispositivos);

    // Conectar ao primeiro dispositivo encontrado
    if (dispositivos.length > 0) {
      const conectado = await adapter.connect(dispositivos[0].address);
      
      if (conectado) {
        // Imprimir texto formatado
        await adapter.printText('=== RECIBO ===\n', { 
          widthTimes: 2, 
          heightTimes: 2 
        });
        
        await adapter.printText('Item 1: R$ 10,00\n');
        await adapter.printText('Item 2: R$ 15,00\n');
        await adapter.printText('Total: R$ 25,00\n\n');
        
        // Imprimir QR Code
        await adapter.printQRCode('https://exemplo.com/recibo/123', 200);
        
        // Cortar papel
        await adapter.cutPaper();
        
        console.log('Recibo impresso com sucesso!');
      }
    }
  } catch (error) {
    console.error('Erro no exemplo direto:', error);
  }
}

/**
 * Exemplo 3: Detecção e listagem de adapters
 */
export async function exemploDeteccaoAdapters() {
  try {
    // Listar adapters disponíveis
    const adaptersDisponiveis = PrinterAdapterFactory.getAvailableAdapters();
    console.log('Adapters disponíveis:', adaptersDisponiveis);

    // Detectar melhor adapter
    const melhorAdapter = await PrinterAdapterDetector.detectBestAdapter();
    console.log('Melhor adapter detectado:', melhorAdapter);

    // Verificar se um adapter específico está disponível
    const bluetoothDisponivel = PrinterAdapterFactory.isAdapterAvailable(
      PrinterType.BLUETOOTH_ESCPOS
    );
    console.log('Bluetooth ESC/POS disponível:', bluetoothDisponivel);

    // Obter informações do adapter
    if (melhorAdapter) {
      const adapter = PrinterAdapterFactory.createAdapter({ type: melhorAdapter });
      const info = adapter.getAdapterInfo();
      console.log('Informações do adapter:', info);
    }
  } catch (error) {
    console.error('Erro na detecção de adapters:', error);
  }
}

/**
 * Exemplo 4: Uso com PrintService (método recomendado)
 */
export async function exemploComPrintService() {
  try {
    // Dados de exemplo para recibo
    const dadosRecibo = {
      saleId: 'VENDA-001',
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR'),
      items: [
        { name: 'Produto A', quantity: 2, price: 10.00, total: 20.00 },
        { name: 'Produto B', quantity: 1, price: 15.00, total: 15.00 }
      ],
      subtotal: 35.00,
      total: 35.00,
      paymentMethod: 'Dinheiro',
      cashierName: 'João Silva',
      storeName: 'Loja Exemplo',
      storeAddress: 'Rua das Flores, 123',
      storePhone: '(11) 1234-5678'
    };

    // Inicializar adapter
    await printService.initializeAdapter();

    // Conectar (substitua pelo endereço real)
    const conectado = await printService.connectWithAdapter('00:11:22:33:44:55');
    
    if (conectado) {
      // Imprimir recibo usando o novo sistema
      const impresso = await printService.printReceipt(dadosRecibo);
      
      if (impresso) {
        console.log('Recibo impresso com sucesso via novo sistema!');
      }
    }
  } catch (error) {
    console.error('Erro no exemplo com PrintService:', error);
  }
}

/**
 * Exemplo 5: Tratamento de erros e fallback
 */
export async function exemploTratamentoErros() {
  try {
    // Tentar inicializar adapter
    const inicializado = await printService.initializeAdapter();
    
    if (!inicializado) {
      console.log('Adapter não disponível, usando método legado');
      
      // Fallback para método legado
      // O PrintService automaticamente usa os métodos antigos
      // quando nenhum adapter está inicializado
      return;
    }

    // Tentar conectar com timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout de conexão')), 10000)
    );
    
    const conectarPromise = printService.connectWithAdapter('00:11:22:33:44:55');
    
    try {
      const conectado = await Promise.race([conectarPromise, timeoutPromise]);
      
      if (conectado) {
        console.log('Conectado com sucesso!');
      }
    } catch (error) {
      console.error('Erro de conexão:', error);
      
      // Tentar reconectar ou usar outro método
      console.log('Tentando método alternativo...');
    }
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

/**
 * Exemplo 6: Configuração personalizada
 */
export async function exemploConfiguracaoPersonalizada() {
  try {
    // Criar adapter com configuração personalizada
    const adapter = PrinterAdapterFactory.createAdapter({
      type: PrinterType.BLUETOOTH_ESCPOS,
      options: {
        encoding: 'UTF-8',
        codepage: 65001, // UTF-8
        timeout: 20000
      }
    });

    await adapter.initialize();

    // Configurações de impressão personalizadas
    const opcoesPrint = {
      encoding: 'UTF-8',
      widthTimes: 1,
      heightTimes: 1,
      fonttype: 0
    };

    // Conectar e imprimir com configurações personalizadas
    const conectado = await adapter.connect('00:11:22:33:44:55');
    
    if (conectado) {
      await adapter.printText('Texto com configuração personalizada\n', opcoesPrint);
      console.log('Impressão personalizada realizada!');
    }
  } catch (error) {
    console.error('Erro na configuração personalizada:', error);
  }
}