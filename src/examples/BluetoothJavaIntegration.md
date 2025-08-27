# Integração Bluetooth Java com React Native

## Código Java Fornecido

O usuário forneceu este código Java para conexão Bluetooth:

```java
BluetoothDevice device = bluetoothAdapter.getRemoteDevice("DC:0D:30:71:D5:97"); 
BluetoothSocket socket = device.createRfcommSocketToServiceRecord(MY_UUID); 
socket.connect();
```

## Equivalente no React Native (Projeto Atual)

### 1. Usando bluetoothService.ts (BLE)

```typescript
import bluetoothService from '../services/bluetoothService';

// Conectar a um dispositivo específico por endereço MAC
async function connectToSpecificDevice() {
  try {
    // Inicializar o serviço Bluetooth
    await bluetoothService.initialize();
    
    // Buscar dispositivo pelo endereço MAC
    const targetAddress = "DC:0D:30:71:D5:97";
    
    // Iniciar scan para encontrar o dispositivo
    await bluetoothService.startScan();
    
    // Aguardar alguns segundos para o scan
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Parar o scan
    await bluetoothService.stopScan();
    
    // Buscar o dispositivo na lista de dispositivos encontrados
    const devices = bluetoothService.getState().devices;
    const targetDevice = devices.find(device => 
      device.address.toLowerCase() === targetAddress.toLowerCase()
    );
    
    if (targetDevice) {
      // Conectar ao dispositivo
      const connected = await bluetoothService.connectDevice(targetDevice);
      
      if (connected) {
        console.log('✅ Dispositivo conectado com sucesso!');
        return targetDevice;
      } else {
        throw new Error('Falha na conexão');
      }
    } else {
      throw new Error('Dispositivo não encontrado');
    }
  } catch (error) {
    console.error('❌ Erro ao conectar:', error);
    throw error;
  }
}
```

### 2. Usando BluetoothEscPosPrinterAdapter (Bluetooth Clássico)

```typescript
import { BluetoothEscPosPrinterAdapter } from '../services/printers/BluetoothEscPosPrinterAdapter';

// Conectar usando Bluetooth clássico (mais próximo do código Java)
async function connectClassicBluetooth() {
  try {
    const adapter = new BluetoothEscPosPrinterAdapter();
    
    // Inicializar
    await adapter.initialize();
    
    // Conectar diretamente pelo endereço MAC
    const targetAddress = "DC:0D:30:71:D5:97";
    const connected = await adapter.connect(targetAddress);
    
    if (connected) {
      console.log('✅ Conectado via Bluetooth clássico!');
      return true;
    } else {
      throw new Error('Falha na conexão Bluetooth clássica');
    }
  } catch (error) {
    console.error('❌ Erro na conexão clássica:', error);
    throw error;
  }
}
```

### 3. Usando BluetoothManager diretamente

```typescript
import { BluetoothManager } from '@brooons/react-native-bluetooth-escpos-printer';

// Método mais direto, similar ao código Java
async function connectDirectBluetooth() {
  try {
    // Verificar se Bluetooth está habilitado
    const isEnabled = await BluetoothManager.checkBluetoothEnabled();
    if (!isEnabled) {
      await BluetoothManager.enableBluetooth();
    }
    
    // Conectar diretamente (equivalente ao código Java)
    const targetAddress = "DC:0D:30:71:D5:97";
    await BluetoothManager.connect(targetAddress);
    
    console.log('✅ Conexão direta estabelecida!');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão direta:', error);
    throw error;
  }
}
```

## Comparação: Java vs React Native

| Aspecto | Java (Android Nativo) | React Native (Projeto Atual) |
|---------|----------------------|------------------------------|
| **Obter Dispositivo** | `bluetoothAdapter.getRemoteDevice()` | `bluetoothService.getState().devices.find()` |
| **Criar Socket** | `device.createRfcommSocketToServiceRecord()` | `BluetoothManager.connect()` |
| **Conectar** | `socket.connect()` | `await BluetoothManager.connect(address)` |
| **Protocolo** | RFCOMM/SPP | BLE + Bluetooth Clássico |
| **Segurança** | Manual | Automática (whitelist, validação) |

## Recomendações

### Para Impressoras (Bluetooth Clássico)
Use `BluetoothEscPosPrinterAdapter` ou `BluetoothManager` diretamente:

```typescript
// Exemplo para impressora
const adapter = new BluetoothEscPosPrinterAdapter();
await adapter.initialize();
await adapter.connect("DC:0D:30:71:D5:97");
await adapter.printText("Teste de impressão");
```

### Para Dispositivos BLE
Use `bluetoothService.ts` para maior segurança:

```typescript
// Exemplo para dispositivos BLE
await bluetoothService.initialize();
const device = await findDeviceByAddress("DC:0D:30:71:D5:97");
await bluetoothService.connectDevice(device);
```

### Função Utilitária

```typescript
// Função para encontrar dispositivo por endereço
async function findDeviceByAddress(address: string): Promise<BluetoothDevice | null> {
  await bluetoothService.startScan();
  await new Promise(resolve => setTimeout(resolve, 5000));
  await bluetoothService.stopScan();
  
  const devices = bluetoothService.getState().devices;
  return devices.find(device => 
    device.address.toLowerCase() === address.toLowerCase()
  ) || null;
}
```

## Tratamento de Erros

```typescript
try {
  await connectToSpecificDevice();
} catch (error) {
  if (error.message.includes('não encontrado')) {
    // Dispositivo não foi encontrado no scan
    console.log('💡 Dica: Verifique se o dispositivo está ligado e próximo');
  } else if (error.message.includes('Falha na conexão')) {
    // Erro de conexão
    console.log('💡 Dica: Tente reiniciar o Bluetooth ou reinicar o dispositivo');
  }
}
```