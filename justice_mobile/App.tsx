import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, Platform, LogBox } from "react-native"; // ✅ LogBox ajouté
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";

import type { Notification, NotificationResponse, Subscription } from 'expo-notifications';

import { AppThemeProvider } from "./src/theme/AppThemeProvider";
import { SyncManager } from "./src/components/SyncManager";
import ToastManager from "./src/components/ui/ToastManager";
import { NetworkBanner } from "./src/components/ui/NetworkBanner";

import AppNavigator from "./src/navigation/AppNavigator";
import { navigationRef } from "./src/navigation/RootNavigation";
import { useAuthStore } from "./src/stores/useAuthStore";

// ======================================================
// 🛡️ NETTOYAGE DES LOGS (Spécifique au Web)
// ======================================================
LogBox.ignoreLogs([
  'shadow* style props',
  'props.pointerEvents is deprecated',
  'Blocked aria-hidden',
]);

// ======================================================
// CONFIGURATION NOTIFICATIONS
// ======================================================
let Notifications: any = null;
if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// ======================================================
// TANSTACK QUERY CONFIG
// ======================================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes de fraîcheur
      refetchOnWindowFocus: false, // Empêche le spam au changement d'onglet
    },
  },
});

export default function App() {
  const { user } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  const notificationListener = useRef<Subscription | null>(null);
  const responseListener = useRef<Subscription | null>(null);

  // Rehydratation de l'état
  useEffect(() => {
    const timeout = setTimeout(() => setIsReady(true), 300);
    return () => clearTimeout(timeout);
  }, []);

  // Gestion des Notifications
  useEffect(() => {
    if (Platform.OS === 'web' || !Notifications) return;

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification: Notification) => {
        console.log("Alerte reçue:", notification.request.content.data);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response: NotificationResponse) => {
        const data = response.notification.request.content.data as {
          screen?: string;
          sosId?: string;
        };
        if (data?.screen && navigationRef.isReady()) {
          navigationRef.navigate(data.screen as any, { sosId: data.sosId });
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A237E" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AppThemeProvider>
          {/* Note: PaperProvider peut parfois causer l'erreur aria-hidden sur le Web
              si plusieurs modaux sont ouverts. Le LogBox ci-dessus cache l'alerte.
          */}
          <PaperProvider>
            <NetworkBanner />
            <SyncManager />
            <StatusBar style="auto" />
            <AppNavigator />
            <ToastManager />
          </PaperProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});