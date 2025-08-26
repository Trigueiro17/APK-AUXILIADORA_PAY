import NetInfo from '@react-native-community/netinfo';
import { apiService, ApiSettings, UpdateSettingsRequest } from './apiService';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

interface SettingsCache {
  settings: ApiSettings;
  timestamp: number;
  userId?: string;
}

interface OfflineSettingsUpdate {
  userId?: string;
  settings: UpdateSettingsRequest;
  timestamp: number;
}

class RemoteSettingsService {
  private settingsCache: SettingsCache | null = null;
  private offlineQueue: OfflineSettingsUpdate[] = [];
  private syncInProgress = false;
  private forceOfflineMode = false;
  private autoSyncEnabled = true;

  // Get default settings
  private getDefaultSettings(): ApiSettings {
    return {
      darkMode: false,
      notifications: true,
      autoBackup: false,
      language: 'pt-BR',
      nfcEnabled: true,
      hideHistoryEnabled: false,
      bluetoothEnabled: false,
    };
  }

  // Load settings from memory cache
  private async loadFromCache(): Promise<SettingsCache | null> {
    if (this.settingsCache) {
      // Check if cache is still valid
      const now = Date.now();
      if (now - this.settingsCache.timestamp < CACHE_DURATION) {
        return this.settingsCache;
      } else {
        // Cache expired, clear it
        this.settingsCache = null;
      }
    }
    return null;
  }

  // Save settings to memory cache
  private async saveToCache(settings: ApiSettings, userId?: string): Promise<void> {
    const cache: SettingsCache = {
      settings,
      timestamp: Date.now(),
      userId,
    };
    
    this.settingsCache = cache;
  }

  // Add settings update to offline queue
  private async addToOfflineQueue(userId: string | undefined, settings: UpdateSettingsRequest): Promise<void> {
    const queueItem: OfflineSettingsUpdate = {
      userId,
      settings,
      timestamp: Date.now(),
    };
    
    this.offlineQueue.push(queueItem);
  }

  // Process offline queue when connection is restored
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;
    
    console.log(`Processing ${this.offlineQueue.length} offline settings updates`);
    
    const itemsToProcess = [...this.offlineQueue];
    
    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      try {
        if (item.userId) {
          await apiService.updateUserSettings(item.userId, item.settings);
        } else {
          await apiService.updateSettings(item.settings);
        }
        console.log('Successfully synced offline settings update');
        // Remove processed item from queue
        this.offlineQueue.splice(this.offlineQueue.indexOf(item), 1);
      } catch (error) {
        console.error('Failed to sync offline settings update:', error);
        // Keep failed items in queue for retry
        break;
      }
    }
    
    console.log('Offline queue processing completed');
  }

  // Check network connectivity
  private async isNetworkAvailable(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected === true && netInfo.isInternetReachable === true;
    } catch (error) {
      console.error('Error checking network connectivity:', error);
      return false;
    }
  }

  // Check if API is available
  private async isApiAvailable(): Promise<boolean> {
    // If forced offline mode, return false
    if (this.forceOfflineMode) {
      return false;
    }
    
    try {
      // First check network connectivity
      const networkAvailable = await this.isNetworkAvailable();
      if (!networkAvailable) {
        return false;
      }
      
      // Then check API connection
      await apiService.checkConnection();
      return true;
    } catch (error) {
      console.error('API not available:', error);
      return false;
    }
  }

  // Force offline mode (useful for testing or when API is known to be down)
  setOfflineMode(offline: boolean): void {
    this.forceOfflineMode = offline;
    console.log(`Offline mode ${offline ? 'enabled' : 'disabled'}`);
  }

  // Enable/disable auto sync
  setAutoSync(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
  }

  // Get current offline status
  isOfflineMode(): boolean {
    return this.forceOfflineMode;
  }

  // Auto-sync when connectivity is restored
  private async autoSyncOnConnectivity(): Promise<void> {
    if (!this.autoSyncEnabled) {
      return;
    }

    try {
      const apiAvailable = await this.isApiAvailable();
      if (apiAvailable) {
        console.log('Connectivity restored, auto-syncing settings');
        await this.processOfflineQueue();
      }
    } catch (error) {
      console.error('Error during auto-sync:', error);
    }
  }

  // Get settings (user-specific or global)
  async getSettings(userId?: string): Promise<ApiSettings> {
    try {
      // Try to load from cache first
      const cached = await this.loadFromCache();
      if (cached && (!userId || cached.userId === userId)) {
        this.settingsCache = cached;
        
        // If cache is still valid, return cached settings
        const now = Date.now();
        if (now - cached.timestamp < CACHE_DURATION) {
          // Try auto-sync in background if enabled
          if (this.autoSyncEnabled) {
            this.autoSyncOnConnectivity().catch(console.error);
          }
          return cached.settings;
        }
      }

      // Try to fetch from API
      const apiAvailable = await this.isApiAvailable();
      if (apiAvailable) {
        let settings: ApiSettings;
        if (userId) {
          settings = await apiService.getUserSettings(userId);
        } else {
          settings = await apiService.getSettings();
        }
        
        // Save to cache
        await this.saveToCache(settings, userId);
        
        // Process any pending offline updates
        await this.processOfflineQueue();
        
        return settings;
      }

      // If API not available, return cached settings or defaults
      if (cached) {
        console.log('API not available, returning cached settings');
        return cached.settings;
      }
      
      console.log('No cache available, returning default settings');
      const defaultSettings = this.getDefaultSettings();
      // Save defaults to cache for future offline use
      await this.saveToCache(defaultSettings, userId);
      return defaultSettings;
    } catch (error) {
      console.error('Error getting settings:', error);
      
      // Return cached settings if available
      if (this.settingsCache) {
        return this.settingsCache.settings;
      }
      
      // Return default settings as fallback
      const defaultSettings = this.getDefaultSettings();
      // Try to save defaults to cache for future use
      try {
        await this.saveToCache(defaultSettings, userId);
      } catch (cacheError) {
        console.error('Failed to save default settings to cache:', cacheError);
      }
      return defaultSettings;
    }
  }

  // Update settings
  async updateSettings(userId: string | undefined, settingsUpdate: UpdateSettingsRequest): Promise<ApiSettings> {
    try {
      // Check if API is available
      const apiAvailable = await this.isApiAvailable();
      
      if (!apiAvailable) {
        console.log('API not available, adding to offline queue');
        await this.addToOfflineQueue(userId, settingsUpdate);
        
        // Update cache with new settings
        const currentSettings = await this.getSettings(userId);
        const updatedSettings = { ...currentSettings, ...settingsUpdate };
        await this.saveToCache(updatedSettings, userId);
        
        return updatedSettings;
      }

      // Update via API
      let updatedSettings: ApiSettings;
      if (userId) {
        updatedSettings = await apiService.updateUserSettings(userId, settingsUpdate);
      } else {
        updatedSettings = await apiService.updateSettings(settingsUpdate);
      }

      // Update cache
      await this.saveToCache(updatedSettings, userId);
      
      return updatedSettings;
    } catch (error) {
      console.error('Error updating settings:', error);
      
      // Add to offline queue for retry
      await this.addToOfflineQueue(userId, settingsUpdate);
      
      // Update cache with new settings
      const currentSettings = await this.getSettings(userId);
      const updatedSettings = { ...currentSettings, ...settingsUpdate };
      await this.saveToCache(updatedSettings, userId);
      
      return updatedSettings;
    }
  }

  // Force sync with remote API
  async syncWithRemote(userId?: string): Promise<ApiSettings> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return this.settingsCache?.settings || this.getDefaultSettings();
    }

    this.syncInProgress = true;
    
    try {
      // Process offline queue first
      await this.processOfflineQueue();
      
      // Get fresh settings from API
      let settings: ApiSettings;
      if (userId) {
        settings = await apiService.getUserSettings(userId);
      } else {
        settings = await apiService.getSettings();
      }
      
      // Update cache
      await this.saveToCache(settings, userId);
      
      return settings;
    } catch (error) {
      console.error('Error syncing with remote:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Clear all cached data
  async clearCache(): Promise<void> {
    this.settingsCache = null;
    this.offlineQueue = [];
    console.log('Settings cache cleared');
  }

  // Get offline queue status
  async getOfflineQueueStatus(): Promise<{ count: number; items: OfflineSettingsUpdate[] }> {
    return {
      count: this.offlineQueue.length,
      items: [...this.offlineQueue],
    };
  }
}

export const remoteSettingsService = new RemoteSettingsService();
export default remoteSettingsService;
export type { OfflineSettingsUpdate };