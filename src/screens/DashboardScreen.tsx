import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  ActivityIndicator,
  useTheme,
  Text,
  Surface,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppContext } from '../contexts/AppContext';
import { MainStackParamList } from '../navigation/AppNavigator';
import { dashboardService, DashboardData } from '../services/dashboardService';
import { Sale, CashRegister } from '../types';

type DashboardNavigationProp = StackNavigationProp<MainStackParamList>;

// Interface movida para dashboardService.ts

interface QuickAccessItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  route: keyof MainStackParamList;
}

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const DashboardScreen: React.FC = () => {
  const { 
    state, 
    dispatch,
    loadUsers,
    loadProducts,
    loadCurrentCashRegister,
    loadCurrentCashSession,
    loadSales,
    createUser,
    updateUser,
    deleteUser,
    createProduct,
    updateProduct,
    deleteProduct,
    openCashSession,
    closeCashSession,
    openCashRegister,
    closeCashRegister,
    createSale,
    getSalesByCashRegister,
    getSalesBySession,
    authenticate,
    getCurrentUser,
    logout,
    calculateConsolidationSummary,
    consolidateSession,
    validateSessionForConsolidation,
    getConsolidatedData,
    generateConsolidationReport
  } = useAppContext();
  const { user, isAuthenticated } = state;
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const navigation = useNavigation<DashboardNavigationProp>();

  // Mover quickAccessItems para dentro do componente para ser reativo aos dados
  const quickAccessItems: QuickAccessItem[] = React.useMemo(() => [
    {
      id: 'cash',
      title: 'Caixa',
      subtitle: dashboardData?.cashRegisterStatus === 'open' ? 'Aberto' : 'Fechado',
      icon: 'cash-multiple',
      color: dashboardData?.cashRegisterStatus === 'open' ? theme.colors.primary : theme.colors.error,
      route: 'CashRegister',
    },
    {
      id: 'products',
      title: 'Produtos',
      subtitle: `${dashboardData?.totalProducts || 0} itens`,
      icon: 'package-variant',
      color: theme.colors.secondary,
      route: 'Products',
    },
    {
      id: 'sales',
      title: 'Vendas',
      subtitle: 'Novo PDV',
      icon: 'cash-register',
      color: theme.colors.tertiary,
      route: 'Checkout',
    },
    {
      id: 'reports',
      title: 'Relatórios',
      subtitle: 'Análises',
      icon: 'chart-line',
      color: theme.colors.primary,
      route: 'Reports',
    },
    {
      id: 'users',
      title: 'Usuários',
      subtitle: `${dashboardData?.activeUsers || 0} ativos`,
      icon: 'account-group',
      color: theme.colors.secondary,
      route: 'Users',
    },
    {
      id: 'settings',
      title: 'Configurações',
      subtitle: 'Sistema',
      icon: 'cog',
      color: theme.colors.outline,
      route: 'Settings',
    },
  ], [dashboardData, theme.colors]);

  const loadDashboardData = useCallback(async () => {
    try {
      // Não mostrar loading se já temos dados para evitar flickering
      if (!dashboardData) {
        setLoading(true);
      }
      
      // Configurar o contexto no dashboardService
      dashboardService.setAppContext({
        state,
        dispatch,
        loadUsers,
        loadProducts,
        loadCurrentCashRegister,
        loadCurrentCashSession,
        loadSales,
        createUser,
        updateUser,
        deleteUser,
        createProduct,
        updateProduct,
        deleteProduct,
        openCashSession,
        closeCashSession,
        openCashRegister,
        closeCashRegister,
        createSale,
        getSalesByCashRegister,
        getSalesBySession,
        authenticate,
        getCurrentUser,
        logout,
        calculateConsolidationSummary,
        consolidateSession,
        validateSessionForConsolidation,
        getConsolidatedData,
        generateConsolidationReport
      });
      
      // Aguardar um momento para garantir que o contexto esteja pronto
      await new Promise(resolve => setTimeout(resolve, 200));
      const data = await dashboardService.loadDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      // Definir dados padrão em caso de erro
      setDashboardData({
        cashRegisterStatus: 'closed',
        totalProducts: 0,
        activeUsers: 0,
        todaySales: 0,
        todayRevenue: 0,
        currentCashBalance: 0,
        weeklyData: [],
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dashboardData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Configurar o contexto no dashboardService
        dashboardService.setAppContext({
          state,
          dispatch,
          loadUsers,
          loadProducts,
          loadCurrentCashRegister,
          loadCurrentCashSession,
          loadSales,
          createUser,
          updateUser,
          deleteUser,
          createProduct,
          updateProduct,
          deleteProduct,
          openCashSession,
          closeCashSession,
          openCashRegister,
          closeCashRegister,
          createSale,
          getSalesByCashRegister,
          getSalesBySession,
          authenticate,
          getCurrentUser,
          logout,
          calculateConsolidationSummary,
          consolidateSession,
          validateSessionForConsolidation,
          getConsolidatedData,
          generateConsolidationReport
        });
      
      const data = await dashboardService.refreshData();
      setDashboardData(data);
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setRefreshing(false);
    }
  }, [state, dispatch]);

  // Carregar dados iniciais com delay para evitar flickering
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboardData();
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Configurar atualizações em tempo real
  useEffect(() => {
    const handleDataUpdate = (data: DashboardData) => {
      setDashboardData(data);
      setLoading(false);
    };

    // Aguardar um momento antes de configurar listeners
    const timer = setTimeout(() => {
      try {
        // Adicionar listener para atualizações
        dashboardService.addListener(handleDataUpdate);
        
        // Iniciar atualizações automáticas (a cada 60 segundos para reduzir carga)
        dashboardService.startRealTimeUpdates(60000);
      } catch (error) {
        console.error('Erro ao configurar atualizações em tempo real:', error);
      }
    }, 1000);

    // Cleanup ao desmontar o componente
    return () => {
      clearTimeout(timer);
      try {
        dashboardService.removeListener(handleDataUpdate);
        dashboardService.stopRealTimeUpdates();
      } catch (error) {
        console.error('Erro ao limpar listeners:', error);
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Forçar atualização quando a tela ganha foco
      try {
        // Configurar o contexto no dashboardService
          dashboardService.setAppContext({
            state,
            dispatch,
            loadUsers,
            loadProducts,
            loadCurrentCashRegister,
            loadCurrentCashSession,
            loadSales,
            createUser,
            updateUser,
            deleteUser,
            createProduct,
            updateProduct,
            deleteProduct,
            openCashSession,
            closeCashSession,
            openCashRegister,
            closeCashRegister,
            createSale,
            getSalesByCashRegister,
            getSalesBySession,
            authenticate,
            getCurrentUser,
            logout,
            calculateConsolidationSummary,
            consolidateSession,
            validateSessionForConsolidation,
            getConsolidatedData,
            generateConsolidationReport
          });
        
        dashboardService.refreshData();
      } catch (error) {
        console.error('Erro ao atualizar dados no foco:', error);
      }
    }, [state, dispatch])
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const renderEnhancedCard = (title: string, value: string, subtitle: string, icon: string, color: string, type: string) => (
    <Card style={[styles.enhancedCard, { backgroundColor: theme.colors.surface }]} key={title}>
      <Card.Content style={styles.enhancedCardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <MaterialCommunityIcons name={icon as any} size={28} color={color} />
          </View>
          <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>{title}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardValue, { color: color }]}>{value}</Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.onSurfaceVariant }]}>{subtitle}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderQuickAccessItem = (item: QuickAccessItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.quickAccessItem, isTablet && styles.quickAccessItemTablet]}
      onPress={() => navigation.navigate(item.route)}
      activeOpacity={0.7}
    >
      <Surface style={[styles.quickAccessSurface, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <View style={[styles.quickAccessIcon, { backgroundColor: `${item.color}15` }]}>
          <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
        </View>
        <Text style={[styles.quickAccessTitle, { color: theme.colors.onSurface }]}>{item.title}</Text>
        <Text style={[styles.quickAccessSubtitle, { color: theme.colors.onSurfaceVariant }]}>{item.subtitle}</Text>
      </Surface>
    </TouchableOpacity>
  );

  const renderWeeklyChart = () => {
    if (!dashboardData?.weeklyData) return null;

    const maxSales = Math.max(...dashboardData.weeklyData.map(d => d.sales));

    return (
      <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.chartHeader}>
            <Title style={[styles.chartTitle, { color: theme.colors.onSurface }]}>Vendas da Semana</Title>
            <IconButton
              icon="chart-line"
              size={20}
              iconColor={theme.colors.primary}
              onPress={() => navigation.navigate('Reports')}
            />
          </View>
          <View style={styles.chartContainer}>
            {dashboardData.weeklyData.map((item, index) => {
              const height = (item.sales / maxSales) * 100;
              return (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.chartBarContainer}>
                    <View
                      style={[
                        styles.chartBarFill,
                        {
                          height: `${height}%`,
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartBarLabel, { color: theme.colors.onSurfaceVariant }]}>
                    {item.day}
                  </Text>
                  <Text style={[styles.chartBarValue, { color: theme.colors.onSurface }]}>
                    {item.sales}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading && !dashboardData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>Carregando dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Title style={[styles.welcomeTitle, { color: theme.colors.onBackground }]}>
                Olá, {state.user?.name || 'Usuário'}!
              </Title>
            <Paragraph style={[styles.welcomeSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Paragraph>
          </View>
        </View>

        {/* Cards Organizados por Categoria */}
        <View style={styles.dashboardSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Resumo do Dia</Text>
            <Text style={[styles.lastUpdated, { color: theme.colors.onSurfaceVariant }]}>
              Atualizado: {dashboardData?.lastUpdated ? 
                new Date(dashboardData.lastUpdated).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : '--:--'
              }
            </Text>
          </View>

          {/* Grupo: Vendas e Faturamento */}
          <View style={styles.cardGroup}>
            <Text style={[styles.groupTitle, { color: theme.colors.onBackground }]}>Vendas e Faturamento</Text>
            <View style={styles.cardRow}>
              {renderEnhancedCard(
                'Vendas Hoje',
                dashboardData?.todaySales?.toString() || '0',
                'transações',
                'cash-register',
                '#4CAF50', // Verde para positivo
                'sales'
              )}
              {renderEnhancedCard(
                'Faturamento',
                formatCurrency(dashboardData?.todayRevenue || 0),
                'hoje',
                'currency-usd',
                '#4CAF50', // Verde para positivo
                'revenue'
              )}
            </View>
          </View>

          {/* Grupo: Caixa */}
          <View style={styles.cardGroup}>
            <Text style={[styles.groupTitle, { color: theme.colors.onBackground }]}>Saldo do Caixa</Text>
            <View style={styles.cardRow}>
              {renderEnhancedCard(
                'Saldo do Caixa',
                formatCurrency(dashboardData?.currentCashBalance || 0),
                dashboardData?.cashRegisterStatus === 'open' ? 'caixa aberto' : 'caixa fechado',
                'cash-multiple',
                dashboardData?.cashRegisterStatus === 'open' ? '#4CAF50' : '#F44336', // Verde/Vermelho
                'cash'
              )}
              {renderEnhancedCard(
                'Status do Caixa',
                dashboardData?.cashRegisterStatus === 'open' ? 'ABERTO' : 'FECHADO',
                dashboardData?.cashRegisterStatus === 'open' ? 'operacional' : 'inativo',
                dashboardData?.cashRegisterStatus === 'open' ? 'check-circle' : 'close-circle',
                dashboardData?.cashRegisterStatus === 'open' ? '#4CAF50' : '#F44336', // Verde/Vermelho
                'status'
              )}
            </View>
          </View>

          {/* Grupo: Dados Informativos */}
          <View style={styles.cardGroup}>
            <Text style={[styles.groupTitle, { color: theme.colors.onBackground }]}>Dados Informativos</Text>
            <View style={styles.cardRow}>
              {renderEnhancedCard(
                'Produtos',
                dashboardData?.totalProducts?.toString() || '0',
                'itens cadastrados',
                'package-variant',
                '#757575', // Cinza neutro
                'products'
              )}
              {renderEnhancedCard(
                'Usuários',
                dashboardData?.activeUsers?.toString() || '0',
                'usuários ativos',
                'account-group',
                '#757575', // Cinza neutro
                'users'
              )}
            </View>
          </View>
        </View>

        {/* Quick Access */}
        <View style={styles.quickAccessSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Acesso Rápido</Text>
          <View style={[styles.quickAccessGrid, isTablet && styles.quickAccessGridTablet]}>
            {quickAccessItems.map(renderQuickAccessItem)}
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={styles.chartSection}>
          {renderWeeklyChart()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  dashboardSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  lastUpdated: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  cardGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingLeft: 4,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  enhancedCard: {
    flex: 1,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  enhancedCardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  cardBody: {
    alignItems: 'flex-start',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 24,
    marginBottom: 4,
    textAlign: 'left',
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 16,
    opacity: 0.8,
  },
  quickAccessSection: {
    marginBottom: 32,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAccessGridTablet: {
    justifyContent: 'space-between',
  },
  quickAccessItem: {
    width: isTablet ? '30%' : '48%',
    minWidth: isTablet ? 150 : 120,
  },
  quickAccessItemTablet: {
    width: '15%',
    minWidth: 140,
  },
  quickAccessSurface: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  quickAccessIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickAccessTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickAccessSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  chartSection: {
    marginBottom: 16,
  },
  chartCard: {
    borderRadius: 12,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 8,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  chartBarContainer: {
    height: 80,
    width: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 10,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  chartBarValue: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default DashboardScreen;