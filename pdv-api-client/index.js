/**
 * Exemplo de uso do cliente da API PDV Rafa
 * 
 * Este arquivo demonstra como usar todos os serviços implementados
 * para realizar operações completas no sistema PDV.
 */

// Importar todos os serviços
const { createUser, getUsers } = require('./src/services/usersService');
const { getProducts, createProduct } = require('./src/services/productsService');
const { openCashRegister, closeCashRegister, getCashRegisters } = require('./src/services/cashRegistersService');
const { createSale, completeSale, getSales } = require('./src/services/salesService');

/**
 * Função principal que demonstra o fluxo completo do sistema
 */
async function exemploCompleto() {
  console.log('🚀 Iniciando exemplo completo do sistema PDV\n');

  try {
    // 1. CRIAR USUÁRIO
    console.log('👤 1. Criando usuário...');
    const timestamp = Date.now();
    const novoUsuario = await createUser({
      email: `vendedor${timestamp}@exemplo.com`,
      name: 'João Vendedor',
      password: 'senha123456',
      role: 'USER'
    });
    console.log('✅ Usuário criado:', novoUsuario);
    console.log('');

    // 2. LISTAR PRODUTOS
    console.log('📦 2. Listando produtos disponíveis...');
    const produtos = await getProducts({ active: true });
    console.log('✅ Produtos encontrados:', produtos.length);
    
    // Se não houver produtos, criar alguns exemplos
    if (produtos.length === 0) {
      console.log('📦 Criando produtos de exemplo...');
      
      const produto1 = await createProduct({
        name: 'Coca-Cola 350ml',
        price: 4.50,
        description: 'Refrigerante Coca-Cola lata 350ml'
      });
      
      const produto2 = await createProduct({
        name: 'Pão de Açúcar',
        price: 0.75,
        description: 'Pão de açúcar tradicional'
      });
      
      console.log('✅ Produtos criados:', [produto1, produto2]);
    }
    console.log('');

    // 3. ABRIR CAIXA
    console.log('💰 3. Abrindo caixa registradora...');
    const caixaAberto = await openCashRegister(novoUsuario.id, 100.00);
    console.log('✅ Caixa aberto:', caixaAberto);
    console.log('');

    // 4. REGISTRAR VENDA
    console.log('🛒 4. Registrando venda...');
    const produtosAtualizados = await getProducts({ active: true });
    
    if (produtosAtualizados.length > 0) {
      const venda = await createSale({
        cashRegisterId: caixaAberto.id,
        userId: novoUsuario.id,
        items: [
          {
            productId: produtosAtualizados[0].id,
            quantity: 2,
            price: produtosAtualizados[0].price,
            name: produtosAtualizados[0].name
          }
        ],
        total: produtosAtualizados[0].price * 2,
        paymentMethod: 'cash'
      });
      
      console.log('✅ Venda registrada:', venda);
      
      // Completar a venda
      const vendaCompleta = await completeSale(venda.id);
      console.log('✅ Venda completada:', vendaCompleta);
    }
    console.log('');

    // 5. FECHAR CAIXA
    console.log('🔒 5. Fechando caixa registradora...');
    const caixaFechado = await closeCashRegister(caixaAberto.id, 150.00);
    console.log('✅ Caixa fechado:', caixaFechado);
    console.log('');

    console.log('🎉 Exemplo completo executado com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a execução:', error.message);
  }
}

/**
 * Exemplos individuais de cada serviço
 */
async function exemploUsuarios() {
  console.log('\n👥 === EXEMPLOS DE USUÁRIOS ===');
  
  try {
    // Listar usuários
    const usuarios = await getUsers();
    console.log('📋 Usuários cadastrados:', usuarios.length);
    
    // Criar novo usuário
    const timestamp = Date.now();
    const novoUsuario = await createUser({
      email: `usuario${timestamp}@exemplo.com`,
      name: 'Usuario Teste',
      password: 'senha123456',
      role: 'USER'
    });
    console.log('✅ Novo usuário criado:', novoUsuario.name);
    
  } catch (error) {
    console.error('❌ Erro nos usuários:', error.message);
  }
}

async function exemploProdutos() {
  console.log('\n📦 === EXEMPLOS DE PRODUTOS ===');
  
  try {
    // Listar produtos ativos
    const produtos = await getProducts({ active: true });
    console.log('📋 Produtos ativos:', produtos.length);
    
    // Criar novo produto
    const novoProduto = await createProduct({
      name: 'Água Mineral 500ml',
      price: 2.00,
      description: 'Água mineral natural 500ml'
    });
    console.log('✅ Novo produto criado:', novoProduto.name);
    
  } catch (error) {
    console.error('❌ Erro nos produtos:', error.message);
  }
}

async function exemploCaixas() {
  console.log('\n💰 === EXEMPLOS DE CAIXAS ===');
  
  try {
    // Listar caixas
    const caixas = await getCashRegisters();
    console.log('📋 Caixas registradas:', caixas.length);
    
    // Listar apenas caixas abertas
    const caixasAbertas = await getCashRegisters({ status: 'open' });
    console.log('🔓 Caixas abertas:', caixasAbertas.length);
    
  } catch (error) {
    console.error('❌ Erro nas caixas:', error.message);
  }
}

async function exemploVendas() {
  console.log('\n🛒 === EXEMPLOS DE VENDAS ===');
  
  try {
    // Listar vendas
    const vendas = await getSales();
    console.log('📋 Vendas registradas:', vendas.length);
    
    // Listar vendas completadas
    const vendasCompletas = await getSales({ status: 'completed' });
    console.log('✅ Vendas completadas:', vendasCompletas.length);
    
  } catch (error) {
    console.error('❌ Erro nas vendas:', error.message);
  }
}

/**
 * Função para executar exemplos específicos
 */
async function executarExemplos() {
  const args = process.argv.slice(2);
  const comando = args[0];
  
  switch (comando) {
    case 'completo':
      await exemploCompleto();
      break;
    case 'usuarios':
      await exemploUsuarios();
      break;
    case 'produtos':
      await exemploProdutos();
      break;
    case 'caixas':
      await exemploCaixas();
      break;
    case 'vendas':
      await exemploVendas();
      break;
    default:
      console.log('\n🎯 Cliente da API PDV Rafa');
      console.log('\nComandos disponíveis:');
      console.log('  node index.js completo   - Executa exemplo completo do fluxo');
      console.log('  node index.js usuarios   - Exemplos de operações com usuários');
      console.log('  node index.js produtos   - Exemplos de operações com produtos');
      console.log('  node index.js caixas     - Exemplos de operações com caixas');
      console.log('  node index.js vendas     - Exemplos de operações com vendas');
      console.log('\n💡 Exemplo: node index.js completo');
      break;
  }
}

// Executar se o arquivo for chamado diretamente
// Comentado para evitar execução automática que causa conflitos
// if (require.main === module) {
//   executarExemplos();
// }

// Exportar funções para uso em outros módulos
module.exports = {
  exemploCompleto,
  exemploUsuarios,
  exemploProdutos,
  exemploCaixas,
  exemploVendas
};