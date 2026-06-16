import StatusBadge from '../../components/ui/StatusBadge';
import React, { useState, useMemo, useCallback } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl, 
  StatusBar,
  TouchableOpacity,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";

// ✅ 1. Imports Architecture Alignés
import { useAppTheme } from "../../theme/AppThemeProvider";
import { useAuthStore } from "../../stores/useAuthStore";
import { LawyerScreenProps } from "../../types/navigation";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// Services
import { getAllComplaints, Complaint } from "../../services/complaint.service";

export default function LawyerTrackingScreen({ navigation }: LawyerScreenProps<'LawyerTracking'>) {
  // ✅ 2. Thème & Auth
  const { theme, isDark } = useAppTheme();
  // Couleur Or pour l'avocat
  const primaryColor = isDark ? "#D4AF37" : theme.colors.primary; 
  const { user } = useAuthStore();
  
  // 🎨 PALETTE DYNAMIQUE
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    locationBg: isDark ? "#0F172A" : "#F8FAFC",
    iconBg: isDark ? "#334155" : "#FFFFFF",
  };

  /**
   * 📥 RÉCUPÉRATION DES DONNÉES (React Query)
   */
  const { data: cases, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["lawyer-tracking"],
    queryFn: getAllComplaints, // Idéalement, une route filtrée par avocat côté backend
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Filtrage local (si nécessaire) pour ne garder que les dossiers actifs
  const activeCases = useMemo(() => {
    if (!cases) return [];
    // On peut filtrer pour ne garder que ceux qui ont un numéro RG (donc en justice)
    return (cases as Complaint[]).filter(c => c.trackingCode || c.id);
  }, [cases]);

  /**
   * 🎨 GESTION DES STATUTS (Code Couleur Judiciaire)
   */
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'audience_programmée': return { color: "#10B981", bg: "#DCFCE7" }; // Vert
      case 'instruction': return { color: "#3B82F6", bg: "#DBEAFE" }; // Bleu
      case 'transmise_parquet': return { color: "#F59E0B", bg: "#FEF3C7" }; // Orange
      case 'jugée': return { color: "#64748B", bg: "#F1F5F9" }; // Gris
      default: return { color: "#64748B", bg: "#F1F5F9" };
    }
  };

  const renderItem = ({ item }: { item: Complaint }) => {
    const statusConfig = getStatusStyle(item.status);

    return (
      <TouchableOpacity 
        activeOpacity={0.85}
        onPress={() => navigation.navigate("LawyerCaseDetail", { caseId: item.id })}
        style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      >
        {/* Header : RG & Badge Statut */}
        <View style={styles.headerRow}>
          <View style={styles.rgContainer}>
            <View style={[styles.iconBox, { backgroundColor: primaryColor + "15" }]}>
                <Ionicons name="document-text" size={18} color={primaryColor} />
            </View>
            <Text style={[styles.rgNumber, { color: colors.textMain }]}>
                {item.trackingCode || `RG-${item.id}/25`}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <StatusBadge status={item.status} />
          </View>
        </View>
        
        {/* Localisation Physique au Palais */}
        <View style={[styles.locationBlock, { backgroundColor: colors.locationBg }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.iconBg }]}>
            <Ionicons name="location" size={20} color="#EF4444" />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.locationLabel, { color: colors.textSub }]}>EMPLACEMENT DU DOSSIER</Text>
            <Text style={[styles.roomText, { color: colors.textMain }]}>
               {item.station?.name || "Bureau du Greffe Central"} 
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSub} />
        </View>
        
        {/* Footer : Juridiction */}
        <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
          <View style={styles.courtInfo}>
            <Ionicons name="business-outline" size={14} color={colors.textSub} />
            <Text style={[styles.courtName, { color: colors.textSub }]}>
                Tribunal de Grande Instance
            </Text>
          </View>
          <Text style={[styles.dateText, { color: colors.textSub }]}>
              Màj : {new Date(item.updatedAt ?? item.filedAt ?? item.createdAt ?? Date.now()).toLocaleDateString("fr-FR")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Suivi des Affaires" showMenu={true} />

      <View style={[styles.mainContainer, { backgroundColor: colors.bgMain }]}>
        <View style={styles.pageHeader}>
          <Text style={[styles.title, { color: colors.textMain }]}>Répertoire Actif</Text>
          <Text style={[styles.subtitle, { color: colors.textSub }]}>Suivi temps-réel de l'acheminement des dossiers</Text>
        </View>

        {isLoading && !isRefetching ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={[styles.loadingText, { color: colors.textSub }]}>Accès au registre numérique...</Text>
          </View>
        ) : (
          <FlatList
            data={activeCases}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={primaryColor} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={64} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.textSub }]}>Aucun dossier suivi</Text>
                <Text style={[styles.emptySub, { color: colors.textSub }]}>
                  Vous n'êtes actuellement rattaché à aucune affaire en cours.
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
  mainContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 15 },
  pageHeader: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 4, fontWeight: "600" },
  listContainer: { paddingBottom: 120 },
  
  card: { 
    padding: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 }
    })
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  rgContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rgNumber: { fontWeight: "900", fontSize: 16 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  
  locationBlock: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 18 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 1 },
  locationLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 2 },
  roomText: { fontSize: 15, fontWeight: "800" },
  
  footerRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    marginTop: 18, paddingTop: 12, borderTopWidth: 1,
  },
  courtInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  courtName: { fontSize: 12, fontWeight: "700" },
  dateText: { fontSize: 11, fontWeight: "600" },

  center: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
  loadingText: { marginTop: 15, fontWeight: "700", fontSize: 13 },
  emptyContainer: { alignItems: "center", marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "900", marginTop: 15 },
  emptySub: { fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20, fontWeight: "500" }
});