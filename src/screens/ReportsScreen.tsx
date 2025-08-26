import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Divider,
  Portal,
  Modal,
  ActivityIndicator,
  List,
  SegmentedButtons,
  IconButton,
  useTheme,
  Surface,
  Text,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../contexts/AppContext';
import { apiService, ApiSale, ApiCashRegister } from '../services/apiService';
import { Sale, CashRegister, PaymentMethod, DailySalesReport, CashRegisterReport } from '../types';
import { ReportService } from '../services/reportService';
import { ReportViewer } from '../components/ReportViewer';

type ReportType = 'daily' | 'cashRegister';

const ReportsScreen: React.FC = () => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [dailyReports, setDailyReports] = useState<DailySalesReport[]>([]);
  const [cashRegisterReports, setCashRegisterReports] = useState<CashRegisterReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<DailySalesReport | CashRegisterReport | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [reportViewerVisible, setReportViewerVisible] = useState(false);
  const [reportFilePath, setReportFilePath] = useState<string>('');
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [hideHistoryEnabled, setHideHistoryEnabled] = useState(false);
  const [showOnlyToday, setShowOnlyToday] = useState(true);

  const { state, dispatch } = useAppContext();

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      loadReports();
    }, [reportType, showOnlyToday])
  );

  const loadSettings = async () => {
    try {
      const settings = await apiService.getSettings();
      setHideHistoryEnabled(settings.hideHistoryEnabled);
    } catch (error) {
      console.error('Error loading settings:', error);
      // Default to false if settings cannot be loaded
      setHideHistoryEnabled(false);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      
      if (reportType === 'daily') {
        await loadDailyReports();
      } else {
        await loadCashRegisterReports();
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyReports = async () => {
    try {
      const allSales: ApiSale[] = await apiService.getSales();
      
      // Verificar se allSales é um array válido
      if (!Array.isArray(allSales)) {
        console.warn('API returned invalid data for sales:', allSales);
        setDailyReports([]);
        setTodaySales([]);
        return;
      }
      
      // Filter sales based on showOnlyToday setting
      const today = new Date().toDateString();
      const filteredSales = showOnlyToday 
        ? allSales.filter(sale => {
            const saleDate = new Date(sale.createdAt).toDateString();
            return saleDate === today;
          })
        : allSales;
      
      // Always get today's sales for overview
      const todaySalesOnly = allSales.filter(sale => {
        const saleDate = new Date(sale.createdAt).toDateString();
        return saleDate === today;
      });
      
      // Group sales by date (filtered sales)
      const salesByDate = filteredSales.reduce((acc: Record<string, ApiSale[]>, sale: ApiSale) => {
        const date = new Date(sale.createdAt).toDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(sale);
        return acc;
      }, {} as Record<string, ApiSale[]>);

      // Generate daily reports
      const reports: DailySalesReport[] = Object.entries(salesByDate).map(([date, sales]: [string, ApiSale[]]) => {
        // Calculate total based on sum of individual items for consistency
        const totalAmount = sales.reduce((sum: number, sale: ApiSale) => {
          const saleItemsTotal = (sale.items && Array.isArray(sale.items)) 
            ? sale.items.reduce((itemSum: number, item: any) => itemSum + (item.price * item.quantity), 0)
            : sale.total; // Fallback to API total if items are not available
          return sum + saleItemsTotal;
        }, 0);
        
        // Group by payment method
        const paymentMethods = sales.reduce((acc: Record<PaymentMethod, { count: number; amount: number }>, sale: ApiSale) => {
          const method = sale.paymentMethod;
          if (!acc[method]) {
            acc[method] = { count: 0, amount: 0 };
          }
          acc[method].count += 1;
          // Use calculated total from items for consistency
          const saleItemsTotal = (sale.items && Array.isArray(sale.items)) 
            ? sale.items.reduce((itemSum: number, item: any) => itemSum + (item.price * item.quantity), 0)
            : sale.total;
          acc[method].amount += saleItemsTotal;
          return acc;
        }, {} as Record<PaymentMethod, { count: number; amount: number }>);

        return {
          date,
          totalSales: sales.length,
          totalAmount,
          paymentMethods: Object.entries(paymentMethods).map(([method, data]: [string, { count: number; amount: number }]) => ({
            method: method as PaymentMethod,
            count: data.count,
            amount: data.amount,
          })),
        };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setDailyReports(reports);
      
      // Load today's sales for quick view
       const todaySalesConverted = todaySalesOnly.map((sale: ApiSale): Sale => {
         // Calculate total based on sum of individual items for consistency
         const calculatedTotal = (sale.items && Array.isArray(sale.items)) 
           ? sale.items.reduce((itemSum: number, item: any) => itemSum + (item.price * item.quantity), 0)
           : sale.total;
         
         return {
           id: sale.id,
           userId: sale.userId,
           cashRegisterId: sale.cashRegisterId,
           totalAmount: calculatedTotal,
           paymentMethod: sale.paymentMethod as PaymentMethod,
           paymentStatus: sale.status === 'COMPLETED' ? 'COMPLETED' as any : 'PENDING' as any,
           pixQrCode: undefined,
           createdAt: new Date(sale.createdAt),
           updatedAt: new Date(sale.updatedAt),
           user: sale.user ? {
             id: sale.user.id,
             email: sale.user.email,
             name: sale.user.name,
             password: '',
             role: sale.user.role as any,
             active: sale.user.active,
             createdAt: new Date(sale.user.createdAt),
             updatedAt: new Date(sale.user.updatedAt),
           } : undefined,
           cashRegister: undefined,
           items: sale.items.map(item => ({
             id: `${sale.id}-${item.productId}`,
             saleId: sale.id,
             productId: item.productId,
             quantity: item.quantity,
             unitPrice: item.price,
             totalPrice: item.price * item.quantity,
           }))
         };
       });
       setTodaySales(todaySalesConverted);
    } catch (error) {
      console.error('Error loading daily reports:', error);
      setDailyReports([]);
      setTodaySales([]);
    }
  };

  const loadCashRegisterReports = async () => {
    try {
      const allCashRegisters: ApiCashRegister[] = await apiService.getCashRegisters();
      
      // Verificar se allCashRegisters é um array válido
      if (!Array.isArray(allCashRegisters)) {
        console.warn('API returned invalid data for cash registers:', allCashRegisters);
        setCashRegisterReports([]);
        return;
      }
      
      // Filter cash registers based on showOnlyToday setting
      const todayDate = new Date().toDateString();
      const filteredCashRegisters = showOnlyToday 
        ? allCashRegisters.filter(cashRegister => {
            const registerDate = new Date(cashRegister.createdAt).toDateString();
            return registerDate === todayDate;
          })
        : allCashRegisters;
      
      const reports: CashRegisterReport[] = [];
      
      for (const cashRegister of filteredCashRegisters) {
        const sales: ApiSale[] = await apiService.getSales({ cashRegisterId: cashRegister.id });
        // Verificar se sales é um array válido
        const validSales = Array.isArray(sales) ? sales : [];
        // Calculate total amount for this cash register based on sum of individual items
        const totalAmount = validSales.reduce((sum: number, sale: ApiSale) => {
          const saleItemsTotal = (sale.items && Array.isArray(sale.items)) 
            ? sale.items.reduce((itemSum: number, item: any) => itemSum + (item.price * item.quantity), 0)
            : sale.total; // Fallback to API total if items are not available
          return sum + saleItemsTotal;
        }, 0);
        
        reports.push({
          id: cashRegister.id,
          openedAt: new Date(cashRegister.createdAt),
          closedAt: cashRegister.status === 'CLOSED' ? new Date(cashRegister.updatedAt) : undefined,
          openingAmount: cashRegister.initialAmount,
          closingAmount: cashRegister.finalAmount,
          totalSales: validSales.length,
          totalAmount,
          user: {
            name: cashRegister.user?.name || 'Usuário',
            email: cashRegister.user?.email || 'user@example.com',
          },
        });
      }
      
      setCashRegisterReports(reports.sort((a, b) => 
        new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading cash register reports:', error);
      setCashRegisterReports([]); // Definir array vazio em caso de erro
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      let filePath: string;
      
      if (reportType === 'daily') {
        filePath = await ReportService.generateDailyReportPDF(dailyReports);
      } else {
        filePath = await ReportService.generateCashRegisterReportPDF(cashRegisterReports);
      }
      
      setReportFilePath(filePath);
      setReportViewerVisible(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Erro', 'Erro ao gerar relatório PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      let filePath: string;
      
      if (reportType === 'daily') {
        filePath = await ReportService.generateDailyReportExcel(dailyReports);
      } else {
        filePath = await ReportService.generateCashRegisterReportExcel(cashRegisterReports);
      }
      
      await ReportService.shareFile(filePath, 'Relatório Excel');
      Alert.alert('Sucesso', 'Relatório Excel gerado e compartilhado com sucesso!');
    } catch (error) {
      console.error('Error generating Excel:', error);
      Alert.alert('Erro', 'Erro ao gerar relatório Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Confirmar Limpeza',
      'Tem certeza que deseja limpar o histórico disponível? Esta ação não pode ser desfeita.\n\nNota: Vendas de caixas fechados não podem ser deletadas.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Clear all available sales from the server
              await apiService.clearAllSales();
              
              // Clear local state
              setDailyReports([]);
              setCashRegisterReports([]);
              setTodaySales([]);
              
              // Reload data to ensure consistency
              await loadReports();
              
              Alert.alert('Sucesso', 'Histórico disponível limpo com sucesso!\n\nVendas de caixas fechados foram mantidas.');
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert('Erro', 'Erro ao limpar histórico. Tente novamente.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };





  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.PIX:
        return 'PIX';
      case PaymentMethod.DEBIT_CARD:
        return 'Cartão de Débito';
      case PaymentMethod.CREDIT_CARD:
        return 'Cartão de Crédito';
      case PaymentMethod.CASH:
        return 'Dinheiro';
      default:
        return method;
    }
  };

  const getPaymentMethodColor = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.PIX:
        return '#00d4aa';
      case PaymentMethod.DEBIT_CARD:
        return '#2196f3';
      case PaymentMethod.CREDIT_CARD:
        return '#ff9800';
      case PaymentMethod.CASH:
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  };

  const renderTodayOverview = () => {
    const todayTotal = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    return (
      <Surface style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <View style={{ padding: 16 }}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>Resumo de Hoje</Text>
          <View style={styles.overviewStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Vendas</Text>
              <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>{todaySales.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Faturamento</Text>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {formatCurrency(todayTotal)}
              </Text>
            </View>
          </View>
        </View>
      </Surface>
    );
  };

  const renderDailyReport = ({ item: report }: { item: DailySalesReport }) => (
    <Surface style={[styles.reportCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={{ padding: 16 }}>
        <View style={styles.reportHeader}>
          <View>
            <Text variant="titleMedium" style={[styles.reportDate, { color: theme.colors.onSurface }]}>{formatDate(report.date)}</Text>
            <Text style={[styles.reportSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {report.totalSales} venda(s)
            </Text>
          </View>
          <Text variant="titleMedium" style={[styles.reportAmount, { color: theme.colors.primary }]}>
            {formatCurrency(report.totalAmount)}
          </Text>
        </View>
        
        <View style={styles.paymentMethods}>
          {report.paymentMethods.map((pm, index) => (
            <Chip
              key={index}
              style={[
                styles.paymentChip,
                { backgroundColor: getPaymentMethodColor(pm.method) }
              ]}
              textStyle={styles.paymentChipText}
              compact
            >
              {getPaymentMethodLabel(pm.method)}: {pm.count}
            </Chip>
          ))}
        </View>
        
        <Button
          mode="text"
          onPress={() => {
            setSelectedReport(report);
            setDetailModalVisible(true);
          }}
          style={styles.detailButton}
          textColor={theme.colors.primary}
        >
          Ver Detalhes
        </Button>
      </View>
    </Surface>
  );

  const renderCashRegisterReport = ({ item: report }: { item: CashRegisterReport }) => (
    <Surface style={[styles.reportCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={{ padding: 16 }}>
        <View style={styles.reportHeader}>
          <View>
            <Text variant="titleMedium" style={[styles.reportDate, { color: theme.colors.onSurface }]}>
              {formatDate(report.openedAt)}
            </Text>
            <Text style={[styles.reportSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {report.closedAt ? 'Fechado' : 'Aberto'} • {report.totalSales} venda(s)
            </Text>
          </View>
          <View style={styles.cashRegisterAmounts}>
            <Text style={[styles.openingAmount, { color: theme.colors.onSurfaceVariant }]}>
              Inicial: {formatCurrency(report.openingAmount)}
            </Text>
            {report.closingAmount !== undefined && (
              <Text style={[styles.closingAmount, { color: theme.colors.onSurfaceVariant }]}>
                Final: {formatCurrency(report.closingAmount)}
              </Text>
            )}
            <Text variant="titleMedium" style={[styles.reportAmount, { color: theme.colors.primary }]}>
              Vendas: {formatCurrency(report.totalAmount)}
            </Text>
          </View>
        </View>
        
        <Button
          mode="text"
          onPress={() => {
            setSelectedReport(report);
            setDetailModalVisible(true);
          }}
          style={styles.detailButton}
          textColor={theme.colors.primary}
        >
          Ver Detalhes
        </Button>
      </View>
    </Surface>
  );

  const renderDetailModal = () => {
    if (!selectedReport) return null;

    const isDailyReport = 'paymentMethods' in selectedReport;

    return (
      <Portal>
        <Modal
          visible={detailModalVisible}
          onDismiss={() => setDetailModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            {isDailyReport ? 'Relatório Diário' : 'Relatório de Caixa'}
          </Text>
          
          <ScrollView style={styles.modalContent}>
            {isDailyReport ? (
              <View>
                <Text style={[styles.modalDate, { color: theme.colors.onSurfaceVariant }]}>
                  Data: {formatDate((selectedReport as DailySalesReport).date)}
                </Text>
                
                <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}>
                    <Text style={{ color: theme.colors.onSurface }}>Total de Vendas:</Text>
                    <Text style={[styles.modalStatValue, { color: theme.colors.onSurface }]}>
                      {(selectedReport as DailySalesReport).totalSales}
                    </Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={{ color: theme.colors.onSurface }}>Faturamento Total:</Text>
                    <Text style={[styles.modalStatValue, { color: theme.colors.primary }]}>
                      {formatCurrency((selectedReport as DailySalesReport).totalAmount)}
                    </Text>
                  </View>
                </View>
                
                <Divider style={[styles.modalDivider, { backgroundColor: theme.colors.outline }]} />
                
                <Text variant="titleMedium" style={[styles.modalSectionTitle, { color: theme.colors.onSurface }]}>Métodos de Pagamento</Text>
                {(selectedReport as DailySalesReport).paymentMethods.map((pm, index) => (
                  <List.Item
                    key={index}
                    title={getPaymentMethodLabel(pm.method)}
                    description={`${pm.count} transação(ões)`}
                    titleStyle={{ color: theme.colors.onSurface }}
                    descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                    right={() => (
                      <Text style={[styles.modalPaymentAmount, { color: theme.colors.primary }]}>
                        {formatCurrency(pm.amount)}
                      </Text>
                    )}
                  />
                ))}
              </View>
            ) : (
              <View>
                <Text style={[styles.modalDate, { color: theme.colors.onSurfaceVariant }]}>
                  Abertura: {formatDateTime((selectedReport as CashRegisterReport).openedAt)}
                </Text>
                {(selectedReport as CashRegisterReport).closedAt && (
                  <Text style={[styles.modalDate, { color: theme.colors.onSurfaceVariant }]}>
                    Fechamento: {formatDateTime((selectedReport as CashRegisterReport).closedAt!)}
                  </Text>
                )}
                
                <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}>
                    <Text style={{ color: theme.colors.onSurface }}>Valor Inicial:</Text>
                    <Text style={[styles.modalStatValue, { color: theme.colors.onSurface }]}>
                      {formatCurrency((selectedReport as CashRegisterReport).openingAmount)}
                    </Text>
                  </View>
                  {(selectedReport as CashRegisterReport).closingAmount !== undefined && (
                    <View style={styles.modalStatItem}>
                      <Text style={{ color: theme.colors.onSurface }}>Valor Final:</Text>
                      <Text style={[styles.modalStatValue, { color: theme.colors.onSurface }]}>
                        {formatCurrency((selectedReport as CashRegisterReport).closingAmount!)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.modalStatItem}>
                    <Text style={{ color: theme.colors.onSurface }}>Total de Vendas:</Text>
                    <Text style={[styles.modalStatValue, { color: theme.colors.onSurface }]}>
                      {(selectedReport as CashRegisterReport).totalSales}
                    </Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={{ color: theme.colors.onSurface }}>Faturamento:</Text>
                    <Text style={[styles.modalStatValue, { color: theme.colors.primary }]}>
                      {formatCurrency((selectedReport as CashRegisterReport).totalAmount)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
          
          <Button
            mode="contained"
            onPress={() => setDetailModalVisible(false)}
            style={styles.modalCloseButton}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
          >
            Fechar
          </Button>
        </Modal>
      </Portal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <SegmentedButtons
          value={reportType}
          onValueChange={(value) => setReportType(value as ReportType)}
          buttons={[
            { value: 'daily', label: 'Vendas Diárias' },
            { value: 'cashRegister', label: 'Histórico de Caixa' },
          ]}
          style={styles.segmentedButtons}
        />
        
        <View style={styles.actionButtons}>
          <IconButton
            icon={showOnlyToday ? "calendar-today" : "calendar-month"}
            mode="contained"
            onPress={() => setShowOnlyToday(!showOnlyToday)}
            disabled={hideHistoryEnabled || loading}
            style={styles.actionButton}
            containerColor={showOnlyToday ? theme.colors.primary : theme.colors.secondary}
            iconColor={showOnlyToday ? theme.colors.onPrimary : theme.colors.onSecondary}
          />
          <IconButton
            icon="file-pdf-box"
            mode="contained"
            onPress={handleExportPDF}
            disabled={hideHistoryEnabled || loading || (reportType === 'daily' ? dailyReports.length === 0 : cashRegisterReports.length === 0)}
            style={styles.actionButton}
            containerColor={theme.colors.primary}
            iconColor={theme.colors.onPrimary}
          />
          <IconButton
            icon="file-excel-box"
            mode="contained"
            onPress={handleExportExcel}
            disabled={hideHistoryEnabled || loading || (reportType === 'daily' ? dailyReports.length === 0 : cashRegisterReports.length === 0)}
            style={styles.actionButton}
            containerColor={theme.colors.primary}
            iconColor={theme.colors.onPrimary}
          />
          <IconButton
            icon="delete-sweep"
            mode="contained"
            onPress={handleClearHistory}
            disabled={hideHistoryEnabled || loading}
            style={styles.actionButton}
            containerColor={theme.colors.error}
            iconColor={theme.colors.onError}
          />
        </View>
      </Surface>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {reportType === 'daily' && renderTodayOverview()}
        
        {hideHistoryEnabled ? (
          <View style={styles.emptyContainer}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Histórico de vendas não disponível</Text>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : reportType === 'daily' ? (
          <FlatList
            data={dailyReports}
            renderItem={renderDailyReport}
            keyExtractor={(item) => item.date}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>Nenhum relatório encontrado</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={cashRegisterReports}
            renderItem={renderCashRegisterReport}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>Nenhum relatório encontrado</Text>
              </View>
            }
          />
        )}
        

      </ScrollView>

      {renderDetailModal()}
      
      <Portal>
        <Modal
          visible={reportViewerVisible}
          onDismiss={() => setReportViewerVisible(false)}
          contentContainerStyle={styles.reportViewerModal}
        >
          <View style={[styles.reportViewerContainer, { backgroundColor: theme.colors.surface }]}>
            <Surface style={[styles.reportViewerHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]} elevation={1}>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>Visualizar Relatório</Text>
              <IconButton
                icon="close"
                onPress={() => setReportViewerVisible(false)}
                iconColor={theme.colors.onSurface}
              />
            </Surface>
            {reportFilePath ? (
              <ReportViewer
                filePath={reportFilePath}
                onClose={() => setReportViewerVisible(false)}
              />
            ) : null}
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    marginHorizontal: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  overviewCard: {
    marginBottom: 16,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportCard: {
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportDate: {
    fontSize: 18,
    marginBottom: 4,
  },
  reportSubtitle: {
  },
  reportAmount: {
    fontSize: 14,
    textAlign: 'right',
  },
  cashRegisterAmounts: {
    alignItems: 'flex-end',
  },
  openingAmount: {
    fontSize: 12,
  },
  closingAmount: {
    fontSize: 12,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  paymentChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  paymentChipText: {
    color: 'white',
    fontSize: 10,
  },
  detailButton: {
    alignSelf: 'flex-start',
  },
  modal: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  modalContent: {
    maxHeight: 400,
  },
  modalDate: {
    marginBottom: 8,
  },
  modalStats: {
    marginVertical: 16,
  },
  modalStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalStatValue: {
    fontWeight: 'bold',
  },
  modalDivider: {
    marginVertical: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  modalPaymentAmount: {
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  modalCloseButton: {
    marginTop: 16,
  },
  factoryResetButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'center',
    width: '100%',
  },
  factoryResetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  reportViewerModal: {
    flex: 1,
    margin: 0,
  },
  reportViewerContainer: {
    flex: 1,
  },
  reportViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
});

export default ReportsScreen;