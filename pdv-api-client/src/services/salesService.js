const { api, makeRequest } = require('../api');

/**
 * Serviço para gerenciar vendas
 */
class SalesService {
  /**
   * Buscar todas as vendas
   * @param {Object} [filters] - Filtros opcionais
   * @param {string} [filters.status] - Filtrar por status (pending, completed, cancelled)
   * @param {string|number} [filters.userId] - Filtrar por ID do usuário
   * @param {string|number} [filters.cashRegisterId] - Filtrar por ID da caixa registradora
   * @param {string} [filters.paymentMethod] - Filtrar por método de pagamento (cash, card, pix)
   * @param {string} [filters.startDate] - Data de início (formato: YYYY-MM-DD)
   * @param {string} [filters.endDate] - Data de fim (formato: YYYY-MM-DD)
   * @returns {Promise<Array>} Lista de vendas
   */
  async getSales({ status, userId, cashRegisterId, paymentMethod, startDate, endDate } = {}) {
    const params = {};
    
    if (status !== undefined) {
      params.status = status;
    }

    if (userId !== undefined) {
      params.userId = userId;
    }

    if (cashRegisterId !== undefined) {
      params.cashRegisterId = cashRegisterId;
    }

    if (paymentMethod !== undefined) {
      params.paymentMethod = paymentMethod;
    }

    if (startDate !== undefined) {
      params.startDate = startDate;
    }

    if (endDate !== undefined) {
      params.endDate = endDate;
    }

    return makeRequest(
      () => api.get('/sales', { params }),
      'Erro ao buscar vendas'
    );
  }

  /**
   * Buscar venda por ID
   * @param {string|number} id - ID da venda
   * @returns {Promise<Object>} Dados da venda
   */
  async getSaleById(id) {
    if (!id) {
      throw new Error('ID da venda é obrigatório');
    }

    return makeRequest(
      () => api.get(`/sales/${id}`),
      `Erro ao buscar venda com ID ${id}`
    );
  }

  /**
   * Criar nova venda
   * @param {Object} saleData - Dados da venda
   * @param {string|number} saleData.cashRegisterId - ID da caixa registradora
   * @param {string|number} saleData.userId - ID do usuário
   * @param {Array} saleData.items - Itens da venda
   * @param {number} saleData.total - Valor total da venda
   * @param {string} saleData.paymentMethod - Método de pagamento (cash, card, pix)
   * @param {string} [saleData.status] - Status da venda (default: pending)
   * @returns {Promise<Object>} Venda criada
   */
  async createSale({ cashRegisterId, userId, items, total, paymentMethod, status = 'pending' }) {
    // Validação dos campos obrigatórios
    if (!cashRegisterId || !userId || !items || !total || !paymentMethod) {
      throw new Error('Caixa registradora, usuário, itens, total e método de pagamento são obrigatórios');
    }

    // Validação dos itens
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Itens devem ser um array não vazio');
    }

    // Validação de cada item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productId || !item.quantity || !item.price) {
        throw new Error(`Item ${i + 1}: productId, quantity e price são obrigatórios`);
      }

      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`Item ${i + 1}: quantity deve ser um número positivo`);
      }

      if (isNaN(price) || price < 0) {
        throw new Error(`Item ${i + 1}: price deve ser um número não negativo`);
      }
    }

    // Validação do total
    const numericTotal = Number(total);
    if (isNaN(numericTotal) || numericTotal < 0) {
      throw new Error('Total deve ser um número válido e não negativo');
    }

    // Validação do método de pagamento
    const validPaymentMethods = ['cash', 'card', 'pix'];
    if (!validPaymentMethods.includes(paymentMethod.toLowerCase())) {
      throw new Error('Método de pagamento deve ser "cash", "card" ou "pix"');
    }

    // Validação do status
    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(status.toLowerCase())) {
      throw new Error('Status deve ser "pending", "completed" ou "cancelled"');
    }

    const saleData = {
      cashRegisterId,
      userId,
      items: items.map(item => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        price: Number(item.price),
        name: item.name || undefined // Nome do produto (opcional)
      })),
      total: numericTotal,
      paymentMethod: paymentMethod.toLowerCase(),
      status: status.toLowerCase()
    };

    return makeRequest(
      () => api.post('/sales', saleData),
      'Erro ao criar venda'
    );
  }

  /**
   * Atualizar venda
   * @param {string|number} id - ID da venda
   * @param {Object} updateData - Dados para atualização
   * @param {Array} [updateData.items] - Itens da venda
   * @param {number} [updateData.total] - Valor total da venda
   * @param {string} [updateData.paymentMethod] - Método de pagamento
   * @param {string} [updateData.status] - Status da venda
   * @returns {Promise<Object>} Venda atualizada
   */
  async updateSale(id, { items, total, paymentMethod, status }) {
    if (!id) {
      throw new Error('ID da venda é obrigatório');
    }

    const updateData = {};

    // Validação e adição dos itens
    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Itens devem ser um array não vazio');
      }

      // Validação de cada item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.productId || !item.quantity || !item.price) {
          throw new Error(`Item ${i + 1}: productId, quantity e price são obrigatórios`);
        }

        const quantity = Number(item.quantity);
        const price = Number(item.price);

        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`Item ${i + 1}: quantity deve ser um número positivo`);
        }

        if (isNaN(price) || price < 0) {
          throw new Error(`Item ${i + 1}: price deve ser um número não negativo`);
        }
      }

      updateData.items = items.map(item => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        price: Number(item.price),
        name: item.name || undefined
      }));
    }

    // Validação e adição do total
    if (total !== undefined && total !== null) {
      const numericTotal = Number(total);
      if (isNaN(numericTotal) || numericTotal < 0) {
        throw new Error('Total deve ser um número válido e não negativo');
      }
      updateData.total = numericTotal;
    }

    // Validação e adição do método de pagamento
    if (paymentMethod !== undefined) {
      const validPaymentMethods = ['cash', 'card', 'pix'];
      if (!validPaymentMethods.includes(paymentMethod.toLowerCase())) {
        throw new Error('Método de pagamento deve ser "cash", "card" ou "pix"');
      }
      updateData.paymentMethod = paymentMethod.toLowerCase();
    }

    // Validação e adição do status
    if (status !== undefined) {
      const validStatuses = ['pending', 'completed', 'cancelled'];
      if (!validStatuses.includes(status.toLowerCase())) {
        throw new Error('Status deve ser "pending", "completed" ou "cancelled"');
      }
      updateData.status = status.toLowerCase();
    }

    // Verificar se há dados para atualizar
    if (Object.keys(updateData).length === 0) {
      throw new Error('Pelo menos um campo deve ser fornecido para atualização');
    }

    return makeRequest(
      () => api.put(`/sales/${id}`, updateData),
      `Erro ao atualizar venda com ID ${id}`
    );
  }

  /**
   * Deletar venda
   * @param {string|number} id - ID da venda
   * @returns {Promise<Object>} Confirmação da exclusão
   */
  async deleteSale(id) {
    if (!id) {
      throw new Error('ID da venda é obrigatório');
    }

    return makeRequest(
      () => api.delete(`/sales/${id}`),
      `Erro ao deletar venda com ID ${id}`
    );
  }

  /**
   * Buscar vendas por status (método de conveniência)
   * @param {string} status - Status das vendas
   * @returns {Promise<Array>} Lista de vendas com o status especificado
   */
  async getSalesByStatus(status) {
    return this.getSales({ status });
  }

  /**
   * Buscar vendas pendentes (método de conveniência)
   * @returns {Promise<Array>} Lista de vendas pendentes
   */
  async getPendingSales() {
    return this.getSales({ status: 'pending' });
  }

  /**
   * Buscar vendas completadas (método de conveniência)
   * @returns {Promise<Array>} Lista de vendas completadas
   */
  async getCompletedSales() {
    return this.getSales({ status: 'completed' });
  }

  /**
   * Buscar vendas canceladas (método de conveniência)
   * @returns {Promise<Array>} Lista de vendas canceladas
   */
  async getCancelledSales() {
    return this.getSales({ status: 'cancelled' });
  }

  /**
   * Completar venda (método de conveniência)
   * @param {string|number} id - ID da venda
   * @returns {Promise<Object>} Venda completada
   */
  async completeSale(id) {
    return this.updateSale(id, { status: 'completed' });
  }

  /**
   * Cancelar venda (método de conveniência)
   * @param {string|number} id - ID da venda
   * @returns {Promise<Object>} Venda cancelada
   */
  async cancelSale(id) {
    return this.updateSale(id, { status: 'cancelled' });
  }

  /**
   * Buscar vendas por período (método de conveniência)
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @returns {Promise<Array>} Lista de vendas no período
   */
  async getSalesByPeriod(startDate, endDate) {
    return this.getSales({ startDate, endDate });
  }

  /**
   * Buscar vendas de um usuário (método de conveniência)
   * @param {string|number} userId - ID do usuário
   * @returns {Promise<Array>} Lista de vendas do usuário
   */
  async getSalesByUser(userId) {
    if (!userId) {
      throw new Error('ID do usuário é obrigatório');
    }
    return this.getSales({ userId });
  }

  /**
   * Buscar vendas de uma caixa registradora (método de conveniência)
   * @param {string|number} cashRegisterId - ID da caixa registradora
   * @returns {Promise<Array>} Lista de vendas da caixa
   */
  async getSalesByCashRegister(cashRegisterId) {
    if (!cashRegisterId) {
      throw new Error('ID da caixa registradora é obrigatório');
    }
    return this.getSales({ cashRegisterId });
  }
}

// Exportar instância do serviço
const salesService = new SalesService();

module.exports = {
  SalesService,
  salesService,
  // Exportar métodos individuais para facilitar o uso
  getSales: salesService.getSales.bind(salesService),
  getSaleById: salesService.getSaleById.bind(salesService),
  createSale: salesService.createSale.bind(salesService),
  updateSale: salesService.updateSale.bind(salesService),
  deleteSale: salesService.deleteSale.bind(salesService),
  getSalesByStatus: salesService.getSalesByStatus.bind(salesService),
  getPendingSales: salesService.getPendingSales.bind(salesService),
  getCompletedSales: salesService.getCompletedSales.bind(salesService),
  getCancelledSales: salesService.getCancelledSales.bind(salesService),
  completeSale: salesService.completeSale.bind(salesService),
  cancelSale: salesService.cancelSale.bind(salesService),
  getSalesByPeriod: salesService.getSalesByPeriod.bind(salesService),
  getSalesByUser: salesService.getSalesByUser.bind(salesService),
  getSalesByCashRegister: salesService.getSalesByCashRegister.bind(salesService)
};