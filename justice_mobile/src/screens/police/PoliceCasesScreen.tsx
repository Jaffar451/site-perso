// PATH: src/screens/police/PoliceCasesScreen.tsx
import React, { useState, useMemo, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, StatusBar, Keyboard
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { PoliceScreenProps } from "../../types/navigation";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import { getAllComplaints } from "../../services/complaint.service";

export default function PoliceCasesScreen({ navigation }: PoliceScreenProps<'PoliceCases'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const { user } = useAuthStore();

  const [search, setSearch] = useState("");

  const colors = {
    bgMain:  isDark ? "#0F172A" : "#F8FAFC",
    bgCard:  isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub:  isDark ? "#94A3B8" : "#64748B",
    border:   isDark ? "#334155" : "#E2E8F0",
    inputBg:  isDark ? "#0F172A" : "#F1F5F9",
    divider:  isDark ? "#334155" : "#F1F5F9",
  };

  const { data: rawResponse, isLoading, refetch } = useQuery({
    queryKey: ["police-registry-complaints"],
    queryFn: getAllComplaints,
  });

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  // ✅ Extraction du wrapper { success, data }
  const complaints = useMemo(() => {
    if (!rawResponse) return [];
    return Array.isArray(rawResponse) ? rawResponse : (rawResponse as any)?.data || [];
  }, [rawResponse]);

  const filteredCases = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return complaints;
    return complaints.filter((c: any) =>
      (c.title?.toLowerCase() || "").includes(term) ||
      (c.description?.toLowerCase() || "").includes(term) ||
      (c.id?.toString() || "").includes(term) ||
      (c.complainant?.lastname?.toLowerCase() || "").includes(term) ||
      (c.citizen?.lastname?.toLowerCase() || "").includes(term)
    );
  }, [complaints, search]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "en_cours_OPJ":          return { color: "#F59E0B", label: "ENQUÊTE EN COURS",    icon: "search-outline" };
      case "attente_validation":    return { color: "#7C3AED", label: "VISA HIÉRARCHIQUE",   icon: "shield-half-outline" };
      case "transmise_parquet":     return { color: "#10B981", label: "TRANSMIS AU PARQUET", icon: "checkmark-done-circle-outline" };
      case "soumise":               return { color: "#2563EB", label: "NOUVEAU DOSSIER",     icon: "folder-open-outline" };
      case "classée_sans_suite_par_OPJ":
      case "classée_sans_suite_par_procureur":
                                    return { color: "#EF4444", label: "CLASSÉ SANS SUITE",   icon: "close-circle-outline" };
      default:                      return { color: "#64748B", label: "ARCHIVÉ / CLOS",      icon: "archive-outline" };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const badge = getStatusStyle(item.status);
    const dateStr = item.createdAt || item.filedAt || new Date().toISOString();
    const formattedDate = new Date(dateStr).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short', year: 'numeric' });

    // ✅ Supporte complainant ET citizen
    const plaignantName = item.complainant
      ? `${item.complainant.lastname || ""} ${item.complainant.firstname || ""}`.trim()
      : item.citizen
      ? `${item.citizen.lastname || ""} ${item.citizen.firstname || ""}`.trim()
      : "Non renseigné";

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
        onPress={() => navigation.navigate("PoliceComplaintDetails", { complaintId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.idBadge, { backgroundColor: primaryColor + "15" }]}>
            <Text style={[styles.idText, { color: primaryColor }]}>PV-#{item.id}</Text>
          </View>
          <Text style={[styles.date, { color: colors.textSub }]}>{formattedDate}</Text>
        </View>

        <Text style={[styles.title, { color: colors.textMain }]} numberOfLines={1}>
          {item.title || "Dossier sans titre"}
        </Text>

        <Text style={[styles.citizenName, { color: colors.textMain }]}>
          Plaignant : <Text style={{ fontWeight: '700' }}>{plaignantName}</Text>
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <View style={styles.footerRow}>
          <View style={[styles.statusBadge, { backgroundColor: badge.color + "12" }]}>
            <Ionicons name={badge.icon as any} size={14} color={badge.color} style={{ marginRight: 6 }} />
            <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSub} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Registre des Enquêtes" showMenu={true} />

      <View style={[styles.searchContainer, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSub} />
          <TextInput
            placeholder="Rechercher RG, nom ou motif..."
            placeholderTextColor={colors.textSub}
            style={[styles.searchInput, { color: colors.textMain }]}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color={colors.textSub} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
        {isLoading && complaints.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={[styles.loadingText, { color: colors.textSub }]}>Synchronisation CIJ...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCases}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listPadding}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={primaryColor} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="file-tray-full-outline" size={60} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Registre Vide</Text>
                <Text style={[styles.emptyText, { color: colors.textSub }]}>
                  {search.length > 0 ? `Aucun dossier trouvé pour "${search}".` : "Aucune plainte n'a été transmise à votre unité."}
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
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:     { marginTop: 15, fontSize: 11, fontWeight: "900", textTransform: 'uppercase', letterSpacing: 1 },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  searchBar:       { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 12, height: 48, borderWidth: 1 },
  searchInput:     { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600' },
  listPadding:     { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 140 },
  card:            { padding: 18, borderRadius: 24, marginBottom: 15, borderWidth: 1.5, elevation: 3, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  cardHeader:      { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, alignItems: 'center' },
  idBadge:         { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  idText:          { fontSize: 11, fontWeight: "900" },
  date:            { fontSize: 11, fontWeight: "700", opacity: 0.8 },
  title:           { fontSize: 17, fontWeight: "900", marginBottom: 4 },
  citizenName:     { fontSize: 13, marginBottom: 16, opacity: 0.9 },
  divider:         { height: 1, marginBottom: 14, opacity: 0.08 },
  footerRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText:      { fontSize: 10, fontWeight: "900", letterSpacing: 0.3 },
  emptyContainer:  { alignItems: "center", marginTop: 100, paddingHorizontal: 50 },
  emptyTitle:      { fontSize: 20, fontWeight: '900', marginTop: 15, marginBottom: 8 },
  emptyText:       { textAlign: 'center', fontSize: 14, lineHeight: 22 },
});