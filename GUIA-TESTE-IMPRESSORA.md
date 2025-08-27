# Guia para Testar Detecção de Impressora Térmica

## 🔍 Diagnóstico Atual

O script de diagnóstico revelou que:
- ✅ Bluetooth está habilitado no dispositivo
- ❌ Nenhum dispositivo Bluetooth está pareado
- ❌ O aplicativo não está instalado no dispositivo conectado (emulador)

## 📱 Passos para Teste em Dispositivo Real

### 1. Preparar o Dispositivo Android

```bash
# Conectar dispositivo real via USB
adb devices

# Verificar se o dispositivo aparece como "device" (não "unauthorized")
```

### 2. Instalar o Aplicativo

```bash
# Navegar para a pasta do projeto
cd C:\Auxiliadora-Pay

# Compilar e instalar o APK
npx react-native run-android

# OU instalar APK já compilado
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 3. Parear a Impressora Térmica

1. **Ligar a impressora térmica**
2. **Ir em Configurações > Bluetooth no Android**
3. **Procurar dispositivos disponíveis**
4. **Parear com a impressora** (geralmente aparece como "Printer", "Thermal", "POS", etc.)
5. **Confirmar que está "Pareado" (não apenas "Disponível")**

### 4. Testar a Detecção

```bash
# Executar o script de diagnóstico novamente
node test-printer-pairing.js
```

### 5. Verificar Logs do Aplicativo

```bash
# Abrir o aplicativo e ir para Configurações
# Tentar detectar impressoras
# Verificar logs em tempo real:
adb logcat | findstr "BluetoothService\|PrintService"
```

## 🔧 Melhorias Implementadas

Para resolver o problema de detecção, foram implementadas as seguintes melhorias:

### ✅ Suporte a Bluetooth Clássico
- Adicionado `getClassicBluetoothDevices()` no `bluetoothService.ts`
- Integração com `@brooons/react-native-bluetooth-escpos-printer`
- Busca dispositivos pareados via `BluetoothManager.getBondedDevices()`

### ✅ Permissões Aprimoradas
- Logs detalhados para cada permissão solicitada
- Suporte para Android < 12 (permissões clássicas)
- Alertas específicos quando permissões são negadas

### ✅ Detecção Combinada
- Busca dispositivos BLE + Bluetooth clássico
- Remove duplicatas baseado no endereço MAC
- Logs detalhados de todos os dispositivos encontrados

## 🎯 Palavras-chave Suportadas

O aplicativo detecta impressoras com os seguintes termos no nome:
- `printer`, `print`, `thermal`, `pos`, `receipt`
- `impressora`, `termica`, `cupom`, `ticket`
- `rp`, `tm`, `ep`, `zj`, `xp`, `mpt`, `mini`
- `escpos`, `bluetooth printer`, `bt printer`

## 🚨 Solução de Problemas

### Se a impressora não for detectada:

1. **Verificar pareamento manual**:
   - Configurações > Bluetooth
   - Confirmar que a impressora está "Pareada"

2. **Testar com outros apps**:
   - Usar aplicativo de teste de impressora
   - Confirmar que a impressora funciona

3. **Verificar permissões**:
   - Configurações > Apps > Auxiliadora Pay > Permissões
   - Habilitar todas as permissões de localização

4. **Reiniciar serviços**:
   - Desligar/ligar Bluetooth
   - Reiniciar o aplicativo
   - Recompilar se necessário

5. **Logs detalhados**:
   ```bash
   # Filtrar logs específicos do Bluetooth
   adb logcat | findstr "📱\|📋\|🔗\|❌\|✅"
   ```

## 📞 Próximos Passos

1. Testar em dispositivo Android real
2. Parear impressora térmica manualmente
3. Executar o aplicativo e verificar detecção
4. Analisar logs se houver problemas
5. Reportar resultados para ajustes adicionais