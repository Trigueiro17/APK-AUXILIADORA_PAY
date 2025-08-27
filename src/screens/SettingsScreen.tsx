import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  List,
  Divider,
  Switch,
  ActivityIndicator,
  Paragraph,
  Portal,
  Modal,
  RadioButton,
  Text,
} from 'react-native-paper';
import { useAppContext } from '../contexts/AppContext';
import { useSettings } from '../contexts/SettingsContext';
import ConnectionTestComponent from '../components/ConnectionTestComponent';
import BluetoothSettings from '../components/BluetoothSettings';
import printService, { PrinterConfig, PrinterType } from '../services/printService';
import bluetoothService from '../services/bluetoothService';
import nfcService from '../services/nfcService';


const SettingsScreen: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { 
    settings, 
    updateSetting, 
    updatePrinterConfig,
    syncSettings, 
    isLoading, 
    error, 
    setOfflineMode, 
    setAutoSync, 
    isOfflineMode, 
    getOfflineQueueStatus 
  } = useSettings();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [offlineMode, setOfflineModeState] = useState(false);
  const [queueStatus, setQueueStatus] = useState<{ count: number; items: any[] }>({ count: 0, items: [] });
  const [printerModalVisible, setPrinterModalVisible] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<PrinterConfig[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterType | null>(null);
  const [currentPrinterConfig, setCurrentPrinterConfig] = useState<PrinterConfig | null>(null);
  const [testingPrint, setTestingPrint] = useState(false);
  const [bluetoothModalVisible, setBluetoothModalVisible] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [testingBluetooth, setTestingBluetooth] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [refreshingPrinters, setRefreshingPrinters] = useState(false);










  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  useEffect(() => {
    loadPrinterConfig();
    loadBluetoothState();
    loadOfflineStatus();
  }, []);

  const loadOfflineStatus = async () => {
    setOfflineModeState(isOfflineMode());
    try {
      const status = await getOfflineQueueStatus();
      setQueueStatus(status);
    } catch (error) {
      console.error('Erro ao carregar status da fila:', error);
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Erro', 'Falha ao sincronizar configurações: ' + error);
    }
  }, [error]);

  const handleSyncSettings = async () => {
    setSyncing(true);
    try {
      await syncSettings();
      await loadOfflineStatus(); // Atualizar status da fila
      Alert.alert('Sucesso', 'Configurações sincronizadas com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao sincronizar configurações.');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleOfflineMode = (enabled: boolean) => {
    setOfflineMode(enabled);
    setOfflineModeState(enabled);
    Alert.alert(
      'Modo Offline', 
      enabled ? 'Modo offline ativado. As configurações serão salvas localmente.' : 'Modo offline desativado. Sincronização automática reativada.'
    );
  };

  const loadBluetoothState = () => {
    const state = bluetoothService.getState();
    setBluetoothEnabled(state.enabled);
  };

  const openBluetoothModal = () => {
    setBluetoothModalVisible(true);
  };

  const closeBluetoothModal = () => {
    setBluetoothModalVisible(false);
    loadBluetoothState(); // Atualizar estado após fechar modal
  };

  const loadPrinterConfig = async () => {
    try {
      console.log('🔄 [SettingsScreen] Carregando configuração da impressora...');
      const printers = await printService.getAvailablePrinters();
      setAvailablePrinters(printers);
      
      let config = printService.getPrinterConfig();
      
      // Verificar se há configuração salva no contexto de configurações
      if (!config && settings.printerConfig) {
        // Encontrar a impressora correspondente na lista de disponíveis
        const savedPrinter = printers.find(p => 
          p.type === settings.printerConfig?.type || 
          p.macAddress === settings.printerConfig?.address
        );
        
        if (savedPrinter) {
          config = {
            ...savedPrinter,
            isConnected: settings.printerConfig.isConnected
          };
          printService.setPrinterConfig(config);
        }
      }
      
      // Se não há configuração salva e há impressoras disponíveis, seleciona automaticamente a primeira ESC/POS
      if (!config && printers.length > 0) {
        const defaultConfig: PrinterConfig = {
          ...printers[0],
          isConnected: true
        };
        printService.setPrinterConfig(defaultConfig);
        config = defaultConfig;
        
        // Salvar como padrão no contexto
        try {
          await updateSetting('printerConfig', {
            type: defaultConfig.type,
            name: defaultConfig.deviceName || 'Impressora ESC/POS',
            address: defaultConfig.macAddress,
            isConnected: defaultConfig.isConnected
          });
        } catch (error) {
          console.log('Não foi possível salvar configuração padrão:', error);
        }
      }
      
      setCurrentPrinterConfig(config);
      console.log('✅ [SettingsScreen] Configuração da impressora carregada');
    } catch (error) {
      console.error('❌ [SettingsScreen] Erro ao carregar configuração da impressora:', error);
    }
  };

  const openPrinterModal = async () => {
    setSelectedPrinter(currentPrinterConfig?.type || null);
    setPrinterModalVisible(true);
    
    // Atualizar lista de impressoras ao abrir o modal
    await refreshPrinters();
  };
  
  const refreshPrinters = async () => {
    setRefreshingPrinters(true);
    try {
      console.log('🔄 [SettingsScreen] Atualizando lista de impressoras...');
      
      // Primeiro, buscar dispositivos Bluetooth clássicos pareados
      try {
        await bluetoothService.getClassicBluetoothDevices();
        console.log('📱 [SettingsScreen] Dispositivos Bluetooth clássicos carregados');
      } catch (classicError) {
        console.warn('⚠️ [SettingsScreen] Erro ao carregar dispositivos clássicos:', classicError);
      }
      
      // Depois, tentar iniciar um scan de dispositivos BLE
      try {
        await bluetoothService.startScan();
        console.log('📡 [SettingsScreen] Scan de dispositivos BLE iniciado');
        
        // Aguardar um pouco para o scan encontrar dispositivos
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Parar o scan
        await bluetoothService.stopScan();
        console.log('⏹️ [SettingsScreen] Scan de dispositivos BLE finalizado');
      } catch (scanError) {
        console.warn('⚠️ [SettingsScreen] Erro no scan de dispositivos BLE:', scanError);
      }
      
      // Recarregar a lista de impressoras (agora incluindo BLE + clássicos)
      const printers = await printService.getAvailablePrinters();
      setAvailablePrinters(printers);
      
      console.log(`✅ [SettingsScreen] Lista atualizada: ${printers.length} impressoras encontradas`);
      
      if (printers.length === 0) {
        Alert.alert(
          'Nenhuma Impressora Encontrada',
          'Certifique-se de que:\n\n• O Bluetooth está ativado\n• A impressora está ligada\n• A impressora está pareada com este dispositivo\n• A impressora é compatível com ESC/POS',
          [
            { text: 'Tentar Novamente', onPress: refreshPrinters },
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('❌ [SettingsScreen] Erro ao atualizar impressoras:', error);
      Alert.alert('Erro', 'Falha ao buscar impressoras. Verifique se o Bluetooth está ativado.');
    } finally {
      setRefreshingPrinters(false);
    }
  };

  const closePrinterModal = () => {
    setPrinterModalVisible(false);
    setSelectedPrinter(null);
  };

  const savePrinterConfig = async () => {
    if (!selectedPrinter) {
      Alert.alert('Erro', 'Selecione uma impressora.');
      return;
    }

    const selectedPrinterConfig = availablePrinters.find(p => p.type === selectedPrinter);
    if (selectedPrinterConfig) {
      const newConfig: PrinterConfig = {
        ...selectedPrinterConfig,
        isConnected: true
      };
      
      // Salvar no serviço de impressão
      printService.setPrinterConfig(newConfig);
      setCurrentPrinterConfig(newConfig);
      
      // Salvar no contexto de configurações usando a nova função
      try {
        await updatePrinterConfig(newConfig);
        
        Alert.alert('Sucesso', 'Impressora ESC/POS configurada como padrão com sucesso!');
      } catch (error) {
        console.error('Erro ao salvar configuração da impressora:', error);
        Alert.alert('Aviso', 'Impressora configurada localmente, mas não foi possível sincronizar.');
      }
      
      closePrinterModal();
    }
  };

  const testPrint = async () => {
    if (!currentPrinterConfig) {
      Alert.alert('Erro', 'Configure uma impressora primeiro.');
      return;
    }

    setTestingPrint(true);
    try {
      const success = await printService.testPrint();
      if (success) {
        Alert.alert('Sucesso', 'Teste de impressão realizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro no teste de impressão:', error);
      Alert.alert('Erro', 'Falha no teste de impressão.');
    } finally {
      setTestingPrint(false);
    }
  };

  const testBluetoothConnection = async () => {
    setTestingBluetooth(true);
    try {
      const success = await printService.testBluetoothConnection();
      if (success) {
        Alert.alert('Sucesso', 'Conectividade Bluetooth verificada com sucesso! Dispositivos pareados encontrados.');
      } else {
        Alert.alert('Aviso', 'Bluetooth não está habilitado ou nenhum dispositivo pareado foi encontrado.');
      }
    } catch (error) {
      console.error('Erro no teste de conectividade:', error);
      Alert.alert('Erro', 'Falha ao testar conectividade Bluetooth.');
    } finally {
      setTestingBluetooth(false);
    }
  };

  const testSelectedPrinterConnection = async (printer: PrinterConfig) => {
    setTestingConnection(true);
    try {
      // Configurar temporariamente a impressora para teste
      const tempConfig = {
        ...printer,
        isConnected: false
      };
      
      // Testar conexão específica com esta impressora
      let success = false;
      if (printer.bluetoothDevice) {
        success = await printService.setBluetoothPrinter(printer.bluetoothDevice);
      }
      
      if (success) {
        Alert.alert(
          'Conexão Bem-Sucedida', 
          `Conectado com sucesso à impressora ${printer.deviceName || getPrinterDisplayName(printer.type)}!`
        );
      } else {
        Alert.alert(
          'Falha na Conexão', 
          `Não foi possível conectar com a impressora ${printer.deviceName || getPrinterDisplayName(printer.type)}. Verifique se ela está ligada e pareada.`
        );
      }
    } catch (error) {
      console.error('Erro no teste de conexão da impressora:', error);
      Alert.alert('Erro', 'Falha ao testar conexão com a impressora selecionada.');
    } finally {
      setTestingConnection(false);
    }
  };

  const getPrinterDisplayName = (type: PrinterType): string => {
    switch (type) {
      case 'mini_thermal_58mm':
        return 'Mini Impressora Térmica ESC/POS 58mm';
      case 'mpt_ii_pos_mini_58mm':
        return 'MPT-II POS Mini ESC/POS 58mm';
      default:
        return type;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Sincronização */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Sincronização</Title>
            
            {isLoading && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <ActivityIndicator size="small" style={{ marginRight: 8 }} />
                <Text>Carregando configurações...</Text>
              </View>
            )}
            
            {error && (
              <Paragraph style={{ color: 'red', marginBottom: 16 }}>
                Erro: {error}
              </Paragraph>
            )}
            
            <Button
              mode="outlined"
              onPress={handleSyncSettings}
              loading={syncing}
              disabled={syncing || isLoading || offlineMode}
              icon="sync"
              style={{ marginBottom: 16 }}
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar Configurações'}
            </Button>
            
            <List.Item
              title="Modo Offline"
              description={offlineMode ? 'Configurações salvas apenas localmente' : 'Sincronização automática ativada'}
              left={props => <List.Icon {...props} icon={offlineMode ? "wifi-off" : "wifi"} />}
              right={() => (
                <Switch
                  value={offlineMode}
                  onValueChange={handleToggleOfflineMode}
                />
              )}
            />
            
            {queueStatus.count > 0 && (
              <Paragraph style={{ marginTop: 8, color: '#ff9800' }}>
                {queueStatus.count} configuração(ões) pendente(s) de sincronização
              </Paragraph>
            )}
          </Card.Content>
        </Card>

        {/* Configurações Gerais */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Configurações Gerais</Title>
            
            <List.Item
              title="Modo Escuro"
              description="Ativar tema escuro"
              left={props => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={settings.darkMode}
                  onValueChange={(value) => updateSetting('darkMode', value)}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Notificações"
              description="Receber notificações do sistema"
              left={props => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={settings.notifications}
                  onValueChange={(value) => updateSetting('notifications', value)}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Backup Automático"
              description="Fazer backup dos dados automaticamente"
              left={props => <List.Icon {...props} icon="backup-restore" />}
              right={() => (
                <Switch
                  value={settings.autoBackup}
                  onValueChange={(value) => updateSetting('autoBackup', value)}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="NFC"
              description="Ativar pagamentos via NFC"
              left={props => <List.Icon {...props} icon="nfc" />}
              right={() => (
                <Switch
                  value={settings.nfcEnabled}
                  onValueChange={async (value) => {
                    updateSetting('nfcEnabled', value);
                    // Reinicializar NFC com nova configuração
                    await nfcService.reinitialize();
                  }}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Configuração da Impressora Bluetooth ESC/POS */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Impressora Bluetooth ESC/POS</Title>
            
            <List.Item
              title="Configurar Impressora Térmica"
              description={currentPrinterConfig ? 
                `${getPrinterDisplayName(currentPrinterConfig.type)} - ${currentPrinterConfig.isConnected ? 'Conectada' : 'Desconectada'}` : 
                'Nenhuma impressora configurada'
              }
              left={props => <List.Icon {...props} icon="printer" />}
              onPress={openPrinterModal}
            />
            
            <Divider />
            
            <List.Item
              title="Definir como Padrão"
              description={currentPrinterConfig ? 
                'Impressora ESC/POS definida como padrão' : 
                'Configure uma impressora primeiro'
              }
              left={props => <List.Icon {...props} icon="printer-settings" />}
              right={() => (
                <Switch
                  value={!!currentPrinterConfig}
                  onValueChange={() => {}}
                  disabled={!currentPrinterConfig}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Testar Impressão"
              description="Imprimir um recibo de teste"
              left={props => <List.Icon {...props} icon="printer-check" />}
              right={() => testingPrint ? <ActivityIndicator size="small" /> : null}
              onPress={testPrint}
              disabled={!currentPrinterConfig || testingPrint}
            />
            
            <Divider />
            
            <List.Item
               title="Testar Conectividade Bluetooth"
               description="Verificar conexão Bluetooth com impressoras"
               left={props => <List.Icon {...props} icon="bluetooth-connect" />}
               right={() => testingBluetooth ? <ActivityIndicator size="small" /> : null}
               onPress={testBluetoothConnection}
               disabled={testingBluetooth}
             />
          </Card.Content>
        </Card>

        {/* Configurações Bluetooth */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Bluetooth</Title>
            
            <List.Item
              title="Configurar Bluetooth"
              description={bluetoothEnabled ? 
                'Bluetooth ativado - Toque para gerenciar dispositivos' : 
                'Bluetooth desativado - Toque para ativar'
              }
              left={props => <List.Icon {...props} icon="bluetooth" />}
              onPress={openBluetoothModal}
            />
          </Card.Content>
        </Card>

        {/* Teste de Conectividade */}
        <ConnectionTestComponent />

        {/* Modal de Configuração da Impressora */}
        <Portal>
          <Modal
            visible={printerModalVisible}
            onDismiss={closePrinterModal}
            contentContainerStyle={styles.modalContainer}
          >
            <Card>
              <Card.Content>
                <Title>Configurar Impressora Bluetooth ESC/POS</Title>
                <Paragraph style={styles.modalDescription}>
                  Selecione a impressora térmica Bluetooth ESC/POS que deseja usar como padrão:
                </Paragraph>
                
                {/* Botão de Refresh */}
                <Button
                  mode="outlined"
                  onPress={refreshPrinters}
                  loading={refreshingPrinters}
                  disabled={refreshingPrinters}
                  icon="refresh"
                  style={{ marginBottom: 16 }}
                >
                  {refreshingPrinters ? 'Buscando Impressoras...' : 'Atualizar Lista'}
                </Button>
                
                {availablePrinters.length === 0 ? (
                  <View style={{ padding: 16, alignItems: 'center' }}>
                    <Text style={{ textAlign: 'center', color: '#666', marginBottom: 16 }}>
                      Nenhuma impressora encontrada.
                    </Text>
                    <Text style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
                      Certifique-se de que:
                      {"\n"}• O Bluetooth está ativado
                      {"\n"}• A impressora está ligada
                      {"\n"}• A impressora está pareada
                      {"\n"}• A impressora é compatível com ESC/POS
                    </Text>
                  </View>
                ) : (
                  <RadioButton.Group
                    onValueChange={value => setSelectedPrinter(value as PrinterType)}
                    value={selectedPrinter || ''}
                  >
                    {availablePrinters.map((printer) => (
                      <View key={printer.type} style={styles.radioItem}>
                        <RadioButton.Item
                          label={`${getPrinterDisplayName(printer.type)}${printer.deviceName ? ` (${printer.deviceName})` : ''}`}
                          value={printer.type}
                          status={selectedPrinter === printer.type ? 'checked' : 'unchecked'}
                        />
                        {selectedPrinter === printer.type && (
                          <View style={styles.testConnectionContainer}>
                            <Button
                              mode="outlined"
                              onPress={() => testSelectedPrinterConnection(printer)}
                              loading={testingConnection}
                              disabled={testingConnection}
                              icon="bluetooth-connect"
                              style={styles.testConnectionButton}
                            >
                              {testingConnection ? 'Testando...' : 'Testar Conexão'}
                            </Button>
                          </View>
                        )}
                      </View>
                    ))}
                  </RadioButton.Group>
                )}
              </Card.Content>
              
              <Card.Actions>
                <Button onPress={closePrinterModal}>Cancelar</Button>
                <Button 
                  mode="contained" 
                  onPress={savePrinterConfig}
                  disabled={!selectedPrinter || availablePrinters.length === 0}
                >
                  Salvar
                </Button>
              </Card.Actions>
            </Card>
          </Modal>

          {/* Modal de Configurações Bluetooth */}
          <Modal
            visible={bluetoothModalVisible}
            onDismiss={closeBluetoothModal}
            contentContainerStyle={styles.bluetoothModalContainer}
          >
            <BluetoothSettings onClose={closeBluetoothModal} />
          </Modal>
        </Portal>

        {/* Informações do Sistema */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Informações do Sistema</Title>
            
            <List.Item
              title="Versão do App"
              description="1.0.0"
              left={props => <List.Icon {...props} icon="information" />}
            />
            
            <Divider />
            
            <List.Item
              title="Usuário Logado"
              description={state.user?.name || 'Não identificado'}
              left={props => <List.Icon {...props} icon="account" />}
            />
          </Card.Content>
        </Card>


      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },

  sectionTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },

  statsText: {
    fontSize: 16,
    marginVertical: 4,
    color: '#666',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalDescription: {
    marginBottom: 16,
    color: '#666',
  },
  radioItem: {
    marginVertical: 4,
  },
  testConnectionContainer: {
    marginTop: 8,
    marginLeft: 32,
  },
  testConnectionButton: {
    marginVertical: 4,
  },
  bluetoothModalContainer: {
    flex: 1,
    margin: 0,
  },
});

export default SettingsScreen;