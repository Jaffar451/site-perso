import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Platform, ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";

import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import api from "../../services/api";

export default function PrisonHomeScreen({ navigation }: any) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = "#7C3AED";
  const { user } = useAuthStore();

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["prison-stats"],
    queryFn: async () => {
      try {
        const res = await api.get("/incarcerations/inmates");
        const inmates = res.data?.data || res.data || [];
        const list = Array.isArray(inmates) ? inmates : [];
        return {
          total: list.length,
          preventive: list.filter((i: any) => i.status === "preventive").length,
          convicted: list.filter((i: any) => i.status === "convicted").length,
          released: list.filter((i: any) => i.status === "released").length,
        };
      } catch { return { total: 0, preventive: 0, convicted: 0, released: 0 }; }
    },
  });

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
  };

  const timeString = currentTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateFull = currentTime.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase();
  const isDirector = user?.role === "prison_director";

  const actions = [
    { title: "Registre d'Écrou", icon: "people", color: "#3B82F6", route: "PrisonInmates", sub: "Détenus incarcérés" },
    { title: "Nouvel Écrou", icon: "person-add", color: "#10B981", route: "PrisonEntry", sub: "Mise sous écrou" },
    { title: "Levée d'Écrou", icon: "exit-outline", color: "#F59E0B", route: "PrisonRelease", sub: "Libération" },
    { title: "Transferts", icon: "swap-horizontal", color: "#8B5CF6", route: "PrisonTransfer", sub: "Inter-établissements" },
  ];

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Espace Pénitentiaire" />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bgMain }}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={primaryColor} />}
      >
        <LinearGradient colors={["#4C1D95", "#7C3AED"]} style={styles.headerGradient}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.welcomeText}>Bonjour, {user?.firstname}</Text>
              <Text style={styles.roleText}>{isDirector ? "Directeur d'Établissement" : "Agent Pénitentiaire"}</Text>
            </View>
            <View style={styles.clockBadge}>
              <Text style={styles.clockText}>{timeString}</Text>
            </View>
          </View>
          <Text style={styles.dateText}>{dateFull}</Text>
        </LinearGradient>

        <View style={styles.statsRow}>
          <StatCard label="Détenus" value={isLoading ? "..." : String(stats?.total || 0)} color="#3B82F6" icon="people" colors={colors} />
          <StatCard label="Préventifs" value={isLoading ? "..." : String(stats?.preventive || 0)} color="#F59E0B" icon="time" colors={colors} />
          <StatCard label="Condamnés" value={isLoading ? "..." : String(stats?.convicted || 0)} color="#EF4444" icon="lock-closed" colors={colors} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Gestion Pénitentiaire</Text>

        {actions.map((a, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.actionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={() => navigation.navigate(a.route)}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: a.color + "15" }]}>
              <Ionicons name={a.icon as any} size={24} color={a.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: colors.textMain }]}>{a.title}</Text>
              <Text style={[styles.actionSub, { color: colors.textSub }]}>{a.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
          </TouchableOpacity>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>
      <SmartFooter />
    </ScreenContainer>
  );
}

const StatCard = ({ label, value, color, icon, colors }: any) => (
  <View style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
    <Ionicons name={icon} size={18} color={color} />
    <Text style={[styles.statValue, { color: colors.textMain }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textSub }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  scroll: { paddingBottom: 20 },
  headerGradient: { padding: 24, paddingTop: 16, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  welcomeText: { color: "#FFF", fontSize: 22, fontWeight: "900" },
  roleText: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "700", marginTop: 2 },
  clockBadge: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  clockText: { color: "#FFF", fontSize: 16, fontWeight: "900", fontVariant: ["tabular-nums"] },
  dateText: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700", marginTop: 10, letterSpacing: 1 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", padding: 16, gap: 10 },
  statCard: { flex: 1, padding: 14, borderRadius: 16, alignItems: "center", borderWidth: 1, gap: 4 },
  statValue: { fontSize: 22, fontWeight: "900" },
  statLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  sectionTitle: { fontSize: 11, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase", paddingHorizontal: 16, marginBottom: 12, marginTop: 8 },
  actionCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 10, padding: 16, borderRadius: 16, borderWidth: 1, gap: 14 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  actionTitle: { fontSize: 15, fontWeight: "800" },
  actionSub: { fontSize: 11, fontWeight: "600", marginTop: 2 },
});
