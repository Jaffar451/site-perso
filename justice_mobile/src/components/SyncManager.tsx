import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '../services/api';
import OfflineService from '../utils/offlineQueue';

const QUEUE_KEY = '@offline_queue';

export const SyncManager = () => {
  const isProcessing = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const unsubscribe = NetInfo.addEventListener(state => {
      const isOnline = state.isConnected && state.isInternetReachable !== false;
      if (isOnline && !isProcessing.current) {
        processQueue();
      }
    });

    return () => unsubscribe();
  }, []);

  const processQueue = async () => {
    if (isProcessing.current) return;

    try {
      isProcessing.current = true;
      const queue = await OfflineService.getQueue();
      if (queue.length === 0) { isProcessing.current = false; return; }

      console.log(`[SYNC] Traitement de ${queue.length} éléments...`);

      const remaining = [];
      let successCount = 0;

      for (const item of queue) {
        try {
          const url = `/${item.resource}${item.data.id && item.action !== 'create' ? '/' + item.data.id : ''}`;

          if (item.action === 'create') await api.post(url, item.data);
          else if (item.action === 'update') await api.put(url, item.data);
          else if (item.action === 'patch') await api.patch(url, item.data);

          successCount++;
          console.log(`[SYNC] OK: ${item.resource}/${item.action}`);
        } catch (e) {
          console.error(`[SYNC] Échec: ${item.id}`);
          item.retryCount = (item.retryCount || 0) + 1;
          if (item.retryCount < 5) remaining.push(item);
        }
      }

      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));

      if (successCount > 0) {
        console.log(`[SYNC] ${successCount} élément(s) synchronisés`);
      }
      if (remaining.length > 0) {
        console.log(`[SYNC] ${remaining.length} élément(s) en attente`);
      }
    } catch (error) {
      console.error('[SYNC] Erreur fatale:', error);
    } finally {
      isProcessing.current = false;
    }
  };

  return null;
};
