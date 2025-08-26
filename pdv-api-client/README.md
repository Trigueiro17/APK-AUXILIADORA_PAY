# PDV Rafa API Client

Cliente Node.js para consumir a API do sistema PDV Rafa. Este projeto fornece uma interface organizada e fácil de usar para todas as operações do sistema de ponto de venda.

## 🚀 Instalação

```bash
# Clone ou baixe o projeto
cd pdv-api-client

# Instale as dependências
npm install
```

## 📁 Estrutura do Projeto

```
pdv-api-client/
├── src/
│   ├── api.js                 # Configuração base do Axios
│   └── services/
│       ├── usersService.js         # Operações de usuários
│       ├── productsService.js      # Operações de produtos
│       ├── cashRegistersService.js # Operações de caixas
│       └── salesService.js         # Operações de vendas
├── index.js                   # Exemplos de uso
├── package.json
└── README.md
```

## 🔧 Configuração

O projeto está configurado para usar a API em:
```
https://www.auxiliadorapay.shop/api
```

Para alterar a URL base, edite o arquivo `src/api.js`.

## 📚 Serviços Disponíveis

### 👥 Usuários (`usersService.js`)

```javascript
const { getUsers, getUserById, createUser, updateUser, deleteUser } = require('./src/services/usersService');

// Listar todos os usuários
const usuarios = await getUsers();

// Buscar usuário por ID
const usuario = await getUserById(1);

// Criar novo usuário
const novoUsuario = await createUser({
  email: 'usuario@exemplo.com',
  name: 'Nome do Usuário',
  password: 'senha123',
  role: 'vendedor' // ou 'admin'
});

// Atualizar usuário
const usuarioAtualizado = await updateUser(1, {
  name: 'Novo Nome',
  active: true
});

// Deletar usuário
await deleteUser(1);
```

### 📦 Produtos (`productsService.js`)

```javascript
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('./src/services/productsService');

// Listar produtos (opcionalmente filtrar por ativos)
const produtos = await getProducts({ active: true });

// Buscar produto por ID
const produto = await getProductById(1);

// Criar novo produto
const novoProduto = await createProduct({
  name: 'Nome do Produto',
  price: 10.50,
  description: 'Descrição do produto',
  imageUri: 'https://exemplo.com/imagem.jpg'
});

// Atualizar produto
const produtoAtualizado = await updateProduct(1, {
  price: 12.00,
  active: true
});

// Deletar produto
await deleteProduct(1);
```

### 💰 Caixas Registradoras (`cashRegistersService.js`)

```javascript
const { getCashRegisters, openCashRegister, closeCashRegister, updateCurrentAmount } = require('./src/services/cashRegistersService');

// Listar caixas (opcionalmente filtrar por status ou usuário)
const caixas = await getCashRegisters({ status: 'open', userId: 1 });

// Abrir caixa
const caixaAberto = await openCashRegister(1, 100.00); // userId, valor inicial

// Fechar caixa
const caixaFechado = await closeCashRegister(1, 250.00); // caixaId, valor final

// Atualizar valor atual do caixa
const caixaAtualizado = await updateCurrentAmount(1, 150.00);
```

### 🛒 Vendas (`salesService.js`)

```javascript
const { getSales, createSale, completeSale, cancelSale } = require('./src/services/salesService');

// Listar vendas (com filtros opcionais)
const vendas = await getSales({
  status: 'completed',
  userId: 1,
  cashRegisterId: 1,
  paymentMethod: 'cash',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Criar nova venda
const novaVenda = await createSale({
  cashRegisterId: 1,
  userId: 1,
  items: [
    {
      productId: 1,
      quantity: 2,
      price: 10.50,
      name: 'Produto Exemplo'
    }
  ],
  total: 21.00,
  paymentMethod: 'cash' // 'cash', 'card', 'pix'
});

// Completar venda
const vendaCompleta = await completeSale(1);

// Cancelar venda
const vendaCancelada = await cancelSale(1);
```

## 🎯 Exemplos de Uso

O arquivo `index.js` contém exemplos práticos de como usar todos os serviços:

```bash
# Executar exemplo completo (fluxo completo do sistema)
node index.js completo

# Exemplos específicos
node index.js usuarios   # Operações com usuários
node index.js produtos   # Operações com produtos
node index.js caixas     # Operações com caixas
node index.js vendas     # Operações com vendas
```

### Exemplo de Fluxo Completo

```javascript
const exemploCompleto = async () => {
  // 1. Criar usuário
  const usuario = await createUser({
    email: 'vendedor@exemplo.com',
    name: 'João Vendedor',
    password: 'senha123',
    role: 'vendedor'
  });

  // 2. Listar produtos
  const produtos = await getProducts({ active: true });

  // 3. Abrir caixa
  const caixa = await openCashRegister(usuario.id, 100.00);

  // 4. Registrar venda
  const venda = await createSale({
    cashRegisterId: caixa.id,
    userId: usuario.id,
    items: [{
      productId: produtos[0].id,
      quantity: 2,
      price: produtos[0].price,
      name: produtos[0].name
    }],
    total: produtos[0].price * 2,
    paymentMethod: 'cash'
  });

  // 5. Completar venda
  await completeSale(venda.id);

  // 6. Fechar caixa
  await closeCashRegister(caixa.id, 150.00);
};
```

## 🛡️ Tratamento de Erros

Todos os serviços incluem tratamento de erros com mensagens amigáveis:

```javascript
try {
  const usuario = await createUser(userData);
  console.log('Usuário criado:', usuario);
} catch (error) {
  console.error('Erro ao criar usuário:', error.message);
}
```

## 📋 Validações

Cada serviço inclui validações de entrada:

- **Usuários**: Email válido, nome obrigatório, senha mínima, role válido
- **Produtos**: Nome obrigatório, preço positivo
- **Caixas**: User ID obrigatório, valores numéricos
- **Vendas**: Itens válidos, total positivo, método de pagamento válido

## 🔄 Métodos de Conveniência

Além dos métodos CRUD básicos, cada serviço inclui métodos de conveniência:

- **Produtos**: `activateProduct()`, `deactivateProduct()`, `getActiveProducts()`
- **Caixas**: `openCashRegister()`, `closeCashRegister()`, `getOpenCashRegisters()`
- **Vendas**: `completeSale()`, `cancelSale()`, `getSalesByPeriod()`

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação da API PDV Rafa
2. Confira os exemplos no arquivo `index.js`
3. Verifique os logs de erro para mais detalhes

## 🔧 Desenvolvimento

```bash
# Executar em modo de desenvolvimento
npm run dev

# Executar testes (quando implementados)
npm test
```

---

**Desenvolvido para consumir a API PDV Rafa de forma simples e eficiente.**