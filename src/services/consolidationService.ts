import { apiService } from './apiService';
import { CashSession, ConsolidatedData, Sale } from '../types';
import { AppContextType, mapApiConsolidatedDataToConsolidatedData } from '../contexts/AppContext';

export interface ConsolidationSummary {
  totalSales: number;
  totalCash: number;
  totalCard: number;
  totalPix: number;
  salesCount: number;
  openingAmount: number;
  closingAmount: number;
  netAmount: number;
  expectedAmount: number;
  difference: number;
}

export class ConsolidationService {
  /**
   * Calcula o resumo de consolidação para uma sessão de caixa
   */
  static async calculateConsolidationSummary(
    sessionId: string,
    closingAmount: number
  ): Promise<ConsolidationSummary> {
    try {
      // Buscar dados da sessão
      const session = await apiService.getCashSessionById(sessionId);
      
      // Buscar todas as vendas da sessão
      const sales = await apiService.getSales({ sessionId });
      
      // Calcular totais por método de pagamento
      const totals = sales.reduce(
        (acc, sale) => {
          acc.totalSales += sale.total;
          acc.salesCount += 1;
          
          switch (sale.paymentMethod) {
            case 'CASH':
              acc.totalCash += sale.total;
              break;
            case 'CARD':
              acc.totalCard += sale.total;
              break;
            case 'PIX':
              acc.totalPix += sale.total;
              break;
          }
          
          return acc;
        },
        {
          totalSales: 0,
          totalCash: 0,
          totalCard: 0,
          totalPix: 0,
          salesCount: 0
        }
      );
      
      // Calcular valores esperados e diferenças
      const openingAmount = session.openingAmount;
      const expectedAmount = openingAmount + totals.totalCash;
      const difference = closingAmount - expectedAmount;
      const netAmount = closingAmount - openingAmount;
      
      return {
        ...totals,
        openingAmount,
        closingAmount,
        netAmount,
        expectedAmount,
        difference
      };
    } catch (error: any) {
      console.error('Error calculating consolidation summary:', error);
      
      // Se for erro 503, 404 ou de rede, retornar resumo básico offline
      if (error?.response?.status === 503 || error?.response?.status === 404 || error?.status === 404 || error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error') || error?.message?.includes('Serviço não encontrado')) {
        console.log('API unavailable, returning basic offline consolidation summary');
        return {
          totalSales: 0,
          totalCash: 0,
          totalCard: 0,
          totalPix: 0,
          salesCount: 0,
          openingAmount: 0,
          closingAmount,
          netAmount: closingAmount,
          expectedAmount: closingAmount,
          difference: 0
        };
      }
      
      throw new Error('Erro ao calcular resumo de consolidação');
    }
  }
  
  /**
   * Consolida uma sessão de caixa
   */
  static async consolidateSession(
    sessionId: string,
    closingAmount: number
  ): Promise<ConsolidatedData> {
    try {
      // Calcular resumo de consolidação
      const summary = await this.calculateConsolidationSummary(sessionId, closingAmount);
      
      // Criar dados consolidados via API
      const consolidatedData = await apiService.consolidateCashSession(sessionId, {
        closingAmount
      });
      
      console.log('Session consolidated successfully:', {
        sessionId,
        summary,
        consolidatedData
      });
      
      return mapApiConsolidatedDataToConsolidatedData(consolidatedData);
    } catch (error: any) {
      console.error('Error consolidating session:', error);
      
      // Se for erro 503, 404 ou de rede, criar consolidação offline
      if (error?.response?.status === 503 || error?.response?.status === 404 || error?.status === 404 || error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error') || error?.message?.includes('Serviço não encontrado')) {
        console.log('API unavailable, creating offline consolidation');
        
        const offlineConsolidation: ConsolidatedData = {
          id: `offline-${sessionId}-${Date.now()}`,
          sessionId,
          userId: 'offline-user',
          totalSales: 0,
          totalCash: 0,
          totalCard: 0,
          totalPix: 0,
          salesCount: 0,
          openingAmount: 0,
          closingAmount,
          netAmount: closingAmount,
          expectedAmount: closingAmount,
          difference: 0,
          consolidatedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        return offlineConsolidation;
      }
      
      throw new Error('Erro ao consolidar sessão de caixa');
    }
  }
  
  /**
   * Valida se uma sessão pode ser consolidada
   */
  static async validateSessionForConsolidation(sessionId: string): Promise<{
    canConsolidate: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      // Verificar se a sessão existe e está ativa
      const session = await apiService.getCashSessionById(sessionId);
      
      if (session.status !== 'ACTIVE') {
        issues.push('Sessão não está ativa');
      }
      
      // Verificar se há vendas pendentes
      const sales = await apiService.getSales({ 
        sessionId, 
        status: 'PENDING' 
      });
      
      if (sales.length > 0) {
        issues.push(`Existem ${sales.length} vendas pendentes`);
      }
      
      // Verificar se há caixas abertos para o usuário
      const openCashRegisters = await apiService.getCashRegisters('OPEN', session.userId);
      
      if (openCashRegisters.length > 0) {
        issues.push('Existem caixas abertos para este usuário');
      }
      
      return {
        canConsolidate: issues.length === 0,
        issues
      };
    } catch (error: any) {
      console.error('Error validating session for consolidation:', error);
      
      // Se for erro 503, 404 ou de rede, permitir fechamento offline
      if (error?.response?.status === 503 || error?.response?.status === 404 || error?.status === 404 || error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error') || error?.message?.includes('Serviço não encontrado')) {
        console.log('API unavailable, allowing offline session closure');
        return {
          canConsolidate: true,
          issues: []
        };
      }
      
      return {
        canConsolidate: false,
        issues: ['Erro ao validar sessão para consolidação']
      };
    }
  }
  
  /**
   * Busca dados consolidados com filtros
   */
  static async getConsolidatedData(filters?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ConsolidatedData[]> {
    try {
      const apiData = await apiService.getConsolidatedData(filters);
      return apiData.map(mapApiConsolidatedDataToConsolidatedData);
    } catch (error) {
      console.error('Error fetching consolidated data:', error);
      return [];
    }
  }
  
  /**
   * Gera relatório de consolidação
   */
  static async generateConsolidationReport(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    consolidations: ConsolidatedData[];
    summary: {
      totalConsolidations: number;
      totalRevenue: number;
      totalCashHandled: number;
      averageSessionValue: number;
    };
  }> {
    try {
      const consolidations = await this.getConsolidatedData({
        userId,
        startDate,
        endDate
      });
      
      const summary = consolidations.reduce(
        (acc, consolidation) => {
          acc.totalRevenue += consolidation.totalSales;
          acc.totalCashHandled += consolidation.totalCash;
          return acc;
        },
        {
          totalConsolidations: consolidations.length,
          totalRevenue: 0,
          totalCashHandled: 0,
          averageSessionValue: 0
        }
      );
      
      summary.averageSessionValue = summary.totalConsolidations > 0 
        ? summary.totalRevenue / summary.totalConsolidations 
        : 0;
      
      return {
        consolidations,
        summary
      };
    } catch (error) {
      console.error('Error generating consolidation report:', error);
      throw new Error('Erro ao gerar relatório de consolidação');
    }
  }
}

export default ConsolidationService;