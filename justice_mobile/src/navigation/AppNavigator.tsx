import React, { useEffect } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
// ✅ Importation correcte de React Navigation
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// ✅ Imports de vos propres fichiers (vérifiez bien les chemins !)
import { RootStackParamList } from "../types/navigation";
import { navigationRef } from "./RootNavigation"; 
import { useAuthStore } from "../stores/useAuthStore";
import { useAppTheme } from "../theme/AppThemeProvider";
import { SyncManager } from "../components/SyncManager";
import { NetworkBanner } from "../components/ui/NetworkBanner";

// ✅ Imports de vos navigateurs
import AuthNavigator from "./AuthNavigator";
import DrawerNavigator from "./DrawerNavigator"; 

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { theme, isDark } = useAppTheme();
  
  // Utilisation de la sélection sélective pour éviter les erreurs de type
  const isAuthenticated = useAuthStore((state: any) => state.isAuthenticated);

  // 🎨 Adaptation du thème
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
      primary: theme.colors.primary,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: (theme.colors as any).textSecondary || theme.colors.primary || '#ccc',
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={theme.colors.background}
      />
      
      <SyncManager />
      <NetworkBanner />

      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false,
            animation: 'fade'
          }}
        >
          {isAuthenticated ? (
            <Stack.Screen name="Main" component={DrawerNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}