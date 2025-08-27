# Guia de Solução de Problemas - MPT-II

## Problema: "Dispositivo BLE MPT-II não encontrado" mesmo estando pareado

### Sintomas
- O dispositivo MPT-II aparece como pareado no sistema
- Ao tentar conectar, aparece erro "Dispositivo BLE MPT-II não encontrado"
- O dispositivo está ligado e próximo

### Soluções Implementadas

#### 1. Redescoberta Avançada de Dispositivos Pareados

O sistema agora usa múltiplas estratégias para encontrar dispositivos pareados:

```typescript
// Estratégias de redescoberta:
// 1. Busca por ID exato
// 2. Busca por nome do dispositivo
// 3. Busca por endereço MAC
// 4. Scan estendido com maior tempo de espera
```

#### 2. Método de Reconexão Forçada

```typescript
// Exemplo de uso no código
import { bluetoothService } from '../services/bluetoothService';

// Forçar reconexão de um dispositivo pareado
const success = await bluetoothService.forceReconnectPairedDevice('device-id');
if (success) {
  console.log('Dispositivo reconectado com sucesso!');
} else {
  console.log('Falha na reconexão. Tente o troubleshooting.');
}
```

#### 3. Troubleshooting Automático para MPT-II

```typescript
// Troubleshooting específico para MPT-II
const resolved = await bluetoothService.troubleshootMPTDevice('mpt-device-id');
if (resolved) {
  console.log('Problema resolvido automaticamente!');
} else {
  console.log('Problema persiste. Considere remover e parear novamente.');
}
```

### Dicas Específicas para MPT-II

#### Antes de tentar conectar:
1. **Pressione e segure o botão de energia por 3 segundos**
2. **Verifique se o LED azul está piscando** (indica modo de pareamento/conexão)
3. **Aguarde 5-10 segundos** antes de tentar conectar
4. **Certifique-se de que está a menos de 10 metros** do dispositivo

#### Se o problema persistir:
1. **Desligue e ligue o Bluetooth do celular**
2. **Reinicie o dispositivo MPT-II**
3. **Feche e abra o aplicativo**
4. **Como último recurso: remova o pareamento e pareie novamente**

### Implementação no Componente React

```typescript
import React, { useState } from 'react';
import { bluetoothService } from '../services/bluetoothService';

const BluetoothTroubleshooting: React.FC = () => {
  const [isResolving, setIsResolving] = useState(false);
  const [message, setMessage] = useState('');

  const handleTroubleshoot = async (deviceId: string) => {
    setIsResolving(true);
    setMessage('Resolvendo problema de conexão...');
    
    try {
      // Tentar troubleshooting automático
      const resolved = await bluetoothService.troubleshootMPTDevice(deviceId);
      
      if (resolved) {
        setMessage('✅ Problema resolvido! Dispositivo conectado.');
      } else {
        setMessage('⚠️ Não foi possível resolver automaticamente. Tente as dicas manuais.');
      }
    } catch (error) {
      setMessage('❌ Erro durante troubleshooting. Tente novamente.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleForceReconnect = async (deviceId: string) => {
    setIsResolving(true);
    setMessage('Forçando reconexão...');
    
    try {
      const success = await bluetoothService.forceReconnectPairedDevice(deviceId);
      
      if (success) {
        setMessage('✅ Reconexão bem-sucedida!');
      } else {
        setMessage('❌ Falha na reconexão. Tente o troubleshooting completo.');
      }
    } catch (error) {
      setMessage('❌ Erro durante reconexão.');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div>
      <h3>Solução de Problemas Bluetooth</h3>
      
      <button 
        onClick={() => handleForceReconnect('mpt-device-id')}
        disabled={isResolving}
      >
        🔄 Forçar Reconexão
      </button>
      
      <button 
        onClick={() => handleTroubleshoot('mpt-device-id')}
        disabled={isResolving}
      >
        🔧 Troubleshooting Automático
      </button>
      
      {message && (
        <div style={{ marginTop: 10, padding: 10, backgroundColor: '#f0f0f0' }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default BluetoothTroubleshooting;
```

### Logs de Diagnóstico

O sistema agora fornece logs detalhados para ajudar no diagnóstico:

```
🔍 [BluetoothService] Redescoberta avançada para dispositivo pareado: MPT-II (device-id)
📍 [BluetoothService] Estratégia 1: Busca por ID exato
📍 [BluetoothService] Estratégia 2: Busca por nome
✅ [BluetoothService] Dispositivo encontrado por nome: MPT-II
🔄 [BluetoothService] Atualizando ID do dispositivo de old-id para new-id
✅ [BluetoothService] Dispositivo pareado MPT-II redescoberto com sucesso
```

### Prevenção de Problemas

1. **Mantenha o dispositivo próximo** durante o uso
2. **Evite interferências** (outros dispositivos Bluetooth, Wi-Fi)
3. **Mantenha a bateria carregada** do MPT-II
4. **Atualize o aplicativo** regularmente
5. **Reinicie o dispositivo** periodicamente se usado intensivamente

### Quando Remover e Parear Novamente

Se todas as estratégias falharem:

1. Vá para Configurações Bluetooth
2. Encontre o MPT-II na lista de dispositivos pareados
3. Toque no ícone de informações (i) ou engrenagem
4. Selecione "Esquecer" ou "Remover"
5. Reinicie o MPT-II
6. Pareie novamente através do aplicativo

Esta abordagem resolve a maioria dos problemas de conexão com dispositivos MPT-II pareados.