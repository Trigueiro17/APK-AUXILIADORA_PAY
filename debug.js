/**
 * Arquivo de Debug para Auxiliadora Pay
 * Este arquivo contém funções úteis para depuração e desenvolvimento
 */

// Configurações de debug
const DEBUG_CONFIG = {
  enabled: __DEV__ || false,
  logLevel: 'info', // 'error', 'warn', 'info', 'debug'
  showTimestamp: true,
  showComponent: true
};

// Cores para logs no console
const LOG_COLORS = {
  error: '\x1b[31m', // Vermelho
  warn: '\x1b[33m',  // Amarelo
  info: '\x1b[36m',  // Ciano
  debug: '\x1b[35m', // Magenta
  reset: '\x1b[0m'   // Reset
};

/**
 * Logger personalizado para debug
 */
class DebugLogger {
  static log(level, component, message, data = null) {
    if (!DEBUG_CONFIG.enabled) return;
    
    const timestamp = DEBUG_CONFIG.showTimestamp ? 
      `[${new Date().toLocaleTimeString()}]` : '';
    
    const componentName = DEBUG_CONFIG.showComponent && component ? 
      `[${component}]` : '';
    
    const color = LOG_COLORS[level] || LOG_COLORS.reset;
    const resetColor = LOG_COLORS.reset;
    
    const logMessage = `${color}${timestamp}${componentName} ${message}${resetColor}`;
    
    console.log(logMessage);
    if (data) {
      console.log(data);
    }
  }
  
  static error(component, message, data) {
    this.log('error', component, `❌ ${message}`, data);
  }
  
  static warn(component, message, data) {
    this.log('warn', component, `⚠️ ${message}`, data);
  }
  
  static info(component, message, data) {
    this.log('info', component, `ℹ️ ${message}`, data);
  }
  
  static debug(component, message, data) {
    this.log('debug', component, `🐛 ${message}`, data);
  }
}

/**
 * Funções utilitárias para debug
 */
const DebugUtils = {
  /**
   * Monitora chamadas de API
   */
  logApiCall: (method, url, data = null, response = null) => {
    DebugLogger.info('API', `${method.toUpperCase()} ${url}`);
    if (data) {
      DebugLogger.debug('API', 'Request Data:', data);
    }
    if (response) {
      DebugLogger.debug('API', 'Response:', response);
    }
  },
  
  /**
   * Monitora navegação entre telas
   */
  logNavigation: (from, to, params = null) => {
    DebugLogger.info('Navigation', `${from} → ${to}`);
    if (params) {
      DebugLogger.debug('Navigation', 'Params:', params);
    }
  },
  
  /**
   * Monitora mudanças de estado
   */
  logStateChange: (component, oldState, newState) => {
    DebugLogger.info('State', `${component} state changed`);
    DebugLogger.debug('State', 'Old:', oldState);
    DebugLogger.debug('State', 'New:', newState);
  },
  
  /**
   * Monitora erros
   */
  logError: (component, error, context = null) => {
    DebugLogger.error(component, error.message || error);
    if (context) {
      DebugLogger.debug(component, 'Error Context:', context);
    }
    if (error.stack) {
      DebugLogger.debug(component, 'Stack Trace:', error.stack);
    }
  },
  
  /**
   * Monitora performance
   */
  startTimer: (label) => {
    if (DEBUG_CONFIG.enabled) {
      console.time(label);
    }
  },
  
  endTimer: (label) => {
    if (DEBUG_CONFIG.enabled) {
      console.timeEnd(label);
    }
  },
  
  /**
   * Exibe informações do dispositivo
   */
  logDeviceInfo: () => {
    const { Platform, Dimensions } = require('react-native');
    const { width, height } = Dimensions.get('window');
    
    DebugLogger.info('Device', `Platform: ${Platform.OS} ${Platform.Version}`);
    DebugLogger.info('Device', `Screen: ${width}x${height}`);
  },
  
  /**
   * Exibe informações da aplicação
   */
  logAppInfo: () => {
    const packageJson = require('./package.json');
    DebugLogger.info('App', `Version: ${packageJson.version}`);
    DebugLogger.info('App', `Environment: ${__DEV__ ? 'Development' : 'Production'}`);
  }
};

/**
 * Hook personalizado para debug em componentes React
 */
const useDebug = (componentName) => {
  const { useEffect } = require('react');
  
  useEffect(() => {
    DebugLogger.info('Component', `${componentName} mounted`);
    
    return () => {
      DebugLogger.info('Component', `${componentName} unmounted`);
    };
  }, [componentName]);
  
  return {
    log: (message, data) => DebugLogger.info(componentName, message, data),
    error: (message, data) => DebugLogger.error(componentName, message, data),
    warn: (message, data) => DebugLogger.warn(componentName, message, data),
    debug: (message, data) => DebugLogger.debug(componentName, message, data)
  };
};

/**
 * Interceptador para AsyncStorage (útil para debug)
 */
const AsyncStorageDebug = {
  getItem: async (key) => {
    try {
      const { AsyncStorage } = require('@react-native-async-storage/async-storage');
      const value = await AsyncStorage.getItem(key);
      DebugLogger.debug('AsyncStorage', `GET ${key}:`, value);
      return value;
    } catch (error) {
      DebugLogger.error('AsyncStorage', `Error getting ${key}:`, error);
      throw error;
    }
  },
  
  setItem: async (key, value) => {
    try {
      const { AsyncStorage } = require('@react-native-async-storage/async-storage');
      await AsyncStorage.setItem(key, value);
      DebugLogger.debug('AsyncStorage', `SET ${key}:`, value);
    } catch (error) {
      DebugLogger.error('AsyncStorage', `Error setting ${key}:`, error);
      throw error;
    }
  }
};

// Exportações
module.exports = {
  DEBUG_CONFIG,
  DebugLogger,
  DebugUtils,
  useDebug,
  AsyncStorageDebug
};

// Para uso global (opcional)
if (DEBUG_CONFIG.enabled) {
  global.Debug = {
    Logger: DebugLogger,
    Utils: DebugUtils
  };
  
  // Log inicial
  DebugLogger.info('Debug', '🚀 Debug mode enabled');
  DebugUtils.logAppInfo();
  DebugUtils.logDeviceInfo();
}