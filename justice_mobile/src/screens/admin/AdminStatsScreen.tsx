import React, { useMemo, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
  Platform, RefreshControl, TouchableOpacity
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { getAdminStats } from "../../services/admin.service";

const { width } = Dimensions.get('window');

const STATUS_LABELS: Record<string, string> = {
  'soumise': 'Soumises',
  'en_cours_OPJ': 'En cours OPJ',
  'attente_validation': 'Att. validation',
  'transmise_parquet': 'Au parquet',
  'saisi_juge': 'Saisi juge',
  'instruction': 'Instruction',
  'audience_programmée': 'Audiences',
  'jugée': 'Jugées',
  'classée_sans_suite_par_OPJ': 'Classées (OPJ)',
  'classée_sans_suite_par_procureur': 'Classées (Proc.)',
  'non_lieu': 'Non-lieu',
};

const PALETTE = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16"];

const ProgressBar = ({ label, value, total, color, colors }: any) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSub }}>{label}</Text>
        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMain }}>{value} ({pct}%)</Text>
      </View>
      <View style={{ height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 5 }} />
      </View>
    </View>
  );
};

const KpiCard = ({ icon, label, value, color, trend, colors }: any) => (
  <View style={[styles.kpiCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
    <View style={[styles.kpiIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={[styles.kpiValue, { color: colors.textMain }]}>{value}</Text>
    <Text style={[styles.kpiLabel, { color: colors.textSub }]}>{label}</Text>
    {trend && <Text style={[styles.kpiTrend, { color: trend.startsWith('+') ? '#10B981' : trend === '0' ? colors.textSub : '#EF4444' }]}>{trend}</Text>}
  </View>
);

const BarChartSimple = ({ data, colors, primaryColor }: any) => {
  const maxVal = Math.max(...data.map((d: any) => d.count || d.total || 0), 1);
  return (
    <View style={styles.barChart}>
      {data.map((item: any, i: number) => {
        const val = item.count || item.total || 0;
        const pct = Math.round((val / maxVal) * 100);
        return (
          <View key={i} style={styles.barItem}>
            <Text style={[styles.barValue, { color: colors.textMain }]}>{val}</Text>
            <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.barFill, { height: `${pct}%`, backgroundColor: PALETTE[i % PALETTE.length] }]} />
            </View>
            <Text style={[styles.barLabel, { color: colors.textSub }]} numberOfLines={1}>
              {item.month?.slice(5) || item.district?.substring(0, 4) || item.category?.substring(0, 5) || '?'}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export default function AdminStatsScreen({ navigation }: any) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['admin-global-stats'],
    queryFn: getAdminStats,
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
  };

  const raw = stats as any;
  const summary = raw?.summary || {};
  const statusStats = raw?.statusStats || [];
  const categoryStats = raw?.categoryStats || [];
  const monthlyStats = raw?.monthlyStats || [];
  const regionalStats = raw?.regionalStats || [];
  const totalComplaints = summary.complaints_total || 0;

  return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Tableau de Bord Analytique" showBack />

      <ScrollView
        style={{ backgroundColor: colors.bgMain }}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI CARDS */}
        <View style={styles.kpiRow}>
          <KpiCard icon="people" label="Utilisateurs" value={summary.users_total || 0} color="#3B82F6" colors={colors} />
          <KpiCard icon="document-text" label="Plaintes" value={totalComplaints} color="#10B981" colors={colors} />
          <KpiCard icon="briefcase" label="Affaires" value={summary.active_cases || 0} color="#8B5CF6" colors={colors} />
          <KpiCard icon="shield-checkmark" label="Logs 24h" value={summary.logs_total || 0} color="#F59E0B" colors={colors} />
        </View>

        {/* STATUT DES DOSSIERS */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="pie-chart-outline" size={20} color={primaryColor} />
            <Text style={[styles.cardTitle, { color: colors.textMain }]}>Répartition par Statut</Text>
          </View>
          {statusStats.length > 0 ? statusStats.map((item: any, i: number) => (
            <ProgressBar
              key={i}
              label={STATUS_LABELS[item.status] || item.status}
              value={parseInt(item.count) || 0}
              total={totalComplaints}
              color={PALETTE[i % PALETTE.length]}
              colors={colors}
            />
          )) : (
            <Text style={[styles.emptyText, { color: colors.textSub }]}>Aucune donnée</Text>
          )}
        </View>

        {/* TENDANCES MENSUELLES */}
        {monthlyStats.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="trending-up-outline" size={20} color="#10B981" />
              <Text style={[styles.cardTitle, { color: colors.textMain }]}>Tendances (6 mois)</Text>
            </View>
            <BarChartSimple data={monthlyStats} colors={colors} primaryColor={primaryColor} />
          </View>
        )}

        {/* TOP CATÉGORIES */}
        {categoryStats.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="list-outline" size={20} color="#EF4444" />
              <Text style={[styles.cardTitle, { color: colors.textMain }]}>Top Catégories</Text>
            </View>
            {categoryStats.slice(0, 8).map((item: any, i: number) => (
              <ProgressBar
                key={i}
                label={item.category}
                value={parseInt(item.count) || 0}
                total={totalComplaints}
                color={PALETTE[i % PALETTE.length]}
                colors={colors}
              />
            ))}
          </View>
        )}

        {/* RÉPARTITION RÉGIONALE */}
        {regionalStats.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="map-outline" size={20} color="#8B5CF6" />
              <Text style={[styles.cardTitle, { color: colors.textMain }]}>Plaintes par Région</Text>
            </View>
            <BarChartSimple data={regionalStats} colors={colors} primaryColor={primaryColor} />
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  kpiCard: { flex: 1, minWidth: '45%', padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 4 },
  kpiIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  kpiValue: { fontSize: 26, fontWeight: '900' },
  kpiLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  kpiTrend: { fontSize: 11, fontWeight: '800', marginTop: 2 },
  card: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  emptyText: { textAlign: 'center', fontSize: 13, fontWeight: '600', paddingVertical: 20 },
  barChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 160, paddingTop: 10 },
  barItem: { alignItems: 'center', flex: 1, gap: 4 },
  barValue: { fontSize: 10, fontWeight: '800' },
  barTrack: { width: 24, height: 120, borderRadius: 12, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 12 },
  barLabel: { fontSize: 8, fontWeight: '700', textTransform: 'uppercase' },
});
