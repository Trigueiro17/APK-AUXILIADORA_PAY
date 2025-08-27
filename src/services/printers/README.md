# Sistema Modular de Impressoras Térmicas

Este sistema permite fácil adaptação entre diferentes bibliotecas de impressoras térmicas através de uma arquitetura modular baseada em adapters.

## Arquitetura

### Componentes Principais

1. **IPrinterAdapter** - Interface abstrata que define os métodos que todos os adapters devem implementar
2. **PrinterAdapterFactory** - Factory pattern para criação e gerenciamento de adapters
3. **BluetoothEscPosPrinterAdapter** - Implementação para a biblioteca `react-native-bluetooth-escpos-printer`
4. **PrintService** - Serviço principal que usa os adapters de forma transparente

## Como Adicionar um Novo Adapter

### Passo 1: Criar o Adapter

Crie uma nova classe que implemente a interface `IPrinterAdapter`:

```typescript
import { IPrinterAdapter, IPrinterDevice, IPrintOptions } from './IPrinterAdapter';

export class MinhaNovaImpressoraAdapter implements IPrinterAdapter {
  async initialize(): Promise<void> {
    // Implementar inicialização da biblioteca
  }

  async isBluetoothEnabled(): Promise<boolean> {
    // Verificar se Bluetooth está habilitado
  }

  async connect(deviceAddress: string): Promise<boolean> {
    // Implementar conexão com dispositivo
  }

  async printText(text: string, options?: IPrintOptions): Promise<boolean> {
    // Implementar impressão de texto
  }

  // ... implementar todos os outros métodos da interface

  getAdapterInfo() {
    return {
      name: 'MinhaNovaImpressoraAdapter',
      version: '1.0.0',
      supportedFeatures: ['bluetooth', 'text-printing', 'barcode-printing']
    };
  }
}
```

### Passo 2: Registrar o Adapter

Adicione o novo tipo de impressora ao enum `PrinterType` em `IPrinterAdapter.ts`:

```typescript
export enum PrinterType {
  BLUETOOTH_ESCPOS = 'bluetooth-escpos',
  BLUETOOTH_ESC_POS_PRINTER = 'bluetooth-esc-pos-printer',
  MINHA_NOVA_IMPRESSORA = 'minha-nova-impressora', // Novo tipo
  USB = 'usb',
  WIFI = 'wifi'
}
```

### Passo 3: Registrar no Factory

Registre o adapter no `PrinterAdapterFactory`:

```typescript
import { MinhaNovaImpressoraAdapter } from './MinhaNovaImpressoraAdapter';

// No constructor ou método de inicialização
PrinterAdapterFactory.registerAdapter(
  PrinterType.MINHA_NOVA_IMPRESSORA,
  MinhaNovaImpressoraAdapter
);
```

Ou adicione diretamente no Map de adapters:

```typescript
private static adapters: Map<PrinterType, new () => IPrinterAdapter> = new Map([
  [PrinterType.BLUETOOTH_ESCPOS, BluetoothEscPosPrinterAdapter],
  [PrinterType.MINHA_NOVA_IMPRESSORA, MinhaNovaImpressoraAdapter] // Novo adapter
]);
```

### Passo 4: Adicionar Configuração Padrão

Adicione uma configuração padrão em `DefaultPrinterConfigs`:

```typescript
export const DefaultPrinterConfigs: Record<PrinterType, IPrinterAdapterConfig> = {
  // ... outras configurações
  [PrinterType.MINHA_NOVA_IMPRESSORA]: {
    type: PrinterType.MINHA_NOVA_IMPRESSORA,
    options: {
      encoding: 'UTF-8',
      timeout: 10000,
      // outras opções específicas
    }
  }
};
```

## Exemplo: Adapter para Bluetooth-ESC/POS-Printer

Aqui está um exemplo de como criar um adapter para a biblioteca `react-native-bluetooth-escpos-printer`:

```typescript
import { IPrinterAdapter, IPrinterDevice, IPrintOptions, PrinterType } from './IPrinterAdapter';
import BluetoothEscPosPrinter from 'react-native-bluetooth-escpos-printer';

export class BluetoothEscPosPrinterLibAdapter implements IPrinterAdapter {
  async initialize(): Promise<void> {
    // Inicializar a biblioteca
    await BluetoothEscPosPrinter.init();
  }

  async isBluetoothEnabled(): Promise<boolean> {
    return await BluetoothEscPosPrinter.isBluetoothEnabled();
  }

  async scanDevices(): Promise<IPrinterDevice[]> {
    const devices = await BluetoothEscPosPrinter.scanDevices();
    return devices.map(device => ({
      id: device.address,
      name: device.name,
      address: device.address
    }));
  }

  async connect(deviceAddress: string): Promise<boolean> {
    try {
      await BluetoothEscPosPrinter.connect(deviceAddress);
      return true;
    } catch (error) {
      return false;
    }
  }

  async printText(text: string, options?: IPrintOptions): Promise<boolean> {
    try {
      await BluetoothEscPosPrinter.printText(text, {
        encoding: options?.encoding || 'UTF-8',
        codepage: options?.codepage || 0
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // ... implementar outros métodos

  getAdapterInfo() {
    return {
      name: 'BluetoothEscPosPrinterLibAdapter',
      version: '1.0.0',
      supportedFeatures: ['bluetooth', 'text-printing', 'barcode-printing']
    };
  }
}
```

## Uso no PrintService

O `PrintService` automaticamente detecta e usa o melhor adapter disponível:

```typescript
// Inicializar com detecção automática
await printService.initializeAdapter();

// Ou especificar um adapter específico
await printService.initializeAdapter(PrinterType.MINHA_NOVA_IMPRESSORA);

// Conectar e imprimir
await printService.connectWithAdapter('00:11:22:33:44:55');
await printService.printWithAdapter('Texto para impressão');
```

## Detecção Automática

O sistema inclui detecção automática do melhor adapter baseado na prioridade:

1. `BLUETOOTH_ESCPOS`
2. `BLUETOOTH_ESC_POS_PRINTER`
3. `USB`
4. `WIFI`

Para modificar a prioridade, edite o array `priority` em `PrinterAdapterDetector.detectBestAdapter()`.

## Compatibilidade

O sistema mantém total compatibilidade com o código existente. Se nenhum adapter for inicializado, o `PrintService` automaticamente usa os métodos legados.

## Benefícios

- **Modularidade**: Fácil adição/remoção de bibliotecas de impressora
- **Flexibilidade**: Troca entre diferentes bibliotecas sem alterar código cliente
- **Compatibilidade**: Mantém funcionamento do código existente
- **Extensibilidade**: Interface clara para novos tipos de impressora
- **Detecção Automática**: Seleciona automaticamente o melhor adapter disponível