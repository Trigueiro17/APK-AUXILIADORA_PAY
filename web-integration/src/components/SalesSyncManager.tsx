'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  RefreshCw, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Loader2,
  Upload,
  Download,
  ShoppingCart,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  Package
} from 'lucide-react';
import { syncService } from '@/lib/sync-service';
import { formatCurrency } from '@/lib/format';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingSale {
  id: string;
  cashRegisterId: string;
  cashRegisterName: string;
  total: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  paymentMethod: string;
  customerName?: string;
  createdAt: Date;
  attempts: number;
  lastError?: string;
}

interface SyncedSale {
  id: string;
  cashRegisterId: string;
  cashRegisterName: string;
  total: number;
  paymentMethod: string;
  customerName?: string;
  syncedAt: Date;
  localCreatedAt: Date;
}

interface SalesSyncStats {
  totalPending: number;
  totalSynced: number;
  totalErrors: number;
  lastSyncTime: Date;
  syncRate: number;
}

export default function SalesSyncManager() {
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [syncedSales, setSyncedSales] = useState<SyncedSale[]>([]);
  const [stats, setStats] = useState<SalesSyncStats>({
    totalPending: 0,
    totalSynced: 0,
    totalErrors: 0,
    lastSyncTime: new Date(),
    syncRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [selectedTab, setSelectedTab] = useState('pending');

  useEffect(() => {
    loadSalesData();
    
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(loadSalesData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadSalesData = async () => {
    try {
      setIsLoading(true);
      
      // Simular carregamento de dados
      const mockPendingSales: PendingSale[] = [
        {
          id: '1',
          cashRegisterId: 'cash-001',
          cashRegisterName: 'Caixa Principal',
          total: 45.90,
          items: [
            { productId: 'p1', productName: 'Produto A', quantity: 2, price: 15.45 },
            { productId: 'p2', productName: 'Produto B', quantity: 1, price: 15.00 }
          ],
          paymentMethod: 'CREDIT_CARD',
          customerName: 'João Silva',
          createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 min atrás
          attempts: 2,
          lastError: 'Timeout na conexão'
        },
        {
          id: '2',
          cashRegisterId: 'cash-002',
          cashRegisterName: 'Caixa Secundário',
          total: 23.50,
          items: [
            { productId: 'p3', productName: 'Produto C', quantity: 1, price: 23.50 }
          ],
          paymentMethod: 'PIX',
          createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 min atrás
          attempts: 1
        }
      ];
      
      const mockSyncedSales: SyncedSale[] = [
        {
          id: '3',
          cashRegisterId: 'cash-001',
          cashRegisterName: 'Caixa Principal',
          total: 67.80,
          paymentMethod: 'DEBIT_CARD',
          customerName: 'Maria Santos',
          syncedAt: new Date(Date.now() - 1000 * 60 * 10),
          localCreatedAt: new Date(Date.now() - 1000 * 60 * 12)
        },
        {
          id: '4',
          cashRegisterId: 'cash-002',
          cashRegisterName: 'Caixa Secundário',
          total: 156.90,
          paymentMethod: 'CASH',
          syncedAt: new Date(Date.now() - 1000 * 60 * 20),
          localCreatedAt: new Date(Date.now() - 1000 * 60 * 22)
        }
      ];
      
      setPendingSales(mockPendingSales);
      setSyncedSales(mockSyncedSales);
      
      setStats({
        totalPending: mockPendingSales.length,
        totalSynced: mockSyncedSales.length,
        totalErrors: mockPendingSales.filter(s => s.lastError).length,
        lastSyncTime: new Date(Date.now() - 1000 * 60 * 5),
        syncRate: 85.5
      });
      
    } catch (error) {
      console.error('Erro ao carregar dados de vendas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    
    try {
      const totalSales = pendingSales.length;
      
      for (let i = 0; i < totalSales; i++) {
        // Simular sincronização de cada venda
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSyncProgress(((i + 1) / totalSales) * 100);
      }
      
      // Recarregar dados após sincronização
      await loadSalesData();
      
    } catch (error) {
      console.error('Erro na sincronização:', error);
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  const handleRetrySale = async (saleId: string) => {
    try {
      // Simular retry de venda específica
      await syncService.retrySale(saleId);
      await loadSalesData();
    } catch (error) {
      console.error('Erro ao tentar novamente:', error);
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      'CREDIT_CARD': { variant: 'default', icon: CreditCard },
      'DEBIT_CARD': { variant: 'secondary', icon: CreditCard },
      'PIX': { variant: 'default', icon: DollarSign },
      'CASH': { variant: 'outline', icon: DollarSign }
    };
    
    const config = variants[method] || { variant: 'outline', icon: DollarSign };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="text-xs">
        <Icon className="h-3 w-3 mr-1" />
        {method.replace('_', ' ')}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalPending}</p>
              </div>
              <Upload className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sincronizadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalSynced}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Com Erro</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalErrors}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-blue-600">{stats.syncRate}%</p>
              </div>
              <Download className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de Sincronização */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Sincronização de Vendas
              </CardTitle>
              <CardDescription>
                Última sincronização: {formatDistanceToNow(stats.lastSyncTime, { addSuffix: true, locale: ptBR })}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadSalesData} disabled={isSyncing}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button onClick={handleSyncAll} disabled={isSyncing || pendingSales.length === 0}>
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Sincronizar Todas
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isSyncing && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Sincronizando vendas...</span>
                <span>{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Lista de Vendas */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <div className="p-6 pb-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pendentes ({stats.totalPending})
                </TabsTrigger>
                <TabsTrigger value="synced" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Sincronizadas ({stats.totalSynced})
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="pending" className="p-6 pt-4">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {pendingSales.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma venda pendente</p>
                    </div>
                  ) : (
                    pendingSales.map((sale) => (
                      <Card key={sale.id} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{sale.cashRegisterName}</Badge>
                                {getPaymentMethodBadge(sale.paymentMethod)}
                                {sale.lastError && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Erro
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  {formatCurrency(sale.total)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Package className="h-4 w-4" />
                                  {sale.items.length} item(s)
                                </span>
                                {sale.customerName && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {sale.customerName}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDistanceToNow(sale.createdAt, { addSuffix: true, locale: ptBR })}
                                </span>
                              </div>
                              
                              {sale.lastError && (
                                <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                  {sale.lastError}
                                </p>
                              )}
                              
                              <div className="text-xs text-muted-foreground">
                                Tentativas: {sale.attempts}
                              </div>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetrySale(sale.id)}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Tentar Novamente
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="synced" className="p-6 pt-4">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {syncedSales.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma venda sincronizada recentemente</p>
                    </div>
                  ) : (
                    syncedSales.map((sale) => (
                      <Card key={sale.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{sale.cashRegisterName}</Badge>
                              {getPaymentMethodBadge(sale.paymentMethod)}
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Sincronizada
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {formatCurrency(sale.total)}
                              </span>
                              {sale.customerName && (
                                <span className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {sale.customerName}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Criada: {formatDistanceToNow(sale.localCreatedAt, { addSuffix: true, locale: ptBR })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Upload className="h-4 w-4" />
                                Sync: {formatDistanceToNow(sale.syncedAt, { addSuffix: true, locale: ptBR })}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}