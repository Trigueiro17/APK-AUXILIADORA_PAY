import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { remoteSettingsService } from '../services/remoteSettingsService';
import { ApiSettings } from '../services/apiService';
import { useAppContext } from './AppContext';

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