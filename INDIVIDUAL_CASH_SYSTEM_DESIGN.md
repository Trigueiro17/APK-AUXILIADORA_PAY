# Sistema de Caixas Individuais por Perfil - Design

## Visão Geral
Este documento descreve o design para implementar um sistema onde cada perfil de usuário tenha seu próprio caixa individual, com isolamento completo de dados e consolidação ao fechar o caixa.

## Análise da Estrutura Atual

### Estado Atual
- **AppContext**: Gerencia um único `currentCashRegister` global
- **CashRegister**: Relacionado a um usuário via `userId`
- **Sales**: Vinculadas a um `cashRegisterId` específico
- **Isolamento**: Atualmente não há isolamento real entre usuários

### Problemas Identificados
1. Múltiplos usuários podem ver dados de caixas de outros usuários
2. Não há separação clara entre sessões de caixa de diferentes usuários
3. Falta de consolidação automática ao fechar caixa

## Design Proposto

### 1. Modificações no Banco de Dados

#### Nova Tabela: `CashSession`
```prisma
model CashSession {
  id            String            @id @default(cuid())
  userId        String
  sessionName   String            // Ex: "Caixa João - 26/01/2025"
  openingAmount Decimal           @db.Decimal(10, 2)
  closingAmount Decimal?          @db.Decimal(10, 2)
  status        CashSessionStatus @default(ACTIVE)
  openedAt      DateTime          @default(now())
  closedAt      DateTime?
  notes         String?
  isConsolidated Boolean          @default(false)
  
  // Relacionamentos
  user          User              @relation(fields: [userId], references: [id])
  cashRegisters CashRegister[]
  
  @@map("cash_sessions")
}

enum CashSessionStatus {
  ACTIVE
  CLOSED
  CONSOLIDATED
}
```

#### Modificações na Tabela `CashRegister`
```prisma
model CashRegister {
  id              String            @id @default(cuid())
  userId          String
  cashSessionId   String            // Nova relação
  openingAmount   Decimal           @db.Decimal(10, 2)
  closingAmount   Decimal?          @db.Decimal(10, 2)
  status          CashRegisterStatus @default(OPEN)
  openedAt        DateTime          @default(now())
  closedAt        DateTime?
  notes           String?
  
  // Relacionamentos
  user            User              @relation(fields: [userId], references: [id])
  cashSession     CashSession       @relation(fields: [cashSessionId], references: [id])
  sales           Sale[]
  
  @@map("cash_registers")
}
```

#### Nova Tabela: `ConsolidatedData`
```prisma
model ConsolidatedData {
  id              String    @id @default(cuid())
  cashSessionId   String    @unique
  userId          String
  totalSales      Decimal   @db.Decimal(10, 2)
  totalCash       Decimal   @db.Decimal(10, 2)
  totalCard       Decimal   @db.Decimal(10, 2)
  totalPix        Decimal   @db.Decimal(10, 2)
  salesCount      Int
  openingAmount   Decimal   @db.Decimal(10, 2)
  closingAmount   Decimal   @db.Decimal(10, 2)
  consolidatedAt  DateTime  @default(now())
  
  // Relacionamentos
  cashSession     CashSession @relation(fields: [cashSessionId], references: [id])
  user            User        @relation(fields: [userId], references: [id])
  
  @@map("consolidated_data")
}
```

### 2. Modificações no AppContext

#### Novo Estado
```typescript
interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  products: Product[];
  users: User[];
  currentCashSession: CashSession | null;  // Substitui currentCashRegister
  userCashRegisters: CashRegister[];       // Caixas do usuário atual
  cart: CartItem[];
  sales: Sale[];                           // Apenas vendas do usuário atual
  loading: boolean;
  error: string | null;
  cashRegisterOperationInProgress: boolean;
  isInitializing: boolean;
}
```

#### Novas Ações
```typescript
type AppAction =
  | { type: 'SET_CASH_SESSION'; payload: CashSession | null }
  | { type: 'SET_USER_CASH_REGISTERS'; payload: CashRegister[] }
  | { type: 'ADD_USER_CASH_REGISTER'; payload: CashRegister }
  | { type: 'UPDATE_USER_CASH_REGISTER'; payload: CashRegister }
  | { type: 'SET_USER_SALES'; payload: Sale[] }
  | { type: 'CONSOLIDATE_CASH_SESSION'; payload: ConsolidatedData }
  // ... outras ações existentes
```

### 3. Novas Funções de Contexto

#### Gerenciamento de Sessão de Caixa
```typescript
// Abrir nova sessão de caixa para o usuário
const openCashSession = async (openingAmount: number, sessionName?: string): Promise<CashSession>

// Fechar sessão de caixa e consolidar dados
const closeCashSession = async (sessionId: string, closingAmount: number): Promise<ConsolidatedData>

// Carregar sessão ativa do usuário
const loadUserActiveCashSession = async (): Promise<CashSession | null>

// Carregar caixas da sessão atual
const loadSessionCashRegisters = async (sessionId: string): Promise<CashRegister[]>

// Carregar vendas da sessão atual
const loadSessionSales = async (sessionId: string): Promise<Sale[]>
```

#### Isolamento de Dados
```typescript
// Filtrar dados apenas do usuário atual
const filterUserData = (data: any[], userId: string) => {
  return data.filter(item => item.userId === userId);
};

// Verificar se usuário tem acesso aos dados
const hasAccessToData = (dataUserId: string, currentUserId: string): boolean => {
  return dataUserId === currentUserId;
};
```

### 4. Processo de Consolidação

#### Ao Fechar Sessão de Caixa
1. **Calcular Totais**:
   - Somar todas as vendas da sessão
   - Agrupar por método de pagamento
   - Calcular diferença entre abertura e fechamento

2. **Criar Registro Consolidado**:
   - Salvar dados consolidados na tabela `ConsolidatedData`
   - Marcar sessão como `CONSOLIDATED`
   - Manter dados originais para auditoria

3. **Atualizar Estado**:
   - Limpar `currentCashSession`
   - Limpar `userCashRegisters`
   - Limpar carrinho e vendas temporárias

### 5. Modificações na UI

#### Dashboard
- Mostrar apenas dados da sessão ativa do usuário
- Exibir nome da sessão de caixa
- Mostrar status da sessão (ATIVA/FECHADA)

#### Tela de Caixa
- Listar apenas caixas da sessão atual
- Mostrar totais isolados por usuário
- Botão para fechar sessão com consolidação

#### Relatórios
- Filtrar automaticamente por usuário
- Opção para visualizar dados consolidados
- Histórico de sessões do usuário

### 6. Segurança e Validações

#### Middleware de Autorização
```typescript
const validateUserAccess = (resourceUserId: string, currentUserId: string) => {
  if (resourceUserId !== currentUserId) {
    throw new Error('Acesso negado: Usuário não tem permissão para acessar estes dados');
  }
};
```

#### Validações de Negócio
- Usuário só pode ter uma sessão ativa por vez
- Não permitir acesso a dados de outros usuários
- Validar integridade dos dados antes da consolidação

## Benefícios do Design

1. **Isolamento Completo**: Cada usuário vê apenas seus próprios dados
2. **Integridade**: Consolidação automática garante consistência
3. **Auditoria**: Dados originais preservados para rastreabilidade
4. **Escalabilidade**: Sistema suporta múltiplos usuários simultâneos
5. **Flexibilidade**: Sessões nomeadas permitem melhor organização

## Próximos Passos

1. Atualizar schema do banco de dados
2. Implementar novas funções no AppContext
3. Modificar componentes de UI
4. Implementar middleware de segurança
5. Criar testes para validar isolamento
6. Documentar processo de migração de dados existentes