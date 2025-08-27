'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Eye, Calendar, DollarSign, ShoppingCart, TrendingUp, Loader2 } from 'lucide-react';
import { apiClient, Sale } from '@/lib/api';



export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7');
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar vendas da API
  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getSales();
      setSales(data);
    } catch (err) {
      setError('Erro ao carregar vendas');
      console.error('Erro ao carregar vendas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar vendas
  const filteredSales = sales.filter(sale => {
    // Filtrar por termo de busca
    const matchesSearch = searchTerm === '' ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.cashRegister?.id?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtrar por status
    const matchesStatus = selectedStatus === 'all' || sale.status === selectedStatus;

    // Filtrar por método de pagamento
    const matchesPayment = selectedPaymentMethod === 'all' || sale.paymentMethod === selectedPaymentMethod;

    // Filtrar por período
    const daysAgo = parseInt(dateRange);
    const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const matchesDate = new Date(sale.createdAt) >= cutoffDate;

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelada';
      case 'refunded': return 'Reembolsada';
      default: return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'credit_card': return 'Cartão de Crédito';
      case 'debit_card': return 'Cartão de Débito';
      case 'pix': return 'PIX';
      case 'cash': return 'Dinheiro';
      default: return method;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular estatísticas
  const totalSales = filteredSales.filter(s => s.status === 'COMPLETED').reduce((sum, sale) => sum + sale.total, 0);
  const totalOrders = filteredSales.length;
  const completedOrders = filteredSales.filter(s => s.status === 'COMPLETED').length;
  const averageOrderValue = completedOrders > 0 ? totalSales / completedOrders : 0;





  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              {error}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadSales}
              className="mt-2 mx-auto block"
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
          <p className="text-muted-foreground">
            Histórico e gerenciamento de vendas
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              {completedOrders} vendas concluídas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Últimos {dateRange} dias
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Por venda concluída
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Pedidos concluídos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID, cliente ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="COMPLETED">Concluída</option>
              <option value="PENDING">Pendente</option>
              <option value="CANCELLED">Cancelada</option>
              <option value="REFUNDED">Reembolsada</option>
            </select>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">Todos os pagamentos</option>
              <option value="CARD">Cartão</option>
              <option value="PIX">PIX</option>
              <option value="CASH">Dinheiro</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="365">Último ano</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de vendas */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando vendas...</span>
          </div>
        ) : filteredSales.length > 0 ? (
          filteredSales.map((sale) => (
            <Card key={sale.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">Pedido #{sale.id}</h3>
                      <Badge className={getStatusBadgeColor(sale.status)}>
                        {getStatusLabel(sale.status)}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {sale.user && <p><strong>Usuário:</strong> {sale.user.name} {sale.user.email && `(${sale.user.email})`}</p>}
                      <p><strong>Pagamento:</strong> {getPaymentMethodLabel(sale.paymentMethod)}</p>
                      <p><strong>Data:</strong> {formatDateTime(sale.createdAt)}</p>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">Itens:</p>
                      <div className="space-y-1">
                        {sale.items.map((item, index) => (
                          <div key={index} className="text-sm text-muted-foreground flex justify-between">
                            <span>{item.quantity}x {item.productName}</span>
                            <span>{formatPrice(item.quantity * item.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-bold">{formatPrice(sale.total)}</div>
                      <div className="text-sm text-muted-foreground">
                        {sale.items.reduce((sum, item) => sum + item.quantity, 0)} {sale.items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'item' : 'itens'}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                Nenhuma venda encontrada para os filtros selecionados.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}