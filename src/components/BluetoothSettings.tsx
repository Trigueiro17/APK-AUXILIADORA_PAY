import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Vibration,
  Animated,
} from 'react-native';
import { Switch, Button, Card, List, IconButton, Chip, Surface } from 'react-native-paper';
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialIcons';
import bluetoothService, { BluetoothDevice, BluetoothState } from '../services/bluetoothService';
import { State } from 'react-native-ble-plx';
import BluetoothDiagnostic from '../utils/bluetoothDiagnostic';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth > 768;

interface BluetoothSettingsProps {
  onClose?: () => void;
}

const BluetoothSettings: React.FC<BluetoothSettingsProps> = ({ onClose }) => {
  const [bluetoothState, setBluetoothState] = useState<BluetoothState>({
    enabled: false,
    discovering: false,
    devices: [],
    pairedDevices: [],
    connectedDevice: null,
    bleState: 'Unknown' as State,
  });
  const [loading, setLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [scrollY] = useState(new Animated.Value(0));
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    try {
      // Carregar estado inicial
      const initialState = bluetoothService.getState();
      if (initialState) {
        setBluetoothState({
          ...initialState,
          devices: initialState.devices || [],
          pairedDevices: initialState.pairedDevices || []
        });
      }

      // Adicionar listener para mudanças de estado
      const removeListener = bluetoothService.addListener((state) => {
        if (state) {
          setBluetoothState({
            ...state,
            devices: state.devices || [],
            pairedDevices: state.pairedDevices || []
          });
        }
      });

      return removeListener;
    } catch (error) {
      console.error('Erro ao inicializar BluetoothSettings:', error);
    }
  }, []);

  const handleToggleBluetooth = async (enabled: boolean) => {
    setLoading(true);
    try {
      if (enabled) {
        // BLE não permite ativar/desativar programaticamente
        // Apenas mostrar mensagem para o usuário
        Alert.alert(
          'Bluetooth', 
          'Por favor, ative o Bluetooth nas configurações do dispositivo'
        );
      } else {
        Alert.alert(
          'Bluetooth', 
          'Por favor, desative o Bluetooth nas configurações do dispositivo'
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao alterar estado do Bluetooth');
    } finally {
      setLoading(false);
    }
  };

  const handleStartScan = async () => {
    try {
      await bluetoothService.startScan();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível iniciar a busca por dispositivos');
    }
  };

  const handleStopScan = async () => {
    try {
      await bluetoothService.stopScan();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível parar a busca');
    }
  };

  const handlePairDevice = async (device: BluetoothDevice) => {
    Alert.alert(
      'Parear Dispositivo',
      `Deseja parear com ${device.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Parear',
          onPress: async () => {
            setLoading(true);
            try {
              await bluetoothService.pairDevice(device);
              // Sucesso já é mostrado pelo bluetoothService
            } catch (error) {
              // Erro já é mostrado pelo bluetoothService
              console.error('Erro ao parear dispositivo:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleConnectDevice = async (device: BluetoothDevice) => {
    setLoading(true);
    try {
      await bluetoothService.connectDevice(device);
      // Sucesso já é mostrado pelo bluetoothService
    } catch (error) {
      // Erro já é mostrado pelo bluetoothService
      console.error('Erro ao conectar dispositivo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectDevice = async () => {
    setLoading(true);
    try {
      await bluetoothService.disconnectDevice();
      // Sucesso já é mostrado pelo bluetoothService
    } catch (error) {
      // Erro já é mostrado pelo bluetoothService
      console.error('Erro ao desconectar dispositivo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpairDevice = async (device: BluetoothDevice) => {
    Alert.alert(
      'Remover Pareamento',
      `Deseja remover o pareamento com ${device.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await bluetoothService.removePairedDevice(device.id);
              Alert.alert('Sucesso', 'Pareamento removido');
            } catch (error) {
              Alert.alert('Erro', 'Erro ao remover pareamento');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRunDiagnostic = async () => {
    setLoading(true);
    try {
      await BluetoothDiagnostic.runFullDiagnostic();
      const report = await BluetoothDiagnostic.generateDiagnosticReport();
      
      Alert.alert(
        'Diagnóstico Concluído',
        'Verifique o console para detalhes completos. Relatório gerado com sucesso.',
        [
          { text: 'OK' },
          {
            text: 'Ver Relatório',
            onPress: () => {
              Alert.alert('Relatório de Diagnóstico', report);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erro no Diagnóstico', `${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para feedback tátil
  const provideTactileFeedback = useCallback(() => {
    if (Platform.OS === 'android') {
      Vibration.vibrate(10); // Vibração suave de 10ms
    }
  }, []);

  // Função otimizada para seleção de dispositivo
  const handleDeviceSelection = useCallback((deviceId: string) => {
    provideTactileFeedback();
    setSelectedDevice(prev => prev === deviceId ? null : deviceId);
  }, [provideTactileFeedback]);

  // Renderização otimizada do item de dispositivo
  const renderDeviceItem = useCallback(({ item, index }: { item: BluetoothDevice; index: number }) => {
    const isConnected = bluetoothState.connectedDevice?.id === item.id;
    const isSelected = selectedDevice === item.id;
    
    return (
      <Animated.View
        style={[
          styles.deviceCard,
          isSelected && styles.selectedDeviceCard,
          {
            transform: [{
              scale: scrollY.interpolate({
                inputRange: [index * 100 - 50, index * 100, index * 100 + 50],
                outputRange: [0.95, 1, 0.95],
                extrapolate: 'clamp',
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => handleDeviceSelection(item.id)}
          activeOpacity={0.7}
          style={styles.deviceTouchable}
        >
          <Surface style={[styles.deviceSurface, isSelected && styles.selectedDeviceSurface]} elevation={isSelected ? 4 : 2}>
            <View style={styles.deviceInfo}>
              <View style={styles.deviceHeader}>
                <View style={styles.deviceIconContainer}>
                  <Icon 
                    name={item.paired ? 'bluetooth-connected' : 'bluetooth'} 
                    size={isTablet ? 28 : 24} 
                    color={isConnected ? '#4CAF50' : isSelected ? '#2196F3' : '#757575'} 
                  />
                  {isSelected && (
                    <View style={styles.selectionIndicator}>
                      <Icon name="check-circle" size={16} color="#2196F3" />
                    </View>
                  )}
                </View>
                <View style={styles.deviceDetails}>
                  <Text style={[styles.deviceName, isSelected && styles.selectedDeviceName]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.deviceAddress, isSelected && styles.selectedDeviceAddress]}>
                    {item.address}
                  </Text>
                  {item.paired && (
                    <View style={styles.deviceStatusRow}>
                      <Chip 
                        mode="flat" 
                        style={[styles.pairedChip, isSelected && styles.selectedChip]}
                        textStyle={styles.chipText}
                      >
                        Pareado
                      </Chip>
                    </View>
                  )}
                </View>
                {isConnected && (
                  <Chip mode="flat" style={styles.connectedChip}>
                    Conectado
                  </Chip>
                )}
              </View>
              
              {isSelected && (
                <Animated.View style={styles.deviceActions}>
                  {item.paired ? (
                    <>
                      {isConnected ? (
                        <Button 
                          mode="outlined" 
                          onPress={handleDisconnectDevice}
                          disabled={loading}
                          style={styles.actionButton}
                        >
                          Desconectar
                        </Button>
                      ) : (
                        <Button 
                          mode="contained" 
                          onPress={() => handleConnectDevice(item)}
                          disabled={loading}
                          style={styles.actionButton}
                        >
                          Conectar
                        </Button>
                      )}
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => handleUnpairDevice(item)}
                        disabled={loading}
                      />
                    </>
                  ) : (
                    <Button 
                      mode="contained" 
                      onPress={() => handlePairDevice(item)}
                      disabled={loading}
                    >
                      Parear
                    </Button>
                  )}
                </Animated.View>
              )}
            </View>
          </Surface>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [bluetoothState.connectedDevice, selectedDevice, scrollY, handleDeviceSelection, handleConnectDevice, handleDisconnectDevice, handlePairDevice, handleUnpairDevice, loading]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Configurações Bluetooth</Text>
        {onClose && (
          <IconButton icon="close" size={24} onPress={onClose} />
        )}
      </View>

      {/* Bluetooth Toggle */}
      <Card style={styles.card}>
        <List.Item
          title="Bluetooth"
          description={bluetoothState.enabled ? 'Ativado' : 'Desativado'}
          left={(props) => <List.Icon {...props} icon="bluetooth" />}
          right={() => (
            <Switch
              value={bluetoothState.enabled}
              onValueChange={handleToggleBluetooth}
              disabled={loading}
            />
          )}
        />
      </Card>

      {/* Status do dispositivo conectado */}
      {bluetoothState.connectedDevice && (
        <Card style={styles.card}>
          <List.Item
            title="Dispositivo Conectado"
            description={bluetoothState.connectedDevice.name}
            left={(props) => <List.Icon {...props} icon="bluetooth-connected" />}
            right={() => (
              <Button 
                mode="outlined" 
                onPress={handleDisconnectDevice}
                disabled={loading}
              >
                Desconectar
              </Button>
            )}
          />
        </Card>
      )}

      {bluetoothState.enabled && (
        <>
          {/* Controles de busca */}
          <Card style={styles.card}>
            <View style={styles.discoveryControls}>
              <Text style={styles.sectionTitle}>Buscar Dispositivos</Text>
              <View style={styles.discoveryButtons}>
                {bluetoothState.discovering ? (
                  <>
                    <ActivityIndicator size="small" color="#2196F3" />
                    <Button 
                      mode="outlined" 
                      onPress={handleStopScan}
                      style={styles.discoveryButton}
                    >
                      Parar
                    </Button>
                  </>
                ) : (
                  <Button 
                    mode="contained" 
                    onPress={handleStartScan}
                    style={styles.discoveryButton}
                  >
                    Buscar
                  </Button>
                )}
              </View>
            </View>
          </Card>

          {/* Diagnóstico */}
          <Card style={styles.card}>
            <View style={styles.discoveryControls}>
              <Text style={styles.sectionTitle}>Solução de Problemas</Text>
              <View style={styles.discoveryButtons}>
                <Button 
                  mode="outlined" 
                  onPress={handleRunDiagnostic}
                  disabled={loading}
                  icon="bug-check"
                  style={styles.discoveryButton}
                >
                  Executar Diagnóstico
                </Button>
              </View>
            </View>
          </Card>

          {/* Lista de dispositivos pareados */}
          {bluetoothState.pairedDevices && bluetoothState.pairedDevices.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Dispositivos Pareados</Text>
                <View style={styles.deviceCounter}>
                  <Text style={styles.counterText}>{bluetoothState.pairedDevices.length}</Text>
                </View>
              </View>
              <Animated.FlatList
                data={bluetoothState.pairedDevices}
                keyExtractor={(item) => item.id}
                renderItem={renderDeviceItem}
                showsVerticalScrollIndicator={true}
                indicatorStyle="black"
                scrollIndicatorInsets={{ right: 2 }}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                  { 
                    useNativeDriver: true,
                    listener: () => {
                      if (!isScrolling) {
                        setIsScrolling(true);
                        setTimeout(() => setIsScrolling(false), 150);
                      }
                    }
                  }
                )}
                scrollEventThrottle={16}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={8}
                getItemLayout={(data, index) => ({
                  length: isTablet ? 120 : 100,
                  offset: (isTablet ? 120 : 100) * index,
                  index,
                })}
                style={styles.deviceList}
                contentContainerStyle={styles.listContainer}
              />
            </View>
          )}

          {/* Lista de dispositivos disponíveis */}
          {bluetoothState.devices && bluetoothState.devices.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Dispositivos Disponíveis</Text>
                <View style={styles.deviceCounter}>
                  <Text style={styles.counterText}>{bluetoothState.devices.length}</Text>
                </View>
              </View>
              <Animated.FlatList
                data={bluetoothState.devices}
                keyExtractor={(item) => item.id}
                renderItem={renderDeviceItem}
                showsVerticalScrollIndicator={true}
                indicatorStyle="black"
                scrollIndicatorInsets={{ right: 2 }}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                  { 
                    useNativeDriver: true,
                    listener: () => {
                      if (!isScrolling) {
                        setIsScrolling(true);
                        setTimeout(() => setIsScrolling(false), 150);
                      }
                    }
                  }
                )}
                scrollEventThrottle={16}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={8}
                getItemLayout={(data, index) => ({
                  length: isTablet ? 120 : 100,
                  offset: (isTablet ? 120 : 100) * index,
                  index,
                })}
                style={styles.deviceList}
                contentContainerStyle={styles.listContainer}
              />
            </View>
          )}

          {/* Mensagem quando não há dispositivos */}
          {!bluetoothState.discovering && 
           (!bluetoothState.devices || bluetoothState.devices.length === 0) && 
           (!bluetoothState.pairedDevices || bluetoothState.pairedDevices.length === 0) && (
            <Card style={styles.card}>
              <View style={styles.emptyState}>
                <Icon name="bluetooth-searching" size={48} color="#757575" />
                <Text style={styles.emptyText}>
                  Nenhum dispositivo encontrado
                </Text>
                <Text style={styles.emptySubtext}>
                  Toque em "Buscar" para procurar dispositivos próximos
                </Text>
              </View>
            </Card>
          )}
        </>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  section: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  discoveryControls: {
    padding: 16,
  },
  discoveryButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discoveryButton: {
    flex: 1,
    marginLeft: 12,
  },
  deviceCard: {
    marginBottom: isTablet ? 12 : 8,
    marginHorizontal: 4,
  },
  selectedDeviceCard: {
    marginBottom: isTablet ? 16 : 12,
    transform: [{ scale: 1.02 }],
  },
  deviceTouchable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  deviceSurface: {
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  selectedDeviceSurface: {
    backgroundColor: '#f8f9ff',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  deviceInfo: {
    padding: isTablet ? 20 : 16,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deviceIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  selectionIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  selectedDeviceName: {
    color: '#2196F3',
  },
  deviceAddress: {
    fontSize: isTablet ? 14 : 12,
    color: '#757575',
    marginBottom: 4,
  },
  selectedDeviceAddress: {
    color: '#1976D2',
  },
  deviceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pairedChip: {
    backgroundColor: '#E3F2FD',
    height: 24,
  },
  selectedChip: {
    backgroundColor: '#BBDEFB',
  },
  chipText: {
    fontSize: 10,
    color: '#1976D2',
  },
  connectedChip: {
    backgroundColor: '#E8F5E8',
    height: 28,
  },
  deviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceCounter: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deviceList: {
    maxHeight: screenHeight * 0.4,
  },
  listContainer: {
    paddingBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#757575',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BluetoothSettings;