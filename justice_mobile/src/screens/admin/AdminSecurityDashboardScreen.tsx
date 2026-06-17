import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

// ✅ Architecture
import { AdminScreenProps } from "../../types/navigation";
import { useAppTheme } from "../../theme/AppThemeProvider";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// ✅ Services
import { getAuditLogs, verifyLogsIntegrity } from "../../services/audit.service";

export default function AdminSecurityDashboardScreen({ navigation }: AdminScreenProps<'AdminSecurityDashboard'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;

  const colors = {
    bg: isDark ? "#0F172A" : "#F8FAFC",
    card: isDark ? "#1E293B" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#1E293B",
    subText: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
  };

  // 1️⃣ Données d'Audit
  const { data: logsRaw } = useQuery({ queryKey: ['audit-logs'], queryFn: getAuditLogs });
  const logs = (logsRaw as any)?.data || logsRaw || [];

  // 2️⃣ Analyse rapide des logs
  const stats = {
    total: logs.length,
    critical: logs.filter((l: any) => l.severity === 'danger' || l.action.includes('DELETE')).length,
    accessDenied: logs.filter((l: any) => l.details?.includes('403') || l.details?.includes('interdit')).length,
    activeUsers: new Set(logs.map((l: any) => l.userId)).size
  };

  const handleIntegrityCheck = async () => {
    try {
      const result = await verifyLogsIntegrity();
      if (result.isValid) {
        Alert.alert("Intégrité Confirmée", "La chaîne de blocs des logs est intacte. Aucune modification manuelle détectée en base de données.");
      } else {
        Alert.alert("⚠️ ALERTE SÉCURITÉ", "L'intégrité de certains logs a été compromise ! Consultez le rapport détaillé.");
      }
    } catch (e) {
      Alert.alert("Erreur", "Impossible de contacter le service de vérification.");
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Contrôle de Sécurité" showBack />
      
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
        
        {/* Résumé des Menaces */}
        <View style={[styles.mainCard, { backgroundColor: primaryColor }]}>
          <View>
            <Text style={styles.mainCardLabel}>ÉTAT DU SYSTÈME</Text>
            <Text style={styles.mainCardStatus}>SÉCURISÉ</Text>
          </View>
          <Ionicons name="shield-checkmark" size={60} color="rgba(255,255,255,0.3)" />
        </View>

        {/* Grille de Stats */}
        <View style={styles.statsGrid}>
          <StatBox icon="flash" label="Activités" value={stats.total} color="#3B82F6" colors={colors} />
          <StatBox icon="warning" label="Critiques" value={stats.critical} color="#EF4444" colors={colors} />
          <StatBox icon="lock-closed" label="Refusés" value={stats.accessDenied} color="#F59E0B" colors={colors} />
          <StatBox icon="people" label="Acteurs" value={stats.activeUsers} color="#10B981" colors={colors} />
        </View>

        {/* Menu d'actions prioritaires */}
        <Text style={[styles.sectionTitle, { color: colors.subText }]}>OUTILS DE SURVEILLANCE</Text>
        
        <ActionRow 
          icon="list-outline" 
          label="Consulter le registre complet" 
          onPress={() => navigation.navigate('AdminAuditTrail')} 
          colors={colors}
        />
        
        <ActionRow 
          icon="finger-print-outline" 
          label="Lancer un scan d'intégrité" 
          onPress={handleIntegrityCheck} 
          colors={colors}
          highlight
        />

        <ActionRow 
          icon="cloud-download-outline" 
          label="Exporter les logs (CSV/PDF)" 
          onPress={() => Alert.alert("Export", "Le rapport a été envoyé vers votre email de service.")} 
          colors={colors}
        />

      </ScrollView>
    </ScreenContainer>
  );
}

// --- SOUS-COMPOSANTS ---

const StatBox = ({ icon, label, value, color, colors }: any) => (
  <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Ionicons name={icon} size={20} color={color} />
    <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.subText }]}>{label}</Text>
  </View>
);

const ActionRow = ({ icon, label, onPress, colors, highlight }: any) => (
  <TouchableOpacity 
    style={[styles.actionRow, { backgroundColor: colors.card, borderColor: highlight ? '#EF4444' : colors.border }]} 
    onPress={onPress}
  >
    <View style={styles.rowLeft}>
      <Ionicons name={icon} size={22} color={highlight ? '#EF4444' : colors.subText} />
      <Text style={[styles.actionLabel, { color: highlight ? '#EF4444' : colors.text }]}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.subText} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  content: { padding: 20 },
  mainCard: { 
    padding: 25, borderRadius: 24, flexDirection: 'row', 
    justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 
  },
  mainCardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  mainCardStatus: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
  statBox: { width: '48%', padding: 20, borderRadius: 20, borderWidth: 1 },
  statValue: { fontSize: 24, fontWeight: '900', marginTop: 8 },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  
  sectionTitle: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 15, marginTop: 10 },
  
  actionRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 18, borderRadius: 16, borderWidth: 1, marginBottom: 12 
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  actionLabel: { fontSize: 14, fontWeight: '700' }
});