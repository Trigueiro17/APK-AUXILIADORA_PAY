import { NextResponse } from 'next/server';
import { auxiliadoraApiClient } from '@/lib/api-client';

export async function GET() {
  try {
    // Buscar dados reais da API externa
    const [salesResult, usersResult] = await Promise.allSettled([
      auxiliadoraApiClient.getSales(),
      auxiliadoraApiClient.getUsers()
    ]);

    const activities = [];

    // Adicionar vendas recentes como atividades
    if (salesResult.status === 'fulfilled') {
      const recentSales = salesResult.value
        .filter(sale => sale.status === 'COMPLETED')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      recentSales.forEach(sale => {
         const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
         activities.push({
           id: `sale-${sale.id}`,
           type: 'sale',
           description: `Venda realizada - R$ ${total.toFixed(2).replace('.', ',')}`,
           timestamp: sale.createdAt,
           status: 'success',
           user: sale.user?.name || 'Usuário não identificado',
           details: `${sale.items.length} item(s) - ${sale.paymentMethod}`
         });
       });
    }

    // Adicionar usuários recentes como atividades
    if (usersResult.status === 'fulfilled') {
      const recentUsers = usersResult.value
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);

      recentUsers.forEach(user => {
        const userDate = new Date(user.createdAt);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        if (userDate >= dayAgo) {
          activities.push({
            id: `user-${user.id}`,
            type: 'user',
            description: 'Novo usuário cadastrado',
            timestamp: user.createdAt,
            status: 'success',
            user: user.name,
            details: `Role: ${user.role}`
          });
        }
      });
    }

    // Adicionar atividade de sincronização
    activities.push({
      id: 'sync-latest',
      type: 'sync',
      description: 'Sincronização com API externa concluída',
      timestamp: new Date().toISOString(),
      status: 'success',
      details: `${activities.length} atividades sincronizadas`
    });

    // Ordenar por timestamp (mais recente primeiro)
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10); // Limitar a 10 atividades

    return NextResponse.json({
      success: true,
      data: sortedActivities
    });
  } catch (error) {
    console.error('Erro ao buscar atividades da API:', error);
    
    // Retornar dados de fallback em caso de erro
    const fallbackActivities = [
      {
        id: 'error-1',
        type: 'error',
        description: 'Erro na conexão com API externa',
        timestamp: new Date().toISOString(),
        status: 'error',
        details: 'Verifique a configuração da API'
      }
    ];
    
    return NextResponse.json(
      { 
        success: false, 
        data: fallbackActivities,
        error: 'Erro ao conectar com API externa' 
      },
      { status: 500 }
    );
  }
}