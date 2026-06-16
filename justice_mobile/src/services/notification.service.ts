// src/services/notification.service.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from "./api";

/**
 * ✅ INTERFACE DES NOTIFICATIONS
 */
export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  data?: {
    screen?: string;
    sosId?: string | number;
    caseId?: string | number;
  };
  createdAt: string;
  isRead: boolean;
  type?: 'status_change' | 'new_hearing' | 'new_decision' | 'admin_alert' | 'sos_alert';
}

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * 📥 RÉCUPÉRATION DE L'HISTORIQUE
 */
export const getMyNotifications = async (): Promise<NotificationItem[]> => {
  try {
    const res = await api.get<NotificationItem[]>("/notifications/my");
    return res.data;
  } catch (error: any) {
    console.error("[NOTIF SERVICE] Erreur récupération inbox:", error.message);
    return [];
  }
};

/**
 * 📲 ENREGISTREMENT DU TOKEN PUSH
 */
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return null;
  
  if (!Device.isDevice) {
    console.warn("🔔 [NOTIF] Mode simulateur : pas de token push physique.");
    return null;
  }

  let token: string | undefined;

  // 1. Permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn("🔔 [NOTIF] Permissions refusées.");
    return null;
  }

  // 2. Récupération du Token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    
    if (!projectId) throw new Error("Project ID manquant.");

    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    
    if (token) {
      // ✅ On tente la synchro, mais on ne bloque pas si l'utilisateur n'est pas loggé
      api.patch('/users/push-token', { pushToken: token })
         .then(() => console.log("✅ [NOTIF] Token synchronisé."))
         .catch((err: any) => console.log("⏳ [NOTIF] Token généré, en attente de connexion pour synchro."));
    }
  } catch (error: any) {
    console.error("❌ [NOTIF] Erreur token:", error);
  }

  // 3. Configuration des Canaux Android (CRITIQUE POUR SOS)
  if (Platform.OS === 'android') {
    // Canal Standard
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Standard',
      importance: Notifications.AndroidImportance.DEFAULT,
    });

    // 🚨 Canal Urgence SOS (Haute priorité)
    await Notifications.setNotificationChannelAsync('sos-alerts', {
      name: 'Alertes SOS & Urgences',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#FF0000',
      sound: 'default',
    });
  }

  return token;
}

export const markAsRead = async (notificationId: string) => {
  try {
    await api.patch(`/notifications/${notificationId}/read`);
  } catch (error: any) {
    console.error(`[NOTIF SERVICE] Erreur lecture ${notificationId}:`, error);
  }
};

/**
 * 🔔 NOTIFICATION LOCALE DE TEST
 */
export const sendTestNotification = async () => {
  if (Platform.OS === 'web') return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Test Notification',
      body: 'Si tu vois ça, les notifications fonctionnent !',
      data: { type: 'test' },
    },
    trigger: null,
  });
};

/**
 * 🚨 NOTIFICATION SOS (URGENTE)
 */
export const sendSOSNotification = async (sosId: string, location: string) => {
  if (Platform.OS === 'web') return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚨 ALERTE SOS',
      body: `Un agent a lancé un SOS depuis ${location}`,
      data: { type: 'test', sosId: sosId },
      channelId: 'sos-alerts',
      sound: 'default',
    } as any,
    trigger: null,
  });
};
