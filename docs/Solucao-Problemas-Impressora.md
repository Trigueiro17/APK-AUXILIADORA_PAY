# Solução de Problemas - Impressora Térmica não Detectada

## Problema Relatado
O Bluetooth não consegue encontrar a impressora térmica.

## Possíveis Causas e Soluções

### 1. Verificar Permissões Android

**Problema**: Permissões de Bluetooth não concedidas ou insuficientes.

**Solução**:
1. Vá para **Configurações** > **Aplicativos** > **Auxiliadora Pay**
2. Toque em **Permissões**
3. Verifique se as seguintes permissões estão ativadas:
   - ✅ **Localização** (Obrigatória para scan Bluetooth)
   - ✅ **Bluetooth** (Se disponível)
   - ✅ **Dispositivos próximos** (Android 12+)

### 2. Verificar Estado do Bluetooth

**Problema**: Bluetooth desativado ou com problemas.

**Solução**:
1. Vá para **Configurações** > **Bluetooth** no Android
2. Certifique-se que o Bluetooth está **ATIVADO**
3. Se necessário, desligue e ligue novamente o Bluetooth
4. Reinicie o aplicativo Auxiliadora Pay

### 3. Preparar a Impressora

**Problema**: Impressora não está em modo de pareamento.

**Solução**:
1. **Ligue a impressora térmica**
2. **Ative o modo de pareamento** (geralmente segurando botão por 3-5 segundos)
3. Verifique se o LED da impressora está piscando (indica modo pareamento)
4. A impressora deve estar **próxima** do dispositivo (máximo 10 metros)

### 4. Verificar Compatibilidade da Impressora

**Problema**: Nome da impressora não é reconhecido pelo sistema.

**Impressoras Suportadas**:
- ✅ **MPT-II** (todas as variações)
- ✅ **POS Mini** 
- ✅ **Mini 58mm**
- ✅ Impressoras com nomes contendo: `printer`, `thermal`, `pos`, `receipt`, `impressora`, `termica`

**Se sua impressora não aparece**:
1. Anote o **nome exato** da impressora
2. Verifique se contém alguma das palavras-chave acima
3. Se não contém, entre em contato para adicionar suporte

### 5. Processo de Detecção Passo a Passo

1. **Abra o aplicativo Auxiliadora Pay**
2. Vá para **Configurações** > **Bluetooth**
3. Toque em **"Buscar Dispositivos"**
4. **Aguarde 10 segundos** (tempo do scan)
5. A impressora deve aparecer na lista

### 6. Solução de Problemas Avançada

#### Limpar Cache Bluetooth
1. Vá para **Configurações** > **Aplicativos**
2. Encontre **"Bluetooth"** na lista
3. Toque em **"Armazenamento"**
4. Toque em **"Limpar Cache"**
5. Reinicie o dispositivo

#### Resetar Configurações de Rede
1. Vá para **Configurações** > **Sistema**
2. Toque em **"Opções de redefinição"**
3. Selecione **"Redefinir Wi-Fi, dados móveis e Bluetooth"**
4. ⚠️ **Atenção**: Isso remove todos os dispositivos pareados

### 7. Verificar Logs de Erro

Se o problema persistir:
1. Abra o aplicativo
2. Tente buscar dispositivos
3. Anote qualquer mensagem de erro
4. Entre em contato com suporte técnico

### 8. Teste com Outro Dispositivo

1. Tente parear a impressora com outro celular/tablet
2. Se funcionar: problema é com o dispositivo atual
3. Se não funcionar: problema é com a impressora

## Informações Técnicas

### Tecnologia Utilizada
- **BLE (Bluetooth Low Energy)** para descoberta
- **Bluetooth Clássico** para comunicação
- **ESC/POS** para comandos de impressão

### Permissões Necessárias
```json
{
  "android": {
    "permissions": [
      "BLUETOOTH_SCAN",
      "BLUETOOTH_CONNECT", 
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION"
    ]
  }
}
```

### Palavras-chave de Detecção
O sistema procura por dispositivos com nomes contendo:
- `printer`, `print`, `thermal`, `pos`, `receipt`
- `impressora`, `termica`, `cupom`, `ticket`
- `rp`, `tm`, `ep`, `zj`, `xp`, `mpt`, `mini`

## Contato para Suporte

Se nenhuma solução funcionou:
1. **Anote**: Modelo da impressora, versão do Android, mensagens de erro
2. **Tire print** da tela de configurações Bluetooth
3. **Entre em contato** com a equipe de desenvolvimento

---

**Última atualização**: Janeiro 2025
**Versão do documento**: 1.0