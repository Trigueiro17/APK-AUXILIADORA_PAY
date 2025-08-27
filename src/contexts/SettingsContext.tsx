import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { remoteSettingsService } from '../services/remoteSettingsService';
import { ApiSettings } from '../services/apiService';
import { useAppContext } from './AppContext';
import { PrinterConfig } from '../services/printService';

interface SettingsState {
  darkMode: boolean;
  notifications: boolean;
  autoBackup: boolean;
  language: string;
  nfcEnabled: boolean;
  hideHistoryEnabled: boolean;
  bluetoothEnabled: boolean;
  printerConfig?: {
    type: string;
    name: string;
    address?: string;
    isConnected: boolean;
  };
}

interface SettingsContextType {
  settings: SettingsState;
  updateSetting: (key: keyof SettingsState, value: any) => void;
  updatePrinterConfig: (printerConfig: PrinterConfig) => Promise<void>;
  resetSettings: () => void;
  syncSettings: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  setOfflineMode: (offline: boolean) => void;
  setAutoSync: (enabled: boolean) => void;
  isOfflineMode: () => boolean;
  getOfflineQueueStatus: () => Promise<{ count: number; items: any[] }>;
}

type SettingsAction = 
  | { type: 'SET_SETTING'; key: keyof SettingsState; value: any }
  | { type: 'LOAD_SETTINGS'; settings: SettingsState }
  | { type: 'RESET_SETTINGS' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null };

const defaultSettings: SettingsState = {
  darkMode: false,
  notifications: true,
  autoBackup: false,
  language: 'pt-BR',
  nfcEnabled: true,
  hideHistoryEnabled: false,
  bluetoothEnabled: false,
};

// Utility functions for printer config conversion
const convertPrinterConfigToApi = (printerConfig: PrinterConfig) => {
  return {
    type: printerConfig.type,
    name: printerConfig.deviceName || printerConfig.type,
    address: printerConfig.macAddress,
    isConnected: printerConfig.isConnected,
  };
};

const convertApiToPrinterConfig = (apiConfig: any): PrinterConfig | undefined => {
  if (!apiConfig) return undefined;
  
  return {
    type: apiConfig.type as any,
    deviceName: apiConfig.name,
    macAddress: apiConfig.address,
    isConnected: apiConfig.isConnected,
  };
};

interface SettingsReducerState extends SettingsState {
  isLoading: boolean;
  error: string | null;
}

const defaultReducerState: SettingsReducerState = {
  ...defaultSettings,
  isLoading: false,
  error: null,
};

const settingsReducer = (state: SettingsReducerState, action: SettingsAction): SettingsReducerState => {
  switch (action.type) {
    case 'SET_SETTING':
      return {
        ...state,
        [action.key]: action.value,
        error: null,
      };
    case 'LOAD_SETTINGS':
      return {
        ...state,
        ...action.settings,
        isLoading: false,
        error: null,
      };
    case 'RESET_SETTINGS':
      return {
        ...defaultReducerState,
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.loading,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        isLoading: false,
      };
    default:
      return state;
  }
};

// Helper function to convert ApiSettings to SettingsState
const mapApiSettingsToState = (apiSettings: ApiSettings): SettingsState => ({
  darkMode: apiSettings.darkMode,
  notifications: apiSettings.notifications,
  autoBackup: apiSettings.autoBackup,
  language: apiSettings.language,
  nfcEnabled: apiSettings.nfcEnabled,
  hideHistoryEnabled: apiSettings.hideHistoryEnabled,
  bluetoothEnabled: apiSettings.bluetoothEnabled,
  printerConfig: apiSettings.printerConfig,
});

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(settingsReducer, defaultReducerState);
  const { state: appState } = useAppContext();

  // Carregar configurações remotas
  useEffect(() => {
    loadSettings();
  }, [appState.user?.id]);

  const loadSettings = async () => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      const userId = appState.user?.id;
      const apiSettings = await remoteSettingsService.getSettings(userId);
      const mappedSettings = mapApiSettingsToState(apiSettings);
      
      // Se não há configuração de impressora, tentar definir uma ESC/POS como padrão
      if (!mappedSettings.printerConfig) {
        try {
          const { printService } = require('../services/printService');
          const availablePrinters = await printService.getAvailablePrinters();
          const escPosPrinter = availablePrinters.find((printer: any) => 
            printer.type === 'mini_thermal_58mm' || printer.type === 'mpt_ii_pos_mini_58mm'
          );
          
          if (escPosPrinter) {
            const defaultPrinterConfig = convertPrinterConfigToApi(escPosPrinter);
            mappedSettings.printerConfig = defaultPrinterConfig;
            
            // Salvar a configuração padrão
            const updateData = { printerConfig: defaultPrinterConfig };
            await remoteSettingsService.updateSettings(userId, updateData);
            console.log('Impressora ESC/POS definida como padrão:', escPosPrinter.deviceName);
          }
        } catch (printerError) {
          console.warn('Erro ao definir impressora padrão:', printerError);
          // Continua sem impressora padrão se houver erro
        }
      }
      
      dispatch({ type: 'LOAD_SETTINGS', settings: mappedSettings });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      dispatch({ type: 'SET_ERROR', error: 'Erro ao carregar configurações' });
    }
  };

  const updateSetting = async (key: keyof SettingsState, value: any) => {
    try {
      // Update local state immediately for better UX
      dispatch({ type: 'SET_SETTING', key, value });
      
      // Update remote settings
      const userId = appState.user?.id;
      const updateData = { [key]: value };
      await remoteSettingsService.updateSettings(userId, updateData);
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      dispatch({ type: 'SET_ERROR', error: 'Erro ao salvar configuração' });
      // Reload settings to revert local changes
      await loadSettings();
    }
  };

  const updatePrinterConfig = async (printerConfig: PrinterConfig) => {
    try {
      // Convert PrinterConfig to API format
      const apiPrinterConfig = convertPrinterConfigToApi(printerConfig);
      
      // Update local state immediately for better UX
      dispatch({ type: 'SET_SETTING', key: 'printerConfig', value: apiPrinterConfig });
      
      // Update remote settings
      const userId = appState.user?.id;
      const updateData = { printerConfig: apiPrinterConfig };
      await remoteSettingsService.updateSettings(userId, updateData);
    } catch (error) {
      console.error('Erro ao atualizar configuração da impressora:', error);
      dispatch({ type: 'SET_ERROR', error: 'Erro ao salvar configuração da impressora' });
      // Reload settings to revert local changes
      await loadSettings();
      throw error;
    }
  };

  const resetSettings = async () => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      const userId = appState.user?.id;
      await remoteSettingsService.updateSettings(userId, defaultSettings);
      dispatch({ type: 'RESET_SETTINGS' });
    } catch (error) {
      console.error('Erro ao resetar configurações:', error);
      dispatch({ type: 'SET_ERROR', error: 'Erro ao resetar configurações' });
    }
  };

  const syncSettings = async () => {
    const userId = appState.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }

    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      
      // Check if we're in offline mode
      if (remoteSettingsService.isOfflineMode()) {
        throw new Error('Modo offline ativado');
      }
      
      const apiSettings = await remoteSettingsService.syncWithRemote(userId);
      const mappedSettings = mapApiSettingsToState(apiSettings);
      dispatch({ type: 'LOAD_SETTINGS', settings: mappedSettings });
    } catch (error) {
      console.error('Erro ao sincronizar configurações:', error);
      dispatch({ type: 'SET_ERROR', error: 'Erro ao sincronizar configurações' });
      throw error;
    }
  };

  const setOfflineMode = (offline: boolean) => {
    remoteSettingsService.setOfflineMode(offline);
  };

  const setAutoSync = (enabled: boolean) => {
    remoteSettingsService.setAutoSync(enabled);
  };

  const isOfflineMode = () => {
    return remoteSettingsService.isOfflineMode();
  };

  const getOfflineQueueStatus = async () => {
    return await remoteSettingsService.getOfflineQueueStatus();
  };

  const contextValue: SettingsContextType = {
    settings: {
      darkMode: state.darkMode,
      notifications: state.notifications,
      autoBackup: state.autoBackup,
      language: state.language,
      nfcEnabled: state.nfcEnabled,
      hideHistoryEnabled: state.hideHistoryEnabled,
      bluetoothEnabled: state.bluetoothEnabled,
      printerConfig: state.printerConfig,
    },
    updateSetting,
    updatePrinterConfig,
    resetSettings,
    syncSettings,
    isLoading: state.isLoading,
    error: state.error,
    setOfflineMode,
    setAutoSync,
    isOfflineMode,
    getOfflineQueueStatus,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
};