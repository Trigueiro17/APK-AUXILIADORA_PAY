const { api, makeRequest } = require('../api');

/**
 * Serviço para gerenciar usuários
 */
class UsersService {
  /**
   * Buscar todos os usuários
   * @returns {Promise<Array>} Lista de usuários
   */
  async getUsers() {
    return makeRequest(
      () => api.get('/users'),
      'Erro ao buscar usuários'
    );
  }

  /**
   * Buscar usuário por ID
   * @param {string|number} id - ID do usuário
   * @returns {Promise<Object>} Dados do usuário
   */
  async getUserById(id) {
    if (!id) {
      throw new Error('ID do usuário é obrigatório');
    }

    return makeRequest(
      () => api.get(`/users/${id}`),
      `Erro ao buscar usuário com ID ${id}`
    );
  }

  /**
   * Criar novo usuário
   * @param {Object} userData - Dados do usuário
   * @param {string} userData.email - Email do usuário
   * @param {string} userData.name - Nome do usuário
   * @param {string} userData.password - Senha do usuário
   * @param {string} userData.role - Papel do usuário (admin, user, etc.)
   * @returns {Promise<Object>} Usuário criado
   */
  async createUser({ email, name, password, role }) {
    // Validação dos campos obrigatórios
    if (!email || !name || !password || !role) {
      throw new Error('Email, nome, senha e papel são obrigatórios');
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email deve ter um formato válido');
    }

    // Validação de senha
    if (password.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    const userData = {
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password,
      role: role.trim()
    };

    return makeRequest(
      () => api.post('/users', userData),
      'Erro ao criar usuário'
    );
  }

  /**
   * Atualizar usuário
   * @param {string|number} id - ID do usuário
   * @param {Object} updateData - Dados para atualização
   * @param {string} [updateData.email] - Email do usuário
   * @param {string} [updateData.name] - Nome do usuário
   * @param {string} [updateData.password] - Senha do usuário
   * @param {string} [updateData.role] - Papel do usuário
   * @param {boolean} [updateData.active] - Status ativo do usuário
   * @returns {Promise<Object>} Usuário atualizado
   */
  async updateUser(id, { email, name, password, role, active }) {
    if (!id) {
      throw new Error('ID do usuário é obrigatório');
    }

    const updateData = {};

    // Adicionar apenas campos fornecidos
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Email deve ter um formato válido');
      }
      updateData.email = email.toLowerCase().trim();
    }

    if (name !== undefined) {
      if (!name.trim()) {
        throw new Error('Nome não pode estar vazio');
      }
      updateData.name = name.trim();
    }

    if (password !== undefined) {
      if (password.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres');
      }
      updateData.password = password;
    }

    if (role !== undefined) {
      updateData.role = role.toLowerCase().trim();
    }

    if (active !== undefined) {
      updateData.active = Boolean(active);
    }

    // Verificar se há dados para atualizar
    if (Object.keys(updateData).length === 0) {
      throw new Error('Pelo menos um campo deve ser fornecido para atualização');
    }

    return makeRequest(
      () => api.put(`/users/${id}`, updateData),
      `Erro ao atualizar usuário com ID ${id}`
    );
  }

  /**
   * Deletar usuário
   * @param {string|number} id - ID do usuário
   * @returns {Promise<Object>} Confirmação da exclusão
   */
  async deleteUser(id) {
    if (!id) {
      throw new Error('ID do usuário é obrigatório');
    }

    return makeRequest(
      () => api.delete(`/users/${id}`),
      `Erro ao deletar usuário com ID ${id}`
    );
  }
}

// Exportar instância do serviço
const usersService = new UsersService();

module.exports = {
  UsersService,
  usersService,
  // Exportar métodos individuais para facilitar o uso
  getUsers: usersService.getUsers.bind(usersService),
  getUserById: usersService.getUserById.bind(usersService),
  createUser: usersService.createUser.bind(usersService),
  updateUser: usersService.updateUser.bind(usersService),
  deleteUser: usersService.deleteUser.bind(usersService)
};