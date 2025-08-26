const axios = require('axios');

// Configuração base da API
const api = axios.create({
  baseURL: 'https://www.auxiliadorapay.shop/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para requisições
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 Fazendo requisição: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Erro na requisição:', error.message);
    return Promise.reject(error);
  }
);

// Interceptor para respostas
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Resposta recebida: ${response.status} ${response.statusText}`);
    return response;
  },
  (error) => {
    console.error('❌ Erro na resposta:', handleApiError(error));
    return Promise.reject(error);
  }
);

// Função para tratar erros da API
function handleApiError(error) {
  if (error.response) {
    // Erro de resposta do servidor (4xx, 5xx)
    const { status, data } = error.response;
    switch (status) {
      case 400:
        return `Requisição inválida: ${data.message || 'Dados fornecidos são inválidos'}`;
      case 401:
        return 'Não autorizado: Verifique suas credenciais';
      case 403:
        return 'Acesso negado: Você não tem permissão para esta operação';
      case 404:
        return 'Recurso não encontrado';
      case 422:
        return `Erro de validação: ${data.message || 'Dados não puderam ser processados'}`;
      case 500:
        return 'Erro interno do servidor: Tente novamente mais tarde';
      default:
        return `Erro ${status}: ${data.message || 'Erro desconhecido'}`;
    }
  } else if (error.request) {
    // Erro de rede ou timeout
    return 'Erro de conexão: Verifique sua internet ou se o servidor está disponível';
  } else {
    // Erro na configuração da requisição
    return `Erro na configuração: ${error.message}`;
  }
}

// Função auxiliar para fazer requisições com tratamento de erro
async function makeRequest(requestFn, errorContext = '') {
  try {
    const response = await requestFn();
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error(`❌ ${errorContext}: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

module.exports = {
  api,
  makeRequest,
  handleApiError
};