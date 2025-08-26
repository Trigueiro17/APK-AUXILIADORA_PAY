import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
} from 'react-native';
import {
  Button,
  Card,
  Title,
  Paragraph,
  Chip,
  useTheme,
} from 'react-native-paper';
import { apiService } from '../services/apiService';

interface ConnectionTestComponentProps {
  onStatusChange?: (isOnline: boolean | null) => void;
}

const ConnectionTestComponent: React.FC<ConnectionTestComponentProps> = ({ onStatusChange }) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const theme = useTheme();

  useEffect(() => {
    checkApiConnection();
  }, []);

  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(isOnline);
    }
  }, [isOnline, onStatusChange]);

  const checkApiConnection = async () => {
    setIsTestingConnection(true);
    try {
      const connectionStatus = await apiService.checkConnection();
      setIsOnline(connectionStatus);
      setLastCheckTime(new Date());
    } catch (error) {
      setIsOnline(false);
      setLastCheckTime(new Date());
    } finally {
      setIsTestingConnection(false);
    }
  };

  const simulateOffline = () => {
    setIsOnline(false);
    setLastCheckTime(new Date());
  };

  const simulateOnline = () => {
    setIsOnline(true);
    setLastCheckTime(new Date());
  };

  const getStatusChip = () => {
    if (isTestingConnection) {
      return (
        <Chip 
          icon="wifi-strength-outline" 
          style={[styles.statusChip, { backgroundColor: '#f0f0f0' }]}
          textStyle={{ color: '#666' }}
        >
          Testando conexão...
        </Chip>
      );
    }

    if (isOnline === null) {
      return (
        <Chip 
          icon="wifi-strength-outline" 
          style={[styles.statusChip, { backgroundColor: '#f0f0f0' }]}
          textStyle={{ color: '#666' }}
        >
          Status desconhecido
        </Chip>
      );
    }

    if (isOnline) {
      return (
        <Chip 
          icon="wifi" 
          style={[styles.statusChip, { backgroundColor: '#e8f5e8' }]}
          textStyle={{ color: '#2e7d32' }}
        >
          Online
        </Chip>
      );
    }

    return (
      <Chip 
        icon="wifi-off" 
        style={[styles.statusChip, { backgroundColor: '#ffebee' }]}
        textStyle={{ color: '#c62828' }}
      >
        Offline
      </Chip>
    );
  };

  const formatLastCheckTime = () => {
    if (!lastCheckTime) return 'Nunca';
    return lastCheckTime.toLocaleTimeString('pt-BR');
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.title}>Teste de Conectividade API</Title>
        
        <View style={styles.statusContainer}>
          <Paragraph style={styles.label}>Status atual:</Paragraph>
          {getStatusChip()}
        </View>

        <Paragraph style={styles.lastCheck}>
          Última verificação: {formatLastCheckTime()}
        </Paragraph>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={checkApiConnection}
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            disabled={isTestingConnection}
            loading={isTestingConnection}
          >
            Testar Conexão Real
          </Button>

          <Button
            mode="outlined"
            onPress={simulateOnline}
            style={styles.button}
            disabled={isTestingConnection}
          >
            Simular Online
          </Button>

          <Button
            mode="outlined"
            onPress={simulateOffline}
            style={styles.button}
            disabled={isTestingConnection}
          >
            Simular Offline
          </Button>
        </View>

        <View style={styles.infoContainer}>
          <Paragraph style={styles.infoText}>
            • <Text style={{ fontWeight: 'bold' }}>Testar Conexão Real:</Text> Verifica a conectividade real com a API
          </Paragraph>
          <Paragraph style={styles.infoText}>
            • <Text style={{ fontWeight: 'bold' }}>Simular Online:</Text> Força o status para online (apenas visual)
          </Paragraph>
          <Paragraph style={styles.infoText}>
            • <Text style={{ fontWeight: 'bold' }}>Simular Offline:</Text> Força o status para offline (apenas visual)
          </Paragraph>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 4,
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  statusChip: {
    borderRadius: 20,
    paddingHorizontal: 8,
  },
  lastCheck: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 4,
  },
  infoContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    marginBottom: 4,
    color: '#555',
  },
});

export default ConnectionTestComponent;