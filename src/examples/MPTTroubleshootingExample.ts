/**
 * Exemplo prático de implementação do troubleshooting para MPT-II
 * Este arquivo demonstra como integrar os novos métodos de solução de problemas
 * no componente de configurações Bluetooth
 */

import { bluetoothService, BluetoothDevice } from '../services/bluetoothService';

// Interface para o estado do troubleshooting
interface TroubleshootingState {
  isActive: boolean;
  currentStep: string;
  progress: number;
  message: string;
  success: boolean;
}

// Classe para gerenciar troubleshooting de dispositivos MPT
export class MPTTroubleshootingManager {
  private state: TroubleshootingState = {
    isActive: false,
    currentStep: '',
    progress: 0,
    message: '',
    success: false
  };

  private listeners: ((state: TroubleshootingState) => void)[] = [];

  // Adicionar listener para mudanças de estado
  addListener(listener: (state: TroubleshootingState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notificar listeners sobre mudanças
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  // Atualizar estado
  private updateState(updates: Partial<TroubleshootingState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  // Método principal de troubleshooting para MPT-II
  async troubleshootMPTDevice(device: BluetoothDevice): Promise<boolean> {
    this.updateState({
      isActive: true,
      progress: 0,
      success: false,
      currentStep: 'Iniciando diagnóstico',
      message: `Iniciando troubleshooting para ${device.name}...`
    });

    try {
      // Passo 1: Verificar se é um dispositivo MPT
      this.updateState({
        currentStep: 'Verificando dispositivo',
        progress: 10,
        message: 'Verificando se é um dispositivo MPT-II...'
      });

      if (!this.isMPTDevice(device)) {
        throw new Error('Este método é específico para dispositivos MPT-II');
      }

      // Passo 2: Tentar reconexão simples
      this.updateState({
        currentStep: 'Reconexão simples',
        progress: 25,
        message: 'Tentando reconexão simples...'
      });

      let success = await bluetoothService.forceReconnectPairedDevice(device.id);
      
      if (success) {
        this.updateState({
          currentStep: 'Concluído',
          progress: 100,
          message: '✅ Problema resolvido com reconexão simples!',
          success: true,
          isActive: false
        });
        return true;
      }

      // Passo 3: Aguardar e tentar novamente
      this.updateState({
        currentStep: 'Aguardando',
        progress: 50,
        message: 'Aguardando 3 segundos antes da próxima tentativa...'
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      this.updateState({
        currentStep: 'Segunda tentativa',
        progress: 60,
        message: 'Tentando reconexão após aguardar...'
      });

      success = await bluetoothService.forceReconnectPairedDevice(device.id);
      
      if (success) {
        this.updateState({
          currentStep: 'Concluído',
          progress: 100,
          message: '✅ Problema resolvido na segunda tentativa!',
          success: true,
          isActive: false
        });
        return true;
      }

      // Passo 4: Reset do Bluetooth e reconexão
      this.updateState({
        currentStep: 'Reset Bluetooth',
        progress: 75,
        message: 'Resetando Bluetooth e tentando reconexão...'
      });

      await bluetoothService.stopScan();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      success = await bluetoothService.forceReconnectPairedDevice(device.id);
      
      if (success) {
        this.updateState({
          currentStep: 'Concluído',
          progress: 100,
          message: '✅ Problema resolvido após reset do Bluetooth!',
          success: true,
          isActive: false
        });
        return true;
      }

      // Passo 5: Troubleshooting completo falhou
      this.updateState({
        currentStep: 'Falha',
        progress: 100,
        message: '⚠️ Não foi possível resolver automaticamente. Considere remover e parear novamente.',
        success: false,
        isActive: false
      });

      return false;

    } catch (error) {
      this.updateState({
        currentStep: 'Erro',
        progress: 100,
        message: `❌ Erro durante troubleshooting: ${error.message}`,
        success: false,
        isActive: false
      });
      return false;
    }
  }

  // Verificar se é um dispositivo MPT
  private isMPTDevice(device: BluetoothDevice): boolean {
    const name = device.name?.toLowerCase() || '';
    return name.includes('mpt') || name.includes('mpt-ii');
  }

  // Obter dicas específicas para MPT-II
  getMPTTroubleshootingTips(): string[] {
    return [
      '📱 Pressione e segure o botão de energia do MPT-II por 3 segundos',
      '💡 Verifique se o LED azul está piscando (indica modo de conexão)',
      '⏱️ Aguarde 5-10 segundos antes de tentar conectar novamente',
      '📏 Certifique-se de que está a menos de 10 metros do dispositivo',
      '🔄 Tente desligar e ligar o Bluetooth do celular',
      '🔋 Verifique se a bateria do MPT-II não está baixa',
      '📲 Reinicie o aplicativo se necessário',
      '🗑️ Como último recurso: remova o pareamento e pareie novamente'
    ];
  }

  // Obter estado atual
  getState(): TroubleshootingState {
    return { ...this.state };
  }

  // Parar troubleshooting
  stop(): void {
    this.updateState({
      isActive: false,
      currentStep: 'Parado',
      message: 'Troubleshooting interrompido pelo usuário'
    });
  }
}

// Instância singleton do manager
export const mptTroubleshootingManager = new MPTTroubleshootingManager();

// Funções utilitárias para uso direto
export const MPTTroubleshootingUtils = {
  // Verificar se um dispositivo precisa de troubleshooting
  needsTroubleshooting: (device: BluetoothDevice): boolean => {
    return device.paired && !device.connected && !device.device;
  },

  // Executar troubleshooting rápido
  quickFix: async (deviceId: string): Promise<boolean> => {
    try {
      console.log(`🚀 [MPTTroubleshooting] Executando correção rápida para ${deviceId}`);
      return await bluetoothService.forceReconnectPairedDevice(deviceId);
    } catch (error) {
      console.error(`❌ [MPTTroubleshooting] Erro na correção rápida:`, error);
      return false;
    }
  },

  // Executar troubleshooting completo
  fullTroubleshooting: async (deviceId: string): Promise<boolean> => {
    try {
      console.log(`🔧 [MPTTroubleshooting] Executando troubleshooting completo para ${deviceId}`);
      return await bluetoothService.troubleshootMPTDevice(deviceId);
    } catch (error) {
      console.error(`❌ [MPTTroubleshooting] Erro no troubleshooting completo:`, error);
      return false;
    }
  },

  // Mostrar dicas de troubleshooting
  showTips: (device: BluetoothDevice): void => {
    const tips = mptTroubleshootingManager.getMPTTroubleshootingTips();
    console.log(`💡 [MPTTroubleshooting] Dicas para ${device.name}:`);
    tips.forEach((tip, index) => {
      console.log(`   ${index + 1}. ${tip}`);
    });
  }
};

// Exemplo de uso em um componente React
export const ExampleUsage = {
  // Como usar no componente de configurações Bluetooth
  handleMPTConnectionError: async (device: BluetoothDevice) => {
    console.log(`🔧 Iniciando troubleshooting para ${device.name}`);
    
    // Primeiro, tentar correção rápida
    const quickFixSuccess = await MPTTroubleshootingUtils.quickFix(device.id);
    
    if (quickFixSuccess) {
      console.log('✅ Problema resolvido com correção rápida!');
      return true;
    }
    
    // Se falhou, executar troubleshooting completo
    console.log('🔧 Correção rápida falhou. Executando troubleshooting completo...');
    const fullSuccess = await mptTroubleshootingManager.troubleshootMPTDevice(device);
    
    if (fullSuccess) {
      console.log('✅ Problema resolvido com troubleshooting completo!');
      return true;
    }
    
    // Se ainda falhou, mostrar dicas
    console.log('⚠️ Troubleshooting automático falhou. Mostrando dicas manuais...');
    MPTTroubleshootingUtils.showTips(device);
    return false;
  },

  // Como monitorar o progresso do troubleshooting
  monitorTroubleshooting: () => {
    const unsubscribe = mptTroubleshootingManager.addListener((state) => {
      console.log(`📊 Troubleshooting: ${state.currentStep} (${state.progress}%)`);
      console.log(`📝 Mensagem: ${state.message}`);
      
      if (!state.isActive) {
        console.log(`🏁 Troubleshooting finalizado. Sucesso: ${state.success}`);
        unsubscribe(); // Remover listener quando terminar
      }
    });
    
    return unsubscribe;
  }
};