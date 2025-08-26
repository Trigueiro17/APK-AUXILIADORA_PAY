# Configuração da Impressora MPT-II pos Mini 58mm

## Visão Geral

Este guia explica como configurar e usar a impressora MPT-II pos Mini 58mm com o aplicativo Auxiliadora Pay.

## Pacotes Instalados

Os seguintes pacotes foram instalados para suporte à MPT-II:

- `react-native-bluetooth-escpos-printer` - Para comandos ESC/POS
- `react-native-bluetooth-serial-next` - Para comunicação Bluetooth serial
- `react-native-thermal-receipt-printer` - Para impressão térmica
- `react-native-thermal-printer` - Suporte adicional para impressoras térmicas

## Permissões Android

As seguintes permissões foram adicionadas ao `app.json`:

```json
"permissions": [
  "android.permission.BLUETOOTH",
  "android.permission.BLUETOOTH_ADMIN",
  "android.permission.BLUETOOTH_CONNECT",
  "android.permission.BLUETOOTH_SCAN",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.ACCESS_COARSE_LOCATION"
]
```

## Como Usar

### 1. Pareamento da Impressora

1. Ligue a impressora MPT-II pos Mini 58mm
2. Ative o Bluetooth no dispositivo Android
3. Vá para Configurações > Bluetooth e procure por dispositivos
4. Selecione a impressora MPT-II para parear

### 2. Configuração no App

```typescript
import { configureMPTII } from '../services/printService';

// Configurar a impressora MPT-II
const setupMPTII = async (device: BluetoothDevice) => {
  const success = await configureMPTII(device);
  if (success) {
    console.log('MPT-II configurada com sucesso!');
  }
};
```

### 3. Teste de Impressão

```typescript
import { testMPTIIPrint } from '../services/printService';

// Testar impressão
const testPrint = async () => {
  const success = await testMPTIIPrint();
  if (success) {
    console.log('Teste de impressão realizado com sucesso!');
  }
};
```

## Recursos Implementados

### PrintService Atualizado

- **Novo tipo de impressora**: `mpt_ii_pos_mini_58mm`
- **Método específico**: `setMPTIIPrinter(device)`
- **Conexão ESC/POS**: Usando `BluetoothEscposPrinter`
- **Impressão otimizada**: Comandos específicos para MPT-II
- **Detecção automática**: Reconhece dispositivos MPT-II automaticamente

### Funcionalidades

1. **Conexão Bluetooth**: Conecta automaticamente via ESC/POS
2. **Impressão de cupons**: Suporte completo para cupons fiscais
3. **Corte de papel**: Comando automático de corte
4. **Alinhamento**: Suporte para alinhamento de texto
5. **Detecção inteligente**: Identifica MPT-II por palavras-chave no nome

## Palavras-chave de Detecção

A impressora será detectada automaticamente se o nome do dispositivo Bluetooth contiver:

- `mpt-ii`, `mpt ii`, `mpt2`, `mpt_ii`, `mptii`
- `pos mini`, `mini 58mm`, `mini58mm`

## Solução de Problemas

### Problema: Impressora não conecta

**Solução**:
1. Verifique se a impressora está ligada
2. Confirme o pareamento Bluetooth
3. Reinicie o aplicativo
4. Verifique as permissões de localização

### Problema: Impressão não funciona

**Solução**:
1. Teste a conexão com `testMPTIIPrint()`
2. Verifique se há papel na impressora
3. Confirme se a impressora está configurada como `mpt_ii_pos_mini_58mm`

### Problema: Caracteres estranhos na impressão

**Solução**:
1. Verifique a codificação de caracteres
2. Use comandos ESC/POS apropriados
3. Teste com texto simples primeiro

## Comandos ESC/POS Suportados

- Alinhamento de texto (esquerda, centro, direita)
- Corte de papel
- Alimentação de papel
- Formatação de texto (negrito, sublinhado)
- Códigos de barras (se suportado pelo hardware)

## Próximos Passos

1. Teste a impressora com o aplicativo
2. Ajuste os templates de cupom se necessário
3. Configure as preferências de impressão
4. Treine os usuários no uso da nova impressora

---

**Nota**: Este documento será atualizado conforme novos recursos forem implementados ou problemas forem identificados.