import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, Platform, TextInput
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { useAppTheme } from "../../theme/AppThemeProvider";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import api from "../../services/api";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  preventive: { label: "Préventif", color: "#F59E0B" },
  convicted: { label: "Condamné", color: "#EF4444" },
  released: { label: "Libéré", color: "#10B981" },
  escaped: { label: "Évadé", color: "#7C3AED" },
};

export default function PrisonInmatesScreen({ navigation }: any) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = "#7C3AED";
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#FFFFFF",
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["prison-inmates"],
    queryFn: async () => {
      const res = await api.get("/incarcerations/inmates");
      return res.data?.data || res.data || [];
    },
  });

  const inmates = useMemo(() => {
    let list = Array.isArray(data) ? data : [];
    if (filter !== "all") list = list.filter((i: any) => i.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i: any) =>
        (i.detaineeData?.firstname || "").toLowerCase().includes(q) ||
        (i.detaineeData?.lastname || "").toLowerCase().includes(q) ||
        (i.cellNumber || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, filter, search]);

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Registre d'Écrou" showBack />

      <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
        <View style={styles.searchBar}>
          <View style={[styles.searchInput, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textSub} />
            <TextInput
              style={[styles.searchText, { color: colors.textMain }]}
              placeholder="Rechercher un détenu..."
              placeholderTextColor={colors.textSub}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <View style={styles.filterRow}>
          {[{ key: "all", label: "Tous" }, { key: "preventive", label: "Préventifs" }, { key: "convicted", label: "Condamnés" }].map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, { backgroundColor: filter === f.key ? primaryColor : colors.bgCard, borderColor: filter === f.key ? primaryColor : colors.border }]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, { color: filter === f.key ? "#FFF" : colors.textSub }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={primaryColor} /></View>
        ) : (
          <FlatList
            data={inmates}
            keyExtractor={(item: any) => String(item.id)}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            onRefresh={refetch}
            refreshing={isLoading}
            renderItem={({ item }) => {
              const d = item.detaineeData || {};
              const status = STATUS_LABELS[item.status] || STATUS_LABELS.preventive;
              return (
                <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.avatar, { backgroundColor: primaryColor + "20" }]}>
                      <Ionicons name="person" size={22} color={primaryColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.name, { color: colors.textMain }]}>
                        {(d.lastname || "").toUpperCase()} {d.firstname || ""}
                      </Text>
                      <Text style={[styles.meta, { color: colors.textSub }]}>
                        {d.gender === "M" ? "Homme" : "Femme"} • {d.nationality || "Nigérien(ne)"}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.color + "20" }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                  <View style={styles.cardDetails}>
                    <Text style={[styles.detail, { color: colors.textSub }]}>
                      <Ionicons name="grid-outline" size={12} /> Cellule : {item.cellNumber || "N/A"}
                    </Text>
                    <Text style={[styles.detail, { color: colors.textSub }]}>
                      <Ionicons name="calendar-outline" size={12} /> Entrée : {new Date(item.entryDate).toLocaleDateString("fr-FR")}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="people-outline" size={50} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.textSub }]}>Aucun détenu trouvé</Text>
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
  searchBar: { padding: 16, paddingBottom: 8 },
  searchInput: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48, gap: 10 },
  searchText: { flex: 1, fontSize: 15 },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  filterText: { fontSize: 11, fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 60 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "900" },
  meta: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "800" },
  cardDetails: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#E2E8F020" },
  detail: { fontSize: 11, fontWeight: "600" },
  emptyText: { fontSize: 15, fontWeight: "700", marginTop: 12 },
});
