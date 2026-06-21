import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  StatusBar, 
  Alert, 
  ActivityIndicator,
  RefreshControl 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";

// ✅ Architecture
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { ProsecutorScreenProps } from "../../types/navigation";
import { getProsecutorStats } from "../../services/stats.service";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import ChatbotFAB from "../../components/ui/ChatbotFAB";

const { width } = Dimensions.get("window");
const gap = 12;
const itemWidth = (width - 44) / 2;

export default function ProsecutorHomeScreen({ navigation }: ProsecutorScreenProps<'ProsecutorDashboard'>) {
  const { theme, isDark } = useAppTheme();
  const { user } = useAuthStore();
  
  // 🔴 Bordeaux Parquet (Identité visuelle de la magistrature debout au Niger)
  const primaryColor = "#7C2D12"; 

  // 🕒 HORLOGE TEMPS RÉEL
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🔄 RÉCUPÉRATION DES STATISTIQUES (React Query)
  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["prosecutor-stats"],
    queryFn: getProsecutorStats,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const timeString = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateFull = currentTime.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();

  // 🎨 PALETTE DYNAMIQUE
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#F1F5F9",
  };

  const services = [
    { id: "cases", title: "Dossiers", icon: "folder-open", color: primaryColor, route: "ProsecutorCaseList", desc: "Traiter les PV" },
    { id: "calendar", title: "Audiences", icon: "calendar", color: "#EA580C", route: "ProsecutorCalendar", desc: "Rôle du jour" },
    // ✅ NOUVEAUX OUTILS
    { id: "scanner", title: "Scanner PV", icon: "qr-code-outline", color: "#10B981", route: "VerificationScanner", desc: "Vérifier pièce/scellé" },
    { id: "rapport", title: "Rapport Hebdo", icon: "stats-chart", color: "#6366F1", route: "WeeklyReport", desc: "Activité Parquet" },
    // -----------------
    { id: "warrants", title: "Mandats", icon: "shield-checkmark", color: "#0891B2", route: "WarrantSearch", desc: "Écrous & Recherche" },
    { id: "assign", title: "Assignation", icon: "person-add", color: "#059669", route: "ProsecutorAssignJudge", desc: "Désigner un juge" }
  ];

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Espace Procureur" showMenu={true} />

      <ScrollView 
        style={[styles.scrollView, { backgroundColor: colors.bgMain }]}
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={primaryColor} />
        }
      >
        {/* 👋 BIENVENUE & DATE */}
        <View style={styles.welcomeSection}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.welcomeSub, { color: colors.textSub }]}>{dateFull}</Text>
              <Text style={[styles.welcomeTitle, { color: colors.textMain }]}>
                M. le Procureur <Text style={{ color: primaryColor }}>{user?.lastname || user?.lastname || ""}</Text>
              </Text>
            </View>
            <LinearGradient 
              colors={[primaryColor, '#991B1B']} 
              style={styles.clockBadge}
            >
              <Text style={styles.clockText}>{timeString}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* 🏛️ RÉCAPITULATIF D'ACTIVITÉ */}
        <TouchableOpacity 
          activeOpacity={0.9}
          style={[styles.heroCard, { backgroundColor: primaryColor }]}
          onPress={() => navigation.navigate("ProsecutorCaseList" as any)}
        >
          <View style={{ zIndex: 2, flex: 1 }}>
            <Text style={styles.heroTitle}>Activité du Parquet</Text>
            {isLoading ? (
                <ActivityIndicator color="#FFF" style={{ alignSelf: 'flex-start', marginVertical: 20 }} />
            ) : (
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statVal}>{stats?.nouveaux || 0}</Text>
                      <Text style={styles.statLbl}>NOUVEAUX</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statVal}>{stats?.enCours || 0}</Text>
                      <Text style={styles.statLbl}>EN COURS</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statVal}>{stats?.urgences || 0}</Text>
                      <Text style={styles.statLbl}>URGENCES</Text>
                    </View>
                </View>
            )}
            <View style={styles.heroBtn}>
              <Text style={[styles.heroBtnText, { color: primaryColor }]}>RÉORIENTER LES DOSSIERS</Text>
              <Ionicons name="arrow-forward" size={16} color={primaryColor} />
            </View>
          </View>
          <View style={styles.heroIconWrapper}>
            <Ionicons name="scale" size={140} color="rgba(255,255,255,0.1)" />
          </View>
        </TouchableOpacity>

        {/* 🛠️ OUTILS DE GESTION */}
        <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Outils de Gestion</Text>
        <View style={styles.gridContainer}>
          {services.map((s) => (
            <TouchableOpacity 
              key={s.id} 
              activeOpacity={0.8}
              style={[styles.gridItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]} 
              onPress={() => navigation.navigate(s.route as any)}
            >
              <View style={[styles.iconCircle, { backgroundColor: s.color + "12" }]}>
                <Ionicons name={s.icon as any} size={24} color={s.color} />
              </View>
              <Text style={[styles.gridTitle, { color: colors.textMain }]}>{s.title}</Text>
              <Text style={[styles.gridDesc, { color: colors.textSub }]}>{s.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🚨 ALERTES DÉLAIS */}
        <View style={[styles.infoCard, { borderColor: '#EF4444' }]}>
          <LinearGradient 
            colors={isDark ? ['#450A0A', '#7F1D1D'] : ['#FEF2F2', '#FEE2E2']} 
            style={styles.infoGradient}
          >
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Surveillance des Délais</Text>
              <Text style={[styles.infoText, { color: isDark ? "#FCA5A5" : "#991B1B" }]}>
                {stats?.clotures ? `Action requise : ${stats.clotures} dossiers en attente.` : "Aucune alerte de délai aujourd'hui."}
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>
      <ChatbotFAB />
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  container: { padding: 16, paddingTop: 10 },
  welcomeSection: { marginBottom: 25 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  welcomeSub: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  welcomeTitle: { fontSize: 20, fontWeight: "900", marginTop: 2 },
  clockBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, elevation: 4 },
  clockText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  heroCard: { borderRadius: 24, padding: 24, marginBottom: 25, overflow: "hidden", elevation: 8 },
  heroTitle: { color: "#FFF", fontSize: 18, fontWeight: "900", marginBottom: 20, textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  statItem: { alignItems: 'center', flex: 1 },
  statVal: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  statLbl: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800' },
  statDivider: { width: 1, height: 35, backgroundColor: 'rgba(255,255,255,0.15)' },
  heroBtn: { backgroundColor: "#FFF", alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  heroBtnText: { fontWeight: "900", fontSize: 11 },
  heroIconWrapper: { position: "absolute", right: -25, bottom: -25 },
  sectionTitle: { fontSize: 11, fontWeight: "900", marginBottom: 15, textTransform: 'uppercase' },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: gap },
  gridItem: { width: itemWidth, padding: 18, borderRadius: 22, borderWidth: 1, elevation: 2 },
  iconCircle: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 15 },
  gridTitle: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  gridDesc: { fontSize: 11, fontWeight: "600" },
  infoCard: { marginTop: 25, borderRadius: 24, overflow: 'hidden', borderWidth: 1 },
  infoGradient: { padding: 22, flexDirection: "row", gap: 15, alignItems: "center" },
  infoTitle: { fontWeight: "900", fontSize: 14, marginBottom: 4, color: "#EF4444" },
  infoText: { fontSize: 12, fontWeight: "500", lineHeight: 18 },
});