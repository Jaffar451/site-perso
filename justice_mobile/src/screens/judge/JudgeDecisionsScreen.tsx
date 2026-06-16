import StatusBadge from '../../components/ui/StatusBadge';
// PATH: src/screens/judge/JudgeDecisionsScreen.tsx
import React, { useState, useMemo } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  TextInput, 
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

// ✅ Architecture & Theme
import { useAppTheme } from "../../theme/AppThemeProvider";
import { JudgeScreenProps } from "../../types/navigation";

// ✅ UI Components
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// ✅ Services
import { getMyComplaints } from "../../services/complaint.service";

interface DecisionCase {
  id: number;
  provisionalOffence?: string;
  status: string;
  filedAt: string;
  createdAt: string;
  updatedAt?: string;
  verdict?: string; 
}

export default function JudgeDecisionsScreen({ navigation }: JudgeScreenProps<'JudgeDecisions'>) {
  const { isDark } = useAppTheme();
  
  // ✅ Identité Cabinet d'Instruction
  const JUDGE_ACCENT = "#7C3AED"; 
  
  const [search, setSearch] = useState("");

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#F1F5F9",
  };

  // 📡 Récupération de l'historique des décisions
  const { data: rawDecisions, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['judge-decisions-history'],
    queryFn: async () => {
      const data = await getMyComplaints();
      // Filtrage : On ne garde que les dossiers clôturés/jugés par le cabinet
      return data.filter((c: any) => 
        ["closed", "decision", "resolved", "jugée", "non_lieu", "classée_sans_suite"].includes(c.status)
      ) as DecisionCase[];
    }
  });

  // 🔍 Filtrage & Tri
  const filteredDecisions = useMemo(() => {
    if (!rawDecisions) return [];

    let results = [...rawDecisions];

    // Tri par date décroissante (dernières décisions en haut)
    results.sort((a, b) => {
        const dateA = new Date(a.updatedAt ?? a.filedAt ?? a.createdAt ?? Date.now()).getTime();
        const dateB = new Date(b.updatedAt ?? b.filedAt ?? b.createdAt ?? Date.now()).getTime();
        return dateB - dateA;
    });

    if (search.trim()) {
      const lower = search.toLowerCase();
      results = results.filter(d => 
        (d.provisionalOffence?.toLowerCase() || "").includes(lower) || 
        d.id.toString().includes(lower)
      );
    }

    return results;
  }, [rawDecisions, search]);

  const getVerdictBadge = (verdict?: string) => {
    const v = (verdict || "").toUpperCase();
    
    if (v.includes("RELAXE") || v.includes("INNOCENT") || v.includes("ACQUITTAL")) {
      return { color: "#10B981", bg: "#DCFCE7", label: "RELAXÉ", icon: "shield-checkmark" };
    }
    if (v.includes("NON_LIEU") || v.includes("DISMISSED")) {
      return { color: "#64748B", bg: "#F1F5F9", label: "NON-LIEU", icon: "archive" };
    }
    // Par défaut : Condamnation
    return { color: "#EF4444", bg: "#FEE2E2", label: "CONDAMNATION", icon: "hammer" };
  };

  const renderItem = ({ item }: { item: DecisionCase }) => {
    const badge = getVerdictBadge(item.verdict);
    
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
        // On renvoie vers le détail du dossier pour consulter la minute complète
        onPress={() => navigation.navigate("JudgeCaseDetail", { caseId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.caseId, { color: JUDGE_ACCENT }]}>MINUTE N° {item.id}/26</Text>
          <Text style={[styles.date, { color: colors.textSub }]}>
            {new Date(item.updatedAt ?? item.filedAt ?? item.createdAt ?? Date.now()).toLocaleDateString("fr-FR")}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.textMain }]} numberOfLines={2}>
          {item.provisionalOffence || "Information Judiciaire close"}
        </Text>

        <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
          <View style={[styles.badgeContainer, { backgroundColor: isDark ? badge.color + "20" : badge.bg }]}>
            <Ionicons name={badge.icon as any} size={14} color={badge.color} />
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
          <View style={styles.actionLink}>
            <Text style={[styles.actionText, { color: JUDGE_ACCENT }]}>Consulter l'acte</Text>
            <Ionicons name="chevron-forward" size={16} color={JUDGE_ACCENT} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Registre des Minutes" showBack />

      {/* 🔍 BARRE DE RECHERCHE */}
      <View style={[styles.searchContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSub} style={{ marginRight: 10 }} />
        <TextInput
          placeholder="Rechercher minute ou n° dossier..."
          placeholderTextColor={colors.textSub}
          style={[styles.searchInput, { color: colors.textMain }]}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={20} color={colors.textSub} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.body, { backgroundColor: colors.bgMain }]}>
        {isLoading && !isRefetching ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={JUDGE_ACCENT} />
            <Text style={[styles.loadingText, { color: colors.textSub }]}>Accès au Greffe Numérique...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredDecisions}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={JUDGE_ACCENT} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="library-outline" size={80} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.textSub }]}>
                  Aucune minute de jugement n'est archivée pour le moment.
                </Text>
              </View>
            }
            renderItem={renderItem}
          />
        )}
      </View>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  listContent: { paddingHorizontal: 18, paddingBottom: 140, paddingTop: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  loadingText: { marginTop: 15, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  
  searchContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginHorizontal: 18, 
    marginTop: 15, 
    marginBottom: 10, 
    paddingHorizontal: 16, 
    height: 54, 
    borderRadius: 18, 
    borderWidth: 1.5 
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600' },
  
  card: { 
    padding: 20, 
    marginBottom: 16, 
    borderRadius: 24, 
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, alignItems: 'center' },
  caseId: { fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  date: { fontSize: 11, fontWeight: "700", opacity: 0.7 },
  
  title: { fontSize: 17, fontWeight: "800", marginBottom: 18, lineHeight: 24, letterSpacing: -0.5 },
  
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: 15 },
  badgeContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 6 },
  badgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  
  actionLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 12, fontWeight: '800' },
  
  emptyContainer: { alignItems: "center", marginTop: 100, paddingHorizontal: 50 },
  emptyText: { textAlign: "center", marginTop: 20, fontSize: 15, fontWeight: '600', opacity: 0.7, lineHeight: 22 },
});