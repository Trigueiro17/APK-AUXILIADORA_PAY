import { NextRequest, NextResponse } from 'next/server';
import { auxiliadoraApiClient } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type'); // 'sales', 'users', 'products', 'all'
    const hours = parseInt(searchParams.get('hours') || '24'); // últimas X horas

    // Calcular período
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const activities: any[] = [];

    // Buscar vendas recentes
    if (!type || type === 'sales' || type === 'all') {
      try {
        const salesData = await auxiliadoraApiClient.getSales();
        const recentSales = salesData
          .filter(sale => new Date(sale.createdAt) >= startTime)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, type === 'sales' ? limit : Math.floor(limit * 0.6));

        recentSales.forEach(sale => {
          const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
          const timeAgo = getTimeAgo(new Date(sale.createdAt));
          
          activities.push({
            id: `sale-${sale.id}`,
            type: 'sale',
            title: 'Nova Venda Realizada',
            description: `Venda de R$ ${total.toFixed(2).replace('.', ',')} realizada`,
            details: {
              amount: total,
              items: sale.items?.length || 0,
              paymentMethod: sale.paymentMethod || 'Não informado',
              status: sale.status,
              cashRegisterId: sale.cashRegisterId
            },
            user: {
              name: sale.user?.name || 'Usuário não identificado',
              id: sale.userId
            },
            timestamp: sale.createdAt,
            timeAgo,
            status: sale.status === 'COMPLETED' ? 'success' : 
                   sale.status === 'CANCELLED' ? 'error' : 'warning',
            icon: 'shopping-cart',
            color: sale.status === 'COMPLETED' ? 'green' : 
                  sale.status === 'CANCELLED' ? 'red' : 'yellow'
          });
        });
      } catch (error) {
        console.error('Error fetching sales for activities:', error);
      }
    }

    // Buscar usuários recentes
    if (!type || type === 'users' || type === 'all') {
      try {
        const usersData = await auxiliadoraApiClient.getUsers();
        const recentUsers = usersData
          .filter(user => new Date(user.createdAt) >= startTime)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, type === 'users' ? limit : Math.floor(limit * 0.2));

        recentUsers.forEach(user => {
          const timeAgo = getTimeAgo(new Date(user.createdAt));
          
          activities.push({
            id: `user-${user.id}`,
            type: 'user',
            title: 'Novo Usuário Cadastrado',
            description: `${user.name} foi cadastrado no sistema`,
            details: {
              email: user.email,
              role: user.role || 'Não informado',
              active: user.active,
              permissions: user.permissions || []
            },
            user: {
              name: user.name,
              id: user.id
            },
            timestamp: user.createdAt,
            timeAgo,
            status: user.active ? 'success' : 'warning',
            icon: 'user-plus',
            color: user.active ? 'blue' : 'gray'
          });
        });
      } catch (error) {
        console.error('Error fetching users for activities:', error);
      }
    }

    // Buscar produtos recentes
    if (!type || type === 'products' || type === 'all') {
      try {
        const productsData = await auxiliadoraApiClient.getProducts();
        const recentProducts = productsData
          .filter(product => new Date(product.createdAt) >= startTime)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, type === 'products' ? limit : Math.floor(limit * 0.2));

        recentProducts.forEach(product => {
          const timeAgo = getTimeAgo(new Date(product.createdAt));
          const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
          
          activities.push({
            id: `product-${product.id}`,
            type: 'product',
            title: 'Novo Produto Cadastrado',
            description: `${product.name} foi adicionado ao catálogo`,
            details: {
              price: price,
              category: product.category || 'Não categorizado',
              barcode: product.barcode,
              active: product.active,
              stock: product.stock || 0
            },
            user: {
              name: 'Sistema',
              id: null
            },
            timestamp: product.createdAt,
            timeAgo,
            status: product.active ? 'success' : 'warning',
            icon: 'package',
            color: product.active ? 'purple' : 'gray'
          });
        });
      } catch (error) {
        console.error('Error fetching products for activities:', error);
      }
    }

    // Ordenar todas as atividades por timestamp e limitar
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    // Calcular estatísticas das atividades
    const stats = {
      total: sortedActivities.length,
      byType: {
        sales: sortedActivities.filter(a => a.type === 'sale').length,
        users: sortedActivities.filter(a => a.type === 'user').length,
        products: sortedActivities.filter(a => a.type === 'product').length
      },
      byStatus: {
        success: sortedActivities.filter(a => a.status === 'success').length,
        warning: sortedActivities.filter(a => a.status === 'warning').length,
        error: sortedActivities.filter(a => a.status === 'error').length
      },
      timeRange: {
        start: startTime.toISOString(),
        end: now.toISOString(),
        hours
      }
    };

    return NextResponse.json({
      activities: sortedActivities,
      stats,
      metadata: {
        limit,
        type: type || 'all',
        hours,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch recent activities',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Função auxiliar para calcular tempo decorrido
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Agora mesmo';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min atrás`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h atrás`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d atrás`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}sem atrás`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mês atrás`;
}