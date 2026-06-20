import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { Platform, Alert } from 'react-native';
import OfflineCache from '../utils/offlineCache';
import OfflineService from '../utils/offlineQueue';

interface OfflineMutationOptions<TData, TVariables> {
  resource: string;
  action: 'create' | 'update' | 'patch';
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateKeys?: string[][];
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}

export function useOfflineMutation<TData = any, TVariables = any>(
  options: OfflineMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const online = await OfflineCache.isOnline();

      if (online) {
        return options.mutationFn(variables);
      }

      await OfflineService.addToQueue(options.resource, options.action, variables);

      const msg = "Action enregistrée localement. Elle sera synchronisée dès le retour du réseau.";
      if (Platform.OS === 'web') window.alert("Mode hors-ligne\n\n" + msg);
      else Alert.alert("Mode hors-ligne", msg);

      return { success: true, offline: true, data: variables } as any;
    },
    onSuccess: (data) => {
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      }
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
}
