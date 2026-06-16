import StatusBadge from '../../components/ui/StatusBadge';
// PATH: src/screens/police/PoliceSearchWarrantScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, Keyboard, StatusBar, Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { PoliceScreenProps } from "../../types/navigation";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

const performCIDSearch = async (query: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = [
        { id: 1, target: "Boureima Salou",              type: "MANDAT D'ARRÊT",        status: "VALIDE",   date: "2025-12-10", ref: "RG-442/25", origin: "Parquet Niamey" },
        { id: 2, target: "Quartier Plateau, Rue PL-42", type: "PERQUISITION",           status: "VALIDE",   date: "2025-12-22", ref: "CR-102/25", origin: "Tribunal C.O" },
        { id: 3, target: "Hamidou Moussa",              type: "MANDAT D'AMENER",        status: "EXÉCUTÉ",  date: "2025-12-05", ref: "RG-009/25", origin: "Juge d'Instruction" },
        { id: 4, target: "Abdoulaye Garba",             type: "INTERDICTION DE SORTIE", status: "VALIDE",   date: "2026-01-02", ref: "IS-004/26", origin: "DGSN" },
      ];
      resolve(data.filter(i =>
        i.target.toLowerCase().includes(query.toLowerCase()) ||
        i.ref.toLowerCase().includes(query.toLowerCase())
      ));
    }, 1000);
  });
};

export default function PoliceSearchWarrantScreen({ navigation }: PoliceScreenProps<'PoliceSearchWarrant'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults]         = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const colors = {
    bgMain:  isDark ? "#0F172A" : "#F8FAFC",
    bgCard:  isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub:  isDark ? "#94A3B8" : "#64748B",
    border:   isDark ? "#334155" : "#E2E8F0",
    inputBg:  isDark ? "#0F172A" : "#F1F5F9",
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await performCIDSearch(searchQuery);
      setResults(data as any[]);
    } catch {
      if (Platform.OS === 'web') window.alert("Échec de la liaison CID.");
      else Alert.alert("Erreur Liaison", "Impossible de joindre le fichier central criminel.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "VALIDE":   return { color: "#EF4444", bg: "#FEE2E2", label: "RECHERCHÉ",    icon: "alert-circle" };
      case "EXÉCUTÉ":  return { color: "#10B981", bg: "#DCFCE7", label: "DOSSIER CLOS", icon: "checkmark-circle" };
      default:         return { color: "#64748B", bg: "#F1F5F9", label: status,          icon: "information-circle" };
    }
  };

  const renderWarrant = ({ item }: { item: any }) => {
    const config = getStatusConfig(item.status);
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.resultCard, { backgroundColor: colors.bgCard, borderColor: colors.border, borderLeftColor: config.color }]}
        onPress={() => Alert.alert("Dossier Judiciaire", `Accéder au dossier complet ${item.ref} ?`)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: primaryColor + "15" }]}>
            <Text style={[styles.typeBadgeText, { color: primaryColor }]}>{item.type}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isDark ? config.color + "20" : config.bg }]}>
            <Ionicons name={config.icon as any} size={12} color={config.color} />
            <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>
        <Text style={[styles.targetName, { color: colors.textMain }]}>{item.target.toUpperCase()}</Text>
        <Text style={[styles.originText, { color: colors.textSub }]}>{item.origin}</Text>
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <Text style={[styles.refText, { color: primaryColor }]}>N° : {item.ref}</Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSub} />
            <Text style={[styles.dateText, { color: colors.textSub }]}>{item.date}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Fichier Central (CID)" showBack={true} />

      <View style={[styles.searchSection, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={20} color={primaryColor} />
          <TextInput
            style={[styles.searchInput, { color: colors.textMain }]}
            placeholder="Nom du suspect ou numéro RG..."
            placeholderTextColor={colors.textSub}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={colors.textSub} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity activeOpacity={0.7} style={[styles.searchBtn, { backgroundColor: primaryColor }]} onPress={handleSearch}>
          <Ionicons name="sync" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={[styles.loaderText, { color: colors.textSub }]}>Interrogation du Registre National...</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderWarrant}
            contentContainerStyle={styles.listPadding}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }]}>
                  <Ionicons name={hasSearched ? "search-outline" : "shield-half-outline"} size={60} color={colors.border} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>
                  {hasSearched ? "Aucun résultat" : "Identification"}
                </Text>
                <Text style={[styles.emptySub, { color: colors.textSub }]}>
                  {hasSearched
                    ? "Aucun titre de contrainte trouvé pour cette identité."
                    : "Saisissez un nom ou une référence pour vérifier les mandats actifs."}
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
  searchSection:  { padding: 15, flexDirection: 'row', gap: 10, alignItems: 'center', borderBottomWidth: 1 },
  searchBar:      { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderRadius: 16, height: 56, borderWidth: 1.5 },
  searchInput:    { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '700' },
  searchBtn:      { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  listPadding:    { padding: 15, paddingBottom: 120 },
  resultCard:     { padding: 20, borderRadius: 24, marginBottom: 15, borderWidth: 1.5, borderLeftWidth: 8, elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  typeBadge:      { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  typeBadgeText:  { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  statusBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusLabel:    { fontSize: 10, fontWeight: "900" },
  targetName:     { fontSize: 19, fontWeight: "900", marginBottom: 4, letterSpacing: -0.5 },
  originText:     { fontSize: 12, fontWeight: "700", marginBottom: 15, opacity: 0.8 },
  cardFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 15 },
  refText:        { fontSize: 13, fontWeight: "800" },
  dateRow:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText:       { fontSize: 11, fontWeight: '700' },
  loaderBox:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText:     { marginTop: 15, fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  emptyState:     { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconCircle:{ width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle:     { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  emptySub:       { textAlign: 'center', marginTop: 10, lineHeight: 22, fontSize: 14, fontWeight: '500' },
});