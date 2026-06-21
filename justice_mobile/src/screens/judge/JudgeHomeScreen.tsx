import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Alert, Dimensions, Platform, ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";

import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { JudgeScreenProps } from "../../types/navigation";
import { getProsecutorStats } from "../../services/stats.service";
import { getAllHearings } from "../../services/hearing.service";

import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import ChatbotFAB from "../../components/ui/ChatbotFAB";

// ✅ Code Pénal Niger — données intégrées (pas besoin de navigation externe)
// Sinon on affiche les catégories directement

const { width } = Dimensions.get("window");
const gap = 12;
const halfWidth = (width - 44) / 2;

export default function JudgeHomeScreen({ navigation }: JudgeScreenProps<'JudgeHome'>) {
  const { isDark } = useAppTheme();
  const { user } = useAuthStore();
  const JUDGE_ACCENT = "#7C3AED";

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCodePenal, setShowCodePenal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["judge-stats"],
    queryFn: getProsecutorStats,
  });

  const { data: hearingsData } = useQuery({
    queryKey: ["judge-hearings-count"],
    queryFn: getAllHearings,
  });
  const hearingsCount = Array.isArray(hearingsData) ? hearingsData.length : 0;

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const timeString = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateFull   = currentTime.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase();

  const colors = {
    bgMain:  isDark ? "#0F172A" : "#F8FAFC",
    bgCard:  isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub:  isDark ? "#94A3B8" : "#64748B",
    border:   isDark ? "#334155" : "#E2E8F0",
  };

  const judicialTitle = user?.lastname
    ? `M. le Juge ${user.lastname.toUpperCase()}`
    : "Magistrat du Siège";

  // ✅ Catégories du Code Pénal Niger intégrées directement
  const CATEGORIES_CP = [
    { titre: "Infractions contre les personnes", exemples: "Homicide, coups et blessures, viol" },
    { titre: "Infractions contre les biens", exemples: "Vol, escroquerie, abus de confiance" },
    { titre: "Infractions contre l'État", exemples: "Trahison, espionnage, corruption" },
    { titre: "Infractions économiques", exemples: "Détournement, blanchiment, fraude fiscale" },
    { titre: "Infractions contre la famille", exemples: "Abandon de famille, bigamie" },
    { titre: "Infractions contre l'ordre public", exemples: "Association de malfaiteurs, rébellion" },
    { titre: "Stupéfiants", exemples: "Trafic, détention, usage de drogues" },
    { titre: "Infractions routières", exemples: "Homicide involontaire, conduite dangereuse" },
  ];

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Cabinet d'Instruction" showMenu={true} />

      <ScrollView
        style={{ backgroundColor: colors.bgMain }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={JUDGE_ACCENT} />}
      >

        {/* BIENVENUE & HEURE */}
        <View style={styles.headerSection}>
          <View style={styles.welcomeInfo}>
            <Text style={[styles.welcomeSub, { color: colors.textSub }]}>{dateFull}</Text>
            <Text style={[styles.welcomeTitle, { color: colors.textMain }]}>Bonjour, {user?.firstname}</Text>
            <Text style={[styles.rankText, { color: JUDGE_ACCENT }]}>{judicialTitle}</Text>
          </View>
          <LinearGradient colors={[JUDGE_ACCENT, '#4C1D95']} style={styles.clockBadge}>
            <Text style={styles.clockText}>{timeString}</Text>
          </LinearGradient>
        </View>

        {/* DÉONTOLOGIE */}
        <View style={[styles.oathBanner, { backgroundColor: isDark ? "#1E293B" : "#F5F3FF", borderColor: isDark ? colors.border : "#DDD6FE" }]}>
          <Ionicons name="ribbon-outline" size={20} color={JUDGE_ACCENT} />
          <Text style={[styles.oathText, { color: colors.textSub }]}>Rigueur • Impartialité • Indépendance</Text>
        </View>

        {/* INDICATEURS */}
        <View style={styles.statsContainer}>
          <StatCard icon="folder-open" value={isLoading ? "..." : stats?.enCours?.toString() || "0"} label="En Instruction" color={JUDGE_ACCENT} bgColor={isDark ? "#4C1D95" : "#F5F3FF"} onPress={() => navigation.navigate("JudgeCases" as any)} colors={colors} />
          <StatCard icon="calendar"    value={isLoading ? "..." : String(hearingsCount)}                label="Audiences"      color="#10B981"   bgColor={isDark ? "#064E3B" : "#F0FDF4"} onPress={() => navigation.navigate("JudgeHearing" as any)} colors={colors} />
          <StatCard icon="alert-circle" value={isLoading ? "..." : stats?.urgences?.toString() || "0"} label="Urgences"     color="#EF4444"   bgColor={isDark ? "#7F1D1D" : "#FFF5F5"} onPress={() => navigation.navigate("JudgeCases" as any)} colors={colors} />
        </View>

        {/* PILOTAGE */}
        <Text style={[styles.sectionHeader, { color: colors.textSub }]}>Pilotage du Cabinet</Text>

        <ActionCard
          icon="file-tray-full"
          title="Registre des Dossiers"
          desc="Consultation, instruction et ordonnances."
          color={JUDGE_ACCENT}
          colors={colors}
          onPress={() => navigation.navigate("JudgeCases" as any)}
        />

        <ActionCard
          icon="hammer"
          title="Rendre une Décision"
          desc="Saisir un verdict, un non-lieu ou une relaxe."
          color="#10B981"
          colors={colors}
          onPress={() => navigation.navigate("JudgeDecisions" as any)}
        />

        {/* OUTILS DE CONTRÔLE */}
        <Text style={[styles.sectionHeader, { color: colors.textSub }]}>Gestion & Contrôle</Text>
        <View style={styles.gridContainer}>
          <GridCard title="Scanner Pièce" icon="qr-code-outline" color="#2563EB" desc="Vérification PV/Scellé" colors={colors} onPress={() => navigation.navigate("VerificationScanner" as any)} />
          <GridCard title="Rapport Hebdo" icon="stats-chart"    color="#EA580C" desc="Statistiques Cabinet"  colors={colors} onPress={() => navigation.navigate("WeeklyReport" as any)} />
        </View>

        {/* OUTILS DU QUOTIDIEN */}
        <Text style={[styles.sectionHeader, { color: colors.textSub }]}>Outils du Quotidien</Text>
        <View style={styles.toolsRow}>
          <ToolBtn icon="calendar-outline" label="Calendrier" color={JUDGE_ACCENT} colors={colors} onPress={() => navigation.navigate("JudgeHearing" as any)} />
          {/* ✅ Code Pénal : affiche un modal inline au lieu d'un Alert */}
          <ToolBtn icon="library-outline"  label="Code Pénal" color={JUDGE_ACCENT} colors={colors} onPress={() => setShowCodePenal(true)} />
          <ToolBtn icon="archive-outline"  label="Archives"   color={JUDGE_ACCENT} colors={colors} onPress={() => navigation.navigate("JudgeDecisions" as any)} />
        </View>

        {/* ✅ CODE PÉNAL — Affichage inline */}
        {showCodePenal && (
          <View style={[styles.codePenalBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.codePenalHeader}>
              <View>
                <Text style={[styles.codePenalTitle, { color: JUDGE_ACCENT }]}>CODE PÉNAL DU NIGER</Text>
                <Text style={[styles.codePenalSub, { color: colors.textSub }]}>Édition 2018 — Principales infractions</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCodePenal(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textSub} />
              </TouchableOpacity>
            </View>
            {CATEGORIES_CP.map((cat, i) => (
              <View key={i} style={[styles.catRow, { borderBottomColor: colors.border, borderBottomWidth: i < CATEGORIES_CP.length - 1 ? 1 : 0 }]}>
                <View style={[styles.catIcon, { backgroundColor: JUDGE_ACCENT + '15' }]}>
                  <Ionicons name="book-outline" size={16} color={JUDGE_ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.catTitle, { color: colors.textMain }]}>{cat.titre}</Text>
                  <Text style={[styles.catExemples, { color: colors.textSub }]}>{cat.exemples}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.codePenalBtn, { backgroundColor: JUDGE_ACCENT }]}
              onPress={() => {
                setShowCodePenal(false);
                // Navigation vers l'écran dédié si disponible
                if (Platform.OS === 'web') window.alert("Le module Code Pénal sera disponible prochainement.");
                else Alert.alert("Information", "Le module Code Pénal sera disponible prochainement.");
              }}
            >
              <Ionicons name="open-outline" size={18} color="#FFF" />
              <Text style={styles.codePenalBtnText}>CONSULTER LE CODE COMPLET</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      <ChatbotFAB />
      <SmartFooter />
    </ScreenContainer>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────────────

const StatCard = ({ icon, value, label, color, bgColor, onPress, colors }: any) => (
  <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={[styles.statNumber, { color: colors.textMain }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textSub }]}>{label}</Text>
  </TouchableOpacity>
);

const ActionCard = ({ icon, title, desc, color, colors, onPress }: any) => (
  <TouchableOpacity activeOpacity={0.8} style={[styles.actionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={onPress}>
    <View style={[styles.iconBox, { backgroundColor: color + "15" }]}>
      <Ionicons name={icon} size={26} color={color} />
    </View>
    <View style={styles.actionContent}>
      <Text style={[styles.actionTitle, { color: colors.textMain }]}>{title}</Text>
      <Text style={[styles.actionDesc, { color: colors.textSub }]}>{desc}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.textSub} />
  </TouchableOpacity>
);

const GridCard = ({ icon, title, desc, color, colors, onPress }: any) => (
  <TouchableOpacity activeOpacity={0.8} style={[styles.gridCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={onPress}>
    <View style={[styles.iconCircleSmall, { backgroundColor: color + "15" }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={[styles.gridTitle, { color: colors.textMain }]}>{title}</Text>
    <Text style={[styles.gridDesc, { color: colors.textSub }]} numberOfLines={1}>{desc}</Text>
  </TouchableOpacity>
);

const ToolBtn = ({ icon, label, color, colors, onPress }: any) => (
  <TouchableOpacity style={[styles.toolBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={onPress}>
    <Ionicons name={icon} size={22} color={color} />
    <Text style={[styles.toolText, { color: colors.textMain }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container:      { padding: 16, paddingTop: 10 },
  headerSection:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 25 },
  welcomeInfo:    { flex: 1 },
  welcomeSub:     { fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  welcomeTitle:   { fontSize: 24, fontWeight: "900", marginTop: 2 },
  rankText:       { fontSize: 14, fontWeight: "700", marginTop: 2 },
  clockBadge:     { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, elevation: 4 },
  clockText:      { color: "#FFF", fontSize: 18, fontWeight: "900", letterSpacing: 1 },
  oathBanner:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 15, marginBottom: 30, borderWidth: 1, gap: 10 },
  oathText:       { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  statsContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 35 },
  statCard:       { width: "31%", paddingVertical: 20, borderRadius: 24, alignItems: "center", borderWidth: 1, elevation: 2 },
  iconCircle:     { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  statNumber:     { fontSize: 24, fontWeight: "900", marginTop: 8 },
  statLabel:      { fontSize: 9, fontWeight: "800", textTransform: 'uppercase', marginTop: 4 },
  sectionHeader:  { fontSize: 11, fontWeight: "900", textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 15, marginTop: 10, marginLeft: 4 },
  actionCard:     { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 22, marginBottom: 15, borderWidth: 1, elevation: 2 },
  iconBox:        { width: 52, height: 52, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 15 },
  actionContent:  { flex: 1 },
  actionTitle:    { fontSize: 15, fontWeight: "800" },
  actionDesc:     { fontSize: 11, marginTop: 2, fontWeight: "600" },
  gridContainer:  { flexDirection: 'row', flexWrap: 'wrap', gap, marginBottom: 20 },
  gridCard:       { width: halfWidth, padding: 16, borderRadius: 20, borderWidth: 1, elevation: 1 },
  iconCircleSmall:{ width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  gridTitle:      { fontSize: 13, fontWeight: "800", marginBottom: 2 },
  gridDesc:       { fontSize: 10, fontWeight: "600" },
  toolsRow:       { flexDirection: "row", gap: 12, marginBottom: 20 },
  toolBtn:        { flex: 1, paddingVertical: 18, borderRadius: 20, alignItems: "center", borderWidth: 1, gap: 8 },
  toolText:       { fontSize: 10, fontWeight: "800" },

  // Code Pénal
  codePenalBox:       { borderRadius: 24, borderWidth: 1, overflow: 'hidden', marginTop: 10 },
  codePenalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 15 },
  codePenalTitle:     { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  codePenalSub:       { fontSize: 11, fontWeight: '600', marginTop: 2 },
  catRow:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  catIcon:            { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  catTitle:           { fontSize: 13, fontWeight: '800' },
  catExemples:        { fontSize: 11, fontWeight: '500', marginTop: 2 },
  codePenalBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, margin: 16, padding: 16, borderRadius: 16 },
  codePenalBtnText:   { color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
});