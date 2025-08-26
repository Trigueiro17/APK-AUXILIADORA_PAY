import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  Card,
  Button,
  TextInput,
  IconButton,
  Portal,
  Dialog,
  Paragraph,
  Chip,
  Surface,
} from 'react-native-paper';
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialIcons';
import nfcService, { NFCState, NFCPayment } from '../services/nfcService';

interface NFCPaymentProps {
  visible: boolean;
  onClose: () => void;
  amount?: number;
  description?: string;
  onPaymentComplete?: (payment: NFCPayment) => void;
  mode?: 'payment' | 'receipt';
}

const NFCPaymentComponent: React.FC<NFCPaymentProps> = ({
  visible,
  onClose,
  amount: initialAmount = 0,
  description: initialDescription = '',
  onPaymentComplete,
  mode = 'payment',
}) => {
  const [nfcState, setNfcState] = useState<NFCState>(nfcService.getState());
  const [amount, setAmount] = useState(initialAmount.toString());
  const [description, setDescription] = useState(initialDescription);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<NFCPayment | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const unsubscribe = nfcService.addListener(setNfcState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (visible) {
      setAmount(initialAmount.toString());
      setDescription(initialDescription);
      checkNFCStatus();
    }
  }, [visible, initialAmount, initialDescription]);

  const checkNFCStatus = async () => {
    if (!nfcState.supported) {
      Alert.alert(
        'NFC não suportado',
        'Este dispositivo não suporta tecnologia NFC.',
        [{ text: 'OK', onPress: onClose }]
      );
      return;
    }

    if (!nfcState.enabled) {
      Alert.alert(
        'NFC desabilitado',
        'Por favor, habilite o NFC nas configurações do dispositivo.',
        [
          { text: 'Cancelar', onPress: onClose },
          { text: 'Configurações', onPress: () => {} }, // TODO: Abrir configurações
        ]
      );
      return;
    }
  };

  const handleStartPayment = async () => {
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido.');
      return;
    }

    try {
      setIsProcessing(true);
      
      if (mode === 'payment') {
        // Criar pagamento pendente
        const payment = await nfcService.createPayment(amountValue, description);
        setCurrentPayment(payment);
        
        // Iniciar escaneamento
        const started = await nfcService.startScanning();
        if (started) {
          setShowInstructions(true);
        } else {
          throw new Error('Não foi possível iniciar o escaneamento NFC');
        }
      } else {
        // Modo recebimento - escrever dados na tag
        const success = await nfcService.writePaymentToTag(amountValue, description);
        if (success) {
          Alert.alert(
            'Sucesso',
            'Dados de pagamento escritos na tag NFC com sucesso!',
            [{ text: 'OK', onPress: handleClose }]
          );
        } else {
          throw new Error('Não foi possível escrever na tag NFC');
        }
      }
    } catch (error) {
      Alert.alert(
        'Erro',
        error instanceof Error ? error.message : 'Erro ao processar pagamento NFC'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopScanning = async () => {
    await nfcService.stopScanning();
    setShowInstructions(false);
    setIsProcessing(false);
    
    if (currentPayment) {
      await nfcService.cancelPayment(currentPayment.id);
      setCurrentPayment(null);
    }
  };

  const handleClose = () => {
    handleStopScanning();
    onClose();
  };

  // Monitorar mudanças no estado NFC
  useEffect(() => {
    if (nfcState.lastMessage && currentPayment && mode === 'payment') {
      // Pagamento detectado
      if (nfcState.lastMessage.type === 'payment') {
        nfcService.completePayment(currentPayment.id);
        
        Alert.alert(
          'Pagamento Concluído',
          `Pagamento de R$ ${nfcState.lastMessage.amount?.toFixed(2)} realizado com sucesso!`,
          [{
            text: 'OK',
            onPress: () => {
              if (onPaymentComplete && currentPayment) {
                onPaymentComplete({
                  ...currentPayment,
                  status: 'completed',
                  amount: nfcState.lastMessage?.amount || currentPayment.amount,
                });
              }
              handleClose();
            }
          }]
        );
      }
    }
  }, [nfcState.lastMessage, currentPayment, mode, onPaymentComplete]);

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    const floatValue = parseFloat(numericValue) / 100;
    return floatValue.toFixed(2);
  };

  const handleAmountChange = (text: string) => {
    const formatted = formatCurrency(text);
    setAmount(formatted);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onRequestClose={handleClose}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === 'payment' ? 'Pagamento NFC' : 'Recebimento NFC'}
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={handleClose}
            />
          </View>

          <View style={styles.content}>
            {/* Status NFC */}
            <Card style={styles.statusCard}>
              <Card.Content>
                <View style={styles.statusRow}>
                  <Icon
                    name="nfc"
                    size={24}
                    color={nfcState.enabled ? '#4CAF50' : '#F44336'}
                  />
                  <View style={styles.statusText}>
                    <Text style={styles.statusTitle}>Status NFC</Text>
                    <Text style={styles.statusSubtitle}>
                      {!nfcState.supported
                        ? 'Não suportado'
                        : !nfcState.enabled
                        ? 'Desabilitado'
                        : nfcState.scanning
                        ? 'Escaneando...'
                        : 'Pronto'}
                    </Text>
                  </View>
                  <Chip
                    mode="outlined"
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor: nfcState.enabled ? '#E8F5E8' : '#FFEBEE',
                      },
                    ]}
                  >
                    {nfcState.enabled ? 'Ativo' : 'Inativo'}
                  </Chip>
                </View>
              </Card.Content>
            </Card>

            {/* Formulário de pagamento */}
            <Card style={styles.formCard}>
              <Card.Content>
                <TextInput
                  label="Valor (R$)"
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="currency-usd" />}
                />
                
                <TextInput
                  label="Descrição"
                  value={description}
                  onChangeText={setDescription}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="text" />}
                  placeholder="Descrição do pagamento"
                />
              </Card.Content>
            </Card>

            {/* Instruções */}
            <Card style={styles.instructionsCard}>
              <Card.Content>
                <View style={styles.instructionRow}>
                  <Icon name="info" size={20} color="#2196F3" />
                  <Text style={styles.instructionText}>
                    {mode === 'payment'
                      ? 'Aproxime o dispositivo de uma tag NFC para realizar o pagamento'
                      : 'Aproxime uma tag NFC para gravar os dados de pagamento'}
                  </Text>
                </View>
              </Card.Content>
            </Card>

            {/* Erro */}
            {nfcState.error && (
              <Card style={styles.errorCard}>
                <Card.Content>
                  <View style={styles.errorRow}>
                    <Icon name="error" size={20} color="#F44336" />
                    <Text style={styles.errorText}>{nfcState.error}</Text>
                  </View>
                </Card.Content>
              </Card>
            )}
          </View>

          <View style={styles.footer}>
            {!isProcessing && !nfcState.scanning ? (
              <Button
                mode="contained"
                onPress={handleStartPayment}
                style={styles.actionButton}
                disabled={!nfcState.enabled || !amount || parseFloat(amount) <= 0}
                icon={mode === 'payment' ? 'credit-card' : 'nfc'}
              >
                {mode === 'payment' ? 'Iniciar Pagamento' : 'Gravar na Tag'}
              </Button>
            ) : (
              <Button
                mode="outlined"
                onPress={handleStopScanning}
                style={styles.actionButton}
                icon="stop"
              >
                Cancelar
              </Button>
            )}
          </View>
        </View>

        {/* Dialog de instruções */}
        <Dialog visible={showInstructions} onDismiss={() => setShowInstructions(false)}>
          <Dialog.Title>Aproxime o dispositivo</Dialog.Title>
          <Dialog.Content>
            <View style={styles.scanningContent}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Paragraph style={styles.scanningText}>
                Aproxime o dispositivo de uma tag NFC ou outro dispositivo compatível
                para {mode === 'payment' ? 'realizar o pagamento' : 'gravar os dados'}.
              </Paragraph>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleStopScanning}>Cancelar</Button>
          </Dialog.Actions>
        </Dialog>
      </Modal>
    </Portal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    flex: 1,
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusChip: {
    marginLeft: 8,
  },
  formCard: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  instructionsCard: {
    marginBottom: 16,
    backgroundColor: '#E3F2FD',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#D32F2F',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    paddingVertical: 8,
  },
  scanningContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  scanningText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
  },
});

export default NFCPaymentComponent;