// PATH: src/screens/police/PoliceArrestWarrantScreen.tsx
import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ✅ Architecture & UI
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { PoliceScreenProps } from "../../types/navigation";

// ✅ Services
import { getActiveWarrants, executeWarrant } from "../../services/arrestWarrant.service";

interface Warrant {
  id: number;
  caseId: number;
  personName: string;
  reason: string;
  urgency: "normal" | "high" | "critical";
  createdAt: string;
}

export default function PoliceArrestWarrantScreen({ navigation }: PoliceScreenProps<'PoliceArrestWarrant'>) {
  const { theme, isDark } = useAppTheme();
  const queryClient = useQueryClient();
  const primaryColor = theme.colors.primary;

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    divider: isDark ? "#334155" : "#F1F5F9",
  };

  // 🔄 1. RECUPERATION VIA REACT QUERY
  const { data: warrants = [], isLoading, refetch, isRefetching } = useQuery<Warrant[]>({
    queryKey: ["active-warrants"],
    queryFn: getActiveWarrants,
  });

  // 🔄 2. MUTATION POUR L'EXECUTION
  const arrestMutation = useMutation({
    mutationFn: (warrantId: number) => executeWarrant(warrantId),
    onSuccess: (_, warrantId) => {
      queryClient.invalidateQueries({ queryKey: ["active-warrants"] });
      
      const apprehended = warrants.find(w => w.id === warrantId);
      
      // ✅ FIX TypeScript : Extraction avec valeurs par défaut ou blocage si nul
      if (!apprehended) return;

      const cId: number = apprehended.caseId;
      const sName: string = apprehended.personName;

      const successMsg = `L'arrestation de ${sName.toUpperCase()} a été enregistrée.`;
      
      const navigateToGAV = () => navigation.navigate("PoliceCustody", { 
        complaintId: cId, 
        suspectName: sName 
      });

      if (Platform.OS === 'web') {
        if (window.confirm(`${successMsg}\n\nVoulez-vous ouvrir le registre de Garde à Vue ?`)) {
          navigateToGAV();
        }
      } else {
        Alert.alert(
          "Individu Appréhendé ✅",
          successMsg + "\n\nVoulez-vous ouvrir le registre de Garde à Vue ?",
          [
            { text: "Plus tard", style: "default" },
            { text: "Ouvrir G.A.V", onPress: navigateToGAV }
          ]
        );
      }
    },
    onError: () => {
      Alert.alert("Erreur ❌", "Le serveur central est injoignable.");
    }
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleExecuteWarrant = (item: Warrant) => {
    const confirmMsg = `Confirmez-vous l'appréhension de ${item.personName.toUpperCase()} ?`;
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) arrestMutation.mutate(item.id);
    } else {
      Alert.alert("⚖️ Exécution de Mandat", confirmMsg, [
        { text: "Annuler", style: "cancel" },
        { text: "Confirmer l'arrestation", style: "destructive", onPress: () => arrestMutation.mutate(item.id) }
      ]);
    }
  };

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case "critical": return { color: "#EF4444", label: "RECHERCHÉ / DANGER", icon: "alert-circle" };
      case "high": return { color: "#F59E0B", label: "PRIORITÉ HAUTE", icon: "warning" };
      default: return { color: "#10B981", label: "PROCÉDURE NORMALE", icon: "document-text" };
    }
  };

  const renderWarrantItem = ({ item }: { item: Warrant }) => {
    const config = getUrgencyConfig(item.urgency);
    return (
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border, borderLeftColor: config.color }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: config.color + "15" }]}>
            <Ionicons name={config.icon as any} size={12} color={config.color} />
            <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
          </View>
          <Text style={[styles.dateText, { color: colors.textSub }]}>
            Émis le {new Date(item.createdAt ?? Date.now()).toLocaleDateString("fr-FR")}
          </Text>
        </View>

        <Text style={[styles.personName, { color: colors.textMain }]}>{item.personName.toUpperCase()}</Text>
        
        <View style={[styles.reasonBox, { backgroundColor: isDark ? "#0F172A" : "#F8FAFC" }]}>
            <Text style={[styles.reason, { color: colors.textSub }]}>
                <Text style={{fontWeight: '900', color: colors.textMain}}>MOTIF : </Text>{item.reason}
            </Text>
        </View>
        
        <View style={[styles.cardFooter, { borderTopColor: colors.divider }]}>
          <View style={styles.caseIdContainer}>
              <Ionicons name="folder-open" size={16} color={primaryColor} />
              <Text style={[styles.caseIdText, { color: primaryColor }]}>RG #{item.caseId}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: primaryColor }]} 
            onPress={() => handleExecuteWarrant(item)}
            disabled={arrestMutation.isPending}
          >
            {arrestMutation.isPending ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Text style={styles.actionBtnText}>ARRÊTER</Text>
                <Ionicons name="hand-right" size={16} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Mandats d'Arrêt" showBack={true} />
      
      {isLoading && !isRefetching ? (
        <View style={styles.center}><ActivityIndicator size="large" color={primaryColor} /></View>
      ) : (
        <FlatList
          data={warrants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderWarrantItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={primaryColor} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-checkmark" size={70} color="#10B981" />
              <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Aucun Mandat Actif</Text>
            </View>
          }
        />
      )}
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 140 },
  card: { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderLeftWidth: 8 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16, alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: "900" },
  dateText: { fontSize: 11, fontWeight: '700' },
  personName: { fontSize: 22, fontWeight: "900", marginBottom: 12 },
  reasonBox: { padding: 14, borderRadius: 14, marginBottom: 20 },
  reason: { fontSize: 13, lineHeight: 20 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: 16 },
  caseIdContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  caseIdText: { fontWeight: '900', fontSize: 13 },
  actionBtn: { paddingHorizontal: 16, height: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 110, justifyContent: 'center' },
  actionBtnText: { color: "#fff", fontWeight: "900", fontSize: 11 },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: "900", marginTop: 20 }
});