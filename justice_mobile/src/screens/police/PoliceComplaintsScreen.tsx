import StatusBadge from '../../components/ui/StatusBadge';
import React, { useCallback, memo, useMemo } from "react";
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, StatusBar, Alert, Platform
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { PoliceScreenProps } from "../../types/navigation";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import { getAllComplaints, updateComplaint } from "../../services/complaint.service";

const ComplaintCard = memo(({ item, onPress, onTakeCharge, colors, primaryColor }: any) => {
  const dateStr = item.createdAt || item.filedAt || new Date().toISOString();
  const formattedDate = new Date(dateStr).toLocaleDateString("fr-FR");

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.title, { color: colors.textMain }]} numberOfLines={1}>
          {item.title || `RG-#${item.id}`}
        </Text>
        <StatusBadge status={item.status} size="sm" />
      </View>

      <Text style={[styles.description, { color: colors.textSub }]} numberOfLines={2}>
        {item.description || "Détails non renseignés par le citoyen."}
      </Text>

      <View style={[styles.footerRow, { borderTopColor: colors.divider }]}>
        <View style={styles.dateInfo}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSub} />
          <Text style={[styles.dateText, { color: colors.textSub }]}>Reçu le {formattedDate}</Text>
        </View>

        {item.status === "soumise" ? (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.actionBtn, { backgroundColor: primaryColor }]}
            onPress={onTakeCharge}
          >
            <Text style={styles.actionBtnText}>Prendre en main</Text>
            <Ionicons name="finger-print-outline" size={14} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.detailsBtn}>
            <Text style={{ color: primaryColor, fontWeight: '800', fontSize: 12 }}>Consulter</Text>
            <Ionicons name="chevron-forward" size={16} color={primaryColor} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default function PoliceComplaintsScreen({ navigation }: PoliceScreenProps<'PoliceComplaints'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const queryClient = useQueryClient();

  const colors = {
    bgMain:  isDark ? "#0F172A" : "#F8FAFC",
    bgCard:  isDark ? "#1E293B" : "#FFFFFF",
    textMain:isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border:  isDark ? "#334155" : "#E2E8F0",
    divider: isDark ? "#334155" : "#F1F5F9",
  };

  const { data: rawResponse, isLoading, refetch } = useQuery({
    queryKey: ['complaints'],
    queryFn: getAllComplaints,
    staleTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // ✅ Extraction du wrapper { success, data }
  const complaints = useMemo(() => {
    if (!rawResponse) return [];
    const list = Array.isArray(rawResponse) ? rawResponse : (rawResponse as any)?.data || [];
    return [...list].sort((a: any, b: any) =>
      new Date(b.createdAt ?? b.filedAt ?? 0).getTime() -
      new Date(a.createdAt ?? a.filedAt ?? 0).getTime()
    );
  }, [rawResponse]);

  const handleTakeCharge = useCallback(async (id: number) => {
    try {
      // ✅ Transition vers en_cours_OPJ via updateComplaint
      await updateComplaint(id, { status: "en_cours_OPJ" } as any);
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      navigation.navigate("PoliceComplaintDetails", { complaintId: id });
    } catch {
      Alert.alert("Échec", "La prise en charge a échoué.");
    }
  }, [navigation, queryClient]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <ComplaintCard
      item={item}
      colors={colors}
      primaryColor={primaryColor}
      onPress={() => navigation.navigate("PoliceComplaintDetails", { complaintId: item.id })}
      onTakeCharge={() => handleTakeCharge(item.id)}
    />
  ), [colors, primaryColor, navigation, handleTakeCharge]);

  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  const ListEmpty = useCallback(() => (
    <View style={styles.emptyCenter}>
      <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? "#1E293B" : "#F8FAFC" }]}>
        <Ionicons name="file-tray-full-outline" size={60} color={colors.border} />
      </View>
      <Text style={[styles.emptyText, { color: colors.textSub }]}>
        Aucun dossier en attente de traitement.
      </Text>
    </View>
  ), [isDark, colors]);

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Répertoire e-Justice" showBack={true} />

      <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
        {isLoading && complaints.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={[styles.loadingText, { color: colors.textSub }]}>Accès au registre sécurisé...</Text>
          </View>
        ) : (
          <FlatList
            data={complaints}
            contentContainerStyle={styles.listPadding}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={8}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            initialNumToRender={10}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={primaryColor} />}
            ListEmptyComponent={ListEmpty}
          />
        )}
      </View>
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center:          { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText:     { marginTop: 15, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  listPadding:     { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 120 },
  emptyCenter:     { alignItems: "center", marginTop: 100 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText:       { fontSize: 14, fontWeight: '700', opacity: 0.7 },
  card:            { padding: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1.5, elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  cardHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title:           { fontSize: 16, fontWeight: "900", flex: 1, marginRight: 10, letterSpacing: -0.4 },
  description:     { fontSize: 13, marginBottom: 18, lineHeight: 20, fontWeight: '500' },
  footerRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: 15 },
  dateInfo:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText:        { fontSize: 11, fontWeight: '700' },
  actionBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  actionBtnText:   { color: "#fff", fontSize: 11, fontWeight: "900" },
  detailsBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
});