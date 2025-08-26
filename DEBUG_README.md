# Sistema de Debug - Auxiliadora Pay

Este documento explica como usar o sistema de debug implementado na aplicação Auxiliadora Pay.

## Arquivos de Debug

- `debug.js` - Sistema principal de debug com logger personalizado e utilitários

## Como Usar

### 1. Importando o Sistema de Debug

```javascript
// Importar o sistema completo
const { DebugLogger, DebugUtils, useDebug } = require('./debug');

// Ou importar componentes específicos
const { DebugLogger } = require('./debug');
```

### 2. Usando o Logger

```javascript
// Logs básicos
DebugLogger.info('ComponentName', 'Mensagem informativa');
DebugLogger.error('ComponentName', 'Erro ocorreu', errorObject);
DebugLogger.warn('ComponentName', 'Aviso importante');
DebugLogger.debug('ComponentName', 'Informação de debug', data);
```

### 3. Usando Utilitários

```javascript
// Monitorar chamadas de API
DebugUtils.logApiCall('POST', '/api/login', { email: 'user@email.com' });

// Monitorar navegação
DebugUtils.logNavigation('LoginScreen', 'HomeScreen', { userId: 123 });

// Monitorar mudanças de estado
DebugUtils.logStateChange('LoginScreen', oldState, newState);

// Monitorar erros
DebugUtils.logError('LoginScreen', error, { context: 'during login' });

// Medir performance
DebugUtils.startTimer('login-process');
// ... código a ser medido ...
DebugUtils.endTimer('login-process');
```

### 4. Hook para Componentes React

```javascript
import React from 'react';
const { useDebug } = require('../debug');

const LoginScreen = () => {
  const debug = useDebug('LoginScreen');
  
  const handleLogin = () => {
    debug.log('Iniciando processo de login');
    try {
      // lógica de login
      debug.log('Login realizado com sucesso');
    } catch (error) {
      debug.error('Erro no login', error);
    }
  };
  
  return (
    // JSX do componente
  );
};
```

### 5. Debug de AsyncStorage

```javascript
const { AsyncStorageDebug } = require('./debug');

// Usar no lugar do AsyncStorage normal
const userData = await AsyncStorageDebug.getItem('user_data');
await AsyncStorageDebug.setItem('user_data', JSON.stringify(data));
```

## Configuração

O debug pode ser configurado editando o objeto `DEBUG_CONFIG` no arquivo `debug.js`:

```javascript
const DEBUG_CONFIG = {
  enabled: __DEV__ || false,     // Ativar/desativar debug
  logLevel: 'info',              // Nível mínimo de log
  showTimestamp: true,           // Mostrar timestamp nos logs
  showComponent: true            // Mostrar nome do componente
};
```

## Níveis de Log

1. **error** - Erros críticos
2. **warn** - Avisos importantes
3. **info** - Informações gerais
4. **debug** - Informações detalhadas de debug

## Exemplos Práticos

### Exemplo 1: Debug em LoginScreen

```javascript
// LoginScreen.tsx
const { DebugLogger, DebugUtils } = require('../debug');

const LoginScreen = () => {
  const handleLogin = async (email, password) => {
    DebugUtils.startTimer('login-process');
    
    try {
      DebugLogger.info('LoginScreen', 'Iniciando login', { email });
      
      const response = await apiService.login(email, password);
      DebugUtils.logApiCall('POST', '/login', { email }, response);
      
      DebugLogger.info('LoginScreen', 'Login bem-sucedido');
      DebugUtils.logNavigation('LoginScreen', 'HomeScreen');
      
    } catch (error) {
      DebugUtils.logError('LoginScreen', error, { email });
    } finally {
      DebugUtils.endTimer('login-process');
    }
  };
};
```

### Exemplo 2: Debug em ApiService

```javascript
// apiService.ts
const { DebugLogger, DebugUtils } = require('../debug');

class ApiService {
  async makeRequest(method, endpoint, data) {
    try {
      DebugUtils.logApiCall(method, endpoint, data);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      DebugUtils.logApiCall(method, endpoint, data, result);
      
      return result;
    } catch (error) {
      DebugUtils.logError('ApiService', error, { method, endpoint, data });
      throw error;
    }
  }
}
```

## Dicas

1. **Desenvolvimento**: Mantenha `DEBUG_CONFIG.enabled = true` durante desenvolvimento
2. **Produção**: O debug é automaticamente desabilitado em builds de produção
3. **Performance**: Use `startTimer` e `endTimer` para identificar gargalos
4. **Organização**: Use nomes de componentes consistentes nos logs
5. **Dados Sensíveis**: Evite logar senhas ou informações sensíveis

## Acesso Global

Quando o debug está habilitado, você pode acessar as funções globalmente:

```javascript
// Disponível globalmente quando debug está ativo
Debug.Logger.info('Test', 'Mensagem de teste');
Debug.Utils.logApiCall('GET', '/test');
```

Este sistema de debug ajudará no desenvolvimento e na identificação de problemas na aplicação Auxiliadora Pay.