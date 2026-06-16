import React, { useCallback } from "react"; 
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  StatusBar,
  Platform,
  RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Surface, Button, List, ActivityIndicator, Switch, Divider } from "react-native-paper";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Architecture
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import { useAppTheme } from "../../theme/AppThemeProvider";

// SERVICES API
import { 
  getSystemHealth, 
  getSystemLogs, 
  clearServerCache,
  getMaintenanceStatus, 
  setMaintenanceStatus  
} from "../../services/admin.service";

export default function AdminMaintenanceScreen() {
  const { theme, isDark } = useAppTheme();
  const queryClient = useQueryClient();
  
  // 🎨 PALETTE DE COULEURS
  const colors = {
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6"
  };

  // 1. SANTÉ SYSTÈME & BDD (Données synchronisées)
  const { 
    data: healthRes, 
    isFetching: isFetchingHealth, 
    refetch: refetchHealth 
  } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: getSystemHealth,
    refetchInterval: 30000, // Auto-sync toutes les 30s
  });
  const health = healthRes?.data;

  // 2. LOGS SYSTÈME
  const { data: logsRes, isLoading: loadingLogs } = useQuery({
    queryKey: ['systemLogs'],
    queryFn: getSystemLogs,
  });
  const logs = logsRes?.data || [];

  // 3. ÉTAT MAINTENANCE
  const { data: maintenanceRes, isLoading: loadingMaint } = useQuery({
    queryKey: ['maintenanceStatus'],
    queryFn: getMaintenanceStatus,
  });
  const isMaintenanceActive = maintenanceRes?.data?.isActive || maintenanceRes?.data?.enabled || false;

  // 4. MUTATION : ACTIVER/DÉSACTIVER MAINTENANCE
  const maintenanceMutation = useMutation({
    mutationFn: (active: boolean) => setMaintenanceStatus({ isActive: active }),
    onSuccess: (newData: any) => {
      queryClient.setQueryData(['maintenanceStatus'], newData);
      const state = (newData.data?.isActive || newData.data?.enabled) ? "ACTIVÉ" : "DÉSACTIVÉ";
      const msg = `Le mode maintenance est désormais ${state}.`;
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Succès", msg);
    },
    onError: () => {
      const msg = "Impossible de modifier l'état de maintenance.";
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Erreur", msg);
    }
  });

  // 5. MUTATION : VIDER CACHE
  const clearCacheMutation = useMutation({
    mutationFn: clearServerCache,
    onSuccess: () => {
      const msg = "Le cache serveur a été vidé avec succès.";
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Succès", msg);
    }
  });

  // 🔄 FONCTION DE SYNCHRONISATION GLOBALE
  const onRefresh = useCallback(async () => {
    try {
      await Promise.all([
        refetchHealth(),
        queryClient.invalidateQueries({ queryKey: ['systemLogs'] }),
        queryClient.invalidateQueries({ queryKey: ['maintenanceStatus'] })
      ]);
    } catch (err) {
      console.error("Erreur de synchronisation:", err);
    }
  }, [refetchHealth, queryClient]);

  const toggleMaintenance = () => {
    const nextState = !isMaintenanceActive;
    const message = nextState 
      ? "⚠️ Activer la maintenance ? L'accès sera coupé pour tous les utilisateurs non-admin." 
      : "Désactiver la maintenance ? Les utilisateurs pourront à nouveau se connecter.";

    if (Platform.OS === 'web') {
      if (window.confirm(message)) maintenanceMutation.mutate(nextState);
    } else {
      Alert.alert("Confirmation", message, [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Confirmer", 
          onPress: () => maintenanceMutation.mutate(nextState),
          style: nextState ? "destructive" : "default"
        }
      ]);
    }
  };

  const getLogColor = (action: string) => {
    const act = action?.toUpperCase() || "";
    if (act.includes('ERROR') || act.includes('FAIL') || act.includes('DELETE')) return colors.error;
    if (act.includes('UPDATE') || act.includes('PATCH')) return colors.warning;
    return colors.success; 
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Maintenance Système" showBack={true} />

      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isFetchingHealth} 
            onRefresh={onRefresh} 
            colors={[colors.success]} 
            tintColor={colors.success}
          />
        }
      >
        
        <Text style={[styles.sectionTitle, { color: colors.textSub }]}>ÉTAT DES SERVICES (LIVE)</Text>
        <View style={styles.grid}>
          {/* STATUT API */}
          <StatusCard 
            label="Serveur API" 
            value={health?.status === 'healthy' ? "Opérationnel" : "Indisponible"} 
            status={health?.status === 'healthy' ? 'ok' : 'error'} 
            colors={colors} icon="server-outline" 
          />
          
          {/* STATUT BDD SYNCHRONISÉ */}
          <StatusCard 
            label="Base de Données" 
            value={health?.database === 'connected' ? "Connectée" : "Déconnectée"} 
            status={health?.database === 'connected' ? 'ok' : 'error'} 
            colors={colors} icon="database-outline" 
          />

          {/* LATENCE / PERFORMANCE */}
          <StatusCard 
            label="Latence API" 
            value={health?.latency ? `${health.latency}ms` : "--"} 
            status={health?.latency < 250 ? 'ok' : 'warning'} 
            colors={colors} icon="pulse-outline" 
          />

          {/* MÉMOIRE SYSTÈME */}
          <StatusCard 
            label="Mémoire (RSS)" 
            value={health?.memory ? `${Math.round(health.memory.rss / 1024 / 1024)} MB` : "--"} 
            status="info" colors={colors} icon="hardware-chip-outline" 
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSub, marginTop: 25 }]}>CONTRÔLE DU SYSTÈME</Text>
        <Surface style={[styles.card, { backgroundColor: colors.bgCard }]} elevation={1}>
            <List.Item
              title="Mode Maintenance"
              titleStyle={{ color: colors.textMain, fontWeight: '700', fontSize: 14 }}
              description="Bloquer l'accès à l'application"
              left={props => <List.Icon {...props} icon="alert-octagon" color={isMaintenanceActive ? colors.error : colors.textSub} />}
              right={() => (
                <Switch 
                  value={isMaintenanceActive} 
                  onValueChange={toggleMaintenance} 
                  color={colors.error}
                  disabled={maintenanceMutation.isPending || loadingMaint}
                />
              )}
            />
            <Divider style={{ backgroundColor: colors.border }} />
            <List.Item
              title="Vider le Cache"
              titleStyle={{ color: colors.textMain, fontWeight: '700', fontSize: 14 }}
              description="Forcer la purge des données temporaires"
              left={props => <List.Icon {...props} icon="cached" color={colors.warning} />}
              right={() => (
                <Button 
                    mode="text" 
                    onPress={() => clearCacheMutation.mutate()} 
                    loading={clearCacheMutation.isPending}
                    textColor={colors.warning} 
                    labelStyle={{ fontSize: 12, fontWeight: 'bold' }}
                >
                    NETTOYER
                </Button>
              )}
            />
        </Surface>

        <Text style={[styles.sectionTitle, { color: colors.textSub, marginTop: 25 }]}>JOURNAUX D'AUDIT (SYNCHRONISÉS)</Text>
        <View style={[styles.logsContainer, { backgroundColor: isDark ? "#0F172A" : "#1E293B" }]}>
            {loadingLogs ? (
                <ActivityIndicator color="#FFF" style={{ padding: 20 }} />
            ) : logs.length > 0 ? (
                logs.slice(0, 10).map((log: any, index: number) => (
                    <View key={log.id || index} style={styles.logRow}>
                        <Text style={styles.logTime}>
                            {new Date(log.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Text>
                        <Text style={[styles.logType, { color: getLogColor(log.action) }]}>
                            {log.action?.substring(0, 15).toUpperCase()}
                        </Text>
                        <Text style={styles.logMsg} numberOfLines={1}>
                            {log.entity || "SYSTEM"}
                        </Text>
                    </View>
                ))
            ) : (
                <Text style={{ color: '#64748B', textAlign: 'center', padding: 20 }}>Aucune activité récente.</Text>
            )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const StatusCard = ({ label, value, status, colors, icon }: any) => {
    const getColor = () => {
        if (status === 'ok') return colors.success;
        if (status === 'error') return colors.error;
        if (status === 'warning') return colors.warning;
        return colors.info;
    };
    return (
        <View style={[styles.statusCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Ionicons name={icon} size={18} color={getColor()} style={{ marginBottom: 6 }} />
            <Text style={[styles.statusValue, { color: colors.textMain }]} numberOfLines={1}>{value}</Text>
            <Text style={[styles.statusLabel, { color: colors.textSub }]}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  sectionTitle: { fontSize: 10, fontWeight: "900", marginBottom: 12, letterSpacing: 1, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusCard: { 
      width: '48.5%', padding: 14, borderRadius: 16, borderWidth: 1, 
  },
  statusValue: { fontSize: 13, fontWeight: 'bold' },
  statusLabel: { fontSize: 9, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
  card: { borderRadius: 16, overflow: 'hidden', paddingVertical: 4 },
  logsContainer: { borderRadius: 12, padding: 12 },
  logRow: { flexDirection: 'row', marginBottom: 10, gap: 8, alignItems: 'center' },
  logTime: { color: '#94A3B8', fontSize: 10, width: 45, fontWeight: '500' },
  logType: { fontWeight: 'bold', fontSize: 9, width: 95 },
  logMsg: { color: '#E2E8F0', fontSize: 10, flex: 1 },
});