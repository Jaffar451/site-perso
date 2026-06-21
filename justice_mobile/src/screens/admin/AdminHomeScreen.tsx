// PATH: src/screens/admin/AdminHomeScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  StatusBar,
  Pressable,
  Platform,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from "@tanstack/react-query"; 
import { useFocusEffect } from "@react-navigation/native";
import * as LocalAuthentication from 'expo-local-authentication'; 
import * as Haptics from 'expo-haptics'; 

// ✅ ARCHITECTURE & STORE
import { AdminScreenProps } from "../../types/navigation";
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";

// ✅ IMPORT DU SERVICE (Contient getAdminStats avec le mapping summary.users_total)
import { getAdminStats } from "../../services/admin.service"; 

// ✅ COMPOSANTS UI
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import ChatbotFAB from "../../components/ui/ChatbotFAB";
import ScreenContainer from "../../components/layout/ScreenContainer";

// --- COMPOSANT HORLOGE ---
const ClockWidget = React.memo(({ isDark, systemStatus }: { isDark: boolean, systemStatus: string }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = useMemo(() => now.toLocaleDateString('fr-FR', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  }).toUpperCase(), [now]);

  const formattedTime = useMemo(() => now.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
  }), [now]);

  return (
    <LinearGradient
      colors={isDark ? ['#1E293B', '#0F172A'] : ['#1E293B', '#334155']}
      style={styles.clockWidget}
    >
      <View style={styles.clockHeader}>
        <View style={[styles.statusDot, { backgroundColor: systemStatus === 'Maintenance' ? '#EF4444' : '#10B981' }]} />
        <Text style={[styles.statusText, { color: systemStatus === 'Maintenance' ? '#EF4444' : '#10B981' }]}>
            {systemStatus === 'Maintenance' ? 'MODE MAINTENANCE' : 'SERVEUR CENTRAL : OPÉRATIONNEL'}
        </Text>
      </View>
      <Text style={styles.timeText}>{formattedTime}</Text>
      <Text style={styles.dateText}>{formattedDate}</Text>
    </LinearGradient>
  );
});

export default function AdminHomeScreen({ navigation }: AdminScreenProps<'AdminHome'>) {
  const { isDark, theme } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const auth = useAuthStore(); 
  const [isAuthenticated, setIsAuthenticated] = useState(false); 

  // ✅ 1. SÉCURITÉ BIOMÉTRIQUE (Correction TS 2367 : Platform.OS as string)
  useEffect(() => {
    const checkBiometrics = async () => {
      if ((Platform.OS as string) === 'web') {
          setIsAuthenticated(true);
          return;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Accès Administrateur MJ Niger',
        });
        if (result.success) {
          setIsAuthenticated(true);
          if ((Platform.OS as string) !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } else {
          Alert.alert("Accès Refusé", "Veuillez vous authentifier pour accéder à la supervision.");
        }
      } else {
        setIsAuthenticated(true);
      }
    };
    checkBiometrics();
  }, []);

  // ✅ 2. RÉCUPÉRATION DES STATS VIA LE SERVICE CORRIGÉ
  const { data: stats, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ['admin-global-stats'],
    queryFn: getAdminStats, // Utilise la fonction de ton service avec le mapping dashboard-stats
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
  };

  // ✅ TOUS LES ÉLÉMENTS DU MENU RESTAURÉS
  const menuItems = [
    { title: "Comptes & Rôles", sub: "Habilitations et accès RH", icon: "people-circle-outline", route: "AdminUsers", color: "#6366F1" },
    { title: "Unités de Sécurité", sub: "Gendarmeries et Commissariats", icon: "shield-half-outline", route: "ManageStations", color: "#2563EB" },
    { title: "Cours et Tribunaux", sub: "Juridictions et Greffes", icon: "business-outline", route: "AdminCourts", color: "#059669" },
    { title: "Carte du Maillage", sub: "Déploiement territorial", icon: "map-outline", route: "NationalMap", color: "#0891B2" },
    { title: "Audit & Sécurité", sub: "Traçabilité des actes", icon: "finger-print-outline", route: "AdminAuditTrail", color: "#475569" },
    { title: "Maintenance Système", sub: "Cache, Logs & Santé", icon: "construct-outline", route: "AdminMaintenance", color: "#EF4444" },
    { title: "Scanner de Contrôle", sub: "Vérifier Badges & Actes", icon: "qr-code-outline", route: "VerificationScanner", color: "#F59E0B" },
    { title: "Rapports Hebdo", sub: "Statistiques d'activité", icon: "stats-chart-outline", route: "WeeklyReport", color: "#8B5CF6" },
  ];

  if (!isAuthenticated) return <ScreenContainer withPadding={false}><View /></ScreenContainer>;

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Supervision MJ Niger" showMenu={true} />
      
      <ScrollView 
        contentContainerStyle={styles.content}
        style={{ backgroundColor: colors.bgMain }}
        refreshControl={
          <RefreshControl refreshing={statsLoading} onRefresh={refetch} tintColor={primaryColor} />
        }
      >
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeTitle, { color: colors.textMain }]}>
            Bonjour, {(auth.user?.firstname || "ADMIN").toUpperCase()}
          </Text>
          <Text style={[styles.welcomeSub, { color: colors.textSub }]}>SYSTÈME CENTRAL E-JUSTICE NIGER</Text>
        </View>

        <ClockWidget isDark={isDark} systemStatus={stats?.systemStatus || 'Stable'} />

        <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Monitoring du Réseau</Text>
        
        <View style={styles.statsGrid}>
          {/* Correction : Affichage des valeurs récupérées depuis summary.users_total etc */}
          <StatMiniCard icon="people" val={stats?.usersCount ?? 0} label="Utilisateurs" color="#6366F1" colors={colors} />
          <StatMiniCard icon="business" val={stats?.courtsCount ?? 0} label="Juridictions" color="#8B5CF6" colors={colors} />
          <StatMiniCard icon="pulse" val={stats?.activeSessions ?? 0} label="Flux Actif" color="#EC4899" colors={colors} />
          <StatMiniCard icon="shield-checkmark" val={stats?.securityLevel || "Stable"} label="État Système" color="#10B981" colors={colors} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSub, marginTop: 30 }]}>Gestion & Outils Techniques</Text>

        <View style={styles.menuList}>
          {menuItems.map((item, i) => (
            <Pressable 
              key={i} 
              onPress={() => {
                if ((Platform.OS as string) !== 'web') Haptics.selectionAsync();
                navigation.navigate(item.route as any);
              }}
              style={({ pressed }) => [
                styles.menuCard, 
                { opacity: pressed ? 0.7 : 1, backgroundColor: colors.bgCard, borderColor: colors.border }
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color + "12" }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuTitle, { color: colors.textMain }]}>{item.title}</Text>
                <Text style={[styles.menuSub, { color: colors.textSub }]}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSub} />
            </Pressable>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <ChatbotFAB />
      <SmartFooter />
    </ScreenContainer>
  );
}

const StatMiniCard = ({ icon, val, label, color, colors }: any) => (
  <View style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
    <View style={[styles.statIconBox, { backgroundColor: color + "15" }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.statValue, { color: colors.textMain }]}>{val}</Text>
      <Text style={[styles.statLabel, { color: colors.textSub }]}>{label}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  content: { padding: 16 },
  welcomeSection: { marginBottom: 20 },
  welcomeTitle: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  welcomeSub: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  clockWidget: { padding: 24, borderRadius: 24, marginBottom: 25, alignItems: 'center' },
  clockHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 8, fontWeight: '900' },
  timeText: { fontSize: 42, fontWeight: "900", color: "#FFF" },
  dateText: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.6)", marginTop: 5 },
  sectionTitle: { fontSize: 11, fontWeight: "900", marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', padding: 15, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statIconBox: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  statValue: { fontSize: 16, fontWeight: "900" },
  statLabel: { fontSize: 9, fontWeight: "800", textTransform: 'uppercase' },
  menuList: { gap: 12 },
  menuCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 22, borderWidth: 1 },
  iconCircle: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  menuTextContainer: { flex: 1, marginLeft: 14 },
  menuTitle: { fontSize: 15, fontWeight: "800" },
  menuSub: { fontSize: 12, marginTop: 2 },
});