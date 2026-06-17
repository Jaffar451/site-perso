import React, { useState, useCallback } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl,
  Platform,
  StatusBar
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ✅ 1. Architecture & Thème
import { useAppTheme } from "../../theme/AppThemeProvider"; // ✅ Hook dynamique
import { ClerkScreenProps } from "../../types/navigation";

// Services & Types
import { getAllComplaints, Complaint } from "../../services/complaint.service";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

export default function ClerkComplaintsScreen({ navigation }: ClerkScreenProps<'ClerkComplaints'>) {
  // ✅ 2. Thème Dynamique
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary; 
  
  const [refreshing, setRefreshing] = useState(false);

  // 🎨 PALETTE DYNAMIQUE
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#F1F5F9",
    badgeBg: isDark ? "#4C1D95" : "#F3E8FF",
    badgeText: isDark ? "#DDD6FE" : "#A855F7",
  };

  const { data: complaints, isLoading, refetch } = useQuery<Complaint[]>({
    queryKey: ["clerk-complaints"],
    queryFn: getAllComplaints,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  /**
   * 🛡️ FILTRE GREFFE : Dossiers transmis par le parquet
   */
  const incomingComplaints = complaints?.filter((c: Complaint) => c.status === "transmise_parquet") || [];

  const renderItem = ({ item }: { item: Complaint }) => (
    <TouchableOpacity 
      activeOpacity={0.85}
      style={[
        styles.card, 
        { 
          backgroundColor: colors.bgCard,
          borderColor: colors.border
        }
      ]}
      onPress={() => navigation.navigate("ClerkComplaintDetails" as any, { id: item.id })}
    >
      <View style={styles.header}>
        <View style={[styles.badgeContainer, { backgroundColor: colors.badgeBg }]}>
           <View style={[styles.badgeDot, { backgroundColor: colors.badgeText }]} />
           <Text style={[styles.badgeText, { color: colors.badgeText }]}>VALIDÉ PARQUET</Text>
        </View>
        <Text style={[styles.date, { color: colors.textSub }]}>
          {item.filedAt ? format(new Date(item.filedAt ?? item.createdAt ?? Date.now()), "dd MMM yyyy", { locale: fr }) : "Date NC"}
        </Text>
      </View>

      <Text style={[styles.title, { color: colors.textMain }]}>
        {item.provisionalOffence || item.title || "Information Judiciaire"}
      </Text>
      
      <Text numberOfLines={2} style={[styles.desc, { color: colors.textSub }]}>
        {item.description || "Aucun descriptif technique fourni."}
      </Text>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.citizenRow}>
            <Ionicons name="person-circle-outline" size={16} color={primaryColor} />
            <Text style={[styles.footerText, { color: colors.textMain }]} numberOfLines={1}>
              {item.citizen ? `${item.citizen.firstname} ${item.citizen.lastname?.toUpperCase()}` : "Ministère Public"}
            </Text>
        </View>
        
        <View style={[styles.actionPrompt, { backgroundColor: primaryColor }]}>
          <Text style={styles.actionLabel}>ENRÔLER</Text>
          <Ionicons name="chevron-forward" size={12} color="#FFF" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Enrôlement (RP/RG)" showMenu={true} />
      
      <View style={[styles.mainWrapper, { backgroundColor: colors.bgMain }]}>
        {isLoading && !refreshing ? (
          <View style={styles.centerLoading}>
             <ActivityIndicator size="large" color={primaryColor} />
             <Text style={[styles.loadingText, { color: colors.textSub }]}>
               Accès au registre sécurisé...
             </Text>
          </View>
        ) : (
          <FlatList 
            data={incomingComplaints}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor={primaryColor} 
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? "#1E293B" : "#F8FAFC" }]}>
                   <Ionicons name="documents-outline" size={60} color={isDark ? colors.border : "#E2E8F0"} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Aucun dossier en attente</Text>
                <Text style={[styles.emptySub, { color: colors.textSub }]}>
                  Tous les dossiers transmis par le Procureur ont été traités par le Greffe.
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
  centerLoading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 15, fontWeight: "700", fontSize: 13 },
  card: { 
    padding: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
      android: { elevation: 2 },
      web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.08)" }
    })
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  badgeContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  badgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  badgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  date: { fontSize: 11, fontWeight: "800" },
  title: { fontSize: 17, fontWeight: "900", marginBottom: 8, letterSpacing: -0.5 },
  desc: { fontSize: 13, marginBottom: 18, lineHeight: 20, fontWeight: "500" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1.5, paddingTop: 14 },
  citizenRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  footerText: { fontSize: 13, fontWeight: "800" },
  actionPrompt: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 12 
  },
  actionLabel: { fontSize: 10, fontWeight: "900", color: "#FFF", letterSpacing: 1 },
  emptyContainer: { alignItems: "center", marginTop: 100, paddingHorizontal: 50 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "900", marginBottom: 10 },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 22, fontWeight: "500" }
});