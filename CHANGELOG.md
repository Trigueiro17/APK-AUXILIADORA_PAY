# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.6.0] - 2025-01-16

### Adicionado
- **Sistema de Diagnóstico Bluetooth**: Nova ferramenta de diagnóstico automático para impressoras térmicas
  - Classe `BluetoothDiagnostic` em `src/utils/bluetoothDiagnostic.ts`
  - Verificação automática de estado do Bluetooth, permissões e conectividade
  - Teste de scan de dispositivos e detecção de impressoras
  - Relatório detalhado de diagnóstico com sugestões de solução

- **Interface de Diagnóstico**: Botão "Executar Diagnóstico" nas configurações Bluetooth
  - Integrado em `src/components/BluetoothSettings.tsx`
  - Interface amigável para executar diagnósticos
  - Exibição de resultados em tempo real

- **Guia de Solução de Problemas**: Documentação completa para resolução de problemas
  - Arquivo `docs/Solucao-Problemas-Impressora.md`
  - Instruções passo a passo para configuração
  - Lista de impressoras compatíveis
  - Soluções para problemas comuns

### Melhorado
- **Detecção de Impressoras**: Aprimoramento na identificação de impressoras térmicas
  - Melhor filtragem de dispositivos Bluetooth
  - Suporte expandido para modelos MPT-II
  - Verificação de compatibilidade por nome do dispositivo

### Técnico
- Adicionadas permissões Bluetooth completas no `app.json`
- Implementação de verificação de permissões Android 12+
- Melhoria na gestão de estado do Bluetooth
- Tratamento de erros aprimorado para conexões Bluetooth

---

## [1.5.0] - Versão Anterior

### Funcionalidades Base
- Sistema de PDV completo
- Integração com impressoras térmicas
- Pagamento via NFC
- Gestão de produtos e vendas
- Relatórios e dashboard
- Sistema de usuários