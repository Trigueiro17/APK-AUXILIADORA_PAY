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
      const config = printService.getPrinterConfig();
      setCurrentPrinterConfig(config);
      
      const printers = await printService.getAvailablePrinters();
      setAvailablePrinters(printers);
    } catch (error) {
      console.error('Erro ao carregar configuração da impressora:', error);
    }
  };

  const openPrinterModal = () => {
    setSelectedPrinter(currentPrinterConfig?.type || null);
    setPrinterModalVisible(true);
  };

  const closePrinterModal = () => {
    setPrinterModalVisible(false);
    setSelectedPrinter(null);
  };

  const savePrinterConfig = () => {
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
      
      printService.setPrinterConfig(newConfig);
      setCurrentPrinterConfig(newConfig);
      
      Alert.alert('Sucesso', 'Configuração da impressora salva com sucesso!');
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

  const getPrinterDisplayName = (type: PrinterType): string => {
    switch (type) {
      case 'moderninha_smart_2':
        return 'Moderninha Smart V2';
      case 'mercado_pago_point_smart':
        return 'Mercado Pago Point Smart';
      case 'mini_thermal_58mm':
        return 'Mini Impressora Térmica 58mm';
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

        {/* Configuração da Impressora */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Impressora</Title>
            
            <List.Item
              title="Configurar Impressora"
              description={currentPrinterConfig ? 
                `${getPrinterDisplayName(currentPrinterConfig.type)} - ${currentPrinterConfig.isConnected ? 'Conectada' : 'Desconectada'}` : 
                'Nenhuma impressora configurada'
              }
              left={props => <List.Icon {...props} icon="printer" />}
              onPress={openPrinterModal}
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
                <Title>Configurar Impressora</Title>
                <Paragraph style={styles.modalDescription}>
                  Selecione a impressora que deseja usar:
                </Paragraph>
                
                <RadioButton.Group
                  onValueChange={value => setSelectedPrinter(value as PrinterType)}
                  value={selectedPrinter || ''}
                >
                  {availablePrinters.map((printer) => (
                    <View key={printer.type} style={styles.radioItem}>
                      <RadioButton.Item
                        label={getPrinterDisplayName(printer.type)}
                        value={printer.type}
                        status={selectedPrinter === printer.type ? 'checked' : 'unchecked'}
                      />
                    </View>
                  ))}
                </RadioButton.Group>
              </Card.Content>
              
              <Card.Actions>
                <Button onPress={closePrinterModal}>Cancelar</Button>
                <Button mode="contained" onPress={savePrinterConfig}>
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
  bluetoothModalContainer: {
    flex: 1,
    margin: 0,
  },
});

export default SettingsScreen;