import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Platform,
  StatusBar,
  RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";

// ✅ Architecture
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider"; 
import { ClerkScreenProps } from "../../types/navigation";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import ChatbotFAB from "../../components/ui/ChatbotFAB";
import { getAllComplaints } from "../../services/complaint.service";
import { getAllHearings } from "../../services/hearing.service";

const { width } = Dimensions.get("window");
const gap = 12;
const itemWidth = (width - 44) / 2; 

export default function ClerkHomeScreen({ navigation }: ClerkScreenProps<'ClerkHome'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const { user } = useAuthStore();

  // 🕒 HORLOGE TEMPS RÉEL
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['clerk-stats'],
    queryFn: async () => {
      const [complaints, hearings] = await Promise.all([
        getAllComplaints().catch(() => []),
        getAllHearings().catch(() => []),
      ]);
      const list = Array.isArray(complaints) ? complaints : (complaints as any)?.data || [];
      const hearingList = Array.isArray(hearings) ? hearings : [];
      return {
        pending: list.filter((c: any) => ['transmise_parquet', 'saisi_juge'].includes(c.status)).length,
        hearings: hearingList.length,
        detention: list.filter((c: any) => c.status === 'instruction').length,
      };
    }
  });

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

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

  // 📊 STATISTIQUES AFFICHÉES
  const statsDisplay = [
    { label: "À Enrôler", value: stats?.pending || 0, color: "#F59E0B", icon: "document-text", alert: true },
    { label: "Audiences", value: stats?.hearings || 0, color: "#10B981", icon: "calendar", alert: false },
    { label: "Écrous", value: stats?.detention || 0, color: "#EF4444", icon: "lock-closed", alert: true },
  ];

  // 🛠️ MENU MÉTIER (Mis à jour avec Scanner & Rapport)
  const menuItems = [
    { title: "Enrôlement (RP)", subtitle: "Réception Parquet", icon: "create", route: "ClerkComplaints", color: "#F59E0B" },
    { title: "Rôle d'Audience", subtitle: "Planning Journalier", icon: "calendar", route: "ClerkCalendar", color: "#10B981" },
    // ✅ NOUVEAUX OUTILS
    { title: "Scanner Pièce", subtitle: "Vérification Acte", icon: "qr-code-outline", route: "VerificationScanner", color: "#2563EB" },
    { title: "Rapport Hebdo", subtitle: "Statistiques Greffe", icon: "stats-chart", route: "WeeklyReport", color: "#7C3AED" },
    // -----------------
    { title: "Registre Scellés", subtitle: "Pièces à Conviction", icon: "archive", route: "ClerkConfiscation", color: "#8B5CF6" },
    { title: "Levée d'Écrou", subtitle: "Ordres de Libération", icon: "key", route: "ClerkRelease", color: "#EC4899" }
  ];

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Gestion du Greffe" showMenu={true} />

      <ScrollView 
        style={{ backgroundColor: colors.bgMain }}
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={primaryColor} />}
      >
        
        {/* 👋 BIENVENUE & HEURE */}
        <View style={styles.welcomeSection}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dateText, { color: colors.textSub }]}>{dateFull}</Text>
              <Text style={[styles.welcomeTitle, { color: colors.textMain }]}>
                Maître <Text style={{ color: primaryColor }}>{user?.lastname || "le Greffier"}</Text>
              </Text>
            </View>
            
            <LinearGradient 
              colors={[primaryColor, isDark ? '#450A0A' : primaryColor + 'DD']} 
              style={styles.clockBadge}
            >
              <Text style={styles.clockText}>{timeString}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* 📊 INDICATEURS RAPIDES */}
        <View style={styles.statsRow}>
          {statsDisplay.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: colors.bgCard, borderTopColor: stat.color, borderColor: colors.border }]}>
              {stat.alert && <View style={[styles.alertDot, { backgroundColor: stat.color }]} />}
              <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              <Text style={[styles.statValue, { color: colors.textMain }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSub }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* 🛠️ SERVICES DU GREFFE */}
        <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Outils de Procédure</Text>
        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              style={[styles.gridItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => navigation.navigate(item.route as any)}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + "12" }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={[styles.itemTitle, { color: colors.textMain }]}>{item.title}</Text>
              <Text style={[styles.itemSub, { color: colors.textSub }]} numberOfLines={1}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ℹ️ NOTE DE SERVICE */}
        <View style={[styles.alertBox, { backgroundColor: isDark ? "#1E293B" : "#F0F9FF", borderColor: colors.border }]}>
          <View style={[styles.infoIconBox, { backgroundColor: primaryColor }]}>
            <Ionicons name="notifications" size={18} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: isDark ? colors.textMain : primaryColor }]}>Procédure de Fin de Séance</Text>
              <Text style={[styles.alertText, { color: colors.textSub }]}>
                N'oubliez pas de certifier les procès-verbaux d'audience avant 18h00 pour le transfert au Casier Judiciaire.
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
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  welcomeTitle: { fontSize: 24, fontWeight: "900", marginTop: 2 },
  
  clockBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  clockText: { color: "#FFF", fontSize: 18, fontWeight: "900", letterSpacing: 1 },

  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  statCard: {
    width: "31%",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    borderTopWidth: 4,
    borderWidth: 1,
    elevation: 2,
    position: 'relative'
  },
  alertDot: { position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3 },
  statValue: { fontSize: 22, fontWeight: "900", marginTop: 8 },
  statLabel: { fontSize: 9, fontWeight: "800", marginTop: 2, textTransform: 'uppercase' },

  sectionTitle: { fontSize: 11, fontWeight: "900", marginBottom: 15, letterSpacing: 1.5, textTransform: 'uppercase', marginLeft: 4 },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: gap },
  gridItem: {
    width: itemWidth,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  itemTitle: { fontSize: 14, fontWeight: "800" },
  itemSub: { fontSize: 11, fontWeight: "600", marginTop: 2 },

  alertBox: {
    flexDirection: "row",
    padding: 18,
    borderRadius: 20,
    marginTop: 30,
    gap: 15,
    alignItems: "center",
    borderWidth: 1,
  },
  infoIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  alertTitle: { fontWeight: "900", fontSize: 13, marginBottom: 2 },
  alertText: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
});