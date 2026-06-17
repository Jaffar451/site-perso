// src/config/env.ts
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ==========================================
// 1. VARIABLES D'ENVIRONNEMENT (DEPUIS .env)
// ==========================================
const LOCAL_IP = process.env.EXPO_PUBLIC_LOCAL_IP || "localhost";
const PROD_URL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:4000/api";

// ==========================================
// 2. DÉTECTION APPAREIL (CORRIGÉ POUR EXPO GO)
// ==========================================
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

/**
 * 🎯 Pour Expo GO, Constants.isDevice peut être unreliable.
 * On utilise l'IP du .env directement pour les appareils physiques.
 */
const getLocalServerUrl = () => {
  if (LOCAL_IP && LOCAL_IP !== 'localhost') {
    console.log(`[ENV] 📱 Appareil Physique (Expo GO) → ${LOCAL_IP}`);
    return `http://${LOCAL_IP}:4000/api`;
  }
  console.log('[ENV] 📱 Fallback → localhost');
  return 'http://localhost:4000/api';
};

const SERVER_LOCAL = getLocalServerUrl();

// Web utilise toujours l'URL de production (pas de serveur local)
const ACTIVE_URL = Platform.OS === 'web' ? PROD_URL : (__DEV__ ? SERVER_LOCAL : PROD_URL);

// ==========================================
// 3. EXPORT
// ==========================================
export const ENV = {
  API_URL: ACTIVE_URL,
  VERSION: process.env.APP_VERSION || "2.2.0",
  TIMEOUT: Number(process.env.EXPO_PUBLIC_TIMEOUT) || 30000,
  IS_DEV: __DEV__,
  PLATFORM: Platform.OS,
} as const;

// ==========================================
// 4. LOGS DE DEBUG
// ==========================================
if (__DEV__) {
  console.log('\n========================================');
  console.log('⚙️  CONFIGURATION ENVIRONNEMENT');
  console.log('========================================');
  console.log(`📍 API_URL    : ${ENV.API_URL}`);
  console.log(`🌍 Platform   : ${ENV.PLATFORM}`);
  console.log(`🔧 Mode       : ${ENV.IS_DEV ? 'Développement' : 'Production'}`);
  console.log('========================================\n');
}
