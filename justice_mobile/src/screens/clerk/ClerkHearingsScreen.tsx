import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  Platform,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ✅ 1. Architecture & Thème
import { useAppTheme } from "../../theme/AppThemeProvider"; // ✅ Hook dynamique
import { ClerkScreenProps } from "../../types/navigation";

// Services & Types
import { getAllHearings, Hearing } from "../../services/hearing.service"; 

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

export default function ClerkHearingsScreen({ navigation }: ClerkScreenProps<'ClerkCalendar'>) {
  // ✅ 2. Thème Dynamique
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary; 
  
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🎨 PALETTE DYNAMIQUE
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#F1F5F9",
    dateBoxBg: isDark ? "#0F172A" : "#F8FAFC",
  };

  const loadHearings = async () => {
    try {
      const res: Hearing[] = await getAllHearings();
      const sorted = res.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setHearings(sorted);
    } catch (error) {
      console.error("Erreur chargement rôle d'audience:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadHearings(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHearings();
  }, []);

  const getStatusConfig = (itemDate: string, status?: string) => {
    const hearingDate = new Date(itemDate);
    const now = new Date();
    const isToday = hearingDate.toDateString() === now.toDateString();
    
    if (status === "cancelled") return { label: "ANNULÉE", color: "#EF4444", bg: isDark ? "#450A0A" : "#FEE2E2" };
    if (status === "adjourned") return { label: "RENVOYÉE", color: "#F59E0B", bg: isDark ? "#432706" : "#FFFBEB" };
    if (status === "completed") return { label: "TERMINÉE", color: "#10B981", bg: isDark ? "#064E3B" : "#DCFCE7" };
    if (isToday) return { label: "AUJOURD'HUI", color: "#3B82F6", bg: isDark ? "#172554" : "#EFF6FF" };
    
    return { label: "PROGRAMMÉE", color: colors.textSub, bg: isDark ? "#334155" : "#F1F5F9" };
  };

  const renderHearingItem = ({ item }: { item: Hearing }) => {
    const hearingDate = new Date(item.date);
    const config = getStatusConfig(item.date, item.status);

    return (
      <TouchableOpacity 
        activeOpacity={0.85}
        style={[
          styles.card, 
          { 
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
            borderLeftColor: config.color
          }
        ]}
        onPress={() => navigation.navigate("ClerkHearingDetails" as any, { 
            caseId: item.caseId.toString(),
            caseNumber: item.caseNumber || `RG-${item.caseId}` 
        })}
      >
        {/* 🗓️ BLOC CALENDRIER (Style Registre) */}
        <View style={[styles.dateBox, { backgroundColor: colors.dateBoxBg, borderRightColor: colors.border }]}>
          <Text style={[styles.dayText, { color: colors.textMain }]}>
            {hearingDate.getDate().toString().padStart(2, '0')}
          </Text>
          <Text style={[styles.monthText, { color: colors.textSub }]}>
            {hearingDate.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()}
          </Text>
        </View>
        
        {/* 🏛️ INFOS DOSSIER */}
        <View style={styles.infoBox}>
          <View style={styles.headerRow}>
            <Text style={[styles.caseRef, { color: colors.textMain }]}>
              RG #{item.caseNumber || item.caseId}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
              <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>
          
          <Text style={[styles.caseType, { color: colors.textSub }]} numberOfLines={1}>
            {item.type || "Audience Correctionnelle"}
          </Text>

          <View style={styles.rowDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={14} color={primaryColor} />
              <Text style={[styles.detailText, { color: colors.textMain }]}>
                {hearingDate.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            
            <View style={[styles.detailItem, { marginLeft: 15 }]}>
              <Ionicons name="location-outline" size={14} color={primaryColor} />
              <Text style={[styles.detailText, { color: colors.textMain }]}>
                Salle {item.room || "1"}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.border} />
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Rôle des Audiences" showMenu={true} />

      <View style={[styles.mainWrapper, { backgroundColor: colors.bgMain }]}>
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={[styles.loaderText, { color: colors.textSub }]}>Chargement du greffe...</Text>
          </View>
        ) : (
          <FlatList
            data={hearings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderHearingItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor={primaryColor} 
                colors={[primaryColor]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Registre vide</Text>
                <Text style={[styles.emptySub, { color: colors.textSub }]}>
                  Aucune audience n'est actuellement programmée au rôle.
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
  mainWrapper: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 150 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 15, fontWeight: "800", fontSize: 13, letterSpacing: 1 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 24,
    marginBottom: 14,
    borderWidth: 1,
    borderLeftWidth: 8,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
      web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.08)" }
    })
  },
  
  dateBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 16,
    borderRightWidth: 1,
    marginRight: 16,
    minWidth: 65,
    height: 75,
  },
  dayText: { fontSize: 26, fontWeight: "900", letterSpacing: -1 },
  monthText: { fontSize: 10, fontWeight: "900", marginTop: -2, textTransform: 'uppercase' },

  infoBox: { flex: 1 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  caseRef: { fontSize: 15, fontWeight: "900", letterSpacing: -0.3 },
  caseType: { fontSize: 11, fontWeight: "800", marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },

  rowDetails: { flexDirection: "row", alignItems: "center" },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 13, fontWeight: "800" },

  emptyContainer: { alignItems: "center", marginTop: 120, paddingHorizontal: 50 },
  emptyTitle: { fontSize: 20, fontWeight: "900", marginTop: 15 },
  emptySub: { fontSize: 14, textAlign: "center", marginTop: 10, lineHeight: 22, fontWeight: "500" },
});