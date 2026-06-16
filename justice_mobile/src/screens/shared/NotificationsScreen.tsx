// PATH: src/screens/shared/NotificationsScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Platform, StatusBar, ActivityIndicator, RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "../../stores/useAuthStore";
// ✅ CORRECTION : useAppTheme au lieu de getAppTheme
import { useAppTheme } from "../../theme/AppThemeProvider";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

interface Notification {
  id:          number;
  title:       string;
  message:     string;
  type:        "CASE_UPDATE" | "ALERT" | "APPOINTMENT" | "SIGNATURE";
  created_at:  string;
  is_read:     boolean;
  related_id?: number;
}

const ROLE_SCREENS: Record<string, string> = {
  police:     'PoliceComplaintDetails',
  judge:      'JudgeCaseDetail',
  prosecutor: 'ProsecutorAssignJudge',
  clerk:      'ClerkComplaintDetails',
  citizen:    'CitizenComplaintDetail',
};

export default function NotificationsScreen({ navigation }: any) {
  // ✅ CORRECTION : hook correctement appelé
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const { user } = useAuthStore();
  const role = user?.role || "citizen";

  const colors = {
    bgMain:  isDark ? "#0F172A" : "#F8FAFC",
    bgCard:  isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub:  isDark ? "#94A3B8" : "#64748B",
    border:   isDark ? "#334155" : "#E2E8F0",
  };

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,       setLoading]        = useState(true);
  const [refreshing,    setRefreshing]     = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const mockNotifs: Notification[] = [
        {
          id: 1, title: "Orientation Dossier",
          message: "Le Procureur a validé la saisine pour le dossier RG-882. Instruction ouverte.",
          type: "CASE_UPDATE", created_at: new Date().toISOString(), is_read: false, related_id: 882,
        },
        {
          id: 2, title: "Sécurité & Signature",
          message: "Une nouvelle empreinte numérique a été apposée sur le PV n°102/25.",
          type: "SIGNATURE", created_at: new Date(Date.now() - 3600000).toISOString(), is_read: true,
        },
      ];
      setNotifications(mockNotifs);
    } catch (e) {
      console.error("Erreur notifications:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handlePress = (notif: Notification) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    if (notif.related_id) {
      const target = ROLE_SCREENS[role] || ROLE_SCREENS.citizen;
      navigation.navigate(target, { id: notif.related_id, complaintId: notif.related_id, caseId: notif.related_id });
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const isUnread = !item.is_read;
    const config = {
      CASE_UPDATE:  { icon: "document-text", color: primaryColor },
      ALERT:        { icon: "shield-alert",  color: "#EF4444" },
      APPOINTMENT:  { icon: "calendar",      color: "#10B981" },
      SIGNATURE:    { icon: "key",           color: "#6366F1" },
    }[item.type] || { icon: "notifications", color: primaryColor };

    return (
      <TouchableOpacity
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
        style={[
          styles.notifCard,
          {
            backgroundColor: colors.bgCard,
            borderLeftColor:  isUnread ? config.color : colors.border,
            borderLeftWidth:  isUnread ? 6 : 1,
            borderColor:      colors.border,
          },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: isUnread ? config.color + "12" : colors.bgMain }]}>
          <Ionicons name={config.icon as any} size={22} color={isUnread ? config.color : colors.textSub} />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.topRow}>
            <Text style={[styles.notifTitle, { color: colors.textMain, fontWeight: isUnread ? "900" : "700" }]}>
              {item.title}
            </Text>
            {isUnread && <View style={[styles.unreadDot, { backgroundColor: config.color }]} />}
          </View>
          <Text style={[styles.message, { color: colors.textSub }]} numberOfLines={2}>{item.message}</Text>
          <View style={styles.footerRow}>
            <Ionicons name="time-outline" size={12} color={colors.textSub} />
            <Text style={[styles.timeText, { color: colors.textSub }]}>
              {new Date(item.created_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader
        title="Alertes & Notifications"
        showBack={true}
        rightIcon={unreadCount > 0 ? "checkmark-done-outline" : undefined}
        onRightPress={unreadCount > 0 ? markAllAsRead : undefined}
      />

      <View style={[styles.container, { backgroundColor: colors.bgMain }]}>
        {loading && !refreshing ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={[styles.loaderText, { color: colors.textSub }]}>Chargement des alertes judiciaires...</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listPadding}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
                tintColor={primaryColor}
              />
            }
            ListHeaderComponent={() => (
              <View style={styles.listHeader}>
                <Text style={[styles.headerLabel, { color: colors.textSub }]}>Fil d'actualité</Text>
                {unreadCount > 0 && (
                  <View style={[styles.countBadge, { backgroundColor: primaryColor }]}>
                    <Text style={styles.badgeText}>{unreadCount} NOUVEAUX</Text>
                  </View>
                )}
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyBox}>
                <Ionicons name="notifications-off-outline" size={64} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Aucune notification</Text>
                <Text style={[styles.emptySub, { color: colors.textSub }]}>
                  Vos alertes judiciaires apparaîtront ici.
                </Text>
              </View>
            )}
          />
        )}
      </View>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  loaderBox:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText:   { marginTop: 15, fontSize: 13, fontWeight: '700' },
  listPadding:  { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 140 },
  listHeader:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  headerLabel:  { fontSize: 11, fontWeight: "900", textTransform: 'uppercase', letterSpacing: 1 },
  countBadge:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText:    { color: '#FFF', fontSize: 9, fontWeight: '900' },
  notifCard:    { flexDirection: 'row', padding: 18, borderRadius: 24, marginBottom: 12, borderWidth: 1, alignItems: 'center', elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
  iconCircle:   { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  textContainer:{ flex: 1, marginLeft: 15 },
  topRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unreadDot:    { width: 8, height: 8, borderRadius: 4 },
  notifTitle:   { fontSize: 15, letterSpacing: -0.2 },
  message:      { fontSize: 13, marginTop: 4, fontWeight: '500', lineHeight: 18 },
  footerRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  timeText:     { fontSize: 10, fontWeight: "800" },
  emptyBox:     { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle:   { fontSize: 18, fontWeight: '900', marginTop: 15 },
  emptySub:     { textAlign: 'center', marginTop: 8, fontSize: 14, fontWeight: '500' },
});