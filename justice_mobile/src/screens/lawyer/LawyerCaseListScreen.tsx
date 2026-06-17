import React, { useState, useMemo, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";

// ✅ 1. Imports Architecture
import { useAppTheme } from "../../theme/AppThemeProvider";
import { LawyerScreenProps } from "../../types/navigation";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// Services
import { getAllComplaints, Complaint } from "../../services/complaint.service";

export default function LawyerCaseListScreen({ navigation }: LawyerScreenProps<'LawyerCaseList'>) {
  // ✅ 2. Thème Dynamique
  const { theme, isDark } = useAppTheme();
  // Couleur Or pour l'avocat (ou primaire du thème)
  const primaryColor = isDark ? "#D4AF37" : theme.colors.primary; 
  
  const [search, setSearch] = useState("");

  // 🎨 PALETTE DYNAMIQUE
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#1E293B" : "#F8FAFC",
    searchWrapper: isDark ? "#1E293B" : "#FFFFFF",
  };

  // 🔄 Récupération des dossiers liés à l'avocat
  const { data: cases, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["lawyer-cases"],
    queryFn: getAllComplaints,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // 🔍 Logique de recherche (Client, Délit ou n° RG)
  const filteredCases = useMemo(() => {
    if (!cases) return [];
    const term = search.toLowerCase();
    
    // On peut aussi ajouter un filtre pour ne montrer que les dossiers assignés à l'avocat
    // (si le backend ne le fait pas déjà)
    return (cases as Complaint[]).filter(c => 
      c.trackingCode?.toLowerCase().includes(term) ||
      c.id.toString().includes(term) ||
      (c.citizen?.firstname + " " + c.citizen?.lastname).toLowerCase().includes(term) ||
      (c.provisionalOffence || "").toLowerCase().includes(term)
    );
  }, [cases, search]);

  const getStatusBadge = (status: string) => {
    const config: any = {
      instruction: { label: "INSTRUCTION", color: "#F59E0B" },
      audience_programmée: { label: "AUDIENCE", color: "#10B981" },
      transmise_parquet: { label: "AU PARQUET", color: "#3B82F6" },
      jugée: { label: "DÉCISION RENDUE", color: "#64748B" },
      non_lieu: { label: "NON-LIEU", color: "#94A3B8" },
    };
    return config[status] || { label: status.replace(/_/g, ' '), color: "#94A3B8" };
  };

  const renderCaseItem = ({ item }: { item: Complaint }) => {
    const status = getStatusBadge(item.status);
    const clientName = item.citizen 
      ? `${item.citizen.firstname} ${item.citizen.lastname}`
      : "Client Étatique";

    return (
      <TouchableOpacity 
        activeOpacity={0.85}
        style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
        // ✅ Navigation vers le détail
        onPress={() => navigation.navigate("LawyerCaseDetail", { caseId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.caseRef, { color: primaryColor }]}>N° RG {item.trackingCode || item.id}</Text>
          <View style={[styles.badge, { backgroundColor: status.color + "15" }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.clientRow}>
          <View style={styles.clientIcon}>
             <Ionicons name="person-circle" size={42} color={colors.textSub} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.clientName, { color: colors.textMain }]}>{clientName}</Text>
            <Text style={[styles.offenceText, { color: colors.textSub }]} numberOfLines={1}>
              {item.provisionalOffence || "Qualification en cours d'examen"}
            </Text>
          </View>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={styles.dateInfo}>
            <Ionicons name="calendar-outline" size={12} color={colors.textSub} />
            <Text style={[styles.dateText, { color: colors.textSub }]}>
                Saisi le {new Date(item.filedAt ?? item.createdAt ?? Date.now()).toLocaleDateString("fr-FR")}
            </Text>
          </View>
          <View style={styles.actionLink}>
            <Text style={[styles.linkText, { color: primaryColor }]}>Consulter</Text>
            <Ionicons name="arrow-forward" size={14} color={primaryColor} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Portefeuille Dossiers" showBack />

      {/* 🔍 BARRE DE RECHERCHE DYNAMIQUE */}
      <View style={[styles.searchWrapper, { backgroundColor: colors.searchWrapper, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSub} />
          <TextInput
            placeholder="Rechercher client ou n° RG..."
            placeholderTextColor={colors.textSub}
            style={[styles.input, { color: colors.textMain }]}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={colors.textSub} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
        {isLoading && !isRefetching ? (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={primaryColor} />
                <Text style={[styles.loaderText, { color: colors.textSub }]}>Accès au Barreau numérique...</Text>
            </View>
        ) : (
            <FlatList
            data={filteredCases}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCaseItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={primaryColor} />
            }
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={64} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.textSub }]}>
                    {search ? "Aucun dossier trouvé pour cette recherche." : "Vous n'avez aucun dossier actif dans votre portefeuille."}
                </Text>
                </View>
            }
            />
        )}
      </View>

      {/* ✅ SmartFooter autonome */}
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 15, fontSize: 13, fontWeight: "600" },
  
  searchWrapper: { 
    padding: 16, 
    borderBottomWidth: 1, 
  },
  searchInputContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 15, 
    height: 50, 
    borderRadius: 14, 
    borderWidth: 1,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: "500" },
  
  listContent: { padding: 16, paddingBottom: 120 },
  card: { 
    padding: 20, 
    borderRadius: 24, 
    marginBottom: 16, 
    borderWidth: 1, 
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 }
    })
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  caseRef: { fontSize: 13, fontWeight: "900", letterSpacing: 0.5 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  
  clientRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  clientIcon: { marginRight: 15 },
  clientName: { fontSize: 17, fontWeight: "800" },
  offenceText: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  
  cardFooter: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    borderTopWidth: 1, 
    paddingTop: 15 
  },
  dateInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 11, fontWeight: "700" },
  actionLink: { flexDirection: "row", alignItems: "center", gap: 6 },
  linkText: { fontSize: 12, fontWeight: "900", textTransform: 'uppercase' },
  
  emptyContainer: { alignItems: "center", marginTop: 100, paddingHorizontal: 40 },
  emptyText: { fontSize: 14, fontWeight: "600", textAlign: "center", marginTop: 15, lineHeight: 22 }
});