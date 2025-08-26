const { api, makeRequest } = require('../api');

/**
 * Serviço para gerenciar caixas registradoras
 */
class CashRegistersService {
  /**
   * Buscar todas as caixas registradoras
   * @param {Object} [filters] - Filtros opcionais
   * @param {string} [filters.status] - Filtrar por status (open, closed)
   * @param {string|number} [filters.userId] - Filtrar por ID do usuário
   * @returns {Promise<Array>} Lista de caixas registradoras
   */
  async getCashRegisters({ status, userId } = {}) {
    const params = {};
    
    if (status !== undefined) {
      params.status = status;
    }

    if (userId !== undefined) {
      params.userId = userId;
    }

    return makeRequest(
      () => api.get('/cash-registers', { params }),
      'Erro ao buscar caixas registradoras'
    );
  }

  /**
   * Buscar caixa registradora por ID
   * @param {string|number} id - ID da caixa registradora
   * @returns {Promise<Object>} Dados da caixa registradora
   */
  async getCashRegisterById(id) {
    if (!id) {
      throw new Error('ID da caixa registradora é obrigatório');
    }

    return makeRequest(
      () => api.get(`/cash-registers/${id}`),
      `Erro ao buscar caixa registradora com ID ${id}`
    );
  }

  /**
   * Criar nova caixa registradora
   * @param {Object} cashRegisterData - Dados da caixa registradora
   * @param {string|number} cashRegisterData.userId - ID do usuário responsável
   * @param {number} cashRegisterData.initialAmount - Valor inicial do caixa
   * @returns {Promise<Object>} Caixa registradora criada
   */
  async createCashRegister({ userId, initialAmount }) {
    // Validação dos campos obrigatórios
    if (!userId || initialAmount === undefined || initialAmount === null) {
      throw new Error('ID do usuário e valor inicial são obrigatórios');
    }

    // Validação do valor inicial
    const numericInitialAmount = Number(initialAmount);
    if (isNaN(numericInitialAmount) || numericInitialAmount < 0) {
      throw new Error('Valor inicial deve ser um número válido e não negativo');
    }

    const cashRegisterData = {
      userId: userId,
      initialAmount: numericInitialAmount
    };

    return makeRequest(
      () => api.post('/cash-registers', cashRegisterData),
      'Erro ao criar caixa registradora'
    );
  }

  /**
   * Atualizar caixa registradora
   * @param {string|number} id - ID da caixa registradora
   * @param {Object} updateData - Dados para atualização
   * @param {string} [updateData.status] - Status da caixa (open, closed)
   * @param {number} [updateData.currentAmount] - Valor atual do caixa
   * @param {number} [updateData.finalAmount] - Valor final do caixa (para fechamento)
   * @returns {Promise<Object>} Caixa registradora atualizada
   */
  async updateCashRegister(id, { status, currentAmount, finalAmount }) {
    if (!id) {
      throw new Error('ID da caixa registradora é obrigatório');
    }

    const updateData = {};

    // Adicionar apenas campos fornecidos
    if (status !== undefined) {
      const validStatuses = ['open', 'closed'];
      if (!validStatuses.includes(status.toLowerCase())) {
        throw new Error('Status deve ser "open" ou "closed"');
      }
      updateData.status = status.toLowerCase();
    }

    if (currentAmount !== undefined && currentAmount !== null) {
      const numericCurrentAmount = Number(currentAmount);
      if (isNaN(numericCurrentAmount) || numericCurrentAmount < 0) {
        throw new Error('Valor atual deve ser um número válido e não negativo');
      }
      updateData.currentAmount = numericCurrentAmount;
    }

    if (finalAmount !== undefined && finalAmount !== null) {
      const numericFinalAmount = Number(finalAmount);
      if (isNaN(numericFinalAmount) || numericFinalAmount < 0) {
        throw new Error('Valor final deve ser um número válido e não negativo');
      }
      updateData.finalAmount = numericFinalAmount;
    }

    // Verificar se há dados para atualizar
    if (Object.keys(updateData).length === 0) {
      throw new Error('Pelo menos um campo deve ser fornecido para atualização');
    }

    return makeRequest(
      () => api.put(`/cash-registers/${id}`, updateData),
      `Erro ao atualizar caixa registradora com ID ${id}`
    );
  }

  /**
   * Deletar caixa registradora
   * @param {string|number} id - ID da caixa registradora
   * @returns {Promise<Object>} Confirmação da exclusão
   */
  async deleteCashRegister(id) {
    if (!id) {
      throw new Error('ID da caixa registradora é obrigatório');
    }

    return makeRequest(
      () => api.delete(`/cash-registers/${id}`),
      `Erro ao deletar caixa registradora com ID ${id}`
    );
  }

  /**
   * Buscar caixas abertas (método de conveniência)
   * @param {string|number} [userId] - Filtrar por usuário específico
   * @returns {Promise<Array>} Lista de caixas abertas
   */
  async getOpenCashRegisters(userId) {
    const filters = { status: 'open' };
    if (userId) {
      filters.userId = userId;
    }
    return this.getCashRegisters(filters);
  }

  /**
   * Buscar caixas fechadas (método de conveniência)
   * @param {string|number} [userId] - Filtrar por usuário específico
   * @returns {Promise<Array>} Lista de caixas fechadas
   */
  async getClosedCashRegisters(userId) {
    const filters = { status: 'closed' };
    if (userId) {
      filters.userId = userId;
    }
    return this.getCashRegisters(filters);
  }

  /**
   * Buscar caixas de um usuário específico (método de conveniência)
   * @param {string|number} userId - ID do usuário
   * @returns {Promise<Array>} Lista de caixas do usuário
   */
  async getCashRegistersByUser(userId) {
    if (!userId) {
      throw new Error('ID do usuário é obrigatório');
    }
    return this.getCashRegisters({ userId });
  }

  /**
   * Abrir caixa (método de conveniência)
   * @param {string|number} userId - ID do usuário
   * @param {number} initialAmount - Valor inicial
   * @returns {Promise<Object>} Caixa registradora aberta
   */
  async openCashRegister(userId, initialAmount) {
    return this.createCashRegister({ userId, initialAmount });
  }

  /**
   * Fechar caixa (método de conveniência)
   * @param {string|number} id - ID da caixa registradora
   * @param {number} finalAmount - Valor final do caixa
   * @returns {Promise<Object>} Caixa registradora fechada
   */
  async closeCashRegister(id, finalAmount) {
    return this.updateCashRegister(id, {
      status: 'closed',
      finalAmount: finalAmount
    });
  }

  /**
   * Atualizar valor atual do caixa (método de conveniência)
   * @param {string|number} id - ID da caixa registradora
   * @param {number} currentAmount - Novo valor atual
   * @returns {Promise<Object>} Caixa registradora atualizada
   */
  async updateCurrentAmount(id, currentAmount) {
    return this.updateCashRegister(id, { currentAmount });
  }
}

// Exportar instância do serviço
const cashRegistersService = new CashRegistersService();

module.exports = {
  CashRegistersService,
  cashRegistersService,
  // Exportar métodos individuais para facilitar o uso
  getCashRegisters: cashRegistersService.getCashRegisters.bind(cashRegistersService),
  getCashRegisterById: cashRegistersService.getCashRegisterById.bind(cashRegistersService),
  createCashRegister: cashRegistersService.createCashRegister.bind(cashRegistersService),
  updateCashRegister: cashRegistersService.updateCashRegister.bind(cashRegistersService),
  deleteCashRegister: cashRegistersService.deleteCashRegister.bind(cashRegistersService),
  getOpenCashRegisters: cashRegistersService.getOpenCashRegisters.bind(cashRegistersService),
  getClosedCashRegisters: cashRegistersService.getClosedCashRegisters.bind(cashRegistersService),
  getCashRegistersByUser: cashRegistersService.getCashRegistersByUser.bind(cashRegistersService),
  openCashRegister: cashRegistersService.openCashRegister.bind(cashRegistersService),
  closeCashRegister: cashRegistersService.closeCashRegister.bind(cashRegistersService),
  updateCurrentAmount: cashRegistersService.updateCurrentAmount.bind(cashRegistersService)
};