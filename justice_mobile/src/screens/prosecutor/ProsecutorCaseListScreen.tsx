import React, { useState, useMemo, useCallback } from "react";
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, 
  StatusBar, Platform, Keyboard, ActivityIndicator, RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { useAppTheme } from "../../theme/AppThemeProvider";
import { ProsecutorScreenProps } from "../../types/navigation";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import { getAllComplaints } from "../../services/complaint.service";

export default function ProsecutorCaseListScreen({ navigation }: ProsecutorScreenProps<'ProsecutorCaseList'>) {
  const { isDark } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const colors = {
    bgMain:        isDark ? "#0F172A" : "#F8FAFC",
    bgCard:        isDark ? "#1E293B" : "#FFFFFF",
    textMain:      isDark ? "#FFFFFF" : "#1E293B",
    textSub:       isDark ? "#94A3B8" : "#64748B",
    border:        isDark ? "#334155" : "#E2E8F0",
    justicePrimary: "#7C2D12",
    divider:       isDark ? "#334155" : "#F1F5F9",
  };

  const { data: cases = [], isLoading, refetch } = useQuery({
    queryKey: ["prosecutor-cases"],
    queryFn: getAllComplaints,
  });

  const filteredCases = useMemo(() => {
    if (!cases) return [];
    const term = searchQuery.toLowerCase();
    return cases.filter((c: any) => {
      const title = c.title?.toLowerCase() || "";
      const suspect = c.defendantName?.toLowerCase() || "";
      const ref = c.trackingCode?.toLowerCase() || "";
      const unit = c.originStation?.name?.toLowerCase() || "";
      return title.includes(term) || suspect.includes(term) || ref.includes(term) || unit.includes(term);
    });
  }, [searchQuery, cases]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'transmise_parquet':
      case 'nouveau':
        return { bg: isDark ? "#450A0A" : "#FEE2E2", text: "#EF4444", label: "À DÉCIDER" };
      case 'en_cours':
        return { bg: isDark ? "#1E3A8A" : "#DBEAFE", text: "#3B82F6", label: "ENRÔLÉ" };
      case 'instruction':
        return { bg: isDark ? "#14532D" : "#DCFCE7", text: "#10B981", label: "INSTRUIT" };
      default:
        return { bg: colors.divider, text: colors.textSub, label: status?.replace(/_/g, ' ') || "N/A" };
    }
  };

  const renderCase = useCallback(({ item }: { item: any }) => {
    const badge = getStatusBadge(item.status);
    const formattedDate = item.createdAt
      ? new Date(item.createdAt ?? Date.now()).toLocaleDateString("fr-FR")
      : "--/--";

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.caseCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
        onPress={() => { Keyboard.dismiss(); navigation.navigate('ProsecutorCaseDetail', { caseId: item.id }); }}
      >
        <View style={styles.caseHeader}>
          <View style={styles.refContainer}>
            <Ionicons name="document-text" size={16} color={colors.justicePrimary} />
            <Text style={[styles.caseRef, { color: colors.justicePrimary }]}>
              {item.trackingCode || `PV #${item.id}`}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <Text style={[styles.caseTitle, { color: colors.textMain }]} numberOfLines={2}>
          {item.title || "Infraction non qualifiée"}
        </Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={16} color={colors.textSub} />
            <Text style={[styles.infoText, { color: colors.textSub }]}>
              Mis en cause : <Text style={{ color: colors.textMain, fontWeight: '700' }}>
                {item.defendantName || "Inconnu"}
              </Text>
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={16} color={colors.textSub} />
            <Text style={[styles.infoText, { color: colors.textSub }]}>
              Origine : <Text style={{ color: colors.textMain }}>
                {item.originStation?.name || "Non spécifié"}
              </Text>
            </Text>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: colors.divider }]}>
          <View style={styles.dateContainer}>
            <Ionicons name="time-outline" size={14} color={colors.textSub} />
            <Text style={[styles.dateText, { color: colors.textSub }]}>Reçu le {formattedDate}</Text>
          </View>
          <View style={styles.actionRow}>
            <Text style={[styles.actionText, { color: colors.justicePrimary }]}>DÉCIDER</Text>
            <Ionicons name="chevron-forward-circle" size={20} color={colors.justicePrimary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [colors, navigation]);

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Réception des Plaintes" showBack />

      <View style={[styles.statsBar, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#EF4444" }]}>
            {cases.filter((c: any) => c.status === 'transmise_parquet' || c.status === 'nouveau').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSub }]}>URGENCES</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.justicePrimary }]}>{cases.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSub }]}>DOSSIERS REÇUS</Text>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
        <View style={styles.searchWrapper}>
          <View style={[styles.searchBar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textSub} />
            <TextInput
              placeholder="Rechercher par suspect, PV ou unité..."
              placeholderTextColor={colors.textSub}
              style={[styles.searchInput, { color: colors.textMain }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.textSub} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.justicePrimary} />
            <Text style={[styles.loadingText, { color: colors.textSub }]}>Chargement des dossiers...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCases}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listPadding}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            renderItem={renderCase}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.justicePrimary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="file-tray-outline" size={70} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.textSub }]}>
                  {searchQuery ? "Aucun résultat trouvé." : "Aucune transmission reçue pour le moment."}
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
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  loadingText:    { marginTop: 10, fontSize: 13, fontWeight: '600' },
  statsBar:       { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, elevation: 2 },
  statItem:       { flex: 1, alignItems: 'center' },
  statValue:      { fontSize: 20, fontWeight: '900' },
  statLabel:      { fontSize: 9, fontWeight: '800', marginTop: 2, textTransform: 'uppercase' },
  statDivider:    { width: 1, height: '50%', alignSelf: 'center' },
  searchWrapper:  { padding: 16 },
  searchBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 50, borderRadius: 14, borderWidth: 1.5 },
  searchInput:    { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600' },
  listPadding:    { paddingHorizontal: 16, paddingBottom: 120 },
  caseCard: {
    padding: 18, borderRadius: 22, marginBottom: 12, borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  caseHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  refContainer:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  caseRef:        { fontWeight: '900', fontSize: 13 },
  badge:          { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText:      { fontSize: 9, fontWeight: '900' },
  caseTitle:      { fontSize: 16, fontWeight: '800', marginBottom: 10, lineHeight: 22 },
  infoGrid:       { gap: 6 },
  infoRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText:       { fontSize: 13, fontWeight: '500' },
  footer:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, marginTop: 15, paddingTop: 12 },
  dateContainer:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText:       { fontSize: 11, fontWeight: '700' },
  actionRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText:     { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyText:      { textAlign: 'center', marginTop: 12, fontSize: 14, fontWeight: '600' },
});