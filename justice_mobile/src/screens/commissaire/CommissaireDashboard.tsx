import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  StatusBar, 
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from "@tanstack/react-query";

// ✅ Architecture
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { getPoliceStats } from "../../services/stats.service";
import { CommissaireScreenProps } from "../../types/navigation";

// Composants
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import SmartFooter from '../../components/layout/SmartFooter';

const { width } = Dimensions.get("window");
const gap = 12;
const itemWidth = (width - 48) / 2;

export default function CommissaireDashboard({ navigation }: CommissaireScreenProps<'CommissaireDashboard'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const { user } = useAuthStore();

  // 🕒 Horloge temps réel
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🔄 Statistiques réelles (ou simulées)
  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["police-stats"],
    queryFn: getPoliceStats,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // 🎨 Palette Commissaire (Indigo/Violet pour l'autorité)
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#F1F5F9",
    alertBorder: isDark ? "#7F1D1D" : "#FEE2E2",
    alertBg: isDark ? "#450A0A" : "#FEF2F2",
  };

  const timeString = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateString = currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const unitTitle = user?.lastname 
    ? `Commissariat de ${(user as any)?.district || 'Niamey'}`
    : 'Unité de Commandement';

  // 🛠️ MENU ACTIONS
  const actions = [
    { title: "Validation Visas", icon: "checkmark-done-circle", color: "#8B5CF6", route: "CommissaireVisaList", sub: "Actes en attente" },
    { title: "Supervision GAV", icon: "lock-closed", color: "#EF4444", route: "CommissaireGAVSupervision", sub: "Délais légaux" },
    { title: "Registre Main Courante", icon: "book", color: primaryColor, route: "CommissaireRegistry", sub: "Journal du poste" },
    { title: "Commandement", icon: "map", color: "#F59E0B", route: "CommissaireCommandCenter", sub: "Carte opérationnelle" },
  ];

  // ✅ NOUVEAUX OUTILS DE CONTRÔLE
  const tools = [
    { title: "Scanner Contrôle", icon: "qr-code-outline", color: "#10B981", route: "VerificationScanner", sub: "Vérifier pièce/badge" },
    { title: "Rapport Hebdo", icon: "stats-chart", color: "#6366F1", route: "WeeklyReport", sub: "Synthèse activité" },
  ];

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Tableau de Bord" showMenu={true} />

      <ScrollView 
        style={{ backgroundColor: colors.bgMain }}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={primaryColor} />
        }
      >
        
        {/* 🏛️ HEADER UNITÉ & HEURE */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.unitLabel, { color: colors.textSub }]}>SITUATION DE L'UNITÉ</Text>
              <Text style={[styles.unitName, { color: primaryColor }]}>{unitTitle}</Text>
            </View>
            <View style={[styles.rankBadge, { backgroundColor: primaryColor + '15' }]}>
               <Ionicons name="ribbon-outline" size={24} color={primaryColor} />
            </View>
          </View>

          <LinearGradient 
            colors={[primaryColor, isDark ? "#1E3A8A" : primaryColor + 'DD']} 
            start={{x: 0, y: 0}} end={{x: 1, y: 0}}
            style={styles.clockCard}
          >
            <View>
              <Text style={styles.clockTime}>{timeString}</Text>
              <Text style={styles.clockDate}>{dateString.toUpperCase()}</Text>
            </View>
            <Ionicons name="time-outline" size={44} color="rgba(255,255,255,0.3)" />
          </LinearGradient>
        </View>

        {/* 🚨 ALERTE GAV (Priorité absolue) */}
        <TouchableOpacity 
          style={[styles.alertCard, { backgroundColor: colors.alertBg, borderColor: colors.alertBorder }]} 
          activeOpacity={0.9}
          onPress={() => navigation.navigate('CommissaireGAVSupervision')}
        >
          <View style={styles.alertContent}>
            <View style={[styles.alertIconBox, { backgroundColor: isDark ? "#7F1D1D" : "#FEE2E2" }]}>
              <Ionicons name="warning-outline" size={22} color="#EF4444" />
            </View>
            <View style={{flex: 1}}>
              <Text style={[styles.alertTitle, { color: isDark ? "#FECACA" : "#1E293B" }]}>Surveillance des Délais</Text>
              <Text style={[styles.alertSub, { color: "#EF4444" }]}>
                {stats?.urgences ? `${stats.urgences} dossiers en alerte critique.` : "Aucun dépassement de délai GAV."}
              </Text>
            </View>
            <View style={styles.badgeCritical}>
              <Text style={styles.badgeText}>ALERTE</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 📊 KPI RAPIDES */}
        <View style={styles.statsGrid}>
          <StatCard 
            label="VISAS REQUIS" 
            value={isLoading ? "..." : stats?.nouveaux?.toString() || "0"} 
            icon="shield-checkmark-outline" 
            color="#8B5CF6" 
            colors={colors}
          />
          <StatCard 
            label="ENQUÊTES" 
            value={isLoading ? "..." : stats?.total?.toString() || "0"} 
            icon="search-outline" 
            color={primaryColor} 
            colors={colors}
          />
        </View>

        {/* 🚀 COMMANDEMENT & OPÉRATIONS */}
        <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Pilotage Opérationnel</Text>
        <View style={styles.gridContainer}>
          {actions.map((action, index) => (
             <ActionCard key={index} item={action} navigation={navigation} colors={colors} />
          ))}
        </View>

        {/* ✅ OUTILS DE CONTRÔLE (Nouveaux) */}
        <Text style={[styles.sectionTitle, { color: colors.textSub, marginTop: 20 }]}>Outils de Contrôle</Text>
        <View style={styles.gridContainer}>
          {tools.map((tool, index) => (
             <ActionCard key={index} item={tool} navigation={navigation} colors={colors} />
          ))}
        </View>

        {/* 📈 BARRE PERFORMANCE */}
        <View style={[styles.performanceCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.perfTitle, { color: colors.textMain }]}>Taux d'Élucidation Mensuel</Text>
          {(() => {
            const total = (stats as any)?.complaintsTotal || (stats as any)?.total || 1;
            const resolved = (stats as any)?.complaintsResolved || (stats as any)?.resolved || 0;
            const rate = Math.min(100, Math.round((resolved / Math.max(total, 1)) * 100));
            const rateColor = rate >= 75 ? "#10B981" : rate >= 50 ? "#F59E0B" : "#EF4444";
            return (
              <>
                <View style={styles.perfRow}>
                  <View style={[styles.progressBarBg, { backgroundColor: isDark ? "#334155" : "#F1F5F9" }]}>
                    <View style={[styles.progressBarFill, { width: `${rate}%`, backgroundColor: rateColor }]} />
                  </View>
                  <Text style={[styles.perfValue, { color: rateColor }]}>{rate}%</Text>
                </View>
                <Text style={[styles.perfSub, { color: colors.textSub }]}>Objectif Direction Générale : 75%</Text>
              </>
            );
          })()}
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>
      <SmartFooter />
    </ScreenContainer>
  );
}

// --- SOUS-COMPOSANTS ---

const StatCard = ({ label, value, icon, color, colors }: any) => (
  <View style={[styles.statCard, { backgroundColor: colors.bgCard, borderLeftColor: color, borderColor: colors.border, borderWidth: 1 }]}>
    <Ionicons name={icon} size={22} color={color} />
    <Text style={[styles.statValue, { color: colors.textMain }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textSub }]}>{label}</Text>
  </View>
);

const ActionCard = ({ item, navigation, colors }: any) => (
  <TouchableOpacity 
    style={[styles.actionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
    onPress={() => navigation.navigate(item.route)}
    activeOpacity={0.8}
  >
    <View style={[styles.iconCircle, { backgroundColor: item.color + "15" }]}>
      <Ionicons name={item.icon} size={24} color={item.color} />
    </View>
    <Text style={[styles.actionTitle, { color: colors.textMain }]}>{item.title}</Text>
    <Text style={[styles.actionSub, { color: colors.textSub }]} numberOfLines={1}>{item.sub}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingTop: 10 },
  headerSection: { marginBottom: 25 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  unitLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  unitName: { fontSize: 20, fontWeight: '900', marginTop: 2 },
  rankBadge: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  clockCard: { borderRadius: 24, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4 },
  clockTime: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  clockDate: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginTop: 4 },
  
  alertCard: { marginBottom: 25, borderRadius: 20, borderWidth: 1, elevation: 2 },
  alertContent: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  alertIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  alertTitle: { fontSize: 13, fontWeight: '800' },
  alertSub: { fontSize: 11, marginTop: 2, fontWeight: '600' },
  badgeCritical: { backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#FFF', fontSize: 8, fontWeight: '900' },

  statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  statCard: { flex: 1, padding: 18, borderRadius: 24, borderLeftWidth: 5, elevation: 1 },
  statValue: { fontSize: 24, fontWeight: '900', marginVertical: 4 },
  statLabel: { fontSize: 9, fontWeight: '800' },

  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15, textTransform: 'uppercase' },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: gap },
  actionCard: { width: itemWidth, padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 2 },
  iconCircle: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionTitle: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  actionSub: { fontSize: 10, fontWeight: '600' },

  performanceCard: { padding: 20, borderRadius: 24, borderWidth: 1, marginTop: 25 },
  perfTitle: { fontSize: 13, fontWeight: '800', marginBottom: 12 },
  perfRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  progressBarBg: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },
  perfValue: { fontSize: 16, fontWeight: '900' },
  perfSub: { fontSize: 10, fontWeight: '600', marginTop: 10 }
});