import React, { useMemo, useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  StatusBar,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { useAppTheme } from "../../theme/AppThemeProvider";
import { PoliceScreenProps } from "../../types/navigation";
import api from "../../services/api";

import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

interface ApiCustodyData {
  id: number;
  startedAt: string;
  reason: string;
  status: 'en_cours' | 'levée' | 'prolongée' | 'convertie';
  maxDurationHours: number;
  suspect?: { firstName: string; lastName: string };
  orderedByUser?: { firstname: string; lastname: string };
}

interface GAVEntry {
  id: string;
  name: string;
  startTime: Date;
  offence: string;
  unit: string;
  status: string;
  maxDurationHours: number;
  timeData: { hoursRemaining: number; isCritical: boolean; isWarning: boolean; progress: number };
}

const fetchActiveCustodies = async (): Promise<ApiCustodyData[]> => {
  const { data } = await api.get("/custodies/active");
  // Sécurisation contre les réponses malformées
  return Array.isArray(data?.data) ? data.data : [];
};

// Calcul externalisé pour éviter la duplication
const calculateTimeLeft = (startTime: Date, maxHours: number = 48) => {
  if (isNaN(startTime.getTime())) return { hoursRemaining: 0, isCritical: false, isWarning: false, progress: 1 };

  const elapsed = (Date.now() - startTime.getTime()) / (1000 * 60 * 60);
  const remaining = maxHours - elapsed;

  return {
    hoursElapsed: Math.floor(elapsed),
    hoursRemaining: Math.max(0, Math.floor(remaining)),
    isCritical: remaining < 6,
    isWarning: remaining >= 6 && remaining < 18,
    progress: Math.min(1, Math.max(0, elapsed / maxHours))
  };
};

export default function CommissaireGAVSupervisionScreen({ navigation }: PoliceScreenProps<'CommissaireGAVSupervision'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    track: isDark ? "#0F172A" : "#F1F5F9",
    error: "#EF4444",
    warning: "#F59E0B",
    success: "#10B981"
  };

  const { 
    data: rawData, 
    isLoading, 
    refetch, 
    isRefetching, 
    error 
  } = useQuery({
    queryKey: ['active-custodies'],
    queryFn: fetchActiveCustodies,
    refetchInterval: 60000,
    retry: 2,
    staleTime: 30000,
  });

  // Force un re-render chaque seconde pour mettre à jour les timers en temps réel
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const entries: GAVEntry[] = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return [];

    return rawData.map((item) => ({
      id: item.id.toString(),
      name: item.suspect ? `${item.suspect.firstName} ${item.suspect.lastName}` : "Inconnu",
      startTime: new Date(item.startedAt),
      offence: item.reason || "Motif non spécifié",
      unit: item.orderedByUser ? `${item.orderedByUser.firstname} ${item.orderedByUser.lastname}` : "Unité indéterminée",
      status: (item.status || 'en_cours').replace(/_/g, ' '),
      maxDurationHours: item.maxDurationHours ?? 48,
      timeData: calculateTimeLeft(new Date(item.startedAt), item.maxDurationHours ?? 48)
    }));
  }, [rawData, setTick]); // `tick` force le recalcul chaque seconde

  const getStatusColor = useCallback((time: GAVEntry['timeData']) => {
    if (time.isCritical) return colors.error;
    if (time.isWarning) return colors.warning;
    return colors.success;
  }, [colors]);

  const renderGAVCard = ({ item }: { item: GAVEntry }) => {
    const accentColor = getStatusColor(item.timeData);

    return (
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.personInfo}>
            <Text style={[styles.name, { color: colors.textMain }]}>{item.name}</Text>
            <Text style={[styles.unit, { color: colors.textSub }]}>{item.unit}</Text>
          </View>
          <View style={[styles.timerBadge, { backgroundColor: accentColor + "20" }]}>
            <Ionicons name="time-outline" size={14} color={accentColor} />
            <Text style={[styles.timerText, { color: accentColor }]}>
              {item.timeData.hoursRemaining}h restants
            </Text>
          </View>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: colors.track }]}>
          <View style={[styles.progressBar, { width: `${item.timeData.progress * 100}%`, backgroundColor: accentColor }]} />
        </View>

        <View style={styles.detailsRow}>
          <Text style={[styles.offenceLabel, { color: colors.textSub }]}>
            Motif : <Text style={{ color: colors.textMain, fontWeight: '700' }}>{item.offence}</Text>
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (Platform.OS === 'web') window.alert(`Action Requise\n\nTraiter la prolongation pour le dossier #${item.id} ?`);
              else Alert.alert("Action Requise", `Traiter la prolongation pour le dossier #${item.id} ?`);
            }}
            style={[styles.extendBtn, { borderColor: primaryColor }]}
          >
            <Text style={[styles.extendText, { color: primaryColor }]}>VISER PROLONGATION</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 🟢 UI d'erreur explicite pour le 500
  if (error) {
    return (
      <ScreenContainer withPadding={false}>
        <StatusBar barStyle="light-content" />
        <AppHeader title="Supervision Garde à Vue" showBack />
        <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.textMain }]}>Impossible de charger les données</Text>
          <Text style={[styles.errorText, { color: colors.textSub }]}>
            Le serveur a retourné une erreur. Vérifiez la connexion ou réessayez.
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: primaryColor }]}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
        <SmartFooter />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Supervision Garde à Vue" showBack />

      <View style={[styles.mainWrapper, { backgroundColor: colors.bgMain }]}>
        <View style={[styles.statsBanner, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            {isLoading ? <ActivityIndicator size="small" color={colors.textMain} /> : (
              <Text style={[styles.statNum, { color: colors.textMain }]}>{entries.length}</Text>
            )}
            <Text style={[styles.statLabel, { color: colors.textSub }]}>En cellule</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            {isLoading ? <ActivityIndicator size="small" color={colors.error} /> : (
              <Text style={[styles.statNum, { color: colors.error }]}>
                {entries.filter(e => e.timeData.isCritical).length}
              </Text>
            )}
            <Text style={[styles.statLabel, { color: colors.textSub }]}>Alertes 6h</Text>
          </View>
        </View>

        {isLoading && !isRefetching ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={{ marginTop: 10, color: colors.textSub }}>Chargement des GAV...</Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={renderGAVCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={primaryColor} />
            }
            ListHeaderComponent={
              <Text style={[styles.sectionTitle, { color: colors.textSub }]}>
                Registre temps réel (Délai 48h)
              </Text>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={60} color={colors.textSub} style={{ opacity: 0.5 }} />
                <Text style={{ color: colors.textSub, marginTop: 10 }}>Aucune garde à vue en cours.</Text>
              </View>
            }
          />
        )}
      </View>

      <SmartFooter />
    </ScreenContainer>
  );
}

// ✅ Styles optimisés & compatibilité Web
const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  listContent: { padding: 16, paddingBottom: 140 },
  sectionTitle: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 20, textTransform: 'uppercase' },

  statsBanner: { 
    flexDirection: 'row', padding: 20, margin: 16, borderRadius: 24, alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, 
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 4 },
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' }
    })
  },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: "900" },
  statLabel: { fontSize: 10, fontWeight: "800", marginTop: 4, textTransform: 'uppercase' },
  divider: { width: 1, height: 40 },

  card: {
    padding: 20, borderRadius: 28, marginBottom: 16, borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 },
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' }
    })
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  personInfo: { flex: 1, marginRight: 10 },
  name: { fontSize: 18, fontWeight: "900", letterSpacing: -0.5 },
  unit: { fontSize: 11, fontWeight: "700", marginTop: 4 },

  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  timerText: { fontSize: 11, fontWeight: "900" },

  progressTrack: { height: 8, borderRadius: 4, marginBottom: 20, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4 },

  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  offenceLabel: { fontSize: 12, fontWeight: "600" },
  extendBtn: { borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  extendText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  
  errorTitle: { fontSize: 18, fontWeight: "700", marginTop: 12, textAlign: 'center' },
  errorText: { fontSize: 14, marginTop: 6, textAlign: 'center', marginBottom: 20 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#FFF', fontWeight: "800", fontSize: 14 }
});