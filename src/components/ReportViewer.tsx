import React from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface ReportViewerProps {
  filePath: string;
  onClose: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ filePath, onClose }) => {
  const [reportData, setReportData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadReportData();
  }, [filePath]);

  const loadReportData = async () => {
    try {
      // Para simplificar, vamos apenas compartilhar o arquivo HTML diretamente
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      Alert.alert('Erro', 'Não foi possível carregar o relatório');
      onClose();
    }
  };

  const handleShareReport = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Erro', 'Compartilhamento não disponível neste dispositivo');
        return;
      }

      await Sharing.shareAsync(filePath, {
        mimeType: 'text/html',
        dialogTitle: 'Compartilhar Relatório',
      });
      
      Alert.alert(
        'Relatório Compartilhado', 
        'O relatório HTML foi compartilhado. Você pode abri-lo em um navegador e usar Ctrl+P para imprimir como PDF.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      Alert.alert('Erro', 'Erro ao compartilhar relatório');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Carregando relatório...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              📄 Relatório Gerado com Sucesso!
            </Text>
            
            <Text variant="bodyLarge" style={styles.description}>
              Seu relatório foi gerado em formato HTML otimizado para impressão.
            </Text>
            
            <Text variant="bodyMedium" style={styles.instructions}>
              📋 <Text style={styles.bold}>Instruções:</Text>
            </Text>
            
            <Text variant="bodyMedium" style={styles.step}>
              1. Toque em "Compartilhar Relatório" abaixo
            </Text>
            
            <Text variant="bodyMedium" style={styles.step}>
              2. Abra o arquivo em um navegador (Chrome, Safari, etc.)
            </Text>
            
            <Text variant="bodyMedium" style={styles.step}>
              3. No navegador, clique no botão "🖨️ Imprimir como PDF"
            </Text>
            
            <Text variant="bodyMedium" style={styles.step}>
              4. Selecione "Salvar como PDF" no destino da impressão
            </Text>
            
            <View style={styles.buttonContainer}>
              <Button 
                mode="contained" 
                onPress={handleShareReport}
                style={styles.shareButton}
                icon="share"
              >
                Compartilhar Relatório
              </Button>
              
              <Button 
                mode="outlined" 
                onPress={onClose}
                style={styles.closeButton}
              >
                Fechar
              </Button>
            </View>
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
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#2e7d32',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  instructions: {
    marginBottom: 16,
    color: '#333',
  },
  bold: {
    fontWeight: 'bold',
  },
  step: {
    marginBottom: 8,
    marginLeft: 16,
    color: '#555',
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  shareButton: {
    marginBottom: 8,
  },
  closeButton: {
    marginBottom: 8,
  },
});