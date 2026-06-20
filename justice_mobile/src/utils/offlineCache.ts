import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CACHE_PREFIX = '@cache_';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const OfflineCache = {
  set: async <T>(key: string, data: T): Promise<void> => {
    try {
      const entry: CacheEntry<T> = { data, timestamp: Date.now() };
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      console.error('[Cache] Erreur set:', e);
    }
  },

  get: async <T>(key: string): Promise<T | null> => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      return entry.data;
    } catch (e) {
      console.error('[Cache] Erreur get:', e);
      return null;
    }
  },

  getIfFresh: async <T>(key: string, ttl: number = CACHE_TTL): Promise<T | null> => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.timestamp > ttl) return null;
      return entry.data;
    } catch (e) {
      return null;
    }
  },

  remove: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
    } catch (e) {}
  },

  clearAll: async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      if (cacheKeys.length > 0) await AsyncStorage.multiRemove(cacheKeys);
    } catch (e) {}
  },

  isOnline: async (): Promise<boolean> => {
    const state = await NetInfo.fetch();
    return !!(state.isConnected && state.isInternetReachable !== false);
  },
};

export default OfflineCache;
