const { api, makeRequest } = require('../api');

/**
 * Serviço para gerenciar produtos
 */
class ProductsService {
  /**
   * Buscar todos os produtos
   * @param {Object} [filters] - Filtros opcionais
   * @param {boolean} [filters.active] - Filtrar por produtos ativos/inativos
   * @returns {Promise<Array>} Lista de produtos
   */
  async getProducts({ active } = {}) {
    const params = {};
    
    if (active !== undefined) {
      params.active = Boolean(active);
    }

    return makeRequest(
      () => api.get('/products', { params }),
      'Erro ao buscar produtos'
    );
  }

  /**
   * Buscar produto por ID
   * @param {string|number} id - ID do produto
   * @returns {Promise<Object>} Dados do produto
   */
  async getProductById(id) {
    if (!id) {
      throw new Error('ID do produto é obrigatório');
    }

    return makeRequest(
      () => api.get(`/products/${id}`),
      `Erro ao buscar produto com ID ${id}`
    );
  }

  /**
   * Criar novo produto
   * @param {Object} productData - Dados do produto
   * @param {string} productData.name - Nome do produto
   * @param {number} productData.price - Preço do produto
   * @param {string} [productData.description] - Descrição do produto
   * @param {string} [productData.imageUri] - URI da imagem do produto
   * @returns {Promise<Object>} Produto criado
   */
  async createProduct({ name, price, description, imageUri }) {
    // Validação dos campos obrigatórios
    if (!name || price === undefined || price === null) {
      throw new Error('Nome e preço são obrigatórios');
    }

    // Validação do preço
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      throw new Error('Preço deve ser um número válido e não negativo');
    }

    // Validação do nome
    if (name.trim().length < 2) {
      throw new Error('Nome do produto deve ter pelo menos 2 caracteres');
    }

    const productData = {
      name: name.trim(),
      price: numericPrice
    };

    // Adicionar campos opcionais se fornecidos
    if (description !== undefined && description !== null) {
      productData.description = description.trim();
    }

    if (imageUri !== undefined && imageUri !== null) {
      productData.imageUri = imageUri.trim();
    }

    return makeRequest(
      () => api.post('/products', productData),
      'Erro ao criar produto'
    );
  }

  /**
   * Atualizar produto
   * @param {string|number} id - ID do produto
   * @param {Object} updateData - Dados para atualização
   * @param {string} [updateData.name] - Nome do produto
   * @param {number} [updateData.price] - Preço do produto
   * @param {string} [updateData.description] - Descrição do produto
   * @param {string} [updateData.imageUri] - URI da imagem do produto
   * @param {boolean} [updateData.active] - Status ativo do produto
   * @returns {Promise<Object>} Produto atualizado
   */
  async updateProduct(id, { name, price, description, imageUri, active }) {
    if (!id) {
      throw new Error('ID do produto é obrigatório');
    }

    const updateData = {};

    // Adicionar apenas campos fornecidos
    if (name !== undefined) {
      if (!name.trim() || name.trim().length < 2) {
        throw new Error('Nome do produto deve ter pelo menos 2 caracteres');
      }
      updateData.name = name.trim();
    }

    if (price !== undefined && price !== null) {
      const numericPrice = Number(price);
      if (isNaN(numericPrice) || numericPrice < 0) {
        throw new Error('Preço deve ser um número válido e não negativo');
      }
      updateData.price = numericPrice;
    }

    if (description !== undefined) {
      updateData.description = description ? description.trim() : '';
    }

    if (imageUri !== undefined) {
      updateData.imageUri = imageUri ? imageUri.trim() : '';
    }

    if (active !== undefined) {
      updateData.active = Boolean(active);
    }

    // Verificar se há dados para atualizar
    if (Object.keys(updateData).length === 0) {
      throw new Error('Pelo menos um campo deve ser fornecido para atualização');
    }

    return makeRequest(
      () => api.put(`/products/${id}`, updateData),
      `Erro ao atualizar produto com ID ${id}`
    );
  }

  /**
   * Deletar produto
   * @param {string|number} id - ID do produto
   * @returns {Promise<Object>} Confirmação da exclusão
   */
  async deleteProduct(id) {
    if (!id) {
      throw new Error('ID do produto é obrigatório');
    }

    return makeRequest(
      () => api.delete(`/products/${id}`),
      `Erro ao deletar produto com ID ${id}`
    );
  }

  /**
   * Buscar produtos ativos (método de conveniência)
   * @returns {Promise<Array>} Lista de produtos ativos
   */
  async getActiveProducts() {
    return this.getProducts({ active: true });
  }

  /**
   * Buscar produtos inativos (método de conveniência)
   * @returns {Promise<Array>} Lista de produtos inativos
   */
  async getInactiveProducts() {
    return this.getProducts({ active: false });
  }

  /**
   * Ativar produto (método de conveniência)
   * @param {string|number} id - ID do produto
   * @returns {Promise<Object>} Produto ativado
   */
  async activateProduct(id) {
    return this.updateProduct(id, { active: true });
  }

  /**
   * Desativar produto (método de conveniência)
   * @param {string|number} id - ID do produto
   * @returns {Promise<Object>} Produto desativado
   */
  async deactivateProduct(id) {
    return this.updateProduct(id, { active: false });
  }
}

// Exportar instância do serviço
const productsService = new ProductsService();

module.exports = {
  ProductsService,
  productsService,
  // Exportar métodos individuais para facilitar o uso
  getProducts: productsService.getProducts.bind(productsService),
  getProductById: productsService.getProductById.bind(productsService),
  createProduct: productsService.createProduct.bind(productsService),
  updateProduct: productsService.updateProduct.bind(productsService),
  deleteProduct: productsService.deleteProduct.bind(productsService),
  getActiveProducts: productsService.getActiveProducts.bind(productsService),
  getInactiveProducts: productsService.getInactiveProducts.bind(productsService),
  activateProduct: productsService.activateProduct.bind(productsService),
  deactivateProduct: productsService.deactivateProduct.bind(productsService)
};