import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Switch, Button, Card, List, IconButton, Chip } from 'react-native-paper';
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialIcons';
import bluetoothService, { BluetoothDevice, BluetoothState } from '../services/bluetoothService';
import { State } from 'react-native-ble-plx';

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

  const renderDeviceItem = ({ item }: { item: BluetoothDevice }) => {
    const isConnected = bluetoothState.connectedDevice?.id === item.id;
    
    return (
      <Card style={styles.deviceCard}>
        <View style={styles.deviceInfo}>
          <View style={styles.deviceHeader}>
            <Icon 
              name={item.paired ? 'bluetooth-connected' : 'bluetooth'} 
              size={24} 
              color={isConnected ? '#4CAF50' : '#757575'} 
            />
            <View style={styles.deviceDetails}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <Text style={styles.deviceAddress}>{item.address}</Text>
            </View>
            {isConnected && (
              <Chip mode="flat" style={styles.connectedChip}>
                Conectado
              </Chip>
            )}
          </View>
          
          <View style={styles.deviceActions}>
            {item.paired ? (
              <>
                {isConnected ? (
                  <Button 
                    mode="outlined" 
                    onPress={handleDisconnectDevice}
                    disabled={loading}
                  >
                    Desconectar
                  </Button>
                ) : (
                  <Button 
                    mode="contained" 
                    onPress={() => handleConnectDevice(item)}
                    disabled={loading}
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
          </View>
        </View>
      </Card>
    );
  };

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

          {/* Lista de dispositivos pareados */}
          {bluetoothState.pairedDevices && bluetoothState.pairedDevices.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dispositivos Pareados</Text>
              <FlatList
                data={bluetoothState.pairedDevices}
                keyExtractor={(item) => item.id}
                renderItem={renderDeviceItem}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {/* Lista de dispositivos disponíveis */}
          {bluetoothState.devices && bluetoothState.devices.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dispositivos Disponíveis</Text>
              <FlatList
                data={bluetoothState.devices}
                keyExtractor={(item) => item.id}
                renderItem={renderDeviceItem}
                showsVerticalScrollIndicator={false}
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
    marginBottom: 8,
  },
  deviceInfo: {
    padding: 16,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceDetails: {
    flex: 1,
    marginLeft: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceAddress: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  connectedChip: {
    backgroundColor: '#E8F5E8',
  },
  deviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
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