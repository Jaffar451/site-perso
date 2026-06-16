// PATH: src/screens/judge/JudgeHearingScreen.tsx
import React, { useState, useCallback, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  StatusBar,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";

// ✅ Architecture & Theme
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { JudgeScreenProps } from "../../types/navigation";

// ✅ UI Components
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// ✅ Services
import { getAllHearings } from "../../services/hearing.service";

interface Hearing {
  id: number;
  caseId: number;
  date: string;
  room: string;
  type: "preliminary" | "trial" | "verdict" | string; 
  trackingCode?: string;
  parties?: string; 
}

export default function JudgeHearingScreen({ navigation }: JudgeScreenProps<'JudgeHearing'>) {
  const { isDark } = useAppTheme();
  
  // ✅ Identité Cabinet d'Instruction
  const JUDGE_ACCENT = "#7C3AED"; 
  const { user } = useAuthStore(); 
  
  const [filter, setFilter] = useState<"today" | "upcoming">("today");

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    segmentBg: isDark ? "#1E293B" : "#E2E8F0",
    segmentActive: isDark ? "#334155" : "#FFFFFF",
    dateBox: isDark ? "#0F172A" : "#F8FAFC",
  };

  // 📡 Récupération du calendrier
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["judge-hearings"],
    queryFn: async () => {
      const res = await getAllHearings();
      return res as Hearing[]; 
    },
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // 🔍 Filtrage Temporel (Jour J vs Futur)
  const filteredData = useMemo(() => {
    if (!data) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return data
      .filter(h => {
        const hDate = new Date(h.date);
        hDate.setHours(0, 0, 0, 0);
        if (filter === "today") return hDate.getTime() === today.getTime();
        if (filter === "upcoming") return hDate.getTime() > today.getTime();
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, filter]);

  const renderItem = ({ item }: { item: Hearing }) => {
    const dateObj = new Date(item.date);
    const timeStr = dateObj.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
    const dayStr = dateObj.getDate();
    const monthStr = dateObj.toLocaleString("fr-FR", { month: "short" }).replace('.', '').toUpperCase();

    const typeStyles = {
        verdict: { color: "#EF4444", label: "DÉLIBÉRÉ", icon: "hammer-outline" },
        trial: { color: JUDGE_ACCENT, label: "PROCÈS", icon: "people-outline" },
        preliminary: { color: "#F59E0B", label: "INSTRUCTION", icon: "document-text-outline" }
    };

    const styleKey = item.type as keyof typeof typeStyles;
    const currentType = typeStyles[styleKey] || typeStyles.preliminary;

    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
        // Lien vers le détail du dossier pour préparer l'audience
        onPress={() => navigation.navigate("JudgeCaseDetail", { caseId: item.caseId })}
      >
        <View style={[styles.dateBox, { backgroundColor: colors.dateBox }]}>
          <Text style={[styles.dateDay, { color: JUDGE_ACCENT }]}>{dayStr}</Text>
          <Text style={[styles.dateMonth, { color: colors.textSub }]}>{monthStr}</Text>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.rowBetween}>
            <Text style={[styles.caseId, { color: colors.textMain }]}>RP-{item.caseId}/26</Text>
            <View style={[styles.badge, { backgroundColor: currentType.color + "15" }]}>
              <Text style={[styles.badgeText, { color: currentType.color }]}>{currentType.label}</Text>
            </View>
          </View>
          
          <Text style={[styles.partiesText, { color: colors.textSub }]} numberOfLines={1}>
             {item.parties || "MP C/ X (Inconnu)"}
          </Text>

          <View style={styles.rowDetail}>
            <View style={[styles.detailItem, { backgroundColor: colors.dateBox }]}>
                 <Ionicons name="time-outline" size={12} color={colors.textSub} />
                 <Text style={[styles.detailText, { color: colors.textSub }]}>{timeStr}</Text>
            </View>
            <View style={[styles.detailItem, { backgroundColor: colors.dateBox, marginLeft: 8 }]}>
                 <Ionicons name="location-outline" size={12} color={colors.textSub} />
                 <Text style={[styles.detailText, { color: colors.textSub }]}>Salle {item.room}</Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={JUDGE_ACCENT} />
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Calendrier Judiciaire" showMenu={true} />

      {/* 🏛️ BANDEAU CABINET */}
      <View style={[styles.cabinetBanner, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.cabinetTitle, { color: colors.textMain }]}>
                CABINET DU JUGE {user?.lastname?.toUpperCase()}
            </Text>
            <Text style={[styles.cabinetSub, { color: colors.textSub }]}>
                Tribunal de Grande Instance
            </Text>
          </View>
          <View style={[styles.iconCircle, { backgroundColor: JUDGE_ACCENT + '15' }]}>
             <Ionicons name="calendar-clear" size={20} color={JUDGE_ACCENT} />
          </View>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
        {/* 🗓️ FILTRE AUJOURD'HUI / À VENIR */}
        <View style={[styles.filterContainer, { backgroundColor: colors.segmentBg }]}>
            <TouchableOpacity 
              style={[styles.filterBtn, filter === "today" && { backgroundColor: colors.segmentActive }]}
              onPress={() => setFilter("today")}
            >
              <Text style={[styles.filterText, { color: filter === "today" ? JUDGE_ACCENT : colors.textSub }]}>
                {"AUJOURD'HUI"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterBtn, filter === "upcoming" && { backgroundColor: colors.segmentActive }]}
              onPress={() => setFilter("upcoming")}
            >
              <Text style={[styles.filterText, { color: filter === "upcoming" ? JUDGE_ACCENT : colors.textSub }]}>
                À VENIR
              </Text>
            </TouchableOpacity>
        </View>

        {isLoading && !isRefetching ? (
            <View style={styles.center}>
               <ActivityIndicator size="large" color={JUDGE_ACCENT} />
               <Text style={[styles.loadingText, { color: colors.textSub }]}>Synchronisation Greffe...</Text>
            </View>
        ) : (
            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                  <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={JUDGE_ACCENT} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="calendar-outline" size={80} color={colors.border} />
                  <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Aucune audience</Text>
                  <Text style={[styles.emptyText, { color: colors.textSub }]}>
                      {filter === "today" ? "Aucune affaire n'est inscrite au rôle de ce jour." : "Votre calendrier est vide pour les prochains jours."}
                  </Text>
                </View>
              }
            />
        )}
      </View>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  
  cabinetBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 20, borderBottomWidth: 1, elevation: 2 },
  cabinetTitle: { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
  cabinetSub: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  
  filterContainer: { flexDirection: "row", padding: 4, marginHorizontal: 20, marginTop: 20, borderRadius: 14, height: 50 },
  filterBtn: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  filterText: { fontWeight: "900", fontSize: 11, letterSpacing: 1 },
  
  listContent: { padding: 20, paddingBottom: 140 },
  
  card: { flexDirection: "row", padding: 16, borderRadius: 24, marginBottom: 16, borderWidth: 1, alignItems: 'center', elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  dateBox: { width: 60, height: 70, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 15 },
  dateDay: { fontSize: 26, fontWeight: "900", letterSpacing: -1 },
  dateMonth: { fontSize: 10, fontWeight: "900", marginTop: -4 },
  
  infoBox: { flex: 1, justifyContent: "center", marginRight: 10 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  caseId: { fontWeight: "900", fontSize: 15 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  
  partiesText: { fontSize: 13, fontWeight: '600', marginBottom: 10, opacity: 0.9 },
  
  rowDetail: { flexDirection: "row", alignItems: "center" },
  detailItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  detailText: { fontSize: 11, fontWeight: "800", marginLeft: 5 },
  
  emptyContainer: { alignItems: "center", marginTop: 100, paddingHorizontal: 50 },
  emptyTitle: { fontSize: 18, fontWeight: '900', marginTop: 15 },
  emptyText: { textAlign: 'center', fontSize: 14, fontWeight: '500', marginTop: 8, lineHeight: 22 },
});