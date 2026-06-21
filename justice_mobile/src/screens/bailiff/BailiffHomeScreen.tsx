import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  RefreshControl,
  Dimensions,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";

// ✅ Architecture
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { BailiffScreenProps } from "../../types/navigation";
import api from "../../services/api";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import ChatbotFAB from "../../components/ui/ChatbotFAB";

const { width } = Dimensions.get("window");
const itemWidth = (width - 44) / 2;

export default function BailiffHomeScreen({ navigation }: BailiffScreenProps<'BailiffHome'>) {
  const { theme, isDark } = useAppTheme();
  const { user } = useAuthStore();
  
  // 🟣 Palette Huissier (Indigo / Violet - Couleur de l'officier ministériel)
  const primaryColor = "#4F46E5"; 

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🔄 Simulation de stats
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["bailiff-stats"],
    queryFn: async () => {
        // En attendant le service réel
        return { pending: 8, urgent: 3, completed: 25 };
    }
  });

  useFocusEffect(useCallback(() => { refetch(); }, []));

  const timeString = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateFull = currentTime.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
  };

  const services = [
    { id: "missions", title: "Missions", icon: "briefcase", color: primaryColor, route: "BailiffMissions", desc: "Significations en attente" },
    { id: "scanner", title: "Scanner Acte", icon: "qr-code-outline", color: "#065F46", route: "VerificationScanner", desc: "Vérifier titre exécutoire" },
    { id: "rapport", title: "Rapport Hebdo", icon: "stats-chart", color: "#7C2D12", route: "WeeklyReport", desc: "Compte-rendu d'activité" },
    { id: "agenda", title: "Agenda", icon: "calendar", color: "#EA580C", route: "BailiffCalendar", desc: "Audiences & RDV" }
  ];

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Espace Huissier" showMenu={true} />

      <ScrollView 
        style={{ backgroundColor: colors.bgMain }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={primaryColor} />}
      >
        
        {/* 👋 BIENVENUE */}
        <View style={styles.welcomeSection}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.welcomeSub, { color: colors.textSub }]}>{dateFull}</Text>
              <Text style={[styles.welcomeTitle, { color: colors.textMain }]}>
                Me {(user?.lastname || "l'Huissier").toUpperCase()}
              </Text>
            </View>
            <LinearGradient colors={[primaryColor, '#3730A3']} style={styles.clockBadge}>
              <Text style={styles.clockText}>{timeString}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* 📊 DASHBOARD MISSIONS */}
        <TouchableOpacity 
          activeOpacity={0.9}
          style={[styles.heroCard, { backgroundColor: primaryColor }]}
          onPress={() => navigation.navigate("BailiffMissions")}
        >
          <View style={{ zIndex: 2 }}>
            <Text style={styles.heroTitle}>État des Significations</Text>
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{stats?.pending || 0}</Text>
                  <Text style={styles.statLbl}>À SIGNIFIER</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{stats?.urgent || 0}</Text>
                  <Text style={styles.statLbl}>URGENCES</Text>
                </View>
            </View>
            <View style={styles.heroBtn}>
              <Text style={[styles.heroBtnText, { color: primaryColor }]}>DÉBUTER LA TOURNÉE</Text>
              <Ionicons name="bicycle" size={18} color={primaryColor} />
            </View>
          </View>
          <Ionicons name="document-text" size={140} color="rgba(255,255,255,0.1)" style={styles.heroIcon} />
        </TouchableOpacity>

        {/* 🛠️ SERVICES MÉTIERS */}
        <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Outils de l'Officier</Text>
        <View style={styles.gridContainer}>
          {services.map((s) => (
            <TouchableOpacity 
              key={s.id} 
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

        {/* 📢 RAPPEL D'ACTE */}
        <View style={[styles.infoCard, { borderColor: primaryColor + '40', backgroundColor: isDark ? "#1E293B" : "#EEF2FF" }]}>
            <Ionicons name="information-circle" size={24} color={primaryColor} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: primaryColor }]}>Signification Électronique</Text>
              <Text style={[styles.infoText, { color: colors.textSub }]}>
                Conformément au Code de Procédure, la remise sur l'application vaut notification à personne.
              </Text>
            </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      <ChatbotFAB />
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 10 },
  welcomeSection: { marginBottom: 25 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  welcomeSub: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  welcomeTitle: { fontSize: 22, fontWeight: "900", marginTop: 2 },
  clockBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, elevation: 4 },
  clockText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  heroCard: { borderRadius: 24, padding: 24, marginBottom: 25, overflow: "hidden", elevation: 8 },
  heroTitle: { color: "#FFF", fontSize: 18, fontWeight: "900", marginBottom: 20, textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  statItem: { alignItems: 'center', flex: 1 },
  statVal: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  statLbl: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', marginTop: 4 },
  statDivider: { width: 1, height: 35, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroBtn: { backgroundColor: "#FFF", alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  heroBtnText: { fontWeight: "900", fontSize: 11 },
  heroIcon: { position: "absolute", right: -25, bottom: -25 },
  sectionTitle: { fontSize: 11, fontWeight: "900", marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: 4 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridItem: { width: itemWidth, padding: 18, borderRadius: 22, borderWidth: 1, elevation: 2 },
  iconCircle: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 15 },
  gridTitle: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  gridDesc: { fontSize: 11, fontWeight: "600", lineHeight: 15 },
  infoCard: { marginTop: 25, borderRadius: 24, padding: 20, flexDirection: 'row', gap: 15, alignItems: 'center', borderWidth: 1 },
  infoTitle: { fontWeight: "900", fontSize: 14, marginBottom: 4 },
  infoText: { fontSize: 12, fontWeight: "500", lineHeight: 18 },
});