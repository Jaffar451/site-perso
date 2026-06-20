import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useEffect } from 'react';
import OfflineCache from '../utils/offlineCache';

export function useOfflineQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>
) {
  const cacheKey = queryKey.join('_');

  const query = useQuery<T, Error>({
    queryKey,
    queryFn: async () => {
      try {
        const data = await queryFn();
        await OfflineCache.set(cacheKey, data);
        return data;
      } catch (error) {
        const cached = await OfflineCache.get<T>(cacheKey);
        if (cached) {
          console.log(`[Offline] Données cache utilisées pour ${cacheKey}`);
          return cached;
        }
        throw error;
      }
    },
    ...options,
  });

  return query;
}
