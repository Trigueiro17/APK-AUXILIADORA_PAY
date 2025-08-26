import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Portal,
  Modal,
  ActivityIndicator,
  Divider,
  List,
  Chip,
  useTheme,
  Surface,
  IconButton,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../contexts/AppContext';
import { CashRegister, CashSession, Sale, CashRegisterStatus, OpenCashRegisterData, CloseCashRegisterData } from '../types';
import { ConsolidationSummary } from '../services/consolidationService';


const CashRegisterScreen: React.FC = () => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [openModalVisible, setOpenModalVisible] = useState(false);
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentSales, setCurrentSales] = useState<Sale[]>([]);
  const [cashHistory, setCashHistory] = useState<CashRegister[]>([]);
  const [consolidationSummary, setConsolidationSummary] = useState<ConsolidationSummary | null>(null);
  
  // Form state
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [notes, setNotes] = useState('');

  const { 
    state, 
    loadCurrentCashRegister: contextLoadCurrentCashRegister,
    loadCurrentCashSession,
    openCashSession,
    closeCashSession,
    openCashRegister,
    closeCashRegister,
    getSalesByCashRegister,
    getSalesBySession,
    calculateConsolidationSummary,
    consolidateSession,
    validateSessionForConsolidation
  } = useAppContext();
  const { currentCashRegister, currentCashSession, user, loading: contextLoading } = state;

  // Removed automatic cash register loading to prevent API calls without proper authentication
  // Users must manually refresh or navigate to load cash register data

  // Sincronizar vendas quando a sessão atual mudar
  useEffect(() => {
    const loadSalesForCurrentSession = async () => {
      if (currentCashSession) {
        try {
          const sales = await getSalesBySession(currentCashSession.id);
          setCurrentSales(sales);
        } catch (error) {
          console.error('Error loading sales for current cash session:', error);
          setCurrentSales([]);
        }
      } else {
        setCurrentSales([]);
      }
    };

    loadSalesForCurrentSession();
  }, [currentCashSession, getSalesBySession]);

  // Carregar sessão atual quando a tela for focada
  useFocusEffect(
    useCallback(() => {
      if (user && state.isAuthenticated) {
        loadCurrentCashSession();
        contextLoadCurrentCashRegister(); // Adicionar carregamento do caixa para debug
      }
    }, [user, state.isAuthenticated, loadCurrentCashSession, contextLoadCurrentCashRegister])
  );

  const loadCurrentCashRegister = async () => {
    try {
      // Verificar se o usuário está autenticado antes de tentar carregar
      if (!user || !state.isAuthenticated) {
        console.log('Usuário não autenticado, não é possível carregar caixa');
        Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
        return;
      }
      
      setLoading(true);
      await contextLoadCurrentCashRegister();
      
      if (currentCashRegister) {
        // Load sales for current cash register
        const sales = await getSalesByCashRegister(currentCashRegister.id);
        setCurrentSales(sales);
      } else {
        setCurrentSales([]);
      }
    } catch (error) {
      console.error('Error loading cash register:', error);
      Alert.alert('Erro', 'Não foi possível carregar as informações do caixa');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCurrentCashRegister();
    setRefreshing(false);
  };

  const handleOpenCashSession = async () => {
    if (!openingAmount.trim() || isNaN(Number(openingAmount))) {
      Alert.alert('Erro', 'Valor de abertura deve ser um número válido');
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Usuário não encontrado');
      return;
    }

    try {
      setLoading(true);
      
      await openCashSession({ userId: user.id, openingAmount: Number(openingAmount) });
      
      Alert.alert('Sucesso', 'Sessão de caixa aberta com sucesso');
      
      setOpenModalVisible(false);
      setOpeningAmount('');
      setNotes('');
      
      await loadCurrentCashSession();
    } catch (error: any) {
      console.error('Error opening cash session:', error);
      
      let errorTitle = 'Erro';
      let errorMessage = 'Não foi possível abrir a sessão de caixa';
      
      if (error.message) {
        if (error.message.includes('já possui uma sessão ativa')) {
          errorTitle = 'Sessão já ativa';
          errorMessage = 'Você já possui uma sessão de caixa ativa. Verifique a tela principal ou aguarde alguns segundos e tente novamente.';
        } else if (error.message.includes('Operação de caixa já em andamento')) {
          errorTitle = 'Operação em andamento';
          errorMessage = 'Uma operação de caixa já está sendo processada. Aguarde alguns segundos e tente novamente.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCashSession = async () => {
    if (!closingAmount.trim() || isNaN(Number(closingAmount))) {
      Alert.alert('Erro', 'Valor de fechamento deve ser um número válido');
      return;
    }

    if (!currentCashSession) {
      Alert.alert('Erro', 'Nenhuma sessão de caixa ativa encontrada');
      return;
    }

    try {
      setLoading(true);
      
      // Primeiro, validar se a sessão pode ser consolidada
      const validation = await validateSessionForConsolidation(currentCashSession.id);
      
      if (!validation.canConsolidate) {
        Alert.alert(
          'Não é possível fechar a sessão',
          `Problemas encontrados:\n${validation.issues.join('\n')}`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Calcular resumo de consolidação
      const summary = await calculateConsolidationSummary(currentCashSession.id, Number(closingAmount));
      setConsolidationSummary(summary);
      
      // Mostrar resumo e confirmar fechamento
      Alert.alert(
        'Confirmar Fechamento',
        `Resumo da sessão:\n` +
        `Vendas: ${summary.salesCount}\n` +
        `Total vendido: R$ ${summary.totalSales.toFixed(2)}\n` +
        `Dinheiro esperado: R$ ${summary.expectedAmount.toFixed(2)}\n` +
        `Dinheiro informado: R$ ${summary.closingAmount.toFixed(2)}\n` +
        `Diferença: R$ ${summary.difference.toFixed(2)}\n\n` +
        `Deseja confirmar o fechamento?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Confirmar', 
            onPress: async () => {
              try {
                await closeCashSession(currentCashSession.id, { closingAmount: Number(closingAmount) });
                Alert.alert('Sucesso', 'Sessão de caixa fechada e consolidada com sucesso');
                
                setCloseModalVisible(false);
                setClosingAmount('');
                setNotes('');
                setConsolidationSummary(null);
              } catch (error: any) {
                console.error('Error closing cash session:', error);
                Alert.alert('Erro', error.message || 'Não foi possível fechar a sessão');
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error preparing to close cash session:', error);
      Alert.alert('Erro', error.message || 'Não foi possível preparar o fechamento da sessão');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const getTotalSalesAmount = () => {
    return currentSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  };

  const getTotalCashSales = () => {
    return currentSales
      .filter(sale => sale.paymentMethod === 'CASH')
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
  };

  const getExpectedClosingAmount = () => {
    if (!currentCashSession) return 0;
    return currentCashSession.openingAmount + getTotalCashSales();
  };





  const renderCashSessionInfo = () => {
    if (!currentCashSession) {
      return (
        <>
          <Surface style={[styles.statusCard, { backgroundColor: theme.colors.errorContainer }]}>
            <View style={styles.statusHeader}>
              <View style={styles.statusInfo}>
                <Title style={[styles.statusTitle, { color: theme.colors.onErrorContainer }]}>Sessão Fechada</Title>
                <Paragraph style={[styles.statusSubtitle, { color: theme.colors.onErrorContainer }]}>
                  Nenhuma sessão de caixa está ativa no momento
                </Paragraph>
              </View>
              <Chip 
                style={[styles.statusChip, { backgroundColor: theme.colors.error }]}
                textStyle={[styles.statusChipText, { color: theme.colors.onError }]}
              >
                FECHADA
              </Chip>
            </View>
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={() => setOpenModalVisible(true)}
                style={styles.primaryButton}
                buttonColor={theme.colors.primary}
                icon="cash-register"
              >
                Abrir Sessão
              </Button>
              <Button
                mode="outlined"
                onPress={() => setHistoryModalVisible(true)}
                style={styles.secondaryButton}
                textColor={theme.colors.primary}
                icon="history"
              >
                Histórico
              </Button>
            </View>
          </Surface>
        </>
      );
    }

    return (
      <>
        <Surface style={[styles.statusCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Title style={[styles.statusTitle, { color: theme.colors.onPrimaryContainer }]}>Sessão Ativa</Title>
              <Paragraph style={[styles.statusSubtitle, { color: theme.colors.onPrimaryContainer }]}>
                Aberta em {formatDateTime(new Date(currentCashSession.openedAt))}
              </Paragraph>
            </View>
            <Chip 
              style={[styles.statusChip, { backgroundColor: theme.colors.primary }]}
              textStyle={[styles.statusChipText, { color: theme.colors.onPrimary }]}
            >
              ATIVA
            </Chip>
          </View>
          
          <View style={styles.cashInfo}>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Paragraph style={[styles.infoLabel, { color: theme.colors.onPrimaryContainer }]}>Valor Inicial</Paragraph>
                <Title style={[styles.infoValue, { color: theme.colors.onPrimaryContainer }]}>
                  {formatCurrency(currentCashSession.openingAmount)}
                </Title>
              </View>
              
              <View style={styles.infoItem}>
                <Paragraph style={[styles.infoLabel, { color: theme.colors.onPrimaryContainer }]}>Total Vendas</Paragraph>
                <Title style={[styles.infoValue, { color: theme.colors.onPrimaryContainer }]}>
                  {formatCurrency(getTotalSalesAmount())}
                </Title>
              </View>
              
              <View style={styles.infoItem}>
                <Paragraph style={[styles.infoLabel, { color: theme.colors.onPrimaryContainer }]}>Vendas em Dinheiro</Paragraph>
                <Title style={[styles.infoValue, { color: theme.colors.onPrimaryContainer }]}>
                  {formatCurrency(getTotalCashSales())}
                </Title>
              </View>
            </View>
            
            <Divider style={[styles.divider, { backgroundColor: theme.colors.onPrimaryContainer }]} />
            
            <View style={styles.expectedContainer}>
              <Paragraph style={[styles.infoLabel, { color: theme.colors.onPrimaryContainer }]}>Valor Esperado</Paragraph>
              <Title style={[styles.expectedValue, { color: theme.colors.secondary }]}>
                {formatCurrency(getExpectedClosingAmount())}
              </Title>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => {
                setClosingAmount(getExpectedClosingAmount().toString());
                setCloseModalVisible(true);
              }}
              style={styles.primaryButton}
              buttonColor={theme.colors.error}
              icon="cash-register"
            >
              Fechar Sessão
            </Button>
            <Button
              mode="outlined"
              onPress={() => setHistoryModalVisible(true)}
              style={styles.secondaryButton}
              textColor={theme.colors.primary}
              icon="history"
            >
              Histórico
            </Button>
          </View>
        </Surface>

         <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
             <View style={styles.salesHeader}>
               <Title style={{ color: theme.colors.onSurface }}>Vendas do Período</Title>
               <Chip 
                 style={[styles.salesChip, { backgroundColor: theme.colors.secondaryContainer }]}
                 textStyle={{ color: theme.colors.onSecondaryContainer }}
               >
                 {currentSales.length} vendas
               </Chip>
             </View>
             
             {currentSales.length > 0 ? (
               currentSales.map((sale, index) => (
                 <View key={sale.id}>
                   <List.Item
                     title={`Venda #${index + 1}`}
                     titleStyle={{ color: theme.colors.onSurface }}
                     description={`${formatDateTime(sale.createdAt)} - ${sale.paymentMethod}`}
                     descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                     left={(props) => (
                       <List.Icon {...props} icon="receipt" color={theme.colors.primary} />
                     )}
                     right={() => (
                       <Paragraph style={[styles.saleAmount, { color: theme.colors.primary }]}>
                         {formatCurrency(sale.totalAmount)}
                       </Paragraph>
                     )}
                   />
                   {index < currentSales.length - 1 && <Divider style={{ backgroundColor: theme.colors.outline }} />}
                 </View>
               ))
             ) : (
               <View style={styles.noSalesContainer}>
                 <Paragraph style={[styles.noSales, { color: theme.colors.onSurfaceVariant }]}>Nenhuma venda realizada</Paragraph>
               </View>
             )}
           </Card.Content>
        </Card>
      </>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {(loading || contextLoading) && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        renderCashSessionInfo()
      )}

      {/* Open Cash Register Modal */}
      <Portal>
        <Modal
          visible={openModalVisible}
          onDismiss={() => setOpenModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Abrir Sessão</Title>

          <TextInput
            label="Valor de Abertura *"
            value={openingAmount}
            onChangeText={setOpeningAmount}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            theme={{ colors: { primary: theme.colors.primary } }}
          />

          <TextInput
            label="Observações"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            theme={{ colors: { primary: theme.colors.primary } }}
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setOpenModalVisible(false)}
              style={styles.modalButton}
              textColor={theme.colors.primary}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleOpenCashSession}
              style={styles.modalButton}
              buttonColor={theme.colors.primary}
              loading={loading || contextLoading}
            >
              Abrir Sessão
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Close Cash Register Modal */}
      <Portal>
        <Modal
          visible={closeModalVisible}
          onDismiss={() => setCloseModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Fechar Sessão</Title>

          <View style={[styles.summaryContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={styles.summaryRow}>
              <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>Valor Inicial:</Paragraph>
              <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>{formatCurrency(currentCashSession?.openingAmount || 0)}</Paragraph>
            </View>
            <View style={styles.summaryRow}>
              <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>Total de Vendas:</Paragraph>
              <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>{formatCurrency(getTotalSalesAmount())}</Paragraph>
            </View>
            <Divider style={[styles.summaryDivider, { backgroundColor: theme.colors.outline }]} />
            <View style={styles.summaryRow}>
              <Paragraph style={[styles.summaryTotal, { color: theme.colors.primary }]}>Valor Esperado:</Paragraph>
              <Paragraph style={[styles.summaryTotal, { color: theme.colors.primary }]}>
                {formatCurrency(getExpectedClosingAmount())}
              </Paragraph>
            </View>
          </View>

          <TextInput
            label="Valor de Fechamento *"
            value={closingAmount}
            onChangeText={setClosingAmount}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            theme={{ colors: { primary: theme.colors.primary } }}
          />

          <TextInput
            label="Observações"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            theme={{ colors: { primary: theme.colors.primary } }}
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setCloseModalVisible(false)}
              style={styles.modalButton}
              textColor={theme.colors.primary}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleCloseCashSession}
              style={styles.modalButton}
              buttonColor={theme.colors.error}
              loading={loading || contextLoading}
            >
              Fechar Sessão
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Cash History Modal */}
      <Portal>
        <Modal
          visible={historyModalVisible}
          onDismiss={() => setHistoryModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Histórico de Sessões</Title>
          
          <ScrollView style={styles.historyScroll}>
            {cashHistory.length > 0 ? (
              cashHistory.map((cash, index) => (
                <Card key={cash.id} style={[styles.historyCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Card.Content>
                    <View style={styles.historyHeader}>
                      <Title style={[styles.historyTitle, { color: theme.colors.onSurfaceVariant }]}>
                        Sessão #{index + 1}
                      </Title>
                      <Chip 
                        style={[styles.historyChip, { 
                          backgroundColor: cash.status === 'OPEN' ? theme.colors.primary : theme.colors.outline 
                        }]}
                        textStyle={{ color: cash.status === 'OPEN' ? theme.colors.onPrimary : theme.colors.onSurface }}
                      >
                        {cash.status === 'OPEN' ? 'ABERTO' : 'FECHADO'}
                      </Chip>
                    </View>
                    
                    <View style={styles.historyInfo}>
                      <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                        Abertura: {formatDateTime(cash.openedAt)}
                      </Paragraph>
                      {cash.closedAt && (
                        <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                          Fechamento: {formatDateTime(cash.closedAt)}
                        </Paragraph>
                      )}
                      <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                        Valor: {formatCurrency(cash.openingAmount)}
                        {cash.closingAmount && ` → ${formatCurrency(cash.closingAmount)}`}
                      </Paragraph>
                    </View>
                  </Card.Content>
                </Card>
              ))
            ) : (
              <View style={styles.noHistoryContainer}>
                <Paragraph style={[styles.noHistory, { color: theme.colors.onSurfaceVariant }]}>
                  Nenhum histórico encontrado
                </Paragraph>
              </View>
            )}
          </ScrollView>
          
          <View style={styles.modalActions}>
            <Button
              mode="contained"
              onPress={() => setHistoryModalVisible(false)}
              style={styles.modalButton}
              buttonColor={theme.colors.primary}
            >
              Fechar
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  // Status Card Styles
  statusCard: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  statusInfo: {
    flex: 1,
    marginRight: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Cash Info Styles
  cashInfo: {
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  infoLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    opacity: 0.8,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.3,
  },
  expectedContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  expectedValue: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Notes Styles
  notesContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
  },
  // Sales Card Styles
  card: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  salesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  salesChip: {
    alignSelf: 'flex-start',
  },
  saleAmount: {
    fontWeight: 'bold',
    fontSize: 16,
    alignSelf: 'center',
  },
  noSalesContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  noSales: {
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 16,
  },
  // Modal Styles
  modal: {
    padding: 24,
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  summaryContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryDivider: {
    marginVertical: 12,
    height: 1,
  },
  summaryTotal: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
  },
  // History Modal Styles
  historyScroll: {
    maxHeight: 400,
    marginBottom: 16,
  },
  historyCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyChip: {
    alignSelf: 'flex-start',
  },
  historyInfo: {
    gap: 4,
  },
  noHistoryContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noHistory: {
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 16,
  },
});

export default CashRegisterScreen;